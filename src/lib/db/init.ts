/**
 * Database Initialization Script
 * Creates all required tables for the AI-generated portfolio system
 */

import { getPool } from './connection';

export async function initializeDatabase() {
  const pool = getPool();

  try {
    // Create users table (if not exists)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255),
        profile_photo_url TEXT,
        role VARCHAR(50) DEFAULT 'user',
        email_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        last_login_at TIMESTAMP
      );
    `);

    // Create user_sessions table (for refresh tokens)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        ip_address VARCHAR(255),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        last_used_at TIMESTAMP
      );
    `);

    // Create index on user_id for sessions
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user 
      ON user_sessions(user_id);
    `);

    // Create index on expires_at for cleanup
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires 
      ON user_sessions(expires_at);
    `);

    // Create audit_logs table (for security logging)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100) NOT NULL,
        resource_id VARCHAR(255),
        ip_address VARCHAR(255),
        user_agent TEXT,
        details TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create index on user_id for audit logs
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user 
      ON audit_logs(user_id);
    `);

    // Create index on created_at for audit logs
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created 
      ON audit_logs(created_at);
    `);

    // Create user_portfolio_photos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_portfolio_photos (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        photo_url TEXT NOT NULL,
        storage_location TEXT NOT NULL,
        iv VARCHAR(255) NOT NULL,
        auth_tag VARCHAR(255) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create index on user_id for portfolio photos
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_portfolio_photos_user 
      ON user_portfolio_photos(user_id);
    `);

    // Create resumes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resumes (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        resume_url TEXT NOT NULL,
        original_filename VARCHAR(255),
        uploaded_at TIMESTAMP DEFAULT NOW(),
        ai_notes TEXT,
        portfolio_generated BOOLEAN DEFAULT FALSE,
        iv VARCHAR(255),
        auth_tag VARCHAR(255)
      );
    `);

    // Add iv column if it doesn't exist (for existing tables)
    await pool.query(`
      ALTER TABLE resumes ADD COLUMN IF NOT EXISTS iv VARCHAR(255);
    `);

    // Add auth_tag column if it doesn't exist (for existing tables)
    await pool.query(`
      ALTER TABLE resumes ADD COLUMN IF NOT EXISTS auth_tag VARCHAR(255);
    `);

    // Create index on user_id for resumes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_resumes_user 
      ON resumes(user_id);
    `);

    // Create generated_portfolios table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS generated_portfolios (
        id VARCHAR(255) PRIMARY KEY,
        resume_id VARCHAR(255) NOT NULL UNIQUE REFERENCES resumes(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        theme_id VARCHAR(255),
        generated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create index on user_id for portfolios
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_portfolio_user 
      ON generated_portfolios(user_id);
    `);

    // Create portfolio_themes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS portfolio_themes (
        id VARCHAR(255) PRIMARY KEY,
        portfolio_id VARCHAR(255) NOT NULL REFERENCES generated_portfolios(id) ON DELETE CASCADE,
        gradient_css TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create portfolio_pages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS portfolio_pages (
        id VARCHAR(255) PRIMARY KEY,
        portfolio_id VARCHAR(255) NOT NULL REFERENCES generated_portfolios(id) ON DELETE CASCADE,
        page_type VARCHAR(50) NOT NULL CHECK (page_type IN ('home','about','portfolio','contact')),
        title VARCHAR(255),
        content TEXT NOT NULL,
        public_url TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create index on portfolio_id for pages
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_portfolio_pages_portfolio_id 
      ON portfolio_pages(portfolio_id);
    `);

    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

/**
 * Drop all tables (use with caution!)
 */
export async function dropAllTables() {
  const pool = getPool();

  try {
    await pool.query('DROP TABLE IF EXISTS portfolio_pages CASCADE;');
    await pool.query('DROP TABLE IF EXISTS portfolio_themes CASCADE;');
    await pool.query('DROP TABLE IF EXISTS generated_portfolios CASCADE;');
    await pool.query('DROP TABLE IF EXISTS resumes CASCADE;');
    await pool.query('DROP TABLE IF EXISTS user_portfolio_photos CASCADE;');
    await pool.query('DROP TABLE IF EXISTS audit_logs CASCADE;');
    await pool.query('DROP TABLE IF EXISTS user_sessions CASCADE;');
    await pool.query('DROP TABLE IF EXISTS users CASCADE;');

    console.log('All tables dropped successfully');
    return true;
  } catch (error) {
    console.error('Error dropping tables:', error);
    return false;
  }
}
