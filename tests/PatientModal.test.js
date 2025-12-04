import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
import { loadTsModule } from './utils/loadTsModule.js';
import { createReactStub, findInTree } from './utils/reactStubRenderer.js';

const require = createRequire(import.meta.url);

const sharedRequire = (id) => {
  if (id.endsWith('/Button') || id === './Button') return () => null;
  if (id.endsWith('/FileAttachmentManager') || id === './FileAttachmentManager') return () => null;
  if (id.includes('PatientAttachmentsSection')) return () => null;
  if (id.includes('PatientIdentificationPanel')) return () => null;
  if (id.includes('patient/patientUtils')) {
    return {
      formatPatientName: (value) => value,
      formatTitleCase: (value) => value,
      formatRut: (value) => value,
    };
  }
  if (id.includes('patient/PatientForm')) return () => null;
  if (id.includes('patient/ClinicalNote')) return () => null;
  if (id.includes('services/geminiService')) {
    return {
      analyzeClinicalNote: async () => ({ structuredDiagnosis: '', extractedTasks: [] }),
      extractPatientDataFromImage: async () => null,
      extractMultiplePatientsFromImage: async () => [],
    };
  }
  if (id.includes('services/googleService')) return {};
  if (id.includes('services/storage')) return { fileToBase64: async () => '' };
  return require(id);
};

class MemoryStorage {
  constructor() { this.store = new Map(); }
  getItem(key) { return this.store.has(key) ? this.store.get(key) : null; }
  setItem(key, value) { this.store.set(key, String(value)); }
  removeItem(key) { this.store.delete(key); }
}

globalThis.localStorage = new MemoryStorage();
globalThis.window = {
  matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
};

test('formatTitleCase capitalizes each word', () => {
  const localStorage = new MemoryStorage();
  const mockStore = { patientTypes: [] };
  const { formatTitleCase } = loadTsModule('components/PatientModal.tsx', {
    localStorage,
    window: {
      matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    },
    require: (id) => {
      if (id.includes('useAppStore')) return (selector) => selector(mockStore);
      return sharedRequire(id);
    },
  });

  assert.equal(formatTitleCase('juan pérez'), 'Juan Pérez');
  assert.equal(formatTitleCase('MARIA lopez'), 'Maria Lopez');
});

test('PatientModal switches tabs and renders attachments when requested', () => {
  const { React, resetRender, runEffects } = createReactStub();
  const patientTypes = [
    { id: 'policlinico', label: 'Policlínico' },
    { id: 'turno', label: 'Turno' },
  ];
  const ClinicalNote = (props) => ({ __type: 'ClinicalNote', props });
  const Attachments = (props) => ({ __type: 'Attachments', props });

  const { default: PatientModal } = loadTsModule('components/PatientModal.tsx', {
    React,
    localStorage: globalThis.localStorage,
    window: {
      matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    },
    require: sharedRequire,
    useAppStore: () => ({ patientTypes }),
    usePatientVoiceAndAI: () => ({ isAnalyzing: false, isListening: false, toggleListening: () => {}, handleAIAnalysis: () => {} }),
    usePatientDataExtraction: () => ({
      fileInputRef: { current: null },
      multiFileInputRef: { current: null },
      isScanning: false,
      isScanningMulti: false,
      isExtractingFromFiles: false,
      handleImageUpload: () => {},
      handleMultiImageUpload: () => {},
      handleExtractFromAttachments: () => {},
    }),
    './patient/ClinicalNote': ClinicalNote,
    './patient/PatientAttachmentsSection': Attachments,
    './patient/PatientIdentificationPanel': (props) => ({ __type: 'Identification', props }),
    './Button': 'Button',
    '../services/googleService': {},
  });

  const render = (props = {}) => {
    resetRender();
    const tree = PatientModal({
      isOpen: true,
      onClose: () => {},
      onSave: () => {},
      addToast: () => {},
      selectedDate: '2024-01-01',
      ...props,
    });
    runEffects();
    return tree;
  };

  let tree = render();
  const noteNode = findInTree(tree, (node) => node?.__type === 'ClinicalNote');
  assert.equal(noteNode.props.activeTab, 'clinical');

  noteNode.props.onChangeTab('files');
  tree = render();

  const refreshedNote = findInTree(tree, (node) => node?.__type === 'ClinicalNote');
  assert.equal(refreshedNote.props.activeTab, 'files');
  const attachmentsNode = findInTree(tree, (node) => node?.__type === 'Attachments');
  assert.ok(attachmentsNode, 'attachments section should render when tab is files');
});

