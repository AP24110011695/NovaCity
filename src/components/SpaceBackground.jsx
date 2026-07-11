import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Autonomous cinematic camera — very slow drift, no user input
const DriftingCamera = () => {
  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime()
    camera.position.x = Math.sin(t * 0.04) * 0.8
    camera.position.y = Math.cos(t * 0.032) * 0.45
    camera.lookAt(0, 0, 0)
  })
  return null
}

// Soft colored glow planes — nebula feel
const GlowPlane = ({ position, scale, color, opacity, driftSpeed = 0.12, driftPhase = 0 }) => {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.material.opacity = opacity * (0.8 + Math.sin(t * driftSpeed + driftPhase) * 0.2)
  })
  return (
    <mesh ref={ref} position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  )
}

// Multi-colored star field with per-star color
const RichStarField = () => {
  const matRef = useRef()
  const count  = 2800

  const { positions, sizes, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes     = new Float32Array(count)
    const colors    = new Float32Array(count * 3)

    // Star color palette: white, cool blue, warm gold, violet, pale orange
    const palette = [
      [1.00, 1.00, 1.00],
      [0.68, 0.78, 1.00],
      [1.00, 0.92, 0.65],
      [0.80, 0.65, 1.00],
      [1.00, 0.78, 0.55],
    ]

    for (let i = 0; i < count; i++) {
      const radius = 50 + Math.random() * 50
      const theta  = Math.random() * Math.PI * 2
      const phi    = Math.acos(2 * Math.random() - 1)
      positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      sizes[i] = Math.random() * 2.0 + 0.3

      const col = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3]     = col[0]
      colors[i * 3 + 1] = col[1]
      colors[i * 3 + 2] = col[2]
    }
    return { positions, sizes, colors }
  }, [])

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPR:   { value: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5) },
  }), [])

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime()
  })

  const vert = `
    attribute float aSize;
    uniform float uTime;
    uniform float uPR;
    varying vec3 vColor;
    void main() {
      vColor = color;
      float tw = 1.0 + sin(uTime * 0.6 + position.x * 0.3) * 0.2;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * uPR * (220.0 / -mv.z) * tw;
      gl_Position = projectionMatrix * mv;
    }
  `
  const frag = `
    varying vec3 vColor;
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d  = length(uv);
      float a  = smoothstep(0.5, 0.05, d);
      gl_FragColor = vec4(vColor, a * 0.88);
    }
  `

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize"    count={count} array={sizes}     itemSize={1} />
        <bufferAttribute attach="attributes-color"    count={count} array={colors}    itemSize={3} />
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

const SceneFog = () => {
  const { scene } = useThree()
  scene.fog = new THREE.FogExp2('#050608', 0.038)
  return null
}

const SceneContent = () => (
  <>
    <SceneFog />
    <DriftingCamera />
    <RichStarField />

    {/* Deep violet nebula cloud — upper left */}
    <GlowPlane position={[-8, 4, -22]} scale={[22, 18, 1]} color="#4a1a8a" opacity={0.20} driftSpeed={0.10} driftPhase={0} />
    {/* Blue nebula — right side, further back */}
    <GlowPlane position={[6, -2, -28]} scale={[20, 16, 1]} color="#1a3a8a" opacity={0.16} driftSpeed={0.08} driftPhase={1.5} />
    {/* Warm gold accent — center-bottom */}
    <GlowPlane position={[2, -5, -18]} scale={[14, 10, 1]} color="#553300" opacity={0.10} driftSpeed={0.13} driftPhase={3.0} />
    {/* Teal-blue accent — upper right */}
    <GlowPlane position={[10, 6, -24]} scale={[16, 12, 1]} color="#0a4a6a" opacity={0.12} driftSpeed={0.07} driftPhase={2.1} />
    {/* Faint white ambient center */}
    <GlowPlane position={[0, 0, -18]} scale={[24, 24, 1]} color="#ffffff" opacity={0.03} driftSpeed={0.05} driftPhase={0.8} />
    {/* Nova blue signature glow */}
    <GlowPlane position={[-3, 1, -14]} scale={[14, 14, 1]} color="#4F7CFF" opacity={0.14} driftSpeed={0.15} driftPhase={4.2} />
  </>
)

/**
 * SpaceBackground
 * Rich multi-color deep-space backdrop: colored star field + layered nebula
 * glow planes + exponential fog. Camera drifts autonomously. Zero user input.
 */
const SpaceBackground = () => (
  <div className="pointer-events-none absolute inset-0">
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
    >
      <color attach="background" args={['#050608']} />
      <SceneContent />
    </Canvas>
  </div>
)

export default SpaceBackground