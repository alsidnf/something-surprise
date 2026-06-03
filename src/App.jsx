import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshTransmissionMaterial, OrbitControls, Stars } from '@react-three/drei'
import {
  ArrowDown,
  ArrowUp,
  CircleDot,
  Fish,
  Gamepad2,
  MousePointer2,
  Pause,
  Play,
  Plus,
  Rotate3d,
  Sparkles,
  WandSparkles,
  Waves,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const slides = [
  { id: 'intro', title: 'Impossible Deck', icon: Sparkles },
  { id: 'artifact', title: '3D Artifact', icon: Rotate3d },
  { id: 'field', title: 'Cursor Field', icon: MousePointer2 },
  { id: 'reef', title: 'Living Pond', icon: Waves },
  { id: 'game', title: 'Mini Game', icon: Gamepad2 },
  { id: 'ending', title: 'Live Finale', icon: WandSparkles },
]

function usePointer() {
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const update = (event) => {
      setPointer({
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight,
      })
    }

    window.addEventListener('pointermove', update)
    return () => window.removeEventListener('pointermove', update)
  }, [])

  return pointer
}

function Crystal() {
  const group = useRef()
  const core = useRef()

  useFrame((state) => {
    const time = state.clock.elapsedTime
    group.current.rotation.y = time * 0.35
    group.current.rotation.x = Math.sin(time * 0.4) * 0.18
    core.current.rotation.z = -time * 0.6
  })

  return (
    <group ref={group}>
      <Float speed={2.2} rotationIntensity={0.45} floatIntensity={0.9}>
        <mesh ref={core}>
          <icosahedronGeometry args={[1.25, 2]} />
          <MeshTransmissionMaterial
            color="#78fff1"
            thickness={0.7}
            roughness={0.12}
            transmission={0.85}
            chromaticAberration={0.55}
          />
        </mesh>
      </Float>
      {Array.from({ length: 3 }).map((_, index) => (
        <mesh key={index} rotation={[0.7 + index * 0.6, index * 1.2, 0.4]}>
          <torusGeometry args={[1.75 + index * 0.34, 0.012, 16, 160]} />
          <meshStandardMaterial color={['#ffcf5a', '#ff6f91', '#61f4de'][index]} emissiveIntensity={1.2} />
        </mesh>
      ))}
    </group>
  )
}

function ArtifactScene() {
  return (
    <Canvas camera={{ position: [0, 0, 5.4], fov: 45 }}>
      <color attach="background" args={['#080914']} />
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 4, 5]} intensity={45} color="#74f3ff" />
      <pointLight position={[-4, -2, 3]} intensity={18} color="#ff7aa8" />
      <Stars radius={80} depth={30} count={1800} factor={4} saturation={0} speed={0.8} />
      <Crystal />
      <OrbitControls enablePan={false} minDistance={3.2} maxDistance={7} />
    </Canvas>
  )
}

function CursorField({ pointer, active }) {
  const canvasRef = useRef()

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    let frame = 0
    let rafId

    const resize = () => {
      canvas.width = Math.floor(canvas.clientWidth * window.devicePixelRatio)
      canvas.height = Math.floor(canvas.clientHeight * window.devicePixelRatio)
    }

    const draw = () => {
      const width = canvas.width
      const height = canvas.height
      const px = pointer.x * width
      const py = pointer.y * height
      frame += active ? 0.018 : 0.006

      context.clearRect(0, 0, width, height)
      context.fillStyle = '#07131c'
      context.fillRect(0, 0, width, height)

      for (let y = 0; y < 22; y += 1) {
        for (let x = 0; x < 34; x += 1) {
          const gx = (x + 0.5) * (width / 34)
          const gy = (y + 0.5) * (height / 22)
          const dx = gx - px
          const dy = gy - py
          const distance = Math.hypot(dx, dy)
          const pull = Math.max(0, 1 - distance / (width * 0.34))
          const wave = Math.sin(frame * 6 + x * 0.42 + y * 0.7) * 0.5 + 0.5
          const size = 3 + pull * 18 + wave * 5
          const hue = 170 + pull * 120 + wave * 25

          context.beginPath()
          context.fillStyle = `hsla(${hue}, 92%, ${48 + pull * 18}%, ${0.45 + pull * 0.55})`
          context.arc(gx + dx * pull * -0.18, gy + dy * pull * -0.18, size, 0, Math.PI * 2)
          context.fill()
        }
      }

      rafId = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [active, pointer.x, pointer.y])

  return <canvas ref={canvasRef} className="field-canvas" aria-label="Mouse reactive generative particle field" />
}

