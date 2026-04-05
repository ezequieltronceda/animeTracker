import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getDocs, collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

async function fetchJikanScore(malId: number): Promise<number | undefined> {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}`, { next: { revalidate: 3600 } });
    const data = await res.json();
    return data.data?.score;
  } catch (e) {
    console.error('Error fetching score:', e);
    return undefined;
  }
}

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
    
    const animes = await Promise.all(animesSnapshot.docs.map(async (d) => {
      const data = d.data();
      let score = data.score;
      
      if (!score && data.malId) {
        score = await fetchJikanScore(data.malId);
        if (score) {
          const animeRef = doc(db, seasonId, d.id);
          await updateDoc(animeRef, { score });
        }
      }
      
      return {
        id: d.id,
        seasonId,
        ...data,
        score,
      };
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
      if (!malId || !seasonId) {
        return NextResponse.json({ error: 'MAL ID and season are required' }, { status: 400 });
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
    const { id, seasonId, user, status, episodesWatched, day, maxEpisodes } = body;

    if (!id || !seasonId) {
      return NextResponse.json({ error: 'ID and seasonId are required' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};

    if (maxEpisodes !== undefined) {
      updateData.maxEpisodes = maxEpisodes;
    }

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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, seasonId } = body;

    if (action === 'refreshAll') {
      if (!seasonId) {
        return NextResponse.json({ error: 'Season ID is required' }, { status: 400 });
      }

      const animesRef = collection(db, seasonId);
      const animesSnapshot = await getDocs(animesRef);
      
      let updated = 0;
      let failed = 0;

      for (const d of animesSnapshot.docs) {
        const data = d.data();
        
        if (!data.malId) {
          continue;
        }

        try {
          const res = await fetch(`https://api.jikan.moe/v4/anime/${data.malId}`, { 
            next: { revalidate: 0 } 
          });
          
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

          const updateData: Record<string, any> = {};
          
          if (animeData.score) {
            updateData.score = animeData.score;
          }
          if (animeData.episodes && animeData.episodes > 0) {
            updateData.episodes = animeData.episodes;
          }
          if (animeData.images?.jpg?.image_url) {
            updateData.imageUrl = animeData.images.jpg.image_url;
          }
          if (animeData.title) {
            updateData.title = animeData.title;
          }

          if (Object.keys(updateData).length > 0) {
            const animeRef = doc(db, seasonId, d.id);
            await updateDoc(animeRef, updateData);
            updated++;
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (e) {
          console.error(`Error updating anime ${d.id}:`, e);
          failed++;
        }
      }

      return NextResponse.json({ 
        success: true, 
        updated,
        failed,
        total: animesSnapshot.size 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in PATCH:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}