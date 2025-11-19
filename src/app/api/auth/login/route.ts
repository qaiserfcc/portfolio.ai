/**
 * User Login API Route
 * POST /api/auth/login
 * 
 * Authenticates user with email and password
 * Returns access and refresh tokens
 * 
 * Rate limiting: 5 requests per 15 minutes per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAccessToken, createRefreshToken } from '@/lib/security/jwt';
import { verifyPassword, hashToken } from '@/lib/security/auth';
import { findUserByEmail, updateUserLastLogin, createUserSession, createAuditLog } from '@/lib/db/services';

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  // Rate limiting: 5 requests per 15 minutes
  const clientId = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   request.headers.get('cf-connecting-ip') ||
                   'unknown';
  
  const rateLimitKey = `login:${clientId}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5;
  
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
    const body: LoginRequest = await request.json();
    
    // Validation
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }
    
    // Fetch user from database
    const user = await findUserByEmail(body.email);
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(body.password, user.passwordHash);
    if (!isValidPassword) {
      // Log failed login attempt
      await createAuditLog({
        userId: user.id,
        action: 'login_failed',
        resource: 'user',
        resourceId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { email: body.email },
      });
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }
    
    // Check if email is verified (if required)
    if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.emailVerified) {
      return NextResponse.json(
        { error: 'Email not verified. Please check your email.' },
        { status: 403 }
      );
    }
    
    // Use actual user data from database
    const userId = user.id;
    const email = user.email;
    const role = user.role;
    
    // Generate tokens
    const accessToken = createAccessToken(userId, email, role);
    const refreshToken = createRefreshToken(userId);
    
    // Store refresh token in database
    await createUserSession({
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });
    
    // Update last login timestamp
    await updateUserLastLogin(userId);
    
    // Set HTTP-only cookies
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: userId,
          email: email,
          name: user.name,
          emailVerified: user.emailVerified,
        },
      },
      { status: 200 }
    );
    
    // Set secure cookies
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/',
    });
    
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 604800, // 7 days
      path: '/',
    });
    
    // Log successful login
    await createAuditLog({
      userId,
      action: 'login_success',
      resource: 'user',
      resourceId: userId,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { email: user.email },
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
