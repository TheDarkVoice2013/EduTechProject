import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const value = process.env.BASE_PATH || env.BASE_PATH || '/edutechproject';
  const base = `/${value.split('/').filter(Boolean).join('/')}${value === '/' ? '' : '/'}`;
  return {
    plugins: [react()],
    base,
    server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy: { [`${base}api`]: { target: 'http://127.0.0.1:3101', changeOrigin: false } } },
    build: { sourcemap: false, chunkSizeWarningLimit: 800 },
  };
});
