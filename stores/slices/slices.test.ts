import { create } from 'zustand';
import { createPatientSlice, PatientSlice } from './patientSlice';
import { createTaskSlice, TaskSlice } from './taskSlice';
import { createUserSlice, UserSlice } from './userSlice';
import { createSettingsSlice, SettingsSlice, defaultPatientTypes } from './settingsSlice';
import { GeneralTask, PatientRecord, PatientType } from '../../types';

describe('patient slice reducers', () => {
  const buildStore = () => create<PatientSlice>((set, get, api) => ({ ...createPatientSlice(set, get, api) }));

  it('adds, updates, and deletes patients', () => {
    const store = buildStore();
    const patient: PatientRecord = {
      id: '1',
      name: 'Jane',
      rut: '12345678-9',
      date: '2024-01-01',
      type: PatientType.HOSPITALIZADO,
      diagnosis: 'Dolor abdominal',
      clinicalNote: 'Sin observaciones',
      pendingTasks: [],
      attachedFiles: [],
      createdAt: Date.now(),
    };

    store.getState().addPatient(patient);
    expect(store.getState().records).toEqual([patient]);

    const updated = { ...patient, name: 'Jane Doe' };
    store.getState().updatePatient(updated);
    expect(store.getState().records[0].name).toBe('Jane Doe');

    store.getState().deletePatient('1');
    expect(store.getState().records).toHaveLength(0);
  });
});

describe('task slice reducers', () => {
  const buildStore = () => create<TaskSlice>((set, get, api) => ({ ...createTaskSlice(set, get, api) }));

  it('handles toggling and removing general tasks', () => {
    const store = buildStore();
    const task: GeneralTask = { id: 't1', text: 'Check labs', isCompleted: false, createdAt: Date.now(), priority: 'medium' };

    store.getState().addGeneralTask(task);
    expect(store.getState().generalTasks[0]).toEqual(task);

    store.getState().toggleGeneralTask('t1');
    expect(store.getState().generalTasks[0].isCompleted).toBe(true);

    store.getState().deleteGeneralTask('t1');
    expect(store.getState().generalTasks).toHaveLength(0);
  });
});

describe('user slice reducers', () => {
  const buildStore = () => create<UserSlice>((set, get, api) => ({ ...createUserSlice(set, get, api) }));

  it('toggles theme and updates DOM class', () => {
    const store = buildStore();

    store.getState().toggleTheme();
    expect(store.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    store.getState().toggleTheme();
    expect(store.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

describe('settings slice reducers', () => {
  const buildStore = () => create<SettingsSlice>((set, get, api) => ({ ...createSettingsSlice(set, get, api) }));

  it('manages patient types and security settings', () => {
    const store = buildStore();
    expect(store.getState().patientTypes).toEqual(defaultPatientTypes);

    store.getState().addPatientType({ id: 'custom', label: 'Custom', colorClass: 'bg-blue-500', isDefault: false });
    expect(store.getState().patientTypes.some((t) => t.id === 'custom')).toBe(true);

    store.getState().removePatientType('custom');
    expect(store.getState().patientTypes.some((t) => t.id === 'custom')).toBe(false);

    store.getState().setSecurityPin('1234');
    store.getState().setAutoLockMinutes(10);
    expect(store.getState().securityPin).toBe('1234');
    expect(store.getState().autoLockMinutes).toBe(10);
  });
});
