import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  // Monaco Editor uses AMD (require.js) internally — pre-bundling as ESM prevents
  // the "Can only have one anonymous define call" conflict when multiple lazy chunks
  // (Login's SnippetModule + the main app) both import Monaco simultaneously.
  optimizeDeps: {
    include: [
      'framer-motion',
      '@react-oauth/google',
      '@monaco-editor/react',
      'monaco-editor',
    ],
  },
  define: {
    "process.env.IS_PREACT": JSON.stringify("false"),
  },

  resolve: {
    // Force a single copy of React — prevents "Invalid hook call" in monorepo setups
    // where excalidraw-app has its own local node_modules/react
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
    alias: {
      "react": path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
      "@excalidraw/excalidraw": "/src/lib/excalidraw/excalidraw",
      "@excalidraw/utils": "/src/lib/excalidraw/utils/src",
      "@excalidraw/element": "/src/lib/excalidraw/element/src",
      "@excalidraw/common": "/src/lib/excalidraw/common/src",
      "@excalidraw/math": "/src/lib/excalidraw/math/src",
    },
  },

  // DEV ONLY (safe to keep)
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          excalidraw: ['@excalidraw/excalidraw'],
        },
      },
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: [
          "legacy-js-api",
          "import",
          "global-builtin",
          "color-functions",
        ],
        api: 'modern-compiler',
      },
    },
  },
})
