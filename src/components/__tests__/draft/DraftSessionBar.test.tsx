import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DraftSessionBar } from '@/components/draft/DraftSessionBar';

describe('DraftSessionBar', () => {
  const participants = [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
  ];

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    Object.defineProperty(window, 'location', {
      value: { href: '/other' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the view-as controls and highlights the on-clock participant', () => {
    render(
      <DraftSessionBar
        participants={participants}
        currentParticipantId="p1"
        currentParticipantIdOnClock="p2"
      />
    );

    expect(screen.getByText('View as:')).toBeInTheDocument();
    expect(screen.getByTitle('Bob - On the clock!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alice' })).toBeInTheDocument();
  });

  it('switches participant and navigates to the draft page', async () => {
    render(
      <DraftSessionBar
        participants={participants}
        currentParticipantId="p1"
        currentParticipantIdOnClock="p1"
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Bob' }));

    expect(fetch).toHaveBeenCalledWith('/api/auth/participant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: 'p2' }),
    });
    expect(window.location.href).toBe('/draft');
  });

  it('logs out and returns home', async () => {
    render(
      <DraftSessionBar
        participants={participants}
        currentParticipantId="p1"
        currentParticipantIdOnClock="p1"
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
    expect(window.location.href).toBe('/');
  });
});
