import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { Buffer } from 'buffer';

export default defineConfig(({ mode }) => {
  // Carga variables desde archivos .env locales
  const env = loadEnv(mode, (process as any).cwd(), '');

  const googleClientId = env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'masked-icon.svg'],
        manifest: {
          name: 'MediDiario AI',
          short_name: 'MediDiario',
          description: 'Gestor inteligente de pacientes diarios.',
          theme_color: '#3b82f6',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
            { src: 'masked-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.origin.includes('googleapis.com'),
              handler: 'NetworkFirst',
              options: { cacheName: 'google-api-cache' },
            },
          ],
        },
      }),
    ],
    define: {
      'process.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
    },
    // Solo exponer variables VITE_ relacionadas con Google para evitar que otras claves
    // (p. ej., API keys sensibles) queden incrustadas en el bundle de cliente.
    envPrefix: ['VITE_GOOGLE_'],
    server: {
      host: true,
    },
  };
});
