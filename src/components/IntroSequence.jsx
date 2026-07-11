import EnterButton from "./EnterButton";
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ─── TIMING (ms from page load) ──────────────────────────────────────────────
// Total opening cinematic: ~55 s, first 15 s must grab attention immediately.
//
// 0 ms    – Solar system INSTANTLY visible (no fade-in delay)
// 0 ms    – Space-time rupture fires immediately
// 1 800   – "TRANSMISSION INCOMING" fades in
// 3 200   – transmission fades out
// 4 200   – "YEAR 2178" (signal-flicker effect)
// 6 400   – year fades out
// 7 600   – "EARTH COULD NO LONGER HOLD US"
// 10 000  – earth line fades out
// 11 400  – final title reveal
// ─────────────────────────────────────────────────────────────────────────────

const PHASES = {
  toTransmission:     1800,
  transmissionHold:   1400,
  toYear:              600,
  yearHold:           2200,
  toEarth:             600,
  earthHold:          2400,
  toFinal:            1400,
}

// ─── SOLAR SYSTEM (Three.js inside IntroSequence) ────────────────────────────

const PLANET_DATA = [
  // [orbitRadius, size, color, speed, tilt, ringColor, hasMoon, ringSize]
  { r: 6.5,  size: 0.28, color: '#c0a060', speed: 0.55,  tilt: 0.1,  ring: null,      moon: false },
  { r: 9.5,  size: 0.38, color: '#4488cc', speed: 0.38,  tilt: 0.05, ring: null,      moon: true  },
  { r: 13.0, size: 0.65, color: '#cc6633', speed: 0.24,  tilt: 0.15, ring: null,      moon: true  },
  { r: 17.5, size: 1.05, color: '#e8c87a', speed: 0.14,  tilt: 0.08, ring: '#d4aa50', moon: true  },  // Saturn-like
  { r: 22.5, size: 0.75, color: '#5599ee', speed: 0.09,  tilt: 1.48, ring: '#3366bb', moon: true  },  // Uranus-like
  { r: 28.0, size: 0.72, color: '#224488', speed: 0.06,  tilt: 0.3,  ring: null,      moon: false },
]

const STAR_COUNT = 3200

const NebulaGlow = () => {
  const meshRef = useRef()
  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()
    meshRef.current.material.opacity = 0.22 + Math.sin(t * 0.18) * 0.06
  })
  return (
    <mesh ref={meshRef} position={[-8, 4, -40]}>
      <planeGeometry args={[80, 60]} />
      <meshBasicMaterial
        color="#3a1a6a"
        transparent
        opacity={0.22}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

const NebulaGlow2 = () => {
  const meshRef = useRef()
  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()
    meshRef.current.material.opacity = 0.14 + Math.sin(t * 0.13 + 2.1) * 0.05
  })
  return (
    <mesh ref={meshRef} position={[12, -6, -50]}>
      <planeGeometry args={[90, 70]} />
      <meshBasicMaterial
        color="#102a5a"
        transparent
        opacity={0.14}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

const SolarStars = () => {
  const matRef = useRef()

  const { positions, sizes, colors, phases } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3)
    const sizes     = new Float32Array(STAR_COUNT)
    const colors    = new Float32Array(STAR_COUNT * 3)
    const phases    = new Float32Array(STAR_COUNT)

    const palette = [
      [1.0, 1.0, 1.0],
      [0.7, 0.8, 1.0],
      [1.0, 0.9, 0.7],
      [0.6, 0.7, 1.0],
      [1.0, 0.7, 0.5],
    ]

    for (let i = 0; i < STAR_COUNT; i++) {
      const radius = 55 + Math.random() * 50
      const theta  = Math.random() * Math.PI * 2
      const phi    = Math.acos(2 * Math.random() - 1)
      positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      sizes[i] = Math.random() * 2.2 + 0.3
      phases[i] = Math.random() * Math.PI * 2

      const col = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3]     = col[0]
      colors[i * 3 + 1] = col[1]
      colors[i * 3 + 2] = col[2]
    }
    return { positions, sizes, colors, phases }
  }, [])

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uPR: { value: Math.min(window.devicePixelRatio, 1.5) } }), [])

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime()
  })

  const vert = `
    attribute float aSize;
    attribute float aPhase;
    uniform float uTime;
    uniform float uPR;
    void main() {
      float tw = 1.0 + sin(uTime * 0.8 + aPhase) * 0.25;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * uPR * (250.0 / -mv.z) * tw;
      gl_Position = projectionMatrix * mv;
    }
  `
  const frag = `
    varying vec3 vColor;
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      float a = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(vColor, a * 0.95);
    }
  `

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={STAR_COUNT} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize"    count={STAR_COUNT} array={sizes}     itemSize={1} />
        <bufferAttribute attach="attributes-color"    count={STAR_COUNT} array={colors}    itemSize={3} />
        <bufferAttribute attach="attributes-aPhase"   count={STAR_COUNT} array={phases}    itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        vertexColors
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

