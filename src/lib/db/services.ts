/**
 * Database Service Layer
 * 
 * Provides comprehensive CRUD operations for all database tables:
 * - users
 * - user_portfolio_photos (max 3 per user)
 * - resumes (max 2 per free user)
 * - generated_portfolios
 * - portfolio_themes
 * - portfolio_pages
 * 
 * Features:
 * - Type-safe operations with TypeScript
 * - Transaction support for complex operations
 * - Validation functions for user limits
 * - Error handling and logging
 * - Automatic ID generation using crypto.randomUUID()
 */

import { PoolClient } from 'pg';
import { query, getClient } from './connection';
import {
  User,
  UserPortfolioPhoto,
  Resume,
  GeneratedPortfolio,
  PortfolioTheme,
  PortfolioPage,
  PageType,
  UserSession,
  AuditLog,
} from './schema';

// ============================================================================
// USER SERVICES
// ============================================================================

/**
 * Create a new user
 */
export async function createUser(data: {
  email: string;
  passwordHash?: string;
  name?: string;
  profilePhotoUrl?: string;
  role?: string;
  emailVerified?: boolean;
  isActive?: boolean;
}): Promise<User> {
  const id = crypto.randomUUID();
  const now = new Date();

  const rows = await query<User>(
    `INSERT INTO users (
      id, email, password_hash, name, profile_photo_url, role, 
      email_verified, is_active, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      id,
      data.email,
      data.passwordHash || null,
      data.name || null,
      data.profilePhotoUrl || null,
      data.role || 'user',
      data.emailVerified !== undefined ? data.emailVerified : false,
      data.isActive !== undefined ? data.isActive : true,
      now,
    ]
  );

  return rows[0];
}

/**
 * Find user by ID
 */
export async function findUserById(userId: string): Promise<User | null> {
  const rows = await query<User>(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );
  return rows[0] || null;
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const rows = await query<User>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
}

/**
 * Update user
 */
export async function updateUser(
  userId: string,
  data: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<User | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    values.push(data.email);
  }
  if (data.passwordHash !== undefined) {
    fields.push(`password_hash = $${paramIndex++}`);
    values.push(data.passwordHash);
  }
  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.profilePhotoUrl !== undefined) {
    fields.push(`profile_photo_url = $${paramIndex++}`);
    values.push(data.profilePhotoUrl);
  }
  if (data.role !== undefined) {
    fields.push(`role = $${paramIndex++}`);
    values.push(data.role);
  }
  if (data.emailVerified !== undefined) {
    fields.push(`email_verified = $${paramIndex++}`);
    values.push(data.emailVerified);
  }
  if (data.isActive !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    values.push(data.isActive);
  }
  if (data.lastLoginAt !== undefined) {
    fields.push(`last_login_at = $${paramIndex++}`);
    values.push(data.lastLoginAt);
  }

  if (fields.length === 0) {
    return findUserById(userId);
  }

  values.push(userId);

  const rows = await query<User>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return rows[0] || null;
}

/**
 * Delete user (soft delete by setting isActive to false)
 */
export async function deleteUser(userId: string): Promise<boolean> {
  const rows = await query(
    'UPDATE users SET is_active = false WHERE id = $1',
    [userId]
  );
  return rows.length > 0;
}

/**
 * Update user last login timestamp
 */
export async function updateUserLastLogin(userId: string): Promise<void> {
  await query(
    'UPDATE users SET last_login_at = $1 WHERE id = $2',
    [new Date(), userId]
  );
}

/**
 * List all active users
 */
export async function listUsers(options?: {
  limit?: number;
  offset?: number;
  role?: string;
}): Promise<User[]> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  let sql = 'SELECT * FROM users WHERE is_active = true';
  const params: any[] = [];

  if (options?.role) {
    sql += ' AND role = $1';
    params.push(options.role);
  }

  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  return query<User>(sql, params);
}

// ============================================================================
// USER SESSION SERVICES
// ============================================================================

/**
 * Create a new user session
 */
export async function createUserSession(data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}): Promise<UserSession> {
  const id = crypto.randomUUID();
  const now = new Date();

  const rows = await query<UserSession>(
    `INSERT INTO user_sessions (
      id, user_id, token_hash, expires_at, ip_address, user_agent, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      id,
      data.userId,
      data.tokenHash,
      data.expiresAt,
      data.ipAddress || null,
      data.userAgent || null,
      now,
    ]
  );

  return rows[0];
}

