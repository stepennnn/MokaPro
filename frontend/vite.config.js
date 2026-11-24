import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.MOKAPRO_BACKEND_URL || 'http://127.0.0.1:8000'

  return {
    plugins: [react()],
    base: '/MokaPro/',
    server: {
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/sanctum': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  }
})