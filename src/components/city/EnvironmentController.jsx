import { memo, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CloudLayer } from '../CloudLayer'
import { SkyAtmosphere } from '../SkyAtmosphere'

const WEATHER_DEFAULTS = Object.freeze({ dust: 0.55, fog: 0.5, rain: 0, wind: 0.35 })
const DEFAULT_MOOD = Object.freeze({ ambient: '#a9c7ff', sky: '#6088d6', rim: '#6a8fff', fog: '#7696d5', particle: '#9bbaff', intensity: 1 })

function createWeatherGeometry(count, spread, height, kind) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * spread
    positions[index * 3 + 1] = Math.random() * height
    positions[index * 3 + 2] = (Math.random() - 0.5) * spread - 35
    seeds[index] = Math.random()
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.userData.kind = kind
  return geometry
}

const WEATHER_VERTEX = /* glsl */`
  attribute float aSeed;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uMode;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float wind = uTime * (0.5 + aSeed * 0.35);
    p.x += wind * mix(1.5, 4.5, uMode) + sin(wind + aSeed * 18.0) * 1.5;
    p.z += cos(wind * 0.7 + aSeed * 13.0) * (1.0 + uMode * 2.0);
    if (uMode > 1.5) p.y = mod(p.y - uTime * 16.0, 90.0);
    else p.y = mod(p.y + uTime * (0.35 + aSeed), 90.0);
    vAlpha = uIntensity * (0.25 + aSeed * 0.55);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = mix(1.4, 3.0, uMode) * (150.0 / max(1.0, -mv.z));
    gl_Position = projectionMatrix * mv;
  }
`

const WEATHER_FRAGMENT = /* glsl */`
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float soft = smoothstep(0.5, 0.08, length(q));
    gl_FragColor = vec4(uColor, soft * vAlpha);
  }
`

const WeatherParticles = memo(function WeatherParticles({ intensity, mode, color, count, spread, height }) {
  const materialRef = useRef()
  const geometry = useMemo(() => createWeatherGeometry(count, spread, height, mode), [count, spread, height, mode])
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uIntensity: { value: intensity }, uMode: { value: mode === 'rain' ? 2 : mode === 'wind' ? 1 : 0 }, uColor: { value: new THREE.Color(color) } },
    vertexShader: WEATHER_VERTEX, fragmentShader: WEATHER_FRAGMENT,
  }), [color, intensity, mode])

  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  useFrame(({ clock }) => {
    if (materialRef.current) materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
  })
  if (intensity <= 0) return null
  return <points geometry={geometry} material={material} frustumCulled={false} ref={(points) => { materialRef.current = points?.material }} />
})

function FogHaze({ intensity, color }) {
  const groupRef = useRef()
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    groupRef.current.children.forEach((mesh, index) => {
      mesh.material.opacity = intensity * (0.035 + index * 0.018) * (0.82 + Math.sin(t * 0.08 + index) * 0.18)
      mesh.position.x = Math.sin(t * 0.035 + index * 2.4) * 10
    })
  })
  return <group ref={groupRef} name="drifting-fog-haze">
    <mesh position={[0, 20, -112]}><planeGeometry args={[260, 86]} /><meshBasicMaterial color={color} transparent depthWrite={false} /></mesh>
    <mesh position={[0, 8, -76]}><planeGeometry args={[190, 34]} /><meshBasicMaterial color={color} transparent depthWrite={false} /></mesh>
  </group>
}