/**
 * Find session by token hash
 */
export async function findUserSessionByTokenHash(
  tokenHash: string
): Promise<UserSession | null> {
  const rows = await query<UserSession>(
    'SELECT * FROM user_sessions WHERE token_hash = $1 AND expires_at > NOW()',
    [tokenHash]
  );
  return rows[0] || null;
}

/**
 * Update session last used timestamp
 */
export async function updateSessionLastUsed(sessionId: string): Promise<void> {
  await query(
    'UPDATE user_sessions SET last_used_at = NOW() WHERE id = $1',
    [sessionId]
  );
}

/**
 * Delete session by token hash
 */
export async function deleteUserSessionByTokenHash(tokenHash: string): Promise<boolean> {
  const rows = await query(
    'DELETE FROM user_sessions WHERE token_hash = $1',
    [tokenHash]
  );
  return rows.length > 0;
}

/**
 * Delete all expired sessions
 */
export async function deleteExpiredSessions(): Promise<number> {
  const result = await query(
    'DELETE FROM user_sessions WHERE expires_at < NOW()'
  );
  return result.length;
}

/**
 * Delete all sessions for a user
 */
export async function deleteAllUserSessions(userId: string): Promise<number> {
  const result = await query(
    'DELETE FROM user_sessions WHERE user_id = $1',
    [userId]
  );
  return result.length;
}

// ============================================================================
// AUDIT LOG SERVICES
// ============================================================================

/**
 * Create a new audit log entry
 */
