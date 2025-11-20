/**
 * Storage utilities for file uploads (S3/GCS)
 * Handles encrypted file storage with presigned URLs
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';

interface StorageConfig {
  provider: 's3' | 'gcs' | 'local';
  bucket: string;
  region?: string;
  localPath?: string;
}

/**
 * Get storage configuration from environment
 */
function getStorageConfig(): StorageConfig {
  const provider = (process.env.STORAGE_PROVIDER || 'local') as 's3' | 'gcs' | 'local';
  const bucket = process.env.S3_BUCKET;
  
  if (provider === 's3' && !bucket) {
    throw new Error('S3_BUCKET environment variable not configured');
  }
  
  return {
    provider,
    bucket: bucket || 'local-bucket',
    region: process.env.S3_REGION || 'us-east-1',
    localPath: process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'uploads'),
  };
}

/**
 * Get S3 client instance
 */
function getS3Client(): S3Client {
  const config = getStorageConfig();
  
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
}

/**
 * Ensure local storage directory exists
 */
function ensureLocalDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Upload encrypted file to storage
 * @param encryptedData - Encrypted file buffer
 * @param fileName - File name in storage
 * @param userId - User ID for organizing files
 * @returns Storage location URL
 */
export async function uploadEncryptedFile(
  encryptedData: Buffer,
  fileName: string,
  userId: string
): Promise<string> {
  const config = getStorageConfig();
  
  if (config.provider === 'local') {
    const userDir = path.join(config.localPath!, userId);
    const fileDir = path.join(userDir, 'files');
    ensureLocalDirectory(fileDir);
    
    const filePath = path.join(fileDir, fileName);
    fs.writeFileSync(filePath, encryptedData);
    
    return `file://${filePath}`;
  } else {
    // S3 upload
    const key = `users/${userId}/files/${fileName}`;
    
    const client = getS3Client();
    
    await client.send(new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: encryptedData,
      ServerSideEncryption: 'AES256', // Additional layer of encryption
      ContentType: 'application/octet-stream', // Encrypted files
    }));
    
    return `s3://${config.bucket}/${key}`;
  }
}

/**
 * Download encrypted file from storage
 * @param location - Storage location URL
 * @returns Encrypted file buffer
 */
export async function downloadEncryptedFile(
  location: string
): Promise<Buffer> {
  const config = getStorageConfig();
  
  if (config.provider === 'local') {
    const url = new URL(location);
    const filePath = url.pathname;
    
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    
    return fs.readFileSync(filePath);
  } else {
    // S3 download
    const url = new URL(location);
    const bucket = url.hostname.split('.')[0];
    const key = url.pathname.slice(1);
    
    const client = getS3Client();
    const response = await client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }));
    
    if (!response.Body) {
      throw new Error('File not found');
    }
    
    const chunks = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}

/**
 * Delete file from storage
 * @param location - Storage location URL
 */
export async function deleteFile(location: string): Promise<void> {
  const config = getStorageConfig();
  
  if (config.provider === 'local') {
    const url = new URL(location);
    const filePath = url.pathname;
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } else {
    // S3 delete
    const url = new URL(location);
    const bucket = url.hostname.split('.')[0];
    const key = url.pathname.slice(1);
    
    const client = getS3Client();
    await client.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }));
  }
}

/**
 * Generate presigned URL for direct upload (client-side)
 * @param fileName - File name
 * @param userId - User ID
 * @param expiresIn - Expiration time in seconds
 * @returns Presigned URL and upload details
 */
export async function generatePresignedUploadUrl(
  fileName: string,
  userId: string,
  expiresIn: number = 3600
): Promise<{
  url: string;
  fields: Record<string, string>;
}> {
  const config = getStorageConfig();
  
  if (config.provider === 'local') {
    throw new Error('Presigned URLs not supported for local storage');
  }
  
  const key = `users/${userId}/temp/${fileName}`;
  
  const client = getS3Client();
  
  const { url, fields } = await createPresignedPost(client, {
    Bucket: config.bucket,
    Key: key,
    Conditions: [
      ['content-length-range', 0, 10485760], // 10MB max
    ],
    Expires: expiresIn,
  });
  
  return { url, fields };
}

/**
 * Generate presigned URL for download
 * @param location - Storage location URL
 * @param expiresIn - Expiration time in seconds
 * @returns Presigned download URL
 */
export async function generatePresignedDownloadUrl(
  location: string,
  expiresIn: number = 3600
): Promise<string> {
  const config = getStorageConfig();
  
  if (config.provider === 'local') {
    throw new Error('Presigned URLs not supported for local storage');
  }
  
  const url = new URL(location);
  const bucket = url.hostname.split('.')[0];
  const key = url.pathname.slice(1);
  
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  
  return getSignedUrl(client, command, { expiresIn });
}
