/**
 * Resume Upload API Route
 * POST /api/upload/resume
 * 
 * Uploads and encrypts a resume file
 * Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/security/jwt';
import { encryptFile } from '@/lib/security/encryption';
import { uploadEncryptedFile } from '@/lib/storage';
import { Resume } from '@/lib/db/schema';
import { canUploadMoreResumes, createResume, listUserResumes } from '@/lib/db/services';

// Rate limit: 10 uploads per hour
// TODO: Apply rate limiting middleware

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'text/plain',
  'text/markdown',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
    
    // Check if user can upload more resumes (max 2 for free users)
    const canUpload = await canUploadMoreResumes(userId);
    if (!canUpload) {
      return NextResponse.json(
        { error: 'Maximum resume limit reached. Free users can upload up to 2 resumes.' },
        { status: 403 }
      );
    }
    
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('resume') as File | null;
    const aiNotes = formData.get('aiNotes') as string | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
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
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    
    // Encrypt file
    const { encryptedData, iv, authTag } = encryptFile(fileBuffer);
    
    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'bin';
    const fileName = `resume_${timestamp}.${extension}.enc`;
    
    // Upload to storage
    const storageLocation = await uploadEncryptedFile(
      encryptedData,
      fileName,
      userId
    );
    
    // Save to database using new services
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
        message: 'Resume uploaded and encrypted successfully',
        resume: {
          id: resume.id,
          fileName: resume.originalFilename,
          uploadedAt: resume.uploadedAt.toISOString(),
          portfolioGenerated: resume.portfolioGenerated,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Resume upload error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/resume
 * List user's uploaded resumes
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
    
    // Fetch resumes from database
    const resumes = await listUserResumes(userId);
    
    return NextResponse.json(
      { resumes },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resume list error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