test('PatientModal validates name before saving and formats payload', () => {
  const { React, resetRender, runEffects } = createReactStub();
  const saved = [];
  const toasts = [];
  const patientTypes = [
    { id: 'policlinico', label: 'Policlínico' },
    { id: 'turno', label: 'Turno' },
  ];

  const { default: PatientModal } = loadTsModule('components/PatientModal.tsx', {
    React,
    localStorage: globalThis.localStorage,
    window: {
      matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    },
    require: sharedRequire,
    useAppStore: () => ({ patientTypes }),
    usePatientVoiceAndAI: () => ({ isAnalyzing: false, isListening: false, toggleListening: () => {}, handleAIAnalysis: () => {} }),
    usePatientDataExtraction: () => ({
      fileInputRef: { current: null },
      multiFileInputRef: { current: null },
      isScanning: false,
      isScanningMulti: false,
      isExtractingFromFiles: false,
      handleImageUpload: () => {},
      handleMultiImageUpload: () => {},
      handleExtractFromAttachments: () => {},
    }),
    './patient/ClinicalNote': (props) => ({ __type: 'ClinicalNote', props }),
    './patient/PatientAttachmentsSection': (props) => ({ __type: 'Attachments', props }),
    './patient/PatientIdentificationPanel': (props) => ({ __type: 'Identification', props }),
    './Button': 'Button',
    '../services/googleService': {},
  });

  const render = () => {
    resetRender();
    const tree = PatientModal({
      isOpen: true,
      onClose: () => saved.push({ closed: true }),
      onSave: (payload) => saved.push(payload),
      addToast: (type, message) => toasts.push({ type, message }),
      selectedDate: '2024-01-01',
    });
    runEffects();
    return tree;
  };

  let tree = render();
  const saveButton = findInTree(tree, (node) => node?.type === 'Button' && node.children?.includes('Guardar Ficha'));
  saveButton.props.onClick();
  assert.equal(toasts[0].type, 'error');
  assert.match(toasts[0].message, /Nombre requerido/);

  const idPanel = findInTree(tree, (node) => node?.__type === 'Identification');
  idPanel.props.onNameChange(' juan perez ');
  idPanel.props.onRutChange('11-1');

  tree = render();
  const updatedSave = findInTree(tree, (node) => node?.type === 'Button' && node.children?.includes('Guardar Ficha'));
  updatedSave.props.onClick();

  const savedPayload = saved.find((item) => item.name);
  assert.equal(savedPayload.name, 'Juan Perez');
  assert.equal(savedPayload.rut, '11-1');
  assert.ok(saved.find((item) => item.closed));
});

test('PatientModal forwards attachment extraction with current patient context', () => {
  const { React, resetRender, runEffects } = createReactStub();
  const patientTypes = [
    { id: 'policlinico', label: 'Policlínico' },
    { id: 'turno', label: 'Turno' },
  ];
  const extractionCalls = [];

  const { default: PatientModal } = loadTsModule('components/PatientModal.tsx', {
    React,
    localStorage: globalThis.localStorage,
    window: {
      matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    },
    require: sharedRequire,
    useAppStore: () => ({ patientTypes }),
    usePatientVoiceAndAI: () => ({ isAnalyzing: false, isListening: false, toggleListening: () => {}, handleAIAnalysis: () => {} }),
    usePatientDataExtraction: () => ({
      fileInputRef: { current: null },
      multiFileInputRef: { current: null },
      isScanning: false,
      isScanningMulti: false,
      isExtractingFromFiles: false,
      handleImageUpload: () => {},
      handleMultiImageUpload: () => {},
      handleExtractFromAttachments: (files, meta) => extractionCalls.push({ files, meta }),
    }),
    './patient/ClinicalNote': (props) => ({ __type: 'ClinicalNote', props }),
    './patient/PatientAttachmentsSection': (props) => ({ __type: 'Attachments', props }),
    './patient/PatientIdentificationPanel': (props) => ({ __type: 'Identification', props }),
    './Button': 'Button',
    '../services/googleService': {},
  });

  const render = () => {
    resetRender();
    const tree = PatientModal({
      isOpen: true,
      onClose: () => {},
      onSave: () => {},
      addToast: () => {},
      selectedDate: '2024-01-01',
    });
    runEffects();
    return tree;
  };

  let tree = render();
  const idPanel = findInTree(tree, (node) => node?.__type === 'Identification');
  idPanel.props.onNameChange('Paciente Demo');
  idPanel.props.onRutChange('99-9');

  const noteNode = findInTree(tree, (node) => node?.__type === 'ClinicalNote');
  noteNode.props.onChangeTab('files');
  tree = render();

  const attachmentSection = findInTree(tree, (node) => node?.__type === 'Attachments');
  attachmentSection.props.onFilesChange([{ id: 'file-1', name: 'lab.pdf' }]);

  const refreshedPanel = findInTree(tree, (node) => node?.__type === 'Identification');
  refreshedPanel.props.onExtractFromAttachments();

  assert.equal(extractionCalls.length, 1);
  assert.equal(extractionCalls[0].files[0].name, 'lab.pdf');
  assert.equal(extractionCalls[0].meta.name, 'Paciente Demo');
  assert.equal(extractionCalls[0].meta.rut, '99-9');
});
