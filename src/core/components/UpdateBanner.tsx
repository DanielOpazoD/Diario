import React, { useEffect, useState } from 'react';

type UpdateEventDetail = {
  message?: string;
};

const UpdateBanner: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const persistedNotice = sessionStorage.getItem('medidiario_update_notice');
    if (persistedNotice) {
      setMessage('Actualización detectada. Recargando…');
      sessionStorage.removeItem('medidiario_update_notice');
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<UpdateEventDetail>;
      setMessage(customEvent.detail?.message || 'Actualización detectada. Recargando…');
    };

    window.addEventListener('app:update', handler as EventListener);
    return () => window.removeEventListener('app:update', handler as EventListener);
  }, []);

  if (!message) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[120] px-3 py-2 bg-brand-600 text-white text-xs font-bold uppercase tracking-widest text-center shadow-lg">
      {message}
    </div>
  );
};

export default UpdateBanner;
