import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import CloudLayer from './CloudLayer'
import HeatDistortion from './HeatDistortion'

const TOTAL_DURATION_MS = 4000 // full "Atmospheric Entry" sequence length

// Fresnel-style planet + atmosphere, filling the frame as the camera dives in.
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
  const materialRef = useRef()
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
        <meshStandardMaterial
          ref={materialRef}
          color="#0a0c11"
          roughness={0.95}
          metalness={0.05}
        />
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

// Accelerating dolly-in with increasing handheld shake — never teleports,
// always eases. Driven purely off the Canvas clock (0 at mount).
const DiveCamera = ({ cloudRef }) => {
  useFrame(({ clock, camera }) => {
    const t = Math.min(clock.getElapsedTime() / (TOTAL_DURATION_MS / 1000), 1)

    // Accelerating ease — starts slow, ends fast (ease-in cubic).
    const eased = t * t * t
    camera.position.z = THREE.MathUtils.lerp(9, -6, eased)

    // Shake grows with progress, capped near the end.
    const shakeAmount = THREE.MathUtils.smoothstep(t, 0.25, 0.95) * 0.09
    const time = clock.getElapsedTime()
    camera.position.x = Math.sin(time * 14.0) * shakeAmount * 0.5
    camera.position.y = Math.cos(time * 17.0) * shakeAmount * 0.4
    camera.rotation.z = Math.sin(time * 9.0) * shakeAmount * 0.15

    camera.lookAt(0, 0, -14)

    // Drive cloud density/coverage from the same progress value.
    if (cloudRef.current) {
      cloudRef.current.setProgress(t)
    }
  })

  return null
}

/**
 * AtmosphereTransition
 * The full "Atmospheric Entry" cinematic: accelerating camera dive,
 * growing planet + blue atmospheric glow, thin clouds crossing frame
 * that thicken into full cloud cover, increasing shake, heat
 * distortion, rising brightness, and a 0.4s white flash at the end.
 * Calls onComplete once the white flash begins holding, so the parent
 * can mount CityReveal (which starts from full white) with no visible
 * seam.
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
            88%  { opacity: 0; }
            92%  { opacity: 1; }
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

      {/* Rising brightness wash as we approach the surface */}
      <div
        className="pointer-events-none absolute inset-0 bg-white"
        style={{
          animation: `entry-brightness ${TOTAL_DURATION_MS}ms ease-in forwards`,
        }}
      />

      {/* Final 0.4s white flash */}
      <div
        className="pointer-events-none absolute inset-0 bg-white"
        style={{
          animation: `entry-white-flash ${TOTAL_DURATION_MS}ms ease-in forwards`,
        }}
      />
    </div>
  )
}

export default AtmosphereTransition