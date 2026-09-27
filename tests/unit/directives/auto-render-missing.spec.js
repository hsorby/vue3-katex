import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import katexDirective from '@/directives/katex-directive'

// As with the UMD build when auto-render's <script> tag is missing.
vi.mock('katex/contrib/auto-render', () => ({ default: undefined }))

describe('Directive v-katex:auto without the auto-render extension', () => {
  it('reports what is missing and how to fix it', () => {
    const mountAuto = () =>
      mount(
        { template: '<div v-katex:auto>\\(x\\)</div>' },
        {
          global: {
            directives: { katex: katexDirective({}).directive },
          },
        },
      )
    expect(mountAuto).toThrow(/needs the KaTeX auto-render extension/)
    expect(mountAuto).toThrow(/contrib\/auto-render\.min\.js/)
  })
})
