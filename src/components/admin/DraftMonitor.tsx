'use client';

import React, { useState, useEffect } from 'react';
import { DraftState, Player, DraftStatus } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PlayerChip } from '@/components/PlayerChip';

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
    try {
      setActionLoading('pause');
      const response = await fetch('/api/draft/pause', {
        method: 'POST',
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

  const handleResetDraft = async () => {
    if (!confirm('Are you sure you want to reset the draft? This will clear all picks and cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading('reset');
      const response = await fetch('/api/draft/reset', {
        method: 'POST',
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
    return <LoadingSpinner variant="full-page" />;
  }

  // Safe checks for draft state
  const isDraftActive = Boolean(
    draftState && 
    draftState.status && 
    draftState.status !== 'not_started'
  );
  
  // Safe check for current participant
  const currentParticipant = 
    isDraftActive && 
    draftState && 
    Array.isArray(draftState.participantOrder) && 
    draftState.participantOrder.length > 0 &&
    typeof draftState.currentPickIndex === 'number' &&
    draftState.currentPickIndex >= 0 &&
    Array.isArray(participants) &&
    participants.length > 0
      ? participants.find(p => p?.id === draftState.participantOrder?.[draftState.currentPickIndex])
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Draft Monitor</h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitor active draft and manage participants
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          {draftState?.status === 'completed' && (
            <a
              href="/admin/results"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              📊 View Results
            </a>
          )}
          {!isDraftActive && Array.isArray(participants) && participants.length > 0 && (
            <button
              onClick={() => {
                console.log('Start Draft clicked, participants:', participants);
                setShowStartModal(true);
              }}
              disabled={actionLoading === 'start'}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'start' ? 'Starting...' : '🚀 Start Draft'}
            </button>
          )}
          {isDraftActive && draftState && draftState.status !== 'completed' && (
            <React.Fragment key="draft-active-buttons">
              <a
                href="/draft"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                👁️ View Draft
              </a>
              <button
                onClick={handlePauseDraft}
                disabled={actionLoading === 'pause' || draftState?.status === 'paused'}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'pause' ? 'Pausing...' : draftState?.status === 'paused' ? 'Paused' : 'Pause Draft'}
              </button>
              <button
                onClick={handleResetDraft}
                disabled={actionLoading === 'reset'}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'reset' ? 'Resetting...' : 'Reset Draft'}
              </button>
            </React.Fragment>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Draft Status */}
      {isDraftActive && draftState ? (
        <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Draft Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div>
              <div className="text-xs md:text-sm text-gray-600">Status</div>
              <div className="mt-1">
                <StatusBadge status={draftState.status} />
              </div>
            </div>
            <div>
              <div className="text-xs md:text-sm text-gray-600">Current Round</div>
              <div className="text-base md:text-lg font-semibold text-gray-900 mt-1">
                {draftState.currentRound}
              </div>
            </div>
            <div>
              <div className="text-xs md:text-sm text-gray-600">Total Picks</div>
              <div className="text-base md:text-lg font-semibold text-gray-900 mt-1">
                {draftState.picks?.length || 0}
              </div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="text-xs md:text-sm text-gray-600">On the Clock</div>
              <div className="text-base md:text-lg font-semibold text-blue-600 mt-1 truncate">
                {currentParticipant?.name || 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 text-center">
          <div className="text-gray-500 mb-2">
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
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Active Draft</h3>
          <p className="text-sm text-gray-600">
            Start a draft to begin monitoring
          </p>
        </div>
      )}

      {/* Participants and Rosters */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Participants ({Array.isArray(participants) ? participants.length : 0})
          </h3>
          {/* Debug */}
          <div className="mt-2 text-xs text-gray-500">
            Debug: {JSON.stringify(participants.map(p => ({ id: p?.id, name: p?.name })))}
          </div>
        </div>
        
        {!Array.isArray(participants) || participants.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-3">
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
            <p className="text-gray-900 font-medium mb-1">No Participants Yet</p>
            <p className="text-sm text-gray-600 mb-4">
              Add participants to start a draft
            </p>
            <a
              href="/admin/participants"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
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
      </div>

      {/* Recent Picks */}
      {isDraftActive && 
       draftState && 
       Array.isArray(draftState.picks) && 
       draftState.picks.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
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
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-gray-500">
                          R{pick.round || '?'} P{pick.pickNumber || '?'}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {participant?.name || 'Unknown'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-700">
                        {player ? `${player.name} (${player.team} - ${player.role})` : 'Unknown Player'}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Start Draft Modal */}
      {showStartModal && (
        <>
          {console.log('Rendering modal with participants:', participants)}
          <StartDraftModal
            participants={participants}
            onStart={handleStartDraft}
            onClose={() => setShowStartModal(false)}
            isLoading={actionLoading === 'start'}
          />
        </>
      )}
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: DraftStatus }) {
  const statusConfig = {
    not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-700' },
    in_progress: { label: 'In Progress', color: 'bg-green-100 text-green-700' },
    paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-700' },
    completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700' },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
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
    <div className={`p-6 ${isOnClock ? 'bg-blue-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
              <h4 className="font-semibold text-gray-900">{participant?.name || 'Unknown'}</h4>
              {isOnClock && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded">
                  On Clock
                </span>
              )}
            </div>
            {participant?.email && (
              <div className="text-sm text-gray-600">{participant.email}</div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-gray-600">Players: </span>
            <span className="font-medium text-gray-900">{rosterLength}</span>
          </div>
          <div>
            <span className="text-gray-600">Teams: </span>
            <span className="font-medium text-gray-900">{teamsUsed}</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {rosterLength === 0 ? (
            <p className="text-sm text-gray-500">No players drafted yet</p>
          ) : (
            <>
              {/* Role Summary */}
              {roleCount && Object.keys(roleCount).length > 0 && (
                <div className="mb-4 grid grid-cols-4 gap-4">
                  {Object.entries(roleCount).map(([role, count]) => (
                    <div key={role} className="text-sm">
                      <span className="text-gray-600">{role}: </span>
                      <span className="font-medium text-gray-900">{count || 0}</span>
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
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(() => {
    const ids = validParticipants.map(p => p.id);
    console.log('StartDraftModal initialized with participants:', ids);
    return ids;
  });
  const [draftOrder, setDraftOrder] = useState<'linear' | 'snake'>('snake');

  // Update selected participants if the participants prop changes
  React.useEffect(() => {
    const ids = validParticipants.map(p => p.id);
    console.log('Participants changed, updating selection:', ids);
    setSelectedParticipants(ids);
  }, [participants.length]);

  const toggleParticipant = (id: string) => {
    if (!id) return;
    console.log('Toggling participant:', id);
    setSelectedParticipants(prev => {
      const newSelection = prev.includes(id) 
        ? prev.filter(p => p !== id) 
        : [...prev, id];
      console.log('New selection:', newSelection);
      return newSelection;
    });
  };

  const handleSubmit = () => {
    console.log('Submit clicked with selection:', selectedParticipants);
    if (!Array.isArray(selectedParticipants) || selectedParticipants.length < 2) {
      alert('Please select at least 2 participants');
      return;
    }
    onStart(selectedParticipants, draftOrder);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Start Draft</h3>
          <p className="text-sm text-gray-600 mt-1">
            Select participants and draft order
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Debug Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs">
            <div><strong>Debug:</strong></div>
            <div>Valid Participants: {validParticipants.length}</div>
            <div>Selected: {selectedParticipants.length}</div>
            <div>IDs: {JSON.stringify(validParticipants.map(p => p.id))}</div>
            <div>Selected IDs: {JSON.stringify(selectedParticipants)}</div>
          </div>

          {/* Participants Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Participants ({Array.isArray(selectedParticipants) ? selectedParticipants.length : 0} selected)
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {validParticipants.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
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
                      onChange={(e) => {
                        console.log('Checkbox clicked:', participant.id, 'checked:', e.target.checked);
                        toggleParticipant(participant.id);
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{participant.name || 'Unknown'}</div>
                      {participant.email && (
                        <div className="text-sm text-gray-500">{participant.email}</div>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Draft Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Draft Order
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="draftOrder"
                  value="snake"
                  checked={draftOrder === 'snake'}
                  onChange={() => setDraftOrder('snake')}
                  className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Snake Draft (Recommended)</div>
                  <div className="text-sm text-gray-600">
                    Order reverses each round (1-2-3-4, then 4-3-2-1)
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="draftOrder"
                  value="linear"
                  checked={draftOrder === 'linear'}
                  onChange={() => setDraftOrder('linear')}
                  className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Linear Draft</div>
                  <div className="text-sm text-gray-600">
                    Same order every round (1-2-3-4, then 1-2-3-4)
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || selectedParticipants.length < 2}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Starting...' : 'Start Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
