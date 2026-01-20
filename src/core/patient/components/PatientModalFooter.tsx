import React from 'react';
import { Button } from '@core/ui';

interface PatientModalFooterProps {
    onCancel: () => void;
    onSave: () => void;
    saveLabel?: string;
    cancelLabel?: string;
}

const PatientModalFooter: React.FC<PatientModalFooterProps> = ({
    onCancel,
    onSave,
    saveLabel = 'Guardar Ficha',
    cancelLabel = 'Cancelar',
}) => {
    return (
        <div className="flex justify-end gap-2 px-4 md:px-6 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0 z-20">
            <Button variant="ghost" onClick={onCancel} className="flex-1 md:flex-none text-[11px] h-8 px-3">
                {cancelLabel}
            </Button>
            <Button onClick={onSave} className="flex-1 md:flex-none px-5 shadow-lg shadow-blue-500/20 text-[11px] h-8 font-black uppercase tracking-tight">
                {saveLabel}
            </Button>
        </div>
    );
};

export default PatientModalFooter;
