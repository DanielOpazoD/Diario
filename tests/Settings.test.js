import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRequire } from 'module';
import { loadTsModule } from './utils/loadTsModule.js';
import { createDom, createMemoryStorage } from './utils/setupDom.js';

const setupStore = () => {
  const dom = createDom();
  globalThis.localStorage = createMemoryStorage();
  globalThis.sessionStorage = createMemoryStorage();
  globalThis.crypto = globalThis.crypto || require('node:crypto').webcrypto;
  const realRequire = createRequire(import.meta.url);
  const storeModule = loadTsModule('stores/useAppStore.ts', {
    window: dom.window,
    document: dom.window.document,
    localStorage: globalThis.localStorage,
    sessionStorage: globalThis.sessionStorage,
  });
  const Settings = loadTsModule('components/Settings.tsx', {
    window: dom.window,
    document: dom.window.document,
    localStorage: globalThis.localStorage,
    sessionStorage: globalThis.sessionStorage,
    require: (specifier) =>
      specifier.includes('../stores/useAppStore') ? storeModule.default : realRequire(specifier),
  });
  const useAppStore = storeModule.default;
  useAppStore.setState({
    theme: 'light',
    patientTypes: [
      { id: 'turno', label: 'Turno', colorClass: 'bg-blue' },
    ],
    records: [],
    highlightPendingPatients: false,
    compactStats: true,
  });
  return { Settings, useAppStore };
};

test('Settings toggles theme state', () => {
  const { Settings, useAppStore } = setupStore();

  render(React.createElement(Settings.default));
  const toggleSection = screen.getByText('Modo Oscuro').closest('div');
  const toggleButton = toggleSection?.parentElement?.querySelector('button');
  assert.ok(toggleButton, 'toggle button should exist');
  fireEvent.click(toggleButton);

  assert.equal(useAppStore.getState().theme, 'dark');
});

test('Settings allows adding new patient types', () => {
  const { Settings, useAppStore } = setupStore();

  render(React.createElement(Settings.default));
  fireEvent.change(screen.getByPlaceholderText('Nombre (ej. Domicilio)'), {
    target: { value: 'Domicilio' },
  });
  fireEvent.click(screen.getByText('Agregar'));

  const types = useAppStore.getState().patientTypes.map((t) => t.label);
  assert(types.includes('Domicilio'));
});