export async function createAuditLog(data: {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}): Promise<AuditLog> {
  const id = crypto.randomUUID();
  const now = new Date();

  const rows = await query<AuditLog>(
    `INSERT INTO audit_logs (
      id, user_id, action, resource, resource_id, ip_address, user_agent, details, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      id,
      data.userId || null,
      data.action,
      data.resource,
      data.resourceId || null,
      data.ipAddress || null,
      data.userAgent || null,
      data.details ? JSON.stringify(data.details) : null,
      now,
    ]
  );

  return rows[0];
}

/**
 * Query audit logs with optional filters
 */
export async function queryAuditLogs(filters: {
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<AuditLog[]> {
  let queryStr = 'SELECT * FROM audit_logs WHERE 1=1';
  const values: any[] = [];
  let paramIndex = 1;

  if (filters.userId) {
    queryStr += ` AND user_id = $${paramIndex++}`;
    values.push(filters.userId);
  }

  if (filters.action) {
    queryStr += ` AND action = $${paramIndex++}`;
    values.push(filters.action);
  }

  if (filters.resource) {
    queryStr += ` AND resource = $${paramIndex++}`;
    values.push(filters.resource);
  }

  if (filters.resourceId) {
    queryStr += ` AND resource_id = $${paramIndex++}`;
    values.push(filters.resourceId);
  }

  if (filters.startDate) {
    queryStr += ` AND created_at >= $${paramIndex++}`;
    values.push(filters.startDate);
  }

  if (filters.endDate) {
    queryStr += ` AND created_at <= $${paramIndex++}`;
    values.push(filters.endDate);
  }

  queryStr += ' ORDER BY created_at DESC';

  if (filters.limit) {
    queryStr += ` LIMIT $${paramIndex++}`;
    values.push(filters.limit);
  }

  if (filters.offset) {
    queryStr += ` OFFSET $${paramIndex++}`;
    values.push(filters.offset);
  }

  return query<AuditLog>(queryStr, values);
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<AuditLog[]> {
  return queryAuditLogs({ userId, limit, offset });
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(
  resource: string,
  resourceId: string,
  limit: number = 50,
  offset: number = 0
): Promise<AuditLog[]> {
  return queryAuditLogs({ resource, resourceId, limit, offset });
}

/**
 * Get recent audit logs (last 24 hours)
 */
export async function getRecentAuditLogs(
  limit: number = 100
): Promise<AuditLog[]> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return queryAuditLogs({ startDate: yesterday, limit });
}

/**
 * Delete old audit logs (for retention policy)
 */
export async function deleteOldAuditLogs(
  olderThanDays: number = 90
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await query(
    'DELETE FROM audit_logs WHERE created_at < $1',
    [cutoffDate]
  );

  return result.length;
}

// ============================================================================
// USER PORTFOLIO PHOTOS SERVICES
// ============================================================================

/**
 * Check if user can upload more photos (max 3)
 */
export async function canUploadMorePhotos(userId: string): Promise<boolean> {
  const rows = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM user_portfolio_photos WHERE user_id = $1',
    [userId]
  );
  const count = parseInt(rows[0]?.count || '0', 10);
  return count < 3;
}

/**
 * Get count of user's portfolio photos
 */
export async function getUserPhotoCount(userId: string): Promise<number> {
  const rows = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM user_portfolio_photos WHERE user_id = $1',
    [userId]
  );
  return parseInt(rows[0]?.count || '0', 10);
}

/**
 * Create a new portfolio photo
 */
export async function createPortfolioPhoto(data: {
  userId: string;
  photoUrl: string;
}): Promise<UserPortfolioPhoto> {
  // Check limit before creating
  const canUpload = await canUploadMorePhotos(data.userId);
  if (!canUpload) {
    throw new Error('Maximum 3 portfolio photos allowed per user');
  }

  const id = crypto.randomUUID();
  const now = new Date();

  const rows = await query<UserPortfolioPhoto>(
    `INSERT INTO user_portfolio_photos (id, user_id, photo_url, uploaded_at)
    VALUES ($1, $2, $3, $4)
    RETURNING *`,
    [id, data.userId, data.photoUrl, now]
  );

  return rows[0];
}

/**
 * Find portfolio photo by ID
 */
export async function findPortfolioPhotoById(
  photoId: string
): Promise<UserPortfolioPhoto | null> {
  const rows = await query<UserPortfolioPhoto>(
    'SELECT * FROM user_portfolio_photos WHERE id = $1',
    [photoId]
  );
  return rows[0] || null;
}

/**
 * List user's portfolio photos
 */
export async function listUserPortfolioPhotos(
  userId: string
): Promise<UserPortfolioPhoto[]> {
  return query<UserPortfolioPhoto>(
    'SELECT * FROM user_portfolio_photos WHERE user_id = $1 ORDER BY uploaded_at DESC',
    [userId]
  );
}

/**
 * Delete portfolio photo
 */
export async function deletePortfolioPhoto(photoId: string): Promise<boolean> {
  const rows = await query(
    'DELETE FROM user_portfolio_photos WHERE id = $1',
    [photoId]
  );
  return rows.length > 0;
}

/**
 * Delete all portfolio photos for a user
 */
export async function deleteAllUserPortfolioPhotos(
  userId: string
): Promise<number> {
  const result = await query(
    'DELETE FROM user_portfolio_photos WHERE user_id = $1',
    [userId]
  );
  return result.length;
}

// ============================================================================
// RESUME SERVICES
// ============================================================================

/**
 * Check if user can upload more resumes (max 2 for free users)
 */
export async function canUploadMoreResumes(
  userId: string,
  userRole: string = 'user'
): Promise<boolean> {
  // Premium users might have unlimited, but for now enforce limit
  const maxResumes = userRole === 'premium' ? 10 : 2;

  const rows = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM resumes WHERE user_id = $1',
    [userId]
  );
  const count = parseInt(rows[0]?.count || '0', 10);
  return count < maxResumes;
}

/**
 * Get count of user's resumes
 */
export async function getUserResumeCount(userId: string): Promise<number> {
  const rows = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM resumes WHERE user_id = $1',
    [userId]
  );
  return parseInt(rows[0]?.count || '0', 10);
}

/**
 * Create a new resume
 */
export async function createResume(data: {
  userId: string;
  resumeUrl: string;
  originalFilename: string;
  aiNotes?: string;
  format?: string;
  storedLocation?: string;
  encryptionIv?: string;
  authTag?: string;
  retentionUntil?: Date;
  parsed?: any;
}): Promise<Resume> {
  const id = crypto.randomUUID();
  const now = new Date();

  const rows = await query<Resume>(
    `INSERT INTO resumes (
      id, user_id, resume_url, original_filename, uploaded_at, 
      ai_notes, portfolio_generated, file_name, format, stored_location,
      encryption_iv, auth_tag, retention_until, parsed
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      id,
      data.userId,
      data.resumeUrl,
      data.originalFilename,
      now,
      data.aiNotes || null,
      false, // portfolio_generated
      data.originalFilename, // fileName (legacy)
      data.format || null,
      data.storedLocation || null,
      data.encryptionIv || null,
      data.authTag || null,
      data.retentionUntil || null,
      data.parsed ? JSON.stringify(data.parsed) : null,
    ]
  );

  return rows[0];
}

