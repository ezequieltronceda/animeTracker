import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, verifySession } from '@/lib/auth';

/** Lightweight check used by the client to decide login vs app on first load. */
export async function GET() {
  const store = await cookies();
  const ok = verifySession(store.get(SESSION_COOKIE_NAME)?.value);
  return NextResponse.json({ ok });
}
