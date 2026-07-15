import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import LivingCity from './city/LivingCity'
import { HeroBuilding } from './city/HeroBuilding'
import { LandingCamera } from './city/LandingCamera'
import { GroundFog, VolumetricRays, DriftingDust } from './city/AtmosphericEffects'
import { AircraftSilhouettes } from './city/AircraftSilhouettes'
import gsap from 'gsap'

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
function generateCityLayout(seed = 42) {
  const rng = mulberry32(seed)
  const buildings = []

  // ── District 1: Downtown core — very tall, dense ─────────────────────────
  for (let i = 0; i < 18; i++) {
    const angle  = (i / 18) * Math.PI * 2 + rng() * 0.35
    const radius = 8 + rng() * 14
    buildings.push({
      x: Math.cos(angle) * radius + (rng() - 0.5) * 6,
      y: 0,
      z: -18 + Math.sin(angle) * radius * 0.8 + (rng() - 0.5) * 4,
      w: 3 + rng() * 5,
      h: 28 + rng() * 52,
      d: 3 + rng() * 5,
    })
  }

  // ── District 2: Mid-ring — varied heights ─────────────────────────────────
  for (let i = 0; i < 28; i++) {
    const col = i % 7
    const row = Math.floor(i / 7)
    const jx  = (rng() - 0.5) * 4
    const jz  = (rng() - 0.5) * 4
    buildings.push({
      x: (col - 3) * 10 + jx,
      y: 0,
      z: -34 - row * 11 + jz,
      w: 2.5 + rng() * 4,
      h: 10 + rng() * 30,
      d: 2.5 + rng() * 4,
    })
  }

  // ── District 3: Outer sprawl — low, wide ─────────────────────────────────
  for (let i = 0; i < 24; i++) {
    const angle  = (i / 24) * Math.PI * 2
    const radius = 36 + rng() * 22
    buildings.push({
      x: Math.cos(angle) * radius + (rng() - 0.5) * 8,
      y: 0,
      z: -30 + Math.sin(angle) * radius * 0.65 + (rng() - 0.5) * 8,
      w: 4 + rng() * 8,
      h: 4 + rng() * 14,
      d: 4 + rng() * 8,
    })
  }

  // ── District 4: Background silhouette towers ──────────────────────────────
  for (let i = 0; i < 14; i++) {
    buildings.push({
      x: (rng() - 0.5) * 120,
      y: 0,
      z: -65 - rng() * 35,
      w: 2 + rng() * 3,
      h: 22 + rng() * 40,
      d: 2 + rng() * 3,
    })
  }

  return buildings
}

const CITY_DATA = generateCityLayout(137)  // fixed seed → never jumps

// ─── Building meshes — instanced, colours baked from building data ───────────
const BuildingMeshes = ({ buildings }) => {
  const meshRef = useRef()

  useEffect(() => {
    if (!meshRef.current || !buildings.length) return
    const dummy = new THREE.Object3D()

    buildings.forEach((b, i) => {
      dummy.position.set(b.x, b.y + b.h * 0.5, b.z)
      dummy.scale.set(b.w, b.h, b.d)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      // Colour: darker = more distant, slight blue-grey tint
      const depth = Math.max(0, Math.min(1, (-b.z - 10) / 80))
      const base  = 0.025 + depth * 0.01
      meshRef.current.setColorAt(i, new THREE.Color(
        base * 0.85,
        base * 0.92,
        base * 1.20,
      ))
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  }, [buildings])

  return (
    <instancedMesh ref={meshRef} args={[null, null, buildings.length]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.92} metalness={0.08} envMapIntensity={0.3} />
    </instancedMesh>
  )
}

// ─── Rooftop detail: antenna spires ──────────────────────────────────────────
const RooftopSpires = ({ buildings }) => {
  const rng   = useMemo(() => mulberry32(99), [])
  const spires = useMemo(() => {
    return buildings
      .filter(b => b.h > 25 && rng() > 0.45)
      .slice(0, 24)
      .map(b => ({
        x: b.x + (rng() - 0.5) * b.w * 0.4,
        y: b.y + b.h,
        z: b.z + (rng() - 0.5) * b.d * 0.4,
        h: 2 + rng() * 6,
      }))
  }, [buildings, rng])

  const meshRef = useRef()

  useEffect(() => {
    if (!meshRef.current || !spires.length) return
    const dummy = new THREE.Object3D()
    spires.forEach((s, i) => {
      dummy.position.set(s.x, s.y + s.h * 0.5, s.z)
      dummy.scale.set(0.18, s.h, 0.18)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [spires])

  return (
    <instancedMesh ref={meshRef} args={[null, null, Math.max(1, spires.length)]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#1a1e2a" roughness={0.7} metalness={0.6} />
    </instancedMesh>
  )
}

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
const SceneContent = ({ onLanded }) => (
  <>
    <SceneFog />
    <LandingCamera onLanded={onLanded} />

    {/* Directional key light from upper right — cold blue */}
    <directionalLight
      position={[30, 60, 20]}
      color="#c8d8ff"
      intensity={0.55}
    />

    {/* Warm fill from ground — city bounce light */}
    <pointLight position={[0, -2, -20]} color="#304080" intensity={8} distance={80} decay={2} />

    <SkyGlow />
    <Ground />

    {/* Static building geometry */}
    <BuildingMeshes buildings={CITY_DATA} />
    <RooftopSpires  buildings={CITY_DATA} />

    {/* Central Landmark */}
    <HeroBuilding position={[0, 0, -25]} />

    {/* Animated city life — LivingCity from the city/ system */}
    <LivingCity
      buildingData={CITY_DATA}
      fogGroundY={0}
      fogRadius={180}
      fogDensity={0.22}
      particleAlpha={0.18}
    />

    <FlyingVehicles />
    <AircraftSilhouettes />

    {/* Atmospheric Elements */}
    <GroundFog />
    <VolumetricRays />
    <DriftingDust />
  </>
)

// ─── CityReveal ───────────────────────────────────────────────────────────────
const CityReveal = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#060810]">
      <style>{`
        @keyframes city-unfade { 0%{opacity:1} 100%{opacity:0} }
        @keyframes city-ui-in  { 0%{opacity:0;transform:translateY(16px)} 100%{opacity:1;transform:translateY(0)} }
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
        <SceneContent onLanded={() => {}} />
      </Canvas>

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
  )
}

export default CityReveal
