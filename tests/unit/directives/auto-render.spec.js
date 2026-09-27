import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'

import katexDirective from '@/directives/katex-directive'

// Uses the real KaTeX auto-render, to check the directive keeps working
// when Vue updates content that auto-render has already replaced.
const vKatex = katexDirective({})

const mountAuto = (template, data) =>
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

const annotations = (wrapper) => wrapper.findAll('annotation').map((a) => a.text())

describe('Directive v-katex:auto with real KaTeX', () => {
  it('renders math in the element', () => {
    const wrapper = mountAuto('<div v-katex:auto>{{ text }}</div>', { text: 'Area \\(\\pi r^2\\)' })
    expect(annotations(wrapper)).toEqual(['\\pi r^2'])
  })

  it('renders again when a text node changes', async () => {
    const wrapper = mountAuto('<div v-katex:auto>{{ text }}</div>', { text: '\\(x^2\\)' })
    wrapper.vm.text = '\\(y^3\\)'
    await nextTick()
    expect(annotations(wrapper)).toEqual(['y^3'])
  })

  it('renders again when nested content changes', async () => {
    const wrapper = mountAuto('<div v-katex:auto><p>{{ first }}</p> and <b>{{ second }}</b></div>', {
      first: '\\(a\\)',
      second: '\\(b\\)',
    })
    expect(annotations(wrapper)).toEqual(['a', 'b'])
    wrapper.vm.second = '\\(c\\)'
    await nextTick()
    expect(annotations(wrapper)).toEqual(['a', 'c'])
  })

  it('handles elements being added and removed', async () => {
    const wrapper = mountAuto('<div v-katex:auto><span v-if="show">\\(a\\)</span>{{ text }}</div>', {
      show: true,
      text: '\\(b\\)',
    })
    expect(annotations(wrapper)).toEqual(['a', 'b'])
    wrapper.vm.show = false
    await nextTick()
    expect(annotations(wrapper)).toEqual(['b'])
    wrapper.vm.show = true
    wrapper.vm.text = '\\(c\\)'
    await nextTick()
    expect(annotations(wrapper)).toEqual(['a', 'c'])
  })

  it('handles items being added to a v-for list', async () => {
    const wrapper = mountAuto('<div v-katex:auto><p v-for="item in items" :key="item">{{ item }}</p></div>', {
      items: ['\\(a\\)'],
    })
    wrapper.vm.items.push('\\(b\\)')
    await nextTick()
    expect(annotations(wrapper)).toEqual(['a', 'b'])
  })

  it('switches between auto and normal modes', async () => {
    const wrapper = mountAuto('<div v-katex:[mode]="value">{{ text }}</div>', {
      mode: 'auto',
      value: undefined,
      text: '\\(a\\)',
    })
    expect(annotations(wrapper)).toEqual(['a'])
    wrapper.vm.mode = 'display'
    wrapper.vm.value = 'b'
    await nextTick()
    expect(annotations(wrapper)).toEqual(['b'])
    expect(wrapper.find('.katex-display').exists()).toBe(true)
  })
})

