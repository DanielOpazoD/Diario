import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { STORAGE_KEYS } from '@shared/constants/storageKeys';

const clearServiceWorkerCaches = async () => {
  if (!('caches' in window)) return;
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
};

const notifyUpdate = () => {
  try {
    sessionStorage.setItem('medidiario_update_notice', '1');
  } catch {
    // ignore
  }
  window.dispatchEvent(
    new CustomEvent('app:update', {
      detail: { message: 'Actualización detectada. Recargando…' },
    })
  );
};

const scheduleReload = (update: (reloadPage?: boolean) => Promise<void> | void) => {
  notifyUpdate();
  window.setTimeout(() => {
    update(true);
    window.location.reload();
  }, 800);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const shouldRegisterPwa = import.meta.env.PROD && import.meta.env.VITE_DISABLE_PWA !== 'true';
const updateSW = shouldRegisterPwa
  ? registerSW({
      onNeedRefresh: () => {
        clearServiceWorkerCaches()
          .catch(() => undefined)
          .finally(() => {
            scheduleReload(updateSW);
          });
      },
    })
  : () => undefined;

const currentVersion = import.meta.env.VITE_APP_VERSION || 'dev';
const storedVersion = localStorage.getItem(STORAGE_KEYS.APP_VERSION);
if (storedVersion !== currentVersion) {
  localStorage.setItem(STORAGE_KEYS.APP_VERSION, currentVersion);
  if (shouldRegisterPwa && storedVersion) {
    clearServiceWorkerCaches()
      .catch(() => undefined)
      .finally(() => {
        scheduleReload(updateSW);
      });
  } else if (storedVersion) {
    scheduleReload(updateSW);
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
