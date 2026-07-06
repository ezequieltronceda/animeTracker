'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/store/ui-store';
import { Header } from '@/components/header';
import { AnimeGrid, AmbientBackground } from '@/components/anime-grid';
import { SkeletonGrid } from '@/components/anime-grid/skeleton-grid';
import { AddAnimeDrawer } from '@/components/add-anime-drawer';
import { ConfirmModal } from '@/components/confirm-modal';
import { LoginScreen } from '@/components/login-screen';
import { sortSeasonsByDate } from '@/lib/constants';
import type { Anime, Season, SeiyuuId, User, UserStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface PendingChanges {
  episodesWatched?: { eze?: number[]; pancho?: number[] };
  status?: { eze?: UserStatus; pancho?: UserStatus };
  maxEpisodes?: number;
  day?: string;
  seiyuus?: SeiyuuId[];
}

export default function HomeClient() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const {
    drawerOpen,
    openDrawer,
    closeDrawer,
    selectedSeason,
    setSelectedSeason,
    pendingChanges,
    clearPendingChanges,
  } = useUIStore();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; anime?: Anime }>({ show: false });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const fetchData = (seasonId?: string) => {
    const url = seasonId ? `/api/anime?season=${encodeURIComponent(seasonId)}` : '/api/anime';
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        let hasSeasons = false;
        if (data.seasons) {
          const sorted = sortSeasonsByDate(data.seasons);
          setSeasons(sorted);
          hasSeasons = sorted.length > 0;

          if (!selectedSeason && hasSeasons) {
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
        // Keep the skeleton up until we've actually loaded animes for a season.
        // The bare seasons-list fetch (no seasonId) is followed by another
        // fetch triggered by the selectedSeason useEffect — finalize loading
        // only when we have real animes (or when there's nothing left to load).
        if (seasonId || !hasSeasons) {
          setLoading(false);
        }
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

    if (changes.seiyuus !== undefined) {
      updatePromises.push(
        fetch('/api/anime', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: animeId,
            seasonId,
            seiyuus: changes.seiyuus,
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
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d: { ok?: boolean }) => {
        if (!cancelled) setIsAuthenticated(d.ok === true);
      })
      .catch(() => {
        if (!cancelled) setIsAuthenticated(false);
      });
    return () => {
      cancelled = true;
    };
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
    return <LoginScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#0a0a0c] text-zinc-50">
      <AmbientBackground />
      <Header
        onAddClick={openDrawer}
        seasons={seasons}
        animes={animes}
        onCreateSeason={handleCreateSeason}
        onSaveAll={handleSaveAll}
        onRefreshJikan={handleRefreshJikan}
        isRefreshing={isRefreshing}
      />

      <main className="relative z-[1] flex flex-1 flex-col">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="pt-6"
            >
              <SkeletonGrid />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-1 flex-col"
            >
              <AnimeGrid
                animes={animes}
                season={selectedSeason}
                onSaveChanges={handleSaveChanges}
                onDeleteAnime={handleDeleteClick}
                onAddAnime={openDrawer}
                savedFlash={savedFlash}
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