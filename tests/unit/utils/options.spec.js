import { describe, expect, it } from 'vitest'
import { isEqual, mergeOptions, snapshot } from '@/utils/options'

describe('mergeOptions', () => {
  it('lets local options override global ones', () => {
    expect(mergeOptions({ displayMode: false, errorColor: '#000' }, { displayMode: true })).toEqual({
      displayMode: true,
      errorColor: '#000',
    })
  })

  it('handles missing options', () => {
    expect(mergeOptions()).toEqual({})
    expect(mergeOptions({ displayMode: true })).toEqual({ displayMode: true })
  })

  it('concatenates arrays such as delimiters', () => {
    const merged = mergeOptions(
      { delimiters: [{ left: '$', right: '$' }] },
      { delimiters: [{ left: '|', right: '|' }] },
    )
    expect(merged.delimiters).toEqual([
      { left: '$', right: '$' },
      { left: '|', right: '|' },
    ])
  })

  it('replaces the global allowedProtocols with a local list', () => {
    const global = { allowedProtocols: ['http', 'https', 'javascript'] }
    expect(mergeOptions(global, { allowedProtocols: ['https'] }).allowedProtocols).toEqual(['https'])
    expect(mergeOptions(global, {}).allowedProtocols).toEqual(['http', 'https', 'javascript'])
  })

  it('does not share the local allowedProtocols array', () => {
    const local = { allowedProtocols: ['https'] }
    expect(mergeOptions({}, local).allowedProtocols).not.toBe(local.allowedProtocols)
  })

  it('passes a single macros object through unchanged', () => {
    const macros = { '\\RR': '\\mathbb{R}' }
    expect(mergeOptions({ macros }, {}).macros).toBe(macros)
    expect(mergeOptions({}, { macros }).macros).toBe(macros)
  })

  it('merges macros into a new object when both sides define them', () => {
    const globalMacros = { '\\RR': '\\mathbb{R}' }
    const localMacros = { '\\NN': '\\mathbb{N}' }
    const merged = mergeOptions({ macros: globalMacros }, { macros: localMacros })
    expect(merged.macros).toEqual({ '\\RR': '\\mathbb{R}', '\\NN': '\\mathbb{N}' })
    expect(merged.macros).not.toBe(globalMacros)
    expect(merged.macros).not.toBe(localMacros)
  })
})

describe('snapshot', () => {
  it('deep copies plain objects and arrays', () => {
    const fn = () => {}
    const value = { a: [1, { b: 2 }], fn }
    const copy = snapshot(value)
    expect(copy).toEqual(value)
    expect(copy).not.toBe(value)
    expect(copy.a).not.toBe(value.a)
    expect(copy.a[1]).not.toBe(value.a[1])
    expect(copy.fn).toBe(fn)
  })
})

describe('isEqual', () => {
  it('compares plain objects and arrays structurally', () => {
    expect(isEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true)
    expect(isEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 3 }] })).toBe(false)
    expect(isEqual([1, 2], [1, 2, 3])).toBe(false)
    expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
    expect(isEqual({ a: 1, b: undefined }, { a: 1, c: undefined })).toBe(false)
  })

  it('compares other values by identity', () => {
    expect(isEqual('x', 'x')).toBe(true)
    expect(
      isEqual(
        () => {},
        () => {},
      ),
    ).toBe(false)
    expect(isEqual([1], { 0: 1 })).toBe(false)
  })
})
