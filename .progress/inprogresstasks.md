# In Progress Tasks

## Authentication System Completion
- [ ] Check if user already exists in database for register
- [ ] Implement password hashing for production in register
- [ ] Create user in database for register
- [ ] Generate email verification token for register
- [ ] Send verification email for register
- [ ] Replace demo user ID with actual database user ID in register
- [ ] Store refresh token in database for register
- [ ] Log registration audit event
- [ ] Invalidate refresh token in database for logout
- [ ] Log logout event

## Upload Routes Enhancement
- [ ] Apply rate limiting middleware to upload routes (resume/photo)
- [ ] Implement actual file upload to storage (S3/GCS) for resumes
- [ ] Save resume metadata to database
- [ ] Replace demo resume ID with actual database ID
- [ ] Log resume upload audit event
- [ ] Implement actual file upload to storage (S3/GCS) for photos
- [ ] Save photo metadata to database
- [ ] Replace demo photo ID with actual database ID
- [ ] Log photo upload audit event
- [ ] Implement photo fetch from database

## Storage Layer Implementation
- [ ] Implement actual upload using AWS SDK or GCS client in storage layer
- [ ] Implement actual download using AWS SDK or GCS client in storage layer
- [ ] Implement actual deletion using AWS SDK or GCS client in storage layer
- [ ] Implement presigned URL generation for uploads in storage layer
- [ ] Implement presigned URL for downloads in storage layer

## Resume Parser Enhancement
- [ ] Implement more sophisticated text parsing in resume parser
- [ ] Implement PDF parsing in resume parser
- [ ] Implement DOCX parsing in resume parser
- [ ] Implement AI-powered parsing in resume parser

## Data Retention & Cleanup
- [ ] Implement fetch expired resumes from database in retention utils
- [ ] Implement fetch expired photos from database in retention utils
- [ ] Implement fetch expired sessions from database in retention utils
- [ ] Implement delete expired sessions in retention utils
- [ ] Implement delete all user resumes on account deletion
- [ ] Implement delete all user photos on account deletion
- [ ] Implement delete all user portfolios on account deletion
- [ ] Implement delete all user sessions on account deletion
- [ ] Implement anonymize audit logs (remove PII)
- [ ] Implement delete user account
- [ ] Implement fetch current retention date from config
- [ ] Implement all database queries in retention utils
- [ ] Implement delete photos from storage (S3/GCS) in portfolio management

## API Routes Completion
- [ ] Implement production contact form handling in contact API
- [ ] Replace all TODO comments in API routes with actual database calls

## Infrastructure Setup
- [ ] Configure real database connection (replace invalid MongoDB URL)
- [ ] Set up real storage provider (AWS S3 or GCS)
- [ ] Configure email service for verification
- [ ] Implement rate limiting middleware (fully configure)
- [ ] Set up audit logging system (complete configuration)