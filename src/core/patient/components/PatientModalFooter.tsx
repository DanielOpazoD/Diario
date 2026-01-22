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
        <div className="flex justify-end gap-3 px-5 md:px-7 py-4 border-t border-gray-100/30 dark:border-gray-800/30 bg-white/20 dark:bg-gray-900/20 shrink-0 z-20 backdrop-blur-md">
            <Button variant="ghost" onClick={onCancel} className="flex-1 md:flex-none h-10 px-6 font-black tracking-widest text-[11px]">
                {cancelLabel}
            </Button>
            <Button onClick={onSave} className="flex-1 md:flex-none px-8 shadow-premium-lg shadow-brand-500/30 h-10 bg-brand-500 font-black uppercase tracking-widest text-[11px] transition-all hover:shadow-premium-xl active:scale-95">
                {saveLabel}
            </Button>
        </div>
    );
};

export default PatientModalFooter;
