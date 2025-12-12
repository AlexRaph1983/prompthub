'use client'

import { useEffect, useState } from 'react'

interface Snowflake {
  id: number
  left: number
  delay: number
  duration: number
  size: number
  opacity: number
  drift: number
}

export function Snowflakes() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([])
  const [styles, setStyles] = useState<string>('')

  useEffect(() => {
    // Создаём 60 снежинок с разными параметрами
    const flakes: Snowflake[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100, // Позиция по горизонтали (0-100%)
      delay: Math.random() * 5, // Задержка начала анимации (0-5s)
      duration: 15 + Math.random() * 10, // Длительность падения (15-25s) - медленно
      size: 4 + Math.random() * 6, // Размер снежинки (4-10px)
      opacity: 0.3 + Math.random() * 0.5, // Прозрачность (0.3-0.8)
      drift: (Math.random() - 0.5) * 30 // Дрейф влево/вправо (-15px до +15px)
    }))
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
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
              color: 'rgba(255,255,255,0.85)',
              textShadow: '0 0 6px rgba(255,255,255,0.5), 0 0 12px rgba(200,220,255,0.4)'
            }}
          >
            ❄
          </div>
        ))}
      </div>
    </>
  )
}

