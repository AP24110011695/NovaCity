import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export const HeroBuilding = ({ position = [0, 0, -20] }) => {
  const coreRef = useRef()
  const beaconRef = useRef()
  const stripsRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    // Rotating beacon
    if (beaconRef.current) {
      beaconRef.current.rotation.y = t * 2
      beaconRef.current.children.forEach((child, index) => {
        if (child.material) child.material.opacity = 0.56 + 0.34 * Math.sin(t * 1.7 + index * 1.9)
      })
    }
    // Pulsating holographic core
    if (coreRef.current) {
      coreRef.current.material.opacity = 0.38 + Math.sin(t * 2.1) * 0.1
      coreRef.current.rotation.y = t * 0.5
      coreRef.current.position.y = 30 + Math.sin(t * 1.5) * 1.2
    }
    // Animated strips shader time
    if (stripsRef.current) {
       stripsRef.current.uniforms.uTime.value = t
    }
  })

  return (
    <group position={position}>
      {/* Base Structure */}
      <mesh position={[0, 15, 0]} castShadow receiveShadow>
        <boxGeometry args={[10, 30, 10]} />
        <meshStandardMaterial color="#050608" roughness={0.7} metalness={0.9} />
      </mesh>
      
      {/* Upper Structure (slimmer, taller) */}
      <mesh position={[0, 42.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 25, 6]} />
        <meshStandardMaterial color="#08090d" roughness={0.6} metalness={0.9} />
      </mesh>

      {/* Animated Light Strips via Shader */}
      <mesh position={[0, 27.5, 0]}>
         <boxGeometry args={[10.2, 55, 10.2]} />
         <shaderMaterial
            ref={stripsRef}
            vertexShader={`varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
            fragmentShader={`
               uniform float uTime;
               varying vec2 vUv;
               void main(){
                  // Vertical moving dashed lines
                  float stripes = step(0.90, fract(vUv.y * 30.0 - uTime * 0.22));
                  // Only show strips on the edges of the faces
                  float edges = step(0.9, fract(vUv.x * 2.0)) + step(0.9, fract((1.0-vUv.x) * 2.0));
                  float shimmer = 0.82 + 0.18 * sin(uTime * 1.7 + vUv.y * 24.0);
                  vec3 color = vec3(0.1, 0.4, 1.0) * stripes * edges * shimmer * 2.4;
                  
                  // Fade out near top and bottom
                  float fade = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
                  gl_FragColor = vec4(color, clamp((stripes * edges) * fade, 0.0, 1.0));
               }
            `}
            uniforms={{ uTime: { value: 0 } }}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
         />
      </mesh>

      {/* Holographic Energy Core */}
      <mesh ref={coreRef} position={[0, 30, 0]}>
         <octahedronGeometry args={[4, 0]} />
         <meshBasicMaterial color="#78aaff" wireframe transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Inner glow for core */}
      <mesh position={[0, 30, 0]}> 
         <sphereGeometry args={[2, 16, 16]} />
         <meshBasicMaterial color="#ffffff" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Light emitted from core */}
      <pointLight position={[0, 30, 0]} color="#78aaff" intensity={4} distance={40} decay={2} />

      {/* Rotating Beacon */}
      <group position={[0, 56, 0]} ref={beaconRef}>
         <mesh position={[2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.8, 8]} rotation={[0, 0, Math.PI/2]} />
            <meshBasicMaterial color="#ff2233" transparent opacity={0.8} />
         </mesh>
         <mesh position={[-2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.8, 8]} rotation={[0, 0, Math.PI/2]} />
            <meshBasicMaterial color="#ff2233" transparent opacity={0.8} />
         </mesh>
         <pointLight color="#ff2233" intensity={3} distance={40} decay={2} />
      </group>
    </group>
  )
}
