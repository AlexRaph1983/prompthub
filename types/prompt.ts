export interface Prompt {
  id: string
  title: string
  description: string
  model: string
  lang: string
  category: string
  tags: string[]
  rating: number
  ratingCount?: number
  likesCount?: number
  savesCount?: number
  commentsCount?: number
  license: 'CC-BY' | 'CC0' | 'Custom' | 'Paid'
  prompt: string
  author: string
  authorId?: string
  example?: string
  createdAt: string
  updatedAt?: string
  myRating?: number
  views?: number
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
  example?: string
}

export const PROMPT_MODELS = [
  // OpenAI
  "GPT-5", "OpenAI Sora",
  
  // Anthropic
  "Claude Opus 4.1",
  
  // Google
  "Gemini 2.5 Pro", "Gemini 2.5 Flash", "Gemini 2.5 Flash-Lite", "Google Veo 3",
  
  // Meta
  "Llama 3.1",
  
  // Mistral
  "Mistral Large",
  
  // DeepSeek
  "DeepSeek",
  
  // Music Generation
  "Suno", "AIVA",
  
  // Video Generation
  "Runway Gen-2"
] as const

export const PROMPT_CATEGORIES = [
  "Chat", "Code", "SEO", "Design", "Legal", "Education", "Image", "Video", "Music", 
  "Audio", "3D", "Animation", "Business", "Marketing", "Writing", "Translation", 
  "Research", "Analysis", "Creative", "Productivity", "Gaming", "Health", "Finance", "Cooking"
] as const

export const PROMPT_LANGS = ["English", "Русский", "Español", "Deutsch"] as const 

