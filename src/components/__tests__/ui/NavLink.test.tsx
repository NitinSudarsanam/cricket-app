/**
 * Unit Tests for NavLink Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavLink } from '@/components/ui/NavLink';

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, className, ...props }: any) => (
    <a href={props.href} className={className} {...props}>
      {children}
    </a>
  ),
}));

describe('NavLink', () => {
  it('should render link with children', () => {
    render(<NavLink href="/test">Test Link</NavLink>);
    const link = screen.getByRole('link', { name: 'Test Link' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('should apply nav-link class', () => {
    render(<NavLink href="/test">Test</NavLink>);
    expect(screen.getByRole('link')).toHaveClass('nav-link');
  });

  it('should apply active class when active prop is true', () => {
    render(<NavLink href="/test" active>Active Link</NavLink>);
    expect(screen.getByRole('link')).toHaveClass('nav-link-active');
  });

  it('should not apply active class when active prop is false', () => {
    render(<NavLink href="/test" active={false}>Inactive Link</NavLink>);
    expect(screen.getByRole('link')).not.toHaveClass('nav-link-active');
  });

  it('should render icon when provided', () => {
    const icon = <span data-testid="icon">LINK</span>;
    render(<NavLink href="/test" icon={icon}>Link with Icon</NavLink>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<NavLink href="/test" className="custom-class">Custom</NavLink>);
    expect(screen.getByRole('link')).toHaveClass('custom-class');
  });

  it('should wrap children in span with truncate class', () => {
    render(<NavLink href="/test">Long Link Text</NavLink>);
    const span = screen.getByText('Long Link Text');
    expect(span.tagName).toBe('SPAN');
    expect(span).toHaveClass('truncate');
  });
});
