'use client';

import { useRef, useState, useCallback } from 'react';
import { Player } from '@/types';
import { getTeamColors, type IPLTeam, type TeamColors } from '@/lib/team-colors';
import styles from '@/styles/components/PlayerChip.module.css';
import { classNames, conditionalClass } from '@/utils/classNames';
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
}

/**
 * PlayerChip Component
 * 
 * Displays player information in a chip format with team colors.
 * Follows Single Responsibility Principle: Only handles player chip display.
 * Follows Open/Closed Principle: Easy to extend with new statuses without modifying core logic.
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
}: PlayerChipProps) {
  const colors = getTeamColors(player.team as IPLTeam);
  const isClickable = onClick && !disabled && status === 'available';
  const [isHovered, setIsHovered] = useState(false);
  const chipRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const didResizeRef = useRef(false);

  const chipClasses = getChipClasses(!!isClickable, status ?? 'available', disabled ?? false);
  const chipStyles = getChipStyles(colors, !!isClickable, isHovered);
  if (width != null) (chipStyles as CSSProperties).width = width;
  else (chipStyles as CSSProperties).width = '100%';
  if (height != null) (chipStyles as CSSProperties).height = height;
  if (width != null || height != null) (chipStyles as CSSProperties).minWidth = MIN_WIDTH;
  if (height != null) (chipStyles as CSSProperties).minHeight = MIN_HEIGHT;

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
      className={chipClasses}
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
      <div className={styles.content}>
        <PlayerInfo player={player} />
        {player.isForeign && <ForeignBadge />}
      </div>

      {status === 'drafted' && <DraftedStatus />}

      {resizable && onResize && (
        <div
          className={styles.resizeHandle}
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
 * Get chip CSS classes based on state
 * Follows Single Responsibility: Only handles class name logic
 */
function getChipClasses(
  isClickable: boolean,
  status: 'available' | 'drafted',
  disabled: boolean
): string {
  return classNames(
    styles.chip,
    conditionalClass(isClickable, styles.clickable, styles.nonClickable),
    status === 'drafted' && styles.drafted,
    disabled && styles.disabled
  );
}

/**
 * Get chip inline styles based on team colors and hover state
 * Follows Single Responsibility: Only handles inline style logic
 */
function getChipStyles(
  colors: TeamColors,
  isClickable: boolean,
  isHovered: boolean
): CSSProperties {
  const baseStyles: CSSProperties = {
    backgroundColor: isClickable && isHovered ? colors.hover : colors.bg,
    borderColor: colors.border,
  };
  
  if (isClickable && isHovered) {
    baseStyles.boxShadow = `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 0 8px ${colors.border}40`;
  }
  
  return baseStyles;
}

/**
 * Player Information Component
 * Follows Single Responsibility: Only renders player details
 */
function PlayerInfo({ player }: { player: Player }) {
  return (
    <div className={styles.playerInfo}>
      <div className={styles.playerName}>
        {player.name}
      </div>
      <div className={styles.playerDetails}>
        <span className={styles.team}>{player.team}</span>
        <span className={styles.separator}>•</span>
        <span className={styles.role}>{player.role}</span>
      </div>
    </div>
  );
}

/**
 * Foreign Player Badge Component
 * Follows Single Responsibility: Only renders foreign player indicator
 */
function ForeignBadge() {
  return (
    <div 
      className={styles.foreignBadge}
      title="Foreign Player"
    >
      <span className={styles.foreignBadgeText}>F</span>
    </div>
  );
}

/**
 * Drafted Status Component
 * Follows Single Responsibility: Only renders drafted status
 */
function DraftedStatus() {
  return (
    <div className={styles.draftedStatus}>
      Drafted
    </div>
  );
}
