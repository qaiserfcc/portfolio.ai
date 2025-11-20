/**
 * Test Photo Deletion Fix
 * Run with: npx tsx scripts/test-photo-deletion.ts
 */

import { config } from 'dotenv';
import { initializeDatabase } from '../src/lib/db/init';
import { createUser, createPortfolioPhoto, deletePortfolioPhoto } from '../src/lib/db/services';

// Load environment variables
config({ path: '.env.local' });

async function testPhotoDeletion() {
  console.log('🧪 Testing Photo Deletion Fix\n');

  try {
    // Initialize database
    console.log('1️⃣ Initializing database...');
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.log('❌ Database not configured');
      return;
    }
    console.log('✅ Database initialized\n');

    // Create test user
    console.log('2️⃣ Creating test user...');
    const testUser = await createUser({
      email: `test-photo-delete-${Date.now()}@example.com`,
      passwordHash: 'hashed_password',
      name: 'Test User',
      role: 'user',
    });
    console.log(`✅ User created: ${testUser.id}\n`);

    // Create test photo
    console.log('3️⃣ Creating test photo...');
    const testPhoto = await createPortfolioPhoto({
      userId: testUser.id,
      photoUrl: 'https://example.com/test-photo.jpg',
      storageLocation: 'file:///tmp/test-photo.jpg',
      iv: '0123456789abcdef0123456789abcdef',
      authTag: 'fedcba9876543210fedcba9876543210',
    });
    console.log(`✅ Photo created: ${testPhoto.id}\n`);

    // Test deletion
    console.log('4️⃣ Testing photo deletion...');
    const deleteResult = await deletePortfolioPhoto(testPhoto.id);
    console.log(`✅ Delete result: ${deleteResult}\n`);

    if (deleteResult) {
      console.log('🎉 Photo deletion test PASSED! No 500 error.\n');
    } else {
      console.log('❌ Photo deletion test FAILED! Delete returned false.\n');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
testPhotoDeletion().then(() => {
  console.log('✅ Photo deletion test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Photo deletion test failed:', error);
  process.exit(1);
});