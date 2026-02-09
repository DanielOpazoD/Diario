import { describe, expect, it } from 'vitest';
import * as PatientIndex from '../../src/core/patient/index';

describe('core/patient index exports (relative)', () => {
  it('exports expected symbols', () => {
    expect(PatientIndex).toBeTruthy();
    expect(PatientIndex.ExecutivePatientRow).toBeTruthy();
    expect(PatientIndex.InlinePatientEditor).toBeTruthy();
    expect(PatientIndex.usePatientCrud).toBeTruthy();
    expect(PatientIndex.usePatientDataExtraction).toBeTruthy();
    expect(PatientIndex.usePdfPatientImport).toBeTruthy();
    expect(PatientIndex.usePatientVoiceAndAI).toBeTruthy();
  });
});
