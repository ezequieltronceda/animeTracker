import 'server-only';
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * Server-side Firestore via the Admin SDK. Bypasses Firestore security rules
 * because it authenticates with service account credentials, so we can lock
 * the rules down completely while still letting our API routes read/write.
 *
 * Required env vars in .env.local (NOT NEXT_PUBLIC_*):
 *   FIREBASE_ADMIN_PROJECT_ID   — same as your NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   FIREBASE_ADMIN_CLIENT_EMAIL — from the service account JSON
 *   FIREBASE_ADMIN_PRIVATE_KEY  — from the service account JSON, with literal
 *                                 \n preserved (we re-expand on load).
 *
 * To get a service account JSON:
 *   1. Firebase Console → Project Settings → Service accounts tab
 *   2. "Generate new private key" — downloads a JSON file
 *   3. Extract project_id, client_email, private_key from that JSON
 *   4. Paste into .env.local (the private_key value is multi-line; either
 *      wrap it in double quotes OR replace newlines with literal \n).
 */

function init(): App {
  if (getApps().length > 0) return getApp();

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Env files often store the key with literal `\n` sequences instead of
  // actual newlines. Re-expand so the PEM parser is happy.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    '\n',
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase admin env vars. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY in .env.local.',
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

let _db: Firestore | undefined;

export function getDb(): Firestore {
  if (!_db) _db = getFirestore(init());
  return _db;
}
