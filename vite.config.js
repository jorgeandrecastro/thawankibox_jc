import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst'
          }
        ]
      },
      manifest: {
        name: 'Thawankibox',
        short_name: 'Thawankibox',
        description: 'Liste de courses intelligente, 100% offline',
        start_url: '/',
        display: 'standalone',
        background_color: '#fff1e5',
        theme_color: '#f97316',
        orientation: 'any',
        display_override: ["window-controls-overlay"],
        categories: ["shopping", "productivity"],
        edge_side_panel: {},
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ]
      }
    })
  ]
});
