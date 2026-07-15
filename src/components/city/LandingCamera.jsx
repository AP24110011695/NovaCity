import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { useDistrictSelection } from './SelectionManager'
import { useBuildingSelection } from './BuildingManager'
import { DISTRICTS } from '../../data/districts'
import { LANDMARKS } from '../../data/landmarks'

export const LandingCamera = ({ onLanded }) => {
  const { camera, scene } = useThree()
  const { activeDistrictId } = useDistrictSelection()
  const { activeBuildingId } = useBuildingSelection()
  
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
    let targetPos = null;
    let targetLookAt = null;

    if (activeBuildingId) {
      // Prioritize building selection
      const building = LANDMARKS.find(b => b.id === activeBuildingId);
      const district = building ? DISTRICTS.find(d => d.id === building.districtId) : null;
      if (district) {
        // Position camera closely, low angle
        targetPos = new THREE.Vector3(district.center.x + 18, 5, district.center.z + 18);
        targetLookAt = new THREE.Vector3(district.center.x, 20, district.center.z);
      }
    } else if (activeDistrictId) {
      // Fallback to district selection
      const district = DISTRICTS.find(d => d.id === activeDistrictId);
      if (district) {
        const distCenter = new THREE.Vector3(district.center.x, 15, district.center.z);
        const heroPos = new THREE.Vector3(0, 0, -25);
        const dir = new THREE.Vector3().subVectors(distCenter, heroPos).normalize();
        
        targetPos = new THREE.Vector3().copy(distCenter).add(dir.multiplyScalar(40));
        targetPos.y = 25;
        targetLookAt = new THREE.Vector3(district.center.x, 10, district.center.z);
      }
    }

    if (targetPos && targetLookAt) {
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(lookTarget.current);

      gsap.to(camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 2.5,
        ease: "power3.inOut"
      });

      gsap.to(lookTarget.current, {
        x: targetLookAt.x,
        y: targetLookAt.y,
        z: targetLookAt.z,
        duration: 2.5,
        ease: "power3.inOut"
      });
      
      orbitAngle.current = 0;
    } else {
      // Return to base position
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(lookTarget.current);

      gsap.to(camera.position, {
        x: basePosition.current.x,
        y: basePosition.current.y,
        z: basePosition.current.z,
        duration: 2.5,
        ease: "power3.inOut"
      });

      gsap.to(lookTarget.current, {
        x: 0,
        y: 15,
        z: -20,
        duration: 2.5,
        ease: "power3.inOut"
      });
    }
  }, [activeDistrictId, activeBuildingId, camera]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    
    if (activeBuildingId || activeDistrictId) {
      // Determine center for orbit
      let center = null;
      if (activeBuildingId) {
        const building = LANDMARKS.find(b => b.id === activeBuildingId);
        if (building) center = DISTRICTS.find(d => d.id === building.districtId)?.center;
      } else {
        center = DISTRICTS.find(d => d.id === activeDistrictId)?.center;
      }

      if (center) {
        orbitAngle.current += (activeBuildingId ? 0.0005 : 0.001); // slower orbit for building
        const orbitRadius = activeBuildingId ? 0.5 : 1.0;
        const cx = Math.sin(orbitAngle.current) * orbitRadius;
        const cz = Math.cos(orbitAngle.current) * orbitRadius;
        
        const currentLook = lookTarget.current.clone();
        currentLook.y += Math.sin(t * 1.5) * 0.1;
        camera.lookAt(currentLook);
        
        camera.position.x += cx * 0.01;
        camera.position.z += cz * 0.01;
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
