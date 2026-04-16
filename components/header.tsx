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
    selectedSeason,
    setSelectedSeason,
    pendingChanges,
    getPendingChangesCount
  } = useUIStore();
  
  const [showCreateSeason, setShowCreateSeason] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const handleEditModeToggle = () => {
    setEditMode(!editMode);
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
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-4 border-b border-zinc-800/50 bg-[#18181b]/80 backdrop-blur-sm px-3 py-3 lg:px-4 lg:py-3 sticky top-0 z-50">
        <div className="flex items-center gap-2 lg:gap-4 w-full lg:w-auto">
          <h1 className="text-base lg:text-lg font-semibold text-zinc-100 hover-lift cursor-default whitespace-nowrap">Olor a Culo 🥓</h1>
          
          <button 
            className="lg:hidden relative p-2 text-zinc-400 hover:text-zinc-200"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
          >
            <svg className={`w-5 h-5 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {(searchQuery || dayFilter) && !filtersExpanded && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-indigo-500 rounded-full" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {(filtersExpanded || typeof window === 'undefined' || window.innerWidth >= 1024) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-2 w-full lg:w-auto overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
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
                  <SelectTrigger className="w-full sm:w-[180px] bg-zinc-800/80 border-zinc-700 text-zinc-200 text-sm">
                    <SelectValue placeholder="Temporada" />
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
                    className="w-full sm:w-auto"
                  >
                    +
                  </Button>
                )}
                
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-[140px] lg:w-[180px] bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 text-sm"
                />
                
                <Select
                  value={dayFilter || ''}
                  onValueChange={(value) => setDayFilter(value || null)}
                >
                  <SelectTrigger className="w-full sm:w-[120px] lg:w-[140px] bg-zinc-800 border-zinc-700 text-zinc-200 text-sm">
                    <SelectValue placeholder="Día" />
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
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          {editMode && onRefreshJikan && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRefreshJikan}
              disabled={isRefreshing}
              className="bg-zinc-700 text-zinc-300 hover:bg-zinc-600 text-xs px-2 py-1 lg:text-sm"
            >
              <span className="hidden sm:inline">{isRefreshing ? '↻ Actualizando...' : '↻ Actualizar'}</span>
              <span className="sm:hidden">{isRefreshing ? '↻' : '↻'}</span>
            </Button>
          )}
          {editMode && getPendingChangesCount() > 0 && onSaveAll && (
            <Button
              size="sm"
              onClick={onSaveAll}
              className="bg-amber-600 text-white hover:bg-amber-500 text-xs px-2 py-1 lg:text-sm"
            >
              <span className="hidden sm:inline">Guardar ({getPendingChangesCount()})</span>
              <span className="sm:hidden">💾</span>
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleEditModeToggle}
            className={`text-xs px-2 py-1 lg:text-sm ${editMode 
              ? 'bg-indigo-600 text-white hover:bg-indigo-500' 
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <span className="hidden sm:inline">{editMode ? 'Edición ON' : 'Editar'}</span>
            <span className="sm:hidden">{editMode ? '✓' : '✎'}</span>
          </Button>
          
          <Button
            size="sm"
            onClick={onAddClick}
            className="bg-indigo-600 text-white hover:bg-indigo-500 text-xs px-2 py-1 lg:text-sm"
          >
            <span className="hidden sm:inline">+ Agregar</span>
            <span className="sm:hidden">+</span>
          </Button>
        </div>
      </header>

      <AnimatePresence>
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
      </AnimatePresence>
    </>
  );
}