import React, { useEffect } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@core/ui';
import { usePdfPatientImport } from '@core/patient';

interface PdfImportControlProps {
  currentDate: Date;
  autoOpen?: boolean;
}

const PdfImportControl: React.FC<PdfImportControlProps> = ({ currentDate, autoOpen = false }) => {
  const {
    fileInputRef,
    isImporting,
    handlePdfUpload,
    triggerPicker,
  } = usePdfPatientImport(currentDate);

  useEffect(() => {
    if (autoOpen) {
      triggerPicker();
    }
  }, [autoOpen, triggerPicker]);

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePdfUpload}
        accept="application/pdf"
        multiple
        className="hidden"
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={triggerPicker}
        isLoading={isImporting}
        icon={<FileText className="w-4 h-4" />}
        className="w-8 h-8 rounded-lg !p-0 text-gray-500 hover:text-brand-500 hover:bg-brand-500/10"
      />
    </>
  );
};

export default PdfImportControl;
