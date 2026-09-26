import katex from 'katex'
import renderMathInElement from 'katex/contrib/auto-render'
import { isEqual, mergeOptions, snapshot } from '../utils/options'

const isObject = (value) => value !== null && typeof value === 'object'

// Per-element state: a snapshot of the last rendered input, and (auto mode)
// the child lists that auto-render replaced.
const elementState = new WeakMap()

/**
 * Work out what to render from the directive binding.
 */
const getInput = (binding, globalOptions) => {
  const { arg, value } = binding
  const localOptions = (isObject(value) && value.options) || {}
  const options = mergeOptions(globalOptions, localOptions)

  if (arg === 'auto') {
    return { arg, options }
  }

  if (arg === 'display') {
    options.displayMode = true
  }
  const expression = isObject(value) ? value.expression : value

  return {
    arg,
    expression: expression === undefined || expression === null ? '' : String(expression),
    options,
  }
}

/**
 * List the child nodes of `root` and of every element below it.
 */
const collectChildLists = (root) => {
  const lists = []
  const visit = (node) => {
    lists.push([node, Array.from(node.childNodes)])
    for (const child of node.children) {
      visit(child)
    }
  }
  visit(root)
  return lists
}

const sameNodes = (nodeList, nodes) =>
  nodeList.length === nodes.length && nodes.every((node, i) => nodeList[i] === node)

/**
 * Run auto-render on `el`, returning the original child lists it changed.
 *
 * Auto-render swaps the text nodes Vue created for rendered math. Keeping the
 * originals lets them be put back before Vue patches the element, so that Vue
 * updates the nodes it owns and the content can then be rendered again.
 */
const autoRender = (el, options) => {
  const before = collectChildLists(el)
  renderMathInElement(el, options)
  return before.filter(([parent, children]) => !sameNodes(parent.childNodes, children))
}

const render = (el, input) => {
  const state = { input: snapshot(input), replaced: [] }
  if (input.arg === 'auto') {
    state.replaced = autoRender(el, input.options)
  } else {
    katex.render(input.expression, el, input.options)
  }
  elementState.set(el, state)
}

const katexDirective = (globalOptions = {}) => ({
  name: 'katex',
  directive: {
    mounted(el, binding) {
      render(el, getInput(binding, globalOptions))
    },
    beforeUpdate(el) {
      // Put back the nodes auto-render replaced, so Vue patches the DOM it expects.
      const state = elementState.get(el)
      for (const [parent, children] of state.replaced) {
        parent.replaceChildren(...children)
      }
      state.replaced = []
    },
    updated(el, binding) {
      const input = getInput(binding, globalOptions)
      // Auto mode always renders again because the element's content may have
      // changed. Otherwise only render when the expression or options changed.
      if (input.arg !== 'auto' && isEqual(input, elementState.get(el).input)) {
        return
      }
      render(el, input)
    },
  },
})

export default katexDirective
