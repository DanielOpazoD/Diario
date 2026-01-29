import { useCallback } from 'react';
import { PendingTask } from '@shared/types';

interface UsePendingTasksParams {
  setPendingTasks: React.Dispatch<React.SetStateAction<PendingTask[]>>;
}

const usePendingTasks = ({ setPendingTasks }: UsePendingTasksParams) => {
  const toggleTask = useCallback((id: string) => {
    setPendingTasks(tasks =>
      tasks.map(task => task.id === id ? { ...task, isCompleted: !task.isCompleted } : task)
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
      { id: crypto.randomUUID(), text: value, isCompleted: false },
    ]);
    e.currentTarget.value = '';
  }, [setPendingTasks]);

  return {
    toggleTask,
    deleteTask,
    addTask,
  };
};

export default usePendingTasks;
