'use client'

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { Prompt, PromptFormData } from '@/types/prompt'
import { DEMO_PROMPTS } from '@/data/demoPrompts'
import { useAuth } from '@/hooks/useAuth'

interface PromptState {
  prompts: Prompt[]
  showModal: boolean
  searchQuery: string
  selectedModel: string
  selectedCategory: string
  selectedLang: string
  isLoading: boolean
}

type PromptAction =
  | { type: 'SET_PROMPTS'; payload: Prompt[] }
  | { type: 'ADD_PROMPT'; payload: Prompt }
  | { type: 'UPDATE_PROMPT_RATING'; payload: { promptId: string; rating: number; ratingCount: number } }
  | { type: 'UPDATE_PROMPT_VIEWS'; payload: { promptId: string; views: number } }
  | { type: 'TOGGLE_MODAL' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILTER'; payload: { key: string; value: string } }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_LOADING'; payload: boolean }

const initialState: PromptState = {
  prompts: [],
  showModal: false,
  searchQuery: '',
  selectedModel: '',
  selectedCategory: '',
  selectedLang: '',
  isLoading: true,
}

function promptReducer(state: PromptState, action: PromptAction): PromptState {
  switch (action.type) {
    case 'SET_PROMPTS':
      return {
        ...state,
        prompts: action.payload,
        isLoading: false,
      }
    case 'ADD_PROMPT':
      return {
        ...state,
        prompts: [action.payload, ...state.prompts],
      }
    case 'UPDATE_PROMPT_RATING': {
      const { promptId, rating, ratingCount } = action.payload
      return {
        ...state,
        prompts: state.prompts.map(p => p.id === promptId ? { ...p, rating, ratingCount } : p),
      }
    }
    case 'UPDATE_PROMPT_VIEWS': {
      const { promptId, views } = action.payload
      return {
        ...state,
        prompts: state.prompts.map(p => p.id === promptId ? { ...p, views } : p),
      }
    }
    case 'TOGGLE_MODAL':
      return {
        ...state,
        showModal: !state.showModal,
      }
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      }
    case 'SET_FILTER':
      return {
        ...state,
        [action.payload.key]: action.payload.value,
      }
    case 'RESET_FILTERS':
      return {
        ...state,
        searchQuery: '',
        selectedModel: '',
        selectedCategory: '',
        selectedLang: '',
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }
    default:
      return state
  }
}

interface PromptContextType {
  state: PromptState
  dispatch: React.Dispatch<PromptAction>
  addPrompt: (formData: PromptFormData) => Promise<void>
  toggleModal: () => void
  getFilteredPrompts: () => Prompt[]
  loadPrompts: () => Promise<void>
}

const PromptContext = createContext<PromptContextType | undefined>(undefined)

export function PromptProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(promptReducer, initialState)
  const { isAuthenticated } = useAuth()

  const normalizePromptViews = (prompt: any) => {
    const value = typeof prompt?.views === 'number' ? prompt.views : 0
    return { ...prompt, views: value }
  }

  const loadPrompts = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      console.log('Loading prompts from API...')
      const response = await fetch('/api/prompts?limit=50')
      console.log('API response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Loaded prompts data:', data)
        // Новый API возвращает объект с items, а не массив
        const prompts = data.items || data || []
        const normalized = Array.isArray(prompts) ? prompts.map(normalizePromptViews) : []
        dispatch({ type: 'SET_PROMPTS', payload: normalized })
      } else {
        console.log('API failed, using demo prompts')
        // Fallback to demo prompts if API fails
        dispatch({ type: 'SET_PROMPTS', payload: DEMO_PROMPTS.map(normalizePromptViews) })
      }
    } catch (error) {
      console.error('Error loading prompts:', error)
      // Fallback to demo prompts
      dispatch({ type: 'SET_PROMPTS', payload: DEMO_PROMPTS.map(normalizePromptViews) })
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadPrompts()
    }
  }, [])

  const addPrompt = async (formData: PromptFormData) => {
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newPrompt = await response.json()
        dispatch({ type: 'ADD_PROMPT', payload: newPrompt })
      } else {
        console.error('Failed to create prompt')
      }
    } catch (error) {
      console.error('Error creating prompt:', error)
    }
  }

  const toggleModal = () => {
    dispatch({ type: 'TOGGLE_MODAL' })
  }

  const getFilteredPrompts = (): Prompt[] => {
    const search = state.searchQuery.trim().toLowerCase()

    const normalizeModel = (value: string): string =>
      value?.toString().toLowerCase().replace(/[^a-z0-9]/g, '') || ''

    const langToCode = (value: string): string => {
      const v = value?.toString().toLowerCase()
      const map: Record<string, string> = {
        english: 'en', en: 'en',
        'русский': 'ru', ru: 'ru', rus: 'ru',
        español: 'es', espanol: 'es', es: 'es', spanish: 'es',
        deutsch: 'de', german: 'de', de: 'de',
      }
      return map[v] || v || ''
    }

    const selectedModel = normalizeModel(state.selectedModel)
    const selectedLang = langToCode(state.selectedLang)

    return state.prompts.filter(prompt => {
      const matchesSearch = !search ||
        prompt.title.toLowerCase().includes(search) ||
        prompt.description.toLowerCase().includes(search) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(search))

      const matchesModel = !selectedModel || normalizeModel(prompt.model) === selectedModel
      const matchesCategory = !state.selectedCategory || prompt.tags.map(t => t.toLowerCase()).includes(state.selectedCategory.toLowerCase())
      const matchesLang = !selectedLang || langToCode(prompt.lang) === selectedLang

      return matchesSearch && matchesModel && matchesCategory && matchesLang
    })
  }

  return (
    <PromptContext.Provider value={{
      state,
      dispatch,
      addPrompt,
      toggleModal,
      getFilteredPrompts,
      loadPrompts,
    }}>
      {children}
    </PromptContext.Provider>
  )
}

export function usePromptStore() {
  const context = useContext(PromptContext)
  if (context === undefined) {
    throw new Error('usePromptStore must be used within a PromptProvider')
  }
  return context
} 
