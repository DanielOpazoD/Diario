import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import InlinePatientTasks from '@core/patient/components/InlinePatientTasks';
import { PendingTask } from '@shared/types';

describe('InlinePatientTasks', () => {
  it('shows empty state when no tasks', () => {
    render(
      <InlinePatientTasks
        pendingTasks={[]}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onAddTask={vi.fn()}
        onUpdateTaskNote={vi.fn()}
      />
    );

    expect(screen.getByText('No hay tareas pendientes')).toBeInTheDocument();
  });

  it('handles task interactions', () => {
    const onToggleTask = vi.fn();
    const onDeleteTask = vi.fn();
    const onUpdateTaskNote = vi.fn();

    const tasks: PendingTask[] = [
      { id: 't1', text: 'Tarea 1', isCompleted: false },
      { id: 't2', text: 'Tarea 2', isCompleted: true, completedAt: 1700000000000 },
    ];

    render(
      <InlinePatientTasks
        pendingTasks={tasks}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        onAddTask={vi.fn()}
        onUpdateTaskNote={onUpdateTaskNote}
      />
    );

    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onToggleTask).toHaveBeenCalledWith('t1');

    fireEvent.click(screen.getByTitle('Agregar nota'));
    const input = screen.getByPlaceholderText('Nota de confirmación...');
    fireEvent.change(input, { target: { value: 'Nota' } });
    fireEvent.blur(input);
    expect(onUpdateTaskNote).toHaveBeenCalledWith('t2', 'Nota');

    const deleteButtons = screen.getAllByRole('button');
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);
    expect(onDeleteTask).toHaveBeenCalledWith('t2');
  });

  it('triggers add task on keydown', () => {
    const onAddTask = vi.fn();
    render(
      <InlinePatientTasks
        pendingTasks={[]}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onAddTask={onAddTask}
        onUpdateTaskNote={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('+ Nueva tarea...');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onAddTask).toHaveBeenCalled();
  });
});
