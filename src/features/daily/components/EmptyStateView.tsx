import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@core/ui';
import PdfImportEntry from '@features/daily/components/PdfImportEntry';

interface EmptyStateViewProps {
    currentDate: Date;
    onAddBlankPatient: () => void;
}

const EmptyStateView: React.FC<EmptyStateViewProps> = ({
    currentDate,
    onAddBlankPatient,
}) => {
    return (
        <div className="flex-1 glass-card rounded-panel border-none shadow-premium flex flex-col items-center justify-center py-24 text-gray-400 text-center">
            <CalendarIcon className="w-12 h-12 mb-4 opacity-20 text-brand-500" />
            <p className="text-sm font-black uppercase tracking-widest opacity-60">No hay pacientes para mostrar</p>
            <p className="text-[10px] mt-1 font-bold opacity-40 uppercase">Selecciona otra fecha o agrega uno nuevo</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" className="rounded-pill px-4" onClick={onAddBlankPatient}>Agregar paciente</Button>
                <PdfImportEntry currentDate={currentDate} />
            </div>
        </div>
    );
};

export default EmptyStateView;
