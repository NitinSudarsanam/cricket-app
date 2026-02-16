/**
 * Unit Tests for Alert Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert } from '@/components/ui/Alert';

describe('Alert', () => {
  it('should render with default variant', () => {
    render(<Alert>Alert message</Alert>);
    const alert = screen.getByText('Alert message');
    expect(alert).toBeInTheDocument();
    expect(alert.tagName).toBe('DIV');
    expect(alert).toHaveClass('alert', 'alert-info');
  });

  it('should render all variants correctly', () => {
    const { rerender } = render(<Alert variant="success">Success</Alert>);
    expect(screen.getByText('Success')).toHaveClass('alert-success');

    rerender(<Alert variant="warning">Warning</Alert>);
    expect(screen.getByText('Warning')).toHaveClass('alert-warning');

    rerender(<Alert variant="danger">Danger</Alert>);
    expect(screen.getByText('Danger')).toHaveClass('alert-danger');

    rerender(<Alert variant="info">Info</Alert>);
    expect(screen.getByText('Info')).toHaveClass('alert-info');
  });

  it('should accept custom className', () => {
    render(<Alert className="custom-class">Custom</Alert>);
    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<Alert ref={ref}>Ref</Alert>);
    expect(ref).toHaveBeenCalled();
  });
});
