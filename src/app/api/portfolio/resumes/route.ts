/**
 * Portfolio Resumes API Route
 * POST/GET/DELETE /api/portfolio/resumes
 *
 * Manages user resumes (max 2 per free user)
 * Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/security/jwt';
import {
  canUploadMoreResumes,
  createResume,
  listUserResumes,
  findResumeById,
  deleteResume,
  getUserResumeCount,
} from '@/lib/db/services';
import { uploadEncryptedFile, deleteFile } from '@/lib/storage';
import { encryptFile } from '@/lib/security/encryption';
import { Resume } from '@/lib/db/schema';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'text/plain',
  'text/markdown',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST - Upload a new resume
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = verifyAccessToken(accessToken);
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check upload limit
    const canUpload = await canUploadMoreResumes(userId);
    if (!canUpload) {
      const currentCount = await getUserResumeCount(userId);
      return NextResponse.json(
        {
          error: 'Maximum 2 resumes allowed per free user',
          currentCount,
          maxAllowed: 2,
        },
        { status: 403 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('resume') as File | null;
    const aiNotes = formData.get('aiNotes') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No resume uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, DOCX, TXT, MD' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      );
    }

    // Encrypt the file
    console.log('Encrypting resume file...');
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { encryptedData, iv, authTag } = await encryptFile(fileBuffer);

    // Upload encrypted file to storage
    console.log('Uploading encrypted resume to storage...');
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'pdf';
    const storageFileName = `resume_${timestamp}.${extension}`;
    const storageLocation = await uploadEncryptedFile(encryptedData, storageFileName, userId);

    // Save to database
    const resume = await createResume({
      userId,
      resumeUrl: storageLocation,
      originalFilename: file.name,
      aiNotes: aiNotes || undefined,
      iv,
      authTag,
    });

    return NextResponse.json(
      {
        message: 'Resume uploaded successfully',
        resume: {
          id: resume.id,
          fileName: resume.originalFilename,
          uploadedAt: resume.uploadedAt,
          portfolioGenerated: resume.portfolioGenerated,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Portfolio resume upload error:', error);

    return NextResponse.json(
      {
        error: 'Failed to upload resume',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - List user's resumes
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = verifyAccessToken(accessToken);
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user's resumes
    const resumes = await listUserResumes(userId);
    const resumeCount = await getUserResumeCount(userId);

    return NextResponse.json(
      {
        resumes: resumes.map((resume: Resume) => ({
          id: resume.id,
          fileName: resume.originalFilename,
          uploadedAt: resume.uploadedAt,
          portfolioGenerated: resume.portfolioGenerated,
        })),
        count: resumeCount,
        maxAllowed: 2,
        canUploadMore: resumeCount < 2,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Portfolio resumes list error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch resumes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a resume
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = verifyAccessToken(accessToken);
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get resume ID from query params
    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get('id');

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Resume ID is required' },
        { status: 400 }
      );
    }

    // Find resume and verify ownership
    const resume = await findResumeById(resumeId);
    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    if (resume.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to this resume' },
        { status: 403 }
      );
    }

    // Check if resume has generated portfolio
    if (resume.portfolioGenerated) {
      return NextResponse.json(
        {
          error: 'Cannot delete resume that has generated a portfolio',
          message: 'Please delete the generated portfolio first',
        },
        { status: 409 }
      );
    }

    // Delete resume from database
    const deleted = await deleteResume(resumeId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete resume' },
        { status: 500 }
      );
    }

    // Delete from storage
    await deleteFile(resume.resumeUrl);

    return NextResponse.json(
      {
        message: 'Resume deleted successfully',
        resumeId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Portfolio resume deletion error:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete resume',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}