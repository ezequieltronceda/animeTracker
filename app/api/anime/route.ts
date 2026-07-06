import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit } from '@/lib/rate-limit';
import {
  invalidateSeasonCache,
  isEpisodeArray,
  isFiniteNonNegativeInt,
  isKnownSeasonId,
  isValidDay,
  isValidMalId,
  isValidSeiyuuArray,
  isValidStatus,
  isValidUser,
} from '@/lib/api-validation';

// Factory — DO NOT cache a NextResponse instance, its body stream is consumed
// on the first response and subsequent uses yield empty bodies.
const generic500 = () =>
  NextResponse.json({ error: 'Internal error' }, { status: 500 });

async function fetchJikanScore(malId: number): Promise<number | undefined> {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data.data?.score;
  } catch (e) {
    console.error('[api/anime] Jikan score fetch failed:', e);
    return undefined;
  }
}

export async function GET(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { searchParams } = new URL(request.url);
  const seasonId = searchParams.get('season');

  try {
    const db = getDb();
    const seasonsSnap = await db.collection('seasons').get();

    const seasons = seasonsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: (data.collectionId as string) || d.id,
        name: (data.name as string) || d.id,
      };
    });

    if (!seasonId) {
      return NextResponse.json({ seasons, animes: [] });
    }

    if (!(await isKnownSeasonId(seasonId))) {
      return NextResponse.json({ error: 'Invalid season' }, { status: 400 });
    }

    const animesSnap = await db.collection(seasonId).get();

    const animes = await Promise.all(
      animesSnap.docs.map(async (d) => {
        const data = d.data();
        let score = data.score;

        if (!score && data.malId) {
          score = await fetchJikanScore(data.malId);
          if (score) {
            await db.collection(seasonId).doc(d.id).update({ score });
          }
        }

        return {
          id: d.id,
          seasonId,
          ...data,
          score,
        };
      }),
    );

    return NextResponse.json({ seasons, animes });
  } catch (error) {
    console.error('[api/anime] GET failed:', error);
    return generic500();
  }
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const body = await request.json();
    const { action, name, malId, day, seasonId } = body ?? {};
    const db = getDb();

    if (action === 'createSeason') {
      if (typeof name !== 'string' || name.length === 0 || name.length > 80) {
        return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
      }
      const collectionId = name.toLowerCase().replace(/\s+/g, '_');
      if (!/^[a-z0-9_]{1,80}$/.test(collectionId)) {
        return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
      }

      await db.collection('seasons').add({
        name,
        collectionId,
        createdAt: new Date(),
      });
      invalidateSeasonCache();

      return NextResponse.json({ id: collectionId, name, collectionId });
    }

    if (action === 'createAnime') {
      if (!isValidMalId(malId)) {
        return NextResponse.json({ error: 'Invalid malId' }, { status: 400 });
      }
      if (!(await isKnownSeasonId(seasonId))) {
        return NextResponse.json({ error: 'Invalid season' }, { status: 400 });
      }
      if (!isValidDay(day)) {
        return NextResponse.json({ error: 'Invalid day' }, { status: 400 });
      }

      const jikanResponse = await fetch(
        `https://api.jikan.moe/v4/anime/${malId}`,
      );
      if (!jikanResponse.ok) {
        return NextResponse.json(
          { error: 'Jikan lookup failed' },
          { status: 502 },
        );
      }
      const jikanData = await jikanResponse.json();
      const animeData = jikanData.data;

      const existing = await db.collection(seasonId).get();
      const nextOrder = existing.size + 1;

      const animeDoc = {
        malId: animeData.mal_id,
        jikanUrl: animeData.url || null,
        title: animeData.title_english || animeData.title,
        titleJp: animeData.title_japanese || null,
        imageUrl:
          animeData.images?.jpg?.large_image_url ||
          animeData.images?.jpg?.image_url ||
          null,
        day,
        order: nextOrder,
        episodes: animeData.episodes || 0,
        synopsis: animeData.synopsis || null,
        genres: Array.isArray(animeData.genres)
          ? animeData.genres.map((g: { name: string }) => g.name)
          : [],
        seiyuus: [],
        users: {
          eze: { status: 'pendiente', episodesWatched: [] },
          pancho: { status: 'pendiente', episodesWatched: [] },
        },
        createdAt: new Date(),
      };

      const docRef = await db.collection(seasonId).add(animeDoc);
      return NextResponse.json({ id: docRef.id, seasonId, ...animeDoc });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[api/anime] POST failed:', error);
    return generic500();
  }
}

