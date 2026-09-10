/**
 * Phase 10 — AI Provider Factory
 *
 * Returns the configured AI provider based on environment variables.
 * Defaults to the mock provider for local development.
 *
 * Usage:
 *   import { getAIProvider } from '@/lib/ai/provider'
 *   const ai = getAIProvider()
 *   const result = await ai.classifyContent(text)
 */

import type { ModerationAIProvider } from './types'
import { MockAIProvider } from './providers/mockProvider'

let _cachedProvider: ModerationAIProvider | null = null

export function getAIProvider(): ModerationAIProvider {
  if (_cachedProvider) return _cachedProvider

  const providerName = process.env.AI_PROVIDER || 'mock'

  switch (providerName) {
    case 'mock':
      _cachedProvider = new MockAIProvider()
      break
    // Future: case 'openai': ...
    default:
      console.warn(`[AI] Unknown provider "${providerName}", falling back to mock.`)
      _cachedProvider = new MockAIProvider()
  }

  return _cachedProvider
}
