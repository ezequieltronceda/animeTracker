import { create } from 'zustand';
import type { Anime, Season } from '@/types';

const EDIT_PASSWORD = 'Panchoputo1';

interface UIState {
  drawerOpen: boolean;
  modalOpen: boolean;
  selectedAnime: Anime | null;
  selectedSeason: Season | null;
  editMode: boolean;
  editModeExpiry: number | null;
  searchQuery: string;
  dayFilter: string | null;
  seasonFilter: string | null;
  editPasswordError: string | null;
  
  openDrawer: () => void;
  closeDrawer: () => void;
  openModal: (anime: Anime) => void;
  closeModal: () => void;
  setSelectedSeason: (season: Season | null) => void;
  setEditMode: (enabled: boolean, password?: string) => boolean;
  clearEditPasswordError: () => void;
  setSearchQuery: (query: string) => void;
  setDayFilter: (day: string | null) => void;
  setSeasonFilter: (season: string | null) => void;
  checkEditModeExpiry: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  drawerOpen: false,
  modalOpen: false,
  selectedAnime: null,
  selectedSeason: null,
  editMode: false,
  editModeExpiry: null,
  searchQuery: '',
  dayFilter: null,
  seasonFilter: null,
  editPasswordError: null,

  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  openModal: (anime) => set({ modalOpen: true, selectedAnime: anime }),
  closeModal: () => set({ modalOpen: false, selectedAnime: null }),
  setSelectedSeason: (season) => set({ selectedSeason: season }),
  
  setEditMode: (enabled: boolean, password?: string) => {
    if (enabled) {
      if (password === EDIT_PASSWORD) {
        const expiry = Date.now() + (3 * 30 * 24 * 60 * 60 * 1000);
        set({ editMode: true, editModeExpiry: expiry, editPasswordError: null });
        localStorage.setItem('editModeExpiry', expiry.toString());
        return true;
      } else {
        set({ editPasswordError: 'Clave incorrecta' });
        return false;
      }
    } else {
      set({ editMode: false, editModeExpiry: null });
      localStorage.removeItem('editModeExpiry');
      return true;
    }
  },
  
  clearEditPasswordError: () => set({ editPasswordError: null }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  setDayFilter: (day) => set({ dayFilter: day }),
  setSeasonFilter: (season) => set({ seasonFilter: season }),
  
  checkEditModeExpiry: () => {
    const expiry = localStorage.getItem('editModeExpiry');
    if (expiry) {
      const expiryTime = parseInt(expiry);
      if (Date.now() > expiryTime) {
        localStorage.removeItem('editModeExpiry');
        set({ editMode: false, editModeExpiry: null });
      } else {
        set({ editMode: true, editModeExpiry: expiryTime });
      }
    }
  },
}));

if (typeof window !== 'undefined') {
  useUIStore.getState().checkEditModeExpiry();
}