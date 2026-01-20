import React, { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { PatientRecord, PatientTypeConfig } from '@shared/types';
import { Button } from '@core/ui';

interface PatientTypesSettingsProps {
    patientTypes: PatientTypeConfig[];
    records: PatientRecord[];
    onAddPatientType: (type: PatientTypeConfig) => void;
    onRemovePatientType: (id: string) => void;
    onSetPatientTypes: (types: PatientTypeConfig[]) => void;
    onSetRecords: (records: PatientRecord[]) => void;
    addToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const AVAILABLE_COLORS = [
    'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
    'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
    'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800',
];

export const validateTypeLabel = (
    label: string,
    patientTypes: PatientTypeConfig[],
    excludeId?: string
) => {
    const trimmed = label.trim();
    if (!trimmed) return 'El nombre es requerido';

    const duplicate = patientTypes.some(
        (t) => t.id !== excludeId && t.label.toLowerCase() === trimmed.toLowerCase()
    );

    if (duplicate) return 'Ya existe un tipo con este nombre';

    return null;
};

const PatientTypesSettings: React.FC<PatientTypesSettingsProps> = ({
    patientTypes,
    records,
    onAddPatientType,
    onRemovePatientType,
    onSetPatientTypes,
    onSetRecords,
    addToast,
}) => {
    const [newTypeLabel, setNewTypeLabel] = useState('');
    const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
    const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
    const [editedLabel, setEditedLabel] = useState('');

    const handleAddType = () => {
        const error = validateTypeLabel(newTypeLabel, patientTypes);
        if (error) return addToast('error', error);

        const newType: PatientTypeConfig = {
            id: crypto.randomUUID(),
            label: newTypeLabel.trim(),
            colorClass: selectedColor,
        };
        onAddPatientType(newType);
        setNewTypeLabel('');
        addToast('success', 'Tipo de ingreso agregado');
    };

    const handleEditType = (type: PatientTypeConfig) => {
        setEditingTypeId(type.id);
        setEditedLabel(type.label);
    };

    const handleSaveType = (type: PatientTypeConfig) => {
        const trimmedLabel = editedLabel.trim();
        const error = validateTypeLabel(trimmedLabel, patientTypes, type.id);
        if (error) return addToast('error', error);

        const updatedTypes = patientTypes.map((t) =>
            t.id === type.id ? { ...t, label: trimmedLabel } : t
        );

        const updatedRecords = records.map((record) => {
            if (record.typeId === type.id || record.type.toLowerCase() === type.label.toLowerCase()) {
                return { ...record, type: trimmedLabel, typeId: type.id };
            }
            return record;
        });

        onSetPatientTypes(updatedTypes);
        onSetRecords(updatedRecords);
        setEditingTypeId(null);
        setEditedLabel('');
        addToast('success', 'Nombre de tipo actualizado');
    };

    const handleCancelEdit = () => {
        setEditingTypeId(null);
        setEditedLabel('');
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Tipos de Ingreso</h3>
            <p className="text-xs text-gray-500 mb-4">Define las categorías para clasificar a tus pacientes.</p>

            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {patientTypes.map((type) => (
                    <div
                        key={type.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700"
                    >
                        <div className="flex items-center gap-3 flex-1">
                            <span
                                className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide border ${type.colorClass}`}
                            >
                                {editingTypeId === type.id ? editedLabel || type.label : type.label}
                            </span>
                            {type.id === 'turno' && <span className="text-[10px] text-gray-400">(Hora activa)</span>}
                        </div>
                        <div className="flex items-center gap-1">
                            {editingTypeId === type.id ? (
                                <>
                                    <input
                                        value={editedLabel}
                                        onChange={(e) => setEditedLabel(e.target.value)}
                                        className="px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <button
                                        onClick={() => handleSaveType(type)}
                                        className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                        aria-label="Guardar nombre"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/40 rounded-lg transition-colors"
                                        aria-label="Cancelar edición"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleEditType(type)}
                                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        aria-label="Editar nombre"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    {!type.isDefault && (
                                        <button
                                            onClick={() => onRemovePatientType(type.id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            aria-label="Eliminar tipo"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nuevo Tipo</label>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <input
                        type="text"
                        value={newTypeLabel}
                        onChange={(e) => setNewTypeLabel(e.target.value)}
                        placeholder="Nombre (ej. Domicilio)"
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                        onClick={handleAddType}
                        disabled={!newTypeLabel}
                        size="sm"
                        icon={<Plus className="w-4 h-4" />}
                    >
                        Agregar
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {AVAILABLE_COLORS.map((color, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedColor(color)}
                            className={`w-8 h-8 md:w-6 md:h-6 rounded-full border-2 transition-all ${color.split(' ')[0]
                                } ${selectedColor === color
                                    ? 'border-gray-500 scale-110 ring-2 ring-offset-1 ring-gray-400'
                                    : 'border-transparent'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PatientTypesSettings;
