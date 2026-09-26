/**
 * Plugin entry.
 */
import katexDirective from './directives/katex-directive'
import KatexElement from './components/KatexElement.vue'
// import VueDOMPurifyHTML from 'vue-dompurify-html'
import 'katex/contrib/copy-tex'
import 'katex/contrib/mhchem'
import 'katex/contrib/mathtex-script-type'
import 'katex/contrib/render-a11y-string'

/**
 * Install function for installing plugin into Vue 3 application.
 *
 * @param {Object} app
 * @param {Object} options
 */
function install(app, options) {
  const katexOptions = (options && options.katexOptions) || {}
  const vKatex = katexDirective(katexOptions)
  // app.use(VueDOMPurifyHTML)
  app.directive(vKatex.name, vKatex.directive)
  app.component(KatexElement.name, KatexElement)
  app.provide('$katexOptions', katexOptions)
}

export default install
