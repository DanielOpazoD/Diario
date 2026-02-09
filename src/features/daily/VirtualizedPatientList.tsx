import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PatientRecord } from '@shared/types';
import ExecutivePatientRow from '@core/patient/components/ExecutivePatientRow';

interface VirtualizedPatientListProps {
    patients: PatientRecord[];
    onEdit: (patient: PatientRecord) => void;
    onDelete: (patientId: string) => void;
    selectionMode: boolean;
    selectedPatients: Set<string>;
    onToggleSelect: (patientId: string) => void;
    addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
    selectedDate: string;
}

const ESTIMATED_ROW_HEIGHT = 72; // Average height of a patient row in pixels

const VirtualizedPatientList: React.FC<VirtualizedPatientListProps> = ({
    patients,
    onEdit,
    onDelete,
    selectionMode,
    selectedPatients,
    onToggleSelect,
    addToast,
    selectedDate,
}) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: patients.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ESTIMATED_ROW_HEIGHT,
        overscan: 5, // Render 5 extra items above/below visible area
    });

    const virtualItems = virtualizer.getVirtualItems();

    return (
        <div
            ref={parentRef}
            className="flex-1 overflow-auto bg-transparent divide-y divide-gray-100/30 dark:divide-gray-800/30 no-scrollbar"
            style={{ contain: 'strict' }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualItems.map((virtualRow) => {
                    const patient = patients[virtualRow.index];
                    return (
                        <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            ref={virtualizer.measureElement}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                            className="border-b border-gray-100 dark:border-gray-800"
                        >
                            <ExecutivePatientRow
                                patient={patient}
                                onEdit={(p) => onEdit(p)}
                                onDelete={() => onDelete(patient.id)}
                                selectionMode={selectionMode}
                                selected={selectedPatients.has(patient.id)}
                                onToggleSelect={() => onToggleSelect(patient.id)}
                                addToast={addToast}
                                selectedDate={selectedDate}
                            />
                        </div>
                    );
                })}
            </div>
            {/* Bottom spacer for FAB/Scroll */}
            <div className="h-20"></div>
        </div>
    );
};

export default VirtualizedPatientList;
