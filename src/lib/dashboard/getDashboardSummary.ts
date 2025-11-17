/**
 * Dashboard summary aggregation helpers
 */

import {
  findUserById,
  listUserResumes,
  listUserPortfolioPhotos,
  listUserGeneratedPortfolios,
  canUploadMoreResumes,
  canUploadMorePhotos,
} from '@/lib/db/services';
import {
  DashboardSummary,
  DashboardResumeSummary,
  DashboardPhotoSummary,
  DashboardPortfolioSummary,
} from '@/types/dashboard';

const DEFAULT_LIMITS = {
  user: { resumes: 2, photos: 3 },
  premium: { resumes: 10, photos: 9 },
  admin: { resumes: 10, photos: 9 },
  superuser: { resumes: 10, photos: 9 },
};

function resolveLimits(role: string | null | undefined) {
  const normalized = (role || 'user').toLowerCase() as keyof typeof DEFAULT_LIMITS;
  return DEFAULT_LIMITS[normalized] || DEFAULT_LIMITS.user;
}

export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const [resumes, photos, portfolios, canUploadResumes, canUploadPhotos] = await Promise.all([
    listUserResumes(userId),
    listUserPortfolioPhotos(userId),
    listUserGeneratedPortfolios(userId),
    canUploadMoreResumes(userId, user.role || 'user'),
    canUploadMorePhotos(userId),
  ]);

  const limits = resolveLimits(user.role);

  const resumeSummaries: DashboardResumeSummary[] = resumes.map((resume) => ({
    id: resume.id,
    userId: resume.userId,
    originalFilename: resume.originalFilename,
    uploadedAt: resume.uploadedAt instanceof Date ? resume.uploadedAt.toISOString() : new Date(resume.uploadedAt).toISOString(),
    portfolioGenerated: !!resume.portfolioGenerated,
    aiNotes: resume.aiNotes || null,
    publicUrl: resume.portfolioGenerated
      ? `/portfolio/${resume.userId}/${resume.id}/home`
      : null,
  }));

  const photoSummaries: DashboardPhotoSummary[] = photos.map((photo) => ({
    id: photo.id,
    photoUrl: photo.photoUrl,
    uploadedAt: photo.uploadedAt instanceof Date ? photo.uploadedAt.toISOString() : new Date(photo.uploadedAt).toISOString(),
  }));

  const portfolioSummaries: DashboardPortfolioSummary[] = portfolios.map((portfolio) => ({
    id: portfolio.id,
    resumeId: portfolio.resumeId,
    generatedAt:
      portfolio.generatedAt instanceof Date
        ? portfolio.generatedAt.toISOString()
        : new Date(portfolio.generatedAt).toISOString(),
    publicUrl: `/portfolio/${portfolio.userId}/${portfolio.resumeId}/home`,
  }));

  portfolioSummaries.sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1));

  return {
    user: {
      id: user.id,
      name: user.name ?? null,
      email: user.email,
      role: user.role ?? null,
    },
    stats: {
      resumeCount: resumeSummaries.length,
      photoCount: photoSummaries.length,
      portfolioCount: portfolioSummaries.length,
      lastGeneratedAt: portfolioSummaries[0]?.generatedAt || null,
    },
    limits: {
      maxResumes: limits.resumes,
      maxPhotos: limits.photos,
      canUploadMoreResumes: canUploadResumes,
      canUploadMorePhotos: canUploadPhotos,
    },
    metadata: {
      showFamilyLink: ['admin', 'superuser'].includes((user.role || '').toLowerCase()),
    },
    resumes: resumeSummaries,
    photos: photoSummaries,
    portfolios: portfolioSummaries,
  };
}
