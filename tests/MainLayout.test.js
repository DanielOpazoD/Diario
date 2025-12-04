import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
import { loadTsModule } from './utils/loadTsModule.js';
import { createReactStub, findInTree } from './utils/reactStubRenderer.js';

class MemoryStorage {
  constructor() { this.store = new Map(); }
  getItem(key) { return this.store.has(key) ? this.store.get(key) : null; }
  setItem(key, value) { this.store.set(key, String(value)); }
  removeItem(key) { this.store.delete(key); }
}

globalThis.localStorage = new MemoryStorage();
globalThis.window = {
  innerWidth: 500,
  open: () => {},
  matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
};
const require = createRequire(import.meta.url);

const baseProps = {
  viewMode: 'daily',
  onNavigate: () => {},
  user: { name: 'Dr. Demo', email: 'demo@example.com' },
  currentDate: new Date('2024-01-01'),
  records: [],
  generalTasks: [],
  patientTypes: [],
  bookmarks: [],
  bookmarkCategories: [],
  onDateChange: () => {},
  onOpenNewPatient: () => {},
  onOpenBackupModal: () => {},
  onOpenDrivePicker: () => {},
  onLogout: () => {},
  onLocalImport: () => {},
  onOpenBookmarksModal: () => {},
  children: null,
};

test('MainLayout toggles sidebar on mobile navigation and triggers prefetch', () => {
  const { React, resetRender, runEffects, states, setState } = createReactStub();
  const navigations = [];
  const prefetches = [];
  const prefetchModals = [];

  const { default: MainLayout } = loadTsModule('layouts/MainLayout.tsx', {
    React,
    localStorage: globalThis.localStorage,
    window: {
      innerWidth: 500,
      open: () => {},
      matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    },
    require: (id) => {
      if (id.includes('services/googleService')) return {};
      return require(id);
    },
    '../components/DateNavigator': (props) => ({ __type: 'DateNavigator', props }),
    '../components/BookmarksBar': (props) => ({ __type: 'BookmarksBar', props }),
    '../components/GoogleConnectionStatus': () => ({ __type: 'GoogleStatus' }),
    '../services/storage': { downloadDataAsJson: () => {} },
    '../services/googleService': {},
  });

  const render = () => {
    resetRender();
    const tree = MainLayout({
      ...baseProps,
      onNavigate: (view) => navigations.push(view),
      onPrefetchView: (view) => prefetches.push(view),
      onPrefetchModal: (modal) => prefetchModals.push(modal),
    });
    runEffects();
    return tree;
  };

  let tree = render();
  const menuButton = findInTree(tree, (node) => node?.type === 'button' && node.props?.className?.includes('md:hidden mr-3'));
  menuButton.props.onClick();
  assert.equal(states[0], true, 'sidebar should open on mobile toggle');

  const tasksNav = findInTree(tree, (node) => node?.type === 'button' && node.children?.includes('Tareas'));
  tasksNav.props.onClick();
  assert.equal(states[0], false, 'sidebar closes after navigation on mobile');
  assert.equal(navigations[0], 'tasks');

  const bookmarksNav = findInTree(tree, (node) => node?.type === 'button' && node.children?.includes('Marcadores'));
  bookmarksNav.props.onMouseEnter();
  assert.ok(prefetches.includes('bookmarks'));

  const backupButton = findInTree(tree, (node) => node?.type === 'button' && node.children?.includes('Guardar en Drive'));
  backupButton.props.onMouseEnter();
  assert.ok(prefetchModals.includes('backupModal'));
});
