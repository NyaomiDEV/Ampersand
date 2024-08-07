import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "esnext",
    sourcemap: "inline",
    assetsDir: "assets"
  },
  plugins: [vue()],
  base: process.env.GITHUB_ACTION ? "/Ampersand/" : ""
})
