import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'The Prediktor',
        short_name: 'Prediktor',
        description: 'World Cup 2026 Prediction Game',
        theme_color: '#0a0f1e',
        background_color: '#0a0f1e',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
  { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }
]
      }
    })
  ]
})
