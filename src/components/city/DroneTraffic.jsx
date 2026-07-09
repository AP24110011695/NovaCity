import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const DRONE_COUNT = 32

// Shared geometry/material instances — never recreated
const _bodyGeo = new THREE.BoxGeometry(0.6, 0.12, 1.4)
const _glowGeo = new THREE.SphereGeometry(0.18, 8, 8)

const _bodyMat = new THREE.MeshStandardMaterial({
  color: 0x1a1a2e,
  roughness: 0.4,
  metalness: 0.9,
})

const _glowMat = new THREE.MeshBasicMaterial({
  color: 0x4f7cff,
  transparent: true,
  opacity: 0.85,
})



export function DroneTraffic() {
  const bodyRef = useRef()
  const glowRef = useRef()

  // Per-drone orbital parameters — computed once
  const drones = useMemo(() => {
    return Array.from({ length: DRONE_COUNT }, (_, i) => {
      const lane = i % 4
      const radius = 28 + lane * 18 + Math.random() * 12
      const height = 12 + Math.random() * 55
      const speed = 0.08 + Math.random() * 0.14   // rad/s
      const phase = Math.random() * Math.PI * 2
      const tiltX = (Math.random() - 0.5) * 0.18
      const tiltZ = (Math.random() - 0.5) * 0.12
      const glowPulse = 0.6 + Math.random() * 0.4
      const glowSpeed = 1.2 + Math.random() * 2.0
      return { radius, height, speed, phase, tiltX, tiltZ, glowPulse, glowSpeed }
    })
  }, [])

  // Reusable scratch objects — never allocate inside useFrame
  const _dummy = useMemo(() => new THREE.Object3D(), [])
  const _glowDummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    for (let i = 0; i < DRONE_COUNT; i++) {
      const d = drones[i]
      const angle = d.phase + t * d.speed

      const x = Math.cos(angle) * d.radius
      const z = Math.sin(angle) * d.radius
      const y = d.height + Math.sin(t * 0.3 + d.phase) * 0.8

      // Body — orient drone along velocity tangent
      _dummy.position.set(x, y, z)
      _dummy.rotation.set(d.tiltX, -angle + Math.PI * 0.5, d.tiltZ)
      _dummy.updateMatrix()
      bodyRef.current.setMatrixAt(i, _dummy.matrix)

      // Glow — engine flicker
      const flicker = d.glowPulse + Math.sin(t * d.glowSpeed + d.phase) * 0.25
      _glowDummy.position.set(x, y - 0.08, z)
      _glowDummy.scale.setScalar(flicker)
      _glowDummy.updateMatrix()
      glowRef.current.setMatrixAt(i, _glowDummy.matrix)
    }

    bodyRef.current.instanceMatrix.needsUpdate = true
    glowRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group name="drone-traffic">
      <instancedMesh ref={bodyRef} args={[_bodyGeo, _bodyMat, DRONE_COUNT]} castShadow />
      <instancedMesh ref={glowRef} args={[_glowGeo, _glowMat, DRONE_COUNT]} />
    </group>
  )
}
