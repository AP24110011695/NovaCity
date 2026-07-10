import { useMemo, useRef, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'

import CameraDirector from './CameraDirector'
import { CityGenerator } from './CityGenerator'
import LivingCity from './LivingCity'
import { CloudLayer } from './CloudLayer'
import { SkyAtmosphere } from './SkyAtmosphere'

const CAMERA_KEYFRAMES = [
  {
    time: 0,
    position: [0, 170, 300],
    target: [0, 0, 0],
    fov: 60,
    easing: 'easeInOutCubic',
  },

  {
    time: 4,
    position: [40, 130, 220],
    target: [0, 20, 0],
    fov: 54,
    easing: 'easeOutCubic',
  },

  {
    time: 8,
    position: [18, 75, 140],
    target: [0, 28, 0],
    fov: 48,
    easing: 'easeOutExpo',
  },

  {
    time: 12,
    position: [0, 38, 82],
    target: [0, 30, -12],
    fov: 42,
    easing: 'easeOutExpo',
  },
]

function SceneContents() {
  const [buildingData, setBuildingData] = useState([])

  const cityRef = useRef()

  const handleCityGenerated = useCallback((data) => {
    setBuildingData(data)
  }, [])

  const cameraOptions = useMemo(
    () => ({
      loop: false,
      duration: 12,
      keyframes: CAMERA_KEYFRAMES,
    }),
    []
  )

  return (
    <>
      <color attach="background" args={['#020408']} />

      <fogExp2
        attach="fog"
        color="#040812"
        density={0.0028}
      />

      <CameraDirector {...cameraOptions} />

      <SkyAtmosphere />

      <CloudLayer
        count={4}
        height={140}
      />

      <CityGenerator
        ref={cityRef}
        seed={2178}
        onCityGenerated={handleCityGenerated}
      />

      <LivingCity
        buildingData={buildingData}
        fogGroundY={0}
        fogRadius={320}
        fogDensity={0.12}
        particleAlpha={0.16}
      />
    </>
  )
}
export default function CityScene() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#020408]">
      <Canvas
        shadows={false}
        dpr={[1, 2]}
        camera={{
          position: [0, 170, 300],
          fov: 60,
          near: 0.1,
          far: 2500,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
      >
        <ambientLight intensity={0.18} color="#8FB6FF" />

        <directionalLight
          position={[120, 180, 80]}
          intensity={1.4}
          color="#D6E5FF"
        />

        <SceneContents />
      </Canvas>
    </div>
  )
}