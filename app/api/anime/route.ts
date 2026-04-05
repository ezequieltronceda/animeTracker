import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getDocs, collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seasonId = searchParams.get('season');

  try {
    const seasonsRef = collection(db, 'seasons');
    const seasonsSnapshot = await getDocs(seasonsRef);
    
    const seasons = seasonsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.collectionId || doc.id,
        name: data.name || doc.id,
      };
    });

    if (!seasonId) {
      return NextResponse.json({ seasons, animes: [] });
    }

    const animesRef = collection(db, seasonId);
    const animesSnapshot = await getDocs(animesRef);
    
    const animes = animesSnapshot.docs.map(d => ({
      id: d.id,
      seasonId,
      ...d.data(),
    }));

    return NextResponse.json({ seasons, animes });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, name, malId, day, seasonId } = body;

    if (action === 'createSeason') {
      if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }

      const collectionId = name.toLowerCase().replace(/\s+/g, '_');
      
      const seasonsRef = collection(db, 'seasons');
      await addDoc(seasonsRef, {
        name,
        collectionId,
        createdAt: new Date(),
      });

      return NextResponse.json({ id: collectionId, name, collectionId });
    }

    if (action === 'createAnime') {
      if (!malId || !day || !seasonId) {
        return NextResponse.json({ error: 'MAL ID, day, and season are required' }, { status: 400 });
      }

      const jikanResponse = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
      if (!jikanResponse.ok) {
        throw new Error('Failed to fetch from Jikan');
      }
      const jikanData = await jikanResponse.json();
      const animeData = jikanData.data;

      const seasonRef = collection(db, seasonId);
      const existingDocs = await getDocs(seasonRef);
      const nextOrder = existingDocs.size + 1;

      const animeDoc = {
        malId: animeData.mal_id,
        jikanUrl: animeData.url || null,
        title: animeData.title_english || animeData.title,
        imageUrl: animeData.images?.jpg?.large_image_url || animeData.images?.jpg?.image_url || null,
        day,
        order: nextOrder,
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
        createdAt: new Date(),
      };

      const docRef = await addDoc(seasonRef, animeDoc);

      return NextResponse.json({ id: docRef.id, seasonId, ...animeDoc });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, seasonId, user, status, episodesWatched, day } = body;

    if (!id || !seasonId) {
      return NextResponse.json({ error: 'ID and seasonId are required' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};

    if (user) {
      if (status !== undefined) {
        updateData[`users.${user}.status`] = status;
      }
      if (episodesWatched !== undefined) {
        updateData[`users.${user}.episodesWatched`] = episodesWatched;
      }
    }

    if (day !== undefined) {
      updateData.day = day;
    }

    const animeRef = doc(db, seasonId, id);
    await updateDoc(animeRef, updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating anime:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const seasonId = searchParams.get('seasonId');

  if (!id || !seasonId) {
    return NextResponse.json({ error: 'ID and seasonId are required' }, { status: 400 });
  }

  try {
    const animeRef = doc(db, seasonId, id);
    await deleteDoc(animeRef);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting anime:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}