import merge from 'deepmerge'

// Array options where a local value replaces the global one, rather than being
// concatenated with it. This lets a component narrow a global allow-list.
const REPLACED_ARRAY_OPTIONS = ['allowedProtocols']

const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]'

/**
 * Merge global and local KaTeX options. Local options take precedence; objects
 * and arrays are merged, except for the options in REPLACED_ARRAY_OPTIONS.
 *
 * If only one side defines `macros`, that object is passed through as is (not
 * copied) so that `\gdef` can add to it, as the KaTeX documentation describes.
 *
 * @param {Object} [globalOptions]
 * @param {Object} [localOptions]
 * @returns {Object}
 */
export const mergeOptions = (globalOptions = {}, localOptions = {}) => {
  const merged = merge(globalOptions, localOptions)

  for (const key of REPLACED_ARRAY_OPTIONS) {
    if (Array.isArray(localOptions[key])) {
      merged[key] = [...localOptions[key]]
    }
  }

  const globalMacros = globalOptions.macros
  const localMacros = localOptions.macros
  if (globalMacros && !localMacros) {
    merged.macros = globalMacros
  } else if (localMacros && !globalMacros) {
    merged.macros = localMacros
  }

  return merged
}

/**
 * Copy plain objects and arrays deeply; other values are kept by reference.
 *
 * @param {*} value
 * @returns {*}
 */
export const snapshot = (value) => {
  if (Array.isArray(value)) {
    return value.map(snapshot)
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, snapshot(item)]))
  }
  return value
}

/**
 * Structural equality for plain objects and arrays; other values are compared
 * by identity.
 *
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
export const isEqual = (a, b) => {
  if (a === b) {
    return true
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => isEqual(item, b[index]))
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a)
    return (
      keys.length === Object.keys(b).length &&
      keys.every((key) => Object.prototype.hasOwnProperty.call(b, key) && isEqual(a[key], b[key]))
    )
  }
  return false
}
