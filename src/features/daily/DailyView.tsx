import React from 'react';
import VirtualizedPatientList from '@features/daily/VirtualizedPatientList';
import DailyHeader from '@features/daily/components/DailyHeader';
import BatchOperationsBar from '@features/daily/components/BatchOperationsBar';
import EmptyStateView from '@features/daily/components/EmptyStateView';

import { PatientRecord, PatientTypeConfig } from '@shared/types';
import { DailyViewProvider } from '@features/daily/context/DailyViewProvider';
import { useDailyViewContext } from '@features/daily/context/DailyViewContext';

interface DailyViewProps {
  currentDate: Date;
  records: PatientRecord[];
  patientTypes: PatientTypeConfig[];
  onAddPatient: () => void;
  onEditPatient: (patient: PatientRecord, initialTab?: 'clinical' | 'files') => void;
  onDeletePatient: (patientId: string) => void;
  onMovePatients: (patientIds: string[], targetDate: string) => void;
  onCopyPatients: (patientIds: string[], targetDate: string) => void;
}

const DailyViewContent: React.FC = () => {
  const {
    visibleRecords,
    selectionMode,
  } = useDailyViewContext();

  return (
    <div className="h-full min-h-0 flex flex-col w-full max-w-full">
      <DailyHeader />

      {selectionMode && <BatchOperationsBar />}

      <div className="flex-1 min-h-0 relative">
        {visibleRecords.length > 0 ? (
          <VirtualizedPatientList />
        ) : (
          <EmptyStateView />
        )}
      </div>
    </div>
  );
};

const DailyView: React.FC<DailyViewProps> = (props) => {
  return (
    <DailyViewProvider
      currentDate={props.currentDate}
      records={props.records}
      patientTypes={props.patientTypes}
      onEditPatient={props.onEditPatient}
      onDeletePatient={props.onDeletePatient}
      onMovePatients={props.onMovePatients}
      onCopyPatients={props.onCopyPatients}
    >
      <DailyViewContent />
    </DailyViewProvider>
  );
};

export default DailyView;
