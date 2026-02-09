import type { PendingTask } from '@shared/types';

export const buildTasksFromText = (tasks: string[]): PendingTask[] =>
  tasks.map((text) => ({
    id: crypto.randomUUID(),
    text,
    isCompleted: false,
    createdAt: Date.now(),
  }));
