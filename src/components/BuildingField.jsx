import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

const BUILDING_COUNT = 46
const WINDOW_COUNT = 320

// Deterministic-feeling layout: a wide grid with jitter so the skyline
// reads as organic rather than perfectly gridded.
const generateBuildings = () => {
  const buildings = []
  const cols = 10
  const rows = 5

  for (let i = 0; i < BUILDING_COUNT; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)

    const spreadX = 46
    const spreadZ = 30

    const x = (col / (cols - 1) - 0.5) * spreadX + (Math.random() - 0.5) * 2.4
    const z = -8 - (row / (rows - 1)) * spreadZ - Math.random() * 3

    // Buildings closer to camera (smaller row) read taller/more detailed;
    // distant ones are shorter, hazier silhouettes.
    const depthFactor = 1 - row / rows
    const height = THREE.MathUtils.lerp(3, 14, Math.random()) * (0.6 + depthFactor * 0.5)
    const width = Math.random() * 1.2 + 0.9
    const depth = Math.random() * 1.2 + 0.9

    buildings.push({ x, y: height / 2, z, width, height, depth })
  }

  return buildings
}

const BuildingField = () => {
  const buildingMeshRef = useRef()
  const windowMeshRef = useRef()

  const buildings = useMemo(() => generateBuildings(), [])

  const windows = useMemo(() => {
    const list = []
    for (let i = 0; i < WINDOW_COUNT; i++) {
      const b = buildings[Math.floor(Math.random() * buildings.length)]
      const faceOffset = Math.random() > 0.5 ? b.width / 2 + 0.02 : -(b.width / 2 + 0.02)
      list.push({
        x: b.x + (Math.random() > 0.5 ? faceOffset : (Math.random() - 0.5) * b.width),
        y: Math.random() * b.height * 0.85 + 0.3,
        z: b.z + (Math.random() > 0.5 ? (Math.random() - 0.5) * b.depth : b.depth / 2 + 0.02),
      })
    }
    return list
  }, [buildings])

  useEffect(() => {
    if (!buildingMeshRef.current) return
    const dummy = new THREE.Object3D()

    buildings.forEach((b, i) => {
      dummy.position.set(b.x, b.y, b.z)
      dummy.scale.set(b.width, b.height, b.depth)
      dummy.updateMatrix()
      buildingMeshRef.current.setMatrixAt(i, dummy.matrix)

      const shade = 0.03 + Math.random() * 0.05
      buildingMeshRef.current.setColorAt(
        i,
        new THREE.Color(shade, shade * 1.05, shade * 1.25)
      )
    })

    buildingMeshRef.current.instanceMatrix.needsUpdate = true
    if (buildingMeshRef.current.instanceColor) {
      buildingMeshRef.current.instanceColor.needsUpdate = true
    }
  }, [buildings])

  useEffect(() => {
    if (!windowMeshRef.current) return
    const dummy = new THREE.Object3D()

    windows.forEach((w, i) => {
      dummy.position.set(w.x, w.y, w.z)
      dummy.scale.setScalar(0.05 + Math.random() * 0.04)
      dummy.updateMatrix()
      windowMeshRef.current.setMatrixAt(i, dummy.matrix)
    })

    windowMeshRef.current.instanceMatrix.needsUpdate = true
  }, [windows])

  return (
    <group>
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