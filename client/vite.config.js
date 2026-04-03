import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: process.env.VITE_BASE || (mode === 'ghpages' ? '/homesync/' : '/'),
  server: {
    port: 5173
  },
  json: {
    stringify: true
  }
}));
