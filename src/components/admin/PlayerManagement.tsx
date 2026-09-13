'use client';

import { useState, useEffect } from 'react';
import { Player, IPLTeam, PlayerRole, IPL_TEAMS, PLAYER_ROLES } from '@/types';
import { PlayerChip } from '@/components/PlayerChip';
import { Modal } from '@/components/Modal';
import { Skeleton, SkeletonRow } from '@/components/Skeleton';
import { useToast } from '@/hooks/useToast';
import { Button, Card } from '@/components/ui';

interface PlayerFormData {
  name: string;
  team: IPLTeam;
  role: PlayerRole;
  isForeign: boolean;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface PlayerManagementProps {
  initialPlayers?: Player[];
}

export function PlayerManagement({ initialPlayers }: PlayerManagementProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers ?? []);
  const [loading, setLoading] = useState(initialPlayers === undefined);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  
  // Form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState<IPLTeam | 'all'>('all');
  const [filterRole, setFilterRole] = useState<PlayerRole | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'team' | 'role'>('name');
  
  // Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  // Form data
  const [formData, setFormData] = useState<PlayerFormData>({
    name: '',
    team: 'CSK',
    role: 'Bat',
    isForeign: false,
  });

  useEffect(() => {
    if (initialPlayers === undefined) {
      fetchPlayers();
    }
  }, [initialPlayers]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/players');
      if (!response.ok) throw new Error('Failed to fetch players');
      const result = await response.json();
      
      // API returns { success: true, data: players }
      if (result.success && Array.isArray(result.data)) {
        setPlayers(result.data);
      } else {
        throw new Error('Invalid response format from API');
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load players');
      setPlayers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add player');
      }
      
      await fetchPlayers();
      setIsAddModalOpen(false);
      resetForm();
      toast.success('Player added successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add player';
      toast.error(errorMessage, { onRetry: () => handleAddPlayer(e) });
    }
  };

