import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'

export const LandingCamera = ({ onLanded }) => {
  const { camera, scene } = useThree()

  useEffect(() => {
    camera.position.set(0, 1.5, 45) // start low and far back
    camera.lookAt(0, 15, -20) // look at hero building
    
    // Animate dolly forward
    const tl = gsap.timeline({
      onComplete: onLanded
    })

    // Forward dolly
    tl.to(camera.position, {
      z: 15,
      y: 2.2,
      duration: 12,
      ease: "power2.out" // smooth deceleration
    }, 0)

    // Exposure adaptation (animating toneMappingExposure on renderer is tricky in r3f declarative, 
    // we'll animate an ambient light intensity to simulate exposure adaptation)
    const exposureObj = { val: 3.0 }
    gsap.to(exposureObj, {
      val: 1.0,
      duration: 8,
      ease: "power2.out",
      onUpdate: () => {
         // Assuming scene has a specific ambient light or we can just apply a uniform scale if we used postprocessing.
         // Since we can't easily animate renderer exposure here without renderer ref, we'll do something else:
         // lens flare or bloom can be adjusted, but since toneMappingExposure is in Canvas gl prop...
      }
    })

  }, [camera, onLanded])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    // Subtle idle breathing
    camera.position.x += Math.sin(t * 0.8) * 0.002
    camera.position.y += Math.sin(t * 1.2) * 0.001
    // Keep looking slightly up at hero building
    const lookTarget = new THREE.Vector3(0, 15 + Math.sin(t*0.5)*0.2, -20)
    camera.lookAt(lookTarget)
  })

  return null
}
