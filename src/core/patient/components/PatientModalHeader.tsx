import React, { RefObject } from 'react';
import { X, Camera, Users } from 'lucide-react';
import { Button } from '@core/ui';

interface PatientModalHeaderProps {
    title: string;
    subtitle: string;
    isNewPatient: boolean;
    isScanning: boolean;
    isScanningMulti: boolean;
    fileInputRef: RefObject<HTMLInputElement>;
    multiFileInputRef: RefObject<HTMLInputElement>;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onMultiFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClose: () => void;
}

const PatientModalHeader: React.FC<PatientModalHeaderProps> = ({
    title,
    subtitle,
    isNewPatient,
    isScanning,
    isScanningMulti,
    fileInputRef,
    multiFileInputRef,
    onFileUpload,
    onMultiFileUpload,
    onClose,
}) => {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 md:px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
            <div className="flex flex-col md:flex-row md:items-center gap-1">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    {title}
                </h2>
                <span className="self-start md:self-auto text-xs font-normal text-gray-500 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded-md shadow-sm">
                    {subtitle}
                </span>
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileUpload} />
                <input type="file" ref={multiFileInputRef} className="hidden" accept="image/*" onChange={onMultiFileUpload} />

                {isNewPatient && (
                    <>
                        <span className="text-xs text-gray-500 sm:hidden">Acciones rápidas</span>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => multiFileInputRef.current?.click()}
                                isLoading={isScanningMulti}
                                icon={<Users className="w-4 h-4" />}
                                className="flex items-center justify-center sm:flex w-full sm:w-auto"
                            >
                                <span className="hidden sm:inline">Lista</span>
                                <span className="sm:hidden">Lista de pacientes</span>
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                isLoading={isScanning}
                                icon={<Camera className="w-4 h-4" />}
                                className="w-full sm:w-auto"
                            >
                                <span className="hidden sm:inline">Ficha</span>
                                <span className="sm:hidden">Ficha individual</span>
                            </Button>
                        </div>
                    </>
                )}
                <div className="flex justify-end">
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatientModalHeader;
