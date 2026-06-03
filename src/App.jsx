import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshTransmissionMaterial, OrbitControls, Stars } from '@react-three/drei'
import {
  ArrowDown,
  ArrowUp,
  Gamepad2,
  MousePointer2,
  Pause,
  Play,
  Rotate3d,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const slides = [
  { id: 'intro', title: 'Impossible Deck', icon: Sparkles },
  { id: 'artifact', title: '3D Artifact', icon: Rotate3d },
  { id: 'field', title: 'Cursor Field', icon: MousePointer2 },
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
