'use client';

import { useState, useEffect } from 'react';
import { Player, IPLTeam, PlayerRole, IPL_TEAMS, PLAYER_ROLES } from '@/types';
import { PlayerChip } from '@/components/PlayerChip';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/useToast';

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

export function PlayerManagement() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
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
    fetchPlayers();
  }, []);

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
    return <LoadingSpinner variant="full-page" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Player Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage the player pool for your draft ({players.length} players)
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Import Players
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Player
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200 space-y-3 md:space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team
            </label>
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value as IPLTeam | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
            >
              <option value="all">All Teams</option>
              {IPL_TEAMS.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as PlayerRole | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
            >
              <option value="all">All Roles</option>
              {PLAYER_ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'team' | 'role')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
            >
              <option value="name">Name</option>
              <option value="team">Team</option>
              <option value="role">Role</option>
            </select>
          </div>
        </div>
      </div>

      {/* Player List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Foreign
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 lg:px-6 py-8 text-center text-gray-500">
                    No players found
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 lg:px-6 py-4">
                      <div className="font-medium text-gray-900">{player.name}</div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className="text-sm text-gray-700">{player.team}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className="text-sm text-gray-700">{player.role}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {player.isForeign ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(player)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
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
      </div>

      {/* Add Player Modal */}
      {isAddModalOpen && (
        <Modal
          title="Add New Player"
          onClose={() => {
            setIsAddModalOpen(false);
            resetForm();
          }}
        >
          <form onSubmit={handleAddPlayer} className="space-y-4">
            <PlayerForm formData={formData} setFormData={setFormData} />
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Add Player
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Player Modal */}
      {isEditModalOpen && editingPlayer && (
        <Modal
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
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPlayer(null);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <Modal
          title="Delete Player"
          onClose={() => setDeleteConfirmId(null)}
        >
          <p className="text-gray-700 mb-6">
            Are you sure you want to delete this player? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeletePlayer(deleteConfirmId)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <Modal
          title="Import Players"
          onClose={() => {
            setIsImportModalOpen(false);
            setImportFile(null);
            setImportResult(null);
          }}
        >
          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV or JSON file
              </label>
              <input
                type="file"
                accept=".csv,.json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-2">
                CSV format: name,team,role,isForeign
              </p>
            </div>

            {importResult && (
              <div className={`p-4 rounded-lg ${importResult.failed > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                <p className="font-medium text-gray-900 mb-2">
                  Import Complete
                </p>
                <p className="text-sm text-gray-700">
                  Successfully imported: {importResult.success}
                </p>
                {importResult.failed > 0 && (
                  <>
                    <p className="text-sm text-gray-700">
                      Failed: {importResult.failed}
                    </p>
                    <div className="mt-2 text-xs text-gray-600 max-h-32 overflow-y-auto">
                      {importResult.errors.map((error, i) => (
                        <div key={i}>• {error}</div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setImportResult(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={!importFile || importing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            </div>
          </form>
        </Modal>
      )}
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Player Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          placeholder="Enter player name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Team *
        </label>
        <select
          required
          value={formData.team}
          onChange={(e) => setFormData({ ...formData, team: e.target.value as IPLTeam })}
          className="w-full px-3 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
        >
          {IPL_TEAMS.map((team) => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role *
        </label>
        <select
          required
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as PlayerRole })}
          className="w-full px-3 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
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
          className="w-5 h-5 md:w-4 md:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 touch-manipulation"
        />
        <label htmlFor="isForeign" className="ml-3 text-sm md:text-base text-gray-700 touch-manipulation">
          Foreign Player
        </label>
      </div>
    </>
  );
}

// Modal Component
function Modal({ 
  title, 
  children, 
  onClose 
}: { 
  title: string; 
  children: React.ReactNode; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-t-2xl md:rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 touch-manipulation"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