const Sun = () => {
  const ref  = useRef()
  const gRef = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.material.opacity = 0.88 + Math.sin(t * 0.4) * 0.08
    if (gRef.current) {
      gRef.current.material.opacity = 0.35 + Math.sin(t * 0.22 + 1) * 0.1
      const s = 1 + Math.sin(t * 0.3) * 0.04
      gRef.current.scale.setScalar(s)
    }
  })
  return (
    <group>
      {/* Corona glow */}
      <mesh ref={gRef}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial color="#ff9944" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Sun core */}
      <mesh ref={ref}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color="#ffe060" transparent opacity={0.88} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Point light */}
      <pointLight color="#ffe8a0" intensity={4} distance={80} decay={1.2} />
    </group>
  )
}

const OrbitRing = ({ radius }) => (
  <mesh rotation={[Math.PI / 2, 0, 0]}>
    <ringGeometry args={[radius - 0.015, radius + 0.015, 128]} />
    <meshBasicMaterial color="#ffffff" transparent opacity={0.04} side={THREE.DoubleSide} depthWrite={false} />
  </mesh>
)

const AsteroidBelt = () => {
  const ref    = useRef()
  const count  = 340
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle  = (i / count) * Math.PI * 2 + Math.random() * 0.18
      const radius = 10.8 + (Math.random() - 0.5) * 1.4
      arr[i * 3]     = Math.cos(angle) * radius
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.5
      arr[i * 3 + 2] = Math.sin(angle) * radius
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.025
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#aa9966" size={0.055} sizeAttenuation transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

const PlanetMesh = ({ data, index }) => {
  const groupRef  = useRef()
  const meshRef   = useRef()
  const moonRef   = useRef()
  const initAngle = useMemo(() => (index / PLANET_DATA.length) * Math.PI * 2 + Math.random() * 0.5, [index])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    const angle = initAngle + t * data.speed * 0.22
    groupRef.current.position.set(
      Math.cos(angle) * data.r,
      0,
      Math.sin(angle) * data.r
    )
    if (meshRef.current) meshRef.current.rotation.y = t * 0.5
    if (moonRef.current) {
      const ma = t * 1.4
      moonRef.current.position.set(Math.cos(ma) * (data.size * 3.2 + 0.4), Math.sin(ma * 0.3) * 0.15, Math.sin(ma) * (data.size * 3.2 + 0.4))
    }
  })

  return (
    <group ref={groupRef}>
      {/* Planet body */}
      <mesh ref={meshRef} rotation={[data.tilt, 0, 0]}>
        <sphereGeometry args={[data.size, 24, 24]} />
        <meshStandardMaterial color={data.color} roughness={0.8} metalness={0.05} />
        {/* Atmospheric rim glow */}
        <mesh scale={[1.12, 1.12, 1.12]}>
          <sphereGeometry args={[data.size, 16, 16]} />
          <meshBasicMaterial color={data.color} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
        </mesh>
      </mesh>

      {/* Saturn-style rings */}
      {data.ring && (
        <mesh rotation={[Math.PI * 0.42, 0.3, 0]}>
          <ringGeometry args={[data.size * 1.4, data.size * 2.2, 80]} />
          <meshBasicMaterial color={data.ring} transparent opacity={0.38} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {/* Moon */}
      {data.moon && (
        <mesh ref={moonRef}>
          <sphereGeometry args={[data.size * 0.28, 12, 12]} />
          <meshStandardMaterial color="#aaaaaa" roughness={1} />
        </mesh>
      )}
    </group>
  )
}

const CinematicCamera = ({ phase }) => {
  const { camera } = useThree()
  const t0 = useRef(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (t0.current === null) t0.current = t

    const elapsed = t - t0.current

    // Cinematic flythrough: start far, pull in and orbit gently
    const approach = THREE.MathUtils.smoothstep(elapsed, 0, 18)
    const z = THREE.MathUtils.lerp(48, 26, approach)
    const x = Math.sin(t * 0.055) * 5 + Math.sin(t * 0.018) * 2
    const y = Math.cos(t * 0.04) * 2.5 + 1

    // Subtle handheld micro-shake for cinematic feel
    const shake = 0.012
    camera.position.set(
      x + Math.sin(t * 6.3) * shake,
      y + Math.cos(t * 5.7) * shake * 0.6,
      z
    )
    camera.lookAt(0, 0, 0)
  })
  return null
}

