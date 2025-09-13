'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { X } from 'lucide-react'
import { usePromptStore } from '@/contexts/PromptStore'
import { PromptFormData, PROMPT_MODELS, PROMPT_CATEGORIES, PROMPT_LANGS } from '@/types/prompt'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export function AddPromptModal() {
  const { state, toggleModal, addPrompt } = usePromptStore()
  const { isAuthenticated, signIn } = useAuth()
  const router = useRouter()
  const t = useTranslations()
  const [formData, setFormData] = React.useState<PromptFormData>({
    title: '',
    description: '',
    lang: '',
    category: '',
    model: '',
    tags: '',
    license: 'CC-BY',
    prompt: '',
    instructions: '',
    example: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Form submitted:', formData)
    console.log('Is authenticated:', isAuthenticated)
    
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to sign in')
      signIn()
      return
    }

    try {
      console.log('Sending request to /api/prompts')
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        const newPrompt = await response.json()
        console.log('Prompt created successfully:', newPrompt)
        addPrompt(newPrompt)
        setFormData({
          title: '',
          description: '',
          lang: '',
          category: '',
          model: '',
          tags: '',
          license: 'CC-BY',
          prompt: '',
          instructions: '',
          example: '',
        })
        toggleModal()
      } else {
        const errorData = await response.json()
        console.error('Failed to create prompt:', errorData)
        alert('Ошибка при создании промпта: ' + (errorData.error || 'Неизвестная ошибка'))
      }
    } catch (error) {
      console.error('Error creating prompt:', error)
      alert('Ошибка при создании промпта: ' + error)
    }
  }

  if (!state.showModal) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4"
        onClick={toggleModal}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full flex flex-col gap-4 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={toggleModal}
            className="absolute right-4 top-4 text-gray-400 hover:text-violet-700 text-xl"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
          
          <h2 className="text-xl font-semibold mb-2">Добавить промпт</h2>
          
          {!isAuthenticated && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm">
                Для публикации промптов необходимо войти в систему
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input 
              required 
              name="title" 
              placeholder="Название промпта" 
              value={formData.title} 
              onChange={handleChange} 
            />
            
            <Input 
              required 
              name="description" 
              placeholder="Краткое описание" 
              value={formData.description} 
              onChange={handleChange} 
            />
            
            <div className="flex gap-2">
              <select 
                required 
                name="lang" 
                className="border rounded px-2 py-1 flex-1" 
                value={formData.lang} 
                onChange={handleChange}
              >
                <option value="">Язык</option>
                {PROMPT_LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              
              <select 
                required 
                name="model" 
                className="border rounded px-2 py-1 flex-1" 
                value={formData.model} 
                onChange={handleChange}
              >
                <option value="">AI-модель</option>
                {PROMPT_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            
            <select 
              required 
              name="category" 
              className="border rounded px-2 py-1" 
              value={formData.category} 
              onChange={handleChange}
            >
              <option value="">{t('add.category')}</option>
              {PROMPT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`categories.${c}`)}
                </option>
              ))}
            </select>
            
            <Input 
              name="tags" 
              placeholder="Теги (через запятую)" 
              value={formData.tags} 
              onChange={handleChange} 
            />
            
            <select 
              name="license" 
              className="border rounded px-2 py-1" 
              value={formData.license} 
              onChange={handleChange}
            >
              <option value="CC-BY">CC-BY</option>
              <option value="CC0">CC0</option>
              <option value="Custom">Custom</option>
              <option value="Paid">Платно</option>
            </select>
            
            <Textarea 
              required 
              name="prompt" 
              placeholder="Текст промпта" 
              value={formData.prompt} 
              onChange={handleChange} 
            />
            
            <Textarea 
              name="instructions" 
              placeholder="Инструкция по применению (опционально)" 
              value={formData.instructions} 
              onChange={handleChange} 
            />
            
            <Button type="submit" className="bg-violet-600 text-white rounded-xl">
              {isAuthenticated ? 'Опубликовать' : 'Войти и опубликовать'}
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
} 