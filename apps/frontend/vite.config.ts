import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'favicon-32x32.png', 'favicon-16x16.png', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'abhyasroom-logo.png'],
      manifest: {
        name: 'AbhyasRoom — Smart Library Cloud Platform',
        short_name: 'AbhyasRoom',
        description: 'Multi-tenant library and study hall management cloud platform - abhyasroom.in',
        theme_color: '#0b0f19',
        background_color: '#0b0f19',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
});
