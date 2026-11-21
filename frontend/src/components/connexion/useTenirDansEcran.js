import { useLayoutEffect } from 'react'


export default function useTenirDansEcran(ref, { bas = 12, min = 0.6 } = {}) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const ajuster = () => {
      el.style.zoom = '1'
      const hauteur = el.getBoundingClientRect().height
      const haut = parseFloat(getComputedStyle(el.parentElement).paddingTop) || 0 // place des boutons du haut
      const place = window.innerHeight - haut - bas
      const z = Math.max(min, Math.min(1, place / hauteur))
      el.style.zoom = String(z)
    }

    ajuster()

    const obs = new ResizeObserver(() => requestAnimationFrame(ajuster))
    el.querySelectorAll('section').forEach((s) => obs.observe(s))
    window.addEventListener('resize', ajuster)
    return () => { obs.disconnect(); window.removeEventListener('resize', ajuster) }
  }, [ref, bas, min])
}