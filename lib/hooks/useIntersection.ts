import { useEffect, useRef, useState } from 'react'

interface UseIntersectionOptions {
  threshold?: number
  rootMargin?: string
  root?: Element | null
}

export function useIntersection(options: UseIntersectionOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting
        setIsIntersecting(isElementIntersecting)
        
        if (isElementIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      {
        threshold: options.threshold ?? 0,
        rootMargin: options.rootMargin ?? '0px',
        root: options.root ?? null,
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [options.threshold, options.rootMargin, options.root, hasIntersected])

  return { ref, isIntersecting, hasIntersected }
}
