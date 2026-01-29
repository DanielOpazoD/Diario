import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import usePendingTasks from '@core/patient/hooks/usePendingTasks';
import type { PendingTask } from '@shared/types';

describe('usePendingTasks', () => {
  it('adds, toggles, and deletes tasks', () => {
    const tasks: PendingTask[] = [];
    const setPendingTasks = (updater: React.SetStateAction<PendingTask[]>) => {
      const next = typeof updater === 'function' ? updater(tasks) : updater;
      tasks.splice(0, tasks.length, ...next);
    };

    const { result } = renderHook(() => usePendingTasks({ setPendingTasks }));

    act(() => {
      const event = {
        key: 'Enter',
        currentTarget: { value: 'Nueva tarea' },
      } as unknown as React.KeyboardEvent<HTMLInputElement>;
      result.current.addTask(event);
    });

    expect(tasks).toHaveLength(1);
    expect(tasks[0].text).toBe('Nueva tarea');
    expect(tasks[0].isCompleted).toBe(false);

    act(() => {
      result.current.toggleTask(tasks[0].id);
    });
    expect(tasks[0].isCompleted).toBe(true);

    act(() => {
      result.current.deleteTask(tasks[0].id);
    });
    expect(tasks).toHaveLength(0);
  });
});
