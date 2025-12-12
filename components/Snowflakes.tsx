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
  const { enabled } = useSnow()
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([])
  const [styles, setStyles] = useState<string>('')
  const [parallax, setParallax] = useState(0)

  useEffect(() => {
    const palette = ['#cfe8ff', '#b7d7ff', '#e6f4ff']

    // Создаём 70 снежинок с разными параметрами
    const flakes: Snowflake[] = Array.from({ length: 70 }, (_, i) => {
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
          transform: translateY(0) translateX(0) rotate(0deg);
        }
        25% {
          transform: translateY(25vh) translateX(${flake.drift * 0.25}px) rotate(90deg);
        }
        50% {
          transform: translateY(50vh) translateX(${flake.drift * 0.5}px) rotate(180deg);
        }
        75% {
          transform: translateY(75vh) translateX(${flake.drift * 0.75}px) rotate(270deg);
        }
        100% {
          transform: translateY(100vh) translateX(${flake.drift}px) rotate(360deg);
        }
      }
    `).join('\n')

    setStyles(css)
  }, [])

  // Эффект параллакса — лёгкий сдвиг при скролле
  useEffect(() => {
    const handler = () => {
      setParallax(window.scrollY * 0.05) // 5% от скролла
    }
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  if (!enabled) return null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div
        className="fixed inset-0 pointer-events-none z-20 overflow-hidden"
        style={{ transform: `translateY(${parallax}px)`, willChange: 'transform' }}
      >
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
              textShadow: '0 0 6px rgba(150,190,255,0.6), 0 0 12px rgba(140,180,255,0.35)',
              filter: 'drop-shadow(0 0 4px rgba(140,180,255,0.5))'
            }}
          >
            ❄
          </div>
        ))}
      </div>
    </>
  )
}