/**
 * Find resume by ID
 */
export async function findResumeById(resumeId: string): Promise<Resume | null> {
  const rows = await query<Resume>(
    'SELECT * FROM resumes WHERE id = $1',
    [resumeId]
  );
  return rows[0] || null;
}

/**
 * List user's resumes
 */
export async function listUserResumes(userId: string): Promise<Resume[]> {
  return query<Resume>(
    'SELECT * FROM resumes WHERE user_id = $1 ORDER BY uploaded_at DESC',
    [userId]
  );
}

/**
 * Update resume
 */
export async function updateResume(
  resumeId: string,
  data: Partial<Omit<Resume, 'id' | 'userId' | 'uploadedAt'>>
): Promise<Resume | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.resumeUrl !== undefined) {
    fields.push(`resume_url = $${paramIndex++}`);
    values.push(data.resumeUrl);
  }
  if (data.originalFilename !== undefined) {
    fields.push(`original_filename = $${paramIndex++}`);
    values.push(data.originalFilename);
  }
  if (data.aiNotes !== undefined) {
    fields.push(`ai_notes = $${paramIndex++}`);
    values.push(data.aiNotes);
  }
  if (data.portfolioGenerated !== undefined) {
    fields.push(`portfolio_generated = $${paramIndex++}`);
    values.push(data.portfolioGenerated);
  }
  if (data.format !== undefined) {
    fields.push(`format = $${paramIndex++}`);
    values.push(data.format);
  }
  if (data.storedLocation !== undefined) {
    fields.push(`stored_location = $${paramIndex++}`);
    values.push(data.storedLocation);
  }
  if (data.encryptionIv !== undefined) {
    fields.push(`encryption_iv = $${paramIndex++}`);
    values.push(data.encryptionIv);
  }
  if (data.authTag !== undefined) {
    fields.push(`auth_tag = $${paramIndex++}`);
    values.push(data.authTag);
  }
  if (data.retentionUntil !== undefined) {
    fields.push(`retention_until = $${paramIndex++}`);
    values.push(data.retentionUntil);
  }
  if (data.parsed !== undefined) {
    fields.push(`parsed = $${paramIndex++}`);
    values.push(data.parsed ? JSON.stringify(data.parsed) : null);
  }

  if (fields.length === 0) {
    return findResumeById(resumeId);
  }

  values.push(resumeId);

  const rows = await query<Resume>(
    `UPDATE resumes SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return rows[0] || null;
}

/**
 * Mark resume as portfolio generated
 */
export async function markResumeAsGenerated(resumeId: string): Promise<void> {
  await query(
    'UPDATE resumes SET portfolio_generated = true WHERE id = $1',
    [resumeId]
  );
}

/**
 * Delete resume
 */
export async function deleteResume(resumeId: string): Promise<boolean> {
  const rows = await query(
    'DELETE FROM resumes WHERE id = $1',
    [resumeId]
  );
  return rows.length > 0;
}

/**
 * Delete all resumes for a user
 */
export async function deleteAllUserResumes(userId: string): Promise<number> {
  const result = await query(
    'DELETE FROM resumes WHERE user_id = $1',
    [userId]
  );
  return result.length;
}

/**
 * Find resumes that need to be purged based on retention policy
 */
export async function findResumesForPurge(): Promise<Resume[]> {
  const now = new Date();
  return query<Resume>(
    'SELECT * FROM resumes WHERE retention_until IS NOT NULL AND retention_until < $1',
    [now]
  );
}

// ============================================================================
// GENERATED PORTFOLIO SERVICES
// ============================================================================

/**
 * Create a new generated portfolio
 */
export async function createGeneratedPortfolio(data: {
  resumeId: string;
  userId: string;
  themeId?: string;
}): Promise<GeneratedPortfolio> {
  const id = crypto.randomUUID();
  const now = new Date();

  const rows = await query<GeneratedPortfolio>(
    `INSERT INTO generated_portfolios (id, resume_id, user_id, theme_id, generated_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [id, data.resumeId, data.userId, data.themeId || null, now]
  );

  return rows[0];
}

