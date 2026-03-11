import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Initializes Lenis smooth scrolling with the current (lenis) API.
 * - SSR-safe
 * - Optional wrapper/content via data attributes
 * - Cleans up RAF + instance on unmount
 */
export const useLenisScroll = (): void => {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    let rafId: number | null = null
    let lenis: Lenis | null = null

    const wrapper = document.querySelector<HTMLElement>('[data-scroll-container]') ?? undefined
    const content = document.querySelector<HTMLElement>('[data-scroll-content]') ?? undefined

    // Create instance with up-to-date option names
    lenis = new Lenis({
      // autoRaf runs the RAF loop for you; set false if you want a custom raf
      autoRaf: false,
      // “orientation” replaces old “direction”
      orientation: 'vertical',
      // “gestureOrientation” replaces “gestureDirection” (old)
      gestureOrientation: 'vertical',
      // “smoothWheel” replaces “smooth”
      smoothWheel: true,
      // “wheelMultiplier” replaces “mouseMultiplier”
      wheelMultiplier: 1,
      touchMultiplier: 2,
      // use lerp OR duration (lerp wins if both set)
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      infinite: false,
      // only pass wrapper/content if found (to keep typing happy)
      ...(wrapper ? { wrapper } : {}),
      ...(content ? { content } : {}),
    })

    const raf = (time: number) => {
      if (lenis) lenis.raf(time)
      rafId = window.requestAnimationFrame(raf)
    }

    rafId = window.requestAnimationFrame(raf)

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId)
      if (lenis) {
        lenis.destroy()
        lenis = null
      }
    }
  }, [])
}
