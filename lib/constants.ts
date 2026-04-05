export const COLORS = {
  background: {
    primary: '#09090b',
    secondary: '#18181b',
    tertiary: '#27272a',
  },
  text: {
    primary: '#fafafa',
    secondary: '#a1a1aa',
    muted: '#71717a',
  },
  accent: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
  },
  status: {
    viendo: '#22c55e',
    en_pausa: '#eab308',
    terminado: '#3b82f6',
    pendiente: '#a1a1aa',
    dropeado: '#ef4444',
    ni_en_un_millon: '#6b7280',
  },
  border: '#3f3f46',
} as const;

export const STATUS_LABELS: Record<string, string> = {
  viendo: 'Viendo',
  en_pausa: 'En pausa',
  terminado: 'Terminado',
  pendiente: 'Pendiente',
  dropeado: 'Dropeado',
  ni_en_un_millon: 'Ni en un millón',
};

export const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;

export function formatSeasonName(name: string): string {
  if (!name) return '';
  
  const seasonMap: Record<string, string> = {
    spring: 'Primavera',
    summer: 'Verano',
    fall: 'Otoño',
    winter: 'Invierno',
    spring2026: 'Primavera 2026',
    summer2026: 'Verano 2026',
    fall2026: 'Otoño 2026',
    winter2026: 'Invierno 2026',
  };
  
  const lower = name.toLowerCase();
  
  if (seasonMap[lower]) {
    return seasonMap[lower];
  }
  
  const seasonKey = Object.keys(seasonMap).find(k => lower.includes(k));
  if (seasonKey) {
    const year = name.match(/\d{4}|\d{2}/)?.[0];
    if (year) {
      return seasonMap[seasonKey] + ' ' + (year.length === 2 ? '20' + year : year);
    }
    return seasonMap[seasonKey];
  }
  
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1').trim();
}