'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/store/ui-store';
import { Header } from '@/components/header';
import { AnimeTable } from '@/components/anime-table';
import { AddAnimeDrawer } from '@/components/add-anime-drawer';
import { AnimeModal } from '@/components/anime-modal';
import { ConfirmModal } from '@/components/confirm-modal';
import { sortSeasonsByDate } from '@/lib/constants';
import type { Anime, Season, User, UserStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const AUTH_PASSWORD = 'Panchoputo1';
const AUTH_KEY = 'pageAuthenticated';
const AUTH_EXPIRY_KEY = 'pageAuthExpiry';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function LoginScreen() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (password === AUTH_PASSWORD) {
      const expiry = Date.now() + ONE_WEEK_MS;
      localStorage.setItem(AUTH_KEY, 'true');
      localStorage.setItem(AUTH_EXPIRY_KEY, expiry.toString());
      window.location.reload();
    } else {
      setError('Clave incorrecta');
    }
  };

  return (
    <div className="min-h-screen bg-[#18181b] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-zinc-100 text-center">Acceso</h1>
        <Input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          placeholder="Ingresa la clave"
          className="bg-zinc-800 border-zinc-700 text-zinc-200"
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button onClick={handleLogin} className="w-full">
          Entrar
        </Button>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-zinc-800/50">
      <td className="p-4"><Skeleton className="h-5 w-8" /></td>
      <td className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-14 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </td>
      <td className="p-4"><Skeleton className="h-7 w-20" /></td>
      <td className="p-4"><Skeleton className="h-9 w-36" /></td>
      <td className="p-4"><Skeleton className="h-9 w-36" /></td>
      <td className="p-4"><Skeleton className="h-5 w-10" /></td>
    </tr>
  );
}

