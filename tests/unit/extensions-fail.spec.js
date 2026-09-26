import { describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import VueKatex from '@/plugin.js'

// With the UMD build the browser-only extensions may not be importable; the
// plugin should carry on without them rather than cause an unhandled rejection.
vi.mock('katex/contrib/copy-tex', () => {
  throw new Error('not available')
})

describe('browser-only extensions', () => {
  it('ignores a failure to load them', async () => {
    const app = createApp({})
    expect(() => app.use(VueKatex)).not.toThrow()
    await new Promise((resolve) => setTimeout(resolve))
    expect(app.component('KatexElement')).toBeTruthy()
  })
})
