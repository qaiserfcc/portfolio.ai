# AI-Generated Dynamic Portfolio Pages Feature

## Overview

This feature allows users to upload resumes and personal data, after which an AI model dynamically generates four public portfolio pages — Home, About, Portfolio, and Contact Me. The content is created per-resume, stored securely in the database, and rendered as a separate public portfolio site with a unique gradient theme.

## Features

### 1. User Dashboard

After login, users can access a dashboard with:
- **Resume Upload Widget**: Upload up to 2 resumes (free tier)
- **Portfolio Photos**: Upload up to 3 photos for AI to use in portfolio generation
- **AI Notes**: Rich text box for additional information to guide AI generation
- **Resume Management**: View uploaded resumes with actions:
  - "Generate Portfolio" button (visible until first generation)
  - "View Portfolio" button (visible after generation, styled uniquely)
- **User Statistics**: Display resume count, photo count, and portfolio count

### 2. AI-Driven Content Generation

When clicking "Generate Portfolio":
1. System collects:
   - Resume file
   - User profile photo
   - Up to 3 portfolio photos
   - Additional information from notes
2. AI generates:
   - Full detailed content for all 4 pages
   - Expanded narrative beyond resume text
   - Section-based About page
   - Random gradient color theme
3. Everything saved in database per user/resume
4. Generation button hidden permanently

### 3. Public Portfolio Pages

Each generated portfolio has unique routes:
- `/portfolio/{userId}/{resumeId}/home` - Homepage
- `/portfolio/{userId}/{resumeId}/about` - About page with Print button
- `/portfolio/{userId}/{resumeId}/projects` - Portfolio/Projects
- `/portfolio/{userId}/{resumeId}/contact` - Contact page with form

Features:
- Public and shareable
- No authentication required
- Unique gradient theme per portfolio
- "Back to Dashboard" button (logged-in users only)
- Responsive design
- Print-to-PDF functionality on About page

## Database Schema

### Tables

1. **users** - User accounts (existing)
2. **user_portfolio_photos** - Portfolio photos (max 3 per user)
3. **resumes** - Uploaded resumes (max 2 per free user)
4. **generated_portfolios** - One portfolio per resume
5. **portfolio_themes** - Gradient themes per portfolio
6. **portfolio_pages** - Four pages per portfolio

### Key Fields

**resumes**:
- `portfolio_generated`: Boolean flag to track generation status
- `ai_notes`: Additional information for AI

**portfolio_pages**:
- `page_type`: Enum ('home', 'about', 'portfolio', 'contact')
- `content`: JSON string with AI-generated content
- `public_url`: Shareable URL

**portfolio_themes**:
- `gradient_css`: Random gradient CSS

## API Endpoints

### Portfolio Management

- `POST /api/portfolio/generate` - Generate AI portfolio
- `GET /api/portfolio/list` - List user's portfolios
- `GET /api/portfolio/public` - Fetch public portfolio content

### Photo Management

- `POST /api/portfolio/photos` - Upload portfolio photo (max 3)
- `GET /api/portfolio/photos` - List user's photos
- `DELETE /api/portfolio/photos` - Delete a photo

### Resume Management

- `POST /api/upload/resume` - Upload resume (max 2)
- `GET /api/upload/resume` - List user's resumes

### Contact

- `POST /api/contact` - Submit contact form

## Security

1. **User Isolation**: Each user's data fully isolated
2. **Resume Isolation**: Content isolated per resume
3. **Authentication**: Private endpoints require JWT token
4. **Public Access**: Portfolio pages are public but secure
5. **File Validation**: Size and type checks on uploads
6. **Error Handling**: No sensitive data in error messages

## Usage

### For Users

1. **Upload Resume**:
   ```
   - Go to Dashboard
   - Click "Upload Resume"
   - Select PDF/DOCX file
   - Add optional AI notes
   - Submit
   ```

2. **Upload Photos**:
   ```
   - Go to Dashboard
   - Click "Upload Portfolio Photo"
   - Select JPG/PNG (max 5MB)
   - Upload up to 3 photos
   ```

3. **Generate Portfolio**:
   ```
   - Find resume in list
   - Click "Generate Portfolio"
   - Wait for AI processing
   - View generated portfolio
   ```

4. **Share Portfolio**:
   ```
   - Copy portfolio URL
   - Share with anyone
   - No login required to view
   ```

### For Developers

#### Initialize Database

```typescript
import { initializeDatabase } from '@/lib/db/init';

await initializeDatabase();
```

#### Generate Portfolio

```typescript
import { generateCompletePortfolio } from '@/lib/db/services';
import { generatePortfolioContent, generateGradientTheme } from '@/lib/ai/portfolio-generator';

// Generate content
const content = await generatePortfolioContent(resumeData, userPhotos);
const gradient = generateGradientTheme();

// Save to database
const portfolio = await generateCompletePortfolio(
  resumeId,
  userId,
  gradient,
  pages
);
```

