'use client';

import { useEffect, useRef, useState } from 'react';
import { Edit2, ExternalLink, Star, Trash2 } from 'lucide-react';
import type { Anime, User, UserStatus } from '@/types';
import { toMALSlug } from '@/lib/utils';
import { Cover } from './cover';
import { DAYS_FULL, STATUS_META, USER_META, nextEpisode } from './constants';
import { StatusSelect } from './status-select';
import { DayPicker } from './day-picker';
import { EpPipGrid } from './ep-pip-grid';

interface AnimeCardProps {
  anime: Anime;
  editMode: boolean;
  accent: string;
  showPipsAlways: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onEpisodeToggle: (user: User, ep: number) => void;
  onStatusChange: (user: User, status: UserStatus) => void;
  onDayChange: (day: string) => void;
  onEpisodesChange: (episodes: number) => void;
  onDelete: () => void;
  getLocalEpisodes: (user: User) => number[];
  getLocalStatus: (user: User) => UserStatus;
  getDisplayMax: (user: User) => number;
  getLocalDay: () => string | undefined;
}

export function AnimeCard({
  anime,
  editMode,
  accent,
  showPipsAlways,
  expanded,
  onToggleExpand,
  onEpisodeToggle,
  onStatusChange,
  onDayChange,
  onEpisodesChange,
  onDelete,
  getLocalEpisodes,
  getLocalStatus,
  getDisplayMax,
  getLocalDay,
}: AnimeCardProps) {
  const [hovering, setHovering] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menuOpen]);

  const ezeEps = getLocalEpisodes('eze');
  const panchoEps = getLocalEpisodes('pancho');
  const ezeStatus = getLocalStatus('eze');
  const panchoStatus = getLocalStatus('pancho');
  const day = getLocalDay();
  const maxEze = getDisplayMax('eze');
  const maxPancho = getDisplayMax('pancho');

  const synced =
    ezeEps.length === panchoEps.length &&
    ezeEps.length > 0 &&
    ezeStatus === 'viendo' &&
    panchoStatus === 'viendo';

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        borderRadius: 14,
        overflow: 'visible',
        background: 'rgba(255,255,255,.025)',
        border: `1px solid ${
          expanded ? `${accent}55` : hovering ? `${accent}44` : 'rgba(255,255,255,.06)'
        }`,
        display: 'flex',
        flexDirection: 'column',
        transition:
          'border-color .2s ease, transform .25s cubic-bezier(.22,.61,.36,1), box-shadow .25s ease',
        transform: hovering && !expanded ? 'translateY(-3px)' : 'none',
        boxShadow: hovering
          ? `0 22px 44px -20px rgba(0,0,0,.75), 0 0 0 1px ${accent}33`
          : '0 4px 12px -6px rgba(0,0,0,.3)',
        position: 'relative',
      }}
    >
      {/* COVER */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '3/4',
          cursor: 'pointer',
          overflow: 'hidden',
          borderTopLeftRadius: 13,
          borderTopRightRadius: 13,
        }}
        onClick={onToggleExpand}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: hovering ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform .55s cubic-bezier(.22,.61,.36,1)',
          }}
        >
          <Cover anime={anime} />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,.08) 30%, rgba(0,0,0,.6) 72%, rgba(0,0,0,.92))',
          }}
        />

        {hovering && (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '40%',
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent)',
                animation: 'cgShine 1.1s ease-out',
              }}
            />
          </div>
        )}

        {/* TOP: day + score · edit menu */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            right: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          {editMode ? (
            <DayPicker value={day} onChange={onDayChange} accent={accent} />
          ) : (
            <span
              style={{
                padding: '4px 9px',
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 700,
                background: 'rgba(0,0,0,.55)',
                backdropFilter: 'blur(8px)',
                color: 'rgba(255,255,255,.9)',
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                border: '1px solid rgba(255,255,255,.1)',
              }}
            >
              {DAYS_FULL.find((d) => d.id === day)?.short || '—'}
            </span>
          )}

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {anime.score != null && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '4px 8px 4px 7px',
                  borderRadius: 6,
                  background: 'rgba(0,0,0,.55)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,.1)',
                  color: '#fbbf24',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                <Star size={10} fill="currentColor" strokeWidth={0} />
                {anime.score.toFixed(1)}
              </span>
            )}
            {editMode && (
              <div
                ref={menuRef}
                style={{ position: 'relative' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((o) => !o);
                  }}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,.1)',
                    background: 'rgba(0,0,0,.55)',
                    backdropFilter: 'blur(8px)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 14,
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ⋯
                </button>
                {menuOpen && (
                  <CardMenu
                    episodes={anime.episodes}
                    onSaveEpisodes={(v) => {
                      onEpisodesChange(v);
                      setMenuOpen(false);
                    }}
                    onDelete={() => {
                      onDelete();
                      setMenuOpen(false);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {synced && !editMode && (
          <div
            style={{
              position: 'absolute',
              top: 44,
              left: 10,
              padding: '3px 8px 3px 6px',
              borderRadius: 999,
              background: 'rgba(34,197,94,.22)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(34,197,94,.4)',
              color: '#86efac',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              textTransform: 'uppercase',
              animation: 'cgFadeUp .35s cubic-bezier(.22,.61,.36,1) both',
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                background: '#22c55e',
                animation: 'cgStatusPulse 1.8s ease-in-out infinite',
                ['--pulse-color' as string]: 'rgba(34,197,94,.4)',
              } as React.CSSProperties}
            />
            Sync
          </div>
        )}

        {/* TITLE bottom */}
        <div style={{ position: 'absolute', bottom: 10, left: 13, right: 13 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.15,
              letterSpacing: -0.2,
              textShadow: '0 1px 4px rgba(0,0,0,.6)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {anime.title}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 5,
              fontSize: 11,
              color: 'rgba(255,255,255,.6)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>
              {anime.episodes || '?'} eps
            </span>
            {anime.malId > 0 && (
              <a
                href={`https://myanimelist.net/anime/${anime.malId}/${toMALSlug(anime.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  color: 'rgba(255,255,255,.55)',
                  textDecoration: 'none',
                  padding: '1px 4px',
                  borderRadius: 3,
                  fontSize: 10,
                }}
              >
                <ExternalLink size={9} /> MAL
              </a>
            )}
          </div>
        </div>
      </div>

      {/* USER PROGRESS */}
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(['eze', 'pancho'] as User[]).map((u) => (
          <UserRow
            key={u}
            user={u}
            status={getLocalStatus(u)}
            episodes={getLocalEpisodes(u)}
            max={u === 'eze' ? maxEze : maxPancho}
            editMode={editMode}
            onStatusChange={(s) => onStatusChange(u, s)}
            onMarkNext={() => {
              const next = nextEpisode(getLocalEpisodes(u), u === 'eze' ? maxEze : maxPancho);
              if (next != null) onEpisodeToggle(u, next);
            }}
          />
        ))}
      </div>

      {(showPipsAlways || expanded || editMode) && (
        <div
          style={{
            padding: '0 14px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            borderTop: '1px solid rgba(255,255,255,.05)',
            paddingTop: 12,
            marginTop: -2,
          }}
        >
          {(['eze', 'pancho'] as User[]).map((u) => (
            <EpRow
              key={u}
              user={u}
              episodes={getLocalEpisodes(u)}
              max={u === 'eze' ? maxEze : maxPancho}
              editMode={editMode}
              onToggle={(ep) => onEpisodeToggle(u, ep)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface UserRowProps {
  user: User;
  status: UserStatus;
  episodes: number[];
  max: number;
  editMode: boolean;
  onStatusChange: (s: UserStatus) => void;
  onMarkNext: () => void;
}

function UserRow({ user, status, episodes, max, editMode, onStatusChange, onMarkNext }: UserRowProps) {
  const u = USER_META[user];
  const s = STATUS_META[status];
  const dim = ['pendiente', 'dropeado', 'ni_en_un_millon'].includes(status);
  const watched = episodes.length;
  const canMarkNext = status === 'viendo' && watched < max;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          background: `linear-gradient(135deg, ${u.color}, color-mix(in oklch, ${u.color} 60%, #000))`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9.9,
          fontWeight: 700,
          color: '#0a0a0b',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18)',
          flexShrink: 0,
        }}
      >
        {u.initial}
      </span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {editMode ? (
            <StatusSelect value={status} onChange={onStatusChange} />
          ) : (
            <span style={{ fontSize: 12, color: s.text, fontWeight: 500 }}>{s.label}</span>
          )}
          <span
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono), ui-monospace, monospace',
              color: 'rgba(255,255,255,.55)',
            }}
          >
            <span style={{ color: watched > 0 ? u.color : 'rgba(255,255,255,.4)', fontWeight: 600 }}>
              {watched}
            </span>
            <span style={{ color: 'rgba(255,255,255,.3)' }}>/{max}</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <div
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              overflow: 'hidden',
              background: 'rgba(255,255,255,.07)',
            }}
          >
            <div
              style={{
                width: `${max > 0 ? Math.min(100, (watched / max) * 100) : 0}%`,
                height: '100%',
                background: dim ? 'rgba(255,255,255,.18)' : u.color,
                borderRadius: 999,
                transition: 'width .55s cubic-bezier(.22,.61,.36,1), background .25s ease',
                boxShadow: dim ? 'none' : `0 0 8px ${u.color}55`,
              }}
            />
          </div>
        </div>
      </div>
      {canMarkNext && !editMode && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMarkNext();
          }}
          title={`Marcar ep ${watched + 1}`}
          style={{
            padding: '5px 8px',
            borderRadius: 7,
            background: `${u.color}22`,
            color: u.color,
            border: `1px solid ${u.color}44`,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-mono), ui-monospace, monospace',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            lineHeight: 1,
            transition: 'transform .15s ease, background .2s ease, box-shadow .2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(2px)';
            e.currentTarget.style.background = `${u.color}33`;
            e.currentTarget.style.boxShadow = `0 0 14px ${u.color}55`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.background = `${u.color}22`;
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          +{watched + 1}
        </button>
      )}
    </div>
  );
}

