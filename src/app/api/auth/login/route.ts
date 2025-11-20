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
  console.log('=== LOGIN API CALLED WITH IMPORTS ===');

  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    console.log('Parsed request:', { email, hasPassword: !!password });

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required', code: 'MISSING_CREDENTIALS' },
        { status: 400 }
      );
    }

    // Find user by email
    console.log('Looking up user by email:', email);
    const user = await findUserByEmail(email);
    console.log('User lookup result:', { found: !!user, userId: user?.id });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // Verify password
    console.log('Verifying password for user:', user.id);
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Account setup incomplete', code: 'ACCOUNT_INCOMPLETE' },
        { status: 400 }
      );
    }
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    console.log('Password verification result:', isValidPassword);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // Update user's last login
    console.log('Updating user last login...');
    await updateUserLastLogin(user.id);

    // Create tokens
    console.log('Creating JWT tokens...');
    const accessToken = createAccessToken(user.id, user.email, user.role || undefined);
    const refreshToken = createRefreshToken(user.id);

    // Hash the refresh token for storage
    console.log('Hashing refresh token for session storage...');
    const refreshTokenHash = await hashToken(refreshToken);

    // Create user session
    console.log('Creating user session...');
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7); // 7 days

    await createUserSession({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: sessionExpiresAt,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Create audit log
    console.log('Creating audit log...');
    await createAuditLog({
      userId: user.id,
      action: 'login',
      resource: 'auth',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      details: { email: user.email },
    });

    // Create response with cookies
    console.log('Setting authentication cookies...');
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Set httpOnly cookies
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

    console.log('Login completed successfully');
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Invalid request format', code: 'INVALID_REQUEST' },
      { status: 400 }
    );
  }
}