/**
 * Find generated portfolio by ID
 */
export async function findGeneratedPortfolioById(
  portfolioId: string
): Promise<GeneratedPortfolio | null> {
  const rows = await query<GeneratedPortfolio>(
    'SELECT * FROM generated_portfolios WHERE id = $1',
    [portfolioId]
  );
  return rows[0] || null;
}

/**
 * Find generated portfolio by resume ID
 */
export async function findGeneratedPortfolioByResumeId(
  resumeId: string
): Promise<GeneratedPortfolio | null> {
  const rows = await query<GeneratedPortfolio>(
    'SELECT * FROM generated_portfolios WHERE resume_id = $1',
    [resumeId]
  );
  return rows[0] || null;
}

/**
 * List user's generated portfolios
 */
export async function listUserGeneratedPortfolios(
  userId: string
): Promise<GeneratedPortfolio[]> {
  return query<GeneratedPortfolio>(
    'SELECT * FROM generated_portfolios WHERE user_id = $1 ORDER BY generated_at DESC',
    [userId]
  );
}

/**
 * Update generated portfolio
 */
export async function updateGeneratedPortfolio(
  portfolioId: string,
  data: { themeId?: string }
): Promise<GeneratedPortfolio | null> {
  if (!data.themeId) {
    return findGeneratedPortfolioById(portfolioId);
  }

  const rows = await query<GeneratedPortfolio>(
    'UPDATE generated_portfolios SET theme_id = $1 WHERE id = $2 RETURNING *',
    [data.themeId, portfolioId]
  );

  return rows[0] || null;
}

/**
 * Delete generated portfolio
 */
export async function deleteGeneratedPortfolio(
  portfolioId: string
): Promise<boolean> {
  const rows = await query(
    'DELETE FROM generated_portfolios WHERE id = $1',
    [portfolioId]
  );
  return rows.length > 0;
}

/**
 * Delete all generated portfolios for a user
 */
export async function deleteAllUserGeneratedPortfolios(
  userId: string
): Promise<number> {
  const result = await query(
    'DELETE FROM generated_portfolios WHERE user_id = $1',
    [userId]
  );
  return result.length;
}

// ============================================================================
// PORTFOLIO THEME SERVICES
// ============================================================================

/**
 * Create a new portfolio theme
 */
