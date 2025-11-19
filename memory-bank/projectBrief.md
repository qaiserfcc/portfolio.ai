# Project Brief

## Purpose

Portfolio.ai is a Next.js web application that generates shareable portfolio websites from user resumes using AI. It allows users to upload their resumes and photos, then automatically creates professional portfolio pages with themes, about sections, project listings, and contact information.

## Target Users

- Job seekers and professionals looking to create quick, professional portfolios
- Developers and designers who want AI-assisted portfolio generation
- Users who want shareable, hosted portfolio sites without coding
- Family members or groups wanting to showcase achievements collectively

## Key Features

- Resume upload and parsing (PDF, DOCX, TXT, MD)
- Photo gallery integration
- AI-powered content generation for portfolio pages
- Customizable themes and layouts
- Public shareable URLs
- Dashboard for managing content
- Secure authentication with JWT
- Encrypted file storage
- Data retention policies

## Technology Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion
- Backend: Next.js API routes, PostgreSQL database
- Storage: AWS S3 or Google Cloud Storage
- Security: JWT authentication, AES-256-GCM encryption
- Deployment: Vercel

## Constraints

- Free tier: 2 resumes, 3 photos per user
- Premium tiers: Higher limits
- 30-day data retention
- Secure handling of PII
