import React from 'react';
import { PatientRecord } from '../../patients';
import CompactPatientCard from '../../patients/components/CompactPatientCard';

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
}) => {
  return (
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
  );
};

export default DailyPatientList;
