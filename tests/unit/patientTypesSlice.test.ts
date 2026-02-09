import { beforeEach, describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { createPatientTypesSlice, PatientTypesSlice, defaultPatientTypes } from '@core/stores/slices/patientTypesSlice';

describe('patientTypesSlice', () => {
  const useStore = create<PatientTypesSlice>(createPatientTypesSlice);

  beforeEach(() => {
    useStore.setState({ patientTypes: defaultPatientTypes } as any);
  });

  it('adds and removes patient types', () => {
    useStore.getState().addPatientType({ id: 'custom', label: 'Custom', colorClass: 'bg-test' } as any);
    expect(useStore.getState().patientTypes.find((t) => t.id === 'custom')).toBeTruthy();
    useStore.getState().removePatientType('custom');
    expect(useStore.getState().patientTypes.find((t) => t.id === 'custom')).toBeUndefined();
  });

  it('sets patient types', () => {
    useStore.getState().setPatientTypes([{ id: 'only', label: 'Only', colorClass: 'bg' } as any]);
    expect(useStore.getState().patientTypes).toHaveLength(1);
  });
});
