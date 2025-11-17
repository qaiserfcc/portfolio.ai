export interface DashboardResumeSummary {
  id: string;
  userId: string;
  originalFilename: string;
  uploadedAt: string;
  portfolioGenerated: boolean;
  aiNotes?: string | null;
  publicUrl: string | null;
}

export interface DashboardPhotoSummary {
  id: string;
  photoUrl: string;
  uploadedAt: string;
}

export interface DashboardPortfolioSummary {
  id: string;
  resumeId: string;
  generatedAt: string;
  publicUrl: string;
}

export interface DashboardSummary {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string | null;
  };
  stats: {
    resumeCount: number;
    photoCount: number;
    portfolioCount: number;
    lastGeneratedAt: string | null;
  };
  limits: {
    maxResumes: number;
    maxPhotos: number;
    canUploadMoreResumes: boolean;
    canUploadMorePhotos: boolean;
  };
  metadata: {
    showFamilyLink: boolean;
  };
  resumes: DashboardResumeSummary[];
  photos: DashboardPhotoSummary[];
  portfolios: DashboardPortfolioSummary[];
}
