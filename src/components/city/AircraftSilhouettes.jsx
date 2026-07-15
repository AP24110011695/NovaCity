import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export const AircraftSilhouettes = () => {
  const groupRef = useRef()
  const COUNT = 6
  
  const planes = useMemo(() => {
    return Array.from({length: COUNT}).map(() => ({
      y: 35 + Math.random() * 30,
      z: -50 - Math.random() * 50,
      speed: 8 + Math.random() * 12,
      startX: -100 - Math.random() * 50,
      scale: 1 + Math.random() * 0.5
    }))
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.children.forEach((mesh, i) => {
      const p = planes[i]
      p._x = p._x ?? p.startX
      p._x += p.speed * delta
      if (p._x > 120) p._x = p.startX
      mesh.position.set(p._x, p.y, p.z)
    })
  })

  return (
    <group ref={groupRef}>
      {planes.map((p, i) => (
        <mesh key={i} scale={p.scale}>
          <planeGeometry args={[3, 0.8]} />
          <meshBasicMaterial color="#020306" fog={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
