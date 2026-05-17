import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-v3.png', 'mask-icon.svg'],
      manifest: {
        name: 'TRIP BASE',
        short_name: 'TRIP BASE',
        description: '家族専用トラベルマネージャー',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/app-icon-v3.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/app-icon-v3.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/app-icon-v3.png',
            sizes: '1024x1024',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
