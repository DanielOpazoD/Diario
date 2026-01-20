import React, { RefObject } from 'react';
import { X, Camera, Users, UserCog } from 'lucide-react';
import { Button } from '@core/ui';
import { formatToDisplayDate } from '@shared/utils/dateUtils';

interface PatientModalHeaderProps {
    isNewPatient: boolean;
    name: string;
    rut?: string;
    age?: string;
    gender?: string;
    date: string;

    isEditing: boolean;
    onEditToggle: () => void;

    isScanning: boolean;
    isScanningMulti: boolean;
    fileInputRef: RefObject<HTMLInputElement>;
    multiFileInputRef: RefObject<HTMLInputElement>;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onMultiFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClose: () => void;
}

const PatientModalHeader: React.FC<PatientModalHeaderProps> = ({
    isNewPatient,
    name,
    rut,
    age,
    gender,
    date,
    isEditing,
    onEditToggle,
    isScanning,
    isScanningMulti,
    fileInputRef,
    multiFileInputRef,
    onFileUpload,
    onMultiFileUpload,
    onClose,
}) => {
    return (
        <div className="flex items-center justify-between px-4 md:px-6 py-2 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 select-none">
            {/* Left Section: Nav / Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                    onClick={onEditToggle}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${isEditing
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/20'
                        : 'bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                >
                    <UserCog className="w-5 h-5" />
                </div>

                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                        <h2 className="text-sm md:text-base font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">
                            {name || (isNewPatient ? 'NUEVO INGRESO' : 'EDITAR PACIENTE')}
                        </h2>
                        {!isNewPatient && (
                            <span className="shrink-0 text-[9px] font-black bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800 uppercase">
                                {formatToDisplayDate(date)}
                            </span>
                        )}
                    </div>

                    {(name || rut) && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">
                            {rut && <span>{rut}</span>}
                            {age && (
                                <>
                                    <span className="h-1 w-1 rounded-full bg-gray-200 dark:bg-gray-700" />
                                    <span>{age}</span>
                                </>
                            )}
                            {gender && (
                                <>
                                    <span className="h-1 w-1 rounded-full bg-gray-200 dark:bg-gray-700" />
                                    <span>{gender.charAt(0)}</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Section: Actions */}
            <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileUpload} />
                <input type="file" ref={multiFileInputRef} className="hidden" accept="image/*" onChange={onMultiFileUpload} />

                {isNewPatient && (
                    <div className="hidden md:flex items-center gap-1.5">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => multiFileInputRef.current?.click()}
                            isLoading={isScanningMulti}
                            icon={<Users className="w-3.5 h-3.5" />}
                            className="text-[9px] font-black uppercase h-7 px-2 border border-gray-100 dark:border-gray-700"
                        >
                            Lista
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            isLoading={isScanning}
                            icon={<Camera className="w-3.5 h-3.5" />}
                            className="text-[9px] font-black uppercase h-7 px-2 border border-gray-100 dark:border-gray-700"
                        >
                            Ficha
                        </Button>
                    </div>
                )}

                <div className="flex items-center gap-0.5">
                    {/* Mobile Only Scan */}
                    {isNewPatient && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="md:hidden p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 group rounded-xl transition-all"
                    >
                        <X className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatientModalHeader;
