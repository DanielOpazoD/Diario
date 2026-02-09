import './shared/utils/cryptoPolyfill';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { getStoredAppVersion, setStoredAppVersion } from '@shared/utils/storageFlags';
import { dispatchUpdateEvent, setUpdateNotice } from '@shared/utils/updateNotice';

const clearServiceWorkerCaches = async () => {
  if (!('caches' in window)) return;
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
};

const notifyUpdate = () => {
  setUpdateNotice();
  dispatchUpdateEvent({ message: 'Actualización detectada. Recargando…' });
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

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .catch(() => undefined)
    .finally(() => {
      clearServiceWorkerCaches().catch(() => undefined);
    });
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
const storedVersion = getStoredAppVersion();
if (storedVersion !== currentVersion) {
  setStoredAppVersion(currentVersion);
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
