import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      ignored: ['**/graphify-out/**', '**/.git/**']
    }
  },
  build: {
    // Bundel utama (aplikasi + supabase + router) sudah ±500 kB dan terus bertambah wajar seiring fitur
    chunkSizeWarningLimit: 600
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
