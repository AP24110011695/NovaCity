import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Canvas, useFrame, useThree } from '@react-three/fiber'

import * as THREE from 'three'

import BuildingField from './BuildingField'

import SearchLights from './SearchLights'

import GroundFog from './GroundFog'

import AtmosphericParticles from './AtmosphericParticles'

import CameraDirector from './CameraDirector'



const ARRIVAL_KEYFRAMES = [

  { time: 0, pos: [0, 4, 14], lookAt: [0, 3, -20], fov: 55, ease: 'easeInOutCubic' },

  { time: 3.5, pos: [6, 5.5, -6], lookAt: [0, 5, -30], fov: 50, ease: 'easeOutCubic' },

  { time: 7, pos: [2, 6, -28], lookAt: [0, 8, -45], fov: 46, ease: 'easeOutExpo' },

  { time: 11, pos: [0, 7, -38], lookAt: [0, 10, -50], fov: 42, ease: 'easeOutExpo' },

]



const SETTLED_POS = new THREE.Vector3(0, 7, -38)

const SETTLED_LOOK = new THREE.Vector3(0, 10, -50)



const SceneFog = ({ dimmed }) => {

  const { scene } = useThree()

  scene.fog = new THREE.FogExp2('#080a10', dimmed ? 0.028 : 0.02)

  return null

}



const SettledCamera = () => {

  useFrame(({ clock, camera }) => {

    const t = clock.getElapsedTime()

    const handheldX = Math.sin(t * 1.7) * 0.03 + Math.sin(t * 4.1 + 1.0) * 0.012

    const handheldY = Math.cos(t * 1.3) * 0.025 + Math.sin(t * 3.3 + 0.6) * 0.01



    camera.position.set(

      SETTLED_POS.x + handheldX,

      SETTLED_POS.y + handheldY,

      SETTLED_POS.z,

    )

    camera.lookAt(SETTLED_LOOK.x, SETTLED_LOOK.y, SETTLED_LOOK.z)

    camera.rotation.z = Math.sin(t * 0.4) * 0.004



    if (Math.abs(camera.fov - 42) > 0.01) {

      camera.fov = 42

      camera.updateProjectionMatrix()

    }

  })



  return null

}



const VolumetricSkyGlow = ({ dimmed }) => {

  const ref = useRef()



  useFrame(({ clock }) => {

    if (!ref.current) return

    const t = clock.getElapsedTime()

    const base = dimmed ? 0.06 : 0.1

    ref.current.material.opacity = base + Math.sin(t * 0.1) * 0.02

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



const BuildingRevealDriver = ({ onProgress }) => {

  useFrame(({ clock }) => {

    const t = clock.getElapsedTime()

    const progress = THREE.MathUtils.smoothstep(t, 1.2, 4.5)

    onProgress(progress)

  })

  return null

}



const SceneContent = ({ phase, onSettled, dimmed, revealProgress }) => {

  const handleArrivalComplete = useCallback(() => {

    onSettled?.()

  }, [onSettled])



  const keyframes = useMemo(() => ARRIVAL_KEYFRAMES, [])



  return (

    <>

      <SceneFog dimmed={dimmed} />

      {phase === 'settled' ? (

        <SettledCamera />

      ) : (

        <>

          <CameraDirector

            keyframes={keyframes}

            playing

            loop={false}

            onComplete={handleArrivalComplete}

          />

          <BuildingRevealDriver onProgress={(p) => { revealProgress.current = p }} />

        </>

      )}



      <ambientLight intensity={dimmed ? 0.04 : 0.06} color="#4F7CFF" />

      <hemisphereLight args={['#1a2440', '#020204', dimmed ? 0.18 : 0.25]} />



      <VolumetricSkyGlow dimmed={dimmed} />

      <BuildingField revealProgressRef={revealProgress} />

      <SearchLights />

      <GroundFog />

      <AtmosphericParticles />

    </>

  )

}



const CityReveal = ({ phase = 'flythrough', onSettled, dimmed = false }) => {
  const revealProgress = useRef(0)

  useEffect(() => {
    if (phase === 'settled') revealProgress.current = 1
  }, [phase])



  return (

    <div className="relative h-full min-h-screen w-full overflow-hidden bg-[#080a10]">

      <Canvas

        camera={{ position: [0, 4, 14], fov: 55 }}

        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}

        dpr={dimmed ? [1, 1.25] : [1, 1.5]}

        className="absolute inset-0"

      >

        <color attach="background" args={['#080a10']} />

        <SceneContent

          phase={phase}

          onSettled={onSettled}

          dimmed={dimmed}

          revealProgress={revealProgress}

        />

      </Canvas>



      <div

        className="pointer-events-none absolute inset-0"

        style={{

          background: dimmed

            ? 'radial-gradient(ellipse at center, transparent 35%, rgba(8,10,16,0.55) 100%)'

            : 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 100%)',

        }}

      />

    </div>

  )

}



export default CityReveal

