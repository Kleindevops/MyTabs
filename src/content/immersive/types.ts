/**
 * 沉浸式翻译 Content Script 类型定义
 */

export interface ImmersiveConfig {
  enabled: boolean
  targetLang: string
  bilingualStyle: 'dashed' | 'block' | 'highlight'
  selectionTranslate: boolean
  tripleSpaceTranslate: boolean
}

export type BilingualDisplayState = 'idle' | 'translating' | 'showing' | 'hidden'

export interface TranslatableNodeWrapper {
  id: string
  element: HTMLElement
  originalText: string
  translatedText?: string
  transElement?: HTMLElement | null
  status: 'pending' | 'in_progress' | 'done' | 'failed'
}
