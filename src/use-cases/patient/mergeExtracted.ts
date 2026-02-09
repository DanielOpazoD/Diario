export const mergeExtractedFields = (base: any, incoming: any) => ({
  ...base,
  name: base.name || incoming?.name || '',
  rut: base.rut || incoming?.rut || '',
  birthDate: base.birthDate || incoming?.birthDate || '',
  gender: base.gender || incoming?.gender || '',
  diagnosis: base.diagnosis || incoming?.diagnosis || '',
  clinicalNote: base.clinicalNote || incoming?.clinicalNote || '',
});
