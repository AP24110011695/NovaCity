import { lazy, Suspense, useMemo, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import LivingCity from './city/LivingCity'
import { HeroBuilding } from './city/HeroBuilding'
import { LandingCamera } from './city/LandingCamera'
import { GroundFog, VolumetricRays, DriftingDust } from './city/AtmosphericEffects'
import { AircraftSilhouettes } from './city/AircraftSilhouettes'
import { EnvironmentController } from './city/EnvironmentController'
import { SelectionProvider } from './city/SelectionManager'
import { BuildingProvider, useBuildingSelection } from './city/BuildingManager'
import HoloController from './holo/HoloController'
import { NovaOSProvider } from './novaos/NovaOSProvider'
import NovaOSLayer from './novaos/NovaOSLayer'
import { GuideProvider } from './guide/GuideProvider'
import GuideAvatar from './guide/GuideAvatar'
import gsap from 'gsap'

const GuideController = lazy(() => import('./guide/GuideController'))

const CHAPTER_LANDMARKS = {
  about: 'landmark-academy', skills: 'landmark-research', projects: 'landmark-innovation',
  experience: 'landmark-corporate', education: 'landmark-academy', achievements: 'landmark-academy', contact: 'landmark-corporate',
}

const CHAPTER_MOODS = {
  hero: { ambient: '#bed7ff', sky: '#4168b8', rim: '#8feeff', fog: '#5575b6', particle: '#a6e8ff', intensity: 1.02, overlay: 'rgba(18, 49, 114, 0.18)' },
  about: { ambient: '#c3b1ff', sky: '#58479e', rim: '#a38cff', fog: '#6857a5', particle: '#c2b7ff', intensity: 0.94, overlay: 'rgba(71, 37, 125, 0.2)' },
  skills: { ambient: '#bffcff', sky: '#167d9b', rim: '#58efff', fog: '#247f9b', particle: '#7af3ff', intensity: 1.08, overlay: 'rgba(0, 108, 142, 0.18)' },
  projects: { ambient: '#b8ffe3', sky: '#167b72', rim: '#58ffbc', fog: '#217b72', particle: '#8fffd2', intensity: 1.12, overlay: 'rgba(0, 112, 85, 0.2)' },
  experience: { ambient: '#ffe0ad', sky: '#9b6330', rim: '#ffc36d', fog: '#956538', particle: '#ffd395', intensity: 1.02, overlay: 'rgba(117, 62, 15, 0.2)' },
  education: { ambient: '#d0c7ff', sky: '#443887', rim: '#a793ff', fog: '#514497', particle: '#c1b5ff', intensity: 0.94, overlay: 'rgba(48, 31, 114, 0.22)' },
  achievements: { ambient: '#ffe7a3', sky: '#416ca6', rim: '#ffd15c', fog: '#6474a4', particle: '#ffe49a', intensity: 1.12, overlay: 'rgba(132, 92, 17, 0.18)' },
  contact: { ambient: '#dfbcff', sky: '#283d9a', rim: '#b879ff', fog: '#4c4caa', particle: '#c6adff', intensity: 1, overlay: 'rgba(65, 38, 132, 0.22)' },
}

const JourneyLandmarkHighlighter = ({ chapter }) => {
  const { setHoveredBuilding } = useBuildingSelection()
  useEffect(() => {
    setHoveredBuilding(CHAPTER_LANDMARKS[chapter] ?? null)
    return () => setHoveredBuilding(null)
  }, [chapter, setHoveredBuilding])
  return null
}

const CityWelcome = () => {
  const [visible, setVisible] = useState(true)
  useEffect(() => { const timer = window.setTimeout(() => setVisible(false), 6200); return () => window.clearTimeout(timer) }, [])
  if (!visible) return null
  return <div className="pointer-events-none fixed inset-x-0 top-[14%] z-[44] text-center" style={{ animation: 'city-guide-in 6.2s cubic-bezier(.16,1,.3,1) both' }}><p className="text-xs font-medium tracking-[.48em] text-white/85">WELCOME TO NOVA CITY</p><p className="mt-3 text-[10px] tracking-[.18em] text-white/55">EXPLORE THE SKYLINE · HOVER GLOWING LANDMARKS · CLICK TO DISCOVER PROJECTS</p></div>
}

// ─── Deterministic seed-based RNG (no Math.random in render) ─────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// ─── Procedural city layout — fully deterministic, never jumps on re-render ──
// ─── Ground plane with fog falloff ───────────────────────────────────────────
const Ground = () => {
  const matRef = useRef()

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -30]} receiveShadow>
      <planeGeometry args={[280, 200, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={/* glsl */`
          varying vec2 vUv; varying vec3 vWorldPos;
          void main(){vUv=uv;vWorldPos=(modelMatrix*vec4(position,1.0)).xyz;
            gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
        `}
        fragmentShader={/* glsl */`
          uniform float uTime; varying vec2 vUv; varying vec3 vWorldPos;
          void main(){
            float dist=length(vWorldPos.xz);
            float fade=1.0-smoothstep(20.0,120.0,dist);
            float grid=max(
              step(0.97,fract(vWorldPos.x*0.5)),
              step(0.97,fract(vWorldPos.z*0.5))
            )*0.08;
            vec3 col=vec3(0.04,0.06,0.10)+grid*vec3(0.2,0.35,0.8)*fade;
            gl_FragColor=vec4(col,fade*0.65);
          }
        `}
        uniforms={{ uTime: { value: 0 } }}
        transparent depthWrite={false}
      />
    </mesh>
  )
}