export async function createPortfolioTheme(data: {
  portfolioId: string;
  gradientCss: string;
}): Promise<PortfolioTheme> {
  const id = crypto.randomUUID();
  const now = new Date();

  const rows = await query<PortfolioTheme>(
    `INSERT INTO portfolio_themes (id, portfolio_id, gradient_css, created_at)
    VALUES ($1, $2, $3, $4)
    RETURNING *`,
    [id, data.portfolioId, data.gradientCss, now]
  );

  return rows[0];
}

/**
 * Find portfolio theme by ID
 */
export async function findPortfolioThemeById(
  themeId: string
): Promise<PortfolioTheme | null> {
  const rows = await query<PortfolioTheme>(
    'SELECT * FROM portfolio_themes WHERE id = $1',
    [themeId]
  );
  return rows[0] || null;
}

/**
 * Find portfolio theme by portfolio ID
 */
export async function findPortfolioThemeByPortfolioId(
  portfolioId: string
): Promise<PortfolioTheme | null> {
  const rows = await query<PortfolioTheme>(
    'SELECT * FROM portfolio_themes WHERE portfolio_id = $1',
    [portfolioId]
  );
  return rows[0] || null;
}

/**
 * Update portfolio theme
 */
export async function updatePortfolioTheme(
  themeId: string,
  gradientCss: string
): Promise<PortfolioTheme | null> {
  const rows = await query<PortfolioTheme>(
    'UPDATE portfolio_themes SET gradient_css = $1 WHERE id = $2 RETURNING *',
    [gradientCss, themeId]
  );

  return rows[0] || null;
}

/**
 * Delete portfolio theme
 */
export async function deletePortfolioTheme(themeId: string): Promise<boolean> {
  const rows = await query(
    'DELETE FROM portfolio_themes WHERE id = $1',
    [themeId]
  );
  return rows.length > 0;
}

/**
 * Delete portfolio theme by portfolio ID
 */
export async function deletePortfolioThemeByPortfolioId(
  portfolioId: string
): Promise<boolean> {
  const rows = await query(
    'DELETE FROM portfolio_themes WHERE portfolio_id = $1',
    [portfolioId]
  );
  return rows.length > 0;
}

// ============================================================================
// PORTFOLIO PAGE SERVICES
// ============================================================================

/**
 * Create a new portfolio page
 */