const SolarSystem = ({ phase }) => (
  <>
    <ambientLight intensity={0.08} />
    <SolarStars />
    <NebulaGlow />
    <NebulaGlow2 />
    <Sun />
    {/* Orbit rings */}
    {PLANET_DATA.map((p, i) => <OrbitRing key={`orbit-${i}`} radius={p.r} />)}
    <AsteroidBelt />
    {/* Planets */}
    {PLANET_DATA.map((p, i) => <PlanetMesh key={`planet-${i}`} data={p} index={i} />)}
    <CinematicCamera phase={phase} />
  </>
)

// ─── SPACE-TIME RUPTURE (CSS/SVG overlay) ─────────────────────────────────────

const SpaceTimeRupture = () => (
  <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
    <style>{`
      @keyframes rupture-core {
        0%   { opacity: 0; transform: translate(-50%,-50%) scale(0); filter: blur(30px); }
        8%   { opacity: 1; transform: translate(-50%,-50%) scale(1.2);  filter: blur(2px); }
        20%  { opacity: 0.85; transform: translate(-50%,-50%) scale(0.95); filter: blur(1px); }
        60%  { opacity: 0.55; transform: translate(-50%,-50%) scale(1.0); filter: blur(2px); }
        100% { opacity: 0; transform: translate(-50%,-50%) scale(1.4); filter: blur(20px); }
      }
      @keyframes rupture-ray {
        0%   { opacity: 0; transform: scaleY(0); }
        5%   { opacity: 1; transform: scaleY(1); }
        30%  { opacity: 0.6; }
        80%  { opacity: 0.15; }
        100% { opacity: 0; }
      }
      @keyframes rupture-ring {
        0%   { opacity: 0; transform: translate(-50%,-50%) scale(0); }
        6%   { opacity: 0.9; transform: translate(-50%,-50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%,-50%) scale(3.5); }
      }
      @keyframes energy-pulse {
        0%, 100% { opacity: 0.6; }
        50%       { opacity: 1; }
      }
    `}</style>

    {/* Central core flash */}
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      width: 220, height: 220,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(180,130,255,0.95) 0%, rgba(79,124,255,0.7) 35%, transparent 72%)',
      animation: 'rupture-core 3.2s cubic-bezier(0.16,1,0.3,1) forwards',
    }} />

    {/* Expanding shock rings */}
    {[0, 0.15, 0.35].map((delay, i) => (
      <div key={i} style={{
        position: 'absolute', left: '50%', top: '50%',
        width: 160 + i * 80, height: 160 + i * 80,
        borderRadius: '50%',
        border: '1.5px solid rgba(160,100,255,0.7)',
        animation: `rupture-ring 2.2s ${delay}s cubic-bezier(0.16,1,0.3,1) forwards`,
      }} />
    ))}

    {/* Radiating energy rays */}
    {Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * 360
      const len   = 120 + (i % 3) * 60
      return (
        <div key={`ray-${i}`} style={{
          position: 'absolute', left: '50%', top: '50%',
          width: 1.5,
          height: len,
          background: 'linear-gradient(to bottom, rgba(180,130,255,0.9), transparent)',
          transformOrigin: 'top center',
          transform: `rotate(${angle}deg) translateX(-50%)`,
          animation: `rupture-ray 2.8s ${0.02 * i}s ease-out forwards`,
        }} />
      )
    })}
  </div>
)

