import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content/content.tsx'),
        // editor: resolve(__dirname, 'src/editor/main.tsx'), // Example: if editor is a separate page bundle
        // popup: resolve(__dirname, 'src/popup/popup.html'), // Example: if using a popup
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'content') {
            return 'js/content.js';
          }
          return 'js/[name]-[hash].js';
        },
        chunkFileNames: 'js/chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'content.css') {
            return 'assets/content.css';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      }
    },
    outDir: 'dist'
  }
}) 