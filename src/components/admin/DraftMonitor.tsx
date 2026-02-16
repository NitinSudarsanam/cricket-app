'use client';

import React, { useState, useEffect } from 'react';
import { DraftState, Player, DraftStatus } from '@/types';
import { Modal } from '@/components/Modal';
import { Skeleton } from '@/components/Skeleton';
import { PlayerChip } from '@/components/PlayerChip';
import { Button, Badge, Card, StatDisplay } from '@/components/ui';

interface ParticipantWithRoster {
  id: string;
  name: string;
  email?: string;
  roster: Player[];
  teamCount: Record<string, number>;
  roleCount: Record<string, number>;
}

export function DraftMonitor() {
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithRoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);

  useEffect(() => {
    fetchDraftData();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchDraftData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDraftData = async () => {
    try {
      // Fetch draft state - handle all possible failure cases
      try {
        const stateResponse = await fetch('/api/draft/state');
        if (stateResponse.ok) {
          const stateResult = await stateResponse.json();
          if (stateResult?.success && stateResult?.data) {
            setDraftState(stateResult.data);
          } else {
            setDraftState(null);
          }
        } else {
          setDraftState(null);
        }
      } catch (stateErr) {
        console.error('Failed to fetch draft state:', stateErr);
        setDraftState(null);
      }

      // Fetch participants - handle all possible failure cases
      try {
        const participantsResponse = await fetch('/api/participants');
        if (participantsResponse.ok) {
          const participantsResult = await participantsResponse.json();
          
          // Ensure we have a valid array
          const participantsData = 
            participantsResult?.success && 
            Array.isArray(participantsResult?.data) && 
            participantsResult.data.length > 0
              ? participantsResult.data 
              : [];
          
          if (participantsData.length === 0) {
            setParticipants([]);
          } else {
            // Fetch roster for each participant with full error handling
            const participantsWithRosters = await Promise.all(
              participantsData.map(async (p: any) => {
                // Ensure participant has required fields
                if (!p || !p.id) {
                  return null;
                }
                
                try {
                  const rosterResponse = await fetch(`/api/participants/${p.id}/roster`);
                  if (rosterResponse.ok) {
                    const rosterResult = await rosterResponse.json();
                    if (rosterResult?.success && rosterResult?.data) {
                      // Merge participant data with roster data
                      return {
                        id: p.id,
                        name: p.name || rosterResult.data.name || 'Unknown',
                        email: p.email || rosterResult.data.email || undefined,
                        roster: Array.isArray(rosterResult.data.roster) ? rosterResult.data.roster : [],
                        teamCount: rosterResult.data.teamCount || {},
                        roleCount: rosterResult.data.roleCount || {},
                      };
                    }
                  }
                } catch (err) {
                  console.error(`Failed to fetch roster for ${p.id}:`, err);
                }
                
                // Return safe default with participant data
                return {
                  id: p.id,
                  name: p.name || 'Unknown',
                  email: p.email || undefined,
                  roster: [],
                  teamCount: {},
                  roleCount: {},
                };
              })
            );
            
            // Filter out any null values and set participants
            setParticipants(participantsWithRosters.filter((p): p is ParticipantWithRoster => p !== null));
          }
        } else {
          setParticipants([]);
        }
      } catch (participantsErr) {
        console.error('Failed to fetch participants:', participantsErr);
        setParticipants([]);
      }

      setError(null);
    } catch (err) {
      console.error('Unexpected error in fetchDraftData:', err);
      setError(err instanceof Error ? err.message : 'Failed to load draft data');
      // Ensure we have safe defaults even on error
      setDraftState(null);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseDraft = async () => {
    if (!draftState?.id) return;
    try {
      setActionLoading('pause');
      const response = await fetch('/api/draft/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause', draftStateId: draftState.id }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to pause draft');
      }
      await fetchDraftData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to pause draft');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeDraft = async () => {
    if (!draftState?.id) return;
    try {
      setActionLoading('resume');
      const response = await fetch('/api/draft/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume', draftStateId: draftState.id }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resume draft');
      }
      await fetchDraftData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to resume draft');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetDraft = async () => {
    if (!draftState?.id) {
      alert('No draft selected.');
      return;
    }
    if (!confirm('Are you sure you want to reset the draft? This will clear all picks and cannot be undone.')) {
      return;
    }
    try {
      setActionLoading('reset');
      const response = await fetch('/api/draft/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftStateId: draftState.id }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset draft');
      }
      await fetchDraftData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reset draft');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartDraft = async (selectedParticipantIds: string[], draftOrder: 'linear' | 'snake') => {
    try {
      setActionLoading('start');
      const response = await fetch('/api/draft/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantIds: selectedParticipantIds,
          draftOrder,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start draft');
      }
      
      setShowStartModal(false);
      await fetchDraftData();
      
      // Redirect to draft page
      window.location.href = '/draft';
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start draft');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-40 rounded-md" />
          <Skeleton className="h-40 rounded-md" />
        </div>
        <div className="card-padded stack-lg">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Safe checks for draft state
  const isDraftActive = Boolean(
    draftState && 
    draftState.status && 
    draftState.status !== 'not_started'
  );
  
  // Current participant on the clock (respects snake vs linear draft order)
  const currentParticipantIdOnClock = isDraftActive && draftState && Array.isArray(draftState.participantOrder) && draftState.participantOrder.length > 0 && typeof draftState.currentPickIndex === 'number' && draftState.currentPickIndex >= 0
    ? (() => {
        const { currentRound, currentPickIndex, participantOrder, draftOrderType } = draftState;
        const orderType = draftOrderType === 'linear' ? 'linear' : 'snake';
        const isSnakeRound = orderType === 'snake' && currentRound % 2 === 0;
        return isSnakeRound
          ? participantOrder[participantOrder.length - 1 - currentPickIndex]
          : participantOrder[currentPickIndex];
      })()
    : null;

  const currentParticipant =
    currentParticipantIdOnClock && Array.isArray(participants) && participants.length > 0
      ? participants.find(p => p?.id === currentParticipantIdOnClock) ?? null
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Draft Monitor</h2>
          <p className="text-sm text-slate-600 mt-1">
            Monitor active draft and manage participants
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          {draftState?.status === 'completed' && (
            <a href="/admin/results" className="btn-success inline-flex items-center">
              View Results
            </a>
          )}
          {!isDraftActive && Array.isArray(participants) && participants.length > 0 && (
            <Button
              onClick={() => setShowStartModal(true)}
              disabled={actionLoading === 'start'}
              variant="success"
            >
              {actionLoading === 'start' ? 'Starting...' : 'Start Draft'}
            </Button>
          )}
          {isDraftActive && draftState && (
            <React.Fragment key="draft-active-buttons">
              <a href="/draft" className="btn-success inline-flex items-center">
                View Draft
              </a>
              {draftState.status === 'in_progress' && (
                <Button
                  onClick={handlePauseDraft}
                  disabled={actionLoading === 'pause'}
                >
                  {actionLoading === 'pause' ? 'Pausing...' : 'Pause Draft'}
                </Button>
              )}
              {draftState.status === 'paused' && (
                <Button
                  onClick={handleResumeDraft}
                  disabled={actionLoading === 'resume'}
                  variant="success"
                >
                  {actionLoading === 'resume' ? 'Resuming...' : 'Resume Draft'}
                </Button>
              )}
              <Button
                onClick={handleResetDraft}
                disabled={actionLoading === 'reset'}
                variant="danger"
              >
                {actionLoading === 'reset' ? 'Resetting...' : 'Reset Draft'}
              </Button>
            </React.Fragment>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {/* Draft Status */}
      {isDraftActive && draftState ? (
        <Card padded className="stack-md">
          <h3 className="heading-md">Draft Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div>
              <div className="data-label">Status</div>
              <div className="mt-1">
                <StatusBadge status={draftState.status} />
              </div>
            </div>
            <StatDisplay label="Current Round" value={draftState.currentRound} size="md" />
            <StatDisplay label="Total Picks" value={draftState.picks?.length || 0} size="md" />
            <div className="col-span-2 md:col-span-1">
              <div className="data-label">On the Clock</div>
              <div className="stat-value-highlight mt-1 truncate">
                {currentParticipant?.name || 'Unknown'}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card padded className="text-center">
          <div className="text-slate-500 mb-2">
            <svg
              className="w-12 h-12 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No Active Draft</h3>
          <p className="text-sm text-slate-600">
            Start a draft to begin monitoring
          </p>
        </Card>
      )}

      {/* Participants and Rosters */}
      <Card padded className="p-0 draft-monitor-card">
        <div className="p-6 border-b border-slate-200">
          <h3 className="heading-md">
            Participants ({Array.isArray(participants) ? participants.length : 0})
          </h3>
        </div>
        
        {!Array.isArray(participants) || participants.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-slate-500 mb-3">
              <svg
                className="w-12 h-12 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <p className="text-slate-900 font-medium mb-1">No Participants Yet</p>
            <p className="text-sm text-slate-600 mb-4">
              Add participants to start a draft
            </p>
            <a
              href="/admin/participants"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Participants
            </a>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {participants.map((participant) => 
              participant && participant.id ? (
                <ParticipantRosterView
                  key={participant.id}
                  participant={participant}
                  isOnClock={currentParticipant?.id === participant.id}
                />
              ) : null
            )}
          </div>
        )}
      </Card>

      {/* Recent Picks */}
      {isDraftActive && 
       draftState && 
       Array.isArray(draftState.picks) && 
       draftState.picks.length > 0 && (
        <Card padded className="p-0">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              Recent Picks
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {[...draftState.picks]
                .reverse()
                .slice(0, 20)
                .map((pick, index) => {
                  if (!pick) return null;
                  
                  const participant = Array.isArray(participants) 
                    ? participants.find(p => p?.id === pick.participantId) 
                    : null;
                  const player = participant?.roster && Array.isArray(participant.roster)
                    ? participant.roster.find(pl => pl?.id === pick.playerId)
                    : null;
                  
                  return (
                    <div
                      key={`recent-pick-${pick.round}-${pick.pickNumber}-${index}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-slate-500">
                          R{pick.round || '?'} P{pick.pickNumber || '?'}
                        </div>
                        <div className="text-sm font-medium text-slate-900">
                          {participant?.name || 'Unknown'}
                        </div>
                      </div>
                      <div className="text-sm text-slate-700">
                        {player ? `${player.name} (${player.team} - ${player.role})` : 'Unknown Player'}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </Card>
      )}

      {/* Start Draft Modal */}
      {showStartModal && (
        <StartDraftModal
            participants={participants}
            onStart={handleStartDraft}
            onClose={() => setShowStartModal(false)}
            isLoading={actionLoading === 'start'}
          />
      )}
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: DraftStatus }) {
  const statusConfig = {
    not_started: { label: 'Not Started', variant: 'neutral' as const },
    in_progress: { label: 'In Progress', variant: 'success' as const },
    paused: { label: 'Paused', variant: 'warning' as const },
    completed: { label: 'Completed', variant: 'info' as const },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant}>{config.label}</Badge>
  );
}

// Participant Roster View Component
function ParticipantRosterView({
  participant,
  isOnClock,
}: {
  participant: ParticipantWithRoster;
  isOnClock: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Safe access to participant properties
  const rosterLength = Array.isArray(participant?.roster) ? participant.roster.length : 0;
  const teamCount = participant?.teamCount || {};
  const roleCount = participant?.roleCount || {};
  const teamsUsed = Object.keys(teamCount).filter(t => teamCount[t] > 0).length;

  return (
    <div className={`p-6 ${isOnClock ? 'bg-emerald-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900">{participant?.name || 'Unknown'}</h4>
              {isOnClock && (
                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-600 text-white rounded">
                  On Clock
                </span>
              )}
            </div>
            {participant?.email && (
              <div className="text-sm text-slate-600">{participant.email}</div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-slate-600">Players: </span>
            <span className="font-medium text-slate-900">{rosterLength}</span>
          </div>
          <div>
            <span className="text-slate-600">Teams: </span>
            <span className="font-medium text-slate-900">{teamsUsed}</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          {rosterLength === 0 ? (
            <p className="text-sm text-slate-500">No players drafted yet</p>
          ) : (
            <>
              {/* Role Summary */}
              {roleCount && Object.keys(roleCount).length > 0 && (
                <div className="mb-4 grid grid-cols-4 gap-4">
                  {Object.entries(roleCount).map(([role, count]) => (
                    <div key={role} className="text-sm">
                      <span className="text-slate-600">{role}: </span>
                      <span className="font-medium text-slate-900">{count || 0}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Player List */}
              {Array.isArray(participant.roster) && participant.roster.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {participant.roster.map((player) => 
                    player && player.id ? (
                      <PlayerChip
                        key={player.id}
                        player={player}
                        status="drafted"
                      />
                    ) : null
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Start Draft Modal Component
function StartDraftModal({
  participants,
  onStart,
  onClose,
  isLoading,
}: {
  participants: ParticipantWithRoster[];
  onStart: (participantIds: string[], draftOrder: 'linear' | 'snake') => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  // Safe participant list
  const validParticipants = Array.isArray(participants) 
    ? participants.filter(p => p && p.id)
    : [];
  
  // Initialize with all valid participants selected
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(() =>
    validParticipants.map(p => p.id)
  );
  const [draftOrder, setDraftOrder] = useState<'linear' | 'snake'>('snake');

  // Update selected participants if the participants prop changes
  React.useEffect(() => {
    setSelectedParticipants(validParticipants.map(p => p.id));
  }, [participants.length]);

  const toggleParticipant = (id: string) => {
    if (!id) return;
    setSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!Array.isArray(selectedParticipants) || selectedParticipants.length < 2) {
      alert('Please select at least 2 participants');
      return;
    }
    onStart(selectedParticipants, draftOrder);
  };

  return (
    <Modal
      open
      title="Start Draft"
      onClose={onClose}
      size="lg"
      closeOnBackdropClick={!isLoading}
    >
      <p className="text-sm text-slate-600 mb-6">
        Select participants and draft order
      </p>
      <div className="space-y-6">
          {/* Participants Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Select Participants ({Array.isArray(selectedParticipants) ? selectedParticipants.length : 0} selected)
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200 rounded-md p-3">
              {validParticipants.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-sm">
                  No participants available
                </div>
              ) : (
                validParticipants.map(participant => (
                  <label
                    key={participant.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedParticipants.includes(participant.id)}
                      onChange={() => toggleParticipant(participant.id)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div>
                      <div className="font-medium text-slate-900">{participant.name || 'Unknown'}</div>
                      {participant.email && (
                        <div className="text-sm text-slate-500">{participant.email}</div>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Draft Order */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Draft Order
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="draftOrder"
                  value="snake"
                  checked={draftOrder === 'snake'}
                  onChange={() => setDraftOrder('snake')}
                  className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-medium text-slate-900">Snake Draft (Recommended)</div>
                  <div className="text-sm text-slate-600">
                    Order reverses each round (1-2-3-4, then 4-3-2-1)
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="draftOrder"
                  value="linear"
                  checked={draftOrder === 'linear'}
                  onChange={() => setDraftOrder('linear')}
                  className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-medium text-slate-900">Linear Draft</div>
                  <div className="text-sm text-slate-600">
                    Same order every round (1-2-3-4, then 1-2-3-4)
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || selectedParticipants.length < 2}
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          {isLoading ? 'Starting...' : 'Start Draft'}
        </button>
      </div>
    </Modal>
  );
}
