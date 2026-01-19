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
  currentDate: new Date('2024-02-10'),
  isPatientModalOpen: true,
  editingPatient: null,
  patientToDelete: 'p-1',
  isBackupModalOpen: true,
  isDrivePickerOpen: true,
  isBookmarksModalOpen: true,
  editingBookmarkId: null,
  isUploading: false,
  preferredFolder: 'root',
  onToast: () => { },
  onClosePatientModal: () => { },
  onSavePatient: () => { },
  onSaveMultiplePatients: () => { },
  onCloseDeleteConfirmation: () => { },
  onConfirmDelete: () => { },
  onCloseBackupModal: () => { },
  onConfirmBackup: () => { },
  onCloseDrivePicker: () => { },
  onSelectDriveFile: () => { },
  onFolderChange: () => { },
  onCloseBookmarksModal: () => { },
};

test('AppModals wires lazy modals with formatted dates and props', () => {
  let lazyIndex = 0;
  const lazyNames = ['PatientModal', 'ConfirmationModal', 'BookmarksModal'];
  const { React, resetRender } = createReactStub({
    lazy: () => (props) => ({ __type: lazyNames[lazyIndex++] || 'Lazy', props }),
    Suspense: ({ children }) => ({ type: 'Suspense', children }),
  });

  const { default: AppModals } = loadTsModule('components/AppModals.tsx', {
    React,
    localStorage: globalThis.localStorage,
    require: (id) => {
      if (id.includes('LoadingSkeletons')) return { ModalSkeleton: () => ({ __type: 'Skeleton' }) };
      if (id.includes('services/googleService')) return {};
      return require(id);
    },
    './LoadingSkeletons': { ModalSkeleton: () => ({ __type: 'Skeleton' }) },
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

  const backupModal = findInTree(tree, (node) => node?.__type === 'BackupModal');
  assert.equal(backupModal.props.defaultFileName.includes('backup_medidiario'), true);

  const drivePicker = findInTree(tree, (node) => node?.__type === 'DrivePickerModal');
  assert.equal(drivePicker.props.isOpen, true);

  const bookmarksModal = findInTree(tree, (node) => node?.__type === 'BookmarksModal');
  assert.equal(bookmarksModal.props.isOpen, true);
});
