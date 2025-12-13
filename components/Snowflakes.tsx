'use client'

import { useEffect, useState } from 'react'
import { useSnow } from '@/contexts/SnowContext'

interface Snowflake {
  id: number
  left: number
  delay: number
  duration: number
  size: number
  opacity: number
  drift: number
  color: string
}

export function Snowflakes() {
  const { enabled, hydrated } = useSnow()
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([])
  const [styles, setStyles] = useState<string>('')

  useEffect(() => {
    const palette = ['#cfe8ff', '#b7d7ff', '#e6f4ff']
    const isMobile =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(pointer: coarse)').matches ||
        window.matchMedia?.('(max-width: 768px)').matches)

    // На мобильных меньше снежинок, чтобы не лагало при скролле
    const count = isMobile ? 40 : 70

    const flakes: Snowflake[] = Array.from({ length: count }, (_, i) => {
      const size = 4 + Math.random() * 6 // Размер снежинки (4-10px)
      // Чем меньше размер, тем медленнее падает (имитация глубины/парралакса)
      const base = 12 + Math.random() * 6 // 12-18
      const factor = 10 / size // до ~2.5 для мелких
      const duration = base * factor + 8 // ~20-45s для мелких, быстрее для крупных

      return {
        id: i,
        left: Math.random() * 100, // Позиция по горизонтали (0-100%)
        delay: Math.random() * 5, // Задержка начала анимации (0-5s)
        size,
        duration,
        opacity: 0.3 + Math.random() * 0.5, // Прозрачность (0.3-0.8)
        drift: (Math.random() - 0.5) * 40, // Дрейф влево/вправо (-20px до +20px)
        color: palette[Math.floor(Math.random() * palette.length)]
      }
    })
    setSnowflakes(flakes)

    // Генерируем CSS для анимаций
    const css = flakes.map((flake) => `
      @keyframes snowfall-${flake.id} {
        0% {
          transform: translate3d(0, 0, 0) rotate(0deg);
        }
        25% {
          transform: translate3d(${flake.drift * 0.25}px, 25vh, 0) rotate(90deg);
        }
        50% {
          transform: translate3d(${flake.drift * 0.5}px, 50vh, 0) rotate(180deg);
        }
        75% {
          transform: translate3d(${flake.drift * 0.75}px, 75vh, 0) rotate(270deg);
        }
        100% {
          transform: translate3d(${flake.drift}px, 100vh, 0) rotate(360deg);
        }
      }
    `).join('\n')

    setStyles(css)
  }, [])

  // Избегаем рассинхрона SSR/CSR: пока не знаем состояние (до hydration) — не рисуем
  if (!hydrated || !enabled) return null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {/* Снег за блоками: ниже контента, выше фона */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute text-white select-none"
            style={{
              left: `${flake.left}%`,
              fontSize: `${flake.size}px`,
              opacity: flake.opacity,
              animation: `snowfall-${flake.id} ${flake.duration}s linear ${flake.delay}s infinite`,
              top: '-10px',
              color: flake.color,
              willChange: 'transform'
            }}
          >
            ❄
          </div>
        ))}
      </div>
    </>
  )
}

