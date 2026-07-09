import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Slow-rising ember-like particles, blue/white mix, drifting upward.
const EmberParticles = () => {
  const pointsRef = useRef()
  const count = 260

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50
      positions[i * 3 + 1] = Math.random() * 14
      positions[i * 3 + 2] = -6 - Math.random() * 30
      speeds[i] = Math.random() * 0.3 + 0.1
    }

    return { positions, speeds }
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const posAttr = pointsRef.current.geometry.attributes.position

    for (let i = 0; i < count; i++) {
      const idx = i * 3 + 1
      posAttr.array[idx] += speeds[i] * delta
      if (posAttr.array[idx] > 15) {
        posAttr.array[idx] = 0
      }
    }

    posAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color="#9fb3ff"
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// A few fast horizontal streaks suggesting distant flying traffic.
const FlyingStreaks = () => {
  const groupRef = useRef()
  const count = 6

  const streaks = useMemo(() => {
    return Array.from({ length: count }, () => ({
      y: Math.random() * 8 + 1,
      z: -8 - Math.random() * 24,
      speed: Math.random() * 6 + 4,
      startX: -30 - Math.random() * 20,
    }))
  }, [])

  const refs = useRef([])

  useFrame((_, delta) => {
    refs.current.forEach((mesh, i) => {
      if (!mesh) return
      mesh.position.x += streaks[i].speed * delta
      if (mesh.position.x > 30) {
        mesh.position.x = streaks[i].startX
      }
    })
  })

  return (
    <group ref={groupRef}>
      {streaks.map((s, i) => (
        <mesh
          key={i}
          ref={(el) => (refs.current[i] = el)}
          position={[s.startX, s.y, s.z]}
        >
          <planeGeometry args={[0.5, 0.02]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * AtmosphericParticles
 * Combines slow-rising ember/dust particles with a handful of fast
 * horizontal streaks (distant flying traffic) for a living, layered
 * atmosphere above the skyline.
 */
const AtmosphericParticles = () => {
  return (
    <>
      <EmberParticles />
      <FlyingStreaks />
    </>
  )
}

export default AtmosphericParticles