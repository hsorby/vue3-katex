<!-- Not <component :is> with v-html: Vue's SSR compiler drops the v-html there. -->
<template>
  <div v-if="displayMode" v-html="math" />
  <span v-else v-html="math" />
</template>

<script>
export default {
  name: 'KatexElement',
}
</script>

<script setup>
import { computed, inject } from 'vue'
import katex from 'katex'
import { mergeOptions } from '../utils/options'

// Unlike KaTeX itself, the component does not throw on invalid TeX by default:
// the error is rendered in `errorColor` instead. Set `throwOnError` to change this.
const DEFAULT_OPTIONS = { throwOnError: false }

const removeUndefined = (obj) => {
  const newObj = {}
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] !== 'undefined') {
      newObj[key] = obj[key]
    }
  }
  return newObj
}

const props = defineProps({
  expression: {
    type: String,
    required: true,
  },
  displayMode: {
    type: Boolean,
    default: undefined,
  },
  throwOnError: {
    type: Boolean,
    default: undefined,
  },
  errorColor: {
    type: String,
    default: undefined,
  },
  macros: {
    type: Object,
    default: undefined,
  },
  colorIsTextColor: {
    type: Boolean,
    default: undefined,
  },
  maxSize: {
    type: Number,
    default: undefined,
  },
  maxExpand: {
    type: Number,
    default: undefined,
  },
  allowedProtocols: {
    type: Array,
    default: undefined,
  },
  strict: {
    type: [Boolean, String, Function],
    default: undefined,
  },
})

const globalOptions = inject('$katexOptions', {})

const options = computed(() => {
  return mergeOptions(
    { ...DEFAULT_OPTIONS, ...globalOptions },
    removeUndefined({
      displayMode: props.displayMode,
      throwOnError: props.throwOnError,
      errorColor: props.errorColor,
      macros: props.macros,
      colorIsTextColor: props.colorIsTextColor,
      maxSize: props.maxSize,
      maxExpand: props.maxExpand,
      allowedProtocols: props.allowedProtocols,
      strict: props.strict,
    }),
  )
})

const math = computed(() => {
  return katex.renderToString(props.expression, options.value)
})
</script>
