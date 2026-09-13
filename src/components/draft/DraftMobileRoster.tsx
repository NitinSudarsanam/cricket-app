'use client';

import { useEffect } from 'react';
import type { DraftConfig, Player } from '@/types';
import { Button } from '@/components/ui';
import { RosterSidebar } from './RosterSidebar';

interface DraftMobileRosterProps {
  open: boolean;
  roster: Player[];
  draftConfig: DraftConfig;
  participantName: string;
  onToggle: () => void;
  onClose: () => void;
  onPlayerDrop?: (playerId: string) => void;
}

export function DraftMobileRoster({
  open,
  roster,
  draftConfig,
  participantName,
  onToggle,
  onClose,
  onPlayerDrop,
}: DraftMobileRosterProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <>
      <Button
        type="button"
        onClick={onToggle}
        variant="success"
        aria-expanded={open}
        aria-controls="draft-mobile-roster"
        className="lg:hidden fixed bottom-20 right-4 z-30 rounded-full shadow-lg flex items-center gap-2 touch-manipulation active:scale-95 transition-transform"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span className="font-medium">My Roster ({roster.length})</span>
      </Button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
          <div
            id="draft-mobile-roster"
            role="dialog"
            aria-modal="true"
            aria-labelledby="draft-mobile-roster-title"
            className="relative w-full bg-white rounded-t-2xl shadow-xl max-h-[80vh] flex flex-col animate-slide-up"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 id="draft-mobile-roster-title" className="text-lg font-semibold text-slate-900">
                My Roster
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close roster"
                className="p-2 rounded-full hover:bg-gray-100 touch-manipulation"
              >
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <RosterSidebar
                roster={roster}
                draftConfig={draftConfig}
                participantName={participantName}
                onPlayerDrop={onPlayerDrop}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
