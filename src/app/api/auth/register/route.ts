/**
 * User Registration API Route
 * POST /api/auth/register
 * 
 * Registers a new user with email and password
 * Requires email verification before account activation
 * 
 * Rate limiting: 5 requests per 15 minutes per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAccessToken, createRefreshToken } from '@/lib/security/jwt';
import { hashPassword, hashToken } from '@/lib/security/auth';
import { createUser, findUserByEmail, createUserSession, createAuditLog } from '@/lib/db/services';

interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export async function POST(request: NextRequest) {
  // Rate limiting: 5 requests per 15 minutes
  const clientId = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   request.headers.get('cf-connecting-ip') ||
                   'unknown';
  
  const rateLimitKey = `register:${clientId}`;
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
    const body: RegisterRequest = await request.json();
    
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
    
    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Validate password strength (min 5 chars for simplicity)
    if (body.password.length < 5) {
      return NextResponse.json(
        { 
          error: 'Password must be at least 5 characters' 
        },
        { status: 400 }
      );
    }
    
    // Check if user already exists in database
    const existingUser = await findUserByEmail(body.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }
    
    // Hash password
    const passwordHash = await hashPassword(body.password);
    
    // Create user in database
    const user = await createUser({
      email: body.email,
      passwordHash,
      name: body.name,
      role: 'user',
      emailVerified: false,
      isActive: true,
    });
    
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
    
    // Set HTTP-only cookies
    const response = NextResponse.json(
      {
        message: 'User registered successfully. Please check your email to verify your account.',
        user: {
          id: userId,
          email: email,
          name: user.name,
          emailVerified: user.emailVerified,
        },
      },
      { status: 201 }
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
    
    // Log audit event
    await createAuditLog({
      userId,
      action: 'user_registered',
      resource: 'user',
      resourceId: userId,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { email: user.email },
    });
    
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
