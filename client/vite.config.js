import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/homesync/',
  server: {
    port: 5173
  },
  json: {
    stringify: true
  }
});