interface EpRowProps {
  user: User;
  episodes: number[];
  max: number;
  editMode: boolean;
  onToggle: (ep: number) => void;
}

function EpRow({ user, episodes, max, editMode, onToggle }: EpRowProps) {
  const u = USER_META[user];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            color: 'rgba(255,255,255,.4)',
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {u.name}
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.05)' }} />
      </div>
      <EpPipGrid episodes={episodes} max={max} color={u.color} editMode={editMode} onToggle={onToggle} />
    </div>
  );
}

interface CardMenuProps {
  episodes: number;
  onSaveEpisodes: (n: number) => void;
  onDelete: () => void;
}

function CardMenu({ episodes, onSaveEpisodes, onDelete }: CardMenuProps) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(String(episodes));

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 4,
        zIndex: 50,
        background: '#18181b',
        border: '1px solid rgba(255,255,255,.1)',
        borderRadius: 8,
        padding: 4,
        minWidth: 200,
        boxShadow: '0 12px 32px -8px rgba(0,0,0,.7)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {!editing ? (
        <button
          type="button"
          onClick={() => {
            setV(String(episodes));
            setEditing(true);
          }}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '7px 10px',
            borderRadius: 5,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            fontSize: 12,
            color: 'rgba(255,255,255,.85)',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Edit2 size={13} style={{ opacity: 0.7 }} />
          Cambiar episodios ({episodes})
        </button>
      ) : (
        <div style={{ padding: 6, display: 'flex', gap: 6 }}>
          <input
            type="number"
            value={v}
            onChange={(e) => setV(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEpisodes(parseInt(v, 10) || 1);
              if (e.key === 'Escape') setEditing(false);
            }}
            style={{
              flex: 1,
              padding: '5px 8px',
              borderRadius: 5,
              background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.12)',
              color: '#fff',
              fontSize: 12,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => onSaveEpisodes(parseInt(v, 10) || 1)}
            style={{
              padding: '5px 10px',
              borderRadius: 5,
              border: 'none',
              background: '#6366f1',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            OK
          </button>
        </div>
      )}

      <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '4px 0' }} />
      <button
        type="button"
        onClick={onDelete}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '7px 10px',
          borderRadius: 5,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          fontSize: 12,
          color: '#fca5a5',
          fontFamily: 'inherit',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,.12)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Trash2 size={13} />
        Eliminar anime
      </button>
    </div>
  );
}
