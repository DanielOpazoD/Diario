
import React, { useState, useMemo, useLayoutEffect, useRef, useCallback, useEffect } from 'react';
import { format, isSameDay, differenceInYears } from 'date-fns';
import { Calendar as CalendarIcon, Search, BarChart2, LogOut, Plus, FileText, Menu, X, CheckSquare, Square, ChevronDown, Cloud, Settings as SettingsIcon, Upload, Download, RefreshCw, Trash2, Filter, Clock } from 'lucide-react';
import { PatientRecord, ViewMode, DriveFolderPreference } from './types';
import { generateHandoverReport } from './services/reportService';
import { uploadFileToDrive, downloadFile, ensureAccessToken } from './services/googleService';
import { downloadDataAsJson, parseUploadedJson } from './services/storage';
import Button from './components/Button';
import PatientModal from './components/PatientModal';
import Stats from './components/Stats';
import Settings from './components/Settings';
import Login from './components/Login';
import Toast from './components/Toast';
import DateNavigator from './components/DateNavigator';
import TaskDashboard from './components/TaskDashboard';
import ConfirmationModal from './components/ConfirmationModal';
import BackupModal from './components/BackupModal';
import DrivePickerModal from './components/DrivePickerModal';
import { LogProvider, useLogger } from './context/LogContext';
import DebugConsole from './components/DebugConsole';
import { validateEnvironment } from './services/geminiService';
import useAppStore from './stores/useAppStore';

// Utility to Title Case names
const toTitleCase = (str: string) => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

// Helper to safely parse YYYY-MM-DD to local Date
const parseLocalYMD = (dateStr: string) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  return new Date(dateStr);
};

// Helper to calculate age
const calculateAge = (birthDateStr?: string) => {
  if (!birthDateStr) return '';
  try {
    const age = differenceInYears(new Date(), parseLocalYMD(birthDateStr));
    return `${age} años`;
  } catch (e) {
    return '';
  }
};

