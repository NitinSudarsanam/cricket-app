'use client';

import { Player } from '@/types';
import { getTeamColors, type IPLTeam, type TeamColors } from '@/lib/team-colors';
import styles from '@/styles/components/PlayerChip.module.css';
import { classNames, conditionalClass } from '@/utils/classNames';
import { CSSProperties, useState } from 'react';

export interface PlayerChipProps {
  player: Player;
  status?: 'available' | 'drafted';
  onClick?: (player: Player) => void;
  disabled?: boolean;
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
  disabled = false 
}: PlayerChipProps) {
  const colors = getTeamColors(player.team as IPLTeam);
  const isClickable = onClick && !disabled && status === 'available';
  const [isHovered, setIsHovered] = useState(false);
  
  const chipClasses = getChipClasses(isClickable, status, disabled);
  const chipStyles = getChipStyles(colors, isClickable, isHovered);
  
  const handleClick = () => {
    if (isClickable) {
      onClick(player);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(player);
    }
  };

  return (
    <div
      className={chipClasses}
      style={chipStyles}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => isClickable && setIsHovered(true)}
      onMouseLeave={() => isClickable && setIsHovered(false)}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-disabled={disabled}
    >
      <div className={styles.content}>
        <PlayerInfo player={player} />
        {player.isForeign && <ForeignBadge />}
      </div>
      
      {status === 'drafted' && <DraftedStatus />}
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
