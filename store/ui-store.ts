import { create } from 'zustand';
import type { Anime, Season, SeiyuuId, UserStatus, User } from '@/types';

interface PendingChanges {
  episodesWatched?: { [user in User]?: number[] };
  maxEpisodes?: number;
  status?: { [user in User]?: UserStatus };
  day?: string;
  seiyuus?: SeiyuuId[];
}

interface UIState {
  drawerOpen: boolean;
  modalOpen: boolean;
  selectedAnime: Anime | null;
  selectedSeason: Season | null;
  editMode: boolean;
  searchQuery: string;
  dayFilter: string | null;
  seasonFilter: string | null;
  pendingChanges: { [animeId: string]: PendingChanges };
  
  openDrawer: () => void;
  closeDrawer: () => void;
  openModal: (anime: Anime) => void;
  closeModal: () => void;
  setSelectedSeason: (season: Season | null) => void;
  setEditMode: (enabled: boolean) => void;
  setSearchQuery: (query: string) => void;
  setDayFilter: (day: string | null) => void;
  setSeasonFilter: (season: string | null) => void;
  setPendingChanges: (animeId: string, changes: PendingChanges) => void;
  clearPendingChanges: (animeId?: string) => void;
  getPendingChangesCount: () => number;
}

export const useUIStore = create<UIState>((set, get) => ({
  drawerOpen: false,
  modalOpen: false,
  selectedAnime: null,
  selectedSeason: null,
  editMode: false,
  searchQuery: '',
  dayFilter: null,
  seasonFilter: null,
  pendingChanges: {},

  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  openModal: (anime) => set({ modalOpen: true, selectedAnime: anime }),
  closeModal: () => set({ modalOpen: false, selectedAnime: null }),
  setSelectedSeason: (season) => set({ selectedSeason: season }),
  
  setEditMode: (enabled: boolean) => set({ editMode: enabled }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  setDayFilter: (day) => set({ dayFilter: day }),
  setSeasonFilter: (season) => set({ seasonFilter: season }),
  
  setPendingChanges: (animeId, changes) => set((state) => ({
    pendingChanges: { ...state.pendingChanges, [animeId]: changes }
  })),

  clearPendingChanges: (animeId) => set((state) => {
    if (animeId) {
      const { [animeId]: _, ...rest } = state.pendingChanges;
      return { pendingChanges: rest };
    }
    return { pendingChanges: {} };
  }),

  getPendingChangesCount: () => Object.keys(get().pendingChanges).length,
}));