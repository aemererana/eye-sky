import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

const adsbProxy = {
  '/api/adsb': {
    target: 'https://api.adsb.lol',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/adsb/, ''),
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    https: true,
    proxy: adsbProxy,
  },
  preview: {
    host: true,
    https: true,
    proxy: adsbProxy,
  },
})
