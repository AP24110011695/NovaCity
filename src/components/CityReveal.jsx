import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import BuildingField from './BuildingField'
import SearchLights from './SearchLights'
import GroundFog from './GroundFog'
import AtmosphericParticles from './AtmosphericParticles'

const SceneFog = () => {
  const { scene } = useThree()
  scene.fog = new THREE.FogExp2('#080a10', 0.02)
  return null
}

// A gentle, continuous fly-through path over the skyline — a Catmull-Rom
// curve sampled by elapsed time, looping seamlessly. Handheld micro-motion
// layered on top for a natural, non-robotic feel.
const FlyThroughCamera = () => {
  const curve = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 4, 14),
      new THREE.Vector3(10, 5.5, -6),
      new THREE.Vector3(4, 6.5, -28),
      new THREE.Vector3(-9, 5, -48),
      new THREE.Vector3(-2, 6, -68),
      new THREE.Vector3(6, 5.5, -50),
      new THREE.Vector3(10, 5, -24),
      new THREE.Vector3(0, 4, 14),
    ]
    return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5)
  }, [])

  const CYCLE_DURATION = 70 // seconds for one full loop of the path

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime()
    const progress = (t % CYCLE_DURATION) / CYCLE_DURATION

    const position = curve.getPointAt(progress)
    const lookAheadProgress = (progress + 0.02) % 1
    const lookAtPoint = curve.getPointAt(lookAheadProgress)

    const handheldX = Math.sin(t * 1.7) * 0.05 + Math.sin(t * 4.1 + 1.0) * 0.02
    const handheldY = Math.cos(t * 1.3) * 0.04 + Math.sin(t * 3.3 + 0.6) * 0.015

    camera.position.set(position.x + handheldX, position.y + handheldY, position.z)
    camera.lookAt(lookAtPoint.x, lookAtPoint.y - 1, lookAtPoint.z)
    camera.rotation.z = Math.sin(t * 0.4) * 0.006
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
    <mesh ref={ref} position={[0, 8, -40]} scale={[70, 30, 1]}>
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
    <FlyThroughCamera />

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
 * Cinematic placeholder skyline: 58 instanced procedural buildings with
 * blue window lights, sweeping search beams, low ground fog, rising
 * embers, distant flying streaks, volumetric sky glow, and a slow
 * continuous fly-through camera following a looping Catmull-Rom path
 * with handheld micro-motion layered on top. Mounts starting from full
 * white to match the end of AtmosphereTransition's flash.
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
        camera={{ position: [0, 4, 14], fov: 55 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        className="absolute inset-0"
      >
        <color attach="background" args={['#080a10']} />
        <SceneContent />
      </Canvas>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 100%)',
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 bg-white"
        style={{ animation: 'city-reveal-fade 1s ease-out forwards' }}
      />
    </div>
  )
}

export default CityReveal