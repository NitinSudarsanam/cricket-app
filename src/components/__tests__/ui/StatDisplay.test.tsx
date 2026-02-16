/**
 * Unit Tests for StatDisplay Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatDisplay } from '@/components/ui/StatDisplay';

describe('StatDisplay', () => {
  it('should render label and value', () => {
    render(<StatDisplay label="Total" value={100} />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should render with default variant and size', () => {
    render(<StatDisplay label="Score" value={50} />);
    const container = screen.getByText('Score').parentElement;
    expect(container).toHaveClass('stat-group');
    expect(screen.getByText('50')).toHaveClass('stat-value');
  });

  it('should render with highlight variant', () => {
    render(<StatDisplay label="Score" value={50} variant="highlight" />);
    expect(screen.getByText('50')).toHaveClass('stat-value-highlight');
  });

  it('should render with md size', () => {
    render(<StatDisplay label="Score" value={50} size="md" />);
    expect(screen.getByText('50')).toHaveClass('stat-value-md');
  });

  it('should accept React nodes as label and value', () => {
    render(
      <StatDisplay
        label={<span>Custom Label</span>}
        value={<strong>Custom Value</strong>}
      />
    );
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
    expect(screen.getByText('Custom Value')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<StatDisplay label="Test" value={10} className="custom-class" />);
    const container = screen.getByText('Test').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<StatDisplay label="Test" value={10} ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });
});