// ─── Volumetric sky glow — large planes above the skyline ────────────────────
const SkyGlow = () => {
  const refs = [useRef(), useRef(), useRef()]

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (refs[0].current) refs[0].current.material.opacity = 0.09 + Math.sin(t * 0.07) * 0.025
    if (refs[1].current) refs[1].current.material.opacity = 0.06 + Math.sin(t * 0.11 + 1.4) * 0.02
    if (refs[2].current) refs[2].current.material.opacity = 0.04 + Math.sin(t * 0.05 + 2.8) * 0.015
  })

  return (
    <group>
      {/* Primary blue dome above skyline */}
      <mesh ref={refs[0]} position={[0, 18, -35]} scale={[90, 40, 1]}>
        <planeGeometry />
        <meshBasicMaterial color="#2040a0" transparent opacity={0.09}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Warm accent — slight orange from street level */}
      <mesh ref={refs[1]} position={[8, 4, -22]} scale={[55, 14, 1]}>
        <planeGeometry />
        <meshBasicMaterial color="#603020" transparent opacity={0.06}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Distant deep blue fill */}
      <mesh ref={refs[2]} position={[0, 32, -65]} scale={[120, 55, 1]}>
        <planeGeometry />
        <meshBasicMaterial color="#1030c0" transparent opacity={0.04}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── Scene-level fog ─────────────────────────────────────────────────────────
const SceneFog = () => {
  const { scene } = useThree()
  useEffect(() => {
    scene.fog = new THREE.FogExp2('#060810', 0.06) // Start thick
    
    gsap.to(scene.fog, {
      density: 0.016, // Clear up over time
      duration: 12,
      ease: "power2.out"
    })

    return () => { scene.fog = null }
  }, [scene])
  return null
}

// ─── Cinematic landing camera ─────────────────────────────────────────────────
// (Replaced FlyThroughCamera with LandingCamera imported above)

