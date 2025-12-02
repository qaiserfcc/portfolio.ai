# Portfolio.ai: System Architect

## Overview
This file contains the architectural decisions and design patterns for the Portfolio.ai project.

## Architectural Decisions

1. **Next.js App Router**: Using Next.js 16 with App Router for file-based routing, server components, and API routes. Provides excellent developer experience and performance.

2. **PostgreSQL Database**: Chosen over MongoDB for relational data integrity, ACID compliance, and complex queries needed for user management and portfolio relationships.

3. **JWT Authentication with HTTP-only Cookies**: Secure authentication using JWT tokens stored in httpOnly cookies to prevent XSS attacks, with separate access/refresh token strategy.

4. **AES-256-GCM Encryption**: All PII and uploaded files are encrypted at rest using AES-256-GCM with unique IVs and auth tags stored in database.

5. **Service Layer Abstraction**: Centralized database operations in `services.ts` for consistency, connection pooling, and transaction management.

6. **Storage Provider Abstraction**: Abstracted storage layer allowing easy switching between AWS S3, Google Cloud Storage, or other providers.

7. **Rate Limiting Middleware**: Applied to all mutation endpoints to prevent abuse and ensure fair usage.

8. **Data Retention Policies**: 30-day automatic cleanup of user data with configurable retention periods for compliance.

9. **Role-Based Access Control**: Simple role system (user/superuser/admin) with middleware checks for protected routes.

10. **AI Content Generation**: Modular AI layer ready for integration with Hugging Face, OpenAI, or local models for portfolio content generation.

11. **AI Provider Strategy** (Nov 25, 2025): Implement a provider-agnostic layer with a strategy pattern to support multiple AI providers. Currently Together AI (`meta-llama/Llama-3.3-70B-Instruct`) is the default integration used during development. The design choice supports swapping providers in production, adding test harnesses, and graceful fallbacks.

## Design Patterns

- **Repository Pattern**: Database services act as repositories for data access.
- **Middleware Pattern**: Authentication and authorization handled via Next.js middleware.
- **Factory Pattern**: Theme and content generators use factory-like structures.
- **Observer Pattern**: Potential for real-time updates (not yet implemented).
- **Strategy Pattern**: Storage providers and AI models can be swapped via strategy pattern.

## Security Principles

- Defense in depth with multiple security layers
- Principle of least privilege for database operations
- Secure defaults with explicit opt-in for features
- Regular security audits and dependency updates
- PII minimization and encryption at rest/transit

## Scalability Considerations

- Horizontal scaling via Vercel deployment
- Database connection pooling
- CDN for static assets
- Background job processing for heavy AI tasks (future)
- Caching layers for frequently accessed portfolios

## AI-specific operational considerations

- Use environment variables for provider selection and keys (e.g., `TOGETHER_API_KEY` for Together AI). The code includes a fallback to basic content when providers are unavailable or API keys are invalid.
- For longer running AI tasks, consider moving AI generation to background workers (queue-based) to keep API responses snappy and to allow retry/requeue for failures.

