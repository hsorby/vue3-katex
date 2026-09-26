import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import katexDirective from '@/directives/katex-directive'
import katex from 'katex'
import renderMathInElement from 'katex/contrib/auto-render'

vi.mock('katex')
vi.mock('katex/contrib/auto-render')

const vKatex = katexDirective({})

const testComponent = {
  template: '<div v-katex="expression"></div>',
  props: ['expression'],
}
const testComponentDisplay = {
  template: '<div v-katex:display="expression"></div>',
  props: ['expression'],
}

describe('Directive v-katex', () => {
  it('renders katex', () => {
    const expression = '\\frac{a_i}{1+x}'
    const wrapper = mount(testComponent, {
      props: { expression },
      global: {
        directives: {
          katex: vKatex.directive,
        },
      },
    })
    expect(katex.render).toBeCalledWith(expression, wrapper.element, {})
  })
  it('renders katex in display mode', () => {
    const expression = '\\frac{a_i}{1+x}'
    const wrapper = mount(testComponentDisplay, {
      props: { expression },
      global: {
        directives: {
          katex: vKatex.directive,
        },
      },
    })
    expect(katex.render).toBeCalledWith(expression, wrapper.element, { displayMode: true })
  })
  it('renders katex in display mode with options', () => {
    const expression = '\\frac{a_i}{1+x}'
    const wrapper = mount(testComponentDisplay, {
      props: {
        expression: {
          expression,
          options: { throwOnError: false },
        },
      },
      global: {
        directives: {
          katex: vKatex.directive,
        },
      },
    })
    expect(katex.render).toBeCalledWith(expression, wrapper.element, {
      displayMode: true,
      throwOnError: false,
    })
  })
  it('renders with auto mode', () => {
    const component = {
      template: `
          <div v-katex:auto>
           \\(\\frac{a_i}{1+x}\\)
          </div>
        `,
    }
    const wrapper = mount(component, {
      global: {
        directives: {
          katex: vKatex.directive,
        },
      },
    })
    expect(renderMathInElement).toBeCalledTimes(1)
    expect(renderMathInElement).toBeCalledWith(wrapper.element, {})
  })
  it('respects global options', () => {
    const expression = '\\frac{a_i}{1+x}'
    const options = {
      displayMode: true,
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
      ],
    }
    const globalVKatex = katexDirective()
    const wrapper = mount(testComponent, {
      props: {
        expression: {
          expression,
          options,
        },
      },
      global: {
        directives: {
          katex: globalVKatex.directive,
        },
      },
    })
    expect(katex.render).toBeCalledWith(expression, wrapper.element, options)
  })
  it('merges global options', () => {
    const component = {
      template: `
          <div v-katex:auto="{options}">
           \\(\\frac{a_i}{1+x}\\)
          </div>
        `,
      data() {
        return {
          options: {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '\\(', right: '\\)', display: true },
              { left: '\\[', right: '\\]', display: true },
            ],
          },
        }
      },
    }
    const globalVKatex = katexDirective({
      displayMode: true,
      delimiters: [{ left: '||', right: '||', display: false }],
    })
    const wrapper = mount(component, {
      global: {
        directives: {
          katex: globalVKatex.directive,
        },
      },
    })
    expect(renderMathInElement).toBeCalledTimes(1)
    expect(renderMathInElement).toBeCalledWith(wrapper.element, {
      displayMode: true,
      delimiters: [
        { left: '||', right: '||', display: false },
        { left: '$$', right: '$$', display: true },
        { left: '\\(', right: '\\)', display: true },
        { left: '\\[', right: '\\]', display: true },
      ],
    })
  })

  describe('value handling', () => {
    const mountWith = (template, data = {}) =>
      mount(
        { template, data: () => data },
        {
          global: {
            directives: {
              katex: vKatex.directive,
            },
          },
        },
      )

    it.each([
      ['undefined', undefined],
      ['null', null],
    ])('renders an empty expression when the value is %s', (_, value) => {
      const wrapper = mountWith('<div v-katex="value"></div>', { value })
      expect(katex.render).toBeCalledWith('', wrapper.element, {})
    })

    it('renders an empty expression from the object form', () => {
      const wrapper = mountWith(`<div v-katex="{ expression: '', options: { throwOnError: false } }"></div>`)
      expect(katex.render).toBeCalledWith('', wrapper.element, { throwOnError: false })
    })

    it('converts a number to a string', () => {
      const wrapper = mountWith('<div v-katex="2"></div>')
      expect(katex.render).toBeCalledWith('2', wrapper.element, {})
    })
  })

  describe('updates', () => {
    beforeEach(() => {
      katex.render.mockClear()
    })

    const mountCounter = (template, data) =>
      mount(
        { template, data: () => ({ other: 0, ...data }) },
        {
          global: {
            directives: {
              katex: vKatex.directive,
            },
          },
        },
      )

    it('does not render again when the parent updates for another reason', async () => {
      const wrapper = mountCounter(
        `<div><div v-katex="{ expression: 'x', options: { macros: {} } }"></div>{{ other }}</div>`,
      )
      wrapper.vm.other++
      await nextTick()
      wrapper.vm.other++
      await nextTick()
      expect(katex.render).toBeCalledTimes(1)
    })

    it('renders again when the expression changes', async () => {
      const wrapper = mountCounter('<div v-katex="expression"></div>', { expression: 'x' })
      wrapper.vm.expression = 'y'
      await nextTick()
      expect(katex.render).toBeCalledTimes(2)
      expect(katex.render).toHaveBeenLastCalledWith('y', wrapper.element, {})
    })

    it('renders again when an option is changed in place', async () => {
      const options = { macros: { '\\a': 'a' } }
      const wrapper = mountCounter(`<div v-katex="{ expression: 'x', options }">{{ other }}</div>`, { options })
      wrapper.vm.options.macros['\\a'] = 'b'
      wrapper.vm.other++
      await nextTick()
      expect(katex.render).toBeCalledTimes(2)
    })

    it('renders again on every update in auto mode', async () => {
      renderMathInElement.mockClear()
      const wrapper = mountCounter('<div v-katex:auto>{{ other }}</div>')
      wrapper.vm.other++
      await nextTick()
      expect(renderMathInElement).toBeCalledTimes(2)
    })
  })
})
