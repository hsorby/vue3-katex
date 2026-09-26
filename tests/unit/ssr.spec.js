// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

describe('server-side rendering', () => {
  it('imports and renders KatexElement without a document', async () => {
    expect(typeof document).toBe('undefined')
    const { default: VueKatex, KatexElement } = await import('@/plugin.js')
    const app = createSSRApp({ render: () => h(KatexElement, { expression: '\\ce{H2O}' }) })
    app.use(VueKatex)
    const html = await renderToString(app)
    expect(html).toContain('class="katex"')
    expect(html).not.toContain('katex-error')
  })

  it('renders display mode as a div', async () => {
    const { KatexElement } = await import('@/plugin.js')
    const app = createSSRApp({ render: () => h(KatexElement, { expression: 'x', displayMode: true }) })
    const html = await renderToString(app)
    expect(html).toMatch(/^<div><span class="katex-display">/)
  })
})
