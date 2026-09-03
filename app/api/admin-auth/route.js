import { NextResponse } from 'next/server';

const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || 'zerobar2026';

export async function POST(request) {
  try {
    const { passcode } = await request.json();
    if (passcode === ADMIN_KEY) {
      return NextResponse.json({ authenticated: true });
    }
    return NextResponse.json({ authenticated: false, error: 'Invalid admin key' }, { status: 401 });
  } catch {
    return NextResponse.json({ authenticated: false, error: 'Bad request' }, { status: 400 });
  }
}
