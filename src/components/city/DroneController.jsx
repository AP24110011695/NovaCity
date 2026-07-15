import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Simple deterministic RNG
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

const generatePaths = (numPaths) => {
  const rng = mulberry32(111)
  const paths = []
  for (let i = 0; i < numPaths; i++) {
    const pts = []
    const numPoints = 8
    const radius = 30 + rng() * 80
    const basePathY = 15 + rng() * 60
    for (let j = 0; j < numPoints; j++) {
      const angle = (j / numPoints) * Math.PI * 2
      const r = radius + (rng() - 0.5) * 30
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const y = basePathY + (rng() - 0.5) * 30
      pts.push(new THREE.Vector3(x, y, z))
    }
    const curve = new THREE.CatmullRomCurve3(pts, true)
    paths.push(curve)
  }
  return paths
}

export const DroneController = ({ numPaths = 8, vehiclesPerPath = 6 }) => {
  const paths = useMemo(() => generatePaths(numPaths), [numPaths])
  
  const bodyRef = useRef()
  const glowRef = useRef()
  
  const totalVehicles = numPaths * vehiclesPerPath
  
  const vehicles = useMemo(() => {
    const rng = mulberry32(222)
    const arr = []
    for (let p = 0; p < numPaths; p++) {
       const speed = 0.01 + rng() * 0.03
       const classType = rng() // 0-0.5 taxi, 0.5-0.8 cargo, 0.8-1.0 police
       let color = new THREE.Color()
       let scale = new THREE.Vector3(1, 1, 1)
       
       if (classType < 0.5) {
          // Taxi
          color.setHex(0xffaa22)
          scale.set(0.6, 0.2, 1.2)
       } else if (classType < 0.8) {
          // Cargo
          color.setHex(0x3388ff)
          scale.set(1.4, 0.5, 2.5)
       } else {
          // Police
          color.setHex(0xff2222)
          scale.set(0.5, 0.15, 1.0)
       }
       
       for (let v = 0; v < vehiclesPerPath; v++) {
          const phase = v / vehiclesPerPath // even spacing
          arr.push({ pathIdx: p, phase, speed, color, scale, wobble: rng() * Math.PI * 2 })
       }
    }
    return arr
  }, [numPaths, vehiclesPerPath])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const glowDummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
     if (!glowRef.current) return
     vehicles.forEach((v, i) => {
        glowRef.current.setColorAt(i, v.color)
     })
     glowRef.current.instanceColor.needsUpdate = true
  }, [vehicles])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    
    vehicles.forEach((v, i) => {
       const curve = paths[v.pathIdx]
       const currentPhase = (v.phase + t * v.speed) % 1.0
       const lookPhase = (currentPhase + 0.005) % 1.0
       
       const pos = curve.getPointAt(currentPhase)
       const look = curve.getPointAt(lookPhase)
       
       const tangent = curve.getTangentAt(currentPhase)
       const nextTangent = curve.getTangentAt(lookPhase)
       
       // Calculate bank angle from change in tangent
       const turn = tangent.clone().cross(nextTangent)
       // Turn.y represents left/right turning. Multiply to amplify bank effect.
       // Clamp to prevent crazy spinning on sharp procedural spline bends.
       let bankAngle = turn.y * -800.0 
       bankAngle = Math.max(-1.0, Math.min(1.0, bankAngle))
       
       dummy.position.copy(pos)
       dummy.position.y += Math.sin(t * 1.5 + v.wobble) * 0.8
       
       dummy.lookAt(look)
       dummy.rotateZ(bankAngle)
       
       dummy.scale.copy(v.scale)
       dummy.updateMatrix()
       bodyRef.current.setMatrixAt(i, dummy.matrix)
       
       // Glow Engine positioning
       glowDummy.copy(dummy)
       // Move glow behind the vehicle geometry
       glowDummy.translateZ(-0.5) 
       // Flatten it slightly to look like a thruster
       glowDummy.scale.set(0.6, 0.2, 0.6)
       
       // Engine pulsing
       const pulse = 0.8 + 0.3 * Math.sin(t * 10.0 + v.wobble)
       glowDummy.scale.multiplyScalar(pulse)
       
       glowDummy.updateMatrix()
       glowRef.current.setMatrixAt(i, glowDummy.matrix)
    })
    
    bodyRef.current.instanceMatrix.needsUpdate = true
    glowRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[null, null, totalVehicles]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#11131a" roughness={0.4} metalness={0.9} />
      </instancedMesh>
      
      <instancedMesh ref={glowRef} args={[null, null, totalVehicles]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}
