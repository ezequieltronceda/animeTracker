'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/store/ui-store';
import { DAYS, formatSeasonName } from '@/lib/constants';
import type { Season } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface HeaderProps {
  onAddClick: () => void;
  seasons?: Season[];
  onCreateSeason: (name: string) => void;
  onSaveAll?: () => void;
  onRefreshJikan?: () => void;
  isRefreshing?: boolean;
}

export function Header({ onAddClick, seasons, onCreateSeason, onSaveAll, onRefreshJikan, isRefreshing }: HeaderProps) {
  const { 
    searchQuery, 
    setSearchQuery, 
    dayFilter, 
    setDayFilter,
    editMode,
    setEditMode,
    editPasswordError,
    clearEditPasswordError,
    selectedSeason,
    setSelectedSeason,
    pendingChanges,
    getPendingChangesCount
  } = useUIStore();
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [refreshPasswordInput, setRefreshPasswordInput] = useState('');
  const [refreshPasswordError, setRefreshPasswordError] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showCreateSeason, setShowCreateSeason] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');

  const REFRESH_PASSWORD = 'Panchogay';

  const handleRefreshClick = () => {
    setShowRefreshModal(true);
    setRefreshPasswordInput('');
    setRefreshPasswordError('');
  };

  const handleRefreshSubmit = () => {
    if (refreshPasswordInput === REFRESH_PASSWORD) {
      setShowRefreshModal(false);
      if (onRefreshJikan) onRefreshJikan();
    } else {
      setRefreshPasswordError('Clave incorrecta');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const expiry = localStorage.getItem('editModeExpiry');
      if (expiry) {
        const expiryTime = parseInt(expiry);
        if (Date.now() > expiryTime) {
          localStorage.removeItem('editModeExpiry');
        } else {
          setEditMode(true);
        }
      }
    }
  }, []);

  const handleEditModeToggle = () => {
    if (editMode) {
      setEditMode(false);
    } else {
      setShowPasswordModal(true);
    }
  };

  const handlePasswordSubmit = () => {
    const success = setEditMode(true, passwordInput);
    if (success) {
      setShowPasswordModal(false);
      setPasswordInput('');
    }
  };

  const safeSeasons = Array.isArray(seasons) ? seasons : [];

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) {
      setSelectedSeason(null);
    } else {
      const season = safeSeasons.find(s => s.id === value);
      setSelectedSeason(season || null);
    }
  };

  const handleCreateSeason = () => {
    if (newSeasonName.trim()) {
      onCreateSeason(newSeasonName.trim());
      setNewSeasonName('');
      setShowCreateSeason(false);
    }
  };

  return (
    <>
      <header className="flex items-center justify-between border-b border-zinc-800/50 bg-[#18181b]/80 backdrop-blur-sm px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-zinc-100 hover-lift cursor-default">Olor a Culo 🥓</h1>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Select
                value={selectedSeason?.id || ''}
                onValueChange={(value) => {
                  if (!value) {
                    setSelectedSeason(null);
                  } else {
                    const season = safeSeasons.find(s => s.id === value);
                    setSelectedSeason(season || null);
                  }
                }}
              >
                <SelectTrigger className="w-[180px] bg-zinc-800/80 border-zinc-700 text-zinc-200">
                  <SelectValue placeholder="Todas las temporadas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las temporadas</SelectItem>
                  {safeSeasons.map(season => (
                    <SelectItem key={season.id} value={season.id}>
                      {formatSeasonName(season.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editMode && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCreateSeason(true)}
                  title="Crear temporada"
                >
                  +
                </Button>
              )}
            </div>
            
            <Input
              type="text"
              placeholder="Buscar anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[180px] bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500"
            />
            
            <Select
              value={dayFilter || ''}
              onValueChange={(value) => setDayFilter(value || null)}
            >
              <SelectTrigger className="w-[140px] bg-zinc-800 border-zinc-700 text-zinc-200">
                <SelectValue placeholder="Todos los días" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los días</SelectItem>
                {DAYS.map(day => (
                  <SelectItem key={day} value={day} className="capitalize">
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshJikan && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
            >
              {isRefreshing ? '↻ Actualizando...' : '↻ Actualizar Jikan'}
            </Button>
          )}
          {editMode && getPendingChangesCount() > 0 && onSaveAll && (
            <Button
              size="sm"
              onClick={onSaveAll}
              className="bg-amber-600 text-white hover:bg-amber-500"
            >
              Guardar Todo ({getPendingChangesCount()})
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleEditModeToggle}
            className={editMode 
              ? 'bg-indigo-600 text-white hover:bg-indigo-500' 
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }
          >
            {editMode ? 'Modo edición ON' : 'Editar'}
          </Button>
          
          <Button
            size="sm"
            onClick={onAddClick}
            className="bg-indigo-600 text-white hover:bg-indigo-500"
          >
            + Agregar
          </Button>
        </div>
      </header>

      <AnimatePresence>
        {showPasswordModal && (
          <Dialog open={showPasswordModal} onOpenChange={(open) => !open && setShowPasswordModal(false)}>
            <DialogContent className="bg-[#18181b] border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Ingresar clave de edición</DialogTitle>
              </DialogHeader>
              <Input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (editPasswordError) clearEditPasswordError();
                }}
                placeholder="Clave"
                className="bg-zinc-800 border-zinc-700 text-zinc-200"
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
              {editPasswordError && (
                <p className="text-sm text-red-500">{editPasswordError}</p>
              )}
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput('');
                    clearEditPasswordError();
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handlePasswordSubmit}>Aceptar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {showCreateSeason && (
          <Dialog open={showCreateSeason} onOpenChange={(open) => !open && setShowCreateSeason(false)}>
            <DialogContent className="bg-[#18181b] border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Crear Temporada</DialogTitle>
              </DialogHeader>
              <Input
                type="text"
                value={newSeasonName}
                onChange={(e) => setNewSeasonName(e.target.value)}
                placeholder="Ej: Invierno 2026"
                className="bg-zinc-800 border-zinc-700 text-zinc-200"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSeason()}
              />
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowCreateSeason(false);
                    setNewSeasonName('');
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateSeason}>Crear</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {showRefreshModal && (
          <Dialog open={showRefreshModal} onOpenChange={(open) => !open && setShowRefreshModal(false)}>
            <DialogContent className="bg-[#18181b] border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Actualizar desde Jikan</DialogTitle>
              </DialogHeader>
              <Input
                type="password"
                value={refreshPasswordInput}
                onChange={(e) => {
                  setRefreshPasswordInput(e.target.value);
                  if (refreshPasswordError) setRefreshPasswordError('');
                }}
                placeholder="Clave"
                className="bg-zinc-800 border-zinc-700 text-zinc-200"
                onKeyDown={(e) => e.key === 'Enter' && handleRefreshSubmit()}
              />
              {refreshPasswordError && (
                <p className="text-sm text-red-500">{refreshPasswordError}</p>
              )}
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowRefreshModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleRefreshSubmit}>Actualizar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}