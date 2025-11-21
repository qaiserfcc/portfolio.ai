#!/usr/bin/env node

/**
 * Generate secure environment variables for the application
 * Run: node scripts/generate-env.js
 */

const crypto = require('crypto');

console.log('='.repeat(70));
console.log('Generating Secure Environment Variables');
console.log('='.repeat(70));
console.log('');

const jwtSecret = crypto.randomBytes(32).toString('hex');
const encryptionKey = crypto.randomBytes(32).toString('hex');
const sessionSecret = crypto.randomBytes(32).toString('hex');

console.log('Copy and paste the following into your .env.local file:');
console.log('');
console.log('-'.repeat(70));
console.log('');
console.log('# Authentication & Security');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log('');
console.log('# AI Configuration');
console.log('# Get your GitHub token from: https://github.com/settings/tokens');
console.log('# Token must have \'copilot\' scope for GitHub Copilot Chat API access');
console.log('GITHUB_TOKEN=your_github_token_here');
console.log('');
console.log('# Node Environment');
console.log('NODE_ENV=development');
console.log('');
console.log('-'.repeat(70));
console.log('');
console.log('For Vercel/Production deployment:');
console.log('1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
console.log('2. Add each variable above (without the "NODE_ENV=development" line)');
console.log('3. Set NODE_ENV=production for production environment');
console.log('4. Redeploy your application');
console.log('');
console.log('⚠️  IMPORTANT:');
console.log('   - Never commit .env.local to version control');
console.log('   - Use different secrets for each environment');
console.log('   - Rotate secrets periodically (every 90 days recommended)');
console.log('');
console.log('='.repeat(70));
