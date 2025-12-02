# Progress

## Done

- [x] Initialize project
- [x] Apply rate limiting middleware to all auth routes (/api/auth/login, /api/auth/register, /api/auth/logout)
- [x] Implement database user fetch for login
- [x] Implement password verification for login
- [x] Add user active status check for login
- [x] Add email verification check for login (if required)
- [x] Replace demo user ID with actual database user ID in login
- [x] Store refresh token in database for login
- [x] Update last login timestamp in database
- [x] Log successful login audit event
- [x] Log failed login audit event
- [x] Set up audit logging system
- [x] Fix dashboard component TypeScript errors (undefined functions, type mismatches)
- [x] Fix login page error state type definition
- [x] Fix scrollToSection function parameter type
- [x] Add missing AuditLog import in services.ts
- [x] Fix dashboard delete photo button accessibility (add aria-label)
- [x] Resolve all TypeScript compilation errors
- [x] Project builds successfully without errors
- [x] Create .progress folder with task tracking files (completedtasks.md, inprogresstasks.md, nexttasks.md)
- [x] Set up organized task tracking system readable by TODO extensions
- [x] Migrate AI content generation implementation from GitHub Models API to Together AI
- [x] Add Together AI integration to `src/lib/ai/portfolio-generator.ts` with Llama 3.3 70B Instruct model by default
- [x] Add environment variable `TOGETHER_API_KEY` placeholder to `.env.local` and update README notes
- [x] Add `test:portfolio` script to `package.json` and validate AI content generation flow (fallbacks tested)
- [x] Add provider-agnostic AI client and implement Google Gemini provider (`GEMINI_API_KEY` + `GEMINI_API_ENDPOINT`)
- [x] Add `AI_PROVIDER` environment variable to switch providers (e.g., `together`, `gemini`), defaulting to `together`.
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
- [ ] Implement actual upload using AWS SDK or GCS client in storage layer
- [ ] Implement actual download using AWS SDK or GCS client in storage layer
- [ ] Implement actual deletion using AWS SDK or GCS client in storage layer
- [ ] Implement presigned URL generation for uploads in storage layer
- [ ] Implement presigned URL for downloads in storage layer
- [ ] Implement more sophisticated text parsing in resume parser
- [ ] Implement PDF parsing in resume parser
- [ ] Implement DOCX parsing in resume parser
- [ ] Implement AI-powered parsing in resume parser
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
- [ ] Implement production contact form handling in contact API
- [ ] Replace all TODO comments in API routes with actual database calls
- [ ] Implement all storage TODOs
- [ ] Configure real database connection (replace invalid MongoDB URL)
- [ ] Set up real storage provider (AWS S3 or GCS)
- [ ] Configure email service for verification
- [ ] Implement rate limiting middleware
- [ ] Set up audit logging system

## Recent Progress (Nov 25, 2025)

- [x] Completed migration to Together AI for portfolio content generation and verified fallback behavior in tests
- [x] Updated AI code to use Together AI endpoints and model selection logic
- [x] Verified `test:portfolio` runs successfully using fallback content when `TOGETHER_API_KEY` is not set
- [ ] Tasks in progress: fix lint errors, implement multi-provider AI selection, and CI tests for AI provider

## Next Tasks

- [ ] Acquire and configure valid Together AI API key in development and production environment
- [ ] Add CI checks for `.env` variables and AI provider test harness
- [ ] Refactor `src/lib/ai/portfolio-generator.ts` to support provider strategy (Together AI / GitHub / OpenRouter)
- [ ] Fix remaining ESLint errors/warnings across repository (see `npm run lint` output)
- [ ] Add tests that assert outputs for each generated page (home, about, portfolio, contact) for provider and fallback modes
