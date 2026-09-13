'use client';

import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/hooks/useToast';

export interface ParticipantRecord {
  id: string;
  name: string;
  email?: string | null;
}

interface ParticipantManagementProps {
  initialParticipants: ParticipantRecord[];
}

export function ParticipantManagement({ initialParticipants }: ParticipantManagementProps) {
  const [participants, setParticipants] = useState<ParticipantRecord[]>(initialParticipants);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const toast = useToast();

  const fetchParticipants = async () => {
    const response = await fetch('/api/participants');
    if (!response.ok) throw new Error('Failed to fetch participants');
    const result = await response.json();
    if (!result.success || !Array.isArray(result.data)) {
      throw new Error('Invalid response format from API');
    }
    setParticipants(result.data);
    setError(null);
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add participant');
      }

      await fetchParticipants();
      setIsAddModalOpen(false);
      setFormData({ name: '', email: '' });
      toast.success('Participant added successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add participant';
      toast.error(errorMessage, { onRetry: () => handleAddParticipant(e) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Participants</h2>
          <p className="text-sm text-slate-600 mt-1">
            Manage draft participants ({participants.length} total)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors"
        >
          Add Participant
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">{error}</div>
      )}

      {participants.length === 0 && !error && (
        <div className="bg-white rounded-md border border-slate-200 p-12 text-center">
          <div className="text-slate-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No participants yet</h3>
          <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">
            Add participants so they can join the draft and make picks.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors"
          >
            Add Participant
          </button>
        </div>
      )}

      {participants.length > 0 && (
        <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {participants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{participant.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">{participant.email || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-slate-500">{participant.id}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={isAddModalOpen}
        title="Add Participant"
        onClose={() => {
          setIsAddModalOpen(false);
          setFormData({ name: '', email: '' });
        }}
      >
        <form onSubmit={handleAddParticipant} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter participant name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email (optional)</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter email address"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
            >
              Add Participant
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
