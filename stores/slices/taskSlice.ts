import { StateCreator } from 'zustand';
import { GeneralTask } from '../../shared/types/index.ts';

export interface TaskSlice {
  generalTasks: GeneralTask[];
  setGeneralTasks: (tasks: GeneralTask[]) => void;
  addGeneralTask: (task: GeneralTask) => void;
  toggleGeneralTask: (id: string) => void;
  deleteGeneralTask: (id: string) => void;
}

export const createTaskSlice: StateCreator<TaskSlice> = (set) => ({
  generalTasks: [],
  setGeneralTasks: (tasks) => set({ generalTasks: tasks }),
  addGeneralTask: (task) => set((state) => ({ 
    generalTasks: [task, ...state.generalTasks] 
  })),
  toggleGeneralTask: (id) => set((state) => ({
    generalTasks: state.generalTasks.map((t) => 
      t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
    ),
  })),
  deleteGeneralTask: (id) => set((state) => ({
    generalTasks: state.generalTasks.filter((t) => t.id !== id),
  })),
});
