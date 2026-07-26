import { useEffect, useRef } from 'react'

const PARTICLE_COUNT = 70
const BURST_COUNT = 90
const COLORS: [number, number, number][] = [
  [216, 174, 76], // gold
  [246, 223, 160], // light gold
  [90, 200, 130], // green glow
  [255, 255, 255], // white
]

type Mode = 'idle' | 'active'

interface Props {
  mode?: Mode
}

interface IdleParticle {
  x: number
  y: number
  radius: number
  phase: number
  speed: number
  colorIdx: number
  driftX: number
  driftY: number
}

interface BurstParticle {
  angle: number
  distance: number
  maxDistance: number
  speed: number
  radius: number
  colorIdx: number
}

function randColorIdx() {
  return Math.floor(Math.random() * COLORS.length)
}

export default function AnimatedBackground({ mode = 'idle' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let lastTime = 0
    let idleParticles: IdleParticle[] = []
    let burstParticles: BurstParticle[] = []

    const c = canvas
    const x = ctx

    function makeIdleParticles() {
      idleParticles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * c.width,
        y: Math.random() * c.height,
        radius: 6 + Math.random() * 34,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.8,
        colorIdx: randColorIdx(),
        driftX: (Math.random() - 0.5) * 6,
        driftY: (Math.random() - 0.5) * 6,
      }))
    }

    function spawnBurstParticle(): BurstParticle {
      const maxDistance = Math.hypot(c.width, c.height) / 2
      return {
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * maxDistance * 0.15,
        maxDistance,
        speed: maxDistance * (0.12 + Math.random() * 0.16),
        radius: 3 + Math.random() * 9,
        colorIdx: randColorIdx(),
      }
    }

    function makeBurstParticles() {
      burstParticles = Array.from({ length: BURST_COUNT }, spawnBurstParticle)
    }

    function resize() {
      c.width = window.innerWidth
      c.height = window.innerHeight
      makeIdleParticles()
      makeBurstParticles()
    }
    resize()
    window.addEventListener('resize', resize)

    function drawIdle(time: number) {
      for (const p of idleParticles) {
        const t = (Math.sin(time / 2200 + p.phase) + 1) / 2
        const alpha = 0.15 + t * 0.55
        const [r, g, b] = COLORS[p.colorIdx]

        const driftT = time / 6000
        const px = p.x + Math.sin(driftT * p.speed + p.phase) * p.driftX * 10
        const py = p.y + Math.cos(driftT * p.speed + p.phase) * p.driftY * 10

        const gradient = x.createRadialGradient(px, py, 0, px, py, p.radius)
        gradient.addColorStop(0, `rgba(${r},${g},${b},${alpha})`)
        gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)

        x.fillStyle = gradient
        x.beginPath()
        x.arc(px, py, p.radius, 0, Math.PI * 2)
        x.fill()
      }
    }

    function drawBurst(dt: number) {
      const cx = c.width / 2
      const cy = c.height / 2

      for (const p of burstParticles) {
        p.distance += p.speed * dt

        if (p.distance > p.maxDistance) {
          Object.assign(p, spawnBurstParticle())
          continue
        }

        const progress = p.distance / p.maxDistance
        const fadeIn = Math.min(1, progress / 0.12)
        const fadeOut = Math.min(1, (1 - progress) / 0.25)
        const alpha = 0.7 * fadeIn * fadeOut

        const px = cx + Math.cos(p.angle) * p.distance
        const py = cy + Math.sin(p.angle) * p.distance
        const [r, g, b] = COLORS[p.colorIdx]

        const gradient = x.createRadialGradient(px, py, 0, px, py, p.radius)
        gradient.addColorStop(0, `rgba(${r},${g},${b},${alpha})`)
        gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)

        x.fillStyle = gradient
        x.beginPath()
        x.arc(px, py, p.radius, 0, Math.PI * 2)
        x.fill()
      }
    }

    function draw(time: number) {
      animId = requestAnimationFrame(draw)
      // cap at ~30 fps to ease load on slow devices
      const dt = time - lastTime
      if (dt < 32) return
      lastTime = time

      x.clearRect(0, 0, c.width, c.height)
      drawIdle(time)
      if (mode === 'active') drawBurst(dt / 1000)
    }

    animId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [mode])

  return <canvas ref={canvasRef} className="animated-bg-canvas" aria-hidden="true" />
}
