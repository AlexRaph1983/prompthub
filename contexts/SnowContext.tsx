'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type SnowContextValue = {
  enabled: boolean
  hydrated: boolean
  toggle: () => void
}

const SnowContext = createContext<SnowContextValue | undefined>(undefined)

const STORAGE_KEY = 'prompt-hub:snow-enabled'

export function SnowProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  // Инициализация из localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        setEnabled(stored === '1')
      }
    } catch {
      // noop
    }
    setHydrated(true)
  }, [])

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  return (
    <SnowContext.Provider value={{ enabled, hydrated, toggle }}>
      {children}
    </SnowContext.Provider>
  )
}

export function useSnow() {
  const ctx = useContext(SnowContext)
  if (!ctx) throw new Error('useSnow must be used within SnowProvider')
  return ctx
}