// --- COMPACT PATIENT ROW COMPONENT (Redesigned) ---
const CompactPatientCard: React.FC<{
  patient: PatientRecord;
  onEdit: (p: PatientRecord) => void;
  onDelete: (id: string) => void;
}> = ({ patient, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const updatePatient = useAppStore(state => state.updatePatient);
  const patientTypes = useAppStore(state => state.patientTypes);
  
  // Safe access to pendingTasks
  const tasks = patient.pendingTasks || [];
  const pendingCount = tasks.filter(t => !t.isCompleted).length;

  // Get Type Color config
  const typeConfig = patientTypes.find(t => t.label === patient.type);
  const fullColorClass = typeConfig ? typeConfig.colorClass : 'bg-gray-100 text-gray-800 border-gray-200';
  
  // Extract core color name (e.g., 'blue', 'red')
  const coreColor = fullColorClass.split('-')[1] || 'gray';
  
  const ageDisplay = calculateAge(patient.birthDate);

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    );
    updatePatient({ ...patient, pendingTasks: updatedTasks });
  };

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 overflow-hidden transition-all duration-200 hover:shadow-md mb-3">
      
      {/* Main Row */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex flex-row items-stretch cursor-pointer min-h-[76px]"
      >
        {/* 1. Color Indicator Strip (Left) - Thicker and colored */}
        <div className={`w-1.5 shrink-0 bg-${coreColor}-500`}></div>

        <div className="flex-1 flex items-center p-3 gap-3 relative overflow-hidden">
            
            {/* 2. Avatar / Initial Placeholder */}
            <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold bg-${coreColor}-50 text-${coreColor}-600 dark:bg-${coreColor}-900/20 dark:text-${coreColor}-400 uppercase shadow-sm border border-${coreColor}-100 dark:border-${coreColor}-800/50`}>
              {patient.name.substring(0, 2)}
            </div>

            {/* 3. Name & Details - Optimized for Mobile */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate leading-tight">
                        {patient.name}
                    </h3>
                    {ageDisplay && <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">• {ageDisplay}</span>}
                </div>
                
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] uppercase font-bold px-1.5 rounded-md bg-${coreColor}-50 text-${coreColor}-700 dark:bg-${coreColor}-900/30 dark:text-${coreColor}-300 border border-${coreColor}-100 dark:border-${coreColor}-800`}>
                          {patient.type}
                        </span>
                        {patient.entryTime && (
                          <span className="flex items-center text-xs font-mono gap-0.5 bg-gray-100 dark:bg-gray-700 px-1 rounded">
                            <Clock className="w-2.5 h-2.5" />
                            {patient.entryTime}
                          </span>
                        )}
                    </div>
                </div>
                
                {/* Diagnosis in a new line for mobile readability */}
                {patient.diagnosis && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate pr-2 mt-0.5 flex items-center gap-1">
                     <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0"></span>
                     {patient.diagnosis}
                  </p>
                )}
            </div>

            {/* 4. Indicators & Actions */}
            <div className="flex items-center gap-3 ml-auto flex-shrink-0 pl-1">
                {pendingCount > 0 && (
                    <div className="flex flex-col sm:flex-row items-center sm:gap-1 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 sm:py-1 rounded-md border border-amber-100 dark:border-amber-800/30 min-w-[24px] sm:min-w-auto justify-center" title={`${pendingCount} tareas pendientes`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mb-0.5 sm:mb-0"></div>
                        <span className="text-[10px] sm:text-xs font-bold text-amber-700 dark:text-amber-500">{pendingCount}</span>
                    </div>
                )}
                
                <div className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ${isExpanded ? 'rotate-180 bg-gray-100 dark:bg-gray-700' : ''}`}>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
            </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-dashed border-gray-200 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/50 animate-slide-down">
           <div className="mt-3 flex flex-wrap justify-between items-start gap-3">
              <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 uppercase tracking-wide font-medium">
                 <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-100 dark:border-gray-600 shadow-sm">RUT: {patient.rut}</span>
                 {patient.birthDate && <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-100 dark:border-gray-600 shadow-sm">{ageDisplay || format(parseLocalYMD(patient.birthDate), 'yyyy')}</span>}
                 {patient.exitTime && <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-100 dark:border-gray-600 shadow-sm">Salida: {patient.exitTime}</span>}
              </div>
              <div className="flex gap-2 ml-auto w-full sm:w-auto justify-end">
                 <button onClick={(e) => { e.stopPropagation(); onEdit(patient); }} className="flex-1 sm:flex-none justify-center text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-2 rounded-lg transition-colors shadow-sm border border-blue-100 dark:border-blue-800">Editar Ficha</button>
                 <button onClick={(e) => { e.stopPropagation(); onDelete(patient.id); }} className="flex-1 sm:flex-none justify-center text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 px-3 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm border border-red-100 dark:border-red-800"><Trash2 className="w-3 h-3"/> Borrar</button>
              </div>
           </div>
           
           {patient.clinicalNote && (
             <div className="mt-4">
                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3"/> Nota Clínica
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm border-l-4 border-l-blue-400 dark:border-l-blue-500">
                  {patient.clinicalNote}
                </div>
             </div>
           )}

           {tasks.length > 0 && (
             <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/30">
                <div className="text-[10px] uppercase font-bold text-gray-400 mb-2 flex items-center gap-1">
                    <CheckSquare className="w-3 h-3"/> Tareas Pendientes
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tasks.map(task => (
                    <div key={task.id} onClick={() => handleToggleTask(task.id)} className="flex items-center gap-3 cursor-pointer group p-2.5 rounded-lg bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 shadow-sm hover:border-blue-300 transition-all">
                       {task.isCompleted 
                         ? <CheckSquare className="w-5 h-5 text-green-500 flex-shrink-0"/> 
                         : <Square className="w-5 h-5 text-gray-300 group-hover:text-blue-500 flex-shrink-0"/>}
                       <span className={`text-xs font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                         {task.text}
                       </span>
                    </div>
                  ))}
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

