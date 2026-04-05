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

interface PendingChanges {
  episodesWatched?: { eze?: number[]; pancho?: number[] };
  status?: { eze?: UserStatus; pancho?: UserStatus };
  maxEpisodes?: number;
  day?: string;
}

export default function HomeClient() {
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
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSeason) {
      fetchData(selectedSeason.id);
    } else {
      setAnimes([]);
    }
  }, [selectedSeason]);

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
        {loading ? (
          <div className="flex items-center justify-center p-8 text-zinc-500">
            Cargando...
          </div>
        ) : (
          <AnimeTable 
            animes={animes}
            onSaveChanges={handleSaveChanges}
            onDeleteAnime={handleDeleteClick}
          />
        )}
      </main>

      {drawerOpen && selectedSeason && (
        <AddAnimeDrawer 
          onClose={closeDrawer} 
          onAdd={handleAddAnime} 
          seasonId={selectedSeason.id} 
        />
      )}
      {modalOpen && selectedAnime && <AnimeModal anime={selectedAnime} />}
      
      {deleteConfirm.show && deleteConfirm.anime && (
        <ConfirmModal
          title="Eliminar anime"
          message={`¿Estás seguro de que quieres eliminar "${deleteConfirm.anime.title}"? Esta acción no se puede deshacer.`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}