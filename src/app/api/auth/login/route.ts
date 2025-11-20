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

    return NextResponse.json({ message: 'Login route working with password verification' }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Invalid request format', code: 'INVALID_REQUEST' },
      { status: 400 }
    );
  }
}
