'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSnow } from '@/contexts/SnowContext'

type Snowflake = {
  id: number
  left: number
  topPx: number
  size: number
  opacity: number
  color: string
  fallDuration: number
  fallDelay: number
  swayDuration: number
  swayDelay: number
  drift: number
  spin: number
}

export function Snowflakes() {
  const { enabled, hydrated } = useSnow()
  const [flakes, setFlakes] = useState<Snowflake[]>([])
  const [mounted, setMounted] = useState(false)

  const baseCss = useMemo(
    () => `
@keyframes snow-fall {
  0%   { transform: translate3d(0, -10vh, 0); }
  60%  { transform: translate3d(0, 55vh, 0); }
  100% { transform: translate3d(0, 110vh, 0); }
}
@keyframes snow-sway {
  0%   { transform: translate3d(calc(var(--drift) * -1), 0, 0); }
  50%  { transform: translate3d(var(--drift), 0, 0); }
  100% { transform: translate3d(calc(var(--drift) * -1), 0, 0); }
}
@keyframes snow-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`,
    []
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const isMobile =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(pointer: coarse)').matches ||
        window.matchMedia?.('(max-width: 768px)').matches)

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) {
      setFlakes([])
      return
    }

    // Посветлее, ближе к бело-голубому (без сияния)
    const palette = ['#f2fbff', '#e2f4ff', '#cfeaff', '#bfe2ff']
    const count = isMobile ? 45 : 85

    const next: Snowflake[] = Array.from({ length: count }, (_, i) => {
      // Глубина через размер: меньше = дальше = медленнее и прозрачнее
      const size = 7 + Math.random() * 10 // 7-17px
      const depth = Math.min(Math.max((17 - size) / 10, 0), 1) // 0..1

      // "Физика": лёгкое ускорение (keyframes) + разные длительности
      // Сделаем падение заметно медленнее (в среднем ~24–46s)
      const fallDuration = 18 + depth * 16 + Math.random() * 12 // дальше = дольше
      const swayDuration = 3.8 + Math.random() * 2.8 + depth * 1.2
      const drift = 14 + Math.random() * 34 // px
      const opacity = 0.5 + (1 - depth) * 0.35 + Math.random() * 0.12

      return {
        id: i,
        left: Math.random() * 100,
        topPx: -10 - Math.random() * 140,
        size,
        opacity: Math.min(opacity, 0.95),
        color: palette[Math.floor(Math.random() * palette.length)],
        fallDuration,
        fallDelay: Math.random() * 6,
        swayDuration,
        swayDelay: Math.random() * 2,
        drift,
        spin: 10 + Math.random() * 22
      }
    })

    setFlakes(next)
  }, [])

  if (!mounted || !hydrated || !enabled) return null

  return createPortal(
    <>
      <style dangerouslySetInnerHTML={{ __html: baseCss }} />
      {/* Portal в body: снег покрывает весь viewport (включая поля по бокам) */}
      <div
        className="fixed inset-0 pointer-events-none z-[5] overflow-hidden"
        style={{ width: '100vw', height: '100vh' }}
      >
        {flakes.map((f) => (
          <div
            key={f.id}
            className="absolute select-none"
            style={{
              left: `${f.left}%`,
              top: `${f.topPx}px`,
              opacity: f.opacity,
              animationName: 'snow-fall',
              animationDuration: `${f.fallDuration}s`,
              animationTimingFunction: 'cubic-bezier(0.15, 0.0, 0.35, 1.0)', // ускорение вниз
              animationDelay: `${f.fallDelay}s`,
              animationIterationCount: 'infinite',
              willChange: 'transform'
            }}
          >
            <span
              style={{
                display: 'inline-block',
                fontSize: `${f.size}px`,
                color: f.color,
                // НЕ сияние: только микроконтраст, чтобы было видно на светлом фоне
                textShadow: '0 1px 0 rgba(0,0,0,0.10)',
                // sway
                ['--drift' as any]: `${f.drift}px`,
                animationName: 'snow-sway',
                animationDuration: `${f.swayDuration}s`,
                animationTimingFunction: 'ease-in-out',
                animationDelay: `${f.swayDelay}s`,
                animationIterationCount: 'infinite'
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  animationName: 'snow-spin',
                  animationDuration: `${f.spin}s`,
                  animationTimingFunction: 'linear',
                  animationIterationCount: 'infinite'
                }}
              >
                ❄
              </span>
            </span>
          </div>
        ))}
      </div>
    </>,
    document.body
  )
}

