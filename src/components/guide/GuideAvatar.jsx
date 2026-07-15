import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import * as THREE from 'three'
import { useGuide } from './GuideProvider'

const AVATAR_VERTEX = /* glsl */`
  varying vec3 vNormal;
  void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const AVATAR_FRAGMENT = /* glsl */`
  uniform float uPulse;
  varying vec3 vNormal;
  void main() { float fresnel = pow(1.0 - abs(vNormal.z), 2.2); vec3 color = mix(vec3(0.08, 0.28, 0.72), vec3(0.38, 0.95, 1.0), fresnel); gl_FragColor = vec4(color * (0.65 + uPulse * 0.5), 0.75 + fresnel * 0.2); }
`

export default function GuideAvatar() {
  const groupRef = useRef()
  const coreRef = useRef()
  const { isVisible } = useGuide()
  const material = useMemo(() => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uPulse: { value: 0.5 } }, vertexShader: AVATAR_VERTEX, fragmentShader: AVATAR_FRAGMENT }), [])

  useEffect(() => {
    const group = groupRef.current
    if (!group) return undefined
    const timeline = gsap.timeline({ repeat: -1, yoyo: true })
    timeline.to(group.position, { y: 11.1, duration: 2.8, ease: 'sine.inOut' }, 0)
    timeline.to(group.rotation, { y: Math.PI * 2, duration: 18, ease: 'none' }, 0)
    timeline.to(material.uniforms.uPulse, { value: 1, duration: 1.6, ease: 'sine.inOut' }, 0)
    return () => timeline.kill()
  }, [material])

  useEffect(() => {
    if (!groupRef.current) return
    gsap.to(groupRef.current.scale, { x: isVisible ? 1 : 0, y: isVisible ? 1 : 0, z: isVisible ? 1 : 0, duration: 0.35, ease: 'power2.out' })
  }, [isVisible])

  return <group ref={groupRef} position={[-7, 10.4, -18]} name="nova-guide-avatar">
    <mesh ref={coreRef} material={material}><octahedronGeometry args={[1.05, 2]} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.55, 0.018, 8, 48]} /><meshBasicMaterial color="#74eaff" transparent opacity={0.58} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    <mesh rotation={[Math.PI / 2, 0.7, 0]} scale={[0.72, 0.72, 0.72]}><torusGeometry args={[1.55, 0.012, 8, 48]} /><meshBasicMaterial color="#5788ff" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    <pointLight color="#62dfff" intensity={1.1} distance={16} decay={2} />
  </group>
}
