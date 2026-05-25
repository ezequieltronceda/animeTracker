'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Calendar,
  Check,
  ChevronDown,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { DAYS, formatSeasonName } from '@/lib/constants';
import type { Season } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const ACCENT = '#6366f1';

const DAY_LABELS: Record<string, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

interface HeaderProps {
  onAddClick: () => void;
  seasons?: Season[];
  onCreateSeason: (name: string) => void;
  onSaveAll?: () => void;
  onRefreshJikan?: () => void;
  isRefreshing?: boolean;
}

export function Header({
  onAddClick,
  seasons,
  onCreateSeason,
  onSaveAll,
  onRefreshJikan,
  isRefreshing,
}: HeaderProps) {
  const {
    searchQuery,
    setSearchQuery,
    dayFilter,
    setDayFilter,
    editMode,
    setEditMode,
    selectedSeason,
    setSelectedSeason,
    getPendingChangesCount,
  } = useUIStore();

  const [showCreateSeason, setShowCreateSeason] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');

  const safeSeasons = Array.isArray(seasons) ? seasons : [];
  const pendingCount = getPendingChangesCount();

  const handleCreateSeason = () => {
    if (newSeasonName.trim()) {
      onCreateSeason(newSeasonName.trim());
      setNewSeasonName('');
      setShowCreateSeason(false);
    }
  };

  return (
    <>
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(10,10,12,.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,.05)',
        }}
      >
        <div className="flex items-center justify-between gap-4 px-3 pb-3 pt-3.5 lg:px-5">
          <div className="flex items-center gap-3 lg:gap-3.5">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-[30px] w-[30px] items-center justify-center rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, color-mix(in oklch, ${ACCENT} 60%, #ff66b3))`,
                  boxShadow: `0 6px 18px -4px ${ACCENT}88`,
                }}
              >
                <Sparkles className="h-[15px] w-[15px] text-white" />
              </div>
              <span className="hidden whitespace-nowrap text-[15px] font-bold tracking-[-0.2px] text-zinc-50 sm:inline">
                Olor a Culo
              </span>
            </div>

            <div className="hidden h-[22px] w-px bg-white/10 sm:block" />

            <SeasonDropdown
              seasons={safeSeasons}
              currentSeasonId={selectedSeason?.id ?? null}
              onChange={(s) => setSelectedSeason(s)}
              onAddSeason={() => setShowCreateSeason(true)}
              editMode={editMode}
            />
          </div>

          <div className="hidden flex-1 items-center md:flex md:max-w-[420px]">
            <SearchBox value={searchQuery} onChange={setSearchQuery} />
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 sm:flex">
              <UserAvatar user="eze" />
              <UserAvatar user="pancho" />
            </div>

            {editMode && onRefreshJikan && (
              <button
                onClick={onRefreshJikan}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-white/75 disabled:opacity-50"
                style={{
                  background: 'rgba(255,255,255,.03)',
                  borderColor: 'rgba(255,255,255,.08)',
                }}
                title="Actualizar desde Jikan"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                <span className="hidden lg:inline">Actualizar</span>
              </button>
            )}

            {pendingCount > 0 && onSaveAll && (
              <button
                onClick={onSaveAll}
                className="inline-flex items-center gap-1.5 rounded-lg border-none px-3 py-1.5 text-xs font-bold text-[#1a0e00]"
                style={{
                  background: 'linear-gradient(180deg, #f59e0b, #d97706)',
                  boxShadow:
                    '0 4px 14px -4px rgba(245,158,11,.55), inset 0 1px 0 rgba(255,255,255,.25)',
                  animation: 'cgPendingPulse 2s infinite',
                }}
              >
                <Check className="h-3.5 w-3.5" /> Guardar ({pendingCount})
              </button>
            )}

            <button
              onClick={() => setEditMode(!editMode)}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: editMode ? `${ACCENT}22` : 'rgba(255,255,255,.03)',
                borderColor: editMode ? ACCENT : 'rgba(255,255,255,.08)',
                color: editMode ? ACCENT : 'rgba(255,255,255,.75)',
              }}
            >
              <Pencil className="h-3 w-3" />
              <span className="hidden sm:inline">
                {editMode ? 'Editar ON' : 'Editar'}
              </span>
            </button>

            <button
              onClick={onAddClick}
              className="inline-flex items-center gap-1.5 rounded-lg border-none px-3 py-1.5 text-xs font-semibold text-white"
              style={{
                background: `linear-gradient(180deg, ${ACCENT}, color-mix(in oklch, ${ACCENT} 70%, #000))`,
                boxShadow: `0 4px 14px -4px ${ACCENT}aa, inset 0 1px 0 rgba(255,255,255,.2)`,
              }}
            >
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline">Agregar</span>
            </button>
          </div>
        </div>

        <div className="px-3 pb-2 md:hidden">
          <SearchBox value={searchQuery} onChange={setSearchQuery} />
        </div>

        <DayPills value={dayFilter} onChange={setDayFilter} />
      </header>

      <Dialog
        open={showCreateSeason}
        onOpenChange={(open) => !open && setShowCreateSeason(false)}
      >
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
    </>
  );
}

