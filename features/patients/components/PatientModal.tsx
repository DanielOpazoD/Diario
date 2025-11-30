
import React, { useEffect, useRef, useState } from 'react';
import { X, Sparkles, CheckSquare, Square, Camera, Mic, Clock, Users, Paperclip, FileText } from 'lucide-react';
import { PatientRecord, PatientType, PendingTask, AttachedFile } from '../../../shared/types';
import Button from '../../../shared/components/Button';
import { analyzeClinicalNote, extractPatientDataFromImage, extractMultiplePatientsFromImage } from '../../../services/geminiService';
import { fileToBase64 } from '../../../services/storage';
import FileAttachmentManager from '../../../components/FileAttachmentManager';
import useAppStore from '../../../stores/useAppStore';
import usePatientForm from '../hooks/usePatientForm';

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

const PatientModal: React.FC<PatientModalProps> = ({ isOpen, onClose, onSave, onSaveMultiple, addToast, initialData, selectedDate }) => {
  const patientTypes = useAppStore(state => state.patientTypes);

  const {
    name,
    rut,
    birthDate,
    gender,
    type,
    entryTime,
    exitTime,
    diagnosis,
    clinicalNote,
    pendingTasks,
    attachedFiles,
    setName,
    setRut,
    setBirthDate,
    setGender,
    setType,
    setEntryTime,
    setExitTime,
    setDiagnosis,
    setClinicalNote,
    setPendingTasks,
    setAttachedFiles,
  } = usePatientForm({ initialData, isOpen, selectedDate });
  
  // UI State
  const [activeTab, setActiveTab] = useState<'clinical' | 'files'>('clinical');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isScanningMulti, setIsScanningMulti] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
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

  useEffect(() => {
    if (isOpen) {
      setActiveTab('clinical');
    }
  }, [isOpen]);

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
      setName(formatTitleCase(name));
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
        if (extractedData.name) setName(formatTitleCase(extractedData.name));
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
          name: formatTitleCase(p.name),
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
    const finalName = formatTitleCase(name);
    const patientData = { 
      ...(initialData || {}), 
      name: finalName, 
      rut, 
      birthDate, 
      gender, 
      type, 
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
  const isTurno = type === 'Turno';

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
              
              {/* Left Column: Personal Info (4 Columns) */}
              <div className="md:col-span-4 space-y-5">
                 {/* ID Card Section */}
                 <div className="bg-white dark:bg-gray-800 md:dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 flex items-center gap-2 tracking-wider">
                      <Users className="w-3.5 h-3.5" /> Identificación
                    </h3>
                    <div className="space-y-4">
                       <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Nombre Completo</label>
                          <input 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            onBlur={handleNameBlur}
                            placeholder="Nombre Apellido 1 Apellido 2" 
                            className="w-full px-3 py-3 md:py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                       </div>
                       <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">RUT</label>
                            <input value={rut} onChange={e => setRut(e.target.value)} placeholder="12.345.678-9" className="w-full px-3 py-3 md:py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Nacimiento</label>
                                <input 
                                  type="date" 
                                  value={birthDate} 
                                  onChange={e => setBirthDate(e.target.value)} 
                                  className="w-full px-2 py-3 md:py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Género</label>
                                <select 
                                   value={gender} 
                                   onChange={e => setGender(e.target.value)}
                                   className="w-full px-2 py-3 md:py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="">Seleccionar</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Type Section */}
                 <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10">
                    <h3 className="text-xs font-bold uppercase text-blue-500/80 mb-3 flex items-center gap-2 tracking-wider">
                      <Clock className="w-3.5 h-3.5" /> Tipo de Ingreso
                    </h3>
                    <div className="space-y-3">
                       <div className="flex flex-wrap gap-2">
                          {patientTypes.map(t => (
                            <button 
                              key={t.id} 
                              onClick={() => setType(t.label)}
                              className={`text-xs font-medium py-2 px-3 rounded-lg border transition-all flex-1 md:flex-none justify-center ${
                                type === t.label 
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                       </div>
                       
                       {isTurno && (
                         <div className="grid grid-cols-2 gap-3 animate-fade-in pt-2 border-t border-blue-100 dark:border-blue-800/30">
                            <div>
                               <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Hora Ingreso</label>
                               <input type="time" value={entryTime} onChange={e => setEntryTime(e.target.value)} className="w-full p-2 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs outline-none"/>
                            </div>
                            <div>
                               <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">Hora Egreso</label>
                               <input type="time" value={exitTime} onChange={e => setExitTime(e.target.value)} className="w-full p-2 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs outline-none"/>
                            </div>
                         </div>
                       )}
                    </div>
                 </div>
              </div>

              {/* Right Column: Clinical Data (8 Columns) */}
              <div className="md:col-span-8 flex flex-col h-full">
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 space-x-6 sticky top-0 bg-gray-50/30 dark:bg-gray-900/10 backdrop-blur-sm z-10 pt-2">
                     <button
                        onClick={() => setActiveTab('clinical')}
                        className={`flex items-center gap-2 pb-3 text-sm font-bold transition-all relative px-2 ${activeTab === 'clinical' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                     >
                        <FileText className="w-4 h-4" /> Clínica
                        {activeTab === 'clinical' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>}
                     </button>
                     <button
                        onClick={() => setActiveTab('files')}
                        className={`flex items-center gap-2 pb-3 text-sm font-bold transition-all relative px-2 ${activeTab === 'files' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                     >
                        <Paperclip className="w-4 h-4" /> 
                        Adjuntos
                        {attachedFiles.length > 0 && (
                           <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] px-1.5 py-0.5 rounded-full">{attachedFiles.length}</span>
                        )}
                        {activeTab === 'files' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>}
                     </button>
                  </div>

                  <div className="mb-5">
                     <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Diagnóstico Principal</label>
                     <input 
                       value={diagnosis} 
                       onChange={e => setDiagnosis(e.target.value)} 
                       placeholder="Ej. Neumonía Adquirida en la Comunidad, HTA descompensada..." 
                       className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium"
                     />
                  </div>

                  {activeTab === 'clinical' ? (
                    <div className="flex-1 flex flex-col animate-fade-in space-y-4">
                       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Evolución / Nota Clínica</label>
                          
                          <div className="flex gap-2 w-full md:w-auto">
                             <button 
                               onClick={toggleListening} 
                               className={`flex-1 md:flex-none justify-center flex items-center gap-1.5 px-3 py-2 md:py-1.5 rounded-full text-xs font-medium transition-all ${isListening ? 'bg-red-100 text-red-600 ring-2 ring-red-200 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`} 
                               title="Dictar voz"
                             >
                               <Mic className="w-3.5 h-3.5" />
                               {isListening ? 'Escuchando...' : 'Dictar'}
                             </button>
                             
                             <button 
                               onClick={handleAIAnalysis} 
                               disabled={isAnalyzing} 
                               className="flex-1 md:flex-none justify-center group flex items-center gap-1.5 px-4 py-2 md:py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-violet-500/20 disabled:opacity-70"
                             >
                               <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                               {isAnalyzing ? 'Analizando...' : 'Generar Plan IA'}
                             </button>
                          </div>
                       </div>
                       
                       <div className="relative flex-1 min-h-[200px] group">
                          <textarea 
                            value={clinicalNote} 
                            onChange={e => setClinicalNote(e.target.value)} 
                            placeholder="Escribe la evolución del paciente. Usa el botón de IA para extraer tareas automáticamente." 
                            className="w-full h-full p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-inner leading-relaxed font-medium text-gray-700 dark:text-gray-200"
                          />
                       </div>
                       
                       <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800/30 min-h-[150px] flex flex-col">
                          <h4 className="text-xs font-bold uppercase text-amber-600 dark:text-amber-500 mb-3 flex items-center gap-2 tracking-wider shrink-0">
                            <CheckSquare className="w-3.5 h-3.5" /> Pendientes & Tareas
                          </h4>
                          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                             {pendingTasks.length === 0 && (
                                <p className="text-xs text-amber-700/50 italic text-center py-2">No hay tareas pendientes. Agrega una o usa la IA.</p>
                             )}
                             {pendingTasks.map(task => (
                               <div key={task.id} className="flex items-center group bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/50 shadow-sm hover:shadow-md transition-all">
                                  <button onClick={() => toggleTask(task.id)} className="mr-3 text-gray-400 hover:text-blue-500 transition-colors p-1">
                                     {task.isCompleted ? <CheckSquare className="w-5 h-5 text-green-500"/> : <Square className="w-5 h-5"/>}
                                  </button>
                                  <span className={`text-sm flex-1 font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>{task.text}</span>
                                  <button onClick={() => deleteTask(task.id)} className="md:opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1.5 transition-opacity"><X className="w-4 h-4"/></button>
                               </div>
                             ))}
                          </div>
                          <div className="relative mt-3 shrink-0">
                                <input 
                                  type="text" 
                                  placeholder="+ Escribe tarea y presiona Enter..." 
                                  onKeyDown={addTask}
                                  className="w-full px-3 py-3 md:py-2 text-sm bg-white dark:bg-gray-800 rounded-lg border border-transparent hover:border-amber-200 focus:border-amber-400 outline-none shadow-sm placeholder-gray-400"
                                />
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col min-h-[200px]">
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