function CitySignals() {
  const beaconRef = useRef()
  const trailRef = useRef()
  const beaconData = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    x: ((i * 41) % 145) - 72, y: 14 + ((i * 29) % 62), z: -18 - ((i * 37) % 100), phase: i * 1.73,
  })), [])
  const trailData = useMemo(() => Array.from({ length: 5 }, (_, i) => ({ y: 18 + i * 9, z: -58 - i * 15, speed: 2.5 + i * 0.45, phase: i * 19 })), [])
  const beaconMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ff5577', transparent: true, opacity: 0.9 }), [])
  const trailMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#b8d5ff', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    beaconData.forEach((beacon, i) => {
      const flash = Math.pow(Math.max(0, Math.sin(t * (0.7 + (i % 3) * 0.12) + beacon.phase)), 18)
      dummy.position.set(beacon.x, beacon.y, beacon.z)
      dummy.scale.setScalar(0.18 + flash * 0.6)
      dummy.updateMatrix()
      beaconRef.current.setMatrixAt(i, dummy.matrix)
    })
    trailData.forEach((trail, i) => {
      const x = ((t * trail.speed + trail.phase) % 150) - 75
      dummy.position.set(x, trail.y, trail.z)
      dummy.scale.set(5.5, 0.035, 0.035)
      dummy.updateMatrix()
      trailRef.current.setMatrixAt(i, dummy.matrix)
    })
    beaconRef.current.instanceMatrix.needsUpdate = true
    trailRef.current.instanceMatrix.needsUpdate = true
  })

  return <group name="city-signals">
    <instancedMesh ref={beaconRef} args={[new THREE.SphereGeometry(1, 8, 8), beaconMaterial, beaconData.length]} frustumCulled={false} />
    <instancedMesh ref={trailRef} args={[new THREE.BoxGeometry(1, 1, 1), trailMaterial, trailData.length]} frustumCulled={false} />
  </group>
}

function AtmosphericLighting({ mood }) {
  const ambientRef = useRef()
  const hemiRef = useRef()
  const rimRef = useRef()
  const targets = useMemo(() => ({
    ambient: new THREE.Color(mood.ambient), sky: new THREE.Color(mood.sky), rim: new THREE.Color(mood.rim), intensity: mood.intensity,
  }), [mood])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.18)
    ambientRef.current.color.lerp(targets.ambient, 0.018)
    hemiRef.current.color.lerp(targets.sky, 0.018)
    rimRef.current.color.lerp(targets.rim, 0.018)
    ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, (0.25 + pulse * 0.035) * targets.intensity, 0.018)
    hemiRef.current.intensity = THREE.MathUtils.lerp(hemiRef.current.intensity, (0.32 + pulse * 0.045) * targets.intensity, 0.018)
    rimRef.current.intensity = THREE.MathUtils.lerp(rimRef.current.intensity, (0.48 + pulse * 0.09) * targets.intensity, 0.018)
  })
  return <>
    <ambientLight ref={ambientRef} color="#a9c7ff" intensity={0.27} />
    <hemisphereLight ref={hemiRef} skyColor="#6088d6" groundColor="#070913" intensity={0.34} />
    <directionalLight ref={rimRef} position={[-60, 46, -80]} color="#6a8fff" intensity={0.52} />
  </>
}

export const EnvironmentController = memo(function EnvironmentController({ weather = WEATHER_DEFAULTS, mood = DEFAULT_MOOD }) {
  const settings = { ...WEATHER_DEFAULTS, ...weather }
  return <group name="environment-controller">
    <SkyAtmosphere progress={0.72} starCount={900} radius={720} tint={mood.sky} />
    <CloudLayer count={3} baseY={52} spacing={20} radius={600} segments={28} opacity={0.18} speed={0.34} threshold={0.43} displaceAmp={3} />
    <AtmosphericLighting mood={mood} />
    <FogHaze intensity={settings.fog} color={mood.fog} />
    <WeatherParticles mode="dust" intensity={settings.dust * 0.16} color={mood.particle} count={520} spread={210} height={78} />
    <WeatherParticles mode="wind" intensity={settings.wind * 0.1} color={mood.rim} count={160} spread={190} height={62} />
    <WeatherParticles mode="rain" intensity={settings.rain * 0.12} color="#b7d5ff" count={360} spread={180} height={90} />
    <CitySignals />
  </group>
})

export default EnvironmentController
