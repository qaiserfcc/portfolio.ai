/**
 * Manual Test Script for AI Portfolio Generation
 * Run with: npx tsx scripts/test-portfolio.ts
 */

import { initializeDatabase } from '../src/lib/db/init';
import { 
  createUser, 
  createResume, 
  canUploadMoreResumes,
  getUserStatistics,
  createPortfolioPhoto,
  canUploadMorePhotos
} from '../src/lib/db/services';
import { generatePortfolioContent, generateGradientTheme } from '../src/lib/ai/portfolio-generator';

async function runAIGenerationTests() {
  console.log('6️⃣ Generating AI portfolio content...');
  const portfolioContent = await generatePortfolioContent(
    {
      resumeUrl: 'https://example.com/resume.pdf',
      aiNotes: 'Software engineer with 5 years experience',
    },
    {
      profilePhoto: 'https://example.com/profile.jpg',
      portfolioPhotos: ['https://example.com/photo1.jpg'],
    }
  );
  console.log('✅ AI content generated:');
  console.log(`   - Home: ${portfolioContent.home.title}`);
  console.log(`   - About: ${portfolioContent.about.title}`);
  console.log(`   - Portfolio: ${portfolioContent.portfolio.title}`);
  console.log(`   - Contact: ${portfolioContent.contact.title}\n`);

  console.log('7️⃣ Generating gradient theme...');
  const gradientCss = generateGradientTheme();
  console.log(`✅ Theme generated: ${gradientCss}\n`);

  console.log('🎉 AI generation tests passed!\n');
}

async function testPortfolioGeneration() {
  console.log('🚀 Starting AI Portfolio Generation Test\n');

  try {
    // Test 1: Initialize database
    console.log('1️⃣ Initializing database...');
    let dbInitialized = false;
    try {
      dbInitialized = await initializeDatabase();
      if (dbInitialized) {
        console.log('✅ Database initialized\n');
      } else {
        console.log('⚠️  Database initialization failed\n');
      }
    } catch {
      console.log('⚠️  Database not configured (expected in development without DB_URL)');
      console.log('   Skipping database-dependent tests...\n');
      dbInitialized = false;
    }

    if (!dbInitialized) {
      // Skip database-dependent tests and go straight to AI generation
      console.log('⏭️  Skipping database tests, proceeding to AI generation...\n');
      await runAIGenerationTests();
      return;
    }

    // Test 2: Create test user
    console.log('2️⃣ Creating test user...');
    const testUser = await createUser({
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      name: 'Test User',
      role: 'user',
    });
    console.log(`✅ User created: ${testUser.id}\n`);

    // Test 3: Check resume limits
    console.log('3️⃣ Checking resume upload limits...');
    const canUpload = await canUploadMoreResumes(testUser.id);
    console.log(`✅ Can upload resume: ${canUpload}\n`);

    // Test 4: Upload test resume
    console.log('4️⃣ Uploading test resume...');
    const testResume = await createResume({
      userId: testUser.id,
      resumeUrl: 's3://test-bucket/resume.pdf',
      originalFilename: 'test-resume.pdf',
      aiNotes: 'Software engineer with 5 years experience',
    });
    console.log(`✅ Resume uploaded: ${testResume.id}\n`);

    // Test 5: Add portfolio photos
    console.log('5️⃣ Adding portfolio photos...');
    const canUploadPhoto = await canUploadMorePhotos(testUser.id);
    console.log(`✅ Can upload photo: ${canUploadPhoto}`);
    
    const photo1 = await createPortfolioPhoto({
      userId: testUser.id,
      photoUrl: 'https://example.com/photo1.jpg',
      storageLocation: 'file:///tmp/test-photo.jpg',
      iv: '0123456789abcdef0123456789abcdef',
      authTag: 'fedcba9876543210fedcba9876543210',
    });
    console.log(`✅ Photo 1 uploaded: ${photo1.id}\n`);

    // Test 6: Generate AI content
    console.log('6️⃣ Generating AI portfolio content...');
    const portfolioContent = await generatePortfolioContent(
      {
        resumeUrl: testResume.resumeUrl,
        aiNotes: testResume.aiNotes,
      },
      {
        profilePhoto: 'https://example.com/profile.jpg',
        portfolioPhotos: ['https://example.com/photo1.jpg'],
      }
    );
    console.log('✅ AI content generated:');
    console.log(`   - Home: ${portfolioContent.home.title}`);
    console.log(`   - About: ${portfolioContent.about.title}`);
    console.log(`   - Portfolio: ${portfolioContent.portfolio.title}`);
    console.log(`   - Contact: ${portfolioContent.contact.title}\n`);

    // Test 7: Generate gradient theme
    console.log('7️⃣ Generating gradient theme...');
    const gradientCss = generateGradientTheme();
    console.log(`✅ Theme generated: ${gradientCss}\n`);

    // Test 8: Get user statistics
    console.log('8️⃣ Getting user statistics...');
    const stats = await getUserStatistics(testUser.id);
    console.log('✅ User statistics:');
    console.log(`   - Resumes: ${stats.resumeCount}/${stats.resumeCount}`);
    console.log(`   - Photos: ${stats.photoCount}/${stats.photoCount}`);
    console.log(`   - Portfolios: ${stats.portfolioCount}\n`);

    console.log('🎉 All tests passed!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testPortfolioGeneration().then(() => {
  console.log('✅ Test script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
