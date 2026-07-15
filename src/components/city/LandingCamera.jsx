import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { useDistrictSelection } from './SelectionManager'
import { DISTRICTS } from '../../data/districts'

export const LandingCamera = ({ onLanded }) => {
  const { camera, scene } = useThree()
  const { activeDistrictId } = useDistrictSelection()
  
  // Track where the camera should be looking
  const lookTarget = useRef(new THREE.Vector3(0, 15, -20))
  // Save the base position after landing
  const basePosition = useRef(new THREE.Vector3(0, 2.2, 15))
  // Keep track of orbit angle for the active district
  const orbitAngle = useRef(0)

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

    // Exposure adaptation
    const exposureObj = { val: 3.0 }
    gsap.to(exposureObj, {
      val: 1.0,
      duration: 8,
      ease: "power2.out",
    })

  }, [camera, onLanded])

  useEffect(() => {
    // If we select a district, animate towards it
    if (activeDistrictId) {
      const district = DISTRICTS.find(d => d.id === activeDistrictId)
      if (!district) return

      // Calculate a position slightly above and offset from the district
      // to look towards the HeroBuilding (0, 0, -25)
      const distCenter = new THREE.Vector3(district.center.x, 15, district.center.z)
      const heroPos = new THREE.Vector3(0, 0, -25)
      
      // Direction from hero to district
      const dir = new THREE.Vector3().subVectors(distCenter, heroPos).normalize()
      
      // Position camera outside the district, looking back towards hero
      const targetPos = new THREE.Vector3().copy(distCenter).add(dir.multiplyScalar(40))
      targetPos.y = 25 // elevate

      gsap.killTweensOf(camera.position)
      gsap.killTweensOf(lookTarget.current)

      gsap.to(camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 2.5,
        ease: "power3.inOut"
      })

      // The point we want to look at (center of district)
      gsap.to(lookTarget.current, {
        x: district.center.x,
        y: 10,
        z: district.center.z,
        duration: 2.5,
        ease: "power3.inOut"
      })
      
      orbitAngle.current = 0

    } else {
      // Return to base position
      gsap.killTweensOf(camera.position)
      gsap.killTweensOf(lookTarget.current)

      gsap.to(camera.position, {
        x: basePosition.current.x,
        y: basePosition.current.y,
        z: basePosition.current.z,
        duration: 2.5,
        ease: "power3.inOut"
      })

      gsap.to(lookTarget.current, {
        x: 0,
        y: 15,
        z: -20,
        duration: 2.5,
        ease: "power3.inOut"
      })
    }
  }, [activeDistrictId, camera])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    
    if (activeDistrictId) {
      // Subtle orbit around the selected district
      const district = DISTRICTS.find(d => d.id === activeDistrictId)
      if (district) {
        orbitAngle.current += 0.001
        // We add a tiny orbit offset dynamically, 
        // without overriding the GSAP animation too harshly
        const orbitRadius = 1.0
        const cx = Math.sin(orbitAngle.current) * orbitRadius
        const cz = Math.cos(orbitAngle.current) * orbitRadius
        
        // Combine current look target with some breathing
        const currentLook = lookTarget.current.clone()
        currentLook.y += Math.sin(t * 1.5) * 0.1
        camera.lookAt(currentLook)
        
        // Small position breathing on top of GSAP target
        camera.position.x += cx * 0.01
        camera.position.z += cz * 0.01
      }
    } else {
      // Subtle idle breathing
      camera.position.x += Math.sin(t * 0.8) * 0.002
      camera.position.y += Math.sin(t * 1.2) * 0.001
      // Keep looking slightly up at hero building
      const currentLook = lookTarget.current.clone()
      currentLook.y += Math.sin(t * 0.5) * 0.2
      camera.lookAt(currentLook)
    }
  })

  return null
}
