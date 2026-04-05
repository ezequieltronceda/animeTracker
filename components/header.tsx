'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/store/ui-store';
import { DAYS, formatSeasonName } from '@/lib/constants';
import type { Season } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

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
              <select
                value={selectedSeason?.id || ''}
                onChange={handleSeasonChange}
                className="rounded bg-zinc-800/80 px-3 py-1.5 text-sm text-zinc-200 border border-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="">Todas las temporadas</option>
                {safeSeasons.map(season => (
                  <option key={season.id} value={season.id}>{formatSeasonName(season.name)}</option>
                ))}
              </select>
              {editMode && (
                <button
                  onClick={() => setShowCreateSeason(true)}
                  className="rounded bg-zinc-700/80 px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-600 hover-lift"
                  title="Crear temporada"
                >
                  +
                </button>
              )}
            </div>
            
            <input
              type="text"
              placeholder="Buscar anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-indigo-500"
            />
            
            <select
              value={dayFilter || ''}
              onChange={(e) => setDayFilter(e.target.value || null)}
              className="rounded bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 border border-zinc-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Todos los días</option>
              {DAYS.map(day => (
                <option key={day} value={day} className="capitalize">{day}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshJikan && (
            <button
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="rounded bg-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover-lift"
            >
              {isRefreshing ? '↻ Actualizando...' : '↻ Actualizar Jikan'}
            </button>
          )}
          {editMode && getPendingChangesCount() > 0 && onSaveAll && (
            <button
              onClick={onSaveAll}
              className="rounded bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-500 hover-lift animate-pulse-glow"
            >
              Guardar Todo ({getPendingChangesCount()})
            </button>
          )}
          <button
            onClick={handleEditModeToggle}
            className={`rounded px-3 py-1.5 text-sm transition-all hover-lift ${
              editMode 
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30' 
                : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {editMode ? 'Modo edición ON' : 'Editar'}
          </button>
          
          <button
            onClick={onAddClick}
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500 hover-lift shadow-lg shadow-indigo-600/30 transition-all"
          >
            + Agregar
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="w-full max-w-sm rounded-lg bg-[#18181b] p-6 shadow-xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <h2 className="text-lg font-semibold text-zinc-100 mb-4">Ingresar clave de edición</h2>
              
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (editPasswordError) clearEditPasswordError();
                }}
                placeholder="Clave"
                className="w-full rounded bg-zinc-800 px-3 py-2 text-zinc-200 border border-zinc-700 focus:outline-none focus:border-indigo-500 mb-2"
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
              
              {editPasswordError && (
                <p className="text-sm text-red-500 mb-4">{editPasswordError}</p>
              )}
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput('');
                    clearEditPasswordError();
                  }}
                  className="rounded px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
                >
                  Aceptar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showCreateSeason && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="w-full max-w-sm rounded-lg bg-[#18181b] p-6 shadow-xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <h2 className="text-lg font-semibold text-zinc-100 mb-4">Crear Temporada</h2>
              
              <input
                type="text"
                value={newSeasonName}
                onChange={(e) => setNewSeasonName(e.target.value)}
                placeholder="Ej: Invierno 2026"
                className="w-full rounded bg-zinc-800 px-3 py-2 text-zinc-200 border border-zinc-700 focus:outline-none focus:border-indigo-500 mb-4"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSeason()}
              />
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowCreateSeason(false);
                    setNewSeasonName('');
                  }}
                  className="rounded px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateSeason}
                  className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
                >
                  Crear
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showRefreshModal && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="w-full max-w-sm rounded-lg bg-[#18181b] p-6 shadow-xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <h2 className="text-lg font-semibold text-zinc-100 mb-4">Actualizar desde Jikan</h2>
              
              <input
                type="password"
                value={refreshPasswordInput}
                onChange={(e) => {
                  setRefreshPasswordInput(e.target.value);
                  if (refreshPasswordError) setRefreshPasswordError('');
                }}
                placeholder="Clave"
                className="w-full rounded bg-zinc-800 px-3 py-2 text-zinc-200 border border-zinc-700 focus:outline-none focus:border-indigo-500 mb-2"
                onKeyDown={(e) => e.key === 'Enter' && handleRefreshSubmit()}
              />
              
              {refreshPasswordError && (
                <p className="text-sm text-red-500 mb-4">{refreshPasswordError}</p>
              )}
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRefreshModal(false)}
                className="rounded px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleRefreshSubmit}
                className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
              >
                Actualizar
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}