// --- FILTER BAR COMPONENT ---
const FilterBar: React.FC<{
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  stats: Array<{id: string, label: string, count: number, color: string}>;
  totalCount: number;
}> = ({ activeFilter, onFilterChange, stats, totalCount }) => {
  return (
    <div className="sticky top-0 z-20 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-md pt-1 pb-3 mb-2 -mx-4 px-4 md:mx-0 md:px-0">
       <div className="flex overflow-x-auto no-scrollbar pb-1 gap-2 items-center">
          <button 
              onClick={() => onFilterChange('all')}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border ${activeFilter === 'all' ? 'bg-gray-800 text-white border-gray-800 dark:bg-white dark:text-gray-900 shadow-md scale-105' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
          >
              Todos <span className="opacity-60 ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{totalCount}</span>
          </button>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0"></div>
          {stats.map(stat => (
              <button 
                 key={stat.id}
                 onClick={() => onFilterChange(stat.label)}
                 className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border whitespace-nowrap ${
                     activeFilter === stat.label 
                     ? `bg-white dark:bg-gray-800 ring-2 ring-offset-1 dark:ring-offset-gray-900 ring-opacity-50 shadow-md scale-105 ${stat.color.replace('bg-', 'ring-').split(' ')[0]}` 
                     : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100'
                 }`}
              >
                  <span className={`w-2 h-2 rounded-full ${stat.color.split(' ')[0].replace('100', '500')}`}></span>
                  {stat.label} <span className="opacity-60 ml-1">{stat.count}</span>
              </button>
          ))}
       </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { addLog } = useLogger();
  
  // Store Selectors
  const user = useAppStore(state => state.user);
  const records = useAppStore(state => state.records);
  const generalTasks = useAppStore(state => state.generalTasks);
  const patientTypes = useAppStore(state => state.patientTypes);
  const { logout, addToast, setRecords, setGeneralTasks, addPatient, updatePatient, deletePatient } = useAppStore();
  
  // Local UI State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Filtering state
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // New states for modals
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);

  const [driveFolderPreference, setDriveFolderPreference] = useState<DriveFolderPreference>(() => {
    const stored = localStorage.getItem('medidiario_drive_folder');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('No se pudo leer la carpeta preferida de Drive', e);
      }
    }
    return { id: null, name: 'MediDiario Backups' } as DriveFolderPreference;
  });

  const mainScrollRef = useRef<HTMLDivElement>(null);
  const localImportInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('medidiario_drive_folder', JSON.stringify(driveFolderPreference));
  }, [driveFolderPreference]);

  // Scroll to top when view changes
  useLayoutEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [viewMode]);

  React.useEffect(() => {
    const envStatus = validateEnvironment();
    addLog('info', 'App', 'Iniciando Aplicación', envStatus);
  }, [addLog]);

  const dailyRecords = useMemo(() => records.filter(r => isSameDay(new Date(r.date + 'T00:00:00'), currentDate)), [records, currentDate]);
  
  // Filtered Daily Records based on active Type filter
  const visibleRecords = useMemo(() => {
      if (activeFilter === 'all') return dailyRecords;
      return dailyRecords.filter(r => r.type === activeFilter);
  }, [dailyRecords, activeFilter]);

  // Calculate Summary Stats
  const summaryStats = useMemo(() => {
     return patientTypes.map(t => ({
        id: t.id,
        label: t.label,
        count: dailyRecords.filter(r => r.type === t.label).length,
        color: t.colorClass
     }));
  }, [dailyRecords, patientTypes]);

  const filteredRecords = useMemo(() => { if (!searchQuery) return []; const lower = searchQuery.toLowerCase(); return records.filter(r => r.name.toLowerCase().includes(lower) || r.rut.includes(lower) || r.diagnosis.toLowerCase().includes(lower)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); }, [records, searchQuery]);
  
  const handleLogout = () => { 
      sessionStorage.removeItem('google_access_token');
      logout();
  };
  
  const handleSavePatient = (patientData: any) => { 
    const formattedData = {
        ...patientData,
        name: toTitleCase(patientData.name)
    };

    if (editingPatient) { 
        updatePatient({ ...formattedData, id: editingPatient.id, createdAt: editingPatient.createdAt });
        addToast('success', 'Paciente actualizado'); 
    } else { 
        const newPatient: PatientRecord = { ...formattedData, id: crypto.randomUUID(), createdAt: Date.now(), }; 
        addPatient(newPatient);
        addToast('success', 'Nuevo paciente registrado'); 
    } 
    setEditingPatient(null); 
  };
  
  const handleSaveMultiplePatients = (patientsData: any[]) => {
    patientsData.forEach(p => {
       const newPatient: PatientRecord = {
          ...p,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          pendingTasks: p.pendingTasks || []
       };
       addPatient(newPatient);
    });
    addToast('success', `${patientsData.length} pacientes registrados`);
  };

  const confirmDeletePatient = () => {
    if (patientToDelete) {
       deletePatient(patientToDelete);
       addToast('info', 'Registro eliminado');
       setPatientToDelete(null);
    }
  };

  const handleLocalImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
        const importedRecords = await parseUploadedJson(file);
        setRecords(importedRecords);
        addToast('success', 'Base de datos local restaurada');
    } catch (e) {
        console.error(e);
        addToast('error', 'Error al leer el archivo');
    } finally {
        setIsUploading(false);
        if (localImportInputRef.current) localImportInputRef.current.value = '';
    }
  };
  
  const handleGeneratePDF = () => { generateHandoverReport(dailyRecords, currentDate, user?.name || 'Dr.'); addToast('success', 'PDF Generado'); };

  const handleBackupConfirm = async (fileName: string, folder: DriveFolderPreference) => {
    const token = await ensureAccessToken().catch(() => null);
    if (!token) {
      addToast('error', 'No hay sesión de Google activa o expiró la sesión.');
      return;
    }
    setIsUploading(true);
    setDriveFolderPreference(folder);
    try {
      const backupData = {
        patients: records,
        generalTasks: generalTasks,
        patientTypes: patientTypes
      };
      const finalName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
      await uploadFileToDrive(JSON.stringify(backupData, null, 2), finalName, token, folder.name, folder.id);
      addToast('success', `Respaldo guardado en carpeta "${folder.name}"`);
      setIsBackupModalOpen(false);
    } catch (e) {
      console.error(e);
      addToast('error', 'Error al subir a Drive');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDriveFileSelect = async (fileId: string) => {
    const token = await ensureAccessToken().catch(() => null);
    if (!token) return;
    
    setIsUploading(true);
    try {
      const data = await downloadFile(fileId, token);
      
      if (data.patients && Array.isArray(data.patients)) {
        setRecords(data.patients);
        if (data.generalTasks) setGeneralTasks(data.generalTasks);
        addToast('success', 'Respaldo restaurado exitosamente');
        setIsDrivePickerOpen(false);
      } else if (Array.isArray(data)) {
        setRecords(data);
        addToast('success', 'Respaldo (formato antiguo) restaurado');
        setIsDrivePickerOpen(false);
      } else {
        throw new Error("Formato de archivo no reconocido");
      }
    } catch (e) {
      console.error(e);
      addToast('error', 'Error al restaurar desde Drive');
    } finally {
      setIsUploading(false);
    }
  };

  const handleNavigation = useCallback((view: ViewMode) => {
    setViewMode(view);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  if (!user) return <Login />;

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-500">
      <Toast />
      <DebugConsole />
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}
      
      {/* Sidebar */}
      <aside
        key="main-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-72 glass border-r-0 transform transition-all duration-300 ease-out flex flex-col h-full ${
          isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } md:translate-x-0 md:bg-white/80 md:dark:bg-gray-900/80 md:backdrop-blur-lg md:h-screen md:z-40 md:border-r md:border-gray-200/60 md:dark:border-gray-800/60 md:shadow-sm flex-shrink-0`}
      >
        <div className="p-6 flex items-center justify-between"><div className="flex items-center space-x-3"><div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20"><span className="text-lg">M</span></div><h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">MediDiario</h1></div><button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button></div>
        
        <nav className="px-4 py-2 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 mt-2">Menu Principal</p>
          {[
            { id: 'daily', label: 'Agenda Diaria', icon: CalendarIcon }, 
            { id: 'tasks', label: 'Mis Tareas', icon: CheckSquare }, 
            { id: 'search', label: 'Buscador Global', icon: Search }, 
            { id: 'stats', label: 'Estadísticas', icon: BarChart2 }
          ].map((item) => (
            <button key={item.id} onClick={() => handleNavigation(item.id as ViewMode)} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${viewMode === item.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:translate-x-1'}`}><item.icon className={`w-5 h-5 mr-3 transition-colors ${viewMode === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />{item.label}</button>
          ))}

          <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-700/30 mx-4"></div>
          <button onClick={() => handleNavigation('settings')} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${viewMode === 'settings' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:translate-x-1'}`}>
             <SettingsIcon className={`w-5 h-5 mr-3 transition-colors ${viewMode === 'settings' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
             Configuración
          </button>
        </nav>

        <div className="p-4 m-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 backdrop-blur-md">
            <div className="flex items-center mb-4">
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-lg font-bold ring-2 ring-white dark:ring-gray-700 shadow-sm">
                  {(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
               </div>
               <div className="ml-3 overflow-hidden">
                 <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name || 'Usuario'}</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400 truncate opacity-80">{user.email || 'Sin email'}</p>
               </div>
            </div>
            
            <div className="space-y-2">
                {/* Drive Buttons */}
                <button onClick={() => setIsBackupModalOpen(true)} className="w-full flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg transition-all shadow-md shadow-green-500/20">
                    <Cloud className="w-3.5 h-3.5 mr-2" />
                    Guardar en Drive
                </button>
                
                <button onClick={() => setIsDrivePickerOpen(true)} className="w-full flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-all">
                    <RefreshCw className="w-3.5 h-3.5 mr-2" />
                    Restaurar Drive
                </button>

                {/* Local Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                   <button onClick={() => downloadDataAsJson(records)} className="flex items-center justify-center px-2 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all" title="Descargar Local">
                      <Download className="w-3.5 h-3.5 mr-1" /> Local
                   </button>
                   <button onClick={() => localImportInputRef.current?.click()} className="flex items-center justify-center px-2 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all" title="Cargar Local">
                      <Upload className="w-3.5 h-3.5 mr-1" /> Restaurar
                   </button>
                   <input type="file" ref={localImportInputRef} onChange={handleLocalImport} accept=".json" className="hidden" />
                </div>
                
                <button onClick={handleLogout} className="w-full flex items-center justify-center px-3 py-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-2">
                    <LogOut className="w-3.5 h-3.5 mr-2" /> Salir
                </button>
            </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full relative bg-gray-50/50 dark:bg-gray-950 overflow-hidden md:ml-72">
        {/* Header */}
        <header className="shrink-0 sticky top-0 z-30 flex flex-col md:flex-row items-center justify-between px-4 md:px-6 transition-all glass pt-2 pb-2 md:pt-4 md:pb-3 gap-2 md:gap-0 shadow-sm border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden mr-3 p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:bg-gray-200 dark:active:bg-gray-700"><Menu className="w-6 h-6" /></button>
                {viewMode !== 'daily' && (
                    <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
                        {viewMode === 'search' && 'Búsqueda'}
                        {viewMode === 'stats' && 'Estadísticas'}
                        {viewMode === 'tasks' && 'Tareas'}
                        {viewMode === 'settings' && 'Ajustes'}
                    </h2>
                )}
            </div>
            
            {viewMode === 'daily' ? (
                <div className="flex-1 md:flex-none flex justify-center md:justify-start items-center gap-2">
                    <DateNavigator currentDate={currentDate} onSelectDate={setCurrentDate} records={records} />
                </div>
            ) : null}

            {viewMode === 'daily' && (
                <button 
                    onClick={() => { setEditingPatient(null); setIsModalOpen(true); }} 
                    className="md:hidden ml-2 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" />
                </button>
            )}
          </div>
          
          <div className="flex items-center gap-3 hidden md:flex">
              {viewMode === 'daily' && (
                  <>
                      <Button variant="secondary" onClick={handleGeneratePDF} className="shadow-sm border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-md" icon={<FileText className="w-4 h-4" />}>
                          Reporte Turno
                      </Button>
                      <Button onClick={() => { setEditingPatient(null); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />} className="shadow-md hover:shadow-lg">
                          Nuevo Paciente
                      </Button>
                  </>
              )}
          </div>
        </header>

        {/* Main Content Area with ref for scroll reset */}
        <div ref={mainScrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6 relative scroll-smooth">
           {viewMode === 'daily' && (
             <div className="h-full flex flex-col max-w-5xl mx-auto">
               
               {/* Filters & Summary Bar */}
               <div className="animate-fade-in">
                   <FilterBar 
                     activeFilter={activeFilter} 
                     onFilterChange={setActiveFilter} 
                     stats={summaryStats}
                     totalCount={dailyRecords.length} 
                   />
               </div>

               {/* Vertical List View */}
               {visibleRecords.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center flex-1">
                   <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                      {activeFilter === 'all' ? <CalendarIcon className="w-10 h-10 opacity-50" /> : <Filter className="w-10 h-10 opacity-50"/>}
                   </div>
                   <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">
                      {activeFilter === 'all' ? 'Sin pacientes hoy' : `Sin pacientes en ${activeFilter}`}
                   </h3>
                   <p className="max-w-xs mx-auto mb-6 text-sm">
                      {activeFilter === 'all' 
                        ? `No hay ingresos para el ${format(currentDate, "dd-MM-yyyy")}.` 
                        : 'Intenta seleccionar otro filtro o agrega un nuevo paciente.'}
                   </p>
                   {activeFilter === 'all' && (
                       <Button onClick={() => { setEditingPatient(null); setIsModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>Agregar Primer Paciente</Button>
                   )}
                 </div>
               ) : (
                 <div className="flex-1 pb-20 md:pb-4 animate-fade-in">
                   <div className="space-y-2">
                      {visibleRecords.map(patient => (
                         <CompactPatientCard 
                           key={patient.id} 
                           patient={patient} 
                           onEdit={() => { setEditingPatient(patient); setIsModalOpen(true); }} 
                           onDelete={() => setPatientToDelete(patient.id)}
                         />
                      ))}
                   </div>
                 </div>
               )}
             </div>
           )}

           {viewMode === 'search' && (
             <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
               <div className="relative mb-8">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                 <input type="text" placeholder="Buscar por nombre, RUT o diagnóstico..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-lg" autoFocus />
               </div>
               {searchQuery && (
                 <div className="space-y-4">
                   <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Resultados ({filteredRecords.length})</p>
                   {filteredRecords.map(patient => (
                     <div key={patient.id} className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex-1">
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{patient.date}</span>
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{patient.type}</span>
                           </div>
                           <h4 className="font-bold text-lg">{patient.name}</h4>
                           <p className="text-sm text-gray-600 dark:text-gray-300">{patient.diagnosis}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <Button size="sm" variant="secondary" onClick={() => { setEditingPatient(patient); setIsModalOpen(true); }}>Ver Ficha</Button>
                        </div>
                     </div>
                   ))}
                   {filteredRecords.length === 0 && <p className="text-center text-gray-500 py-10">No se encontraron coincidencias.</p>}
                 </div>
               )}
             </div>
           )}

           {viewMode === 'stats' && <Stats currentDate={currentDate} />}
           
           {viewMode === 'tasks' && <TaskDashboard onNavigateToPatient={(p) => { setEditingPatient(p); setIsModalOpen(true); }} />}

           {viewMode === 'settings' && <Settings />}
        </div>
      </main>

      {/* Modals */}
      <PatientModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingPatient(null); }} onSave={handleSavePatient} onSaveMultiple={handleSaveMultiplePatients} addToast={addToast} initialData={editingPatient} selectedDate={format(currentDate, 'yyyy-MM-dd')} />
      <ConfirmationModal isOpen={!!patientToDelete} onClose={() => setPatientToDelete(null)} onConfirm={confirmDeletePatient} title="Eliminar Paciente" message="¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer." isDangerous={true} />
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onConfirm={handleBackupConfirm}
        defaultFileName={`backup_medidiario_${format(new Date(), 'yyyy-MM-dd')}`}
        isLoading={isUploading}
        preferredFolder={driveFolderPreference}
        onFolderChange={setDriveFolderPreference}
      />
      <DrivePickerModal
        isOpen={isDrivePickerOpen}
        onClose={() => setIsDrivePickerOpen(false)}
        onSelect={handleDriveFileSelect}
        isLoadingProp={isUploading}
        preferredFolder={driveFolderPreference}
        onFolderChange={setDriveFolderPreference}
      />
    </div>
  );
};

const App: React.FC = () => (
  <LogProvider>
    <AppContent />
  </LogProvider>
);

export default App;
