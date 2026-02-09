import { beforeEach, describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { createTaskSlice, TaskSlice } from '@core/stores/slices/taskSlice';

describe('taskSlice', () => {
  const useStore = create<TaskSlice>(createTaskSlice);

  beforeEach(() => {
    useStore.setState({ generalTasks: [] } as any);
  });

  it('adds and toggles tasks', () => {
    useStore.getState().addGeneralTask({ id: 't1', text: 'Task', isCompleted: false } as any);
    expect(useStore.getState().generalTasks).toHaveLength(1);
    useStore.getState().toggleGeneralTask('t1');
    expect(useStore.getState().generalTasks[0].isCompleted).toBe(true);
  });

  it('sets and deletes tasks', () => {
    useStore.getState().setGeneralTasks([{ id: 't2', text: 'Two', isCompleted: false } as any]);
    expect(useStore.getState().generalTasks).toHaveLength(1);
    useStore.getState().deleteGeneralTask('t2');
    expect(useStore.getState().generalTasks).toHaveLength(0);
  });
});