  const handleEditPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    
    try {
      const response = await fetch(`/api/players/${editingPlayer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update player');
      }
      
      await fetchPlayers();
      setIsEditModalOpen(false);
      setEditingPlayer(null);
      resetForm();
      toast.success('Player updated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update player';
      toast.error(errorMessage, { onRetry: () => handleEditPlayer(e) });
    }
  };

  const handleDeletePlayer = async (id: string) => {
    try {
      const response = await fetch(`/api/players/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete player');
      }
      
      await fetchPlayers();
      setDeleteConfirmId(null);
      toast.success('Player deleted successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete player';
      toast.error(errorMessage, { onRetry: () => handleDeletePlayer(id) });
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    
    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await fetch('/api/players/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import players');
      }
      
      const result = await response.json();
      setImportResult(result);
      await fetchPlayers();
      setImportFile(null);
      
      if (result.failed === 0) {
        toast.success(`Successfully imported ${result.success} players!`);
      } else {
        toast.warning(`Imported ${result.success} players, ${result.failed} failed.`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import players';
      toast.error(errorMessage, { onRetry: () => handleImport(e) });
    } finally {
      setImporting(false);
    }
  };

  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      team: player.team,
      role: player.role,
      isForeign: player.isForeign,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      team: 'CSK',
      role: 'Bat',
      isForeign: false,
    });
  };

  // Filter and sort players
  const filteredPlayers = players
    .filter((player) => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeam = filterTeam === 'all' || player.team === filterTeam;
      const matchesRole = filterRole === 'all' || player.role === filterRole;
      return matchesSearch && matchesTeam && matchesRole;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'team') return a.team.localeCompare(b.team);
      if (sortBy === 'role') return a.role.localeCompare(b.role);
      return 0;
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-md border border-slate-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
          <table className="w-full min-w-[640px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Player</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Team</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Foreign</th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.from({ length: 10 }).map((_, i) => (
                <SkeletonRow key={i} cols={5} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Player Management</h2>
          <p className="text-sm text-slate-600 mt-1">
            Manage the player pool for your draft ({players.length} players)
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
            Import Players
          </Button>
          <Button variant="success" onClick={() => setIsAddModalOpen(true)}>
            Add Player
          </Button>
        </div>
      </div>

      {error && <div className="alert alert-danger alert-text-danger">{error}</div>}

      {players.length === 0 && (
        <Card padded className="text-center">
          <div className="text-slate-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No players in the pool yet</h3>
          <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">
            Add players manually or import a list to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
              Add Player
            </Button>
            <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
              Import Players
            </Button>
          </div>
        </Card>
      )}

      {players.length > 0 && (
        <>
      {/* Filters */}
      <Card padded className="space-y-3 md:space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm md:text-base"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Team
            </label>
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value as IPLTeam | 'all')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm md:text-base"
            >
              <option value="all">All Teams</option>
              {IPL_TEAMS.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as PlayerRole | 'all')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm md:text-base"
            >
              <option value="all">All Roles</option>
              {PLAYER_ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'team' | 'role')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm md:text-base"
            >
              <option value="name">Name</option>
              <option value="team">Team</option>
              <option value="role">Role</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Player List */}
      <Card padded className="p-0 table-container overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Foreign
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 lg:px-6 py-8 text-center text-slate-500">
                    No players found
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 lg:px-6 py-4">
                      <div className="font-medium text-slate-900">{player.name}</div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className="text-sm text-slate-700">{player.team}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className="text-sm text-slate-700">{player.role}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className="text-sm text-slate-700">
                        {player.isForeign ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(player)}
                          className="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(player.id)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
        </>
      )}

      {/* Add Player Modal */}
      <Modal
        open={isAddModalOpen}
        title="Add New Player"
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
      >
          <form onSubmit={handleAddPlayer} className="space-y-4">
            <PlayerForm formData={formData} setFormData={setFormData} />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="success">
                Add Player
              </Button>
            </div>
          </form>
      </Modal>

      {/* Edit Player Modal */}
      <Modal
        open={isEditModalOpen && !!editingPlayer}
        title="Edit Player"
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPlayer(null);
          resetForm();
        }}
      >
          <form onSubmit={handleEditPlayer} className="space-y-4">
            <PlayerForm formData={formData} setFormData={setFormData} />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPlayer(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="success">
                Save Changes
              </Button>
            </div>
          </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteConfirmId}
        title="Delete Player"
        onClose={() => setDeleteConfirmId(null)}
      >
          <p className="text-slate-700 mb-6">
            Are you sure you want to delete this player? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteConfirmId) handleDeletePlayer(deleteConfirmId);
              }}
            >
              Delete
            </Button>
          </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        open={isImportModalOpen}
        title="Import Players"
        onClose={() => {
          setIsImportModalOpen(false);
          setImportFile(null);
          setImportResult(null);
        }}
      >
          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Upload CSV or JSON file
              </label>
              <input
                type="file"
                accept=".csv,.json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-2">
                CSV format: name,team,role,isForeign
              </p>
            </div>

            {importResult && (
              <div className={`p-4 rounded-lg ${importResult.failed > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                <p className="font-medium text-slate-900 mb-2">
                  Import Complete
                </p>
                <p className="text-sm text-slate-700">
                  Successfully imported: {importResult.success}
                </p>
                {importResult.failed > 0 && (
                  <>
                    <p className="text-sm text-slate-700">
                      Failed: {importResult.failed}
                    </p>
                    <div className="mt-2 text-xs text-slate-600 max-h-32 overflow-y-auto">
                      {importResult.errors.map((error, i) => (
                        <div key={i}>• {error}</div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setImportResult(null);
                }}
              >
                Close
              </Button>
              <Button type="submit" disabled={!importFile || importing} variant="success">
                {importing ? 'Importing...' : 'Import'}
              </Button>
            </div>
          </form>
      </Modal>
    </div>
  );
}

// Player Form Component
function PlayerForm({ 
  formData, 
  setFormData 
}: { 
  formData: PlayerFormData; 
  setFormData: (data: PlayerFormData) => void;
}) {
  return (
    <>
      <div className="form-group">
        <label className="text-sm font-medium text-slate-700">
          Player Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2.5 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
          placeholder="Enter player name"
        />
      </div>

      <div className="form-group">
        <label className="text-sm font-medium text-slate-700">
          Team *
        </label>
        <select
          required
          value={formData.team}
          onChange={(e) => setFormData({ ...formData, team: e.target.value as IPLTeam })}
          className="w-full px-3 py-2.5 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
        >
          {IPL_TEAMS.map((team) => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="text-sm font-medium text-slate-700">
          Role *
        </label>
        <select
          required
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as PlayerRole })}
          className="w-full px-3 py-2.5 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
        >
          {PLAYER_ROLES.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center py-2">
        <input
          type="checkbox"
          id="isForeign"
          checked={formData.isForeign}
          onChange={(e) => setFormData({ ...formData, isForeign: e.target.checked })}
          className="w-5 h-5 md:w-4 md:h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 touch-manipulation"
        />
        <label htmlFor="isForeign" className="ml-3 text-sm md:text-base text-slate-700 touch-manipulation">
          Foreign Player
        </label>
      </div>
    </>
  );
}

