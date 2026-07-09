import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const LIGHT_CONFIGS = [
  { position: [-14, 0, -20], speed: 0.12, tiltSpeed: 0.05, offset: 0 },
  { position: [10, 0, -34], speed: -0.09, tiltSpeed: 0.04, offset: 2.1 },
  { position: [2, 0, -50], speed: 0.07, tiltSpeed: 0.06, offset: 4.4 },
  { position: [-6, 0, -62], speed: -0.05, tiltSpeed: 0.045, offset: 1.3 },
]

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