import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { generateDistrict } from './BuildingGenerator'

export const CityDistrict = ({ seed = 42, center = {x: 0, z: 0}, radius = 100, count = 150 }) => {
  const buildings = useMemo(() => generateDistrict(seed, center, radius, count), [seed, center, radius, count])
  
  const meshRef = useRef()
  const antennaRef = useRef()
  const neonRef = useRef()

  const numAntennas = buildings.filter(b => b.hasAntenna).length
  const numNeons = buildings.filter(b => b.hasNeon).length

  useEffect(() => {
    if (!meshRef.current) return
    const dummy = new THREE.Object3D()
    let aIdx = 0
    let nIdx = 0

    buildings.forEach((b, i) => {
      // Main Building
      dummy.position.set(b.x, b.y + b.h * 0.5, b.z)
      dummy.scale.set(b.w, b.h, b.d)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      // Base color based on distance
      const dist = Math.sqrt(b.x*b.x + b.z*b.z)
      const fade = Math.max(0.1, 1.0 - dist / 180.0)
      const c = new THREE.Color(0.04 * fade, 0.05 * fade, 0.08 * fade)
      meshRef.current.setColorAt(i, c)

      // Antennas
      if (b.hasAntenna && antennaRef.current) {
        dummy.position.set(b.x + (b.colorSeed - 0.5)*b.w*0.5, b.y + b.h + 2, b.z + (b.colorSeed - 0.5)*b.d*0.5)
        dummy.scale.set(0.2, 4, 0.2)
        dummy.updateMatrix()
        antennaRef.current.setMatrixAt(aIdx++, dummy.matrix)
      }

      // Neon strips (just simple boxes attached to the side)
      if (b.hasNeon && neonRef.current) {
        dummy.position.set(b.x + b.w*0.5 + 0.1, b.y + b.h*0.5, b.z)
        dummy.scale.set(0.1, b.h * 0.8, 0.5)
        dummy.updateMatrix()
        
        // Random neon color
        const nc = new THREE.Color()
        nc.setHSL(b.colorSeed, 0.8, 0.5)
        neonRef.current.setColorAt(nIdx, nc)
        neonRef.current.setMatrixAt(nIdx++, dummy.matrix)
      }
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
    
    if (antennaRef.current) {
      antennaRef.current.instanceMatrix.needsUpdate = true
    }
    if (neonRef.current) {
      neonRef.current.instanceMatrix.needsUpdate = true
      neonRef.current.instanceColor.needsUpdate = true
    }
  }, [buildings])

  const buildingMatRef = useRef()
  const neonMatRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (buildingMatRef.current) buildingMatRef.current.uniforms.uTime.value = t
    if (neonMatRef.current) neonMatRef.current.uniforms.uTime.value = t
  })

  return (
    <group>
      {/* Buildings with Window Shader */}
      <instancedMesh ref={meshRef} args={[null, null, buildings.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          roughness={0.7}
          metalness={0.5}
          onBeforeCompile={(shader) => {
            shader.uniforms.uTime = { value: 0 }
            buildingMatRef.current = shader
            
            shader.vertexShader = `
              varying vec3 vWorldPos;
              varying vec2 vMyUv;
              ${shader.vertexShader}
            `.replace(
              '#include <worldpos_vertex>',
              `
              #include <worldpos_vertex>
              #ifdef USE_INSTANCING
                vWorldPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
              #else
                vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
              #endif
              vMyUv = uv;
              `
            )
            
            shader.fragmentShader = `
              uniform float uTime;
              varying vec3 vWorldPos;
              varying vec2 vMyUv;
              
              float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
              
              ${shader.fragmentShader}
            `.replace(
              '#include <color_fragment>',
              `
              #include <color_fragment>
              
              vec2 grid = fract(vMyUv * vec2(10.0, 40.0));
              vec2 id = floor(vMyUv * vec2(10.0, 40.0)) + floor(vWorldPos.xz);
              
              float windowShape = step(0.2, grid.x) * step(0.2, grid.y);
              float windowActive = step(0.7, hash(id));
              
              float flicker = 0.8 + 0.2 * sin(uTime * 2.0 + hash(id)*10.0);
              
              vec3 windowColor = vec3(0.5, 0.7, 1.0) * windowShape * windowActive * flicker * 2.0;
              
              float fade = smoothstep(0.0, 0.3, vMyUv.y);
              diffuseColor.rgb = diffuseColor.rgb * fade + windowColor * 0.4;
              `
            )
          }}
        />
      </instancedMesh>

      {/* Antennas */}
      {numAntennas > 0 && (
        <instancedMesh ref={antennaRef} args={[null, null, numAntennas]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#ff2233" />
        </instancedMesh>
      )}

      {/* Neon Strips */}
      {numNeons > 0 && (
        <instancedMesh ref={neonRef} args={[null, null, numNeons]}>
          <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          onBeforeCompile={(shader) => {
            shader.uniforms.uTime = { value: 0 }
            neonMatRef.current = shader
            
            shader.vertexShader = `
              varying vec3 vWorldPos;
              varying vec2 vMyUv;
              ${shader.vertexShader}
            `.replace(
              '#include <worldpos_vertex>',
              `
              #include <worldpos_vertex>
              #ifdef USE_INSTANCING
                vWorldPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
              #else
                vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
              #endif
              vMyUv = uv;
              `
            )
            
            shader.fragmentShader = `
              uniform float uTime;
              varying vec3 vWorldPos;
              varying vec2 vMyUv;
              ${shader.fragmentShader}
            `.replace(
              '#include <color_fragment>',
              `
              #include <color_fragment>
              float pulse = 0.5 + 0.5 * sin(uTime * 3.0 + vWorldPos.y + vWorldPos.x);
              float edges = step(0.1, vMyUv.x) * step(vMyUv.x, 0.9);
              diffuseColor.rgb = diffuseColor.rgb * pulse * edges * 2.5;
              `
            )
          }}
        />
        </instancedMesh>
      )}
    </group>
  )
}
