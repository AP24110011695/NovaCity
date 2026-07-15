import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { CloudBank, SpeedStreaks, ImpactDebris, ShockwaveRing, ScatteringOverlay } from '../AtmosphereTransition'
import { triggerCinematicEvent } from '../../hooks/useCinematicEvents'

// Total duration of the descent animation
const DESCENT_DURATION = 9.2

export const TransitionWebGL = ({ active, targetPlanet, onComplete, onProgress }) => {
  const { camera } = useThree()
  const progressRef = useRef(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (active && targetPlanet) {
      setMounted(true)
      triggerCinematicEvent('onAtmosphereEnter')

      const startPos = camera.position.clone()
      const startQuat = camera.quaternion.clone()
      
      const targetPos = new THREE.Vector3()
      if (targetPlanet.groupRef) {
        targetPlanet.groupRef.getWorldPosition(targetPos)
      } else {
        targetPos.set(targetPlanet.data.cameraTarget.x, targetPlanet.data.cameraTarget.y, targetPlanet.data.cameraTarget.z)
      }

      // Calculate direction to dive into the planet
      const diveDir = targetPos.clone().sub(startPos).normalize()
      // Stop just before the center so we don't go through the other side immediately
      const endPos = targetPos.clone().sub(diveDir.multiplyScalar(0.2))

      // Keep looking at target
      const dummyCam = new THREE.PerspectiveCamera()
      dummyCam.position.copy(endPos)
      dummyCam.lookAt(targetPos)
      const endQuat = dummyCam.quaternion

      let landingStartedTriggered = false

      const tl = gsap.timeline({
        onUpdate: () => {
          const p = tl.progress()
          progressRef.current = p
          onProgress?.(p)
          
          if (p > 0.3 && !landingStartedTriggered) {
             landingStartedTriggered = true
             triggerCinematicEvent('onLandingStarted')
          }
        },
        onComplete: () => {
          triggerCinematicEvent('onLandingFinished')
          onComplete?.()
        }
      })

      tl.to(progressRef, {
        current: 1,
        duration: DESCENT_DURATION,
        ease: "power2.in",
        onUpdate: () => {
           const p = progressRef.current
           
           // Ease-in-cubic then ease-off near the end so it doesn't snap
           const eased = p < 0.8 ? Math.pow(p / 0.8, 2.6) * 0.88 : 0.88 + (p - 0.8) / 0.2 * 0.12

           // Interpolate position and rotation smoothly
           camera.position.lerpVectors(startPos, endPos, eased)
           camera.quaternion.slerpQuaternions(startQuat, endQuat, eased)

           // Procedural shake
           const shakeEnvelope = THREE.MathUtils.smoothstep(p, 0.12, 0.55) * (1 - THREE.MathUtils.smoothstep(p, 0.80, 0.95))
           const shakeAmt = shakeEnvelope * 0.12
           const highFreq = shakeAmt * 0.5
           const rawT = p * DESCENT_DURATION 

           camera.position.x += Math.sin(rawT * 11.3) * shakeAmt + Math.sin(rawT * 23.7 + 1.1) * highFreq + Math.sin(rawT * 2.1) * 0.018
           camera.position.y += Math.cos(rawT * 13.7) * shakeAmt * 0.85 + Math.sin(rawT * 31.1 + 0.4) * highFreq * 0.7 + Math.sin(rawT * 1.7 + 0.7) * 0.014
           camera.rotation.z += Math.sin(rawT * 8.9) * shakeAmt * 0.25 + Math.sin(rawT * 1.4) * 0.004
        }
      })
    }
  }, [active, targetPlanet, camera, onComplete, onProgress])

  if (!mounted || !targetPlanet) return null

  const targetPos = new THREE.Vector3()
  if (targetPlanet.groupRef) {
    targetPlanet.groupRef.getWorldPosition(targetPos)
  } else {
    targetPos.set(targetPlanet.data.cameraTarget.x, targetPlanet.data.cameraTarget.y, targetPlanet.data.cameraTarget.z)
  }
  
  // Position effects just in front of the planet to simulate atmospheric entry
  const offset = camera.position.clone().sub(targetPos).normalize().multiplyScalar(4)
  const effectPos = targetPos.clone().add(offset)
  
  // Rotate effects to face camera
  const dummy = new THREE.Object3D()
  dummy.position.copy(effectPos)
  dummy.lookAt(camera.position)

  return (
    <group position={effectPos} quaternion={dummy.quaternion}>
      {/* Since AtmosphereTransition components were built for a camera looking down -Z, 
          and our dummy looks AT the camera (+Z), we need to rotate 180 on Y so they face the camera correctly */}
      <group rotation={[0, Math.PI, 0]}>
        <ShockwaveRing progressRef={progressRef} />
        <ImpactDebris progressRef={progressRef} />
        <CloudBank progressRef={progressRef} />
        <SpeedStreaks progressRef={progressRef} />
      </group>
    </group>
  )
}

