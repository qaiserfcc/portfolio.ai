/**
 * Dashboard summary API
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/security/jwt';
import { getDashboardSummary } from '@/lib/dashboard/getDashboardSummary';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = verifyAccessToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // For demo purposes, return mock data
    if (userId === 'demo-user-id') {
      return NextResponse.json({
        user: {
          id: 'demo-user-id',
          name: 'Demo User',
          email: 'demo@example.com',
          role: 'superuser',
        },
        stats: {
          resumeCount: 0,
          photoCount: 0,
          portfolioCount: 0,
          lastGeneratedAt: null,
        },
        limits: {
          maxResumes: 10,
          maxPhotos: 9,
          canUploadMoreResumes: true,
          canUploadMorePhotos: true,
        },
        metadata: {
          showFamilyLink: true,
        },
        resumes: [],
        photos: [],
        portfolios: [],
      }, { status: 200 });
    }

    const summary = await getDashboardSummary(userId);
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
