'use client'

import { useState } from 'react'

export default function AddSunoPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const addSunoPrompts = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const response = await fetch('/api/add-suno-prompts', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResult(`✅ ${data.message}`)
      } else {
        setResult(`❌ Ошибка: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Ошибка: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Добавить SUNO промпты</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">10 профессиональных SUNO промптов:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li>Modern Pop Anthem</li>
          <li>Atmospheric Hip-Hop</li>
          <li>Festival EDM Banger</li>
          <li>Emotional Pop Ballad</li>
          <li>Latin Pop Groove</li>
          <li>K-Pop Fusion</li>
          <li>Arena Rock Anthem</li>
          <li>Dream-Pop Texture</li>
          <li>Trap Club Heater</li>
          <li>Funk-Pop Revival</li>
        </ul>
      </div>

      <button
        onClick={addSunoPrompts}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Добавление...' : 'Добавить SUNO промпты'}
      </button>

      {result && (
        <div className={`mt-4 p-3 rounded-md ${
          result.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {result}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold mb-2">Информация:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Промпты на английском языке</li>
          <li>• Описания и теги на русском</li>
          <li>• Автор: SUNO Master</li>
          <li>• Лицензия: CC-BY</li>
          <li>• Категория: Music</li>
        </ul>
      </div>
    </div>
  )
}
