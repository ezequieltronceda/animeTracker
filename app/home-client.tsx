'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/store/ui-store';
import { Header } from '@/components/header';
import { AnimeTable } from '@/components/anime-table';
import { AddAnimeDrawer } from '@/components/add-anime-drawer';
import { AnimeModal } from '@/components/anime-modal';
import { ConfirmModal } from '@/components/confirm-modal';
import type { Anime, Season } from '@/types';

export default function HomeClient() {
  const { drawerOpen, modalOpen, openDrawer, closeDrawer, selectedAnime, selectedSeason } = useUIStore();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; anime?: Anime }>({ show: false });

  const fetchData = (seasonId?: string) => {
    const url = seasonId ? `/api/anime?season=${encodeURIComponent(seasonId)}` : '/api/anime';
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.seasons) {
          setSeasons(data.seasons);
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

  const handleUpdateAnime = (updatedAnime: Anime) => {
    setAnimes(prev => prev.map(a => a.id === updatedAnime.id ? updatedAnime : a));
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
    <div className="flex min-h-screen flex-col bg-[#09090b]">
      <Header 
        onAddClick={openDrawer} 
        seasons={seasons} 
        onCreateSeason={handleCreateSeason}
      />
      
      <main className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center p-8 text-zinc-500">
            Cargando...
          </div>
        ) : (
          <AnimeTable 
            animes={animes} 
            onUpdateAnime={handleUpdateAnime}
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