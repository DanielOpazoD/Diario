import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PendingTasksPanel from '@core/patient/components/PendingTasksPanel';
import { PendingTask } from '@shared/types';

describe('PendingTasksPanel', () => {
  it('shows count badge when minimal and has tasks', () => {
    const tasks: PendingTask[] = [{ id: 't1', text: 'Tarea 1', isCompleted: false }];
    render(
      <PendingTasksPanel
        pendingTasks={tasks}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onAddTask={vi.fn()}
        onUpdateTaskNote={vi.fn()}
        minimal
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('handles interactions and note editing', () => {
    const onToggleTask = vi.fn();
    const onDeleteTask = vi.fn();
    const onUpdateTaskNote = vi.fn();

    const tasks: PendingTask[] = [
      { id: 't1', text: 'Tarea 1', isCompleted: true, completedAt: 1700000000000 },
    ];

    render(
      <PendingTasksPanel
        pendingTasks={tasks}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        onAddTask={vi.fn()}
        onUpdateTaskNote={onUpdateTaskNote}
      />
    );

    fireEvent.click(screen.getByTitle('Agregar nota'));
    const input = screen.getByPlaceholderText('Nota de confirmación...');
    fireEvent.change(input, { target: { value: 'Nota' } });
    fireEvent.blur(input);

    expect(onUpdateTaskNote).toHaveBeenCalledWith('t1', 'Nota');

    fireEvent.click(screen.getByLabelText('Eliminar tarea'));
    expect(onDeleteTask).toHaveBeenCalledWith('t1');
  });
});
