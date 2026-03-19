import { useEffect } from 'react'

/**
 * Adds a cursor-tracking glow + edge refraction effect to glass panels.
 * Sets CSS custom properties:
 *   --glow-x, --glow-y   : cursor position relative to the element
 *   --glow-opacity        : 0 or 1 based on proximity
 *   --glow-angle          : angle (deg) from element center to cursor — drives conic refraction
 *   --glow-edge-intensity : 0–1 how close cursor is to the nearest edge (1 = at edge)
 */
export function useGlowEffect(selector = '.glass-card, .glass-sidebar, .glass-nav, .glass') {
  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      const elements = document.querySelectorAll<HTMLElement>(selector)
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Check if cursor is within or just outside the element
        const padding = 40
        const isNear =
          e.clientX >= rect.left - padding &&
          e.clientX <= rect.right + padding &&
          e.clientY >= rect.top - padding &&
          e.clientY <= rect.bottom + padding

        if (isNear) {
          el.style.setProperty('--glow-x', `${x}px`)
          el.style.setProperty('--glow-y', `${y}px`)
          el.style.setProperty('--glow-opacity', '1')

          // Angle from element center to cursor (for conic gradient rotation)
          const cx = rect.width / 2
          const cy = rect.height / 2
          const angle = Math.atan2(y - cy, x - cx) * (180 / Math.PI)
          el.style.setProperty('--glow-angle', `${angle}deg`)

          // Edge intensity: how close cursor is to the nearest edge (0 = center, 1 = at edge)
          const distToLeft = Math.abs(x)
          const distToRight = Math.abs(rect.width - x)
          const distToTop = Math.abs(y)
          const distToBottom = Math.abs(rect.height - y)
          const minEdgeDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)
          const maxDim = Math.min(rect.width, rect.height) / 2
          const edgeIntensity = Math.max(0, Math.min(1, 1 - minEdgeDist / maxDim))
          el.style.setProperty('--glow-edge-intensity', edgeIntensity.toFixed(3))
        } else {
          el.style.setProperty('--glow-opacity', '0')
          el.style.setProperty('--glow-edge-intensity', '0')
        }
      })
    }

    function handlePointerLeave() {
      const elements = document.querySelectorAll<HTMLElement>(selector)
      elements.forEach((el) => {
        el.style.setProperty('--glow-opacity', '0')
        el.style.setProperty('--glow-edge-intensity', '0')
      })
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [selector])
}
