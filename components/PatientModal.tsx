
import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Camera, Users } from 'lucide-react';
import { PatientRecord, PatientType, PendingTask, AttachedFile } from '../types';
import Button from './Button';
import { analyzeClinicalNote, extractPatientDataFromImage, extractMultiplePatientsFromImage } from '../services/geminiService';
import { fileToBase64 } from '../services/storage';
import FileAttachmentManager from './FileAttachmentManager';
import useAppStore from '../stores/useAppStore';
import { downloadFileAsBase64 } from '../services/googleService';
import PatientForm from './patient/PatientForm';
import ClinicalNote from './patient/ClinicalNote';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Omit<PatientRecord, 'id' | 'createdAt'> | PatientRecord) => void;
  onSaveMultiple?: (patients: Array<Omit<PatientRecord, 'id' | 'createdAt'>>) => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  initialData?: PatientRecord | null;
  selectedDate: string;
}

export const formatTitleCase = (str: string) => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

const normalizeNameOrder = (raw: string) => {
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  const [beforeComma, afterComma] = cleaned.split(',').map(part => part.trim());

  if (afterComma && beforeComma) {
    return `${afterComma} ${beforeComma}`;
  }

  return cleaned;
};

export const formatPatientName = (str: string) => formatTitleCase(normalizeNameOrder(str));

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
  
  // UI State
  const [activeTab, setActiveTab] = useState<'clinical' | 'files'>('clinical');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isScanningMulti, setIsScanningMulti] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isExtractingFromFiles, setIsExtractingFromFiles] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setClinicalNote(prev => prev + " " + finalTranscript);
        }
      };
    }
  }, []);

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
      }
      setActiveTab('clinical');
    }
  }, [isOpen, initialData]);

  const toggleListening = () => {
    if (!recognitionRef.current) return addToast('error', 'Navegador no soporta voz');
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); } 
    else { recognitionRef.current.start(); setIsListening(true); addToast('info', 'Escuchando...'); }
  };

  const handleAIAnalysis = async () => {
    if (!clinicalNote.trim()) return addToast('info', 'Escribe una nota primero');
    setIsAnalyzing(true);
    try {
      const result = await analyzeClinicalNote(clinicalNote);
      if (result.structuredDiagnosis) {
        setDiagnosis(prev => prev ? `${prev} | ${result.structuredDiagnosis}` : result.structuredDiagnosis);
      }
      const newTasks: PendingTask[] = result.extractedTasks.map(text => ({
        id: crypto.randomUUID(),
        text,
        isCompleted: false
      }));
      setPendingTasks(prev => [...prev, ...newTasks]);
      addToast('success', 'Análisis IA completado');
    } catch (error: any) {
      addToast('error', `Error AI: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNameBlur = () => {
    if (name) {
      setName(formatPatientName(name));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const base64 = await fileToBase64(file);
      const extractedData = await extractPatientDataFromImage(base64, file.type);
      
      if (extractedData) {
        if (extractedData.name) setName(formatPatientName(extractedData.name));
        if (extractedData.rut) setRut(extractedData.rut);
        if (extractedData.birthDate) setBirthDate(extractedData.birthDate);
        if (extractedData.gender) setGender(extractedData.gender);
        addToast('success', 'Datos extraídos');
      }
    } catch (error: any) {
      addToast('error', 'Error procesando imagen');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExtractFromAttachments = async () => {
    if (!attachedFiles.length) {
      return addToast('info', 'Primero agrega adjuntos del paciente.');
    }

    const supportedFiles = attachedFiles.filter(file => file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf');
    if (!supportedFiles.length) {
      return addToast('info', 'Los adjuntos actuales no son compatibles (solo imágenes o PDF).');
    }

    const token = sessionStorage.getItem('google_access_token');
    if (!token) {
      return addToast('error', 'Conecta tu cuenta de Google para leer los adjuntos.');
    }

    setIsExtractingFromFiles(true);

    try {
      const updatedFields = new Set<string>();

      for (const file of supportedFiles) {
        try {
          const base64 = await downloadFileAsBase64(file.id, token);
          const extractedData = await extractPatientDataFromImage(base64, file.mimeType);

          if (extractedData) {
            if (extractedData.name && extractedData.name !== name) {
              setName(formatPatientName(extractedData.name));
              updatedFields.add('Nombre');
            }
            if (extractedData.rut && extractedData.rut !== rut) {
              setRut(extractedData.rut);
              updatedFields.add('RUT');
            }
            if (extractedData.birthDate && extractedData.birthDate !== birthDate) {
              setBirthDate(extractedData.birthDate);
              updatedFields.add('Nacimiento');
            }
            if (extractedData.gender && extractedData.gender !== gender) {
              setGender(extractedData.gender);
              updatedFields.add('Género');
            }
          }

          if (
            updatedFields.has('Nombre') &&
            updatedFields.has('RUT') &&
            updatedFields.has('Nacimiento') &&
            updatedFields.has('Género')
          ) {
            break;
          }
        } catch (error) {
          console.error('Error extracting from file', file.name, error);
        }
      }

      if (updatedFields.size > 0) {
        addToast('success', `Datos completados desde adjuntos: ${Array.from(updatedFields).join(', ')}`);
      } else {
        addToast('info', 'No se encontraron datos identificatorios en los adjuntos.');
      }
    } finally {
      setIsExtractingFromFiles(false);
    }
  };

  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!onSaveMultiple) {
      addToast('error', 'Función no disponible en este contexto');
      return;
    }

    setIsScanningMulti(true);
    try {
      const base64 = await fileToBase64(file);
      const extractedPatients = await extractMultiplePatientsFromImage(base64, file.type);
      
      if (extractedPatients && extractedPatients.length > 0) {
        const patientsToSave = extractedPatients.map(p => ({
          name: formatPatientName(p.name),
          rut: p.rut,
          birthDate: p.birthDate,
          gender: p.gender,
          type: PatientType.POLICLINICO, // Default for list scan
          diagnosis: '',
          clinicalNote: '',
          pendingTasks: [],
          attachedFiles: [],
          date: selectedDate
        }));

        onSaveMultiple(patientsToSave);
        addToast('success', `${extractedPatients.length} pacientes agregados`);
        onClose();
      } else {
        addToast('info', 'No se encontraron pacientes en la imagen');
      }
    } catch (error: any) {
      addToast('error', 'Error procesando lista');
    } finally {
      setIsScanningMulti(false);
      if (multiFileInputRef.current) multiFileInputRef.current.value = '';
    }
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
            <div className="md:col-span-4 space-y-5">
              <div className="bg-white dark:bg-gray-800 md:dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 flex items-center gap-2 tracking-wider">
                  <Users className="w-3.5 h-3.5" /> Identificación
                </h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    onClick={handleExtractFromAttachments}
                    disabled={isExtractingFromFiles}
                    className="text-[11px] inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isExtractingFromFiles ? 'animate-spin' : ''}`} />
                    {isExtractingFromFiles ? 'Leyendo adjuntos...' : 'Completar con adjuntos'}
                  </button>
                </div>
              </div>

              <PatientForm
                name={name}
                rut={rut}
                birthDate={birthDate}
                gender={gender}
                typeId={typeId}
                patientTypes={patientTypes}
                isTurno={isTurno}
                entryTime={entryTime}
                exitTime={exitTime}
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
            </div>

            <div className="md:col-span-8 flex flex-col space-y-5 h-full">
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
              />

              {activeTab === 'files' && (
                <div className="bg-white dark:bg-gray-800 md:dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex-1 flex flex-col min-h-[200px]">
                  <FileAttachmentManager
                    files={attachedFiles}
                    patientRut={rut}
                    patientName={name}
                    onFilesChange={setAttachedFiles}
                    addToast={addToast}
                  />
                </div>
              )}
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

export default PatientModal;