function UnderwaterGarden({ active }) {
  const canvasRef = useRef()
  const ripplesRef = useRef([])
  const [pondMode, setPondMode] = useState('ripple')
  const [addedFish, setAddedFish] = useState([])
  const flora = useMemo(
    () =>
      Array.from({ length: 34 }, (_, index) => ({
        x: 0.04 + index * 0.029,
        height: 0.16 + ((Math.sin(index * 7.17) + 1) / 2) * 0.22,
        width: 8 + ((Math.cos(index * 5.21) + 1) / 2) * 10,
        phase: index * 0.72,
        color: index % 3 === 0 ? '#57d68d' : index % 3 === 1 ? '#78e6b8' : '#3fb77a',
      })),
    [],
  )
  const shells = useMemo(
    () =>
      Array.from({ length: 11 }, (_, index) => ({
        x: 0.1 + index * 0.083,
        y: 0.86 + ((Math.cos(index * 3.7) + 1) / 2) * 0.09,
        size: 0.72 + ((Math.sin(index * 6.1) + 1) / 2) * 0.62,
        angle: -0.35 + ((Math.sin(index * 2.3) + 1) / 2) * 0.7,
        tone: index % 5,
      })),
    [],
  )
  const starfish = useMemo(
    () => [
      { x: 0.19, y: 0.9, size: 0.82, angle: 0.25 },
      { x: 0.52, y: 0.88, size: 0.62, angle: -0.35 },
      { x: 0.83, y: 0.91, size: 0.72, angle: 0.55 },
    ],
    [],
  )
  const stones = useMemo(
    () =>
      Array.from({ length: 13 }, (_, index) => ({
        x: 0.06 + index * 0.078,
        y: 0.91 + ((Math.sin(index * 4.8) + 1) / 2) * 0.045,
        r: 18 + ((Math.cos(index * 2.9) + 1) / 2) * 28,
        tone: index % 4,
      })),
    [],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    let rafId
    let time = 0

    const resize = () => {
      canvas.width = Math.floor(canvas.clientWidth * window.devicePixelRatio)
      canvas.height = Math.floor(canvas.clientHeight * window.devicePixelRatio)
    }

    const getRipplePush = (x, y, strength = 1) =>
      ripplesRef.current.reduce(
        (push, ripple) => {
          const dx = x - ripple.x
          const dy = y - ripple.y
          const distance = Math.max(1, Math.hypot(dx, dy))
          const waveHit = Math.max(0, 1 - Math.abs(distance - ripple.radius) / (150 * window.devicePixelRatio))
          const nearHit = Math.max(0, 1 - distance / (220 * window.devicePixelRatio))
          const force = (waveHit * 1.6 + nearHit * 0.9) * ripple.life * strength

          return {
            x: push.x + (dx / distance) * force * 58 * window.devicePixelRatio,
            y: push.y + (dy / distance) * force * 44 * window.devicePixelRatio,
            panic: push.panic + force,
          }
        },
        { x: 0, y: 0, panic: 0 },
      )

    const curveSwimmer = ({ lane, speed, seed, direction, amplitude, drift = 0, scale = 1 }) => {
      const progress = (time * speed + seed) % 1
      const x = direction > 0 ? progress * (canvas.width + 160) - 80 : canvas.width + 80 - progress * (canvas.width + 160)
      const curve =
        Math.sin(progress * Math.PI * 2 + seed * 8) * amplitude +
        Math.sin(time * 1.7 + seed * 17) * amplitude * 0.38 +
        Math.cos(progress * Math.PI * 4 + seed) * amplitude * 0.18
      const y = canvas.height * lane + curve + drift * canvas.height
      const push = getRipplePush(x, y, scale)

      return {
        x: x + push.x,
        y: y + push.y,
        direction,
        angle: Math.max(-0.42, Math.min(0.42, curve / (amplitude * 4 + 1) + push.y / 260)),
        panic: Math.min(1.2, push.panic),
      }
    }

    const drawFish = (x, y, scale, color, direction, wobble, angle = 0, panic = 0) => {
      context.save()
      context.translate(x, y)
      context.scale(direction * scale, scale)
      context.rotate(angle + Math.sin(wobble) * (0.08 + panic * 0.08))
      context.fillStyle = color
      context.beginPath()
      context.ellipse(0, 0, 34, 16, 0, 0, Math.PI * 2)
      context.fill()
      context.beginPath()
      context.moveTo(-28, 0)
      context.lineTo(-52, -17 - panic * 8)
      context.lineTo(-48, 0)
      context.lineTo(-52, 17 + panic * 8)
      context.closePath()
      context.fill()
      context.fillStyle = '#07131c'
      context.beginPath()
      context.arc(20, -5, 3.4, 0, Math.PI * 2)
      context.fill()
      context.restore()
    }

    const drawTurtle = (x, y, scale, direction, wobble, angle = 0, panic = 0) => {
      context.save()
      context.translate(x, y)
      context.scale(direction * scale, scale)
      context.rotate(angle + Math.sin(wobble) * (0.05 + panic * 0.05))
      context.fillStyle = '#65c59a'
      for (const [lx, ly, angle] of [
        [-30, -18, -0.55],
        [-28, 18, 0.55],
        [26, -18, 0.55],
        [26, 18, -0.55],
      ]) {
        context.save()
        context.translate(lx, ly)
        context.rotate(angle + Math.sin(wobble) * (0.18 + panic * 0.2))
        context.beginPath()
        context.ellipse(0, 0, 18, 8, 0, 0, Math.PI * 2)
        context.fill()
        context.restore()
      }
      context.fillStyle = '#8ce0b4'
      context.beginPath()
      context.arc(48, 0, 13, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = '#4fa77f'
      context.beginPath()
      context.ellipse(0, 0, 46, 30, 0, 0, Math.PI * 2)
      context.fill()
      context.strokeStyle = 'rgba(209, 255, 226, 0.42)'
      context.lineWidth = 3
      context.beginPath()
      context.moveTo(-32, -4)
      context.quadraticCurveTo(0, -25, 32, -4)
      context.moveTo(-34, 7)
      context.quadraticCurveTo(0, 26, 34, 7)
      context.moveTo(0, -29)
      context.lineTo(0, 29)
      context.stroke()
      context.restore()
    }

    const drawShell = (x, y, scale, angle, color) => {
      context.save()
      context.translate(x, y)
      context.rotate(angle)
      context.scale(scale, scale)
      context.fillStyle = color
      context.beginPath()
      context.moveTo(-22, 8)
      context.quadraticCurveTo(-16, -22, 0, -27)
      context.quadraticCurveTo(16, -22, 22, 8)
      context.closePath()
      context.fill()
      context.strokeStyle = 'rgba(255, 250, 225, 0.55)'
      context.lineWidth = 2.2
      for (let i = -2; i <= 2; i += 1) {
        context.beginPath()
        context.moveTo(0, -24)
        context.quadraticCurveTo(i * 8, -8, i * 10, 8)
        context.stroke()
      }
      context.restore()
    }

    const drawStarfish = (x, y, scale, angle) => {
      context.save()
      context.translate(x, y)
      context.rotate(angle)
      context.scale(scale, scale)
      context.fillStyle = '#ff9d78'
      context.beginPath()
      for (let i = 0; i < 10; i += 1) {
        const radius = i % 2 === 0 ? 24 : 10
        const point = -Math.PI / 2 + (i / 10) * Math.PI * 2
        const px = Math.cos(point) * radius
        const py = Math.sin(point) * radius
        if (i === 0) context.moveTo(px, py)
        else context.lineTo(px, py)
      }
      context.closePath()
      context.fill()
      context.fillStyle = 'rgba(255, 239, 198, 0.75)'
      for (let i = 0; i < 5; i += 1) {
        const point = -Math.PI / 2 + (i / 5) * Math.PI * 2
        context.beginPath()
        context.arc(Math.cos(point) * 9, Math.sin(point) * 9, 2.4, 0, Math.PI * 2)
        context.fill()
      }
      context.restore()
    }

    const draw = () => {
      const width = canvas.width
      const height = canvas.height
      time += active ? 0.014 : 0.004
      const ripples = ripplesRef.current

      const gradient = context.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, '#0b6d8f')
      gradient.addColorStop(0.52, '#0d5369')
      gradient.addColorStop(1, '#092c2f')
      context.fillStyle = gradient
      context.fillRect(0, 0, width, height)

      context.globalAlpha = 0.18
      context.strokeStyle = '#d8fff6'
      context.lineWidth = 2 * window.devicePixelRatio
      for (let i = 0; i < 10; i += 1) {
        const y = height * (0.08 + i * 0.075) + Math.sin(time * 3 + i) * 14
        context.beginPath()
        for (let x = -30; x < width + 30; x += 28) {
          const wave = Math.sin(x * 0.012 + time * 5 + i) * 10
          if (x < 0) context.moveTo(x, y + wave)
          else context.lineTo(x, y + wave)
        }
        context.stroke()
      }
      context.globalAlpha = 1

      for (let i = 0; i < 54; i += 1) {
        const x = ((i * 73 + time * 120) % (width + 120)) - 60
        const y = height * (0.12 + ((Math.sin(i * 2.4) + 1) / 2) * 0.62)
        context.fillStyle = `rgba(214, 255, 245, ${0.16 + ((i % 5) / 20)})`
        context.beginPath()
        context.arc(x, y + Math.sin(time * 4 + i) * 9, 2 + (i % 4), 0, Math.PI * 2)
        context.fill()
      }

      const sand = context.createLinearGradient(0, height * 0.82, 0, height)
      sand.addColorStop(0, '#b9a36e')
      sand.addColorStop(1, '#594a32')
      context.fillStyle = sand
      context.beginPath()
      context.moveTo(0, height)
      for (let x = 0; x <= width; x += 40) {
        context.lineTo(x, height * 0.87 + Math.sin(x * 0.012 + time * 1.3) * 18)
      }
      context.lineTo(width, height)
      context.closePath()
      context.fill()

      stones.forEach((stone) => {
        const x = stone.x * width
        const y = stone.y * height
        context.fillStyle = ['#4c5c58', '#6d7166', '#394a47', '#77705d'][stone.tone]
        context.beginPath()
        context.ellipse(x, y, stone.r, stone.r * 0.48, Math.sin(stone.x * 8) * 0.25, 0, Math.PI * 2)
        context.fill()
      })

      shells.forEach((shell) => {
        drawShell(
          shell.x * width,
          shell.y * height,
          shell.size * window.devicePixelRatio,
          shell.angle,
          ['#ffd6a5', '#f8b4c4', '#f5f0d0', '#c7e8dd', '#e8c7ff'][shell.tone],
        )
      })

      starfish.forEach((star) => {
        drawStarfish(star.x * width, star.y * height, star.size * window.devicePixelRatio, star.angle)
      })

      flora.forEach((plant) => {
        const baseX = plant.x * width
        const baseY = height * 0.9
        const plantHeight = plant.height * height
        const rippleBoost = ripples.reduce((sum, ripple) => {
          const distance = Math.hypot(baseX - ripple.x, baseY - ripple.y)
          return sum + Math.max(0, 1 - Math.abs(distance - ripple.radius) / 160) * ripple.life
        }, 0)
        const sway = Math.sin(time * 3.6 + plant.phase) * plant.width + rippleBoost * 34

        context.strokeStyle = plant.color
        context.lineWidth = 5 * window.devicePixelRatio
        context.lineCap = 'round'
        context.beginPath()
        context.moveTo(baseX, baseY)
        context.bezierCurveTo(
          baseX + sway * 0.15,
          baseY - plantHeight * 0.28,
          baseX + sway,
          baseY - plantHeight * 0.62,
          baseX + sway * 0.36,
          baseY - plantHeight,
        )
        context.stroke()
      })

      const nativeFish = [
        { lane: 0.31, speed: 0.062, seed: 0.18, direction: 1, amplitude: height * 0.075, scale: 1.05, color: '#ffcf5a' },
        { lane: 0.5, speed: 0.084, seed: 0.62, direction: -1, amplitude: height * 0.09, scale: 0.82, color: '#ff8fac' },
        { lane: 0.22, speed: 0.046, seed: 0.39, direction: 1, amplitude: height * 0.055, scale: 0.64, color: '#a2fff0' },
        { lane: 0.42, speed: 0.052, seed: 0.78, direction: 1, amplitude: height * 0.11, scale: 0.58, color: '#c4a1ff' },
        { lane: 0.28, speed: 0.058, seed: 0.91, direction: -1, amplitude: height * 0.07, scale: 0.7, color: '#ffef7a' },
      ]

      nativeFish.forEach((fish) => {
        const swimmer = curveSwimmer(fish)
        drawFish(
          swimmer.x,
          swimmer.y,
          fish.scale,
          fish.color,
          swimmer.direction,
          time * 8 + fish.seed,
          swimmer.angle,
          swimmer.panic,
        )
      })
      addedFish.forEach((fish) => {
        const swimmer = curveSwimmer({
          lane: fish.y,
          speed: fish.speed,
          seed: fish.seed,
          direction: fish.direction,
          amplitude: height * (0.055 + fish.scale * 0.035),
          drift: Math.sin(fish.seed * 14) * 0.025,
          scale: fish.scale,
        })
        if (fish.type === 'turtle') {
          drawTurtle(swimmer.x, swimmer.y, fish.scale * 1.35, swimmer.direction, time * 5 + fish.seed, swimmer.angle, swimmer.panic)
        } else {
          drawFish(
            swimmer.x,
            swimmer.y,
            fish.scale,
            fish.color,
            swimmer.direction,
            time * 8 + fish.seed,
            swimmer.angle,
            swimmer.panic,
          )
        }
      })
      const turtle = curveSwimmer({
        lane: 0.58,
        speed: 0.024,
        seed: 0.44,
        direction: 1,
        amplitude: height * 0.085,
        scale: 0.75,
      })
      drawTurtle(turtle.x, turtle.y, 1.18, turtle.direction, time * 5, turtle.angle * 0.45, turtle.panic)

      ripplesRef.current = ripples
        .map((ripple) => ({ ...ripple, radius: ripple.radius + 7 * window.devicePixelRatio, life: ripple.life - 0.012 }))
        .filter((ripple) => ripple.life > 0)

      ripplesRef.current.forEach((ripple) => {
        context.strokeStyle = `rgba(218, 255, 248, ${ripple.life * 0.7})`
        context.lineWidth = 3 * window.devicePixelRatio
        context.beginPath()
        context.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2)
        context.stroke()
      })

      rafId = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [active, addedFish, flora, shells, starfish, stones])

  const addRipple = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) * window.devicePixelRatio
    const y = (event.clientY - rect.top) * window.devicePixelRatio
    ripplesRef.current.push({
      x,
      y,
      radius: 8,
      life: 1,
    })

    if (pondMode === 'fish') {
      const palette = ['#ffcf5a', '#ff8fac', '#a2fff0', '#c4a1ff', '#9cff9a', '#ffb06b']
      setAddedFish((current) => {
        const shouldAddTurtle = current.length % 5 === 3
        const nextCreature = {
          id: Date.now(),
          type: shouldAddTurtle ? 'turtle' : 'fish',
          x: x / canvasRef.current.width,
          y: y / canvasRef.current.height,
          color: palette[current.length % palette.length],
          direction: current.length % 2 === 0 ? 1 : -1,
          scale: shouldAddTurtle ? 0.78 : 0.55 + (current.length % 4) * 0.14,
          speed: shouldAddTurtle ? 0.018 : 0.045 + (current.length % 5) * 0.012,
          seed: (current.length + 1) * 0.137,
        }

        return [...current, nextCreature].slice(-18)
      })
    }
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pond-canvas"
        onPointerDown={addRipple}
        aria-label="Interactive underwater pond with plants, stones, shells, fish, turtle, and click ripples"
      />
      <div className="pond-tools" aria-label="Pond interaction mode">
        <button
          type="button"
          className={pondMode === 'ripple' ? 'active' : ''}
          onClick={() => setPondMode('ripple')}
          title="Ripple mode"
        >
          <CircleDot size={17} />
          Ripple
        </button>
        <button
          type="button"
          className={pondMode === 'fish' ? 'active' : ''}
          onClick={() => setPondMode('fish')}
          title="Add fish mode"
        >
          <Plus size={17} />
          <Fish size={17} />
          Add fish
        </button>
        {addedFish.length > 0 && <span>{addedFish.length}</span>}
      </div>
    </>
  )
}