// ─── Flying vehicles — light streaks across mid-city ─────────────────────────
const FlyingVehicles = () => {
  const COUNT   = 14
  const meshRef = useRef()

  const vehicles = useMemo(() => {
    const rng = mulberry32(55)
    return Array.from({ length: COUNT }, () => ({
      y:      3 + rng() * 18,
      z:      -8 - rng() * 55,
      speed:  5 + rng() * 9,
      startX: -50 - rng() * 20,
      color:  rng() > 0.6 ? [1.0, 0.9, 0.6] : [0.6, 0.8, 1.0],
    }))
  }, [])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const dummy = new THREE.Object3D()

    vehicles.forEach((v, i) => {
      v._x = (v._x ?? v.startX)
      v._x += v.speed * delta
      if (v._x > 55) v._x = v.startX

      dummy.position.set(v._x, v.y, v.z)
      dummy.scale.set(0.6 + Math.random() * 0.15, 0.04, 0.04)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#aabbff" transparent opacity={0.5}
        blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  )
}

// ─── Scene root ───────────────────────────────────────────────────────────────
const SceneContent = ({ onLanded, chapter, mood }) => (
  <>
    <SceneFog />
    <LandingCamera onLanded={onLanded} chapter={chapter} />

    <GuideAvatar />

    <EnvironmentController weather={{ dust: 0.58, fog: 0.5, rain: 0, wind: 0.28 }} mood={mood} />

    {/* Directional key light from upper right — cold blue */}
    <directionalLight
      position={[30, 60, 20]}
      color="#c8d8ff"
      intensity={0.78}
    />

    {/* Warm fill from ground — city bounce light */}
    <pointLight position={[0, -2, -20]} color="#4067b8" intensity={10} distance={100} decay={2} />

    <SkyGlow />
    <Ground />

    {/* Central Landmark */}
    <HeroBuilding position={[0, 0, -25]} />

    {/* Animated city life — LivingCity from the city/ system */}
    <LivingCity />

    <FlyingVehicles />
    <AircraftSilhouettes />

    {/* Atmospheric Elements */}
    <GroundFog />
    <VolumetricRays />
    <DriftingDust />
  </>
)

// ─── CityReveal ───────────────────────────────────────────────────────────────
const CityReveal = ({ onSettled }) => {
  const [chapter, setChapter] = useState('hero')
  const mood = CHAPTER_MOODS[chapter] ?? CHAPTER_MOODS.hero

  useEffect(() => {
    const setJourneyChapter = (event) => setChapter(event.detail || 'hero')
    window.addEventListener('nova-city:chapter', setJourneyChapter)
    return () => window.removeEventListener('nova-city:chapter', setJourneyChapter)
  }, [])
  return (
    <BuildingProvider>
      <SelectionProvider>
      <NovaOSProvider>
      <GuideProvider>
      <JourneyLandmarkHighlighter chapter={chapter} />
      <div className="relative h-screen w-full overflow-hidden bg-[#060810]">
      <style>{`
        @keyframes city-unfade { 0%{opacity:1} 100%{opacity:0} }
        @keyframes city-ui-in  { 0%{opacity:0;transform:translateY(16px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes city-guide-in { 0%,12%{opacity:0;transform:translateY(-10px)} 28%,72%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-6px)} }
      `}</style>

      <Canvas
        camera={{ position: [0, 5.5, 16], fov: 58 }}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        dpr={[1, 1.5]}
        className="absolute inset-0"
        onCreated={({ gl }) => {
           // Exposure adaptation
           gsap.fromTo(gl, 
             { toneMappingExposure: 4.0 }, 
             { toneMappingExposure: 1.1, duration: 8, ease: "power2.out" }
           )
        }}
      >
        <SceneContent onLanded={onSettled} chapter={chapter} mood={mood} />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 transition-[background] duration-[1800ms] ease-out" style={{ background: `radial-gradient(ellipse 76% 65% at 50% 72%, ${mood.overlay}, transparent 72%)` }} />

      {/* Holographic Portfolio Window — DOM overlay, reads BuildingManager context */}
      <HoloController />
      <NovaOSLayer />
      <Suspense fallback={null}><GuideController /></Suspense>

      {/* Subtle vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,4,0.72) 100%)',
        }}
      />

      {/* City name reveal — fades in after the white-out settles */}
      <div
        className="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 text-center"
        style={{ animation: 'city-ui-in 2.2s 1.4s ease-out both' }}
      >
        <p className="text-[9px] font-medium tracking-[0.55em] text-white/30 mb-2">
          COLONY SIGMA-7 / OUTER RIM
        </p>
        <p className="text-sm font-light tracking-[0.45em] text-white/55">
          NOVA CITY
        </p>
      </div>

      {/* Entry white-out fade that matches AtmosphereTransition's final flash */}
      <div
        className="pointer-events-none absolute inset-0 bg-white"
        style={{ animation: 'city-unfade 1.4s ease-out forwards' }}
      />
      </div>
      </GuideProvider>
      </NovaOSProvider>
      </SelectionProvider>
    </BuildingProvider>
  )
}

export default CityReveal
