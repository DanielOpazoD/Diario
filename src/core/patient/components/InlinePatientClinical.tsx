import React from 'react';
import ClinicalNote from '@core/patient/components/ClinicalNote';
import { PendingTask } from '@shared/types';

interface InlinePatientClinicalProps {
  diagnosis: string;
  clinicalNote: string;
  pendingTasks: PendingTask[];
  isListening: boolean;
  isAnalyzing: boolean;
  isSummarizing: boolean;
  attachmentsCount: number;
  onDiagnosisChange: (value: string) => void;
  onClinicalNoteChange: (value: string) => void;
  onToggleListening: () => void;
  onAnalyze: () => void;
  onSummary: () => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onUpdateTaskNote: (taskId: string, note: string) => void;
}

const InlinePatientClinical: React.FC<InlinePatientClinicalProps> = ({
  diagnosis,
  clinicalNote,
  pendingTasks,
  isListening,
  isAnalyzing,
  isSummarizing,
  attachmentsCount,
  onDiagnosisChange,
  onClinicalNoteChange,
  onToggleListening,
  onAnalyze,
  onSummary,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  onUpdateTaskNote,
}) => (
  <div className="w-full min-w-0 overflow-hidden">
    <ClinicalNote
      diagnosis={diagnosis}
      clinicalNote={clinicalNote}
      pendingTasks={pendingTasks}
      isListening={isListening}
      isAnalyzing={isAnalyzing}
      isSummarizing={isSummarizing}
      onDiagnosisChange={onDiagnosisChange}
      onClinicalNoteChange={onClinicalNoteChange}
      onToggleListening={onToggleListening}
      onAnalyze={onAnalyze}
      onSummary={onSummary}
      onToggleTask={onToggleTask}
      onDeleteTask={onDeleteTask}
      onAddTask={onAddTask}
      onUpdateTaskNote={onUpdateTaskNote}
      activeTab="clinical"
      onChangeTab={() => {}}
      attachmentsCount={attachmentsCount}
      minimal={true}
    />
  </div>
);

export default InlinePatientClinical;
