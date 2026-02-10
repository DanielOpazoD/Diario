import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { Buffer } from 'buffer';
import { visualizer } from 'rollup-plugin-visualizer';

const localStorageProxyPlugin = () => ({
  name: 'local-storage-proxy',
  configureServer(server: any) {
    const handler = async (req: any, res: any) => {
      if ((req.method || 'GET').toUpperCase() !== 'GET') {
        res.statusCode = 405;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      try {
        const requestUrl = new URL(req.url || '', 'http://localhost');
        const targetUrl = requestUrl.searchParams.get('url');
        if (!targetUrl) {
          res.statusCode = 400;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing url' }));
          return;
        }

        const upstream = await fetch(targetUrl);
        if (!upstream.ok) {
          res.statusCode = upstream.status;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: `Failed to fetch file (${upstream.status})` }));
          return;
        }

        const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
        const arrayBuffer = await upstream.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ mimeType: contentType, base64 }));
      } catch (error: any) {
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: error?.message || 'Proxy error' }));
      }
    };

    // Local-only endpoint that never touches Netlify proxy.
    server.middlewares.use('/__local/storage-proxy', handler);
    // Keep Netlify-compatible route for parity with production path.
    server.middlewares.use('/.netlify/functions/storage-proxy', handler);
  },
});

export default defineConfig(({ mode }) => {
  // Carga variables desde archivos .env locales
  const env = loadEnv(mode, (process as any).cwd(), '');

  const googleClientId = env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  const isPwaDisabled = env.VITE_DISABLE_PWA === 'true' || env.DISABLE_PWA === 'true';
  const isBundleReport = env.VITE_BUNDLE_REPORT === 'true';

  return {
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.ts',
      include: ['**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json-summary', 'html'],
        exclude: [
          'src/**/*.d.ts',
          'vendor/**',
          'dist/**',
          'node_modules/**',
        ],
        thresholds: {
          lines: 72,
          statements: 70,
          functions: 70,
          branches: 60,
        },
      },
    },
    plugins: [
      localStorageProxyPlugin(),
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'masked-icon.svg'],
        disable: isPwaDisabled,
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
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          mode: 'development',
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.origin.includes('googleapis.com'),
              handler: 'NetworkFirst',
              options: { cacheName: 'google-api-cache' },
            },
          ],
        },
      }),
      isBundleReport
        ? visualizer({
            filename: 'dist/bundle-report.html',
            template: 'treemap',
            gzipSize: true,
            brotliSize: true,
            open: false,
          })
        : null,
    ],
    define: {
      'process.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
    },
    // Solo exponer variables VITE_ relacionadas con Google y Firebase para evitar que otras claves
    // (p. ej., API keys sensibles) queden incrustadas en el bundle de cliente.
    envPrefix: ['VITE_GOOGLE_', 'VITE_FIREBASE_', 'VITE_DISABLE_PWA', 'VITE_APP_VERSION', 'VITE_BUNDLE_REPORT'],
    resolve: {
      alias: {
        '@core': path.resolve(__dirname, './src/core'),
        '@features': path.resolve(__dirname, './src/features'),
        '@domain': path.resolve(__dirname, './src/domain'),
        '@use-cases': path.resolve(__dirname, './src/use-cases'),
        '@data': path.resolve(__dirname, './src/data'),
        '@shared': path.resolve(__dirname, './src/shared'),
        '@services': path.resolve(__dirname, './src/services'),
        'react-router-dom': path.resolve(process.cwd(), 'vendor/react-router-dom'),
      },
    },
    server: {
      host: true,
      headers: {
        'Cache-Control': 'no-store',
      },
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
        'recharts'
      ],
      // Exclude heavy deps that are truly standalone or problematic in pre-bundling
      exclude: [
        'jspdf',
        '@google/generative-ai',
      ],
    },
  };
});
