import type { App, Component, Directive } from 'vue'
import type { KatexOptions } from 'katex'

export interface Vue3KatexOptions {
  /** KaTeX options applied to every `v-katex` directive and `KatexElement`. */
  katexOptions?: KatexOptions
}

/** Value accepted by the `v-katex` directive. */
export type KatexDirectiveValue =
  | string
  | number
  | null
  | undefined
  | {
      expression?: string | number | null
      options?: KatexOptions & Record<string, unknown>
    }

/** Install the `v-katex` directive and the `KatexElement` component. */
export declare function install(app: App, options?: Vue3KatexOptions): void

/** Component that renders a TeX `expression` with KaTeX. */
export declare const KatexElement: Component

/** Create the `v-katex` directive with the given global KaTeX options. */
export declare function katexDirective(globalOptions?: KatexOptions): {
  name: 'katex'
  directive: Directive<HTMLElement, KatexDirectiveValue>
}

declare const Vue3Katex: {
  install: typeof install
}
export default Vue3Katex
