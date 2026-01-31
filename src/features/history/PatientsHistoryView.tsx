import React from 'react';
import { Search as SearchIcon, Users, Sparkles, X, Loader, Calendar, Filter } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import useAppStore from '@core/stores/useAppStore';
import { usePatientHistory } from '@shared/hooks/usePatientHistory';
import HistoryTable from './components/HistoryTable';
import { formatMonthName } from '@shared/utils/dateUtils';
import { PatientRecord } from '@shared/types';
import { useSemanticPatientSearch } from './hooks/useSemanticPatientSearch';

interface PatientsHistoryViewProps {
  onEditPatient: (patient: PatientRecord, initialTab?: 'clinical' | 'files', mode?: 'daily' | 'history') => void;
}

const PatientsHistoryView: React.FC<PatientsHistoryViewProps> = ({ onEditPatient }) => {
  const { patientTypes, records, addToast } = useAppStore(useShallow(state => ({
    patientTypes: state.patientTypes,
    records: state.records,
    addToast: state.addToast,
  })));

  const {
    searchQuery, setSearchQuery,
    typeFilter, setTypeFilter,
    selectedYear, setSelectedYear,
    selectedMonth, setSelectedMonth,
    availableYears, availableMonths,
    currentPage, setCurrentPage,
    totalPages,
    paginatedVisits,
    getTypeClass
  } = usePatientHistory(records, patientTypes);

  const {
    isSemanticSearch,
    setIsSemanticSearch,
    semanticQuery,
    setSemanticQuery,
    isSearching,
    semanticResults,
    handleSemanticSearch,
    clearSemanticSearch,
  } = useSemanticPatientSearch({
    records,
    onInfo: (message) => addToast('info', message),
    onSuccess: (message) => addToast('success', message),
    onError: (message) => addToast('error', message),
  });

  const filteredVisits = semanticResults
    ? paginatedVisits.filter(v => semanticResults.includes(v.id))
    : paginatedVisits;

  return (
    <div className="max-w-7xl mx-auto h-full min-h-0 flex flex-col px-3 md:px-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg text-white">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">Explorador de Pacientes</h2>
          </div>
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 mb-6">
        <div className="flex flex-col gap-4">
          {/* Search & AI Toggle */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Búsqueda Global</label>
              <button
                onClick={() => isSemanticSearch ? clearSemanticSearch() : setIsSemanticSearch(true)}
                className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full transition-all shadow-sm ${isSemanticSearch
                    ? 'bg-blue-600 text-white shadow-blue-500/20'
                    : 'bg-white dark:bg-gray-800 text-gray-400 hover:text-blue-500'
                  }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isSemanticSearch ? 'USANDO IA' : 'ACTIVAR IA'}
              </button>
            </div>

            <div className="relative group">
              {isSemanticSearch ? (
                <>
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5 animate-pulse" />
                  <input
                    type="text"
                    placeholder="Ej: Pacientes diabéticos con atención de enfermería..."
                    value={semanticQuery}
                    onChange={e => setSemanticQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSemanticSearch()}
                    className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-900/40 focus:border-blue-500 outline-none text-sm transition-all shadow-sm"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {semanticQuery && (
                      <button onClick={() => setSemanticQuery('')} className="p-2 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={handleSemanticSearch}
                      disabled={isSearching}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
                    >
                      {isSearching ? <Loader className="w-4 h-4 animate-spin" /> : "BUSCAR"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Filtrar por nombre, rut o diagnóstico..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 focus:border-blue-500 outline-none text-sm transition-all shadow-sm"
                  />
                </>
              )}
            </div>
          </div>

          {/* Year/Month Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <Calendar className="w-4 h-4 text-blue-600 ml-2" />
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="bg-transparent text-sm font-bold text-gray-700 dark:text-gray-300 outline-none pr-2 cursor-pointer"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 flex-1 overflow-x-auto no-scrollbar">
              {availableMonths.map(month => (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${selectedMonth === month
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-blue-300 hover:text-blue-600'
                    }`}
                >
                  {formatMonthName(month).toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Side Filters (Type) */}
        <div className="w-full lg:w-56">
          <div className="bg-transparent p-0 rounded-xl border border-transparent shadow-none h-full flex flex-col justify-start">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tipo de Atención</label>
            </div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 focus:border-blue-500 outline-none text-[11px] font-medium"
            >
              <option value="all">TODAS</option>
              {patientTypes.map(type => (
                <option key={type.id} value={type.id}>{type.label.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-6">
        <HistoryTable
          visits={filteredVisits}
          getTypeClass={getTypeClass}
          onViewDetails={(record, tab) => onEditPatient(record, tab, 'history')}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default PatientsHistoryView;
