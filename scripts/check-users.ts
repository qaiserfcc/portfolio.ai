import { query } from '../src/lib/db/connection';

async function checkUsers() {
  try {
    const users = await query('SELECT id, email, password_hash IS NOT NULL as has_password FROM users ORDER BY created_at DESC LIMIT 5');
    console.log('Recent users:');
    users.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id}, Has password: ${user.hasPassword})`);
    });
  } catch (error) {
    console.error('Error checking users:', error);
  }
}

checkUsers();