export async function createPortfolioPage(data: {
  portfolioId: string;
  pageType: PageType;
  title: string;
  content: string;
  publicUrl: string;
}): Promise<PortfolioPage> {
  const id = crypto.randomUUID();
  const now = new Date();

  const rows = await query<PortfolioPage>(
    `INSERT INTO portfolio_pages (
      id, portfolio_id, page_type, title, content, public_url, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      id,
      data.portfolioId,
      data.pageType,
      data.title,
      data.content,
      data.publicUrl,
      now,
    ]
  );

  return rows[0];
}

/**
 * Find portfolio page by ID
 */
export async function findPortfolioPageById(
  pageId: string
): Promise<PortfolioPage | null> {
  const rows = await query<PortfolioPage>(
    'SELECT * FROM portfolio_pages WHERE id = $1',
    [pageId]
  );
  return rows[0] || null;
}

/**
 * Find portfolio page by portfolio ID and page type
 */
export async function findPortfolioPageByType(
  portfolioId: string,
  pageType: PageType
): Promise<PortfolioPage | null> {
  const rows = await query<PortfolioPage>(
    'SELECT * FROM portfolio_pages WHERE portfolio_id = $1 AND page_type = $2',
    [portfolioId, pageType]
  );
  return rows[0] || null;
}

/**
 * List all pages for a portfolio
 */
export async function listPortfolioPages(
  portfolioId: string
): Promise<PortfolioPage[]> {
  return query<PortfolioPage>(
    'SELECT * FROM portfolio_pages WHERE portfolio_id = $1 ORDER BY created_at ASC',
    [portfolioId]
  );
}

/**
 * Update portfolio page
 */
export async function updatePortfolioPage(
  pageId: string,
  data: Partial<Omit<PortfolioPage, 'id' | 'portfolioId' | 'createdAt'>>
): Promise<PortfolioPage | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.pageType !== undefined) {
    fields.push(`page_type = $${paramIndex++}`);
    values.push(data.pageType);
  }
  if (data.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }
  if (data.content !== undefined) {
    fields.push(`content = $${paramIndex++}`);
    values.push(data.content);
  }
  if (data.publicUrl !== undefined) {
    fields.push(`public_url = $${paramIndex++}`);
    values.push(data.publicUrl);
  }

  if (fields.length === 0) {
    return findPortfolioPageById(pageId);
  }

  values.push(pageId);

  const rows = await query<PortfolioPage>(
    `UPDATE portfolio_pages SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return rows[0] || null;
}

/**
 * Delete portfolio page
 */
export async function deletePortfolioPage(pageId: string): Promise<boolean> {
  const rows = await query(
    'DELETE FROM portfolio_pages WHERE id = $1',
    [pageId]
  );
  return rows.length > 0;
}

/**
 * Delete all pages for a portfolio
 */
export async function deleteAllPortfolioPages(
  portfolioId: string
): Promise<number> {
  const result = await query(
    'DELETE FROM portfolio_pages WHERE portfolio_id = $1',
    [portfolioId]
  );
  return result.length;
}

// ============================================================================
// TRANSACTION-BASED OPERATIONS
// ============================================================================

/**
 * Generate a complete portfolio with transaction support
 * Creates portfolio, theme, and all 4 pages in a single transaction
 */
export async function generateCompletePortfolio(data: {
  resumeId: string;
  userId: string;
  gradientCss: string;
  pages: Array<{
    pageType: PageType;
    title: string;
    content: string;
    publicUrl: string;
  }>;
}): Promise<{
  portfolio: GeneratedPortfolio;
  theme: PortfolioTheme;
  pages: PortfolioPage[];
}> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Create portfolio
    const portfolioId = crypto.randomUUID();
    const now = new Date();

    const portfolioResult = await client.query<GeneratedPortfolio>(
      `INSERT INTO generated_portfolios (id, resume_id, user_id, generated_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [portfolioId, data.resumeId, data.userId, now]
    );
    const portfolio = portfolioResult.rows[0];

    // Create theme
    const themeId = crypto.randomUUID();
    const themeResult = await client.query<PortfolioTheme>(
      `INSERT INTO portfolio_themes (id, portfolio_id, gradient_css, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [themeId, portfolioId, data.gradientCss, now]
    );
    const theme = themeResult.rows[0];

    // Update portfolio with theme ID
    await client.query(
      'UPDATE generated_portfolios SET theme_id = $1 WHERE id = $2',
      [themeId, portfolioId]
    );
    portfolio.themeId = themeId;

    // Create all pages
    const pages: PortfolioPage[] = [];
    for (const pageData of data.pages) {
      const pageId = crypto.randomUUID();
      const pageResult = await client.query<PortfolioPage>(
        `INSERT INTO portfolio_pages (
          id, portfolio_id, page_type, title, content, public_url, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          pageId,
          portfolioId,
          pageData.pageType,
          pageData.title,
          pageData.content,
          pageData.publicUrl,
          now,
        ]
      );
      pages.push(pageResult.rows[0]);
    }

    // Mark resume as portfolio generated
    await client.query(
      'UPDATE resumes SET portfolio_generated = true WHERE id = $1',
      [data.resumeId]
    );

    await client.query('COMMIT');

    return { portfolio, theme, pages };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error generating complete portfolio:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete entire portfolio with all related data (theme and pages)
 */
export async function deleteCompletePortfolio(
  portfolioId: string
): Promise<void> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Delete pages
    await client.query(
      'DELETE FROM portfolio_pages WHERE portfolio_id = $1',
      [portfolioId]
    );

    // Delete theme
    await client.query(
      'DELETE FROM portfolio_themes WHERE portfolio_id = $1',
      [portfolioId]
    );

    // Delete portfolio
    await client.query(
      'DELETE FROM generated_portfolios WHERE id = $1',
      [portfolioId]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting complete portfolio:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete all user data (resumes, photos, portfolios)
 * Use for account deletion or GDPR compliance
 */
export async function deleteAllUserData(userId: string): Promise<void> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Get all portfolio IDs for the user
    const portfoliosResult = await client.query<{ id: string }>(
      'SELECT id FROM generated_portfolios WHERE user_id = $1',
      [userId]
    );
    const portfolioIds = portfoliosResult.rows.map((row) => row.id);

    // Delete all portfolio pages for user's portfolios
    if (portfolioIds.length > 0) {
      await client.query(
        `DELETE FROM portfolio_pages WHERE portfolio_id = ANY($1)`,
        [portfolioIds]
      );

      // Delete all portfolio themes for user's portfolios
      await client.query(
        `DELETE FROM portfolio_themes WHERE portfolio_id = ANY($1)`,
        [portfolioIds]
      );
    }

    // Delete all generated portfolios
    await client.query(
      'DELETE FROM generated_portfolios WHERE user_id = $1',
      [userId]
    );

    // Delete all resumes
    await client.query('DELETE FROM resumes WHERE user_id = $1', [userId]);

    // Delete all portfolio photos
    await client.query(
      'DELETE FROM user_portfolio_photos WHERE user_id = $1',
      [userId]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting all user data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// ============================================================================
// UTILITY AND VALIDATION FUNCTIONS
// ============================================================================

/**
 * Get complete user statistics
 */
export async function getUserStatistics(userId: string): Promise<{
  photoCount: number;
  resumeCount: number;
  portfolioCount: number;
  canUploadMorePhotos: boolean;
  canUploadMoreResumes: boolean;
}> {
  const photoCount = await getUserPhotoCount(userId);
  const resumeCount = await getUserResumeCount(userId);
  const portfolios = await listUserGeneratedPortfolios(userId);

  return {
    photoCount,
    resumeCount,
    portfolioCount: portfolios.length,
    canUploadMorePhotos: photoCount < 3,
    canUploadMoreResumes: resumeCount < 2,
  };
}

/**
 * Get complete portfolio with all related data
 */
export async function getCompletePortfolio(portfolioId: string): Promise<{
  portfolio: GeneratedPortfolio | null;
  theme: PortfolioTheme | null;
  pages: PortfolioPage[];
}> {
  const portfolio = await findGeneratedPortfolioById(portfolioId);
  if (!portfolio) {
    return { portfolio: null, theme: null, pages: [] };
  }

  const theme = await findPortfolioThemeByPortfolioId(portfolioId);
  const pages = await listPortfolioPages(portfolioId);

  return { portfolio, theme, pages };
}

/**
 * Check if a resume has an associated portfolio
 */
export async function hasPortfolio(resumeId: string): Promise<boolean> {
  const portfolio = await findGeneratedPortfolioByResumeId(resumeId);
  return portfolio !== null;
}

/**
 * Validate page type
 */
export function isValidPageType(pageType: string): pageType is PageType {
  return ['home', 'about', 'portfolio', 'contact'].includes(pageType);
}

/**
 * Get all portfolios with complete data for a user
 */
export async function getUserCompletePortfolios(userId: string): Promise<
  Array<{
    portfolio: GeneratedPortfolio;
    theme: PortfolioTheme | null;
    pages: PortfolioPage[];
    resume: Resume | null;
  }>
> {
  const portfolios = await listUserGeneratedPortfolios(userId);

  const results = await Promise.all(
    portfolios.map(async (portfolio) => {
      const theme = await findPortfolioThemeByPortfolioId(portfolio.id);
      const pages = await listPortfolioPages(portfolio.id);
      const resume = await findResumeById(portfolio.resumeId);

      return {
        portfolio,
        theme,
        pages,
        resume,
      };
    })
  );

  return results;
}
