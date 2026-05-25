import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSession, isValidPassword, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const password =
    typeof body === 'object' && body !== null && 'password' in body
      ? (body as { password: unknown }).password
      : undefined;

  if (typeof password !== 'string') {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  try {
    if (!isValidPassword(password)) {
      return NextResponse.json({ error: 'Clave incorrecta' }, { status: 401 });
    }
  } catch (e) {
    console.error('Auth config error:', e);
    return NextResponse.json(
      { error: 'Auth no configurada en el server' },
      { status: 500 },
    );
  }

  const { token, expires } = createSession();
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  });

  return NextResponse.json({ ok: true });
}
