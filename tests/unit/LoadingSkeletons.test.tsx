import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  BookmarksSkeleton,
  HistorySkeleton,
  ModalSkeleton,
  SettingsSkeleton,
  StatsSkeleton,
  TasksSkeleton,
  ViewSkeleton,
} from '@core/ui/LoadingSkeletons';

describe('LoadingSkeletons', () => {
  it('renders view skeleton', () => {
    const { container } = render(<ViewSkeleton />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders modal skeleton', () => {
    const { container } = render(<ModalSkeleton />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders stats skeleton', () => {
    const { container } = render(<StatsSkeleton />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders settings skeleton', () => {
    const { container } = render(<SettingsSkeleton />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders tasks skeleton', () => {
    const { container } = render(<TasksSkeleton />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders bookmarks skeleton', () => {
    const { container } = render(<BookmarksSkeleton />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders history skeleton', () => {
    const { container } = render(<HistorySkeleton />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});
