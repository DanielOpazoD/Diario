import test from 'node:test';
import assert from 'node:assert/strict';
import { create } from 'zustand';
import { loadTsModule } from './utils/loadTsModule.js';

const createPatientStore = () => {
  const { createPatientSlice } = loadTsModule('stores/slices/patientSlice.ts');
  return create()((set, get, api) => ({ ...createPatientSlice(set, get, api) }));
};

const createTaskStore = () => {
  const { createTaskSlice } = loadTsModule('stores/slices/taskSlice.ts');
  return create()((set, get, api) => ({ ...createTaskSlice(set, get, api) }));
};

const createUserStore = () => {
  const { createUserSlice } = loadTsModule('stores/slices/userSlice.ts', {
    document: globalThis.document,
    window: globalThis,
  });
  return create()((set, get, api) => ({ ...createUserSlice(set, get, api) }));
};

const createSettingsStore = () => {
  const { createSettingsSlice } = loadTsModule('stores/slices/settingsSlice.ts');
  return create()((set, get, api) => ({ ...createSettingsSlice(set, get, api) }));
};

test('patient slice adds, updates, and deletes patients', () => {
  const store = createPatientStore();
  const patient = { id: '1', name: 'John', rut: '123', diagnosis: '', clinicalNote: '', pendingTasks: [], attachedFiles: [], date: '', createdAt: Date.now(), type: '' };
  store.getState().addPatient(patient);
  assert.equal(store.getState().records.length, 1);

  store.getState().updatePatient({ ...patient, name: 'Jane' });
  assert.equal(store.getState().records[0].name, 'Jane');

  store.getState().deletePatient('1');
  assert.equal(store.getState().records.length, 0);
});

test('task slice toggles and deletes tasks', () => {
  const store = createTaskStore();
  const task = { id: 't1', text: 'Check labs', isCompleted: false, createdAt: Date.now(), priority: 'low' };
  store.getState().addGeneralTask(task);
  assert.equal(store.getState().generalTasks.length, 1);

  store.getState().toggleGeneralTask('t1');
  assert.equal(store.getState().generalTasks[0].isCompleted, true);

  store.getState().deleteGeneralTask('t1');
  assert.equal(store.getState().generalTasks.length, 0);
});

test('user slice logs in, toggles theme, and logs out', () => {
  const classList = {
    classes: new Set(),
    add(token) { this.classes.add(token); },
    remove(token) { this.classes.delete(token); },
  };
  globalThis.document = { documentElement: { classList } };

  const store = createUserStore();
  const user = { name: 'Alice', email: 'alice@example.com', avatar: '' };
  store.getState().login(user);
  assert.deepEqual(store.getState().user, user);

  const initialTheme = store.getState().theme;
  store.getState().toggleTheme();
  assert.notEqual(store.getState().theme, initialTheme);
  assert.equal(classList.classes.has('dark'), store.getState().theme === 'dark');

  store.getState().logout();
  assert.equal(store.getState().user, null);
});

test('settings slice manages patient types and security preferences', () => {
  const store = createSettingsStore();
  const newType = { id: 'custom', label: 'Custom', colorClass: 'bg-blue-500' };

  const initialLength = store.getState().patientTypes.length;
  store.getState().addPatientType(newType);
  assert.equal(store.getState().patientTypes.length, initialLength + 1);

  store.getState().removePatientType('custom');
  assert.equal(store.getState().patientTypes.length, initialLength);

  store.getState().setSecurityPin('1234');
  store.getState().setAutoLockMinutes(10);
  assert.equal(store.getState().securityPin, '1234');
  assert.equal(store.getState().autoLockMinutes, 10);

  store.getState().setHighlightPendingPatients(false);
  store.getState().setCompactStats(false);
  assert.equal(store.getState().highlightPendingPatients, false);
  assert.equal(store.getState().compactStats, false);
});
