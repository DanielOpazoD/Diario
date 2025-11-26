import React, { useState, useMemo, useLayoutEffect, useRef, useCallback, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { ViewMode, PatientRecord, DriveFolderPreference } from './types';
import { generateHandoverReport } from './services/reportService';
import { uploadFileToDrive, downloadFile, getActiveAccessToken, restoreStoredToken, clearStoredToken } from './services/googleService';
import { parseUploadedJson } from './services/storage';
import PatientModal from './components/PatientModal';
import Settings from './components/Settings';
import Login from './components/Login';
import Toast from './components/Toast';
import TaskDashboard from './components/TaskDashboard';
import ConfirmationModal from './components/ConfirmationModal';
import BackupModal from './components/BackupModal';
import DrivePickerModal from './components/DrivePickerModal';
import BookmarksModal from './components/BookmarksModal';
import { LogProvider, useLogger } from './context/LogContext';
import DebugConsole from './components/DebugConsole';
import { validateEnvironment } from './services/geminiService';
import useAppStore from './stores/useAppStore';
import { defaultBookmarkCategories } from './stores/slices/bookmarkSlice';
import MainLayout from './layouts/MainLayout';
import DailyView from './features/daily/DailyView';
import SearchView from './features/search/SearchView';
import StatsView from './features/stats/StatsView';
import BookmarksView from './features/bookmarks/BookmarksView';
import LockScreen from './components/LockScreen';
import useAutoLock from './hooks/useAutoLock';

const toTitleCase = (str: string) => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

const formatDateLabel = (dateStr: string) => {
  try {
    return format(new Date(dateStr + 'T00:00:00'), 'dd-MM-yyyy');
  } catch (e) {
    return dateStr;
  }
};

const AppContent: React.FC = () => {
  const { addLog } = useLogger();

  const user = useAppStore(state => state.user);
  const records = useAppStore(state => state.records);
  const generalTasks = useAppStore(state => state.generalTasks);
  const patientTypes = useAppStore(state => state.patientTypes);
  const bookmarks = useAppStore(state => state.bookmarks);
  const bookmarkCategories = useAppStore(state => state.bookmarkCategories);
  const showBookmarkBar = useAppStore(state => state.showBookmarkBar);
  const securityPin = useAppStore(state => state.securityPin);
  const autoLockMinutes = useAppStore(state => state.autoLockMinutes);
  const { logout, addToast, setRecords, setGeneralTasks, addPatient, updatePatient, deletePatient, setBookmarks, setBookmarkCategories } = useAppStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
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
  const { isLocked, handleUnlock: unlockWithPin } = useAutoLock({
    securityPin,
    autoLockMinutes,
    onLock: () => {
      if (securityPin) {
        addToast('info', 'Sesión bloqueada por inactividad');
      }
    },
    onUnlock: () => addToast('success', 'Sesión desbloqueada')
  });

  useEffect(() => {
    localStorage.setItem('medidiario_drive_folder', JSON.stringify(driveFolderPreference));
  }, [driveFolderPreference]);

  useLayoutEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [viewMode]);

  useEffect(() => {
    validateEnvironment()
      .then(envStatus => addLog('info', 'App', 'Iniciando Aplicación', envStatus))
      .catch(error => addLog('error', 'App', 'No se pudo validar el entorno', { message: String(error) }));
  }, [addLog]);

  useEffect(() => {
    restoreStoredToken();
  }, []);

  const dailyRecords = useMemo(
    () => records.filter(r => isSameDay(new Date(r.date + 'T00:00:00'), currentDate)),
    [records, currentDate]
  );

  const handleLogout = () => {
    clearStoredToken();
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
      const newPatient: PatientRecord = { ...formattedData, id: crypto.randomUUID(), createdAt: Date.now() };
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
    } catch (err) {
      console.error(err);
      addToast('error', 'Error al leer el archivo');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleGeneratePDF = () => {
    generateHandoverReport(dailyRecords, currentDate, user?.name || 'Dr.');
    addToast('success', 'PDF Generado');
  };

  const handleMovePatientsToDate = (patientIds: string[], targetDate: string) => {
    if (!targetDate) {
      addToast('error', 'Debes seleccionar una fecha destino.');
      return;
    }

    const updatedRecords = records.map(record =>
      patientIds.includes(record.id)
        ? { ...record, date: targetDate }
        : record
    );

    setRecords(updatedRecords);
    addToast('success', `Pacientes movidos al ${formatDateLabel(targetDate)}.`);
  };

  const handleCopyPatientsToDate = (patientIds: string[], targetDate: string) => {
    if (!targetDate) {
      addToast('error', 'Debes seleccionar una fecha destino.');
      return;
    }

    const selectedPatients = records.filter(record => patientIds.includes(record.id));

    if (selectedPatients.length === 0) {
      addToast('info', 'No hay pacientes para copiar.');
      return;
    }

    const timestamp = Date.now();
    const clonedPatients = selectedPatients.map((patient, index) => ({
      ...patient,
      id: crypto.randomUUID(),
      date: targetDate,
      createdAt: timestamp + index,
      pendingTasks: patient.pendingTasks?.map(task => ({ ...task, id: crypto.randomUUID() })) || [],
      attachedFiles: patient.attachedFiles?.map(file => ({ ...file, id: crypto.randomUUID() })) || [],
    }));

    setRecords([...records, ...clonedPatients]);
    addToast('success', `${clonedPatients.length} pacientes copiados al ${formatDateLabel(targetDate)}.`);
  };

  const handleBackupConfirm = async (fileName: string, folder: DriveFolderPreference) => {
    const token = getActiveAccessToken();
    if (!token) {
      addToast('error', 'No hay sesión de Google activa.');
      return;
    }
    setIsUploading(true);
    setDriveFolderPreference(folder);
    try {
      const backupData = {
        patients: records,
        generalTasks: generalTasks,
        patientTypes: patientTypes,
        bookmarks,
        bookmarkCategories,
      };
      const finalName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
      await uploadFileToDrive(JSON.stringify(backupData, null, 2), finalName, token, folder.name, folder.id);
      addToast('success', `Respaldo guardado en carpeta "${folder.name}"`);
      setIsBackupModalOpen(false);
    } catch (err) {
      console.error(err);
      addToast('error', 'Error al subir a Drive');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDriveFileSelect = async (fileId: string) => {
    const token = getActiveAccessToken();
    if (!token) return;

    setIsUploading(true);
    try {
      const data = await downloadFile(fileId, token);

      if (data.patients && Array.isArray(data.patients)) {
        setRecords(data.patients);
        if (data.generalTasks) setGeneralTasks(data.generalTasks);
        if (Array.isArray(data.bookmarks)) setBookmarks(data.bookmarks);
        if (Array.isArray(data.bookmarkCategories)) {
          setBookmarkCategories(data.bookmarkCategories);
        } else {
          setBookmarkCategories(defaultBookmarkCategories);
        }
        addToast('success', 'Respaldo restaurado exitosamente');
        setIsDrivePickerOpen(false);
      } else if (Array.isArray(data)) {
        setRecords(data);
        setBookmarks([]);
        setBookmarkCategories(defaultBookmarkCategories);
        addToast('success', 'Respaldo (formato antiguo) restaurado');
        setIsDrivePickerOpen(false);
      } else {
        throw new Error('Formato de archivo no reconocido');
      }
    } catch (err) {
      console.error(err);
      addToast('error', 'Error al restaurar desde Drive');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUnlock = (pinAttempt: string) => {
    const success = unlockWithPin(pinAttempt);

    if (!success) {
      addToast('error', 'PIN incorrecto');
    }

    return success;
  };

  const handleNavigation = useCallback((view: ViewMode) => {
    setViewMode(view);
  }, []);

  if (!user) return <Login />;

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-500">
      <Toast />
      <DebugConsole />
      {isLocked && securityPin && (
        <LockScreen onUnlock={handleUnlock} autoLockMinutes={autoLockMinutes} />
      )}

      <MainLayout
        viewMode={viewMode}
        onNavigate={handleNavigation}
        user={user}
        currentDate={currentDate}
        records={records}
        onDateChange={setCurrentDate}
        onOpenNewPatient={() => { setEditingPatient(null); setIsModalOpen(true); }}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenDrivePicker={() => setIsDrivePickerOpen(true)}
        onLogout={handleLogout}
        onLocalImport={handleLocalImport}
        onOpenBookmarksModal={() => { setEditingBookmarkId(null); setIsBookmarksModalOpen(true); }}
        contentRef={mainScrollRef}
        showBookmarkBar={showBookmarkBar}
      >
        {viewMode === 'daily' && (
          <DailyView
            currentDate={currentDate}
            records={records}
            patientTypes={patientTypes}
            onAddPatient={() => { setEditingPatient(null); setIsModalOpen(true); }}
            onEditPatient={(patient) => { setEditingPatient(patient); setIsModalOpen(true); }}
            onDeletePatient={(id) => setPatientToDelete(id)}
            onGenerateReport={handleGeneratePDF}
            onMovePatients={handleMovePatientsToDate}
            onCopyPatients={handleCopyPatientsToDate}
          />
        )}

        {viewMode === 'search' && (
          <SearchView
            records={records}
            onEditPatient={(patient) => { setEditingPatient(patient); setIsModalOpen(true); }}
          />
        )}

        {viewMode === 'stats' && <StatsView currentDate={currentDate} />}

        {viewMode === 'tasks' && (
          <TaskDashboard onNavigateToPatient={(p) => { setEditingPatient(p); setIsModalOpen(true); }} />
        )}

        {viewMode === 'bookmarks' && (
          <BookmarksView
            onAdd={() => { setEditingBookmarkId(null); setIsBookmarksModalOpen(true); }}
            onEdit={(bookmarkId) => { setEditingBookmarkId(bookmarkId); setIsBookmarksModalOpen(true); }}
          />
        )}

        {viewMode === 'settings' && <Settings />}
      </MainLayout>

      <PatientModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingPatient(null); }}
        onSave={handleSavePatient}
        onSaveMultiple={handleSaveMultiplePatients}
        addToast={addToast}
        initialData={editingPatient}
        selectedDate={format(currentDate, 'yyyy-MM-dd')}
      />
      <ConfirmationModal
        isOpen={!!patientToDelete}
        onClose={() => setPatientToDelete(null)}
        onConfirm={confirmDeletePatient}
        title="Eliminar Paciente"
        message="¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer."
        isDangerous={true}
      />
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
      <BookmarksModal
        isOpen={isBookmarksModalOpen}
        onClose={() => { setIsBookmarksModalOpen(false); setEditingBookmarkId(null); }}
        editingBookmarkId={editingBookmarkId}
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
