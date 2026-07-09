import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import CloudLayer from './CloudLayer'
import HeatDistortion from './HeatDistortion'

const TOTAL_DURATION_MS = 4600

// Ship AI status lines, timed against the descent.
const AI_LINES = [
  { text: 'BEGINNING ATMOSPHERIC DESCENT...', at: 150, hold: 1600 },
  { text: 'HULL TEMPERATURE RISING', at: 2400, hold: 1300 },
  { text: 'STABILIZING ENTRY VECTOR', at: 3400, hold: 1000 },
]

const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vPosition = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform vec3 glowColor;
  uniform float intensity;

  void main() {
    vec3 viewDir = normalize(-vPosition);
    float rim = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 1.6);
    gl_FragColor = vec4(glowColor, rim * intensity);
  }
`

const DiveSurface = () => {
  const surfaceRef = useRef()
  const glowRef = useRef()

  const glowUniforms = useMemo(
    () => ({
      glowColor: { value: new THREE.Color('#4F7CFF') },
      intensity: { value: 1.0 },
    }),
    []
  )

  return (
    <group>
      <mesh ref={surfaceRef} position={[0, 0, -14]}>
        <sphereGeometry args={[10, 64, 64]} />
        <meshStandardMaterial color="#0a0c11" roughness={0.95} metalness={0.05} />
      </mesh>

      <mesh ref={glowRef} position={[0, 0, -14]} scale={1.02}>
        <sphereGeometry args={[10, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          uniforms={glowUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>

      <pointLight position={[-6, 3, -6]} color="#4F7CFF" intensity={12} distance={30} decay={2} />
    </group>
  )
}

// Natural, accelerating, handheld camera — never robotic, never teleports.
const DiveCamera = ({ cloudRef }) => {
  useFrame(({ clock, camera }) => {
    const t = Math.min(clock.getElapsedTime() / (TOTAL_DURATION_MS / 1000), 1)
    const time = clock.getElapsedTime()

    // Ease-in-out acceleration curve — starts gentle, builds speed mid-way,
    // eases off just before the flash so it doesn't feel mechanical.
    const eased = t < 0.85 ? Math.pow(t / 0.85, 2.2) : 1
    camera.position.z = THREE.MathUtils.lerp(9, -6, eased)

    const shakeAmount = THREE.MathUtils.smoothstep(t, 0.25, 0.95) * 0.09
    const handheldX = Math.sin(time * 3.1) * 0.02 + Math.sin(time * 7.7 + 1.1) * 0.01
    const handheldY = Math.cos(time * 2.6) * 0.018 + Math.sin(time * 6.3 + 0.4) * 0.008

    camera.position.x = Math.sin(time * 14.0) * shakeAmount * 0.5 + handheldX
    camera.position.y = Math.cos(time * 17.0) * shakeAmount * 0.4 + handheldY
    camera.rotation.z = Math.sin(time * 9.0) * shakeAmount * 0.15 + Math.sin(time * 1.7) * 0.003

    camera.lookAt(0, 0, -14)

    if (cloudRef.current) {
      cloudRef.current.setProgress(t)
    }
  })

  return null
}

/**
 * AIStatusText
 * Ship AI status lines, timed via setTimeout against TOTAL_DURATION_MS.
 * Minimal typographic HUD text — no glass panel, just floating text,
 * consistent with a heads-up display during descent.
 */
const AIStatusText = () => {
  const [activeIndex, setActiveIndex] = useState(null)

  useEffect(() => {
    const timers = []

    AI_LINES.forEach((line, i) => {
      timers.push(
        setTimeout(() => setActiveIndex(i), line.at)
      )
      timers.push(
        setTimeout(() => {
          setActiveIndex((prev) => (prev === i ? null : prev))
        }, line.at + line.hold)
      )
    })

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 text-center">
      <style>
        {`
          @keyframes ai-text-in {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      {AI_LINES.map((line, i) => (
        <p
          key={line.text}
          className="text-xs font-light tracking-[0.35em] text-white/70"
          style={{
            display: activeIndex === i ? 'block' : 'none',
            animation: 'ai-text-in 0.8s ease-out forwards',
          }}
        >
          {line.text}
        </p>
      ))}
    </div>
  )
}

/**
 * AtmosphereTransition
 * Full "Atmospheric Entry" cinematic: ship AI status lines, accelerating
 * handheld camera dive, growing planet + blue atmospheric glow, thin
 * distant clouds that thicken into full cover, rising shake, heat
 * distortion, increasing brightness, and a 0.3s white flash at the end.
 */
const AtmosphereTransition = ({ onComplete }) => {
  const cloudRef = useRef()

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.()
    }, TOTAL_DURATION_MS)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <style>
        {`
          @keyframes entry-brightness {
            0%   { opacity: 0; }
            55%  { opacity: 0; }
            85%  { opacity: 0.35; }
            100% { opacity: 0.6; }
          }
          @keyframes entry-white-flash {
            0%   { opacity: 0; }
            91%  { opacity: 0; }
            94%  { opacity: 1; }
            100% { opacity: 1; }
          }
        `}
      </style>

      <Canvas
        camera={{ position: [0, 0, 9], fov: 55 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        className="absolute inset-0"
      >
        <color attach="background" args={['#050608']} />
        <fog attach="fog" args={['#0a0e16', 4, 26]} />
        <ambientLight intensity={0.08} color="#4F7CFF" />

        <DiveSurface />
        <CloudLayer ref={cloudRef} />
        <DiveCamera cloudRef={cloudRef} />
      </Canvas>

      <HeatDistortion durationMs={TOTAL_DURATION_MS} />

      <AIStatusText />

      <div
        className="pointer-events-none absolute inset-0 bg-white"
        style={{ animation: `entry-brightness ${TOTAL_DURATION_MS}ms ease-in forwards` }}
      />

      <div
        className="pointer-events-none absolute inset-0 bg-white"
        style={{ animation: `entry-white-flash ${TOTAL_DURATION_MS}ms ease-in forwards` }}
      />
    </div>
  )
}

export default AtmosphereTransition