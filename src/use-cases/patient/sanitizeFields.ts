import { sanitizeClinicalNote, sanitizeDiagnosis, sanitizeRut } from '@shared/utils/sanitization';
import { formatPatientName } from '@shared/utils/patientUtils';

interface PatientFieldInput {
  name: string;
  rut: string;
  diagnosis: string;
  clinicalNote: string;
}

export const sanitizePatientName = (name: string) => formatPatientName(name);

export const sanitizePatientFields = ({ name, rut, diagnosis, clinicalNote }: PatientFieldInput) => ({
  name: sanitizePatientName(name),
  rut: sanitizeRut(rut),
  diagnosis: sanitizeDiagnosis(diagnosis),
  clinicalNote: sanitizeClinicalNote(clinicalNote),
});
