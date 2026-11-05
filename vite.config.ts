import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { geminiApiPlugin } from './api/gemini-middleware';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), geminiApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
