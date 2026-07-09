import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Procedural radial-fade texture — no external assets.
const generateFogTexture = () => {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  )
  gradient.addColorStop(0, 'rgba(180, 195, 230, 0.55)')
  gradient.addColorStop(0.5, 'rgba(120, 140, 190, 0.25)')
  gradient.addColorStop(1, 'rgba(120, 140, 190, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

/**
 * GroundFog
 * Low-lying fog plane using a procedurally generated radial-gradient
 * texture, gently drifting via texture offset — no geometry animation,
 * negligible per-frame cost.
 */
const GroundFog = () => {
  const meshRef = useRef()
  const texture = useMemo(() => generateFogTexture(), [])

  useFrame((_, delta) => {
    texture.offset.x += delta * 0.004
    texture.offset.y += delta * 0.002
  })

  return (
    <mesh ref={meshRef} position={[0, 0.1, -18]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[70, 40]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

export default GroundFog