import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';

// Stub — real seasons logic lives in /api/anime?season=... GET handler.
// Kept for backwards compat with any external link or future split.
export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  return NextResponse.json([]);
}
