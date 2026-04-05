import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDoc, doc, setDoc } from 'firebase/firestore';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4/anime';
const CACHE_TTL_HOURS = 24;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const malId = searchParams.get('id');

  if (!malId) {
    return NextResponse.json({ error: 'MAL ID is required' }, { status: 400 });
  }

  try {
    const cacheRef = doc(db, 'jikan_cache', malId);
    const cached = await getDoc(cacheRef);

    if (cached.exists()) {
      const cachedData = cached.data();
      const cacheAge = Date.now() - cachedData.cachedAt;
      const ttlMs = CACHE_TTL_HOURS * 60 * 60 * 1000;

      if (cacheAge < ttlMs) {
        return NextResponse.json(cachedData.data);
      }
    }

    const response = await fetch(`${JIKAN_BASE_URL}/${malId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch from Jikan');
    }

    const data = await response.json();
    
    await setDoc(cacheRef, {
      data: data.data,
      cachedAt: Date.now(),
    }, { merge: true });
    
    return NextResponse.json(data.data);
  } catch (error) {
    console.error('Error fetching from Jikan:', error);
    return NextResponse.json({ error: 'Failed to fetch anime data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  
  try {
    const body = await request.json();
    const { malId, day } = body;

    if (!malId || !day) {
      return NextResponse.json({ error: 'MAL ID and day are required' }, { status: 400 });
    }

    const jikanResponse = await fetch(`${JIKAN_BASE_URL}/${malId}`);
    if (!jikanResponse.ok) {
      throw new Error('Failed to fetch from Jikan');
    }
    const jikanData = await jikanResponse.json();
    const animeData = jikanData.data;

    const cacheRef = doc(db, 'jikan_cache', malId.toString());
    await setDoc(cacheRef, {
      data: animeData,
      cachedAt: Date.now(),
    }, { merge: true });

    const { db: firestore } = await import('@/lib/firebase');
    const { collection, addDoc, getDocs, query, orderBy, limit } = await import('firebase/firestore');
    
    const orderQuery = query(collection(firestore, 'animes'), orderBy('order', 'desc'), limit(1));
    const orderSnapshot = await getDocs(orderQuery);
    const nextOrder = orderSnapshot.empty ? 1 : orderSnapshot.docs[0].data().order + 1;

    const animeEntry = {
      malId: animeData.mal_id,
      jikanUrl: animeData.url,
      title: animeData.title_english || animeData.title,
      imageUrl: animeData.images?.jpg?.large_image_url || animeData.images?.jpg?.image_url || '',
      day,
      order: nextOrder,
      season: animeData.season || 'unknown',
      year: animeData.year || new Date().getFullYear(),
      episodes: animeData.episodes || 0,
      users: {
        eze: {
          status: 'pendiente',
          episodesWatched: [],
        },
        pancho: {
          status: 'pendiente',
          episodesWatched: [],
        },
      },
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(firestore, 'animes'), animeEntry);
    
    return NextResponse.json({ id: docRef.id, ...animeEntry });
  } catch (error) {
    console.error('Error creating anime:', error);
    return NextResponse.json({ error: 'Failed to create anime' }, { status: 500 });
  }
}