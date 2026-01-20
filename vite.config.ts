import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { Buffer } from 'buffer';

export default defineConfig(({ mode }) => {
  // Carga variables desde archivos .env locales
  const env = loadEnv(mode, (process as any).cwd(), '');

  const googleClientId = env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';

  return {
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.ts',
      include: ['**/*.test.{ts,tsx}'],
    },
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
    // Solo exponer variables VITE_ relacionadas con Google y Firebase para evitar que otras claves
    // (p. ej., API keys sensibles) queden incrustadas en el bundle de cliente.
    envPrefix: ['VITE_GOOGLE_', 'VITE_FIREBASE_'],
    resolve: {
      alias: {
        '@core': path.resolve(__dirname, './src/core'),
        '@features': path.resolve(__dirname, './src/features'),
        '@shared': path.resolve(__dirname, './src/shared'),
        '@services': path.resolve(__dirname, './src/services'),
        'react-router-dom': path.resolve(process.cwd(), 'vendor/react-router-dom'),
      },
    },
    server: {
      host: true,
      proxy: {
        '/.netlify/functions': {
          target: 'http://localhost:8888',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    // Optimized chunk splitting configuration for micro-frontends architecture
    build: {
      // Target modern browsers for smaller bundles
      target: 'es2020',
      // Enable minification
      minify: 'esbuild',
      // Optimize chunk size
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          // Manual chunk splitting for optimal loading
          manualChunks: {
            // Core React runtime - loaded immediately
            'react-vendor': ['react', 'react-dom'],
            // State management - critical path
            'zustand': ['zustand'],
            // Date utilities - frequently used
            'date-fns': ['date-fns'],
            // UI components library
            'lucide': ['lucide-react'],
            // Heavy dependencies - lazy loaded
            'charts': ['recharts'],
            'pdf': ['jspdf'],
            // Google services - loaded on demand
            'google-ai': ['@google/generative-ai'],
          },
          // Optimize chunk naming for better caching
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId || '';
            // Feature-based chunks
            if (facadeModuleId.includes('features/daily')) return 'chunks/daily-[hash].js';
            if (facadeModuleId.includes('features/stats')) return 'chunks/stats-[hash].js';
            if (facadeModuleId.includes('features/history')) return 'chunks/history-[hash].js';
            if (facadeModuleId.includes('features/bookmarks')) return 'chunks/bookmarks-[hash].js';
            // Component chunks
            if (facadeModuleId.includes('components/PatientModal')) return 'chunks/patient-modal-[hash].js';
            if (facadeModuleId.includes('components/Settings')) return 'chunks/settings-[hash].js';
            if (facadeModuleId.includes('components/TaskDashboard')) return 'chunks/tasks-[hash].js';
            // Service chunks

            if (facadeModuleId.includes('services/geminiService')) return 'chunks/gemini-service-[hash].js';
            if (facadeModuleId.includes('services/reportService')) return 'chunks/report-service-[hash].js';
            // Default naming
            return 'chunks/[name]-[hash].js';
          },
          // Entry point naming
          entryFileNames: 'assets/[name]-[hash].js',
          // Asset naming
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      // Generate source maps for debugging (can disable in production)
      sourcemap: false,
    },
    // Optimize dependencies pre-bundling
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'zustand',
        'date-fns',
        'clsx',
        'tailwind-merge',
        'recharts',
        'lodash/get'
      ],
      // Exclude heavy deps that are truly standalone or problematic in pre-bundling
      exclude: [
        'jspdf',
        '@google/generative-ai',
      ],
    },
  };
});
