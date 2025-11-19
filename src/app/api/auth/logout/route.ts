/**
 * User Logout API Route
 * POST /api/auth/logout
 * 
 * Logs out the current user by invalidating tokens
 * 
 * Rate limiting: 10 requests per 15 minutes per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/security/jwt';

export async function POST(request: NextRequest) {
  // Rate limiting: 10 requests per 15 minutes (less strict than login/register)
  const clientId = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   request.headers.get('cf-connecting-ip') ||
                   'unknown';
  
  const rateLimitKey = `logout:${clientId}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 10;
  
  // Simple in-memory rate limiting (use Redis in production)
  const rateLimitStore = (global as any).rateLimitStore || ((global as any).rateLimitStore = new Map());
  const record = rateLimitStore.get(rateLimitKey);
  
  if (record && now < record.resetTime) {
    if (record.count >= maxRequests) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
          },
        }
      );
    }
    record.count++;
  } else {
    rateLimitStore.set(rateLimitKey, {
      count: 1,
      resetTime: now + windowMs,
    });
  }
  
  try {
    // Get access token from cookie
    const accessToken = request.cookies.get('accessToken')?.value;
    
    if (accessToken) {
      // Verify token and get user ID
      const userId = verifyAccessToken(accessToken);
      
      if (userId) {
        // TODO: Invalidate refresh token in database
        // await db.sessions.deleteByUserId(userId);
        
        // TODO: Log logout event
        // await db.auditLogs.create({
        //   userId,
        //   action: 'logout',
        //   resource: 'user',
        //   resourceId: userId,
        //   ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        //   userAgent: request.headers.get('user-agent') || 'unknown',
        // });
      }
    }
    
    // Clear cookies
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
    
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear cookies even if there's an error
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
    
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    
    return response;
  }
}