// ─── NEBULA BACKGROUND (CSS) ───────────────────────────────────────────────────

const NebulaBg = () => (
  <div className="pointer-events-none absolute inset-0 z-[1]">
    <style>{`
      @keyframes nebula-drift-a {
        0%,100% { transform: translate(-2%,-2%) scale(1); }
        50%     { transform: translate(2%,3%) scale(1.05); }
      }
      @keyframes nebula-drift-b {
        0%,100% { transform: translate(1%,2%) scale(1.03); }
        50%     { transform: translate(-3%,-1%) scale(1); }
      }
    `}</style>
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse 65% 50% at 20% 25%, rgba(90,40,160,0.18), transparent 60%)',
      animation: 'nebula-drift-a 80s ease-in-out infinite',
    }} />
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse 55% 45% at 80% 65%, rgba(20,60,140,0.16), transparent 65%)',
      animation: 'nebula-drift-b 100s ease-in-out infinite',
    }} />
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse 40% 35% at 60% 30%, rgba(60,20,100,0.1), transparent 60%)',
      animation: 'nebula-drift-a 120s ease-in-out infinite reverse',
    }} />
  </div>
)

// ─── TEXT ANIMATIONS ───────────────────────────────────────────────────────────

const textVariants = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0,   transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}

const transmissionVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 0.45, transition: { duration: 0.5, ease: 'easeOut' } },
  exit:    { opacity: 0,    transition: { duration: 0.4 } },
}

const finalItemVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { delay, duration: 1.3, ease: [0.16, 1, 0.3, 1] },
  }),
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────

