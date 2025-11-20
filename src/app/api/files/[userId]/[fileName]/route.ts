/**
 * File Serving API Route
 * GET /api/files/[userId]/[fileName]
 *
 * Serves encrypted portfolio photos after decryption
 * Requires authentication and ownership verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/security/jwt';
import { listUserPortfolioPhotos } from '@/lib/db/services';
import { downloadEncryptedFile } from '@/lib/storage';
import { decryptFile } from '@/lib/security/encryption';

interface RouteParams {
  userId: string;
  fileName: string;
}

/**
 * GET - Serve a decrypted portfolio photo file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { userId, fileName } = await params;

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

    // Verify the authenticated user owns the requested file
    if (authenticatedUserId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to this file' },
        { status: 403 }
      );
    }

    // Find the photo record that matches this file
    const photos = await listUserPortfolioPhotos(userId);
    const photo = photos.find(p => {
      // Extract filename from storage location
      const storagePath = p.storageLocation;
      if (storagePath.startsWith('file://')) {
        const filePath = storagePath.replace('file://', '');
        const extractedFileName = filePath.split('/').pop();
        return extractedFileName === fileName;
      }
      return false;
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Download the encrypted file from storage
    const encryptedData = await downloadEncryptedFile(photo.storageLocation);

    // Decrypt the file
    const decryptedData = await decryptFile(encryptedData, photo.iv, photo.authTag);

    // Determine content type based on file extension
    const extension = fileName.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    if (extension === 'jpg' || extension === 'jpeg') {
      contentType = 'image/jpeg';
    } else if (extension === 'png') {
      contentType = 'image/png';
    } else if (extension === 'webp') {
      contentType = 'image/webp';
    }

    // Return the decrypted file with proper headers
    return new NextResponse(new Uint8Array(decryptedData), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': decryptedData.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('File serving error:', error);

    return NextResponse.json(
      {
        error: 'Failed to serve file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}