function SignalGame() {
  const [score, setScore] = useState(0)
  const [target, setTarget] = useState({ x: 48, y: 50, tone: 0 })

  const moveTarget = () => {
    setTarget({
      x: 12 + Math.random() * 76,
      y: 16 + Math.random() * 68,
      tone: Math.floor(Math.random() * 4),
    })
  }

  const capture = () => {
    setScore((value) => value + 1)
    moveTarget()
  }

  useEffect(() => {
    const id = setInterval(moveTarget, Math.max(850, 1900 - score * 80))
    return () => clearInterval(id)
  }, [score])

  return (
    <div className="game-stage">
      <button
        className={`target tone-${target.tone}`}
        style={{ left: `${target.x}%`, top: `${target.y}%` }}
        type="button"
        onClick={capture}
        aria-label="Capture signal"
      />
      <div className="scoreboard">
        <span>signals</span>
        <strong>{score}</strong>
      </div>
      <div className="scan-line" />
    </div>
  )
}

function FinaleBars({ running }) {
  const values = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        id: index,
        base: 20 + ((Math.sin(index * 12.9898) * 43758.5453) % 1) * 46,
      })),
    [],
  )
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!running) return undefined
    const id = setInterval(() => setTick((value) => value + 1), 130)
    return () => clearInterval(id)
  }, [running])

  return (
    <div className="bars" aria-label="Animated data sculpture">
      {values.map((bar) => {
        const height = bar.base + Math.sin(tick * 0.45 + bar.id * 0.7) * 22 + Math.cos(tick * 0.2 + bar.id) * 10
        return <span key={bar.id} style={{ height: `${Math.max(12, height)}%` }} />
      })}
    </div>
  )
}

