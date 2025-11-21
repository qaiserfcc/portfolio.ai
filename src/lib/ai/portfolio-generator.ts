/**
 * AI Content Generation Service
 * Uses Together AI API to generate personalized portfolio content from resume data
 */

import { PageType } from '../db/schema';

export interface ResumeData {
  resumeUrl: string;
  aiNotes?: string;
  linkedInUrl?: string;
}

export interface UserPhotos {
  profilePhoto?: string;
  portfolioPhotos: string[];
}

export interface GeneratedContent {
  title: string;
  content: string;
}

export interface PortfolioContent {
  home: GeneratedContent;
  about: GeneratedContent;
  portfolio: GeneratedContent;
  contact: GeneratedContent;
}

export interface ResumeAnalysis {
  skills: string[];
  experience: string;
  professionalTitle: string;
  keyAchievements: string[];
  education: string;
  summary: string;
}

interface TogetherMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface TogetherCompletionParams {
  messages: TogetherMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

interface TogetherResponse {
  choices: Array<{
    message?: {
      content?: string;
    };
  }>;
}

let togetherClient: { chat: { completions: { create: (params: TogetherCompletionParams) => Promise<TogetherResponse> } } } | null = null;

function getTogetherClient() {
  if (!togetherClient) {
    if (!process.env.TOGETHER_API_KEY) {
      throw new Error('Together AI API key not configured. Please set TOGETHER_API_KEY environment variable.');
    }

    // Use Together AI API (free tier available)
    togetherClient = {
      chat: {
        completions: {
          create: async (params: TogetherCompletionParams) => {
            const response = await fetch('https://api.together.xyz/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                messages: params.messages,
                model: params.model || 'meta-llama/Llama-3.3-70B-Instruct-Turbo', // Llama 3.3 70B Instruct (free tier)
                temperature: params.temperature || 0.7,
                max_tokens: params.max_tokens || 1000,
                stream: false
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Together AI API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            return await response.json();
          }
        }
      }
    };
  }
  return togetherClient;
}

/**
 * Generate a random gradient theme CSS
 */
export function generateGradientTheme(): string {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'linear-gradient(135deg, #f8b500 0%, #fceabb 100%)',
  ];

  return gradients[Math.floor(Math.random() * gradients.length)];
}

/**
 * Extract key information from resume content using AI
 */
async function analyzeResumeContent(resumeText: string): Promise<ResumeAnalysis> {

  const prompt = `
Analyze the following resume content and extract key information. Return a JSON object with the following structure:
{
  "skills": ["skill1", "skill2", "skill3", ...] - top 8-10 most relevant technical and soft skills,
  "experience": "brief summary of professional experience",
  "professionalTitle": "most appropriate professional title based on experience",
  "keyAchievements": ["achievement1", "achievement2", "achievement3", ...] - 3-5 key accomplishments,
  "education": "highest education level and field",
  "summary": "2-3 sentence professional summary"
}

Resume content:
${resumeText}

Return only valid JSON, no additional text or formatting.`;

  try {
    const response = await getTogetherClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Together AI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error analyzing resume content:', error);
    // Fallback to basic extraction
    return {
      skills: ['JavaScript', 'React', 'Node.js', 'Problem Solving'],
      experience: 'Professional software development experience',
      professionalTitle: 'Software Developer',
      keyAchievements: ['Delivered multiple successful projects', 'Collaborated with cross-functional teams'],
      education: 'Bachelor\'s degree in Computer Science',
      summary: 'Experienced software developer passionate about creating innovative solutions.'
    };
  }
}

/**
 * Generate personalized home page content
 */
async function generateHomeContent(
  resumeAnalysis: ResumeAnalysis,
  userPhotos: UserPhotos
): Promise<GeneratedContent> {
  const prompt = `
Create a compelling hero section for a professional portfolio website. Based on the following information:

Professional Title: ${resumeAnalysis.professionalTitle}
Skills: ${resumeAnalysis.skills.join(', ')}
Summary: ${resumeAnalysis.summary}

Generate a JSON object with this structure:
{
  "hero": {
    "greeting": "Hello, I am",
    "name": "Professional Name (use a generic name like 'Alex Johnson' if not specified)",
    "tagline": "A compelling 8-12 word tagline highlighting expertise",
    "description": "A 15-20 word description of professional focus",
    "backgroundImage": "${userPhotos.portfolioPhotos[0] || null}"
  }
}

Return only valid JSON.`;

  try {
    const response = await getTogetherClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || '{}';
    return {
      title: 'Welcome to My Portfolio',
      content: content
    };
  } catch (error) {
    console.error('Error generating home content:', error);
    // Fallback content
    return {
      title: 'Welcome to My Portfolio',
      content: JSON.stringify({
        hero: {
          greeting: 'Hello, I am',
          name: 'Professional Developer',
          tagline: `Expert in ${resumeAnalysis.skills.slice(0, 3).join(' and ')}`,
          description: resumeAnalysis.summary,
          backgroundImage: userPhotos.portfolioPhotos[0] || null
        }
      })
    };
  }
}

/**
 * Generate detailed about page content
 */
async function generateAboutContent(
  resumeAnalysis: ResumeAnalysis,
  userPhotos: UserPhotos
): Promise<GeneratedContent> {
  const prompt = `
Create detailed about page content for a professional portfolio. Use this information:

Professional Title: ${resumeAnalysis.professionalTitle}
Experience: ${resumeAnalysis.experience}
Skills: ${resumeAnalysis.skills.join(', ')}
Key Achievements: ${resumeAnalysis.keyAchievements.join(', ')}
Education: ${resumeAnalysis.education}
Summary: ${resumeAnalysis.summary}

Generate a JSON object with this structure:
{
  "sections": [
    {
      "heading": "Professional Background",
      "content": "2-3 paragraphs about professional journey, experience, and expertise",
      "image": "${userPhotos.profilePhoto || userPhotos.portfolioPhotos[0]}"
    },
    {
      "heading": "Technical Expertise",
      "content": "Detailed description of technical skills and specializations",
      "image": "${userPhotos.portfolioPhotos[1] || userPhotos.portfolioPhotos[0]}"
    },
    {
      "heading": "Key Achievements",
      "content": "Highlight of major accomplishments and impact",
      "image": "${userPhotos.portfolioPhotos[2] || userPhotos.portfolioPhotos[0]}"
    }
  ]
}

Make the content engaging, professional, and personalized. Return only valid JSON.`;

  try {
    const response = await getTogetherClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content || '{}';
    return {
      title: 'About Me',
      content: content
    };
  } catch (error) {
    console.error('Error generating about content:', error);
    // Fallback content
    return {
      title: 'About Me',
      content: JSON.stringify({
        sections: [
          {
            heading: 'Professional Background',
            content: resumeAnalysis.summary + ' ' + resumeAnalysis.experience,
            image: userPhotos.profilePhoto || userPhotos.portfolioPhotos[0]
          },
          {
            heading: 'Technical Expertise',
            content: `Specialized in ${resumeAnalysis.skills.slice(0, 6).join(', ')} with a focus on delivering high-quality solutions.`,
            image: userPhotos.portfolioPhotos[1] || userPhotos.portfolioPhotos[0]
          }
        ]
      })
    };
  }
}

/**
 * Generate portfolio/projects content
 */
async function generatePortfolioContentAI(
  resumeAnalysis: ResumeAnalysis
): Promise<GeneratedContent> {
  const prompt = `
Based on this professional profile, generate 3-4 relevant project examples:

Professional Title: ${resumeAnalysis.professionalTitle}
Skills: ${resumeAnalysis.skills.join(', ')}
Experience: ${resumeAnalysis.experience}
Key Achievements: ${resumeAnalysis.keyAchievements.join(', ')}

Generate a JSON object with this structure:
{
  "projects": [
    {
      "id": 1,
      "title": "Project Title",
      "description": "Detailed 2-3 sentence description of the project",
      "technologies": ["tech1", "tech2", "tech3", "tech4"] - technologies used from the skills list
    }
  ],
  "skills": ["skill1", "skill2", ...] - all skills from the analysis
}

Make projects realistic and relevant to the person's background. Return only valid JSON.`;

  try {
    const response = await getTogetherClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || '{}';
    return {
      title: 'My Portfolio',
      content: content
    };
  } catch (error) {
    console.error('Error generating portfolio content:', error);
    // Fallback content
    return {
      title: 'My Portfolio',
      content: JSON.stringify({
        projects: [
          {
            id: 1,
            title: 'Professional Project',
            description: 'A comprehensive project showcasing expertise in modern technologies.',
            technologies: resumeAnalysis.skills.slice(0, 4)
          }
        ],
        skills: resumeAnalysis.skills
      })
    };
  }
}

/**
 * Generate contact page content
 */
async function generateContactContent(
  resumeAnalysis: ResumeAnalysis,
  linkedInUrl?: string
): Promise<GeneratedContent> {
  const prompt = `
Create engaging contact page content for a professional portfolio:

Professional Title: ${resumeAnalysis.professionalTitle}
Summary: ${resumeAnalysis.summary}

Generate a JSON object with this structure:
{
  "introduction": "A welcoming 2-3 sentence introduction inviting collaboration",
  "contactMethods": [
    {
      "type": "email",
      "label": "Email",
      "value": "contact@example.com"
    }
    ${linkedInUrl ? `,
    {
      "type": "linkedin",
      "label": "LinkedIn",
      "value": "${linkedInUrl}"
    }` : ''}
  ]
}

Make it professional and approachable. Return only valid JSON.`;

  try {
    const response = await getTogetherClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 400,
    });

