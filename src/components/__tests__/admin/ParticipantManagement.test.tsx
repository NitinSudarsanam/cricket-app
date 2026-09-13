import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParticipantManagement } from '@/components/admin/ParticipantManagement';

const { toast } = vi.hoisted(() => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => toast,
}));

describe('ParticipantManagement', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders server-provided participants without a loading fetch', () => {
    render(
      <ParticipantManagement
        initialParticipants={[
          { id: 'p1', name: 'Alice', email: 'a@example.com' },
          { id: 'p2', name: 'Bob' },
        ]}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('a@example.com')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('posts a new participant and refreshes the list', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ id: 'p3', name: 'Cara', email: 'c@example.com' }],
        }),
      } as Response);

    render(<ParticipantManagement initialParticipants={[]} />);

    await userEvent.click(screen.getAllByRole('button', { name: 'Add Participant' })[0]);
    await userEvent.type(screen.getByPlaceholderText('Enter participant name'), 'Cara');
    const addButtons = screen.getAllByRole('button', { name: 'Add Participant' });
    await userEvent.click(addButtons[addButtons.length - 1]);

    expect(fetch).toHaveBeenCalledWith('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Cara', email: '' }),
    });
    expect(await screen.findByText('Cara')).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('Participant added successfully!');
  });
});
