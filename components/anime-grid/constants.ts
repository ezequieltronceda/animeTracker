import type { UserStatus, User } from '@/types';

export const ACCENT = '#6366f1';

export interface DayDef {
  id: string;
  short: string;
  full: string;
}

export const DAYS_FULL: DayDef[] = [
  { id: 'lunes', short: 'Lun', full: 'Lunes' },
  { id: 'martes', short: 'Mar', full: 'Martes' },
  { id: 'miercoles', short: 'Mié', full: 'Miércoles' },
  { id: 'jueves', short: 'Jue', full: 'Jueves' },
  { id: 'viernes', short: 'Vie', full: 'Viernes' },
  { id: 'sabado', short: 'Sáb', full: 'Sábado' },
  { id: 'domingo', short: 'Dom', full: 'Domingo' },
];

export interface StatusDef {
  label: string;
  dot: string;
  soft: string;
  text: string;
}

export const STATUS_META: Record<UserStatus, StatusDef> = {
  viendo: { label: 'Viendo', dot: '#22c55e', soft: 'rgba(34,197,94,.12)', text: '#86efac' },
  en_pausa: { label: 'En pausa', dot: '#eab308', soft: 'rgba(234,179,8,.12)', text: '#fde68a' },
  terminado: { label: 'Terminado', dot: '#6366f1', soft: 'rgba(99,102,241,.14)', text: '#a5b4fc' },
  pendiente: { label: 'Pendiente', dot: '#71717a', soft: 'rgba(113,113,122,.16)', text: '#a1a1aa' },
  dropeado: { label: 'Dropeado', dot: '#ef4444', soft: 'rgba(239,68,68,.12)', text: '#fca5a5' },
  ni_en_un_millon: { label: 'Ni en un millón', dot: '#52525b', soft: 'rgba(82,82,91,.16)', text: '#71717a' },
};

export const USER_META: Record<User, { name: string; initial: string; color: string }> = {
  eze: { name: 'Eze', initial: 'E', color: '#22c55e' },
  pancho: { name: 'Pancho', initial: 'P', color: '#a78bfa' },
};

export function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function watchedCount(episodes: number[]): number {
  return episodes.length;
}

export function nextEpisode(episodes: number[], max: number): number | null {
  for (let ep = 1; ep <= max; ep++) {
    if (!episodes.includes(ep)) return ep;
  }
  return null;
}
