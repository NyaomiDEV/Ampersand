import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: false,
  server: {
    strictPort: true,
    host: host || false,
    port: 5173,
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    target: "esnext",
    sourcemap: "inline",
    assetsDir: "assets"
  },
  plugins: [vue()],
  base: process.env.GITHUB_ACTION ? "/Ampersand/" : ""
})
