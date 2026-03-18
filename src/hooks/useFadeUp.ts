import { useEffect, useRef } from 'react'

/**
 * Observe semua .fade-up elements di dalam container ref,
 * tambahkan class 'visible' saat masuk viewport.
 */
export function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    // Kecil delay supaya DOM sudah fully rendered
    const timer = setTimeout(() => {
      const elements = container.querySelectorAll<HTMLElement>('.fade-up')

      if (!('IntersectionObserver' in window)) {
        // Fallback: langsung visible semua
        elements.forEach(el => el.classList.add('visible'))
        return
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible')
              observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
      )

      elements.forEach(el => observer.observe(el))

      return () => observer.disconnect()
    }, 50)

    return () => clearTimeout(timer)
  }, [])

  return ref
}
