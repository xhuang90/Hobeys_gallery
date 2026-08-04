import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isBuild = process.env.NODE_ENV === 'production' || process.argv.includes('build')

export default defineConfig({
  root: __dirname,
  base: isBuild ? '/Hobeys_gallery/' : '/',
  plugins: [vue()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  publicDir: 'public',
  server: {
    fs: {
      strict: false,
    },
  },
})
