import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader, RefreshCw } from 'lucide-react';
import { getActiveAccessToken, handleGoogleLogin } from '../services/googleService';

type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'expired';

const statusConfig: Record<ConnectionStatus, {
  icon: JSX.Element;
  text: string;
  color: string;
}> = {
  checking: {
    icon: <Loader className="w-3.5 h-3.5 animate-spin" />,
    text: 'Verificando...',
    color: 'text-gray-500 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
  },
  connected: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    text: 'Drive conectado',
    color: 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  },
  expired: {
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    text: 'Sesión expirada',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  },
  disconnected: {
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    text: 'Sin conexión',
    color: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  },
};

const GoogleConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [isReconnecting, setIsReconnecting] = useState(false);

  const config = useMemo(() => statusConfig[status], [status]);

  const checkConnection = async () => {
    const token = getActiveAccessToken();

    if (!token) {
      setStatus('disconnected');
      return;
    }

    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setStatus('connected');
      } else if (response.status === 401) {
        setStatus('expired');
      } else {
        setStatus('disconnected');
      }
    } catch (error) {
      console.error('Error al verificar conexión con Google Drive', error);
      setStatus('disconnected');
    }
  };

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await handleGoogleLogin();
      await checkConnection();
    } catch (error) {
      console.error('Error reconectando con Google', error);
      setStatus('disconnected');
    } finally {
      setIsReconnecting(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${config.color}`}
      role="status"
      aria-live="polite"
    >
      {config.icon}
      <span>{config.text}</span>

      {(status === 'expired' || status === 'disconnected') && (
        <button
          onClick={handleReconnect}
          disabled={isReconnecting}
          className="ml-1 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Reconectar"
        >
          <RefreshCw className={`w-3 h-3 ${isReconnecting ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
};

export default GoogleConnectionStatus;
