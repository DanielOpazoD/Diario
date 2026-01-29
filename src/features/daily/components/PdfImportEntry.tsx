import React, { Suspense, lazy, useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@core/ui';

const PdfImportControl = lazy(() => import('./PdfImportControl'));

interface PdfImportEntryProps {
  currentDate: Date;
}

const PdfImportEntry: React.FC<PdfImportEntryProps> = ({ currentDate }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [openOnLoad, setOpenOnLoad] = useState(false);

  const handleOpen = () => {
    setIsLoaded(true);
    setOpenOnLoad(true);
  };

  if (!isLoaded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        icon={<FileText className="w-4 h-4" />}
        className="w-8 h-8 rounded-lg !p-0 text-gray-500 hover:text-brand-500 hover:bg-brand-500/10"
      />
    );
  }

  return (
    <Suspense fallback={
      <Button
        variant="ghost"
        size="sm"
        isLoading={true}
        icon={<FileText className="w-4 h-4" />}
        className="w-8 h-8 rounded-lg !p-0 text-gray-500 hover:text-brand-500 hover:bg-brand-500/10"
      />
    }>
      <PdfImportControl currentDate={currentDate} autoOpen={openOnLoad} />
    </Suspense>
  );
};

export default PdfImportEntry;
