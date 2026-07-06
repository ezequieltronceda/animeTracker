import type { SeiyuuId, UserStatus } from '@/types';

export const ACCENT = '#6366f1';

export const USERS = {
  eze: { name: 'Eze', initial: 'E', color: '#22c55e' },
  pancho: { name: 'Pancho', initial: 'P', color: '#a78bfa' },
} as const;

export const SEIYUUS: Record<
  SeiyuuId,
  { name: string; short: string; image: string; color: string }
> = {
  koyasu: {
    name: 'Takehito Koyasu',
    short: 'Koyasu',
    image: '/seiyuu/koyasu.png',
    color: '#e0b83a', // dorado DIO
  },
  hanazawa: {
    name: 'Kana Hanazawa',
    short: 'Hanazawa',
    image: '/seiyuu/hanazawa.png',
    color: '#6ec6c9', // turquesa Mayuri
  },
};

export const SEIYUU_IDS = Object.keys(SEIYUUS) as SeiyuuId[];

export const DAY_LABELS: Record<string, { short: string; full: string }> = {
  lunes: { short: 'Lun', full: 'Lunes' },
  martes: { short: 'Mar', full: 'Martes' },
  miercoles: { short: 'Mié', full: 'Miércoles' },
  jueves: { short: 'Jue', full: 'Jueves' },
  viernes: { short: 'Vie', full: 'Viernes' },
  sabado: { short: 'Sáb', full: 'Sábado' },
  domingo: { short: 'Dom', full: 'Domingo' },
};

export const STATUS_SOFT: Record<UserStatus, { soft: string; text: string }> = {
  viendo: { soft: 'rgba(34,197,94,.12)', text: '#86efac' },
  en_pausa: { soft: 'rgba(234,179,8,.12)', text: '#fde68a' },
  terminado: { soft: 'rgba(99,102,241,.14)', text: '#a5b4fc' },
  pendiente: { soft: 'rgba(113,113,122,.16)', text: '#a1a1aa' },
  dropeado: { soft: 'rgba(239,68,68,.12)', text: '#fca5a5' },
  ni_en_un_millon: { soft: 'rgba(82,82,91,.16)', text: '#71717a' },
};
