import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeResumeContent } from '../portfolio-generator';

describe('Gemini fallback behavior', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Force provider to gemini
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'fake-key';
    process.env.GEMINI_DEFAULT_MODEL = 'gemini-1.3';
    process.env.GEMINI_FALLBACK_MODEL = 'text-bison-001';
    process.env.GEMINI_API_ENDPOINT = 'https://fake.endpoint/v1/models/gemini-1.3:generateText';
  });

  afterEach(() => {
    // restore env
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should use fallback model when primary returns 404', async () => {
    let callCount = 0;
    // Mock fetch to return 404 for primary model, 200 for fallback with content
    vi.stubGlobal('fetch', async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          text: async () => 'Not Found',
          json: async () => ({})
        } as unknown as Response;
      }

      // fallback response: return content as a JSON string inside candidates
      const contentJson = JSON.stringify({
        skills: ['Node.js', 'React'],
        experience: '3 years of experience',
        professionalTitle: 'Software Developer',
        keyAchievements: ['Built product X'],
        education: 'BS Computer Science',
        summary: 'Experienced developer.'
      });

      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ candidates: [{ content: contentJson }] }),
      } as unknown as Response;
    });

    const analysis = await analyzeResumeContent('Some fake resume content');
    expect(analysis.skills).toContain('Node.js');
    expect(callCount).toBe(2);
  });

  it('should retry on 429 throttling and eventually succeed', async () => {
    let callCount = 0;
    vi.stubGlobal('fetch', async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          text: async () => 'Too Many Requests',
          json: async () => ({})
        } as unknown as Response;
      }

      const contentJson = JSON.stringify({
        skills: ['TypeScript', 'Node.js'],
        experience: '5 years',
        professionalTitle: 'Senior Developer',
        keyAchievements: ['Scaled system'],
        education: 'MS Computer Science',
        summary: 'Skilled engineer.'
      });

      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ candidates: [{ content: contentJson }] }),
      } as unknown as Response;
    });

    const analysis = await analyzeResumeContent('Resume for throttling test');
    expect(analysis.skills).toContain('TypeScript');
    expect(callCount).toBe(2);
  });
});
