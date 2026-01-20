import React from 'react';
import { Eye, ClipboardList, Paperclip, ChevronLeft, ChevronRight } from 'lucide-react';
import { PatientRecord } from '@shared/types';
import { calculateAge, formatToDisplayDate } from '@shared/utils/dateUtils';

interface HistoryTableProps {
    visits: PatientRecord[];
    getTypeClass: (type: string, typeId?: string) => string;
    onViewDetails: (record: PatientRecord) => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({
    visits,
    getTypeClass,
    onViewDetails,
    currentPage,
    totalPages,
    onPageChange,
}) => {
    if (visits.length === 0) {
        return (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-base font-semibold text-gray-700 dark:text-gray-200">No hay atenciones para este período.</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ajusta los filtros o selecciona otro mes.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre y Apellidos</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">RUT</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Edad</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Diagnóstico</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {visits.map((record) => (
                                <tr
                                    key={record.id}
                                    className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors group"
                                >
                                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                        {formatToDisplayDate(record.date)}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTypeClass(record.type, record.typeId)}`}>
                                            {record.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 font-semibold truncate max-w-[200px]">
                                        {record.name}
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 font-mono">
                                        {record.rut}
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300">
                                        {calculateAge(record.birthDate)}
                                    </td>
                                    <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 truncate max-w-[300px]">
                                        {record.diagnosis}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                onClick={() => onViewDetails(record)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-all"
                                                title="Ver atención"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            {record.pendingTasks.length > 0 && (
                                                <div className="relative group/tooltip" title={`${record.pendingTasks.length} tareas`}>
                                                    <ClipboardList className="w-4 h-4 text-amber-500 opacity-60 group-hover:opacity-100" />
                                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white">
                                                        {record.pendingTasks.length}
                                                    </span>
                                                </div>
                                            )}

                                            {record.attachedFiles.length > 0 && (
                                                <div title={`${record.attachedFiles.length} archivos`}>
                                                    <Paperclip className="w-4 h-4 text-blue-500 opacity-60 group-hover:opacity-100" />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Página <span className="font-semibold text-gray-700 dark:text-gray-300">{currentPage}</span> de <span className="font-semibold text-gray-700 dark:text-gray-300">{totalPages}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => onPageChange(currentPage - 1)}
                            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 transition-all hover:bg-gray-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => onPageChange(currentPage + 1)}
                            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 transition-all hover:bg-gray-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryTable;
