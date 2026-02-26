import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig(() => {
  const hasLocalCerts = fs.existsSync('./localhost+2-key.pem') && fs.existsSync('./localhost+2.pem');

  return {
    plugins: [react()],
    server: {
      https: hasLocalCerts
        ? {
            key: fs.readFileSync('./localhost+2-key.pem'),
            cert: fs.readFileSync('./localhost+2.pem'),
          }
        : undefined,
      port: 5173,
      host: true,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
        '/auth': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist/public',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'app.html'),
        },
      },
    },
  };
})
