import type { AttachedFile, PendingTask } from '@shared/types';

export const normalizePendingTasks = (tasks: PendingTask[]): PendingTask[] =>
  (tasks ?? []).reduce<PendingTask[]>((acc, task, index) => {
    if (!task || typeof task.text !== 'string') return acc;
    const text = task.text.trim();
    if (!text) return acc;

    acc.push({
      ...task,
      id: task.id || `task-${index}`,
      text,
      completionNote: task.completionNote?.trim() || undefined,
    });
    return acc;
  }, []);

export const normalizeAttachedFiles = (files: AttachedFile[]): AttachedFile[] =>
  (files ?? []).filter((file): file is AttachedFile =>
    Boolean(
      file &&
      typeof file.id === 'string' &&
      file.id.trim().length > 0 &&
      typeof file.name === 'string' &&
      file.name.trim().length > 0
    )
  );
