import React, { useMemo, useState } from 'react';
import { ChevronDown, Search as SearchIcon, Users } from 'lucide-react';
import { PatientRecord } from '../../types';
import useAppStore from '../../stores/useAppStore';

interface GroupedHistoryRecord {
  rut: string;
  name: string;
  records: PatientRecord[];
}

const PatientsHistoryView: React.FC = () => {
  const records = useAppStore(state => state.records);
  const patientTypes = useAppStore(state => state.patientTypes);

  const [expandedRut, setExpandedRut] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const groupedRecords = useMemo(() => {
    const map = new Map<string, PatientRecord[]>();

    records.forEach(record => {
      const existing = map.get(record.rut) || [];
      existing.push(record);
      map.set(record.rut, existing);
    });

    const groups: GroupedHistoryRecord[] = Array.from(map.entries()).map(([rut, patientRecords]) => {
      const sortedRecords = [...patientRecords].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return {
        rut,
        name: sortedRecords[0]?.name || 'Paciente sin nombre',
        records: sortedRecords,
      };
    });

    return groups;
  }, [records]);

  const filteredGroups = useMemo(() => {
    const lowerQuery = searchQuery.trim().toLowerCase();

    return groupedRecords
      .map(group => {
        const recordsByType = typeFilter === 'all'
          ? group.records
          : group.records.filter(record => record.type === typeFilter);

        return {
          ...group,
          records: recordsByType,
        };
      })
      .filter(group => group.records.length > 0)
      .filter(group => {
        if (!lowerQuery) return true;
        return group.name.toLowerCase().includes(lowerQuery) || group.rut.toLowerCase().includes(lowerQuery);
      })
      .sort((a, b) => new Date(b.records[0].date).getTime() - new Date(a.records[0].date).getTime());
  }, [groupedRecords, searchQuery, typeFilter]);

  const getTypeClass = (type: string) => {
    const config = patientTypes.find(t => t.label === type);
    return config?.colorClass || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-1 sm:px-3 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-xs uppercase font-bold text-gray-400 tracking-wider">Vista</p>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">Historial de Pacientes</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Agrupa las atenciones por RUT único para visualizar su historial cronológico.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="md:col-span-2 relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o RUT..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Tipo de atención</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full px-3 py-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Todos los tipos</option>
            {patientTypes.map(type => (
              <option key={type.id} value={type.label}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredGroups.map(group => {
          const typeCounts = group.records.reduce<Record<string, number>>((acc, record) => {
            acc[record.type] = (acc[record.type] || 0) + 1;
            return acc;
          }, {});

          const isExpanded = expandedRut === group.rut;

          return (
            <div
              key={group.rut}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => setExpandedRut(isExpanded ? null : group.rut)}
                className="w-full text-left p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">{group.rut}</span>
                    <span className="text-[11px] font-semibold uppercase text-gray-400">{group.records.length} visitas</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{group.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(typeCounts).map(([type, count]) => (
                      <span
                        key={type}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getTypeClass(type)}`}
                      >
                        {type} · {count}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Última atención</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{group.records[0]?.date}</p>
                  </div>
                  <div className={`p-2 rounded-full border border-gray-200 dark:border-gray-700 transition-transform duration-200 ${isExpanded ? 'rotate-180 bg-gray-50 dark:bg-gray-700/60' : 'bg-white dark:bg-gray-800'}`}>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40">
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {group.records.map(record => (
                      <div key={record.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2 py-1 rounded-full border ${getTypeClass(record.type)}`}>
                            {record.type}
                          </span>
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{record.date}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{record.diagnosis}</p>
                          {record.clinicalNote && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{record.clinicalNote}</p>
                          )}
                        </div>
                        {(record.entryTime || record.exitTime) && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col items-start sm:items-end min-w-[120px]">
                            {record.entryTime && <span>Ingreso: {record.entryTime}</span>}
                            {record.exitTime && <span>Alta: {record.exitTime}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredGroups.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">No se encontraron pacientes.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ajusta los filtros o registra nuevas atenciones.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientsHistoryView;
