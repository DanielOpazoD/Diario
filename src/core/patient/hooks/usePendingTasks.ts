import { useCallback } from 'react';
import { PendingTask } from '@shared/types';

interface UsePendingTasksParams {
  setPendingTasks: React.Dispatch<React.SetStateAction<PendingTask[]>>;
}

const usePendingTasks = ({ setPendingTasks }: UsePendingTasksParams) => {
  const toggleTask = useCallback((id: string) => {
    setPendingTasks(tasks =>
      tasks.map(task => {
        if (task.id !== id) return task;
        const nextCompleted = !task.isCompleted;
        return {
          ...task,
          isCompleted: nextCompleted,
          completedAt: nextCompleted ? Date.now() : undefined,
          completionNote: nextCompleted ? task.completionNote : undefined,
        };
      })
    );
  }, [setPendingTasks]);

  const deleteTask = useCallback((id: string) => {
    setPendingTasks(tasks => tasks.filter(task => task.id !== id));
  }, [setPendingTasks]);

  const addTask = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const value = e.currentTarget.value.trim();
    if (!value) return;

    setPendingTasks(tasks => [
      ...tasks,
      { id: crypto.randomUUID(), text: value, isCompleted: false, createdAt: Date.now() },
    ]);
    e.currentTarget.value = '';
  }, [setPendingTasks]);

  const updateTaskNote = useCallback((id: string, note: string) => {
    setPendingTasks(tasks =>
      tasks.map(task => {
        if (task.id !== id) return task;
        return {
          ...task,
          completionNote: note || undefined,
        };
      })
    );
  }, [setPendingTasks]);

  return {
    toggleTask,
    deleteTask,
    addTask,
    updateTaskNote,
  };
};

export default usePendingTasks;