export async function PUT(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const body = await request.json();
    const {
      id,
      seasonId,
      user,
      status,
      episodesWatched,
      day,
      maxEpisodes,
      seiyuus,
    } = body ?? {};

    if (typeof id !== 'string' || id.length === 0 || id.length > 100) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    if (!(await isKnownSeasonId(seasonId))) {
      return NextResponse.json({ error: 'Invalid season' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (maxEpisodes !== undefined) {
      if (!isFiniteNonNegativeInt(maxEpisodes)) {
        return NextResponse.json(
          { error: 'Invalid maxEpisodes' },
          { status: 400 },
        );
      }
      updateData.maxEpisodes = maxEpisodes;
    }

    if (user !== undefined) {
      if (!isValidUser(user)) {
        return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
      }
      if (status !== undefined) {
        if (!isValidStatus(status)) {
          return NextResponse.json(
            { error: 'Invalid status' },
            { status: 400 },
          );
        }
        updateData[`users.${user}.status`] = status;
      }
      if (episodesWatched !== undefined) {
        if (!isEpisodeArray(episodesWatched)) {
          return NextResponse.json(
            { error: 'Invalid episodesWatched' },
            { status: 400 },
          );
        }
        updateData[`users.${user}.episodesWatched`] = episodesWatched;
      }
    }

    if (day !== undefined) {
      if (!isValidDay(day)) {
        return NextResponse.json({ error: 'Invalid day' }, { status: 400 });
      }
      updateData.day = day;
    }

    if (seiyuus !== undefined) {
      if (!isValidSeiyuuArray(seiyuus)) {
        return NextResponse.json({ error: 'Invalid seiyuus' }, { status: 400 });
      }
      updateData.seiyuus = seiyuus;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 },
      );
    }

    await getDb().collection(seasonId as string).doc(id).update(updateData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/anime] PUT failed:', error);
    return generic500();
  }
}

export async function DELETE(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const seasonId = searchParams.get('seasonId');

  if (typeof id !== 'string' || id.length === 0 || id.length > 100) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  if (!(await isKnownSeasonId(seasonId))) {
    return NextResponse.json({ error: 'Invalid season' }, { status: 400 });
  }
  const seasonIdStr = seasonId as string;

  try {
    await getDb().collection(seasonIdStr).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/anime] DELETE failed:', error);
    return generic500();
  }
}

export async function PATCH(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const rl = await rateLimit('anime:refreshAll', {
    limit: 1,
    windowMs: 60_000,
  });
  if (rl) return rl;

  try {
    const body = await request.json();
    const { action, seasonId } = body ?? {};

    if (action === 'refreshAll') {
      if (!(await isKnownSeasonId(seasonId))) {
        return NextResponse.json({ error: 'Invalid season' }, { status: 400 });
      }

      const db = getDb();
      const animesSnap = await db.collection(seasonId).get();

      let updated = 0;
      let failed = 0;

      for (const d of animesSnap.docs) {
        const data = d.data();
        if (!data.malId) continue;

        try {
          const res = await fetch(
            `https://api.jikan.moe/v4/anime/${data.malId}`,
            { next: { revalidate: 0 } },
          );
          if (!res.ok) {
            failed++;
            continue;
          }
          const jikanData = await res.json();
          const animeData = jikanData.data;
          if (!animeData) {
            failed++;
            continue;
          }

          const updateData: Record<string, unknown> = {};
          if (animeData.score) updateData.score = animeData.score;
          if (animeData.episodes && animeData.episodes > 0)
            updateData.episodes = animeData.episodes;
          if (animeData.images?.jpg?.image_url)
            updateData.imageUrl = animeData.images.jpg.image_url;
          if (animeData.title) updateData.title = animeData.title;
          if (animeData.url) updateData.jikanUrl = animeData.url;
          if (animeData.title_japanese)
            updateData.titleJp = animeData.title_japanese;
          if (animeData.synopsis) updateData.synopsis = animeData.synopsis;
          if (Array.isArray(animeData.genres)) {
            updateData.genres = animeData.genres.map(
              (g: { name: string }) => g.name,
            );
          }

          if (Object.keys(updateData).length > 0) {
            await db.collection(seasonId).doc(d.id).update(updateData);
            updated++;
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (e) {
          console.error(`[api/anime] refresh ${d.id} failed:`, e);
          failed++;
        }
      }

      return NextResponse.json({
        success: true,
        updated,
        failed,
        total: animesSnap.size,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[api/anime] PATCH failed:', error);
    return generic500();
  }
}
