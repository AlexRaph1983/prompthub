'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { prisma } from '@/lib/prisma'
import type { Locale } from '@/i18n/index'

interface AddPromptPageProps {
  params: {
    locale: Locale;
  };
}

export default function AddPromptPage({ params }: AddPromptPageProps) {
  const { locale } = params;
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, signIn } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    lang: 'Русский',
    category: searchParams.get('category') || '',
    model: '',
    tags: '',
    license: 'CC-BY',
    prompt: '',
    example: '',
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      signIn();
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newPrompt = await response.json();
        console.log('Prompt created successfully:', newPrompt);
        router.push(`/${locale}/prompt/${newPrompt.id}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to create prompt:', errorData);
        alert('Ошибка при создании промпта: ' + (errorData.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Error creating prompt:', error);
      alert('Ошибка при создании промпта: ' + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('common.addPrompt')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Создайте новый промпт для сообщества
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Информация о промпте</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Название *
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Краткое и понятное название промпта"
                  required
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/60 символов
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Описание *
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Подробное описание того, что делает промпт"
                  required
                  maxLength={300}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/300 символов
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Модель ИИ *
                  </label>
                  <select
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Выберите модель</option>
                    <option value="GPT-4">GPT-4</option>
                    <option value="GPT-3.5">GPT-3.5</option>
                    <option value="Claude">Claude</option>
                    <option value="Gemini">Gemini</option>
                    <option value="Mistral">Mistral</option>
                    <option value="SUNO AI">SUNO AI</option>
                    <option value="any">Любая</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="lang" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Язык
                  </label>
                  <select
                    id="lang"
                    name="lang"
                    value={formData.lang}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Русский">Русский</option>
                    <option value="English">English</option>
                    <option value="multi">Мультиязычный</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Категория
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите категорию</option>
                  <option value="music">Музыка</option>
                  <option value="audio">Аудио</option>
                  <option value="video">Видео</option>
                  <option value="marketing">Написание текстов</option>
                  <option value="design">Дизайн</option>
                  <option value="code">Программирование</option>
                  <option value="seo">SEO</option>
                  <option value="business">Бизнес</option>
                  <option value="education">Обучение</option>
                  <option value="health">Здоровье</option>
                  <option value="creative">Творчество</option>
                  <option value="productivity">Продуктивность</option>
                  <option value="finance">Финансы</option>
                </select>
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Теги
                </label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="тег1, тег2, тег3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Разделяйте теги запятыми
                </p>
              </div>

              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Промпт *
                </label>
                <Textarea
                  id="prompt"
                  name="prompt"
                  value={formData.prompt}
                  onChange={handleChange}
                  placeholder="Введите сам промпт..."
                  required
                  rows={6}
                />
              </div>

              <div>
                <label htmlFor="example" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Пример использования
                </label>
                <Textarea
                  id="example"
                  name="example"
                  value={formData.example}
                  onChange={handleChange}
                  placeholder="Покажите, как использовать промпт на конкретном примере"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? 'Создание...' : 'Создать промпт'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}