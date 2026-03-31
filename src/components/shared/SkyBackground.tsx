import { useEffect, useRef, useState } from 'react'

interface Star {
  x: number
  y: number
  radius: number
  opacity: number
  twinkleSpeed: number
  twinkleDelta: number
}

interface ShootingStar {
  x: number
  y: number
  len: number
  speed: number
  angle: number
  opacity: number
  active: boolean
  timer: number
  nextFire: number
}

export function SkyBackground() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  )
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const starsRef = useRef<Star[]>([])
  const shootingRef = useRef<ShootingStar>({
    x: 0, y: 0, len: 0, speed: 0, angle: 0, opacity: 0,
    active: false, timer: 0, nextFire: 4000,
  })

  // Watch for theme changes
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  // Night sky canvas
  useEffect(() => {
    if (!isDark) {
      cancelAnimationFrame(animRef.current)
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Use screen dimensions for star generation — stable, unaffected by iOS URL bar
    let width = 0, height = 0
    let starsWidth = 0

    function generateStars(w: number, h: number) {
      starsWidth = w
      starsRef.current = Array.from({ length: 220 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.85,
        radius: Math.random() < 0.15 ? Math.random() * 1.8 + 1.0 : Math.random() * 0.9 + 0.2,
        opacity: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.006 + 0.002,
        twinkleDelta: Math.random() > 0.5 ? 1 : -1,
      }))
    }

    function resize() {
      const vp = window.visualViewport
      const newW = vp ? vp.width : window.innerWidth
      const newH = vp ? vp.height : window.innerHeight
      width = canvas!.width = newW
      height = canvas!.height = newH
      // Only regenerate stars on significant width change (not iOS URL bar height jitter)
      if (Math.abs(newW - starsWidth) > 80 || starsRef.current.length === 0) {
        generateStars(newW, newH)
      }
    }

    resize()

    // Debounce resize to prevent rapid star regeneration from mobile URL bar
    let resizeTimer: ReturnType<typeof setTimeout>
    function handleResize() {
      // Always update canvas size immediately to avoid blank areas
      const vp = window.visualViewport
      width = canvas!.width = vp ? vp.width : window.innerWidth
      height = canvas!.height = vp ? vp.height : window.innerHeight
      // Debounce the star regeneration part
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(resize, 200)
    }
    window.addEventListener('resize', handleResize)
    window.visualViewport?.addEventListener('resize', handleResize)

    const shooting = shootingRef.current
    let lastTime = 0

    function drawFrame(now: number) {
      if (!ctx || !canvas) return
      const dt = now - lastTime
      lastTime = now

      ctx.clearRect(0, 0, width, height)

      // Night sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height)
      grad.addColorStop(0, '#03060f')
      grad.addColorStop(0.35, '#060d22')
      grad.addColorStop(0.7, '#0d1130')
      grad.addColorStop(1, '#160824')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      // Subtle nebula/aurora glow
      const nebula = ctx.createRadialGradient(width * 0.3, height * 0.25, 0, width * 0.3, height * 0.25, width * 0.4)
      nebula.addColorStop(0, 'rgba(60, 40, 120, 0.08)')
      nebula.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = nebula
      ctx.fillRect(0, 0, width, height)

      // Moon
      const mx = width * 0.78, my = height * 0.10, mr = Math.min(width, height) * 0.038
      // Moon atmosphere glow
      const moonAtmos = ctx.createRadialGradient(mx, my, mr, mx, my, mr * 4.5)
      moonAtmos.addColorStop(0, 'rgba(255, 248, 200, 0.12)')
      moonAtmos.addColorStop(0.4, 'rgba(200, 210, 255, 0.05)')
      moonAtmos.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = moonAtmos
      ctx.beginPath()
      ctx.arc(mx, my, mr * 4.5, 0, Math.PI * 2)
      ctx.fill()

      // Moon body
      const moonGrad = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, 0, mx, my, mr)
      moonGrad.addColorStop(0, '#fffde8')
      moonGrad.addColorStop(0.6, '#f5e8b0')
      moonGrad.addColorStop(1, '#d4c070')
      ctx.fillStyle = moonGrad
      ctx.beginPath()
      ctx.arc(mx, my, mr, 0, Math.PI * 2)
      ctx.fill()

      // Moon shadow (crescent)
      ctx.fillStyle = '#060d22'
      ctx.beginPath()
      ctx.arc(mx + mr * 0.28, my - mr * 0.05, mr * 0.82, 0, Math.PI * 2)
      ctx.fill()

      // Stars
      starsRef.current.forEach(star => {
        star.opacity += star.twinkleSpeed * star.twinkleDelta
        if (star.opacity >= 1) { star.twinkleDelta = -1; star.opacity = 1 }
        if (star.opacity <= 0.15) { star.twinkleDelta = 1; star.opacity = 0.15 }

        // Big stars get a glow halo
        if (star.radius > 1.2) {
          const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 4)
          glow.addColorStop(0, `rgba(220, 235, 255, ${star.opacity * 0.5})`)
          glow.addColorStop(1, 'rgba(180, 200, 255, 0)')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.radius * 4, 0, Math.PI * 2)
          ctx.fill()

          // Star cross sparkle
          ctx.strokeStyle = `rgba(220, 235, 255, ${star.opacity * 0.4})`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(star.x - star.radius * 3, star.y)
          ctx.lineTo(star.x + star.radius * 3, star.y)
          ctx.moveTo(star.x, star.y - star.radius * 3)
          ctx.lineTo(star.x, star.y + star.radius * 3)
          ctx.stroke()
        }

        ctx.fillStyle = `rgba(220, 235, 255, ${star.opacity})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Shooting star
      shooting.timer += dt
      if (!shooting.active && shooting.timer >= shooting.nextFire) {
        shooting.active = true
        shooting.timer = 0
        shooting.nextFire = 5000 + Math.random() * 10000
        shooting.x = Math.random() * width * 0.7
        shooting.y = Math.random() * height * 0.3
        shooting.len = 80 + Math.random() * 100
        shooting.speed = 6 + Math.random() * 8
        shooting.angle = (Math.PI / 5) + Math.random() * (Math.PI / 8)
        shooting.opacity = 1
      }

      if (shooting.active) {
        const dx = Math.cos(shooting.angle) * shooting.speed
        const dy = Math.sin(shooting.angle) * shooting.speed
        shooting.x += dx
        shooting.y += dy
        shooting.opacity -= 0.015

        const tailX = shooting.x - Math.cos(shooting.angle) * shooting.len
        const tailY = shooting.y - Math.sin(shooting.angle) * shooting.len
        const sg = ctx.createLinearGradient(tailX, tailY, shooting.x, shooting.y)
        sg.addColorStop(0, 'rgba(255, 255, 255, 0)')
        sg.addColorStop(1, `rgba(255, 255, 255, ${shooting.opacity})`)
        ctx.strokeStyle = sg
        ctx.lineWidth = 1.5
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(shooting.x, shooting.y)
        ctx.stroke()

        if (shooting.opacity <= 0 || shooting.x > width || shooting.y > height) {
          shooting.active = false
          shooting.timer = 0
        }
      }

      animRef.current = requestAnimationFrame(drawFrame)
    }

    animRef.current = requestAnimationFrame(drawFrame)

    return () => {
      cancelAnimationFrame(animRef.current)
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', handleResize)
      window.visualViewport?.removeEventListener('resize', handleResize)
    }
  }, [isDark])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" style={{ height: '100dvh' }}>
      {isDark ? (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      ) : (
        <DaySky />
      )}
    </div>
  )
}

function DaySky() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(to bottom, #3a9bd5 0%, #5bb3e8 25%, #a8d8f5 50%, #d6eefa 75%, #f0f8ff 100%)',
      }}
    />
  )
}
