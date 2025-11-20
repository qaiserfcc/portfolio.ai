/**
 * Test script for user registration functionality
 */

import { createUser, findUserByEmail } from '../src/lib/db/services';
import { hashPassword, verifyPassword } from '../src/lib/security/auth';

async function testRegistration() {
  console.log('Testing user registration...');

  try {
    // Test user creation
    const passwordHash = await hashPassword('testpassword123');
    const user = await createUser({
      email: 'testuser@example.com',
      passwordHash,
      name: 'Test User',
      role: 'user',
      emailVerified: false,
      isActive: true,
    });

    console.log('✅ User created:', user.id, user.email);
    console.log('Password hash in user object:', user.passwordHash);
    console.log('Full user object:', JSON.stringify(user, null, 2));

    // Test user lookup
    const foundUser = await findUserByEmail('testuser@example.com');
    if (foundUser) {
      console.log('✅ User found by email:', foundUser.email);

      // Test password verification
      const isValid = await verifyPassword('testpassword123', foundUser.passwordHash!);
      console.log('✅ Password verification:', isValid ? 'PASSED' : 'FAILED');
    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRegistration();