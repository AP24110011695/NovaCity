import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const BUILDING_COUNT = 58
const WINDOW_COUNT = 420
const CITY_SEED = 42

const seededRandom = (seed) => {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const generateBuildings = (rng) => {
  const buildings = []
  const cols = 11
  const rows = 6

  for (let i = 0; i < BUILDING_COUNT; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)

    const spreadX = 60
    const spreadZ = 70

    const x = (col / (cols - 1) - 0.5) * spreadX + (rng() - 0.5) * 2.6
    const z = -6 - (row / (rows - 1)) * spreadZ - rng() * 4

    const depthFactor = 1 - row / rows
    const height = THREE.MathUtils.lerp(3, 16, rng()) * (0.55 + depthFactor * 0.55)
    const width = rng() * 1.3 + 0.9
    const depth = rng() * 1.3 + 0.9

    buildings.push({ x, y: height / 2, z, width, height, depth })
  }

  return buildings
}

const generateWindows = (buildings, rng) => {
  const list = []
  for (let i = 0; i < WINDOW_COUNT; i++) {
    const b = buildings[Math.floor(rng() * buildings.length)]
    const faceOffset = rng() > 0.5 ? b.width / 2 + 0.02 : -(b.width / 2 + 0.02)
    list.push({
      x: b.x + (rng() > 0.5 ? faceOffset : (rng() - 0.5) * b.width),
      y: rng() * b.height * 0.85 + 0.3,
      z: b.z + (rng() > 0.5 ? (rng() - 0.5) * b.depth : b.depth / 2 + 0.02),
      scale: 0.05 + rng() * 0.04,
    })
  }
  return list
}

const BuildingField = ({ revealProgressRef }) => {
  const groupRef = useRef()
  const buildingMeshRef = useRef()
  const windowMeshRef = useRef()

  const { buildings, windows, buildingColors } = useMemo(() => {
    const rng = seededRandom(CITY_SEED)
    const bldgs = generateBuildings(rng)
    const wins = generateWindows(bldgs, rng)
    const colors = bldgs.map(() => {
      const shade = 0.03 + rng() * 0.05
      return new THREE.Color(shade, shade * 1.05, shade * 1.25)
    })
    return { buildings: bldgs, windows: wins, buildingColors: colors }
  }, [])

  useEffect(() => {
    if (!buildingMeshRef.current) return
    const dummy = new THREE.Object3D()

    buildings.forEach((b, i) => {
      dummy.position.set(b.x, b.y, b.z)
      dummy.scale.set(b.width, b.height, b.depth)
      dummy.updateMatrix()
      buildingMeshRef.current.setMatrixAt(i, dummy.matrix)
      buildingMeshRef.current.setColorAt(i, buildingColors[i])
    })

    buildingMeshRef.current.instanceMatrix.needsUpdate = true
    if (buildingMeshRef.current.instanceColor) {
      buildingMeshRef.current.instanceColor.needsUpdate = true
    }
  }, [buildings, buildingColors])

  useEffect(() => {
    if (!windowMeshRef.current) return
    const dummy = new THREE.Object3D()

    windows.forEach((w, i) => {
      dummy.position.set(w.x, w.y, w.z)
      dummy.scale.setScalar(w.scale)
      dummy.updateMatrix()
      windowMeshRef.current.setMatrixAt(i, dummy.matrix)
    })

    windowMeshRef.current.instanceMatrix.needsUpdate = true
  }, [windows])

  useFrame(() => {
    if (!groupRef.current) return
    const progress = revealProgressRef?.current ?? 1
    const eased = THREE.MathUtils.smoothstep(progress, 0, 1)
    groupRef.current.scale.y = eased
    groupRef.current.position.y = (1 - eased) * -2
  })

  return (
    <group ref={groupRef}>
      <instancedMesh ref={buildingMeshRef} args={[null, null, buildings.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={1} metalness={0} />
      </instancedMesh>

      <instancedMesh ref={windowMeshRef} args={[null, null, windows.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#4F7CFF" transparent opacity={0.85} toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

export default BuildingField
