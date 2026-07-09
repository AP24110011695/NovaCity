import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const MIN_AMBIENT = 0.28
const MAX_AMBIENT = 0.42

const MIN_HEMISPHERE = 0.18
const MAX_HEMISPHERE = 0.32

const BREATH_PERIOD = 18

export default function EnvironmentBreathing() {
  const ambientRef = useRef()
  const hemisphereRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    const breath =
      0.5 +
      0.35 *
        Math.sin((2 * Math.PI * t) / BREATH_PERIOD) +
      0.15 *
        Math.sin(
          (2 * Math.PI * t) /
            (BREATH_PERIOD * 0.618)
        )

    const amount = THREE.MathUtils.clamp(
      breath,
      0,
      1
    )

    if (ambientRef.current) {
      ambientRef.current.intensity =
        THREE.MathUtils.lerp(
          MIN_AMBIENT,
          MAX_AMBIENT,
          amount
        )
    }

    if (hemisphereRef.current) {
      hemisphereRef.current.intensity =
        THREE.MathUtils.lerp(
          MIN_HEMISPHERE,
          MAX_HEMISPHERE,
          amount
        )
    }
  })

  return (
    <>
      <ambientLight
        ref={ambientRef}
        color="#d0deff"
        intensity={MIN_AMBIENT}
      />

      <hemisphereLight
        ref={hemisphereRef}
        skyColor="#c8d8ff"
        groundColor="#0a0c14"
        intensity={MIN_HEMISPHERE}
      />
    </>
  )
}