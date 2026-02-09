import React, { useEffect, useState } from 'react';
import { addUpdateListener, consumeUpdateNotice, removeUpdateListener } from '@shared/utils/updateNotice';

const UpdateBanner: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (consumeUpdateNotice()) {
      setMessage('Actualización detectada. Recargando…');
    }

    const handler = (event: CustomEvent<{ message?: string }>) => {
      setMessage(event.detail?.message || 'Actualización detectada. Recargando…');
    };

    addUpdateListener(handler);
    return () => removeUpdateListener(handler);
  }, []);

  if (!message) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[120] px-3 py-2 bg-brand-600 text-white text-xs font-bold uppercase tracking-widest text-center shadow-lg">
      {message}
    </div>
  );
};

export default UpdateBanner;
