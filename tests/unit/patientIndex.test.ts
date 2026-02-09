import { describe, expect, it, vi } from 'vitest';

vi.mock('@core/patient/components/ExecutivePatientRow', () => ({
  default: () => null,
}));
vi.mock('@core/patient/components/InlinePatientEditor', () => ({
  default: () => null,
}));
vi.mock('@core/patient/hooks/usePatientCrud', () => ({
  default: () => ({}),
}));
vi.mock('@core/patient/hooks/usePatientDataExtraction', () => ({
  default: () => ({}),
}));
vi.mock('@core/patient/hooks/usePdfPatientImport', () => ({
  usePdfPatientImport: () => ({}),
}));
vi.mock('@core/patient/hooks/usePatientVoiceAndAI', () => ({
  default: () => ({}),
}));

import {
  ExecutivePatientRow,
  InlinePatientEditor,
  usePatientCrud,
  usePatientDataExtraction,
  usePdfPatientImport,
  usePatientVoiceAndAI,
} from '@core/patient';

describe('core/patient index exports', () => {
  it('exposes expected exports', () => {
    expect(ExecutivePatientRow).toBeTruthy();
    expect(InlinePatientEditor).toBeTruthy();
    expect(usePatientCrud).toBeTruthy();
    expect(usePatientDataExtraction).toBeTruthy();
    expect(usePdfPatientImport).toBeTruthy();
    expect(usePatientVoiceAndAI).toBeTruthy();
  });
});
