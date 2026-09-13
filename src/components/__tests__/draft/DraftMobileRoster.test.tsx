import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DraftMobileRoster } from '@/components/draft/DraftMobileRoster';
import { createDraftConfig, createPlayer } from '@/__tests__/helpers/mock-factories';

vi.mock('@/components/draft/RosterSidebar', () => ({
  RosterSidebar: () => <div>Roster contents</div>,
}));

describe('DraftMobileRoster', () => {
  const props = {
    roster: [createPlayer({ name: 'Kohli' })],
    draftConfig: createDraftConfig(),
    participantName: 'Alice',
    onToggle: vi.fn(),
    onClose: vi.fn(),
  };

  it('exposes expanded state on the roster button', () => {
    const { rerender } = render(<DraftMobileRoster {...props} open={false} />);
    expect(screen.getByRole('button', { name: /My Roster \(1\)/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );

    rerender(<DraftMobileRoster {...props} open />);
    expect(screen.getByRole('button', { name: /My Roster \(1\)/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('renders a labelled dialog with a close control', () => {
    render(<DraftMobileRoster {...props} open />);

    expect(screen.getByRole('dialog', { name: 'My Roster' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close roster' })).toBeInTheDocument();
    expect(screen.getByText('Roster contents')).toBeInTheDocument();
  });

  it('closes from the overlay, close button, and Escape', async () => {
    const onClose = vi.fn();
    const { rerender } = render(<DraftMobileRoster {...props} open onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Close roster' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<DraftMobileRoster {...props} open onClose={onClose} />);
    await userEvent.click(screen.getByTestId('mobile-roster-overlay'));
    expect(onClose).toHaveBeenCalledTimes(2);

    rerender(<DraftMobileRoster {...props} open onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
