// Users table (already exists in the system)
export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name?: string;
  profilePhotoUrl?: string;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

// User Sessions (for refresh token storage)
export interface UserSession {
  id: string;
  userId: string;
  tokenHash: string; // Hashed refresh token
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastUsedAt?: Date;
}

// Audit Logs (security and compliance logging)
export interface AuditLog {
  id: string;
  userId?: string; // Optional - for anonymous events
  action: string; // e.g., 'login_success', 'login_failed', 'user_created'
  resource: string; // e.g., 'user', 'resume', 'photo'
  resourceId?: string; // ID of the affected resource
  ipAddress?: string;
  userAgent?: string;
  details?: string; // Additional JSON details
  createdAt: Date;
}

// User Portfolio Photos (max 3 per user)
export interface UserPortfolioPhoto {
  id: string;
  userId: string;
  photoUrl: string; // Public URL for display
  storageLocation: string; // Internal storage location (file:// or s3://)
  iv: string; // Initialization vector for decryption (hex)
  authTag: string; // Authentication tag for decryption (hex)
  uploadedAt: Date;
}

// Resumes
export interface Resume {
  id: string;
  userId: string;
  resumeUrl: string;
  originalFilename: string;
  uploadedAt: Date;
  aiNotes?: string; // rich text box content
  portfolioGenerated: boolean;
  iv?: string; // Initialization vector for decryption (hex)
  authTag?: string; // Authentication tag for decryption (hex)
}

// Generated Portfolio (one per resume)
export interface GeneratedPortfolio {
  id: string;
  resumeId: string;
  userId: string;
  themeId?: string;
  generatedAt: Date;
}

// Portfolio Theme (random gradient per generation)
export interface PortfolioTheme {
  id: string;
  portfolioId: string;
  gradientCss: string;
  createdAt: Date;
}

// Portfolio Pages (4 pages per portfolio)
export type PageType = 'home' | 'about' | 'portfolio' | 'contact';

export interface PortfolioPage {
  id: string;
  portfolioId: string;
  pageType: PageType;
  title: string;
  content: string; // AI generated detailed content (JSON or HTML)
  publicUrl: string;
  createdAt: Date;
}