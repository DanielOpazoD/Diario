export const legacyPathMap = new Map([
  ['components/CompactPatientCard.tsx', 'core/patient/components/CompactPatientCard.tsx'],
  ['components/PatientModal.tsx', 'core/patient/components/PatientModal.tsx'],
  ['components/Settings.tsx', 'features/settings/Settings.tsx'],
  ['components/AppModals.tsx', 'features/daily/AppModals.tsx'],
  ['layouts/MainLayout.tsx', 'core/layouts/MainLayout.tsx'],
  ['hooks/useAutoLock.ts', 'core/hooks/useAutoLock.ts'],
  ['stores/slices/settingsSlice.ts', 'core/stores/slices/settingsSlice.ts'],
]);

export const legacyPrefixMap = new Map([
  ['stores/', 'core/stores/'],
  ['services/', 'services/'],
  ['hooks/', 'core/hooks/'],
  ['layouts/', 'core/layouts/'],
  ['components/', 'core/components/'],
]);
