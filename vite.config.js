import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.IS_PREACT": JSON.stringify("false"),
  },
  resolve: {
    alias: {
      "@excalidraw/excalidraw": "/src/lib/excalidraw/excalidraw",
      "@excalidraw/utils": "/src/lib/excalidraw/utils/src",
      "@excalidraw/element": "/src/lib/excalidraw/element/src",
      "@excalidraw/common": "/src/lib/excalidraw/common/src",
      "@excalidraw/math": "/src/lib/excalidraw/math/src",
    },
  },
  server: {
    host: '0.0.0.0',   // 👈 REQUIRED
    port: 5173
  }
})
