import 'server-only';
import { getDb } from './firebase-admin';
import { DAYS } from './constants';

const STATUSES = [
  'viendo',
  'en_pausa',
  'terminado',
  'pendiente',
  'dropeado',
  'ni_en_un_millon',
] as const;
type Status = (typeof STATUSES)[number];

const USERS = ['eze', 'pancho'] as const;
type UserId = (typeof USERS)[number];

export function isValidStatus(v: unknown): v is Status {
  return typeof v === 'string' && (STATUSES as readonly string[]).includes(v);
}

export function isValidUser(v: unknown): v is UserId {
  return typeof v === 'string' && (USERS as readonly string[]).includes(v);
}

export function isValidDay(v: unknown): v is string {
  if (v === '' || v === 'undefined' || v == null) return true; // allowed empty
  return typeof v === 'string' && (DAYS as readonly string[]).includes(v);
}

export function isFiniteNonNegativeInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 10000;
}

const SEIYUU_IDS = ['koyasu', 'hanazawa'] as const;

export function isValidSeiyuuArray(v: unknown): v is string[] {
  return (
    Array.isArray(v) &&
    v.length <= SEIYUU_IDS.length &&
    v.every((s) => (SEIYUU_IDS as readonly string[]).includes(s))
  );
}

export function isEpisodeArray(v: unknown): v is number[] {
  return (
    Array.isArray(v) &&
    v.length <= 5000 &&
    v.every((n) => typeof n === 'number' && Number.isInteger(n) && n > 0 && n < 10000)
  );
}

/**
 * Validate that `seasonId` corresponds to a real season in the `seasons`
 * collection. Without this, a request could pass any string as a Firestore
 * collection path and read/write arbitrary data.
 *
 * Cached in-process for 60s to avoid hammering Firestore on every request.
 */
const seasonCache: { ids: Set<string>; expiresAt: number } = {
  ids: new Set(),
  expiresAt: 0,
};

export async function isKnownSeasonId(seasonId: unknown): Promise<boolean> {
  if (typeof seasonId !== 'string' || seasonId.length === 0) return false;
  // Disallow special Firestore path characters / very long ids.
  if (!/^[a-z0-9_]{1,80}$/.test(seasonId)) return false;

  const now = Date.now();
  if (now > seasonCache.expiresAt) {
    const snap = await getDb().collection('seasons').get();
    seasonCache.ids = new Set(
      snap.docs.map((d) => (d.data().collectionId as string) || d.id),
    );
    seasonCache.expiresAt = now + 60_000;
  }
  return seasonCache.ids.has(seasonId);
}

/** Invalidate the seasons cache after creating one. */
export function invalidateSeasonCache(): void {
  seasonCache.expiresAt = 0;
}
