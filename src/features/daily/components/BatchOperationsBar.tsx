import React from 'react';
import { Button } from '@core/ui';

interface BatchOperationsBarProps {
    selectedCount: number;
    visibleRecordsCount: number;
    targetDate: string;
    setTargetDate: (date: string) => void;
    onSelectAll: () => void;
    onClearSelection: () => void;
    onBatchMove: () => void;
    onBatchCopy: () => void;
}

const BatchOperationsBar: React.FC<BatchOperationsBarProps> = ({
    selectedCount,
    visibleRecordsCount,
    targetDate,
    setTargetDate,
    onSelectAll,
    onClearSelection,
    onBatchMove,
    onBatchCopy,
}) => {
    return (
        <div className="bg-blue-50/90 dark:bg-blue-900/20 px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 dark:border-blue-800 animate-slide-down text-sm">
            <span className="font-medium text-blue-800 dark:text-blue-200">{selectedCount} seleccionados</span>
            <div className="flex flex-wrap items-center gap-2">
                {selectedCount < visibleRecordsCount && (
                    <button className="text-blue-600 hover:underline px-2" onClick={onSelectAll}>
                        Seleccionar todos
                    </button>
                )}
                {selectedCount > 0 && (
                    <button className="text-blue-600 hover:underline px-2" onClick={onClearSelection}>Limpiar</button>
                )}
                <div className="h-4 w-px bg-blue-200"></div>
                <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="px-2 py-1 rounded border border-blue-200 text-xs text-gray-900"
                />
                <Button onClick={onBatchMove} size="sm" variant="secondary" className="h-7 text-xs" disabled={selectedCount === 0}>Mover</Button>
                <Button onClick={onBatchCopy} size="sm" variant="primary" className="h-7 text-xs" disabled={selectedCount === 0}>Copiar</Button>
            </div>
        </div>
    );
};

export default BatchOperationsBar;