export const TransitionHTML = ({ active, progress }) => {
  if (!active) return null

  // Based on T.TOTAL = 9200ms
  const totalMs = DESCENT_DURATION * 1000

  return (
    <>
      <style>{`
        @keyframes heat-warp {
          0%{opacity:0} 22%{opacity:0} 42%{opacity:0.6} 75%{opacity:0.85} 90%{opacity:0.4} 100%{opacity:0}
        }
        @keyframes city-glow-rise {
          0%,60%{opacity:0} 80%{opacity:0.45} 90%{opacity:0.75} 100%{opacity:0}
        }
        @keyframes atm-brightness {
          0%,55%{opacity:0} 78%{opacity:0.28} 100%{opacity:0.55}
        }
        @keyframes atm-vignette-in {
          0%{opacity:0} 30%{opacity:1}
        }
        @keyframes atm-exit-flash {
          0%,91%{opacity:0} 95%{opacity:1} 100%{opacity:1}
        }
      `}</style>
      
      <ScatteringOverlay progress={progress} />

      {/* Heat distortion — SVG filter */}
      <svg className="absolute h-0 w-0">
        <filter id="novaDescent">
          <feTurbulence type="turbulence" baseFrequency="0.009 0.025" numOctaves="3" seed="14" result="noise">
            <animate attributeName="baseFrequency" dur="5s"
              values="0.009 0.025;0.016 0.040;0.009 0.025" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div
        className="pointer-events-none absolute inset-0 z-[11]"
        style={{
          backdropFilter: 'url(#novaDescent) blur(0.3px)',
          WebkitBackdropFilter: 'blur(0.3px)',
          animation: `heat-warp ${totalMs}ms ease-in-out forwards`,
        }}
      />

      {/* City glow bleed-through */}
      <div
        className="pointer-events-none absolute inset-0 z-[12]"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 70%, rgba(79,124,255,0.6), rgba(20,40,120,0.3) 50%, transparent 75%)',
          animation: `city-glow-rise ${totalMs}ms ease-in-out forwards`,
        }}
      />

      {/* Ambient brightness rise */}
      <div
        className="pointer-events-none absolute inset-0 z-[13] bg-[#c8d4ff]"
        style={{ animation: `atm-brightness ${totalMs}ms ease-in forwards`, mixBlendMode: 'screen' }}
      />

      {/* Edge vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-[14]"
        style={{
          background: 'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 30%, rgba(0,0,0,0.75) 100%)',
          animation: 'atm-vignette-in 1.2s ease-out forwards',
        }}
      />

      {/* Final white-out exit flash */}
      <div
        className="pointer-events-none absolute inset-0 z-[20] bg-white"
        style={{ animation: `atm-exit-flash ${totalMs}ms linear forwards` }}
      />
    </>
  )
}