describe('Directive v-katex:auto with child components', () => {
  // Wait for the directive's MutationObserver to react to a change.
  const settle = () => new Promise((resolve) => setTimeout(resolve))

  // The child component owns `state`; changing it updates only the child.
  const mountWithChild = (childTemplate, initial) => {
    const state = ref(initial)
    const Child = defineComponent({ setup: () => ({ state }), template: childTemplate })
    const wrapper = mount(
      { components: { Child }, data: () => ({ n: 0 }), template: '<div v-katex:auto><Child /> {{ n }}</div>' },
      {
        global: {
          directives: {
            katex: vKatex.directive,
          },
        },
      },
    )
    return { wrapper, state }
  }

  describe.each([
    ['whose text is the only content of an element', '<p>{{ state }}</p>'],
    ['whose text sits beside other elements', '<p>{{ state }} <b>bold</b></p>'],
  ])('a child %s', (_, childTemplate) => {
    it('renders math again when only the child updates', async () => {
      const { wrapper, state } = mountWithChild(childTemplate, 'math \\(x^2\\)')
      expect(annotations(wrapper)).toEqual(['x^2'])
      state.value = 'math \\(y^3\\)'
      await settle()
      expect(annotations(wrapper)).toEqual(['y^3'])
      expect(wrapper.text()).not.toContain('\\(')
    })

    it('keeps the child update when the parent updates afterwards', async () => {
      const { wrapper, state } = mountWithChild(childTemplate, 'math \\(x^2\\)')
      state.value = 'math \\(y^3\\)'
      await settle()
      wrapper.vm.n++
      await settle()
      expect(annotations(wrapper)).toEqual(['y^3'])
      expect(wrapper.text()).toContain('1')
    })

    it('handles child and parent updates in the same tick', async () => {
      const { wrapper, state } = mountWithChild(childTemplate, 'math \\(x^2\\)')
      state.value = 'math \\(y^3\\)'
      wrapper.vm.n++
      await settle()
      expect(annotations(wrapper)).toEqual(['y^3'])
    })

    it('renders math that appears in a child that had none', async () => {
      const { wrapper, state } = mountWithChild(childTemplate, 'plain text')
      expect(annotations(wrapper)).toEqual([])
      state.value = 'now \\(z\\)'
      await settle()
      expect(annotations(wrapper)).toEqual(['z'])
    })
  })

  it('handles a child adding and removing elements beside its math', async () => {
    const { wrapper, state } = mountWithChild('<p><span v-if="state">new</span>\\(x\\)</p>', false)
    state.value = true
    await settle()
    expect(wrapper.text()).toContain('new')
    expect(annotations(wrapper)).toEqual(['x'])
    state.value = false
    await settle()
    expect(wrapper.text()).not.toContain('new')
    expect(annotations(wrapper)).toEqual(['x'])
  })

  it('handles a v-for list inside a child', async () => {
    const { wrapper, state } = mountWithChild(
      '<ul><li v-for="i in state" :key="i">item {{ i }} \\(a_{{ i }}\\)</li></ul>',
      1,
    )
    state.value = 3
    await settle()
    expect(annotations(wrapper)).toEqual(['a_1', 'a_2', 'a_3'])
    state.value = 1
    await settle()
    expect(annotations(wrapper)).toEqual(['a_1'])
  })

  it.each([
    ['swaps its root element', '<b v-if="state">\\(c\\)</b><i v-else>\\(d\\)</i>'],
    ['renders only text', '{{ state ? "\\\\(c\\\\)" : "\\\\(d\\\\)" }}'],
    ['renders several root nodes', '<b>B</b>{{ state ? "\\\\(c\\\\)" : "\\\\(d\\\\)" }}'],
  ])('keeps parent math beside a child that %s up to date', async (_, childTemplate) => {
    const state = ref(true)
    const Child = defineComponent({ setup: () => ({ state }), template: childTemplate })
    const wrapper = mount(
      {
        components: { Child },
        data: () => ({ before: '\\(a\\)', after: '\\(z\\)' }),
        template: '<div v-katex:auto>{{ before }} <Child /> {{ after }}</div>',
      },
      {
        global: {
          directives: {
            katex: vKatex.directive,
          },
        },
      },
    )
    expect(annotations(wrapper)).toEqual(['a', 'c', 'z'])
    state.value = false
    await settle()
    expect(annotations(wrapper)).toEqual(['a', 'd', 'z'])
    wrapper.vm.before = '\\(A\\)'
    await settle()
    expect(annotations(wrapper)).toEqual(['A', 'd', 'z'])
    wrapper.vm.after = '\\(Z\\)'
    state.value = true
    await settle()
    expect(annotations(wrapper)).toEqual(['A', 'c', 'Z'])
  })

  it('stops watching once unmounted', async () => {
    const { wrapper, state } = mountWithChild('<p>{{ state }}</p>', '\\(x\\)')
    wrapper.unmount()
    state.value = '\\(y\\)'
    await settle()
    expect(annotations(wrapper)).toEqual(['x'])
  })
})
