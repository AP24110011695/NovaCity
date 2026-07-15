import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const SUN_POSITION = new THREE.Vector3(-17, 0, 0)

const PLANETS = [
  { name: 'Mercury', radius: 7.0, size: 0.42, speed: 0.18, phase: 0.05, kind: 0 },
  { name: 'Venus', radius: 9.6, size: 0.72, speed: 0.14, phase: 0.10, kind: 1 },
  { name: 'Earth', radius: 12.5, size: 0.80, speed: 0.11, phase: 0.18, kind: 2 },
  { name: 'Mars', radius: 15.7, size: 0.58, speed: 0.09, phase: 0.28, kind: 3 },
  { name: 'Jupiter', radius: 20.4, size: 2.65, speed: 0.058, phase: 0.38, kind: 4 },
  { name: 'Saturn', radius: 25.4, size: 2.10, speed: 0.045, phase: 0.50, kind: 5, rings: true },
  { name: 'Uranus', radius: 30.5, size: 1.25, speed: 0.032, phase: 0.62, kind: 6 },
  { name: 'Neptune', radius: 35.5, size: 1.22, speed: 0.025, phase: 0.75, kind: 7 },
]

const hashShader = `
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123); }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y), mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float n = 0.0, a = .5; for (int i = 0; i < 4; i++) { n += a * noise(p); p = p * 2.03 + 19.7; a *= .5; } return n; }
`

const planetVertex = `varying vec3 vNormal; varying vec3 vPosition; void main() { vNormal = normalize(normalMatrix * normal); vPosition = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const planetFragment = `
  uniform float uKind; uniform float uTime; varying vec3 vNormal; varying vec3 vPosition;
  ${hashShader}
  void main() {
    vec3 lightDirection = normalize(vec3(-.75, .32, .6));
    float diffuse = max(.10, dot(vNormal, lightDirection));
    float n = fbm(vPosition * 5.0 + uTime * .012);
    vec3 color;
    if (uKind < .5) color = mix(vec3(.12,.10,.09), vec3(.56,.49,.42), n);
    else if (uKind < 1.5) color = mix(vec3(.31,.18,.08), vec3(.91,.62,.27), n);
    else if (uKind < 2.5) {
      float land = smoothstep(.53, .63, fbm(vPosition * 4.8));
      color = mix(vec3(.025,.17,.43), vec3(.10,.38,.13), land);
      color = mix(color, vec3(.58,.42,.19), smoothstep(.73,.82, fbm(vPosition * 8.0)) * land);
      float cloud = smoothstep(.72, .80, fbm(vPosition * 10.0 + vec3(uTime * .018, 0., 0.)));
      color = mix(color, vec3(.88,.94,1.), cloud * .55);
    } else if (uKind < 3.5) color = mix(vec3(.23,.055,.025), vec3(.76,.22,.09), n);
    else if (uKind < 4.5) {
      float bands = sin(vPosition.y * 21.0 + n * 5.0) * .5 + .5;
      color = mix(vec3(.31,.13,.075), vec3(.88,.62,.36), bands);
      float spot = smoothstep(.15, .02, length(vec2(vPosition.x + .62, vPosition.y + .18)));
      color = mix(color, vec3(.55,.08,.025), spot);
    } else if (uKind < 5.5) color = mix(vec3(.36,.27,.12), vec3(.88,.75,.45), n);
    else if (uKind < 6.5) color = mix(vec3(.23,.55,.59), vec3(.69,.91,.89), n);
    else color = mix(vec3(.015,.06,.24), vec3(.05,.27,.75), n);
    float rim = pow(1.0 - max(0.0, dot(vNormal, normalize(vec3(.0,.15,.95)))), 3.0);
    gl_FragColor = vec4(color * diffuse + rim * vec3(.08,.16,.32), 1.0);
  }
