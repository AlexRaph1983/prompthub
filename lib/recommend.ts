import { prisma as prismaClient } from '@/lib/prisma'
import type { PrismaClient } from '@prisma/client'

export type SparseVector = Record<string, number>

export type ContentFeatures = {
  tags: string[]
  category: string
  model: string
  lang: string
}

export function buildSparseVector(features: ContentFeatures): SparseVector {
  const vector: SparseVector = {}
  for (const tag of features.tags || []) {
    if (!tag) continue
    vector[`tag:${tag.toLowerCase()}`] = 1
  }
  if (features.category) vector[`cat:${features.category.toLowerCase()}`] = 1
  if (features.model) vector[`model:${features.model.toLowerCase()}`] = 1
  if (features.lang) vector[`lang:${features.lang.toLowerCase()}`] = 1
  // L2 normalize
  const norm = Math.sqrt(Object.values(vector).reduce((s, v) => s + v * v, 0)) || 1
  for (const k of Object.keys(vector)) vector[k] = vector[k] / norm
  return vector
}

export function cosineSimilarity(a: SparseVector, b: SparseVector): number {
  // dot(a,b) since both L2-normalized gives cosine directly
  let dot = 0
  const smaller = Object.keys(a).length < Object.keys(b).length ? a : b
  const larger = smaller === a ? b : a
  for (const k of Object.keys(smaller)) {
    const v = larger[k]
    if (typeof v === 'number') dot += smaller[k] * v
  }
  // clamp
  if (!isFinite(dot)) return 0
  return Math.max(0, Math.min(1, dot))
}

export function parseTags(tags: string | string[] | null | undefined): string[] {
  if (!tags) return []
  if (Array.isArray(tags)) return tags.filter(Boolean)
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

export function bayesianAverage(ratingAvg: number, ratingCount: number, globalAvg = 3.5, m = 5): number {
  // Weighted by m (prior strength)
  const R = Math.max(0, Math.min(5, ratingAvg || 0))
  const v = Math.max(0, ratingCount || 0)
  const C = Math.max(0, Math.min(5, globalAvg))
  const score = (v / (v + m)) * R + (m / (v + m)) * C
  return Number(score.toFixed(4))
}

export function normalizePopularity(values: number[], value: number): number {
  if (!values.length) return 0
  const max = Math.max(...values)
  if (max <= 0) return 0
  return Number((value / max).toFixed(6))
}

export type RankingInputs = {
  cosine: number
  popularityNorm: number
  bayesian: number
}

export function finalRankingScore({ cosine, popularityNorm, bayesian }: RankingInputs): number {
  const s = 0.65 * cosine + 0.2 * popularityNorm + 0.15 * (bayesian / 5)
  return Number(s.toFixed(6))
}

export type PromptLike = {
  id: string
  tags: string | string[]
  category: string
  model: string
  lang: string
  ratings?: { value: number }[]
  _count?: { likes?: number; saves?: number; comments?: number; ratings?: number }
  averageRating?: number | null
  totalRatings?: number | null
}

export function promptToVector(p: PromptLike): SparseVector {
  return buildSparseVector({
    tags: parseTags(p.tags),
    category: p.category,
    model: p.model,
    lang: p.lang,
  })
}

export function computePromptBayesian(p: PromptLike, globalAvg = 3.5, m = 5): number {
  const avg = typeof p.averageRating === 'number' && p.averageRating > 0
    ? p.averageRating
    : (p.ratings && p.ratings.length
        ? p.ratings.reduce((s, r) => s + r.value, 0) / p.ratings.length
        : 0)
  const cnt = typeof p.totalRatings === 'number' && p.totalRatings > 0
    ? p.totalRatings
    : (p._count?.ratings ?? p.ratings?.length ?? 0)
  return bayesianAverage(avg || 0, cnt || 0, globalAvg, m)
}

export function computePromptPopularity(p: PromptLike): number {
  const likes = p._count?.likes ?? 0
  const saves = p._count?.saves ?? 0
  const comments = p._count?.comments ?? 0
  const ratings = p._count?.ratings ?? p.totalRatings ?? 0
  // simple weighted sum
  return likes * 1 + saves * 1.2 + comments * 1.5 + ratings * 0.5
}

// ---------- TF-IDF for tags ----------

export type IdfDict = Record<string, number>

export function computeIdfForTags(prompts: PromptLike[]): IdfDict {
  const df: Record<string, number> = {}
  const N = prompts.length || 1
  for (const p of prompts) {
    const tags = new Set(parseTags(p.tags).map((t) => t.toLowerCase()))
    for (const t of tags) df[t] = (df[t] || 0) + 1
  }
  const idf: IdfDict = {}
  for (const [t, dft] of Object.entries(df)) {
    idf[t] = Math.log((N + 1) / (dft + 1)) + 1 // smoothed idf
  }
  return idf
}

export function buildSparseVectorTfidf(
  features: ContentFeatures,
  idf: IdfDict,
  weights: { tags?: number; category?: number; model?: number; lang?: number } = {}
): SparseVector {
  const wTags = weights.tags ?? 1
  const wCat = weights.category ?? 0.8
  const wModel = weights.model ?? 0.6
  const wLang = weights.lang ?? 0.5

  const vector: SparseVector = {}
  const tagCounts: Record<string, number> = {}
  for (const raw of features.tags || []) {
    const tag = raw.toLowerCase()
    if (!tag) continue
    tagCounts[tag] = (tagCounts[tag] || 0) + 1
  }
  for (const [tag, cnt] of Object.entries(tagCounts)) {
    const tf = 1 + Math.log(cnt)
    const idfVal = idf[tag] ?? 1
    vector[`tag:${tag}`] = wTags * tf * idfVal
  }
  if (features.category) vector[`cat:${features.category.toLowerCase()}`] = wCat
  if (features.model) vector[`model:${features.model.toLowerCase()}`] = wModel
  if (features.lang) vector[`lang:${features.lang.toLowerCase()}`] = wLang

  // L2 normalize
  const norm = Math.sqrt(Object.values(vector).reduce((s, v) => s + v * v, 0)) || 1
  for (const k of Object.keys(vector)) vector[k] = vector[k] / norm
  return vector
}

export async function recomputeAllPromptVectors(prisma: PrismaClient = prismaClient) {
  const prompts = await prisma.prompt.findMany({
    select: { id: true, tags: true, category: true, model: true, lang: true },
  })
  const idf = computeIdfForTags(
    prompts.map((p) => ({ id: p.id, tags: p.tags, category: p.category, model: p.model, lang: p.lang })) as any
  )
  for (const p of prompts) {
    const vec = buildSparseVectorTfidf(
      { tags: parseTags(p.tags), category: p.category, model: p.model, lang: p.lang },
      idf
    )
    await prisma.promptVector.upsert({
      where: { promptId: p.id },
      update: { vector: vec as any },
      create: { promptId: p.id, vector: vec as any },
    })
  }
  return { updated: prompts.length }
}



