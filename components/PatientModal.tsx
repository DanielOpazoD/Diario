
import React, { useState, useEffect } from 'react';
import { X, Camera, Users } from 'lucide-react';
import { PatientRecord, PatientType, PendingTask, AttachedFile } from '../types';
import Button from './Button';
import useAppStore from '../stores/useAppStore';
import ClinicalNote from './patient/ClinicalNote';
import PatientIdentificationPanel from './patient/PatientIdentificationPanel';
import PatientAttachmentsSection from './patient/PatientAttachmentsSection';
import { formatPatientName, formatTitleCase } from './patient/patientUtils';
import usePatientVoiceAndAI from '../hooks/usePatientVoiceAndAI';
import usePatientDataExtraction from '../hooks/usePatientDataExtraction';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Omit<PatientRecord, 'id' | 'createdAt'> | PatientRecord) => void;
  onSaveMultiple?: (patients: Array<Omit<PatientRecord, 'id' | 'createdAt'>>) => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  initialData?: PatientRecord | null;
  selectedDate: string;
}

const PatientModal: React.FC<PatientModalProps> = ({ isOpen, onClose, onSave, onSaveMultiple, addToast, initialData, selectedDate }) => {
  const patientTypes = useAppStore(state => state.patientTypes);

  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const defaultTypeId = patientTypes.find(t => t.id === 'policlinico')?.id || patientTypes[0]?.id || '';
  const [type, setType] = useState<string>(PatientType.POLICLINICO);
  const [typeId, setTypeId] = useState<string>(defaultTypeId);
  const [entryTime, setEntryTime] = useState('');
  const [exitTime, setExitTime] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNote, setClinicalNote] = useState('');
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'clinical' | 'files'>('clinical');
  
  const {
    isAnalyzing,
    isListening,
    toggleListening,
    handleAIAnalysis,
  } = usePatientVoiceAndAI({
    clinicalNote,
    setClinicalNote,
    setDiagnosis,
    setPendingTasks,
    addToast,
  });

  const {
    fileInputRef,
    multiFileInputRef,
    isScanning,
    isScanningMulti,
    isExtractingFromFiles,
    handleImageUpload,
    handleMultiImageUpload,
    handleExtractFromAttachments: extractFromAttachments,
  } = usePatientDataExtraction({
    addToast,
    selectedDate,
    onClose,
    onSaveMultiple,
    setName,
    setRut,
    setBirthDate,
    setGender,
  });

  // Reset form strictly when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name); 
        setRut(initialData.rut); 
        setBirthDate(initialData.birthDate || ''); 
        setGender(initialData.gender || ''); 
        setType(initialData.type);
        const resolvedTypeId = initialData.typeId
          || patientTypes.find(t => t.label === initialData.type)?.id
          || defaultTypeId;
        setTypeId(resolvedTypeId);
        setEntryTime(initialData.entryTime || ''); 
        setExitTime(initialData.exitTime || '');
        setDiagnosis(initialData.diagnosis);
        setClinicalNote(initialData.clinicalNote);
        setPendingTasks(initialData.pendingTasks);
        setAttachedFiles(initialData.attachedFiles || []);
        setDriveFolderId(initialData.driveFolderId || null);
      } else {
        // Always start from zero for new patient
        setName('');
        setRut('');
        setBirthDate('');
        setGender(''); 
        setType(PatientType.POLICLINICO);
        setTypeId(defaultTypeId);
        setEntryTime(''); 
        setExitTime(''); 
        setDiagnosis('');
        setClinicalNote('');
        setPendingTasks([]);
        setAttachedFiles([]);
        setDriveFolderId(null);
      }
      setActiveTab('clinical');
    }
  }, [isOpen, initialData]);

  const handleNameBlur = () => {
    if (name) {
      setName(formatPatientName(name));
    }
  };

  const handleExtractFromAttachments = () => {
    extractFromAttachments(attachedFiles, { name, rut, birthDate, gender });
  };

  const handleSave = () => {
    if (!name.trim()) return addToast('error', 'Nombre requerido');
    const finalName = formatPatientName(name);
    const selectedType = patientTypes.find(t => t.id === typeId);
    const patientData = {
      ...(initialData || {}),
      name: finalName,
      rut,
      birthDate,
      gender,
      type: selectedType?.label || type,
      typeId: selectedType?.id || typeId,
      entryTime: entryTime || undefined,
      exitTime: exitTime || undefined,
      diagnosis,
      clinicalNote,
      pendingTasks,
      attachedFiles,
      driveFolderId,
      date: initialData ? initialData.date : selectedDate
    };
    onSave(patientData as any);
    onClose();
  };

  const toggleTask = (id: string) => { setPendingTasks(tasks => tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)); };
  const deleteTask = (id: string) => { setPendingTasks(tasks => tasks.filter(t => t.id !== id)); };
  const addTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
       setPendingTasks(prev => [...prev, { id: crypto.randomUUID(), text: e.currentTarget.value, isCompleted: false }]);
       e.currentTarget.value = '';
    }
  };

  // Explicitly check for 'Turno' type to toggle entry/exit times
  const turnoTypeId = patientTypes.find(t => t.id === 'turno')?.id || 'turno';
  const isTurno = typeId === turnoTypeId;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Container - Full screen on mobile, centered on desktop */}
      <div className="relative w-full md:max-w-4xl bg-white dark:bg-gray-800 md:rounded-2xl shadow-2xl flex flex-col h-full md:h-auto md:max-h-[95vh] overflow-hidden animate-slide-up border border-gray-200 dark:border-gray-700">
        
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 md:px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center gap-1">
             <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
               {initialData ? 'Editar Paciente' : 'Nuevo Ingreso'}
             </h2>
             <span className="self-start md:self-auto text-xs font-normal text-gray-500 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded-md shadow-sm">{initialData ? initialData.date : selectedDate}</span>
          </div>

          <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center sm:gap-3">
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
             <input type="file" ref={multiFileInputRef} className="hidden" accept="image/*" onChange={handleMultiImageUpload} />

             {!initialData && (
               <>
                 <span className="text-xs text-gray-500 sm:hidden">Acciones rápidas</span>
                 <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                   <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => multiFileInputRef.current?.click()}
                      isLoading={isScanningMulti}
                      icon={<Users className="w-4 h-4" />}
                      className="flex items-center justify-center sm:flex w-full sm:w-auto"
                    >
                      <span className="hidden sm:inline">Lista</span>
                      <span className="sm:hidden">Lista de pacientes</span>
                   </Button>
                   <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      isLoading={isScanning}
                      icon={<Camera className="w-4 h-4" />}
                      className="w-full sm:w-auto"
                   >
                      <span className="hidden sm:inline">Ficha</span>
                      <span className="sm:hidden">Ficha individual</span>
                   </Button>
                 </div>
               </>
             )}
             <div className="flex justify-end">
               <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                 <X className="w-5 h-5 text-gray-500" />
               </button>
             </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-gray-50/30 dark:bg-gray-900/10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
            <PatientIdentificationPanel
              name={name}
              rut={rut}
              birthDate={birthDate}
              gender={gender}
              typeId={typeId}
              patientTypes={patientTypes}
              isTurno={isTurno}
              entryTime={entryTime}
              exitTime={exitTime}
              isExtractingFromFiles={isExtractingFromFiles}
              onExtractFromAttachments={handleExtractFromAttachments}
              onNameChange={setName}
              onNameBlur={handleNameBlur}
              onRutChange={setRut}
              onBirthDateChange={setBirthDate}
              onGenderChange={setGender}
              onSelectType={(typeIdValue, typeLabel) => {
                setType(typeLabel);
                setTypeId(typeIdValue);
              }}
              onEntryTimeChange={setEntryTime}
              onExitTimeChange={setExitTime}
            />

            <div className="md:col-span-8 flex flex-col h-full">
              <ClinicalNote
                diagnosis={diagnosis}
                clinicalNote={clinicalNote}
                pendingTasks={pendingTasks}
                isListening={isListening}
                isAnalyzing={isAnalyzing}
                activeTab={activeTab}
                attachmentsCount={attachedFiles.length}
                onDiagnosisChange={setDiagnosis}
                onClinicalNoteChange={setClinicalNote}
                onToggleListening={toggleListening}
                onAnalyze={handleAIAnalysis}
                onToggleTask={toggleTask}
                onDeleteTask={deleteTask}
                onAddTask={addTask}
                onChangeTab={setActiveTab}
                attachmentsSection={(
                  <PatientAttachmentsSection
                    attachedFiles={attachedFiles}
                    patientRut={rut}
                    patientName={name}
                    driveFolderId={driveFolderId}
                    addToast={addToast}
                    onFilesChange={setAttachedFiles}
                    onDriveFolderIdChange={setDriveFolderId}
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-4 md:px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0 z-20">
           <Button variant="ghost" onClick={onClose} className="flex-1 md:flex-none">Cancelar</Button>
           <Button onClick={handleSave} className="flex-1 md:flex-none px-8 shadow-lg shadow-blue-500/20">Guardar Ficha</Button>
        </div>
      </div>
    </div>
  );
};

export { formatTitleCase, formatPatientName };

export default PatientModal;