`

const Sun = () => {
  const surface = useRef(), corona = useRef(), rays = useRef()
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    uniforms.uTime.value = t
    const pulse = 1 + Math.sin(t * 0.85) * 0.025 + Math.sin(t * 1.7) * 0.012
    corona.current?.scale.setScalar(pulse)
    if (rays.current) rays.current.rotation.z = t * 0.012
  })
  const fragment = `uniform float uTime; varying vec3 vPosition; ${hashShader} void main() { float flow = fbm(normalize(vPosition) * 3.9 + vec3(0., uTime * .13, -uTime * .06)); float cells = fbm(normalize(vPosition) * 12.0 - uTime * .08); vec3 c = mix(vec3(.9,.055,.003), vec3(1.,.78,.08), smoothstep(.22,.82, flow)); c += vec3(1.,.24,.01) * smoothstep(.62,.9,cells) * .36; gl_FragColor = vec4(c,1.); }`
  return <group position={SUN_POSITION.toArray()}>
    <mesh ref={rays} scale={1.08}><sphereGeometry args={[5.75, 32, 32]} /><meshBasicMaterial color="#ff8a19" transparent opacity={0.052} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} toneMapped={false} /></mesh>
    <mesh ref={corona} scale={1.03}><sphereGeometry args={[5.25, 48, 48]} /><meshBasicMaterial color="#ff7b12" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} toneMapped={false} /></mesh>
    <mesh ref={surface}><sphereGeometry args={[4.55, 72, 72]} /><shaderMaterial vertexShader="varying vec3 vPosition; void main(){ vPosition=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }" fragmentShader={fragment} uniforms={uniforms} toneMapped={false} /></mesh>
    <pointLight color="#ffb34a" intensity={80} distance={45} decay={1.55} />
  </group>
}

const Orbit = ({ radius, index }) => <mesh position={SUN_POSITION.toArray()} rotation={[Math.PI / 2 + 0.035 * (index % 2), 0.02 * index, 0]}>
  <ringGeometry args={[radius - 0.018, radius + 0.018, 192]} />
  <meshBasicMaterial color={index > 4 ? '#7199db' : '#f6be70'} transparent opacity={0.30} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
</mesh>

const SaturnRings = () => <mesh rotation={[1.08, 0.16, 0.08]}>
  <ringGeometry args={[2.55, 4.25, 128]} />
  <shaderMaterial transparent side={THREE.DoubleSide} depthWrite={false} uniforms={{ uColor: { value: new THREE.Color('#d9c78d') } }} vertexShader="varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}" fragmentShader="uniform vec3 uColor; varying vec2 vUv; void main(){ float bands=.50+.28*sin(vUv.x*82.); float gaps=smoothstep(.05,.14,vUv.x)*smoothstep(.98,.83,vUv.x); gl_FragColor=vec4(uColor*(.72+bands),gaps*(.20+.52*bands));}" />
</mesh>

const Planet = ({ planet }) => {
  const orbit = useRef(), body = useRef(), atmosphere = useRef()
  const uniforms = useMemo(() => ({ uKind: { value: planet.kind }, uTime: { value: 0 } }), [planet.kind])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime(), angle = planet.phase + t * planet.speed
    orbit.current?.position.set(SUN_POSITION.x + Math.cos(angle) * planet.radius, Math.sin(angle * 1.7) * .45, Math.sin(angle) * planet.radius * .42)
    if (body.current) body.current.rotation.y = t * (planet.name === 'Jupiter' ? .16 : .32)
    if (atmosphere.current) atmosphere.current.material.opacity = .10 + Math.sin(t * .9) * .018
    uniforms.uTime.value = t
  })
  return <group ref={orbit}>
    <mesh ref={body} rotation={[planet.name === 'Uranus' ? 1.45 : .12, 0, 0]}><sphereGeometry args={[planet.size, 48, 48]} /><shaderMaterial vertexShader={planetVertex} fragmentShader={planetFragment} uniforms={uniforms} /></mesh>
    {planet.name === 'Earth' && <mesh ref={atmosphere} scale={1.08}><sphereGeometry args={[planet.size, 36, 36]} /><meshBasicMaterial color="#7ed8ff" transparent opacity={.10} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>}
    {planet.rings && <SaturnRings />}
  </group>
}

const StarField = () => {
  const ref = useRef(), count = 5200
  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3), sizes = new Float32Array(count)
    const palette = [[.72,.8,1],[1,.87,.63],[.74,.56,1],[1,1,1]]
    for (let i = 0; i < count; i++) { const r = 65 + Math.random() * 80, a = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1), c = palette[(Math.random() * palette.length) | 0]; positions.set([r * Math.sin(p) * Math.cos(a), r * Math.sin(p) * Math.sin(a), r * Math.cos(p)], i * 3); colors.set(c, i * 3); sizes[i] = Math.random() * 1.25 + .18 }
    return { positions, colors, sizes }
  }, [])
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * .0018 })
  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} /><bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} /><bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} /></bufferGeometry><pointsMaterial size={.12} vertexColors transparent opacity={.95} sizeAttenuation depthWrite={false} /></points>
}

const Nebula = () => {
  const cloud = useRef(), count = 850
  const positions = useMemo(() => { const p = new Float32Array(count * 3); for (let i = 0; i < count; i++) { const right = i % 2, x = right ? 20 + (Math.random() - .5) * 34 : -8 + (Math.random() - .5) * 30; p.set([x, (Math.random() - .5) * 21 + (right ? 3 : 7), -34 - Math.random() * 17], i * 3) } return p }, [])
  useFrame(({ clock }) => { if (cloud.current) cloud.current.rotation.z = Math.sin(clock.getElapsedTime() * .03) * .025 })
  return <points ref={cloud}><bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} /></bufferGeometry><pointsMaterial color="#7861c7" size={2.4} transparent opacity={.07} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} /></points>
}

// Curved cyan and violet dust makes the far field read as a distant galaxy.
const GalaxyDust = () => {
  const ref = useRef(), count = 1500
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const x = -37 + Math.random() * 78
      positions.set([x, Math.sin((x + 6) * .095) * 7 + (Math.random() - .5) * 7, -48 - Math.random() * 18], i * 3)
      colors.set(Math.random() > .48 ? [.16, .59, .92] : [.55, .23, .86], i * 3)
    }
    return { positions, colors }
  }, [])
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.z = Math.sin(clock.getElapsedTime() * .02) * .012 })
  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} /><bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} /></bufferGeometry><pointsMaterial size={.22} vertexColors transparent opacity={.28} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} /></points>
}

const AsteroidBelt = () => {
  const ref = useRef(), count = 700
  const positions = useMemo(() => { const p = new Float32Array(count * 3); for (let i = 0; i < count; i++) { const a = Math.random() * Math.PI * 2, r = 17.5 + Math.random() * 1.55; p.set([SUN_POSITION.x + Math.cos(a) * r, (Math.random() - .5) * .7, Math.sin(a) * r * .42], i * 3) } return p }, [])
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * .008 })
  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} /></bufferGeometry><pointsMaterial color="#a79888" size={.075} transparent opacity={.62} sizeAttenuation depthWrite={false} /></points>
}

const CinematicCamera = () => {
  const { camera, pointer } = useThree()
  useFrame(({ clock }) => { const t = clock.getElapsedTime(); camera.position.set(5 + Math.sin(t * .055) * .85 + pointer.x * 1.1, 10 + Math.cos(t * .045) * .65 + pointer.y * .65, 57); camera.lookAt(-4.5 + pointer.x * .28, 0, 0) })
  return null
}

const SolarSystem = () => <><ambientLight intensity={.12} /><StarField /><Nebula /><GalaxyDust /><Sun />{PLANETS.map((planet, index) => <Orbit key={planet.name} radius={planet.radius} index={index} />)}<AsteroidBelt />{PLANETS.map((planet) => <Planet key={planet.name} planet={planet} />)}<CinematicCamera /></>

const IntroSequence = ({ onEnter }) => {
  const [hasScrolled, setHasScrolled] = useState(false)
  useEffect(() => { let advanced = false; const advance = () => { setHasScrolled(true); if (!advanced) { advanced = true; onEnter?.() } }; const wheel = (event) => { if (Math.abs(event.deltaY) > 2) advance() }; const touch = () => advance(); window.addEventListener('wheel', wheel, { passive: true }); window.addEventListener('touchend', touch, { passive: true }); return () => { window.removeEventListener('wheel', wheel); window.removeEventListener('touchend', touch) } }, [onEnter])
  return <section className="relative h-[100dvh] w-screen overflow-hidden bg-[#020207]"><Canvas className="absolute inset-0 !h-full !w-full" camera={{ position: [5, 12, 57], fov: 43, near: .1, far: 220 }} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.35 }} dpr={[1, 1.5]}><color attach="background" args={['#020207']} /><fog attach="fog" args={['#070816', 48, 145]} /><SolarSystem /></Canvas>{!hasScrolled && <div className="intro-scroll-hint pointer-events-none absolute inset-x-0 bottom-7 z-10 flex flex-col items-center gap-1.5" aria-hidden="true"><span>↑</span><p>SCROLL TO EXPLORE</p></div>}</section>
}

export default IntroSequence
