// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // This maps '@' to your 'src' folder
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/plugin.js'), // Point to your library's main entry file
      name: 'Vue3Katex', // The global variable name for the UMD build
      // es: for import. cjs: for require(); package.json has "type": "module",
      // so it needs the .cjs extension. umd: for <script> tags (CDNs).
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => ({ es: 'vue3-katex.es.js', cjs: 'vue3-katex.cjs', umd: 'vue3-katex.umd.js' })[format],
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      // into your library. KaTeX is matched with a regex so that its
      // subpath imports (katex/contrib/*) are externalized too; otherwise
      // a second copy of KaTeX gets bundled via the contrib modules.
      external: ['vue', /^katex(\/|$)/],
      output: {
        // The entry has named exports as well as the default export.
        exports: 'named',
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue',
          katex: 'katex',
          'katex/contrib/auto-render': 'renderMathInElement',
          // Side-effect only imports; they register themselves with the
          // global katex when loaded via their own <script> tags.
          'katex/contrib/copy-tex': 'katex',
          'katex/contrib/mhchem': 'katex',
          'katex/contrib/mathtex-script-type': 'katex',
        },
      },
    },
  },
  // Vitest configuration
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
