import { NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

export async function GET() {
  try {
    console.log('Testing database connection...');
    console.log('DB_URL:', process.env.DB_URL);

    const result = await query('SELECT 1 as test');
    console.log('Database test result:', result);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}