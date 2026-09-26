import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, inject } from 'vue'
import { mount } from '@vue/test-utils'
import VueKatex, { install, KatexElement, katexDirective } from '@/plugin.js'
import * as VueKatexNamespace from '@/plugin.js'

describe('plugin.js', () => {
  it('registers components and directives', () => {
    const app = createApp({
      template: '<div></div>',
    })
    app.use(VueKatex)
    expect(app.directive('katex')).toBeTruthy()
    expect(app.component('KatexElement').name).toBe('KatexElement')
  })

  it('installs $katexOptions', () => {
    const TestComponent = {
      name: 'TestComponent',
      setup: () => {
        const options = inject('$katexOptions')
        return {
          options,
        }
      },
      template: '<div>Empty - {{ options.someThing }}</div>',
    }

    const wrapper = mount(TestComponent, {
      shallow: true,
      global: {
        plugins: [[VueKatex, { katexOptions: { someThing: 'weird', message: 'working' } }]],
      },
    })

    expect(wrapper.html()).toBe('<div>Empty - weird</div>')
  })

  it('exports the component, directive factory and install function', () => {
    expect(install).toBe(VueKatex)
    expect(KatexElement.name).toBe('KatexElement')
    expect(katexDirective({}).name).toBe('katex')
  })

  it('can be installed from the module namespace (as with require or the UMD global)', () => {
    const app = createApp({})
    app.use(VueKatexNamespace)
    expect(app.component('KatexElement')).toBe(KatexElement)
  })

  describe('without a document', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('installs without loading the browser-only extensions', () => {
      vi.stubGlobal('document', undefined)
      const app = createApp({})
      expect(() => app.use(VueKatex)).not.toThrow()
      expect(app.directive('katex')).toBeTruthy()
    })
  })
})
