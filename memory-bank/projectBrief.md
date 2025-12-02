# Project Brief

## Purpose

Portfolio.ai generates shareable portfolio websites from resumes and photos using AI. The product automates content generation, theme selection, and page creation to help professionals quickly create polished portfolio sites.

## Target Users

- Job seekers and professionals
- Developers and designers
- Users wanting an automated portfolio site without coding
- Family or group portfolio creators

## Key Features

- Resume upload and parsing (PDF/DOCX/TXT/MD)
- Photo gallery and upload
- AI-powered content generation (about, projects, contact sections)
- Customizable themes and responsive layouts
- Public shareable URLs and dashboard management
- Secure authentication and encrypted storage

## Technology Stack

- Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- Backend: Next.js API routes, PostgreSQL, centralized services
- Storage: AWS S3 or Google Cloud Storage (abstracted behind storage layer)
- Security: JWT authentication, AES-256-GCM encryption for PII
- Deployment: Vercel
- AI Provider: Together AI (`meta-llama/Llama-3.3-70B-Instruct`) used by default in dev; provider-agnostic AI layer supports swap to GitHub Models or OpenRouter.
 - AI Provider: Together AI (`meta-llama/Llama-3.3-70B-Instruct`) used by default in dev; provider-agnostic AI layer supports swap to GitHub Models, OpenRouter, or Google Gemini.
- Development: ESLint, TypeScript, Vitest for testing

## Constraints

- Free tier: 2 resumes and 3 photos per user
- 30-day retention policy for uploaded data
- Secure handling of PII and audit logging
