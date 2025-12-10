'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PROMPT_CATEGORIES, PROMPT_LANGS, PROMPT_MODELS } from '@/types/prompt'
import { Loader2, Pencil, Save, X, ExternalLink } from 'lucide-react'

type PromptRow = {
  id: string
  title: string
  description: string
  prompt: string
  model: string
  lang: string
  category: string
  license: string
  tags: string
  createdAt: string
  updatedAt: string | null
}

type Props = {
  prompts: PromptRow[]
}

export default function MyPromptsClient({ prompts }: Props) {
  const [items, setItems] = React.useState<PromptRow[]>(() => prompts)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<PromptRow | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const startEdit = (prompt: PromptRow) => {
    setEditingId(prompt.id)
    setForm({
      ...prompt,
      tags: normalizeTags(prompt.tags),
    })
    setError(null)
    setSuccess(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(null)
    setError(null)
    setSuccess(null)
  }

  const handleChange = (field: keyof PromptRow, value: string) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleSave = async () => {
    if (!form || !editingId) return
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/prompts/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          prompt: form.prompt,
          model: form.model,
          lang: form.lang,
          category: form.category,
          tags: form.tags,
          license: form.license,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Не удалось сохранить изменения')
      }

      const updated = await response.json()
      const normalized = normalizePrompt(updated)

      setItems((prev) =>
        prev.map((item) => (item.id === editingId ? normalized : item))
      )
      setSuccess('Сохранено')
      setEditingId(null)
      setForm(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Мои промпты</h1>
          <p className="text-gray-600 mt-2">Управление вашими опубликованными промптами</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет опубликованных промптов</h3>
              <p className="text-gray-500">Создайте свой первый промпт, чтобы он появился здесь</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Мои промпты</h1>
        <p className="text-gray-600 mt-2">Редактируйте текст, категорию, переменные/теги и сохраняйте изменения на уровне профиля.</p>
        {success && <p className="text-green-600 mt-2">{success}</p>}
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      <div className="grid gap-6">
        {items.map((prompt) => {
          const isEditing = editingId === prompt.id
          const formState = isEditing && form ? form : prompt

          return (
            <Card key={prompt.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">{prompt.title}</CardTitle>
                    <p className="text-gray-600 mt-2">{prompt.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      <span>Создан: <time suppressHydrationWarning>{new Date(prompt.createdAt).toISOString().slice(0, 10)}</time></span>
                      {prompt.updatedAt && (
                        <span>Обновлён: <time suppressHydrationWarning>{new Date(prompt.updatedAt).toISOString().slice(0, 10)}</time></span>
                      )}
                      <Link href={`/prompt/${prompt.id}`} className="inline-flex items-center gap-1 text-violet-700 hover:underline">
                        <ExternalLink className="w-4 h-4" /> Открыть
                      </Link>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>
                          <X className="w-4 h-4 mr-1" /> Отмена
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saving}>
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                          Сохранить
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => startEdit(prompt)}>
                        <Pencil className="w-4 h-4 mr-1" /> Редактировать
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <Input
                      value={formState.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="Название"
                      required
                    />
                    <Textarea
                      value={formState.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Краткое описание"
                      required
                    />
                    <Textarea
                      value={formState.prompt}
                      onChange={(e) => handleChange('prompt', e.target.value)}
                      placeholder="Текст промпта"
                      required
                      className="min-h-[140px]"
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm text-gray-700">Категория</label>
                        <select
                          className="border rounded px-2 py-2 w-full"
                          value={formState.category}
                          onChange={(e) => handleChange('category', e.target.value)}
                          required
                        >
                          <option value="">Выберите категорию</option>
                          {PROMPT_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-gray-700">Язык</label>
                        <select
                          className="border rounded px-2 py-2 w-full"
                          value={formState.lang}
                          onChange={(e) => handleChange('lang', e.target.value)}
                          required
                        >
                          <option value="">Выберите язык</option>
                          {PROMPT_LANGS.map((l) => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-gray-700">Модель</label>
                        <select
                          className="border rounded px-2 py-2 w-full"
                          value={formState.model}
                          onChange={(e) => handleChange('model', e.target.value)}
                          required
                        >
                          <option value="">Выберите модель</option>
                          {PROMPT_MODELS.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-gray-700">Лицензия</label>
                        <select
                          className="border rounded px-2 py-2 w-full"
                          value={formState.license}
                          onChange={(e) => handleChange('license', e.target.value)}
                          required
                        >
                          <option value="CC-BY">CC-BY</option>
                          <option value="CC-BY-SA">CC-BY-SA</option>
                          <option value="CC0">CC0</option>
                          <option value="Custom">Custom</option>
                          <option value="Paid">Платно</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-700">Переменные / теги (через запятую)</label>
                      <Input
                        value={formState.tags}
                        onChange={(e) => handleChange('tags', e.target.value)}
                        placeholder="topic, tone, audience"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Промпт</h4>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{prompt.prompt}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{prompt.category}</Badge>
                      <Badge variant="outline">{prompt.lang}</Badge>
                      <Badge variant="outline">{prompt.model}</Badge>
                      <Badge variant="outline">{prompt.license}</Badge>
                    </div>

                    {prompt.tags && (
                      <div className="text-sm text-gray-600">
                        Теги: {normalizeTags(prompt.tags)}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function normalizePrompt(p: any): PromptRow {
  const created = p.createdAt ? new Date(p.createdAt) : new Date()
  const updated = p.updatedAt ? new Date(p.updatedAt) : null

  return {
    id: p.id,
    title: p.title,
    description: p.description,
    prompt: p.prompt,
    model: p.model,
    lang: p.lang,
    category: p.category,
    license: p.license,
    tags: typeof p.tags === 'string' ? p.tags : Array.isArray(p.tags) ? p.tags.join(',') : '',
    createdAt: created.toISOString(),
    updatedAt: updated ? updated.toISOString() : null,
  }
}

function normalizeTags(tags: string) {
  return tags
    ? tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .join(', ')
    : ''
}