#### Fetch Portfolio

```typescript
import { getCompletePortfolio } from '@/lib/db/services';

const portfolio = await getCompletePortfolio(portfolioId);
```

## AI Integration

### Current Implementation

The system uses a mock AI implementation that generates realistic content. To integrate a real AI model:

1. **Replace Mock in `portfolio-generator.ts`**:

```typescript
// Option 1: Hugging Face
import { HfInference } from '@huggingface/inference';
const hf = new HfInference(process.env.HF_API_TOKEN);

// Option 2: OpenAI
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Option 3: Local Model
import { pipeline } from '@xenova/transformers';
const generator = await pipeline('text-generation', 'gpt2');
```

2. **Parse Resume Content**:

```typescript
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

async function parseResume(file: Buffer, mimeType: string) {
  if (mimeType === 'application/pdf') {
    const data = await pdf(file);
    return data.text;
  } else if (mimeType.includes('word')) {
    const result = await mammoth.extractRawText({ buffer: file });
    return result.value;
  }
}
```

3. **Generate with AI**:

```typescript
const prompt = `
Based on this resume:
${resumeText}

Additional context:
${aiNotes}

Generate a professional portfolio homepage...
`;

const response = await hf.textGeneration({
  model: 'gpt2',
  inputs: prompt,
});

### Gemini (Google Generative Language API) Integration
If you prefer to use Google Gemini / Generative Language, configure the `GEMINI_API_KEY` and `GEMINI_API_ENDPOINT` (if necessary) and set the runtime provider to `AI_PROVIDER=gemini`. The `portfolio-generator` implementation includes a `getGeminiClient()` which maps the `messages` payload to a Gemini-compatible prompt and normalizes the response shape to the common `choices[0].message.content` form used across providers.

Example config (.env):
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta2/models/gemini-1.3:generateText
```

Notes:
- Gemini/Vertex API might require different authentication (Bearer token or an API key) depending on the platform and project configuration. The `GEMINI_BEARER` environment variable is supported if you prefer to inject a bearer token.
- The current implementation normalizes Gemini responses to keep the rest of the app unchanged.

Retry & Fallback behavior
-------------------------

The Gemini client will attempt a small number of retries for transient errors (e.g. 429, 5xx). If the requested model returns a 404 (Requested entity not found), the service will automatically retry with a fallback model (e.g. `text-bison-001`). The retry count and base backoff are configurable via environment variables:

```env
GEMINI_MAX_RETRIES=3
GEMINI_BACKOFF_MS=250
GEMINI_FALLBACK_MODEL=text-bison-001
```

This improves resiliency when using API keys that have limited access to new or advanced models. If you need stricter control over model selection, set `GEMINI_DEFAULT_MODEL` to your authorized model name and provide appropriate API key/permission scope.

```

## Testing

### Manual Testing

Run the test script:

```bash
npx tsx scripts/test-portfolio.ts
```

### Integration Testing

```typescript
// Test portfolio generation
const response = await fetch('/api/portfolio/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ resumeId: 'test-id' }),
});

expect(response.status).toBe(201);
```

### E2E Testing

```typescript
// Test complete workflow
1. Upload resume
2. Upload photos
3. Generate portfolio
4. View public pages
5. Submit contact form
```

## Configuration

### Environment Variables

```env
# Database
DB_URL=postgresql://user:pass@localhost:5432/portfolio_db

# File Storage
S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# AI (optional)
OPENAI_API_KEY=sk-...
HF_API_TOKEN=hf_...

# Limits
MAX_RESUMES_FREE=2
MAX_PHOTOS=3
MAX_FILE_SIZE_MB=10
```

## Troubleshooting

### Database Connection Issues

```bash
# Check connection
psql $DB_URL

# Run migrations
npm run db:init
```

### File Upload Issues

```bash
# Check S3 credentials
aws s3 ls s3://your-bucket

# Test upload
curl -X POST /api/upload/resume \
  -F "resume=@test.pdf" \
  -H "Cookie: accessToken=..."
```

### Portfolio Generation Issues

```bash
# Check logs
tail -f logs/portfolio-generation.log

# Test AI service
npm run test:ai
```

## Future Enhancements

1. **Real AI Integration**: Replace mock with Hugging Face/OpenAI
2. **Resume Parsing**: Extract structured data from PDFs
3. **Theme Customization**: Allow users to customize colors
4. **Analytics**: Track portfolio views and interactions
5. **SEO Optimization**: Add meta tags for better search ranking
6. **Custom Domains**: Allow users to use custom domains
7. **Premium Features**: More resumes, themes, analytics for paid users
8. **Template Selection**: Multiple portfolio templates
9. **A/B Testing**: Test different content variations
10. **Export Options**: Download as HTML/PDF

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues or questions:
- Open an issue on GitHub
- Contact: support@example.com
- Documentation: https://docs.example.com

## License

Proprietary - All rights reserved
