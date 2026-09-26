import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

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
