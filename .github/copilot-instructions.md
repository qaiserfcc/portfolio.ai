instructions
# GitHub Copilot Guidance for `portfolio.ai`

This repository hosts a Next.js 16 (React 19) application that generates shareable portfolio sites from user resumes. Copilot agents should understand the security-first architecture, the workflow that turns encrypted uploads into AI-authored pages, and the supporting scripts in `/docs` and `/scripts`.

## 1. Core Architecture
- **App Router** (`src/app`) drives both pages and API routes. Pages live under user-facing segments (`/contact`, `/portfolio/[userId]/[resumeId]/...`), while REST-ish handlers sit in `src/app/api/**`.
- **Database access** is centralized in `src/lib/db/connection.ts`, `schema.ts`, and `services.ts`. Always call exported service helpers (e.g., `createResume`, `generateCompletePortfolio`, `listUserPortfolioPhotos`) instead of issuing ad-hoc SQL.
- **AI content** stubs are defined in `src/lib/ai/portfolio-generator.ts`. `generatePortfolioContent` fabricates page payloads today; swap in Hugging Face/OpenAI/local models here when implementing real inference. `generateGradientTheme` is the single source of gradient CSS.
- **Security primitives** live under `src/lib/security/**`. Use `verifyAccessToken` for auth, `encryptFile`/`decryptFile` for PII at rest, and AES-256-GCM keys supplied through env (`ENCRYPTION_KEY` must be 32 bytes / 64 hex chars). JWT cookies (`accessToken`, `refreshToken`) are httpOnly + SameSite=Lax.
- **Middleware** like `src/lib/middleware/rateLimit.ts` exposes presets (`auth`, `upload`, etc.). Attach `createRateLimiter` to new API routes that mutate state or accept uploads.
- **Docs**: lean on `README.md`, `DEVELOPMENT.md`, `docs/AI_PORTFOLIO_FEATURE.md`, `docs/API.md`, `docs/SECURITY.md`, and `docs/DEPLOYMENT.md` for canonical behavior.

## 2. Critical Workflows
1. **Environment + dev setup**
   - Run `node scripts/generate-env.js`, paste output into `.env.local`, then set real secrets per `DEPLOYMENT.md`.
   - Install & start: `npm ci` → `npm run dev`. Lint/build/test via `npm run lint`, `npm run build`, `npm start`, and `npx tsx scripts/test-portfolio.ts` when you need to exercise the AI flow end to end.

2. **Authentication**
   - Login/register routes under `src/app/api/auth/**` must verify payloads, throttle via `createRateLimiter('auth')`, and issue both tokens on success.
   - Protected routes (dashboard, `/family/**`, API mutations) read `accessToken` from cookies and call `verifyAccessToken`. Return `401` for missing tokens and `403` when user IDs mismatch.

3. **Resume + photo ingestion** (`src/app/api/upload/**` and `api/portfolio/photos`)
   - Free tier permit: 2 resumes (`canUploadMoreResumes`) + 3 photos (`canUploadMorePhotos`) per user. Reuse `getUserResumeCount`/`getUserPhotoCount` before accepting uploads.
   - Accept only whitelisted MIME types (PDF/DOCX/TXT/MD for resumes, JPEG/PNG/WebP for photos) and enforce file-size caps (10 MB resumes, 5 MB photos). Reject earlier than storage/upload for efficiency.
   - Encrypt buffers with `encryptFile` and persist IV/auth tags as stored in the `resumes` & `user_portfolio_photos` tables. Never store plaintext paths.

4. **AI portfolio generation** (`src/app/api/portfolio/generate/route.ts`)
   - Flow (documented in `docs/AI_PORTFOLIO_FEATURE.md`): validate ownership of resume + assets → hydrate data → call `generatePortfolioContent` + `generateGradientTheme` → persist inside a single transaction via `generateCompletePortfolio`. This transaction writes a `generated_portfolios` row, inserts a theme, seeds four `portfolio_pages`, and marks the resume’s `portfolio_generated` flag.
   - Generated public routes follow `/portfolio/[userId]/[resumeId]/(home|about|projects|contact)` and fetch via `api/portfolio/public` which hydrates theme, photos, and page JSON.

5. **Data retention + cleanup**
   - `scripts/purge-expired-data.mjs` and helpers in `src/lib/utils/retention.ts` enforce the 30-day default from `docs/SECURITY.md`. When touching retention logic, update the script and the docs simultaneously.

## 3. Implementation Rules
- **Always scope by user ID**: every service layer call that reads or mutates user data must filter by both resource ID and `userId` from the verified token to preserve isolation.
- **Keep responses JSON with clear errors**: follow the `docs/API.md` error contract (`{ error, code, details }`) and return correct status codes (401/403/404/429) before heavy operations.
- **Preserve limits and counters**: centralized helpers such as `canGenerateMorePortfolios`, `getUserPhotoCount`, and `markResumeAsGenerated` enforce product limits—never duplicate these constants.
- **Respect rate limiting and logging**: add rate limiting to new endpoints and avoid logging PII. When you must log, use contextual IDs instead of raw content.
- **Use provided storage/service abstractions**: `src/lib/storage/index.ts` should mediate S3/GCS access, `src/lib/resume-parser` for parsing, and DB mutations should stay in `services.ts` to benefit from connection pooling and transaction helpers.
- **Do not leak secrets**: rely on env variables defined in `.env.example`/`DEPLOYMENT.md`. Never hardcode keys, IVs, or bucket names in code or tests.
- **Testing**: run `npm run lint` and `npm run build` locally before opening PRs. Use `npx tsx scripts/test-portfolio.ts` to validate the upload→generate→public pages workflow when changing the AI surface area.

## 4. Useful References
- `README.md` – high-level overview + quick start
- `docs/AI_PORTFOLIO_FEATURE.md` – AI flow, limits, and page contracts
- `docs/API.md` – request/response shapes, rate limits, public endpoints
- `docs/SECURITY.md` – encryption, JWT, retention, file validation requirements
- `docs/DEPLOYMENT.md` – secrets, Vercel steps, S3 config, rollback checklists
- `scripts/README.md` – helper utilities such as `download-images.mjs`, `generate-env.js`, `purge-expired-data.mjs`

Keep this document concise and evolve it whenever architecture, limits, or security requirements change. Ask the maintainer to confirm major workflow updates after edits.
