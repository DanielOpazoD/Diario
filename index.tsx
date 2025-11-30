import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LogProvider } from './context/LogContext';
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LogProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </LogProvider>
  </React.StrictMode>
);
