import React, { Suspense, useState } from 'react';
import { Sparkles } from 'lucide-react';

const AIChatDrawer = React.lazy(() => import('./AIChatDrawer'));

const AIChatEntry: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [openOnLoad, setOpenOnLoad] = useState(false);

  const handleOpen = () => {
    setIsLoaded(true);
    setOpenOnLoad(true);
  };

  if (!isLoaded) {
    return (
      <div className="fixed bottom-4 right-4 z-[120] flex flex-col items-end gap-2">
        <button
          onClick={handleOpen}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-lg hover:shadow-xl transition"
          aria-label="Abrir asistente IA"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <Suspense fallback={null}>
      <AIChatDrawer initialOpen={openOnLoad} />
    </Suspense>
  );
};

export default AIChatEntry;
