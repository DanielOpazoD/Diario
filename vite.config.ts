import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { Buffer } from 'buffer';

export default defineConfig(({ mode }) => {
  // Carga variables desde archivos .env locales
  const env = loadEnv(mode, (process as any).cwd(), '');

  // CORRECCIÓN: Buscamos explícitamente en process.env para capturar la variable de Netlify
  const rawKey =
    env.VITE_GOOGLE_API_KEY ||
    env.VITE_API_KEY ||
    env.GEMINI_API_KEY ||
    process.env.VITE_GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY || // <--- ESTA ES LA LÍNEA CLAVE QUE FALTA
    process.env.VITE_API_KEY ||
    '';

  // Debug en el log de Netlify para confirmar si encontró la clave (solo muestra los primeros 4 caracteres)
  if (mode === 'production') {
    if (rawKey) {
      console.log(`✅ API Key detectada para el build: ${rawKey.substring(0, 4)}...`);
    } else {
      console.error('❌ ERROR CRÍTICO: No se encontró GEMINI_API_KEY durante el build del frontend.');
    }
  }

  // Codificamos la clave para inyectarla de forma segura
  const encodedKey = Buffer.from(rawKey).toString('base64');
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
      // Inyección de la variable en el código del navegador
      'process.env.API_KEY': JSON.stringify(encodedKey),
      'process.env.VITE_GOOGLE_API_KEY': JSON.stringify(encodedKey),
      'import.meta.env.VITE_API_KEY': JSON.stringify(encodedKey),
      'import.meta.env.VITE_GOOGLE_API_KEY': JSON.stringify(encodedKey),
      'process.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
    },
    server: {
      host: true,
    },
  };
});
