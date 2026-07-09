import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const LIGHT_CONFIGS = [
  { position: [-10, 0, -14], speed: 0.12, tiltSpeed: 0.05, offset: 0 },
  { position: [8, 0, -20], speed: -0.09, tiltSpeed: 0.04, offset: 2.1 },
  { position: [2, 0, -30], speed: 0.07, tiltSpeed: 0.06, offset: 4.4 },
]

// A single volumetric-looking beam: a soft, elongated additive cone.
const Beam = ({ position, speed, tiltSpeed, offset }) => {
  const groupRef = useRef()

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime() + offset
    groupRef.current.rotation.y = t * speed
    groupRef.current.rotation.x = -0.35 + Math.sin(t * tiltSpeed) * 0.15
  })

  return (
    <group position={position} ref={groupRef}>
      <mesh position={[0, 9, 0]}>
        <coneGeometry args={[3.2, 18, 24, 1, true]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.045}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/**
 * SearchLights
 * A handful of slow-rotating volumetric-looking search beams sweeping
 * across the skyline. Purely additive-blended cones — no real
 * THREE.SpotLight cost, cheap to render.
 */
const SearchLights = () => {
  return (
    <>
      {LIGHT_CONFIGS.map((cfg, i) => (
        <Beam key={i} {...cfg} />
      ))}
    </>
  )
}

export default SearchLights