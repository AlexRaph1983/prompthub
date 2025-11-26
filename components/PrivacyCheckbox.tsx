'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface PrivacyCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  locale?: string
  error?: boolean
}

export default function PrivacyCheckbox({ 
  checked, 
  onChange, 
  locale = 'ru',
  error = false 
}: PrivacyCheckboxProps) {
  const t = useTranslations('privacyCheckbox')

  return (
    <div className="space-y-2">
      <div className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-colors ${
        error 
          ? 'border-red-300 bg-red-50' 
          : checked 
            ? 'border-violet-300 bg-violet-50' 
            : 'border-gray-200 bg-white'
      }`}>
        <input
          type="checkbox"
          id="privacy-consent"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-5 w-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500 focus:ring-2 cursor-pointer"
        />
        <label 
          htmlFor="privacy-consent" 
          className="text-sm text-gray-700 leading-relaxed cursor-pointer select-none"
        >
          {t('text')}{' '}
          <Link 
            href={`/${locale}/privacy`}
            target="_blank"
            className="text-violet-600 hover:text-violet-700 underline font-medium"
          >
            {t('privacyPolicyLink')}
          </Link>
          {' '}{t('and')}{' '}
          <span className="text-gray-900 font-medium">{t('dataProcessing')}</span>.
          {' '}{t('including')}{' '}
          <span className="text-gray-900">{t('dataTypes')}</span>.
        </label>
      </div>
      
      {error && (
        <p className="text-sm text-red-600 font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {t('required')}
        </p>
      )}

      {/* Дополнительная информация */}
      {checked && (
        <div className="text-xs text-gray-500 pl-8 animate-in fade-in duration-200">
          ✓ {t('confirmation')}
        </div>
      )}
    </div>
  )
}

