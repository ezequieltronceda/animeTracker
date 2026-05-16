'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Calendar, Check, ChevronDown, Edit2, Plus, RefreshCw, Search, Sparkles } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { formatSeasonName } from '@/lib/constants';
import type { Season } from '@/types';
import { ACCENT } from '@/components/anime-grid';
import { DAYS_FULL, USER_META } from '@/components/anime-grid/constants';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onAddClick: () => void;
  seasons?: Season[];
  onCreateSeason: (name: string) => void;
  onSaveAll?: () => void;
  onRefreshJikan?: () => void;
  isRefreshing?: boolean;
}

const ACCENT_COLOR = ACCENT;

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

  const safeSeasons: Season[] = Array.isArray(seasons) ? seasons : [];
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
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(10,10,12,.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,.05)',
        }}
      >
        {/* Row 1 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 22px 12px',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: `linear-gradient(135deg, ${ACCENT_COLOR}, color-mix(in oklch, ${ACCENT_COLOR} 60%, #ff66b3))`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 6px 18px -4px ${ACCENT_COLOR}88`,
                }}
              >
                <Sparkles size={15} style={{ color: '#fff' }} fill="currentColor" strokeWidth={0} />
              </div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: '#fafafa',
                  letterSpacing: -0.2,
                  whiteSpace: 'nowrap',
                }}
              >
                Olor a Culo
              </span>
            </div>

            <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,.08)' }} />

            <SeasonDropdown
              seasons={safeSeasons}
              current={selectedSeason}
              onChange={(s) => setSelectedSeason(s)}
              onAdd={() => setShowCreateSeason(true)}
              accent={ACCENT_COLOR}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flex: 1,
              maxWidth: 420,
              minWidth: 200,
              marginLeft: 14,
            }}
          >
            <SearchBox value={searchQuery} onChange={setSearchQuery} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 6 }}>
              <UserAvatar user="eze" />
              <UserAvatar user="pancho" />
            </div>

            {editMode && onRefreshJikan && (
              <button
                type="button"
                onClick={onRefreshJikan}
                disabled={isRefreshing}
                style={{
                  padding: '7px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,.08)',
                  background: 'rgba(255,255,255,.03)',
                  color: 'rgba(255,255,255,.75)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: isRefreshing ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'inherit',
                  opacity: isRefreshing ? 0.6 : 1,
                }}
                title="Actualizar desde Jikan"
              >
                <RefreshCw
                  size={13}
                  style={{
                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                  }}
                />
                <span className="hidden sm:inline">
                  {isRefreshing ? 'Actualizando…' : 'Actualizar'}
                </span>
              </button>
            )}

            {pendingCount > 0 && onSaveAll && (
              <button
                type="button"
                onClick={onSaveAll}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(180deg, #f59e0b, #d97706)',
                  color: '#1a0e00',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow:
                    '0 4px 14px -4px rgba(245,158,11,.55), inset 0 1px 0 rgba(255,255,255,.25)',
                  animation: 'cgPendingPulse 2s infinite',
                  fontFamily: 'inherit',
                }}
              >
                <Check size={13} /> Guardar ({pendingCount})
              </button>
            )}

            <button
              type="button"
              onClick={() => setEditMode(!editMode)}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: `1px solid ${editMode ? ACCENT_COLOR : 'rgba(255,255,255,.08)'}`,
                background: editMode ? `${ACCENT_COLOR}22` : 'rgba(255,255,255,.03)',
                color: editMode ? ACCENT_COLOR : 'rgba(255,255,255,.75)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all .15s',
                fontFamily: 'inherit',
              }}
            >
              <Edit2 size={13} />
              <span>{editMode ? 'Editar ON' : 'Editar'}</span>
            </button>

            <button
              type="button"
              onClick={onAddClick}
              style={{
                padding: '7px 13px',
                borderRadius: 8,
                border: 'none',
                background: `linear-gradient(180deg, ${ACCENT_COLOR}, color-mix(in oklch, ${ACCENT_COLOR} 70%, #000))`,
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: `0 4px 14px -4px ${ACCENT_COLOR}aa, inset 0 1px 0 rgba(255,255,255,.2)`,
                fontFamily: 'inherit',
              }}
            >
              <Plus size={13} /> Agregar
            </button>
          </div>
        </div>

        {/* Row 2: day pills */}
        <DayPills value={dayFilter} onChange={setDayFilter} accent={ACCENT_COLOR} />
      </header>

      {showCreateSeason && (
        <Dialog
          open={showCreateSeason}
          onOpenChange={(open) => !open && setShowCreateSeason(false)}
        >
          <DialogContent className="bg-[#18181b] border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-zinc-100">Crear temporada</DialogTitle>
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

      <style>{`
        @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

function UserAvatar({ user }: { user: 'eze' | 'pancho' }) {
  const u = USER_META[user];
  const size = 26;
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: `linear-gradient(135deg, ${u.color}, color-mix(in oklch, ${u.color} 60%, #000))`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.45,
        fontWeight: 700,
        color: '#0a0a0b',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18)',
        flexShrink: 0,
      }}
      title={u.name}
    >
      {u.initial}
    </span>
  );
}

interface DayPillsProps {
  value: string | null;
  onChange: (day: string | null) => void;
  accent: string;
}

