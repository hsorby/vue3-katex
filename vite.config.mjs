// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // This maps '@' to your 'src' folder
      '@': path.resolve(import.meta.dirname, 'src') 
    }
  },
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/plugin.js'), // Point to your library's main entry file
      name: 'Vue3Katex', // The global variable name for the UMD build
      // package.json has "type": "module", so the UMD build needs a .cjs
      // extension for Node's require() to treat it as CommonJS.
      fileName: (format) => `vue3-katex.${format}.${format === 'umd' ? 'cjs' : 'js'}`,
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      // into your library. KaTeX is matched with a regex so that its
      // subpath imports (katex/contrib/*) are externalized too; otherwise
      // a second copy of KaTeX gets bundled via the contrib modules.
      external: ['vue', /^katex(\/|$)/],
      output: {
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
          'katex/contrib/render-a11y-string': 'katex',
        },
      },
    },
  },
  // Vitest configuration
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
