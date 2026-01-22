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
        <div className="flex items-center justify-between px-5 md:px-7 py-3 border-b border-gray-100/30 dark:border-gray-800/30 bg-white/40 dark:bg-gray-900/40 shrink-0 select-none backdrop-blur-md">
            {/* Left Section: Nav / Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div
                    onClick={onEditToggle}
                    className={`p-2.5 rounded-2xl transition-all duration-300 cursor-pointer shadow-premium-sm ${isEditing
                        ? 'bg-brand-500 text-white shadow-brand-500/40 scale-110'
                        : 'glass-card text-gray-400 dark:text-gray-500 hover:text-brand-500 hover:scale-105 active:scale-95'
                        }`}
                >
                    <UserCog className="w-5.5 h-5.5" />
                </div>

                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base md:text-lg font-black text-gray-900 dark:text-white truncate uppercase tracking-tighter">
                            {name || (isNewPatient ? 'Nuevo Ingreso' : 'Editar Ficha')}
                        </h2>
                        {!isNewPatient && (
                            <span className="shrink-0 text-[10px] font-black bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2.5 py-1 rounded-pill border border-brand-500/20 uppercase tracking-widest shadow-inner">
                                {formatToDisplayDate(date)}
                            </span>
                        )}
                    </div>

                    {(name || rut) && (
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] whitespace-nowrap">
                            {rut && <span className="text-brand-500/60">{rut}</span>}
                            {age && (
                                <>
                                    <span className="h-1 w-1 rounded-full bg-gray-200 dark:bg-gray-700" />
                                    <span>{age}</span>
                                </>
                            )}
                            {gender && (
                                <>
                                    <span className="h-1 w-1 rounded-full bg-gray-200 dark:bg-gray-700" />
                                    <span>{gender}</span>
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

                <div className="flex items-center gap-1">
                    {/* Mobile Only Scan */}
                    {isNewPatient && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="md:hidden p-2 text-gray-400 hover:text-brand-500 transition-all active:scale-90"
                        >
                            <Camera className="w-5 h-5" />
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 group rounded-2xl transition-all duration-300 hover:rotate-90"
                    >
                        <X className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatientModalHeader;
