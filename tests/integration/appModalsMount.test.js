import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
import { loadTsModule } from '../utils/loadTsModule.js';
import { createReactStub, findInTree } from '../utils/reactStubRenderer.js';

class MemoryStorage {
  constructor() { this.store = new Map(); }
  getItem(key) { return this.store.has(key) ? this.store.get(key) : null; }
  setItem(key, value) { this.store.set(key, String(value)); }
  removeItem(key) { this.store.delete(key); }
}

globalThis.localStorage = new MemoryStorage();
const require = createRequire(import.meta.url);

const modalProps = {
  currentDate: new Date('2024-02-10T12:00:00'),
  isPatientModalOpen: true,
  editingPatient: null,
  patientToDelete: 'p-1',
  isBookmarksModalOpen: true,
  editingBookmarkId: null,
  isAppMenuOpen: true,
  onToast: () => { },
  onClosePatientModal: () => { },
  onSavePatient: () => { },
  onAutoSavePatient: () => { },
  onSaveMultiplePatients: () => { },
  onCloseDeleteConfirmation: () => { },
  onConfirmDelete: () => { },
  onCloseBookmarksModal: () => { },
  onCloseAppMenu: () => { },
  onNavigate: () => { },
};

test('AppModals wires lazy modals with formatted dates and props', () => {
  let lazyIndex = 0;
  const lazyNames = ['PatientModal', 'PatientHistoryModal', 'ConfirmationModal', 'BookmarksModal', 'AppMenuModal'];
  const { React, resetRender } = createReactStub({
    lazy: () => {
      const name = lazyNames[lazyIndex++] || 'Lazy';
      return (props) => ({ __type: name, props });
    },
    Suspense: ({ children }) => ({ type: 'Suspense', children }),
  });

  const { default: AppModals } = loadTsModule('components/AppModals.tsx', {
    React,
    localStorage: globalThis.localStorage,
    moduleStubs: {
      'core/ui': { ModalSkeleton: () => ({ __type: 'Skeleton' }) },
    },
  });

  lazyIndex = 0;
  resetRender();
  const tree = AppModals(modalProps);

  const patientModal = findInTree(tree, (node) => node?.__type === 'PatientModal');
  assert.equal(patientModal.props.selectedDate, '2024-02-10');
  assert.equal(patientModal.props.isOpen, true);

  const confirmationModal = findInTree(tree, (node) => node?.__type === 'ConfirmationModal');
  assert.equal(confirmationModal.props.isOpen, true);
  assert.match(confirmationModal.props.message, /esta acción/iu);

  const bookmarksModal = findInTree(tree, (node) => node?.__type === 'BookmarksModal');
  assert.equal(bookmarksModal.props.isOpen, true);

  const appMenuModal = findInTree(tree, (node) => node?.__type === 'AppMenuModal');
  assert.equal(appMenuModal.props.isOpen, true);
});
