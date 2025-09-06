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
  // OpenAI
  "GPT-4o", "GPT-4o-mini", "GPT-4", "GPT-3.5-turbo", "DALL-E 3", "DALL-E 2",
  
  // Anthropic
  "Claude 3.5 Sonnet", "Claude 3 Opus", "Claude 3 Sonnet", "Claude 3 Haiku", "Claude 2.1",
  
  // Google
  "Gemini 1.5 Pro", "Gemini 1.5 Flash", "Gemini Pro", "Gemini Ultra", "Imagen 3",
  
  // Meta
  "Llama 3.1 405B", "Llama 3.1 70B", "Llama 3.1 8B", "Code Llama", "Llama 2",
  
  // Microsoft
  "Copilot", "Bing Chat", "Phi-3", "Orca-2",
  
  // Image Generation
  "Midjourney v6", "Midjourney v5.2", "Stable Diffusion XL", "Stable Diffusion 3", "Adobe Firefly",
  
  // Video Generation
  "Sora", "Runway Gen-3", "Pika Labs", "Stable Video Diffusion", "Veo",
  
  // Audio/Music
  "Suno v3", "Udio", "ElevenLabs", "Murf", "Synthesia",
  
  // Specialized
  "Perplexity", "Character.AI", "Replika", "Jasper", "Copy.ai"
] as const

export const PROMPT_CATEGORIES = [
  "Chat", "Code", "SEO", "Design", "Legal", "Education", "Image", "Video", "Music", 
  "Audio", "3D", "Animation", "Business", "Marketing", "Writing", "Translation", 
  "Research", "Analysis", "Creative", "Productivity", "Gaming", "Health", "Finance"
] as const

export const PROMPT_LANGS = ["English", "Русский", "Español", "Deutsch"] as const 