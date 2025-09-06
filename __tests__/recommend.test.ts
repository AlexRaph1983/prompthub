import { describe, it, expect } from 'vitest'
import {
  buildSparseVector,
  cosineSimilarity,
  parseTags,
  bayesianAverage,
  computePromptBayesian,
  computePromptPopularity,
  finalRankingScore,
} from '@/lib/recommend'

describe('recommend core', () => {
  it('builds and normalizes sparse vectors', () => {
    const v = buildSparseVector({ tags: ['A', 'b'], category: 'Cat', model: 'GPT4', lang: 'EN' })
    const keys = Object.keys(v)
    expect(keys).toContain('tag:a')
    expect(keys).toContain('tag:b')
    expect(keys).toContain('cat:cat')
    expect(keys).toContain('model:gpt4')
    expect(keys).toContain('lang:en')
    const l2 = Math.sqrt(Object.values(v).reduce((s, x) => s + x * x, 0))
    expect(Number(l2.toFixed(6))).toBe(1)
  })

  it('cosine similarity behaves as expected', () => {
    const a = buildSparseVector({ tags: ['a', 'b'], category: 'x', model: 'm', lang: 'en' })
    const b = buildSparseVector({ tags: ['a', 'c'], category: 'y', model: 'm', lang: 'en' })
    const c = buildSparseVector({ tags: ['z'], category: 'q', model: 'k', lang: 'ru' })
    expect(cosineSimilarity(a, b)).toBeGreaterThan(cosineSimilarity(a, c))
  })

  it('parses tags', () => {
    expect(parseTags('a, b , c')).toEqual(['a', 'b', 'c'])
    expect(parseTags(['x', 'y'])).toEqual(['x', 'y'])
    expect(parseTags('')).toEqual([])
  })

  it('bayesian average reasonable', () => {
    expect(bayesianAverage(5, 1, 3.5, 5)).toBeLessThan(5)
    expect(bayesianAverage(5, 100, 3.5, 5)).toBeGreaterThan(bayesianAverage(5, 1, 3.5, 5))
  })

  it('prompt derived metrics', () => {
    const prompt = {
      id: 'p1',
      tags: 'a,b',
      category: 'x',
      model: 'm',
      lang: 'en',
      ratings: [{ value: 5 }, { value: 4 }],
      _count: { likes: 2, saves: 1, comments: 3, ratings: 2 },
    }
    const bayes = computePromptBayesian(prompt as any, 3.5, 5)
    const pop = computePromptPopularity(prompt as any)
    expect(bayes).toBeGreaterThan(0)
    expect(pop).toBeGreaterThan(0)
  })

  it('final ranking combines metrics', () => {
    const s1 = finalRankingScore({ cosine: 0.9, popularityNorm: 0.1, bayesian: 4.5 })
    const s2 = finalRankingScore({ cosine: 0.4, popularityNorm: 0.8, bayesian: 3.5 })
    // different tradeoffs
    expect(s1).not.toEqual(s2)
  })
})


