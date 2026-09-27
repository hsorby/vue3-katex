import katex from 'katex'
import renderMathInElement from 'katex/contrib/auto-render'
import { isEqual, mergeOptions, snapshot } from '../utils/options'

const isObject = (value) => value !== null && typeof value === 'object'

// Per-element state:
// - input: a snapshot of the last rendered input (to skip unchanged updates)
// - options: the options last rendered with
// - records (auto mode): each run of text auto-render replaced, as
//   { parent, removed, removedText, created }
// - observer (auto mode): watches for changes made outside the directive,
//   e.g. by a child component updating itself
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

// Auto-render only ever replaces text nodes, so `removed` nodes are all text.
const textOf = (nodes) => nodes.map((node) => node.data)

/**
 * Put back the text nodes auto-render replaced, removing what it created.
 *
 * A record is dropped without restoring if its content is no longer there: the
 * rendered nodes have been replaced by someone else (e.g. a child component
 * set new content), so the element now holds nodes Vue owns.
 *
 * With `onlyChangedText`, a record is only restored if one of its text nodes
 * has been written to since (by a component updating that node while it was
 * out of the page); other records are kept.
 */
const restore = (el, state, { onlyChangedText = false } = {}) => {
  const kept = []
  // Newest first, so content replaced by several passes ends up at its original.
  for (const record of [...state.records].reverse()) {
    const { parent, removed, removedText, created } = record
    if (!el.contains(parent) || created[0].parentNode !== parent) {
      continue
    }
    if (onlyChangedText && isEqual(textOf(removed), removedText)) {
      kept.unshift(record)
      continue
    }
    for (const node of removed) {
      parent.insertBefore(node, created[0])
    }
    for (const node of created) {
      node.remove()
    }
  }
  state.records = kept
}

/**
 * Compare a parent's child list before and after auto-render, returning each
 * run of original nodes it removed together with the nodes it put in their place.
 */
const replacedRuns = (parent, original) => {
  const rendered = Array.from(parent.childNodes)
  const kept = new Set(rendered)
  const runs = []
  let removed = []
  let created = []
  let next = 0
  const endRun = () => {
    if (removed.length && created.length) {
      runs.push({ parent, removed, removedText: textOf(removed), created })
    }
    removed = []
    created = []
  }
  for (const node of original) {
    if (!kept.has(node)) {
      removed.push(node)
      continue
    }
    while (rendered[next] !== node) {
      created.push(rendered[next++])
    }
    next++
    endRun()
  }
  created.push(...rendered.slice(next))
  endRun()
  return runs
}

/**
 * Watch `el` for changes made outside the directive. Text nodes auto-render
 * replaced are no longer inside `el`, so they are watched directly: a child
 * component may still write to them.
 */
const watch = (el, state) => {
  const { observer } = state
  observer.disconnect()
  observer.observe(el, { childList: true, characterData: true, subtree: true })
  for (const { removed } of state.records) {
    for (const node of removed) {
      observer.observe(node, { characterData: true })
    }
  }
}

/**
 * Run `fn` with the empty text nodes under `root` swapped for comments.
 *
 * Auto-render removes empty text nodes, but Vue uses them to mark where lists
 * and fragments go (e.g. `v-for`); without them Vue cannot add items. Comments
 * are skipped by auto-render, so the markers survive.
 */
const withEmptyTextKept = (root, fn) => {
  const doc = root.ownerDocument
  const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */)
  const swapped = []
  while (walker.nextNode()) {
    if (walker.currentNode.data === '') {
      swapped.push([walker.currentNode, doc.createComment('')])
    }
  }
  for (const [text, comment] of swapped) {
    text.replaceWith(comment)
  }
  fn()
  for (const [text, comment] of swapped) {
    comment.replaceWith(text)
  }
}

/**
 * Run auto-render on `el`, recording the child lists it changed.
 *
 * Auto-render swaps the text nodes Vue created for rendered math. Keeping the
 * originals lets them be put back before Vue patches the element, so that Vue
 * updates the nodes it owns and the content can then be rendered again.
 */
const autoRender = (el, state) => {
  const before = collectChildLists(el)
  // Skip math that is already rendered, as happens on the observer's passes.
  const ignoredClasses = [...(state.options.ignoredClasses || []), 'katex']
  withEmptyTextKept(el, () => renderMathInElement(el, { ...state.options, ignoredClasses }))
  for (const [parent, original] of before) {
    if (!sameNodes(parent.childNodes, original)) {
      state.records.push(...replacedRuns(parent, original))
    }
  }
  // Also discards the mutation records from this render.
  watch(el, state)
}

const render = (el, input) => {
  const state = elementState.get(el) || { records: [], observer: null }
  state.input = snapshot(input)
  state.options = input.options

  if (input.arg === 'auto') {
    if (!state.observer) {
      state.observer = new MutationObserver(() => {
        // Content changed outside a directive update: render what is new.
        restore(el, state, { onlyChangedText: true })
        autoRender(el, state)
      })
    }
    autoRender(el, state)
  } else {
    if (state.observer) {
      state.observer.disconnect()
      state.observer = null
    }
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
      restore(el, elementState.get(el))
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
    unmounted(el) {
      const { observer } = elementState.get(el)
      if (observer) {
        observer.disconnect()
      }
    },
  },
})

export default katexDirective
