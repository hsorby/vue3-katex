import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import KatexElement from '@/components/KatexElement.vue'
import VueKatex from '@/plugin.js'
import katex from 'katex'

// KaTeX 0.18 added a `katex-` prefix to some of its internal class names
// (e.g. `base` -> `katex-base`). Rewrite any unprefixed names to the 0.18
// form so the same snapshots work with both KaTeX 0.17 and 0.18.
const PREFIXED_IN_0_18 = new Set([
  'accent',
  'base',
  'fix',
  'hdashline',
  'hline',
  'inner',
  'newline',
  'overlay',
  'overline',
  'root',
  'rule',
  'sizing',
  'smash',
  'sout',
  'stretchy',
  'strut',
  'tag',
  'thinbox',
  'underline',
  'vbox',
])
const normaliseKatexClasses = (html) =>
  html.replace(/class="([^"]*)"/g, (_, classes) => {
    const normalised = classes
      .split(' ')
      .map((c) => (PREFIXED_IN_0_18.has(c) ? `katex-${c}` : c))
      .join(' ')
    return `class="${normalised}"`
  })

describe('KatexElement.vue', () => {
  it('matches snapshot - inline mode', () => {
    const wrapper = mount(KatexElement, {
      props: {
        expression: '\\frac{a_i}{1+x}',
      },
      global: {
        plugins: [VueKatex],
      },
      shallow: true,
    })
    expect(normaliseKatexClasses(wrapper.html())).toMatchSnapshot()
  })

  it('matches snapshot - display mode', () => {
    const wrapper = mount(KatexElement, {
      props: {
        expression: '\\frac{a_i}{1+x}',
        displayMode: true,
      },
      global: {
        plugins: [VueKatex],
      },
      shallow: true,
    })
    expect(normaliseKatexClasses(wrapper.html())).toMatchSnapshot()
  })

  it('respects global options', () => {
    const wrapper = mount(KatexElement, {
      props: {
        expression: '\\frac{a_i}{1+x}',
      },
      global: {
        plugins: [
          [
            VueKatex,
            {
              katexOptions: {
                macros: {
                  '\\blah': '\\frac{#}{#}',
                },
              },
            },
          ],
        ],
      },
      shallow: true,
    })

    const options = wrapper.vm.options
    expect(options).toMatchObject({
      macros: {
        '\\blah': '\\frac{#}{#}',
      },
    })
  })

  it('merges global options', () => {
    const wrapper = mount(KatexElement, {
      props: {
        expression: '\\frac{a_i}{1+x}',
        displayMode: true,
        errorColor: '#fff',
        macros: {
          '\\blahblah': '\\frac{#}{#}',
        },
      },
      global: {
        plugins: [
          [
            VueKatex,
            {
              katexOptions: {
                displayMode: false,
                errorColor: '#000',
                macros: {
                  '\\blah': '\\frac{#}{#}',
                },
              },
            },
          ],
        ],
      },
      shallow: true,
    })

    const options = wrapper.vm.options
    expect(options).toMatchObject({
      macros: {
        '\\blah': '\\frac{#}{#}',
        '\\blahblah': '\\frac{#}{#}',
      },
      displayMode: true,
      errorColor: '#fff',
    })
  })

  it('props are mapped to options', () => {
    const displayMode = true
    const throwOnError = true
    const errorColor = '#ffffff'
    const macros = { '\\RR': '\\mathbb{R}' }
    const colorIsTextColor = true
    const maxSize = 100
    const maxExpand = 100
    const allowedProtocols = ['http', 'https']
    const strict = false

    const wrapper = mount(KatexElement, {
      props: {
        expression: '\\frac{a_i}{1+x}',
        displayMode,
        throwOnError,
        errorColor,
        macros,
        colorIsTextColor,
        maxSize,
        maxExpand,
        allowedProtocols,
        strict,
      },
      global: {
        plugins: [VueKatex],
      },
      shallow: true,
    })

    const options = wrapper.vm.options
    expect(options).toMatchObject({
      displayMode,
      throwOnError,
      errorColor,
      macros,
      colorIsTextColor,
      maxSize,
      maxExpand,
      allowedProtocols,
      strict,
    })
  })

  it('has correct root element - inline mode', () => {
    const wrapper = mount(KatexElement, {
      props: { expression: '\\frac{a_i}{1+x}' },
      global: {
        plugins: [VueKatex],
      },
    })
    expect(wrapper.find('span').exists()).toBe(true)
  })

  it('has correct root element - display mode', () => {
    const wrapper = mount(KatexElement, {
      props: {
        expression: '\\frac{a_i}{1+x}',
        displayMode: true,
      },
      global: {
        plugins: [VueKatex],
      },
      shallow: true,
    })
    expect(wrapper.find('div').exists()).toBe(true)
    expect(wrapper.html().substring(0, 4)).toBe('<div')
  })

  it('matches katex renderToString', () => {
    const expression = '\\frac{a_i}{1+x}'
    const wrapper = mount(KatexElement, {
      props: {
        expression,
      },
      global: {
        plugins: [VueKatex],
      },
    })
    const expectedInnerHtml = katex.renderToString(expression)
    expect(wrapper.html()).toContain(expectedInnerHtml)
  })

  it('does not throw on invalid TeX by default', () => {
    const wrapper = mount(KatexElement, {
      props: { expression: '\\frac{' },
      global: {
        plugins: [VueKatex],
      },
    })
    expect(wrapper.find('.katex-error').exists()).toBe(true)
  })

  it('throws on invalid TeX when throwOnError is set globally', () => {
    expect(() =>
      mount(KatexElement, {
        props: { expression: '\\frac{' },
        global: {
          plugins: [[VueKatex, { katexOptions: { throwOnError: true } }]],
        },
      }),
    ).toThrow(katex.ParseError)
  })

  it('works without the plugin and without warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mount(KatexElement, { props: { expression: 'x' } })
    expect(wrapper.find('.katex').exists()).toBe(true)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('lets \\gdef add to the macros prop', () => {
    const macros = {}
    mount(KatexElement, {
      props: { expression: '\\gdef\\answer{42}', macros },
      global: {
        plugins: [VueKatex],
      },
    })
    expect(macros).toHaveProperty('\\answer')
  })

  it('lets \\gdef add to the global macros', () => {
    const macros = {}
    mount(KatexElement, {
      props: { expression: '\\gdef\\answer{42}' },
      global: {
        plugins: [[VueKatex, { katexOptions: { macros } }]],
      },
    })
    expect(macros).toHaveProperty('\\answer')
  })

  it('lets the allowedProtocols prop narrow the global list', () => {
    const wrapper = mount(KatexElement, {
      props: { expression: 'x', allowedProtocols: ['https'] },
      global: {
        plugins: [[VueKatex, { katexOptions: { allowedProtocols: ['http', 'https'] } }]],
      },
    })
    expect(wrapper.vm.options.allowedProtocols).toEqual(['https'])
  })
})
