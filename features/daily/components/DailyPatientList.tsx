import React from 'react';
import CompactPatientCard from '../../patients/components/CompactPatientCard';
import { PatientRecord } from '../../../shared/types/index.ts';

interface DailyPatientListProps {
  patients: PatientRecord[];
  selectionMode: boolean;
  selectedPatients: Set<string>;
  onEditPatient: (patient: PatientRecord) => void;
  onDeletePatient: (patientId: string) => void;
  onToggleSelect: (patientId: string) => void;
}

const DailyPatientList: React.FC<DailyPatientListProps> = ({
  patients,
  selectionMode,
  selectedPatients,
  onEditPatient,
  onDeletePatient,
  onToggleSelect,
}) => (
  <div className="flex-1 pb-20 md:pb-4 animate-fade-in">
    <div className="space-y-2">
      {patients.map(patient => (
        <CompactPatientCard
          key={patient.id}
          patient={patient}
          onEdit={() => onEditPatient(patient)}
          onDelete={() => onDeletePatient(patient.id)}
          selectionMode={selectionMode}
          selected={selectedPatients.has(patient.id)}
          onToggleSelect={() => onToggleSelect(patient.id)}
        />
      ))}
    </div>
  </div>
);

export default DailyPatientList;