function UserAvatar({ user }: { user: 'eze' | 'pancho' }) {
  const color = user === 'eze' ? '#22c55e' : '#a78bfa';
  const initial = user === 'eze' ? 'E' : 'P';
  return (
    <span
      className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[11px] font-bold text-[#0a0a0b]"
      style={{
        background: `linear-gradient(135deg, ${color}, color-mix(in oklch, ${color} 60%, #000))`,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18)',
      }}
    >
      {initial}
    </span>
  );
}

function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="flex w-full items-center gap-2 rounded-lg border px-3 py-2"
      style={{
        background: 'rgba(255,255,255,.04)',
        borderColor: 'rgba(255,255,255,.06)',
      }}
    >
      <Search className="h-3.5 w-3.5 text-white/40" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar anime…"
        className="flex-1 border-none bg-transparent text-[13px] text-zinc-50 outline-none placeholder:text-white/40"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="text-white/40"
          aria-label="Limpiar búsqueda"
        >
          ×
        </button>
      )}
    </div>
  );
}

function SeasonDropdown({
  seasons,
  currentSeasonId,
  onChange,
  onAddSeason,
  editMode,
}: {
  seasons: Season[];
  currentSeasonId: string | null;
  onChange: (season: Season) => void;
  onAddSeason: () => void;
  editMode: boolean;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);

  const current = seasons.find((s) => s.id === currentSeasonId);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-w-0 max-w-[180px] items-center gap-2 rounded-lg border py-1.5 pl-3 pr-2.5 text-[13px] font-semibold tracking-[-0.1px] text-zinc-50 transition-all sm:min-w-[160px] lg:min-w-[180px]"
        style={{
          background: open ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.035)',
          borderColor: open ? `${ACCENT}55` : 'rgba(255,255,255,.08)',
        }}
      >
        <Calendar className="h-3 w-3" style={{ color: ACCENT }} />
        <span className="flex-1 truncate text-left">
          {current ? formatSeasonName(current.name) : 'Temporada'}
        </span>
        <span
          className="rounded px-[5px] py-[1px] text-[10px] text-white/40"
          style={{
            background: 'rgba(255,255,255,.04)',
            fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
          }}
        >
          {seasons.length}
        </span>
        <ChevronDown
          className="h-3 w-3 opacity-60 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-[60] mt-1 max-h-[420px] min-w-[280px] overflow-auto rounded-xl border p-1.5"
          style={{
            background: '#16161a',
            borderColor: 'rgba(255,255,255,.08)',
            boxShadow:
              '0 24px 50px -16px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.02)',
            animation: 'cgFadeScale .18s cubic-bezier(.22,.61,.36,1) both',
            transformOrigin: 'top left',
          }}
        >
          <div className="px-2.5 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[1px] text-white/40">
            Temporada
          </div>
          {seasons.map((s) => {
            const isCurrent = s.id === currentSeasonId;
            return (
              <button
                key={s.id}
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-white/[.035]"
                style={{
                  background: isCurrent ? 'rgba(255,255,255,.06)' : 'transparent',
                }}
              >
                <span
                  className="h-[7px] w-[7px] flex-shrink-0 rounded-full"
                  style={{
                    background: isCurrent ? ACCENT : 'rgba(255,255,255,.15)',
                    boxShadow: isCurrent ? `0 0 0 3px ${ACCENT}33` : 'none',
                  }}
                />
                <span
                  className="flex-1 truncate text-[13px] tracking-[-0.1px]"
                  style={{
                    color: isCurrent ? '#fafafa' : 'rgba(255,255,255,.78)',
                    fontWeight: isCurrent ? 600 : 500,
                  }}
                >
                  {formatSeasonName(s.name)}
                </span>
                <span
                  className="text-[9.5px] text-white/35"
                  style={{
                    fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
                  }}
                >
                  {s.id}
                </span>
              </button>
            );
          })}

          {editMode && (
            <>
              <div className="my-1.5 h-px bg-white/5" />
              <button
                onClick={() => {
                  onAddSeason();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[12.5px] font-semibold"
                style={{ color: ACCENT }}
              >
                <Plus className="h-3.5 w-3.5" /> Nueva temporada
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DayPills({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (day: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [underline, setUnderline] = useState({
    left: 0,
    width: 0,
    visible: false,
  });

  const items: { id: string | null; label: string }[] = [
    { id: null, label: 'Todos los días' },
    ...DAYS.map((d) => ({ id: d, label: DAY_LABELS[d] ?? d })),
  ];

  useLayoutEffect(() => {
    const key = value ?? 'all';
    const el = refs.current[key];
    const wrap = containerRef.current;
    if (!el || !wrap) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnderline((u) => ({ ...u, visible: false }));
      return;
    }
    const elRect = el.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    setUnderline({
      left: elRect.left - wrapRect.left,
      width: elRect.width,
      visible: true,
    });
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-stretch gap-0.5 overflow-x-auto px-3 lg:px-4"
    >
      {items.map((d) => {
        const key = d.id ?? 'all';
        const isActive = value === d.id;
        return (
          <button
            key={key}
            ref={(el) => {
              refs.current[key] = el;
            }}
            onClick={() => onChange(d.id)}
            className="relative inline-flex items-center gap-2 whitespace-nowrap border-none bg-transparent px-3.5 py-2.5 pb-[11px] text-[13px] capitalize"
            style={{
              color: isActive ? '#fafafa' : 'rgba(255,255,255,.45)',
              fontWeight: isActive ? 600 : 500,
              letterSpacing: '-0.1px',
            }}
            onMouseEnter={(e) => {
              if (!isActive)
                e.currentTarget.style.color = 'rgba(255,255,255,.75)';
            }}
            onMouseLeave={(e) => {
              if (!isActive)
                e.currentTarget.style.color = 'rgba(255,255,255,.45)';
            }}
          >
            {isActive && (
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: ACCENT,
                  boxShadow: `0 0 0 3px ${ACCENT}33`,
                }}
              />
            )}
            {d.label}
          </button>
        );
      })}
      {underline.visible && (
        <span
          className="pointer-events-none absolute bottom-[-1px] left-0 h-0.5 rounded"
          style={{
            background: ACCENT,
            width: underline.width,
            transform: `translateX(${underline.left}px)`,
            transition:
              'transform .35s cubic-bezier(.22,.61,.36,1), width .35s cubic-bezier(.22,.61,.36,1)',
            boxShadow: `0 0 12px ${ACCENT}88`,
          }}
        />
      )}
      <div className="flex-1" />
    </div>
  );
}