function App() {
  const pointer = usePointer()
  const [activeSlide, setActiveSlide] = useState(0)
  const [running, setRunning] = useState(true)
  const deckRef = useRef()

  const goToSlide = useCallback((index) => {
    const next = Math.min(slides.length - 1, Math.max(0, index))
    deckRef.current?.scrollTo({ top: window.innerHeight * next, behavior: 'smooth' })
    const nextHash = `#${slides[next].id}`
    if (window.location.hash !== nextHash) window.history.replaceState(null, '', nextHash)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const top = deckRef.current?.scrollTop ?? 0
      const index = Math.round(top / window.innerHeight)
      setActiveSlide(Math.min(slides.length - 1, Math.max(0, index)))
    }

    const deck = deckRef.current
    deck.addEventListener('scroll', onScroll, { passive: true })
    return () => deck.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const index = slides.findIndex((slide) => `#${slide.id}` === window.location.hash)
    if (index > -1) requestAnimationFrame(() => goToSlide(index))
  }, [goToSlide])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowDown' || event.key === 'PageDown') goToSlide(activeSlide + 1)
      if (event.key === 'ArrowUp' || event.key === 'PageUp') goToSlide(activeSlide - 1)
      if (event.key === ' ') setRunning((value) => !value)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeSlide, goToSlide])

  return (
    <main className="app">
      <nav className="rail" aria-label="Deck navigation">
        {slides.map((slide, index) => {
          const Icon = slide.icon
          return (
            <button
              key={slide.id}
              type="button"
              className={index === activeSlide ? 'active' : ''}
              onClick={() => goToSlide(index)}
              aria-label={slide.title}
              title={slide.title}
            >
              <Icon size={18} />
            </button>
          )
        })}
      </nav>

      <div className="deck" ref={deckRef}>
        <section className="slide intro">
          <div className="mesh" style={{ '--mx': pointer.x, '--my': pointer.y }} />
          <div className="intro-copy">
            <p className="kicker">GitHub Pages proof of imagination</p>
            <h1>이정도까지 할 수 있다고?</h1>
            <p>
              PPT처럼 넘기지만, 각 장면은 브라우저 안에서 직접 계산되고 움직입니다. 스크롤하거나 왼쪽 아이콘을 눌러
              확인하세요.
            </p>
          </div>
          <button className="down-button" type="button" onClick={() => goToSlide(1)} aria-label="Next slide">
            <ArrowDown size={22} />
          </button>
        </section>

        <section className="slide artifact">
          <div className="scene">
            <ArtifactScene />
          </div>
          <div className="caption">
            <p className="kicker">drag, orbit, inspect</p>
            <h2>손으로 돌려보는 유리 결정체</h2>
            <p>Three.js 기반 3D 장면입니다. 마우스로 드래그하면 빛과 표면 반사가 각도에 따라 달라집니다.</p>
          </div>
        </section>

        <section className="slide field">
          <CursorField pointer={pointer} active={running} />
          <div className="caption">
            <p className="kicker">cursor becomes gravity</p>
            <h2>마우스가 중력이 되는 입자장</h2>
            <p>포인터 위치가 수백 개의 점을 당기고 밀어내며 색과 크기를 실시간으로 바꿉니다.</p>
          </div>
        </section>

        <section className="slide reef">
          <UnderwaterGarden active={running} />
          <div className="caption">
            <p className="kicker">click the water, watch it answer</p>
            <h2>클릭하면 파문이 번지는 작은 연못</h2>
            <p>물풀은 흐름에 맞춰 흔들리고, 물고기와 거북이는 조용히 지나갑니다. 화면을 누르면 그 자리에서 물결이 퍼집니다.</p>
          </div>
        </section>

        <section className="slide game">
          <SignalGame />
          <div className="caption">
            <p className="kicker">tiny playable slide</p>
            <h2>발표 중 갑자기 게임이 되는 페이지</h2>
            <p>움직이는 신호를 클릭해 점수를 올려보세요. 슬라이드 하나가 작은 인터랙티브 장난감이 됩니다.</p>
          </div>
        </section>

        <section className="slide ending">
          <FinaleBars running={running} />
          <div className="final-copy">
            <p className="kicker">live system, static hosting</p>
            <h2>정적 페이지지만 살아있는 쇼케이스</h2>
            <p>GitHub Pages 위에서도 3D, 캔버스, 게임, 제너레이티브 그래픽을 모두 한 파일처럼 가볍게 보여줄 수 있습니다.</p>
            <button type="button" className="control" onClick={() => setRunning((value) => !value)}>
              {running ? <Pause size={18} /> : <Play size={18} />}
              {running ? 'Pause motion' : 'Play motion'}
            </button>
          </div>
        </section>
      </div>

      <div className="pager" aria-hidden="true">
        <button type="button" onClick={() => goToSlide(activeSlide - 1)} aria-label="Previous slide">
          <ArrowUp size={18} />
        </button>
        <span>
          {activeSlide + 1}/{slides.length}
        </span>
        <button type="button" onClick={() => goToSlide(activeSlide + 1)} aria-label="Next slide">
          <ArrowDown size={18} />
        </button>
      </div>
    </main>
  )
}

export default App