    const content = response.choices[0]?.message?.content || '{}';
    return {
      title: 'Get In Touch',
      content: content
    };
  } catch (error) {
    console.error('Error generating contact content:', error);
    // Fallback content
    return {
      title: 'Get In Touch',
      content: JSON.stringify({
        introduction: `I'm excited to connect and discuss potential opportunities. As a ${resumeAnalysis.professionalTitle}, I'm always interested in new challenges and collaborations.`,
        contactMethods: [
          {
            type: 'email',
            label: 'Email',
            value: 'contact@example.com'
          },
          ...(linkedInUrl ? [{
            type: 'linkedin',
            label: 'LinkedIn',
            value: linkedInUrl
          }] : [])
        ]
      })
    };
  }
}

/**
 * Generate AI-powered portfolio content using Together AI
 */
export async function generatePortfolioContent(
  resumeData: ResumeData,
  userPhotos: UserPhotos
): Promise<PortfolioContent> {
  try {
    // Use aiNotes if available, otherwise provide a basic fallback
    const resumeText = resumeData.aiNotes || `
      Experienced software developer with expertise in modern web technologies.
      Passionate about creating user-friendly applications and solving complex problems.
      Strong background in full-stack development with focus on scalable solutions.
      Proficient in JavaScript, React, Node.js, and cloud technologies.
    `;

    // Analyze resume content with AI
    const resumeAnalysis = await analyzeResumeContent(resumeText);

    // Generate each section in parallel for better performance
    const [home, about, portfolio, contact] = await Promise.all([
      generateHomeContent(resumeAnalysis, userPhotos),
      generateAboutContent(resumeAnalysis, userPhotos),
      generatePortfolioContentAI(resumeAnalysis),
      generateContactContent(resumeAnalysis, resumeData.linkedInUrl)
    ]);

    return { home, about, portfolio, contact };
  } catch (error) {
    console.error('Error generating portfolio content:', error);
    throw new Error('Failed to generate portfolio content');
  }
}

export async function generatePageContent(
  pageType: PageType,
  resumeData: ResumeData,
  userPhotos: UserPhotos
): Promise<GeneratedContent> {
  const allContent = await generatePortfolioContent(resumeData, userPhotos);
  return allContent[pageType];
}
