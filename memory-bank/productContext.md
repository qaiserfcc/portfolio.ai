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

**AI**: Custom portfolio generator using a provider-agnostic layer; newly integrated with Together AI using Llama 3.3 70B Instruct (default) with graceful fallback content when API keys are not configured. The AI layer is designed to support multiple providers (Together AI, GitHub Models, OpenRouter) via a provider strategy.
**AI**: Custom portfolio generator using a provider-agnostic layer; newly integrated with Together AI using Llama 3.3 70B Instruct (default) with graceful fallback content when API keys are not configured. The AI layer supports multiple providers (Together AI, GitHub Models, OpenRouter, and Google Gemini via `GEMINI_API_KEY`) via a provider strategy (set `AI_PROVIDER` environment variable to select provider).
 - **Model Selection**: Use `TOGETHER_DEFAULT_MODEL` or `GEMINI_DEFAULT_MODEL` to override the default model for each provider.
**Deployment**: Vercel with environment-based configuration

- CI should validate provider availability via a basic smoke test and check for required env variables during build or PR validation.
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
