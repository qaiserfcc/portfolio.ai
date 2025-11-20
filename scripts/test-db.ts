import { initializeDatabase } from '../src/lib/db/init';
import { createUser, findUserByEmail } from '../src/lib/db/services';
import { hashPassword, verifyPassword } from '../src/lib/security/auth';

async function testDatabaseConnection() {
  console.log('Testing database connection...');

  try {
    // Initialize database
    const initResult = await initializeDatabase();
    console.log('Database initialization:', initResult ? 'SUCCESS' : 'FAILED');

    if (!initResult) {
      console.error('Failed to initialize database');
      return;
    }

    // Test user creation
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';

    console.log('Creating test user...');
    const hashedPassword = await hashPassword(testPassword);
    const user = await createUser({
      email: testEmail,
      passwordHash: hashedPassword,
    });

    console.log('User created:', user.id);

    // Test user lookup
    console.log('Finding user by email...');
    const foundUser = await findUserByEmail(testEmail);
    console.log('User found:', foundUser?.id);

    // Test password verification
    console.log('Testing password verification...');
    if (foundUser?.passwordHash) {
      const isValid = await verifyPassword(testPassword, foundUser.passwordHash);
      console.log('Password verification:', isValid ? 'SUCCESS' : 'FAILED');
    } else {
      console.log('Password hash is undefined!');
    }

  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testDatabaseConnection();