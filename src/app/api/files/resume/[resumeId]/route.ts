/**
 * Resume File Serving API Route
 * GET /api/files/resume/[resumeId]
 *
 * Serves encrypted resume files after decryption
 * Requires authentication and ownership verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/security/jwt';
import { findResumeById } from '@/lib/db/services';
import { downloadEncryptedFile } from '@/lib/storage';
import { decryptFile } from '@/lib/security/encryption';

interface RouteParams {
  resumeId: string;
}

/**
 * GET - Serve a decrypted resume file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { resumeId } = await params;

    // Verify authentication
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const authenticatedUserId = verifyAccessToken(accessToken);
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Find the resume record
    const resume = await findResumeById(resumeId);
    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Verify the authenticated user owns the resume
    if (resume.userId !== authenticatedUserId) {
      return NextResponse.json(
        { error: 'Unauthorized access to this resume' },
        { status: 403 }
      );
    }

    // Download the encrypted file from storage
    const encryptedData = await downloadEncryptedFile(resume.resumeUrl);

    // Decrypt the file if encryption metadata exists
    let decryptedData: Buffer;
    if (resume.iv && resume.authTag) {
      decryptedData = await decryptFile(encryptedData, resume.iv, resume.authTag);
    } else {
      // Fallback for resumes uploaded before encryption was added
      decryptedData = encryptedData;
    }

    // Determine content type based on file extension
    const extension = resume.originalFilename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    if (extension === 'pdf') {
      contentType = 'application/pdf';
    } else if (extension === 'docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (extension === 'txt') {
      contentType = 'text/plain';
    } else if (extension === 'md') {
      contentType = 'text/markdown';
    }

    // Return the decrypted file with proper headers
    return new NextResponse(new Uint8Array(decryptedData), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': decryptedData.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Disposition': `inline; filename="${resume.originalFilename}"`,
      },
    });

  } catch (error) {
    console.error('Resume file serving error:', error);

    return NextResponse.json(
      {
        error: 'Failed to serve resume file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}