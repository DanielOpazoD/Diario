import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TaskStatusIndicator from '@core/components/TaskStatusIndicator';

describe('TaskStatusIndicator', () => {
  it('renders empty state when no tasks', () => {
    const { container } = render(<TaskStatusIndicator pendingCount={0} completedCount={0} />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.textContent).toBe('');
  });

  it('renders both pending and completed badges', () => {
    const { getByText } = render(<TaskStatusIndicator pendingCount={2} completedCount={3} />);
    expect(getByText('2')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });

  it('renders pending badge only', () => {
    const { getByText, queryByText } = render(<TaskStatusIndicator pendingCount={1} completedCount={0} />);
    expect(getByText('1')).toBeTruthy();
    expect(queryByText('0')).toBeNull();
  });

  it('renders completed badge only', () => {
    const { getByText } = render(<TaskStatusIndicator pendingCount={0} completedCount={4} />);
    expect(getByText('4')).toBeTruthy();
  });
});
