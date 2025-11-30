import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { loadTsModule } from './utils/loadTsModule.js';
import { createDom, createMemoryStorage } from './utils/setupDom.js';

const setupGlobals = () => {
  const dom = createDom();
  globalThis.localStorage = createMemoryStorage();
  globalThis.sessionStorage = createMemoryStorage();
  globalThis.crypto = globalThis.crypto || require('node:crypto').webcrypto;
  return dom;
};

const baseProps = () => ({
  isOpen: true,
  onClose: () => {},
  onSave: () => {},
  addToast: () => {},
  selectedDate: '2024-06-01',
});

test('PatientModal formats the name and calls onSave with the selected date', () => {
  setupGlobals();
  const PatientModal = loadTsModule('components/PatientModal.tsx');

  const saved = [];
  render(
    React.createElement(PatientModal.default, {
      ...baseProps(),
      onSave: (patient) => saved.push(patient),
    })
  );

  fireEvent.change(screen.getByPlaceholderText('Nombre Apellido 1 Apellido 2'), { target: { value: 'ana test' } });
  fireEvent.click(screen.getByText('Guardar Ficha'));

  assert.equal(saved.length, 1);
  assert.equal(saved[0].name, 'Ana Test');
  assert.equal(saved[0].date, '2024-06-01');
});

test('AI analysis appends structured diagnosis and tasks', async () => {
  setupGlobals();
  const addedToasts = [];
  const analyzeClinicalNote = async () => ({
    structuredDiagnosis: 'Hipertensión',
    extractedTasks: ['Control de presión', 'Repetir examen'],
  });

  const PatientModal = loadTsModule('components/PatientModal.tsx', { analyzeClinicalNote });

  render(
    React.createElement(PatientModal.default, {
      ...baseProps(),
      addToast: (type, message) => addedToasts.push({ type, message }),
    })
  );

  fireEvent.change(screen.getByPlaceholderText(/Evolución/), {
    target: { value: 'Paciente con presión alta' },
  });

  fireEvent.click(screen.getByText('Generar Plan IA'));

  await waitFor(() => {
    assert.equal(screen.getAllByText(/Control de presión|Repetir examen/).length, 2);
  });

  assert.equal(addedToasts.some((t) => t.type === 'success'), true);
  assert.ok(screen.getByDisplayValue('Hipertensión'));
});
