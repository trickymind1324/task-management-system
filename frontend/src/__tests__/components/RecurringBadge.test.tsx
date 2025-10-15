// Test suite for RecurringBadge component

import { render, screen } from '@testing-library/react';
import { RecurringBadge } from '@/components/common/RecurringBadge';

describe('RecurringBadge', () => {
  it('should render with default props', () => {
    const { container } = render(<RecurringBadge />);

    const badge = container.querySelector('span');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-purple-100', 'text-purple-700');
  });

  it('should render small size badge', () => {
    const { container } = render(<RecurringBadge size="sm" />);

    const badge = container.querySelector('span');
    expect(badge).toHaveClass('px-1.5', 'py-0.5', 'text-xs');
  });

  it('should render medium size badge by default', () => {
    const { container } = render(<RecurringBadge />);

    const badge = container.querySelector('span');
    expect(badge).toHaveClass('px-2', 'py-1', 'text-xs');
  });

  it('should display frequency text when showText is true', () => {
    render(<RecurringBadge frequency="weekly" showText={true} />);

    expect(screen.getByText('Weekly')).toBeInTheDocument();
  });

  it('should not display frequency text by default', () => {
    render(<RecurringBadge frequency="weekly" />);

    expect(screen.queryByText('Weekly')).not.toBeInTheDocument();
  });

  it('should capitalize frequency text', () => {
    render(<RecurringBadge frequency="daily" showText={true} />);

    expect(screen.getByText('Daily')).toBeInTheDocument();
  });

  it('should render recurring icon SVG', () => {
    const { container } = render(<RecurringBadge />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should apply correct icon size for small badge', () => {
    const { container } = render(<RecurringBadge size="sm" />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-3', 'h-3');
  });

  it('should apply correct icon size for medium badge', () => {
    const { container } = render(<RecurringBadge size="md" />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-4', 'h-4');
  });

  it('should handle all frequency types', () => {
    const frequencies: Array<'daily' | 'weekly' | 'monthly' | 'yearly'> = [
      'daily',
      'weekly',
      'monthly',
      'yearly',
    ];

    frequencies.forEach((frequency) => {
      const { rerender } = render(
        <RecurringBadge frequency={frequency} showText={true} />
      );

      const capitalizedFrequency = frequency.charAt(0).toUpperCase() + frequency.slice(1);
      expect(screen.getByText(capitalizedFrequency)).toBeInTheDocument();

      rerender(<></>);
    });
  });
});
