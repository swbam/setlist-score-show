import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    compilerOptions: {
      incremental: false
    }
  },
  clean: true,
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
})