function SkeletonTable() {
  return (
    <div className="w-full">
      <div className="w-full overflow-auto">
        <table className="w-full border-collapse text-base">
          <thead className="sticky top-0 z-10 bg-[#18181b]">
            <tr>
              <th className="w-16 p-3 text-left text-sm font-medium text-zinc-500">#</th>
              <th className="p-3 text-left text-sm font-medium text-zinc-500">Anime</th>
              <th className="w-32 p-3 text-left text-sm font-medium text-zinc-500">Día</th>
              <th className="w-48 p-3 text-left text-sm font-medium text-zinc-500">Eze</th>
              <th className="w-48 p-3 text-left text-sm font-medium text-zinc-500">Pancho</th>
              <th className="w-24 p-3 text-left text-sm font-medium text-zinc-500">Eps</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface PendingChanges {
  episodesWatched?: { eze?: number[]; pancho?: number[] };
  status?: { eze?: UserStatus; pancho?: UserStatus };
  maxEpisodes?: number;
  day?: string;
}

export default function HomeClient() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { 
    drawerOpen, 
    modalOpen, 
    openDrawer, 
    closeDrawer, 
    selectedAnime, 
    selectedSeason, 
    setSelectedSeason,
    pendingChanges,
    clearPendingChanges
  } = useUIStore();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; anime?: Anime }>({ show: false });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = (seasonId?: string) => {
    const url = seasonId ? `/api/anime?season=${encodeURIComponent(seasonId)}` : '/api/anime';
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.seasons) {
          const sorted = sortSeasonsByDate(data.seasons);
          setSeasons(sorted);
          
          if (!selectedSeason && sorted.length > 0) {
            setSelectedSeason(sorted[0]);
          }
        }
        if (data.animes) {
          setAnimes(data.animes);
        } else if (Array.isArray(data)) {
          setAnimes(data);
        } else {
          setAnimes([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  };

  const handleCreateSeason = (name: string) => {
    fetch('/api/anime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'createSeason', name }),
    })
      .then(res => res.json())
      .then(() => fetchData(selectedSeason?.id))
      .catch(err => console.error('Error creating season:', err));
  };

  const handleAddAnime = () => {
    fetchData(selectedSeason?.id);
  };

  const handleSaveChanges = (animeId: string, seasonId: string, changes: PendingChanges) => {
    const updatePromises: Promise<void>[] = [];

    if (changes.episodesWatched) {
      for (const user of ['eze', 'pancho'] as User[]) {
        if (changes.episodesWatched[user]) {
          updatePromises.push(
            fetch('/api/anime', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: animeId,
                seasonId,
                user,
                episodesWatched: changes.episodesWatched[user],
              }),
            }).then(() => {})
          );
        }
      }
    }

    if (changes.status) {
      for (const user of ['eze', 'pancho'] as User[]) {
        if (changes.status[user]) {
          updatePromises.push(
            fetch('/api/anime', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: animeId,
                seasonId,
                user,
                status: changes.status[user],
              }),
            }).then(() => {})
          );
        }
      }
    }

    if (changes.maxEpisodes !== undefined) {
      updatePromises.push(
        fetch('/api/anime', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: animeId,
            seasonId,
            maxEpisodes: changes.maxEpisodes,
          }),
        }).then(() => {})
      );
    }

    if (changes.day !== undefined) {
      updatePromises.push(
        fetch('/api/anime', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: animeId,
            seasonId,
            day: changes.day,
          }),
        }).then(() => {})
      );
    }

    Promise.all(updatePromises)
      .then(() => fetchData(seasonId))
      .catch(err => console.error('Error saving changes:', err));
  };

  const handleDeleteClick = (anime: Anime) => {
    setDeleteConfirm({ show: true, anime });
  };

  const confirmDelete = () => {
    if (!deleteConfirm.anime) return;
    
    const anime = deleteConfirm.anime;
    fetch(`/api/anime?id=${anime.id}&seasonId=${anime.seasonId}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (res.ok) {
          setAnimes(prev => prev.filter(a => a.id !== anime.id));
        }
      })
      .catch(err => console.error('Error deleting anime:', err))
      .finally(() => setDeleteConfirm({ show: false }));
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false });
  };

  const handleRefreshJikan = async () => {
    if (!selectedSeason) return;
    
    setIsRefreshing(true);
    
    try {
      const res = await fetch('/api/anime', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refreshAll',
          seasonId: selectedSeason.id,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        console.log(`Updated ${data.updated} animes, failed: ${data.failed}`);
        fetchData(selectedSeason.id);
      } else {
        console.error('Refresh failed:', data.error);
      }
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveAll = () => {
    Object.entries(pendingChanges).forEach(([animeId, changes]) => {
      const anime = animes.find(a => a.id === animeId);
      if (anime && changes) {
        handleSaveChanges(animeId, anime.seasonId, changes);
      }
    });
    clearPendingChanges();
  };

  useEffect(() => {
    const auth = localStorage.getItem(AUTH_KEY);
    const expiry = localStorage.getItem(AUTH_EXPIRY_KEY);
    
    if (auth === 'true' && expiry) {
      const expiryTime = parseInt(expiry);
      if (Date.now() <= expiryTime) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(AUTH_EXPIRY_KEY);
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSeason) {
      fetchData(selectedSeason.id);
    } else {
      setAnimes([]);
    }
  }, [selectedSeason]);

  if (isAuthenticated === null) {
    return null;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header 
        onAddClick={openDrawer} 
        seasons={seasons} 
        onCreateSeason={handleCreateSeason}
        onSaveAll={handleSaveAll}
        onRefreshJikan={handleRefreshJikan}
        isRefreshing={isRefreshing}
      />
      
      <main className="flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SkeletonTable />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AnimeTable 
                animes={animes}
                onSaveChanges={handleSaveChanges}
                onDeleteAnime={handleDeleteClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {drawerOpen && selectedSeason && (
        <AddAnimeDrawer 
          open={drawerOpen}
          onClose={closeDrawer} 
          onAdd={handleAddAnime} 
          seasonId={selectedSeason.id} 
        />
      )}
      {modalOpen && selectedAnime && <AnimeModal anime={selectedAnime} />}
      
      {deleteConfirm.show && deleteConfirm.anime && (
        <ConfirmModal
          open={deleteConfirm.show}
          title="Eliminar anime"
          message={`¿Estás seguro de que quieres eliminar "${deleteConfirm.anime.title}"? Esta acción no se puede deshacer.`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}