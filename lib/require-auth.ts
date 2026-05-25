import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySession } from './auth';

/**
 * Use at the top of every protected API handler:
 *
 *   const unauth = await requireAuth();
 *   if (unauth) return unauth;
 *
 * Returns a 401 NextResponse on failure, or `null` when the session is valid.
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!verifySession(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
