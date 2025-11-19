# Product Context

Describe the product.

## Overview

Portfolio.ai is a SaaS platform that transforms resumes into professional portfolio websites using AI. Users upload their resume and photos, and the system generates complete portfolio sites with multiple pages, themes, and shareable URLs.

## Core Features

- **Resume Upload & Parsing**: Support for PDF, DOCX, TXT, MD files with intelligent parsing
- **Photo Gallery**: Upload and manage professional photos for portfolio use
- **AI Content Generation**: Automatically create about, projects, and contact sections
- **Theme Customization**: Gradient themes and responsive layouts
- **Public Portfolios**: Shareable URLs for generated portfolios
- **Dashboard Management**: User dashboard for managing resumes, photos, and portfolios
- **Authentication**: Secure login/register with role-based access
- **Family Portfolios**: Support for family/group portfolio collections
- **Data Security**: Encrypted storage and 30-day retention policies

## Technical Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API routes, PostgreSQL with connection pooling
- **Database**: PostgreSQL with tables for users, resumes, photos, portfolios, sessions, audit logs
- **Storage**: AWS S3 or Google Cloud Storage for file uploads
- **Security**: JWT authentication, AES-256-GCM encryption, rate limiting
- **AI**: Custom portfolio generator (currently stubbed, ready for Hugging Face/OpenAI integration)
- **Deployment**: Vercel with environment-based configuration
- **Development**: ESLint, TypeScript, Vitest for testing

## Architecture

- **App Router Structure**: Pages under `/personal`, `/family`, `/portfolio/[userId]/[resumeId]`
- **API Routes**: REST-ish endpoints under `/api/auth`, `/api/upload`, `/api/portfolio`
- **Middleware**: Authentication and authorization checks
- **Services Layer**: Centralized database operations in `src/lib/db/services.ts`
- **Security Layer**: JWT and encryption utilities
- **Storage Layer**: Abstraction for cloud storage providers

## Business Model

- **Free Tier**: 2 resumes, 3 photos, basic features
- **Premium Tiers**: Higher limits, advanced AI features, custom domains
- **Revenue**: Subscription-based with usage tiers
