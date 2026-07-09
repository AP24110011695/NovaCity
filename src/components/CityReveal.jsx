import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import BuildingField from './BuildingField'
import SearchLights from './SearchLights'
import GroundFog from './GroundFog'
import AtmosphericParticles from './AtmosphericParticles'

const SceneFog = () => {
  const { scene } = useThree()
  scene.fog = new THREE.FogExp2('#080a10', 0.028)
  return null
}

// Slow, continuous drifting camera — never static, never abrupt.
const DriftingCamera = () => {
  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime()
    camera.position.x = Math.sin(t * 0.04) * 3
    camera.position.y = 3.5 + Math.sin(t * 0.03) * 0.5
    camera.position.z = 10 + Math.sin(t * 0.02) * 1.5
    camera.lookAt(0, 3, -16)
  })

  return null
}

const VolumetricSkyGlow = () => {
  const ref = useRef()

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.material.opacity = 0.1 + Math.sin(t * 0.1) * 0.03
  })

  return (
    <mesh ref={ref} position={[0, 6, -26]} scale={[40, 20, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color="#4F7CFF"
        transparent
        opacity={0.1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

const SceneContent = () => (
  <>
    <SceneFog />
    <DriftingCamera />

    <ambientLight intensity={0.06} color="#4F7CFF" />
    <hemisphereLight args={['#1a2440', '#020204', 0.25]} />

    <VolumetricSkyGlow />
    <BuildingField />
    <SearchLights />
    <GroundFog />
    <AtmosphericParticles />
  </>
)

/**
 * CityReveal
 * Placeholder skyline reveal: 40+ instanced buildings with blue window
 * lights, slow-sweeping search beams, low ground fog, rising ember
 * particles and distant flying streaks, volumetric sky glow, and a
 * slow continuously-drifting cinematic camera. Mounts starting from
 * full white (matching the end of AtmosphereTransition's flash) and
 * fades the white away to reveal the skyline — no visible seam.
 */
const CityReveal = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#080a10]">
      <style>
        {`
          @keyframes city-reveal-fade {
            0%   { opacity: 1; }
            100% { opacity: 0; }
          }
        `}
      </style>

      <Canvas
        camera={{ position: [0, 3.5, 10], fov: 55 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        className="absolute inset-0"
      >
        <color attach="background" args={['#080a10']} />
        <SceneContent />
      </Canvas>

      {/* Vignette for cinematic framing */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 100%)',
        }}
      />

      {/* White reveal overlay — continues directly from the atmosphere entry flash */}
      <div
        className="pointer-events-none absolute inset-0 bg-white"
        style={{ animation: 'city-reveal-fade 1s ease-out forwards' }}
      />
    </div>
  )
}

export default CityReveal