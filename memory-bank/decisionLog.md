# Decision Log

## Technology Stack Decisions

### Next.js 16 with App Router
**Date**: Initial project setup  
**Decision**: Use Next.js 16 with the new App Router instead of Pages Router  
**Rationale**: App Router provides better performance, simpler data fetching, and improved developer experience. Enables server components and streaming.  
**Alternatives Considered**: Pages Router (legacy), Remix, SvelteKit  
**Impact**: Modern architecture, easier scaling, better SEO

### PostgreSQL Database
**Date**: Initial project setup  
**Decision**: Use PostgreSQL as the primary database  
**Rationale**: ACID compliance, JSON support, excellent performance, mature ecosystem. Good fit for user data and portfolio content.  
**Alternatives Considered**: MongoDB, MySQL, SQLite  
**Impact**: Reliable data storage, complex queries possible

### JWT Authentication with HTTP-Only Cookies
**Date**: Initial project setup  
**Decision**: Implement JWT-based authentication with httpOnly cookies  
**Rationale**: Secure token storage, automatic CSRF protection, stateless authentication.  
**Alternatives Considered**: Session-based auth, API keys  
**Impact**: Secure user sessions, scalable authentication

### AES-256-GCM Encryption for Files
**Date**: Initial project setup  
**Decision**: Use AES-256-GCM for encrypting uploaded files at rest  
**Rationale**: Industry standard encryption, authenticated encryption prevents tampering, strong security for PII.  
**Alternatives Considered**: AES-CBC, no encryption  
**Impact**: Compliance with data protection regulations

## Architecture Decisions

### Service Layer Pattern
**Date**: Database integration phase  
**Decision**: Implement a service layer between API routes and database  
**Rationale**: Centralizes business logic, enables testing, provides consistent data access patterns.  
**Alternatives Considered**: Direct database calls in API routes  
**Impact**: Maintainable codebase, easier testing

### Middleware Composition
**Date**: Security implementation  
**Decision**: Use composable middleware for auth, rate limiting, and validation  
**Rationale**: Reusable security logic, consistent error handling, easy to extend.  
**Alternatives Considered**: Inline checks in each route  
**Impact**: DRY principle, consistent security

### File Storage Abstraction
**Date**: Upload system design  
**Decision**: Abstract file storage behind an interface supporting multiple providers  
**Rationale**: Easy to switch between S3, GCS, local storage; enables testing with mocks.  
**Alternatives Considered**: Direct S3 integration  
**Impact**: Flexible deployment options, testable code

## Security Decisions

### Rate Limiting Implementation
**Date**: API security phase  
**Decision**: Implement rate limiting on all mutating endpoints  
**Rationale**: Prevents abuse, protects against DoS attacks, ensures fair usage.  
**Alternatives Considered**: No rate limiting, client-side only  
**Impact**: System stability, user experience protection

### Input Validation Strategy
**Date**: Form handling phase  
**Decision**: Validate inputs on both client and server sides  
**Rationale**: Defense in depth, better UX with immediate feedback, security against malicious requests.  
**Alternatives Considered**: Server-side only validation  
**Impact**: Robust security, good user experience

### Data Retention Policy
**Date**: Privacy compliance phase  
**Decision**: Implement 30-day data retention with automatic cleanup  
**Rationale**: Balances user privacy with service utility, complies with data protection laws.  
**Alternatives Considered**: No retention limit, user-controlled retention  
**Impact**: Privacy compliance, storage cost management

### Together AI (Llama 3.3) Migration
**Date**: Nov 25, 2025
**Decision**: Migrate AI content generation from GitHub Models API to Together AI (`meta-llama/Llama-3.3-70B-Instruct`) as the default dev provider and implement a provider-agnostic AI layer.
**Rationale**: GitHub Models and Copilot Chat APIs require paid access or token scopes not available; Together AI provides a reliable free-tier endpoint and compatible API that enables using a high-quality open-source model (Llama 3.3) without paid access for initial development.
**Alternatives Considered**: Continue with GitHub Models API (restricted access), OpenRouter, Cloudflare workers or self-hosted LLMs.
**Impact**: Updated `src/lib/ai/portfolio-generator.ts` to use Together AI client; added `TOGETHER_API_KEY` env variable placeholder; added fallback content generation when API key is missing or invalid; tested via `scripts/test-portfolio.ts`.

### Gemini (Google Generative Language) Support
**Date**: Nov 25, 2025
**Decision**: Add support for Google Gemini as an alternate provider in the AI provider-agnostic layer and document required environment variables (`GEMINI_API_KEY`, `GEMINI_API_ENDPOINT`) and runtime selection via `AI_PROVIDER=gemini`.
**Rationale**: Gemini can provide higher quality in production environments; offering multiple providers lets developers choose a provider for cost/performance trade-offs.
**Alternatives Considered**: Only Together AI or GitHub Models; embed both to support flexibility.
**Impact**: Added `getGeminiClient()` in `src/lib/ai/portfolio-generator.ts` and normalized responses to the common provider shape. Documentation and env placeholders added; test harness validated fallback behavior when creds are missing.

## Development Decisions

### TypeScript Strict Mode
**Date**: Initial project setup  
**Decision**: Use TypeScript with strict mode enabled  
**Rationale**: Catches errors at compile time, better IDE support, self-documenting code.  
**Alternatives Considered**: JavaScript, loose TypeScript  
**Impact**: Fewer runtime errors, better maintainability

### ESLint Configuration
**Date**: Code quality setup  
**Decision**: Use ESLint with Next.js and TypeScript rules  
**Rationale**: Consistent code style, catches common mistakes, enforces best practices.  
**Alternatives Considered**: No linting, basic rules only  
**Impact**: Code quality, team consistency

### Memory Bank Documentation System
**Date**: Project organization phase  
**Decision**: Implement memory-bank system for project documentation  
**Rationale**: Maintains project context across sessions, tracks decisions and progress, enables handoffs.  
**Alternatives Considered**: Wiki, inline comments, no documentation  
**Impact**: Better project continuity, reduced onboarding time
