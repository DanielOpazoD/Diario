import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@core/ui';
import { PatientRecord } from '@shared/types';
import { usePatientSearch } from '@shared/hooks/usePatientSearch';

interface SearchViewProps {
  records: PatientRecord[];
  onEditPatient: (patient: PatientRecord) => void;
}

const SearchView: React.FC<SearchViewProps> = ({ records, onEditPatient }) => {
  const { searchQuery, setSearchQuery, filteredRecords } = usePatientSearch(records);

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nombre, RUT o diagnóstico..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-lg"
          autoFocus
        />
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
                <Button size="sm" variant="secondary" onClick={() => onEditPatient(patient)}>Ver Ficha</Button>
              </div>
            </div>
          ))}
          {filteredRecords.length === 0 && <p className="text-center text-gray-500 py-10">No se encontraron coincidencias.</p>}
        </div>
      )}
    </div>
  );
};

export default SearchView;
