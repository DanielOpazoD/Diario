import React from 'react';
import ClinicalNote from '@core/patient/components/ClinicalNote';
import PatientForm from '@core/patient/components/PatientForm';
import { usePatientModalContext } from '@core/patient/context/PatientModalContext';

const PatientModalBody: React.FC = () => {
  const {
    isEditingDemographics,
  } = usePatientModalContext();

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/20 dark:bg-gray-900/10">
      <div className="flex flex-col gap-0">
        {isEditingDemographics && (
          <div className="px-3 md:px-5 py-2 border-b border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 animate-fade-in shadow-inner">
            <PatientForm superMinimalist={true} />
          </div>
        )}

        <div className="p-3 md:p-4">
          <ClinicalNote />
        </div>
      </div>
    </div>
  );
};

export default React.memo(PatientModalBody);