function DayPills({ value, onChange, accent }: DayPillsProps) {
  const items = [{ id: null as string | null, short: 'Todos', full: 'Todos los días' }, ...DAYS_FULL];
  const containerRef = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [underline, setUnderline] = useState({ left: 0, width: 0, visible: false });

  useLayoutEffect(() => {
    const key = value || 'all';
    const el = refs.current[key];
    const wrap = containerRef.current;
    if (!el || !wrap) {
      setUnderline((u) => ({ ...u, visible: false }));
      return;
    }
    const elRect = el.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    setUnderline({
      left: elRect.left - wrapRect.left + wrap.scrollLeft,
      width: elRect.width,
      visible: true,
    });
  }, [value]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 2,
        padding: '0 18px',
        overflowX: 'auto',
        position: 'relative',
      }}
    >
      {items.map((d) => {
        const id = d.id || 'all';
        const isActive = value === d.id;
        return (
          <button
            key={id}
            ref={(el) => {
              refs.current[id] = el;
            }}
            type="button"
            onClick={() => onChange(d.id)}
            style={{
              padding: '10px 14px 11px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: isActive ? '#fafafa' : 'rgba(255,255,255,.45)',
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              letterSpacing: -0.1,
              position: 'relative',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'inherit',
              textTransform: 'capitalize',
              transition: 'color .15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,.75)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,.45)';
            }}
          >
            {isActive && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: accent,
                  boxShadow: `0 0 0 3px ${accent}33`,
                }}
              />
            )}
            {d.full}
          </button>
        );
      })}
      {underline.visible && (
        <span
          style={{
            position: 'absolute',
            bottom: -1,
            left: 0,
            height: 2,
            borderRadius: 2,
            background: accent,
            width: underline.width,
            transform: `translateX(${underline.left}px)`,
            transition:
              'transform .35s cubic-bezier(.22,.61,.36,1), width .35s cubic-bezier(.22,.61,.36,1)',
            pointerEvents: 'none',
            boxShadow: `0 0 12px ${accent}88`,
          }}
        />
      )}
      <div style={{ flex: 1 }} />
    </div>
  );
}

interface SeasonDropdownProps {
  seasons: Season[];
  current: Season | null;
  onChange: (s: Season | null) => void;
  onAdd: () => void;
  accent: string;
}

function SeasonDropdown({ seasons, current, onChange, onAdd, accent }: SeasonDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 9,
          padding: '7px 10px 7px 11px',
          borderRadius: 9,
          minWidth: 180,
          background: open ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.035)',
          border: `1px solid ${open ? `${accent}55` : 'rgba(255,255,255,.08)'}`,
          color: '#fafafa',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          letterSpacing: -0.1,
          transition: 'all .15s',
        }}
      >
        <Calendar size={13} style={{ color: accent }} />
        <span
          style={{
            flex: 1,
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {current ? formatSeasonName(current.name) : 'Sin temporada'}
        </span>
        <span
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,.4)',
            fontFamily: 'var(--font-mono), ui-monospace, monospace',
            padding: '1px 5px',
            borderRadius: 4,
            background: 'rgba(255,255,255,.04)',
          }}
        >
          {seasons.length}
        </span>
        <ChevronDown
          size={12}
          style={{
            opacity: 0.55,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .15s',
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 60,
            background: '#16161a',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 11,
            padding: 5,
            minWidth: 280,
            boxShadow:
              '0 24px 50px -16px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.02)',
            maxHeight: 420,
            overflow: 'auto',
            animation: 'cgFadeScale .18s cubic-bezier(.22,.61,.36,1) both',
            transformOrigin: 'top left',
          }}
        >
          <div
            style={{
              padding: '8px 10px 6px',
              fontSize: 10,
              fontWeight: 600,
              color: 'rgba(255,255,255,.4)',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Temporada
          </div>
          {seasons.map((s) => {
            const isCurrent = s.id === current?.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '8px 10px',
                  borderRadius: 7,
                  background: isCurrent ? 'rgba(255,255,255,.06)' : 'transparent',
                  cursor: 'pointer',
                  border: 'none',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,.035)';
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: isCurrent ? accent : 'rgba(255,255,255,.15)',
                    boxShadow: isCurrent ? `0 0 0 3px ${accent}33` : 'none',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: isCurrent ? '#fafafa' : 'rgba(255,255,255,.78)',
                    fontWeight: isCurrent ? 600 : 500,
                    letterSpacing: -0.1,
                  }}
                >
                  {formatSeasonName(s.name)}
                </span>
                <span
                  style={{
                    fontSize: 9.5,
                    color: 'rgba(255,255,255,.35)',
                    fontFamily: 'var(--font-mono), ui-monospace, monospace',
                  }}
                >
                  {s.id}
                </span>
              </button>
            );
          })}

          <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '5px 6px' }} />
          <button
            type="button"
            onClick={() => {
              onAdd();
              setOpen(false);
            }}
            style={{
              width: '100%',
              padding: '9px 10px',
              borderRadius: 7,
              border: 'none',
              background: 'transparent',
              color: accent,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              fontSize: 12.5,
              fontWeight: 600,
              textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${accent}14`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Plus size={14} /> Nueva temporada
          </button>
        </div>
      )}
    </div>
  );
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 9,
        flex: 1,
        background: 'rgba(255,255,255,.04)',
        border: '1px solid rgba(255,255,255,.06)',
      }}
    >
      <Search size={14} style={{ color: 'rgba(255,255,255,.4)' }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar anime…"
        style={{
          flex: 1,
          border: 'none',
          background: 'transparent',
          outline: 'none',
          color: '#fafafa',
          fontSize: 13,
          fontFamily: 'inherit',
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'rgba(255,255,255,.4)',
            padding: 2,
            lineHeight: 1,
            fontSize: 14,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
