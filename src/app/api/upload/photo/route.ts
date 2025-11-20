/**
 * Profile Photo Upload API Route
 * POST /api/upload/photo
 * 
 * Uploads and encrypts a profile photo
 * Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/security/jwt';
import { encryptFile } from '@/lib/security/encryption';
import { uploadEncryptedFile, generatePresignedDownloadUrl } from '@/lib/storage';
import { createPortfolioPhoto, canUploadMorePhotos, listUserPortfolioPhotos } from '@/lib/db/services';

// Rate limit: 10 uploads per hour
// TODO: Apply rate limiting middleware

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
    
    // Check if user can upload more photos (max 3)
    const canUpload = await canUploadMorePhotos(userId);
    if (!canUpload) {
      return NextResponse.json(
        { error: 'Maximum photo limit reached. Free users can upload up to 3 photos.' },
        { status: 403 }
      );
    }
    
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
        { status: 400 }
      );
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 5MB' },
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
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `photo_${timestamp}.${extension}.enc`;
    
    // Upload to storage
    const storageLocation = await uploadEncryptedFile(
      encryptedData,
      fileName,
      userId
    );
    
    // Generate a public URL for display
    let publicUrl: string;
    if (storageLocation.startsWith('file://')) {
      // For local storage, create a public URL that serves the file
      publicUrl = `/api/files/${userId}/${fileName}`;
    } else {
      // For S3, generate a presigned URL
      publicUrl = await generatePresignedDownloadUrl(storageLocation, 3600); // 1 hour expiry
    }
    
    // Save to database using new services
    const photo = await createPortfolioPhoto({
      userId,
      photoUrl: publicUrl,
      storageLocation,
      iv,
      authTag,
    });
    
    return NextResponse.json(
      {
        message: 'Photo uploaded and encrypted successfully',
        photo: {
          id: photo.id,
          fileName: file.name,
          uploadedAt: photo.uploadedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Photo upload error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/photo
 * Get user's portfolio photos
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
    
    // Fetch photos from database
    const photos = await listUserPortfolioPhotos(userId);
    
    return NextResponse.json(
      { photos },
      { status: 200 }
    );
  } catch (error) {
    console.error('Photo fetch error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
