import { config } from 'dotenv';
import { initializeDatabase } from '../src/lib/db/init.js';

config({ path: '.env.local' });

async function runInit() {
  console.log('Initializing database...');
  const success = await initializeDatabase();
  if (success) {
    console.log('Database initialization completed successfully');
  } else {
    console.log('Database initialization failed');
  }
  process.exit(0);
}

runInit();