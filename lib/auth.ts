import 'server-only';
import crypto from 'crypto';

/**
 * Server-side session helper. Stateless cookie of the form `<payload>.<sig>`
 * signed with HMAC-SHA256 using SESSION_SECRET. No DB hit on auth checks.
 *
 * Required env vars (in .env.local, NOT NEXT_PUBLIC_*):
 *   AUTH_PASSWORD  — the single shared password for the app
 *   SESSION_SECRET — 32+ bytes of random data, e.g. `openssl rand -base64 48`
 */

const COOKIE_NAME = 'session';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'SESSION_SECRET env var is missing or too short. Set it in .env.local (≥16 chars).',
    );
  }
  return secret;
}

function b64urlEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function hmac(input: string): string {
  return b64urlEncode(
    crypto.createHmac('sha256', getSecret()).update(input).digest(),
  );
}

interface SessionPayload {
  exp: number; // ms-epoch expiry
}

/** Build a fresh signed session token + the Date it expires on. */
export function createSession(): { token: string; expires: Date } {
  const payload: SessionPayload = { exp: Date.now() + WEEK_MS };
  const data = b64urlEncode(Buffer.from(JSON.stringify(payload)));
  const sig = hmac(data);
  return { token: `${data}.${sig}`, expires: new Date(payload.exp) };
}

/** Verify a token string. Returns true iff signature matches and not expired. */
export function verifySession(token: string | undefined | null): boolean {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = hmac(data);
  // Constant-time compare to avoid timing leaks.
  if (sig.length !== expected.length) return false;
  if (
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return false;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(
        data.replace(/-/g, '+').replace(/_/g, '/'),
        'base64',
      ).toString('utf8'),
    ) as SessionPayload;
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

/** Validate raw password against AUTH_PASSWORD env var using timing-safe compare. */
export function isValidPassword(input: string): boolean {
  const expected = process.env.AUTH_PASSWORD;
  if (!expected) {
    throw new Error(
      'AUTH_PASSWORD env var is missing. Set it in .env.local.',
    );
  }
  if (typeof input !== 'string') return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
