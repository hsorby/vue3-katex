/**
 * Plugin entry.
 */
import katexDirective from './directives/katex-directive'
import KatexElement from './components/KatexElement.vue'
import 'katex/contrib/mhchem'

const ignore = () => {}

/**
 * Load the KaTeX extensions that use the DOM as soon as they are imported.
 * They are skipped when there is no document (e.g. server-side rendering).
 * Load failures are ignored: with the UMD build these extensions are expected
 * to be loaded with their own <script> tags.
 */
const loadBrowserExtensions = () => {
  if (typeof document === 'undefined') {
    return
  }
  Promise.all([import('katex/contrib/copy-tex'), import('katex/contrib/mathtex-script-type')]).catch(ignore)
}

/**
 * Install function for installing plugin into Vue 3 application.
 *
 * @param {Object} app
 * @param {Object} options
 */
function install(app, options) {
  const katexOptions = (options && options.katexOptions) || {}
  const vKatex = katexDirective(katexOptions)
  app.directive(vKatex.name, vKatex.directive)
  app.component(KatexElement.name, KatexElement)
  app.provide('$katexOptions', katexOptions)
  loadBrowserExtensions()
}

export { install, KatexElement, katexDirective }
export default install
