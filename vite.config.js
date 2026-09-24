import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 全量数据按分类拆 chunk：任何一页需要全量时 4 个文件并行下载，
// 单文件不超过最大分类（figures ~1MB），避免 3MB 单包串行等待。
const DATA_CHUNKS = {
  'data-civilizations': ['src/data/civilizations.js'],
  'data-figures': ['src/data/figures.js'],
  'data-artifacts': ['src/data/artifacts.js'],
  'data-events': ['src/data/events.js'],
}

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: DATA_CHUNKS,
      },
    },
  },
})
