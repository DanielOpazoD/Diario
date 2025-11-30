import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { loadTsModule } from './utils/loadTsModule.js';
import { createDom, createMemoryStorage } from './utils/setupDom.js';

const samplePatient = {
  id: '1',
  name: 'Paciente Uno',
  rut: '12.345.678-9',
  date: '2024-06-01',
  type: 'Turno',
  diagnosis: 'Resfriado',
  clinicalNote: 'Sin observaciones',
  pendingTasks: [
    { id: 't1', text: 'Control signos vitales', isCompleted: false },
  ],
};

const setupComponent = (props = {}) => {
  createDom();
  globalThis.localStorage = createMemoryStorage();
  globalThis.sessionStorage = createMemoryStorage();
  const CompactPatientCard = loadTsModule('components/CompactPatientCard.tsx');
  const events = [];
  render(
    React.createElement(CompactPatientCard.default, {
      patient: samplePatient,
      onEdit: () => events.push('edit'),
      onDelete: () => events.push('delete'),
      selectionMode: false,
      selected: false,
      onToggleSelect: () => events.push('toggle'),
      ...props,
    })
  );
  return events;
};

test('renders patient fields and tasks', () => {
  setupComponent();
  assert.ok(screen.getByText('Paciente Uno'));
  assert.ok(screen.getByText('Control signos vitales'));
});

test('fires edit and delete callbacks from actions', () => {
  const events = setupComponent();
  fireEvent.click(screen.getByLabelText('Editar paciente'));
  fireEvent.click(screen.getByLabelText('Eliminar paciente'));

  assert.deepEqual(events, ['edit', 'delete']);
});

test('supports selection mode checkbox', () => {
  const events = setupComponent({ selectionMode: true });
  fireEvent.click(screen.getByRole('checkbox'));
  assert.deepEqual(events, ['toggle']);
});
