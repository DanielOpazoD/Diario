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
    <div className="max-w-7xl mx-auto pb-16 px-3 md:px-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">Vista</p>
            <h2 className="text-xl font-black text-gray-900 dark:text-white leading-snug">Historial de Pacientes</h2>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="px-2 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">{filteredGroups.length} pacientes</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-2 sm:gap-3 mb-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Nombre o RUT</label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Tipo de atención</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          >
            <option value="all">Todos los tipos</option>
            {patientTypes.map(type => (
              <option key={type.id} value={type.label}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        {filteredGroups.map(group => {
          const typeCounts = group.records.reduce<Record<string, number>>((acc, record) => {
            acc[record.type] = (acc[record.type] || 0) + 1;
            return acc;
          }, {});

          const isExpanded = expandedRut === group.rut;

          return (
            <div
              key={group.rut}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => setExpandedRut(isExpanded ? null : group.rut)}
                className="w-full text-left px-3.5 py-3 flex flex-col md:flex-row md:items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
              >
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 uppercase font-semibold">
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">{group.rut}</span>
                    <span>{group.records.length} visitas</span>
                    <span className="hidden sm:inline">Última: {group.records[0]?.date}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{group.name}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                      {Object.entries(typeCounts).map(([type, count]) => (
                        <span
                          key={type}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getTypeClass(type)}`}
                        >
                          {type} · {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right md:pl-2">
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 md:hidden">Última atención</div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{group.records[0]?.date}</div>
                  <div className={`p-1.5 rounded-full border border-gray-200 dark:border-gray-700 transition-transform duration-200 ${isExpanded ? 'rotate-180 bg-gray-50 dark:bg-gray-700/60' : 'bg-white dark:bg-gray-800'}`}>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 w-full">
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {group.records.map(record => (
                      <div key={record.id} className="px-3.5 py-3 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-2 md:gap-3 items-start">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 font-semibold">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getTypeClass(record.type)}`}>
                            {record.type}
                          </span>
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{record.date}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug">{record.diagnosis}</p>
                          {record.clinicalNote && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{record.clinicalNote}</p>
                          )}
                        </div>
                        {(record.entryTime || record.exitTime) && (
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 flex flex-col items-start md:items-end min-w-[110px] whitespace-nowrap">
                            {record.entryTime && <span>Ing.: {record.entryTime}</span>}
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
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-base font-semibold text-gray-700 dark:text-gray-200">No se encontraron pacientes.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ajusta los filtros o registra nuevas atenciones.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientsHistoryView;
