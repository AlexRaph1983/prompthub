export interface Prompt {
  id: string
  title: string
  description: string
  model: string
  lang: string
  tags: string[]
  rating: number
  ratingCount?: number
  license: 'CC-BY' | 'CC0' | 'Custom' | 'Paid'
  prompt: string
  author: string
  authorId?: string
  instructions?: string
  example?: string
  createdAt: string
  updatedAt?: string
  myRating?: number
}

export interface PromptFormData {
  title: string
  description: string
  lang: string
  category: string
  model: string
  tags: string
  license: 'CC-BY' | 'CC0' | 'Custom' | 'Paid'
  prompt: string
  instructions?: string
  example?: string
}

export const PROMPT_MODELS = [
  "GPT-4o", "GPT-4", "Claude 3", "Midjourney", "Stable Diffusion", "DALL-E", "Veo", "Suno"
] as const

export const PROMPT_CATEGORIES = [
  "Chat", "Code", "SEO", "Design", "Legal", "Education", "Image", "Video", "Music"
] as const

export const PROMPT_LANGS = ["English", "Русский", "Español", "Deutsch"] as const 