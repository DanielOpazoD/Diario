import React, { useState, useMemo, useLayoutEffect, useCallback, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { ViewMode, PatientRecord, DriveFolderPreference } from './types';
import { restoreStoredToken } from './services/googleService';
import PatientModal from './components/PatientModal';
import Settings from './components/Settings';
import Login from './components/Login';
import Toast from './components/Toast';
import TaskDashboard from './components/TaskDashboard';
import ConfirmationModal from './components/ConfirmationModal';
import BackupModal from './components/BackupModal';
import DrivePickerModal from './components/DrivePickerModal';
import { LogProvider, useLogger } from './context/LogContext';
import DebugConsole from './components/DebugConsole';
import { validateEnvironment } from './services/geminiService';
import useAppStore from './stores/useAppStore';
import MainLayout from './layouts/MainLayout';
import DailyView from './features/daily/DailyView';
import SearchView from './features/search/SearchView';
import StatsView from './features/stats/StatsView';
import LockScreen from './components/LockScreen';
import useDriveFolderPreference from './hooks/useDriveFolderPreference';
import useAutoLock from './hooks/useAutoLock';
import useActivityTracker from './hooks/useActivityTracker';
import { createAppActions } from './services/appActions';

const AppContent: React.FC = () => {
  const { addLog } = useLogger();

  const user = useAppStore(state => state.user);
  const records = useAppStore(state => state.records);
  const generalTasks = useAppStore(state => state.generalTasks);
  const patientTypes = useAppStore(state => state.patientTypes);
  const securityPin = useAppStore(state => state.securityPin);
  const autoLockMinutes = useAppStore(state => state.autoLockMinutes);
  const { logout, addToast, setRecords, setGeneralTasks, addPatient, updatePatient, deletePatient } = useAppStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);

  const { driveFolderPreference, setDriveFolderPreference } = useDriveFolderPreference();

  const mainScrollRef = React.useRef<HTMLDivElement>(null);

  const { isLocked, unlock, recordActivity } = useAutoLock({
    securityPin,
    autoLockMinutes,
  });

  useActivityTracker(isLocked, recordActivity);

  useLayoutEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [viewMode]);

  useEffect(() => {
    const envStatus = validateEnvironment();
    addLog('info', 'App', 'Iniciando Aplicación', envStatus);
  }, [addLog]);

  useEffect(() => {
    restoreStoredToken();
  }, []);

  const dailyRecords = useMemo(
    () => records.filter(r => isSameDay(new Date(r.date + 'T00:00:00'), currentDate)),
    [records, currentDate]
  );


  const appActions = useMemo(() => createAppActions({
    addPatient,
    updatePatient,
    deletePatient,
    addToast,
    setRecords,
    setGeneralTasks,
    generalTasks,
    patientTypes,
    records,
    user,
    logout,
  }), [addPatient, updatePatient, deletePatient, addToast, setRecords, setGeneralTasks, generalTasks, patientTypes, records, user, logout]);

  const handleLogout = () => {
    appActions.logoutUser();
  };

  const handleSavePatient = (patientData: any) => {
    appActions.savePatient(patientData, editingPatient);
    setEditingPatient(null);
  };

  const handleSaveMultiplePatients = (patientsData: any[]) => {
    appActions.saveMultiplePatients(patientsData);
  };

  const confirmDeletePatient = () => {
    if (appActions.deletePatientById(patientToDelete)) {
      setPatientToDelete(null);
    }
  };

  const handleLocalImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await appActions.importLocalBackup(file, setIsUploading);
    e.target.value = '';
  };

  const handleGeneratePDF = () => {
    appActions.generatePdfReport(dailyRecords, currentDate);
  };

  const handleBackupConfirm = async (fileName: string, folder: DriveFolderPreference) => {
    setDriveFolderPreference(folder);
    await appActions.backupToDrive(fileName, folder, setIsUploading, () => setIsBackupModalOpen(false));
  };

  const handleDriveFileSelect = async (fileId: string) => {
    await appActions.restoreBackupFromDrive(fileId, setIsUploading, () => setIsDrivePickerOpen(false));
  };

  const handleUnlock = (pinAttempt: string) => {
    if (pinAttempt === securityPin) {
      unlock();
      addToast('success', 'Sesión desbloqueada');
      return true;
    }

    addToast('error', 'PIN incorrecto');
    return false;
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
        contentRef={mainScrollRef}
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
    </div>
  );
};

const App: React.FC = () => (
  <LogProvider>
    <AppContent />
  </LogProvider>
);

export default App;
