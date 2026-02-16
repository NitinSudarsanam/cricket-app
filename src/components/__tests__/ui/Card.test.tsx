/**
 * Unit Tests for Card Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '@/components/ui/Card';

describe('Card', () => {
  it('should render with default padding', () => {
    render(<Card>Card content</Card>);
    const card = screen.getByText('Card content');
    expect(card).toBeInTheDocument();
    expect(card.tagName).toBe('DIV');
    expect(card).toHaveClass('card');
    expect(card).not.toHaveClass('card-padded');
  });

  it('should render with padded prop', () => {
    render(<Card padded>Padded card</Card>);
    const card = screen.getByText('Padded card');
    expect(card).toHaveClass('card-padded');
  });

  it('should accept custom className', () => {
    render(<Card className="custom-class">Custom</Card>);
    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<Card ref={ref}>Ref</Card>);
    expect(ref).toHaveBeenCalled();
  });
});
