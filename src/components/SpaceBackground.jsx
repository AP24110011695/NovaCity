import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'

// Extremely subtle autonomous camera drift — no user input, no controls.
const DriftingCamera = () => {
  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime()
    camera.position.x = Math.sin(t * 0.05) * 0.6
    camera.position.y = Math.cos(t * 0.04) * 0.35
    camera.lookAt(0, 0, 0)
  })

  return null
}

// Soft glow plane, additive-blended, tinted #4F7CFF — reads as a distant
// nebula/light source rather than a hard object. Minimal geometry (one plane).
const Glow = ({ position, scale, color, opacity }) => {
  const ref = useRef()

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    const pulse = 0.85 + Math.sin(t * 0.15 + position[0]) * 0.15
    ref.current.material.opacity = opacity * pulse
  })

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

// Applies scene-level depth fog so distant stars fade into black,
// matching the low-contrast, cinematic feel of the rest of NOVA CITY.
const SceneFog = () => {
  const { scene } = useThree()
  scene.fog = new THREE.FogExp2('#050608', 0.045)
  return null
}

const SceneContent = () => {
  return (
    <>
      <SceneFog />
      <DriftingCamera />

      <Stars
        radius={60}
        depth={40}
        count={2200}
        factor={2.2}
        saturation={0}
        fade
        speed={0.15}
      />

      {/* Soft blue glow, upper-left, distant */}
      <Glow
        position={[-6, 3, -18]}
        scale={[14, 14, 1]}
        color="#4F7CFF"
        opacity={0.18}
      />

      {/* Soft blue glow, lower-right, closer */}
      <Glow
        position={[5, -2.5, -10]}
        scale={[10, 10, 1]}
        color="#4F7CFF"
        opacity={0.12}
      />

      {/* Faint white ambient glow near center for depth-of-field feel */}
      <Glow
        position={[0, 0, -14]}
        scale={[20, 20, 1]}
        color="#ffffff"
        opacity={0.04}
      />
    </>
  )
}

/**
 * SpaceBackground
 * Reusable React Three Fiber background: a minimal-geometry depth-of-field
 * space scene (stars + soft glow + fog), restricted to the #4F7CFF / white /
 * black palette. Camera drifts extremely slowly and autonomously — no
 * OrbitControls, no user interaction. Intended to sit behind existing CSS
 * layers (e.g. StarField, IntroSequence) as a full-screen fixed backdrop.
 */
const SpaceBackground = () => {
  return (
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
}

export default SpaceBackground