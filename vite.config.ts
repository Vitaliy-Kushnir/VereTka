
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'], // Add any other static assets you want cached
      manifest: {
        name: 'VereTka - Vector Editor',
        short_name: 'VereTka',
        description: 'A simple vector editor for Tkinter code generation',
        theme_color: '#1f2937',
        background_color: '#111827',
        display: 'standalone',
        scope: '/VereTka/',
        start_url: '/VereTka/',
        orientation: 'any',
        icons: [
          {
            src: 'favicon.svg', // You might want to generate proper PNG icons of different sizes (192x192, 512x512) for better PWA support
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,txt}'], // Cache these file types
        cleanupOutdatedCaches: true,
        // Cache the Tailwind CDN script for offline use
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.tailwindcss\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tailwindcss-cdn',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/aistudiocdn\.com/,
            handler: 'CacheFirst',
             options: {
              cacheName: 'cdn-libs',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  base: '/VereTka/',
})
