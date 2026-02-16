'use client';

import { useRef, useState, useCallback } from 'react';
import { Player } from '@/types';
import { getTeamColors, type IPLTeam } from '@/config/team-colors';
import { cn } from '@/lib/utils';
import { CSSProperties } from 'react';

const MIN_WIDTH = 120;
const MAX_WIDTH = 400;
const MIN_HEIGHT = 56;

export interface PlayerChipProps {
  player: Player;
  status?: 'available' | 'drafted';
  onClick?: (player: Player) => void;
  disabled?: boolean;
  width?: number;
  height?: number;
  onResize?: (width: number, height: number) => void;
  resizable?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, player: Player) => void;
  className?: string;
}

/**
 * PlayerChip Component
 * 
 * Displays player information in a chip format with team colors.
 * Uses semantic CSS classes for cleaner markup.
 */
export function PlayerChip({
  player,
  status = 'available',
  onClick,
  disabled = false,
  width,
  height,
  onResize,
  resizable = false,
  draggable: draggableProp = false,
  onDragStart,
  className,
}: PlayerChipProps) {
  const colors = getTeamColors(player.team as IPLTeam);
  const isClickable = onClick && !disabled && status === 'available';
  const [isHovered, setIsHovered] = useState(false);
  const chipRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const didResizeRef = useRef(false);

  // Dynamic styles for team colors
  const chipStyles = {
    ['--team-bg' as any]: isClickable && isHovered ? colors.hover : colors.bg,
    ['--team-border' as any]: colors.border,
    backgroundColor: 'var(--team-bg)',
    borderColor: 'var(--team-border)',
    ...(width != null ? { width } : { width: '100%' }),
    ...(height != null ? { height } : {}),
    ...(width != null || height != null ? { minWidth: MIN_WIDTH } : {}),
    ...(height != null ? { minHeight: MIN_HEIGHT } : {}),
    ...(isClickable && isHovered ? {
      boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 0 8px ${colors.border}40`
    } : {})
  } as CSSProperties;

  const handleClick = useCallback(() => {
    if (didResizeRef.current) {
      didResizeRef.current = false;
      return;
    }
    if (isClickable) {
      onClick(player);
    }
  }, [isClickable, onClick, player]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(player);
    }
  };

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (!draggableProp || disabled) return;
      e.dataTransfer.setData('application/json', JSON.stringify({ playerId: player.id }));
      e.dataTransfer.effectAllowed = 'copy';
      onDragStart?.(e, player);
    },
    [draggableProp, disabled, player, onDragStart]
  );

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      if (!resizable || !onResize || !chipRef.current) return;
      const rect = chipRef.current.getBoundingClientRect();
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        w: rect.width,
        h: rect.height,
      };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [resizable, onResize]
  );

  const handleResizePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const start = resizeStartRef.current;
      if (!start) return;
      didResizeRef.current = true;
      const dw = e.clientX - start.x;
      const dh = e.clientY - start.y;
      const newW = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, start.w + dw));
      const newH = Math.max(MIN_HEIGHT, start.h + dh);
      onResize?.(newW, newH);
    },
    [onResize]
  );

  const handleResizePointerUp = useCallback((e: React.PointerEvent) => {
    if (resizeStartRef.current && e.target instanceof HTMLElement) {
      e.target.releasePointerCapture?.(e.pointerId);
    }
    resizeStartRef.current = null;
  }, []);

  const isDraggable = draggableProp && !disabled && status === 'available';

  return (
    <div
      ref={chipRef}
      className={cn(
        'chip',
        isClickable ? 'chip-clickable' : '',
        status === 'available' ? 'chip-available' : '',
        status === 'drafted' ? 'chip-drafted' : '',
        disabled ? 'chip-disabled' : '',
        className
      )}
      style={chipStyles}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => isClickable && setIsHovered(true)}
      onMouseLeave={() => isClickable && setIsHovered(false)}
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-disabled={disabled}
    >
      <div className="chip-content">
        <PlayerInfo player={player} />
        {player.isForeign && <ForeignBadge />}
      </div>

      {status === 'drafted' && <DraftedStatus />}

      {resizable && onResize && (
        <div
          className="chip-resize-handle"
          role="separator"
          aria-label="Resize card"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerLeave={handleResizePointerUp}
        />
      )}
    </div>
  );
}

/**
 * Player Information Component
 */
function PlayerInfo({ player }: { player: Player }) {
  return (
    <div className="chip-player-info">
      <div className="chip-player-name">
        {player.name}
      </div>
      <div className="chip-player-details">
        <span className="chip-player-team">{player.team}</span>
        <span className="chip-player-separator">•</span>
        <span className="chip-player-role">{player.role}</span>
      </div>
    </div>
  );
}

/**
 * Foreign Player Badge Component
 */
function ForeignBadge() {
  return (
    <div
      className="chip-foreign-badge"
      title="Foreign Player"
    >
      <span className="chip-foreign-badge-text">F</span>
    </div>
  );
}

/**
 * Drafted Status Component
 */
function DraftedStatus() {
  return (
    <div className="chip-drafted-status">
      Drafted
    </div>
  );
}