const IntroSequence = ({ onEnter }) => {
  const [phase, setPhase]           = useState('black')
  const [ruptureKey, setRuptureKey] = useState(0)
  const [titleSpacing, setTitleSpacing] = useState('0.55em')

  // Build phase timeline
  useEffect(() => {
    const timers = []
    const s = PHASES

    // Fire rupture immediately
    setRuptureKey(k => k + 1)

    const t0 = s.toTransmission
    timers.push(setTimeout(() => setPhase('transmission'), t0))
    const t1 = t0 + s.transmissionHold
    timers.push(setTimeout(() => setPhase('transmission-out'), t1))
    const t2 = t1 + s.toYear
    timers.push(setTimeout(() => setPhase('year'), t2))
    const t3 = t2 + s.yearHold
    timers.push(setTimeout(() => setPhase('year-out'), t3))
    const t4 = t3 + s.toEarth
    timers.push(setTimeout(() => setPhase('earth'), t4))
    const t5 = t4 + s.earthHold
    timers.push(setTimeout(() => setPhase('earth-out'), t5))
    const t6 = t5 + s.toFinal
    timers.push(setTimeout(() => setPhase('final'), t6))

    return () => timers.forEach(clearTimeout)
  }, [])

  // Title letter-spacing entrance
  useEffect(() => {
    if (phase === 'final') {
      setTitleSpacing('0.55em')
      requestAnimationFrame(() => setTitleSpacing('0.20em'))
    }
  }, [phase])

  const isTransmission = phase === 'transmission'
  const isYear         = phase === 'year'
  const isEarth        = phase === 'earth'
  const isFinal        = phase === 'final'

  return (
    <section className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#04050a]">
      <style>{`
        @keyframes signal-flicker {
          0%,100% { opacity:1; }
          4%  { opacity:0.2; }
          6%  { opacity:1; }
          28% { opacity:1; }
          30% { opacity:0.1; }
          31% { opacity:0.85; }
          32% { opacity:0.15; }
          34% { opacity:1; }
          61% { opacity:0.4; }
          62% { opacity:1; }
          86% { opacity:0.2; }
          88% { opacity:1; }
        }
        @keyframes title-glow-breathe {
          0%,100% { text-shadow: 0 0 60px rgba(120,80,255,0.4), 0 0 120px rgba(79,124,255,0.15); }
          50%      { text-shadow: 0 0 90px rgba(140,90,255,0.55), 0 0 180px rgba(79,124,255,0.25); }
        }
        @keyframes scan-sweep {
          0%   { top:-2px; opacity:0; }
          4%   { opacity:0.6; }
          96%  { opacity:0.5; }
          100% { top:100%; opacity:0; }
        }
        @keyframes final-glow-ring {
          0%,100% { opacity:0.3; transform:translate(-50%,-50%) scale(1); }
          50%      { opacity:0.5; transform:translate(-50%,-50%) scale(1.06); }
        }
      `}</style>

      {/* ── Three.js solar system — renders immediately ── */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 48], fov: 40 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
        >
          <color attach="background" args={['#04050a']} />
          <SolarSystem phase={phase} />
        </Canvas>
      </div>

      {/* ── Colorful nebula atmosphere ── */}
      <NebulaBg />

      {/* ── Space-time rupture on load ── */}
      <AnimatePresence>
        {ruptureKey > 0 && <SpaceTimeRupture key={ruptureKey} />}
      </AnimatePresence>

      {/* ── Scan line ── */}
      <div
        className="pointer-events-none absolute inset-x-0 z-[6]"
        style={{
          height: '1px',
          background: 'linear-gradient(90deg,transparent 5%,rgba(130,80,255,0.45) 30%,rgba(255,255,255,0.65) 50%,rgba(130,80,255,0.45) 70%,transparent 95%)',
          boxShadow: '0 0 12px 3px rgba(120,80,255,0.18)',
          animation: 'scan-sweep 9s linear infinite',
        }}
      />

      {/* ── Vignette to center focus ── */}
      <div
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(2,2,8,0.78) 100%)' }}
      />

      {/* ── Text content ── */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <AnimatePresence mode="wait">
          {isTransmission && (
            <motion.p
              key="transmission"
              variants={transmissionVariants}
              initial="hidden" animate="visible" exit="exit"
              className="text-[10px] font-light tracking-[0.55em] text-white/40 uppercase sm:text-xs"
            >
              Transmission Incoming
            </motion.p>
          )}

          {isYear && (
            <motion.div
              key="year"
              variants={textVariants}
              initial="hidden" animate="visible" exit="exit"
              className="flex flex-col items-center gap-3"
            >
              <p
                className="text-sm font-light tracking-[0.55em] text-white/75 sm:text-base md:text-lg"
                style={{ animation: 'signal-flicker 3s step-end 1 forwards' }}
              >
                YEAR 2178
              </p>
            </motion.div>
          )}

          {isEarth && (
            <motion.p
              key="earth"
              variants={textVariants}
              initial="hidden" animate="visible" exit="exit"
              className="max-w-xl text-lg font-light tracking-[0.18em] text-white/70 sm:text-xl md:text-2xl"
            >
              EARTH COULD NO LONGER HOLD US.
            </motion.p>
          )}
        </AnimatePresence>

        {/* ── Final reveal ── */}
        {isFinal && (
          <div className="flex flex-col items-center">
            {/* Ambient glow ring behind title */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[900px] rounded-full"
              style={{
                background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(100,60,220,0.22), rgba(79,124,255,0.08) 45%, transparent 72%)',
                animation: 'final-glow-ring 7s ease-in-out infinite',
              }}
            />

            <motion.h1
              initial="hidden"
              animate="visible"
              custom={0}
              variants={finalItemVariants}
              className="relative text-6xl font-semibold text-white antialiased sm:text-7xl md:text-9xl"
              style={{
                letterSpacing: titleSpacing,
                transition: 'letter-spacing 2.2s cubic-bezier(0.16, 1, 0.3, 1)',
                animation: 'title-glow-breathe 6s ease-in-out infinite',
              }}
            >
              NOVA CITY
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={0.85}
              variants={finalItemVariants}
              className="mt-7 max-w-md text-sm font-light leading-relaxed tracking-[0.32em] text-white/50 sm:text-base md:text-lg"
            >
              THE FIRST HUMAN CIVILIZATION BEYOND EARTH
            </motion.p>

            {/* ENTER button — lowered for better visual composition */}
            <motion.div
              initial="hidden"
              animate="visible"
              custom={1.7}
              variants={finalItemVariants}
              className="mt-20 md:mt-28"
            >
              <EnterButton onClick={onEnter}>ENTER</EnterButton>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  )
}

export default IntroSequence