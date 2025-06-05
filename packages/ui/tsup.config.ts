import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    compilerOptions: {
      incremental: false
    }
  },
  external: ['react', 'react-dom'],
  clean: true,
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"',
    }
  },
})