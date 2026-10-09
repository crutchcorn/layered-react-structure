import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.tsx', 'src/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    restoreMocks: true,
  },
})
