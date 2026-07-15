import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import Planet from './Planet'
import PlanetScanner from './PlanetScanner'
import PlanetInfoPanel from './PlanetInfoPanel'
import { TransitionWebGL, TransitionHTML } from './transitions/TransitionManager'

const LOOP_DURATION = 38
const HUD_DELAY_MS  = 22000

const triangle = (riseStart, riseEnd, fallStart, fallEnd, x) => {
  const rise = THREE.MathUtils.smoothstep(x, riseStart, riseEnd)
  const fall = 1 - THREE.MathUtils.smoothstep(x, fallStart, fallEnd)
  return Math.min(rise, fall)
}

const SceneFog = () => {
  const { scene } = useThree()
  scene.fog = new THREE.FogExp2('#04060A', 0.022)
  return null
}

// ------------------------------------------------------------------
// Stars — Phase 2: add faint cross-flare on brightest stars
// ------------------------------------------------------------------
const starVertexShader = `
  attribute float aSize;
  attribute float aColorMix;
  attribute float aPhase;
  attribute float aTwinkleSpeed;
  attribute float aTwinkleAmount;

  uniform float uTime;
  uniform float uPixelRatio;

  varying float vColorMix;
  varying float vBrightness;
  varying float vSize;

  void main() {
    vColorMix = aColorMix;
    float twinkle = 1.0 + sin(uTime * aTwinkleSpeed + aPhase) * aTwinkleAmount;
    vBrightness = twinkle;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float sz = aSize * uPixelRatio * (300.0 / -mvPosition.z) * twinkle;
    vSize = sz;
    gl_PointSize = sz;
    gl_Position  = projectionMatrix * mvPosition;
  }
`

const starFragmentShader = `
  varying float vColorMix;
  varying float vBrightness;
  varying float vSize;

  void main() {
    vec2  uv   = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    float core = smoothstep(0.5, 0.0, dist);

    // Subtle diffraction cross for bright stars
    float cross = 0.0;
    if (vSize > 2.5) {
      float h = smoothstep(0.02, 0.0, abs(uv.y)) * smoothstep(0.5, 0.0, abs(uv.x));
      float v = smoothstep(0.02, 0.0, abs(uv.x)) * smoothstep(0.5, 0.0, abs(uv.y));
      cross = (h + v) * 0.18 * (vSize - 2.5) / 2.5;
    }

    float alpha = clamp(core + cross, 0.0, 1.0);

    vec3 white = vec3(1.0, 1.0, 1.0);
    vec3 blue  = vec3(0.55, 0.64, 1.0);
    vec3 warm  = vec3(1.0, 0.88, 0.70);
    // colorMix: 0=white, 0-0.5=blue, 0.5-1=warm
    vec3 color;
    if (vColorMix < 0.5) color = mix(white, blue, vColorMix * 2.0);
    else                  color = mix(white, warm, (vColorMix - 0.5) * 2.0);

    gl_FragColor = vec4(color, alpha * clamp(vBrightness, 0.0, 1.5) * 0.88);
  }
`

const CinematicStars = () => {
  const materialRef = useRef()
  const count = 7500

  const { positions, sizes, colorMix, phase, twinkleSpeed, twinkleAmount } = useMemo(() => {
    const positions     = new Float32Array(count * 3)
    const sizes         = new Float32Array(count)
    const colorMix      = new Float32Array(count)
    const phase         = new Float32Array(count)
    const twinkleSpeed  = new Float32Array(count)
    const twinkleAmount = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const radius = 55 + Math.random() * 45
      const theta  = Math.random() * Math.PI * 2
      const phi    = Math.acos(2 * Math.random() - 1)

      positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      // Few very bright stars
      const bright    = Math.random() < 0.04
      sizes[i]        = bright ? Math.random() * 2.2 + 2.8 : Math.random() * 1.6 + 0.3
      // tri-color: cool blue, warm gold, white
      const roll      = Math.random()
      colorMix[i]     = roll < 0.28 ? Math.random() * 0.5        // blue tint
                       : roll < 0.42 ? 0.5 + Math.random() * 0.5 // warm tint
                       : 0                                         // white
      phase[i]         = Math.random() * Math.PI * 2
      const doesTwinkle = Math.random() < 0.38
      twinkleSpeed[i]  = doesTwinkle ? Math.random() * 0.6 + 0.12 : 0.04
      twinkleAmount[i] = doesTwinkle ? Math.random() * 0.38 + 0.08 : 0.02
    }

    return { positions, sizes, colorMix, phase, twinkleSpeed, twinkleAmount }
  }, [])

  useFrame(({ clock }) => {
    if (materialRef.current) materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position"       count={count} array={positions}     itemSize={3} />
        <bufferAttribute attach="attributes-aSize"          count={count} array={sizes}         itemSize={1} />
        <bufferAttribute attach="attributes-aColorMix"      count={count} array={colorMix}      itemSize={1} />
        <bufferAttribute attach="attributes-aPhase"         count={count} array={phase}         itemSize={1} />
        <bufferAttribute attach="attributes-aTwinkleSpeed"  count={count} array={twinkleSpeed}  itemSize={1} />
        <bufferAttribute attach="attributes-aTwinkleAmount" count={count} array={twinkleAmount} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={{
          uTime:       { value: 0 },
          uPixelRatio: { value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 1.5) : 1 },
        }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ------------------------------------------------------------------
// Nebula ribbon — a procedural backdrop haze cloud
// ------------------------------------------------------------------
const NebulaRibbon = () => {
  const count  = 280
  const matRef = useRef()

  const { positions, sizes, opacities } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes     = new Float32Array(count)
    const opacities = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Spread in a wide ribbon behind the planet
      const u = (Math.random() - 0.5) * 40
      const v = (Math.random() - 0.5) * 18 + Math.sin(u * 0.12) * 3
      const w = -18 - Math.random() * 14

      positions[i * 3]     = u
      positions[i * 3 + 1] = v
      positions[i * 3 + 2] = w

      sizes[i]     = 4.0 + Math.random() * 8.0
      opacities[i] = Math.random() * 0.06 + 0.02
    }
    return { positions, sizes, opacities }
  }, [])

  useFrame(({ clock }) => {
    if (matRef.current) {
      const t = clock.getElapsedTime()
      matRef.current.uniforms.uTime.value = t
    }
  })

  const vert = `
    attribute float aSize;
    attribute float aOpacity;
    uniform float uTime;
    uniform float uPR;
    varying float vOpacity;
    void main() {
      vOpacity = aOpacity;
      float drift = sin(uTime * 0.04 + position.x * 0.1) * 0.4;
      vec3 pos = position + vec3(0.0, drift, 0.0);
      vec4 mv  = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = aSize * uPR * (180.0 / -mv.z);
      gl_Position  = projectionMatrix * mv;
    }
  `
  const frag = `
    varying float vOpacity;
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      float a = smoothstep(0.5, 0.1, d);
      // violet-blue nebula color
      vec3 col = mix(vec3(0.28, 0.14, 0.58), vec3(0.12, 0.28, 0.72), uv.x + 0.5);
      gl_FragColor = vec4(col, a * vOpacity);
    }
  `

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize"    count={count} array={sizes}     itemSize={1} />
        <bufferAttribute attach="attributes-aOpacity" count={count} array={opacities} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={{ uTime: { value: 0 }, uPR: { value: Math.min(window?.devicePixelRatio ?? 1, 1.5) } }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ------------------------------------------------------------------
// FloatingDust — Phase 2: more layers, blueish cold dust
// ------------------------------------------------------------------
const DustLayer = ({ count, zRange, speed, size, opacity, spread, color = '#ffffff' }) => {
  const pointsRef = useRef()

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * spread
      arr[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.65
      arr[i * 3 + 2] = zRange[0] + Math.random() * (zRange[1] - zRange[0])
    }
    return arr
  }, [count, zRange, spread])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const t = clock.getElapsedTime()
    pointsRef.current.rotation.y = t * speed
    pointsRef.current.position.y = Math.sin(t * speed * 4) * 0.22
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        sizeAttenuation
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

const FloatingDust = () => (
  <>
    <DustLayer count={100} zRange={[2, 6]}   speed={0.022} size={0.048} opacity={0.38} spread={16} color="#aac0ff" />
    <DustLayer count={180} zRange={[-4, 2]}  speed={0.010} size={0.030} opacity={0.24} spread={24} color="#c8d8ff" />
    <DustLayer count={140} zRange={[-16,-4]} speed={0.005} size={0.018} opacity={0.14} spread={34} color="#ffffff" />
    <DustLayer count={80}  zRange={[-8, -2]} speed={0.015} size={0.055} opacity={0.10} spread={18} color="#6644aa" />
  </>
)

// ------------------------------------------------------------------
// DebrisField, MeteorStreak, ShockwaveRing
// ------------------------------------------------------------------
const DebrisField = ({ intensityRef }) => {
  const ref   = useRef()
  const count = 220

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle  = (i / count) * Math.PI * 2 + (i % 7) * 0.15
      const radius = 5.2 + (i % 5) * 0.48
      arr[i * 3]     = Math.cos(angle) * radius + 3
      arr[i * 3 + 1] = ((i % 11) / 11 - 0.5) * 3.8 - 0.1
      arr[i * 3 + 2] = Math.sin(angle) * radius - 6
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const intensity = intensityRef.current.debris
    ref.current.rotation.y = clock.getElapsedTime() * (0.08 + intensity * 0.28)
    ref.current.material.opacity = intensity * 0.60
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color="#8ab4ff"
        size={0.055}
        sizeAttenuation
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

const MeteorStreak = ({ intensityRef }) => {
  const ref      = useRef()
  const trailRef = useRef()

  useFrame(() => {
    if (!ref.current) return
    const intensity = intensityRef.current.meteor
    const startX = -14, endX = 5
    const x = THREE.MathUtils.lerp(startX, endX, intensity)
    const y = THREE.MathUtils.lerp(6, -1.5, intensity)
    const z = THREE.MathUtils.lerp(-2, -7, intensity)

    ref.current.position.set(x + 3, y, z)
    ref.current.material.opacity = intensity * 0.95
    ref.current.scale.setScalar(0.15 + intensity * 0.35)

    if (trailRef.current) {
      trailRef.current.position.set(x + 2.2, y + 0.4, z + 0.8)
      trailRef.current.rotation.z = Math.atan2(-(y - 6), x - startX + 0.01)
      trailRef.current.material.opacity = intensity * 0.5
      trailRef.current.scale.set(2.5 + intensity * 4, 0.04 + intensity * 0.06, 1)
    }
  })

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#ffeedd" transparent opacity={0} toneMapped={false} />
      </mesh>
      <mesh ref={trailRef} rotation={[0, 0, -0.6]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          color="#ffaa66"
          transparent opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

const ShockwaveRing = ({ intensityRef }) => {
  const ref = useRef()

  useFrame(() => {
    if (!ref.current) return
    const intensity = intensityRef.current.shock
    ref.current.scale.setScalar(1 + intensity * 0.48)
    ref.current.material.opacity = intensity * 0.38
  })

  return (
    <mesh ref={ref} position={[3, -0.1, -6]} rotation={[Math.PI / 2.2, 0, 0]}>
      <ringGeometry args={[4.2, 4.28, 128]} />
      <meshBasicMaterial
        color="#4F7CFF"
        transparent opacity={0}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

// ------------------------------------------------------------------
// Ambient Space Improvements (Shooting Stars)
// ------------------------------------------------------------------
const ShootingStars = () => {
  const groupRef = useRef()
  const stars = useMemo(() => Array.from({ length: 8 }, () => ({
    x: (Math.random() - 0.5) * 60,
    y: (Math.random() - 0.5) * 40,
    z: -10 - Math.random() * 30,
    speed: 15 + Math.random() * 25,
    delay: Math.random() * 15,
    active: false,
    progress: 0
  })), [])

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime()
    if (!groupRef.current) return
    groupRef.current.children.forEach((mesh, i) => {
      const star = stars[i]
      if (!star.active && t > star.delay) {
        star.active = true
        star.progress = 0
      }
      if (star.active) {
        star.progress += delta * star.speed
        mesh.position.set(star.x + star.progress, star.y - star.progress * 0.4, star.z)
        mesh.material.opacity = Math.max(0, 1 - star.progress / 40)
        if (star.progress > 40) {
           star.active = false
           star.delay = t + 4 + Math.random() * 12
           star.x = (Math.random() - 0.5) * 60
           star.y = (Math.random() - 0.5) * 40
           star.z = -10 - Math.random() * 30
        }
      } else {
        mesh.material.opacity = 0
      }
    })
  })

  return (
    <group ref={groupRef}>
      {stars.map((_, i) => (
        <mesh key={i} rotation={[0, 0, -0.4]}>
          <planeGeometry args={[1.5, 0.03]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

// ------------------------------------------------------------------
// Timeline — Manages camera, transitions, and cinematic events
// ------------------------------------------------------------------
const Timeline = ({ planetRef, eventsRef, transitionRef }) => {
  useFrame(({ clock, camera }) => {
    const elapsed = clock.getElapsedTime()
    const phase   = Math.min(elapsed, LOOP_DURATION)

    const handle = planetRef.current
    if (!handle) return

    const approach     = THREE.MathUtils.smoothstep(phase, 5.5, 34)
    const baseDistance = THREE.MathUtils.lerp(26, 4.6, approach)

    // Breathing: slow in-out
    const breathing = Math.sin(elapsed * 0.14) * 0.14 + Math.sin(elapsed * 0.31 + 1.1) * 0.05

    // Horizontal wander
    const handX = Math.sin(elapsed * 0.37) * 0.020 + Math.sin(elapsed * 0.91 + 1.3) * 0.009 + Math.sin(elapsed * 0.19 + 2.7) * 0.006

    // Vertical wander
    const handY = Math.cos(elapsed * 0.28 + 0.7) * 0.014 + Math.sin(elapsed * 0.53 + 1.8) * 0.007 + Math.cos(elapsed * 0.71) * 0.004

    // Roll
    const roll = Math.sin(elapsed * 0.07) * 0.012 + Math.sin(elapsed * 0.20 + 2.0) * 0.005 + Math.cos(elapsed * 0.11 + 0.9) * 0.003

    // Tension shake near impact
    const tensionShake = triangle(29, 30, 36, 38, phase) * 0.045

    const timelinePos = new THREE.Vector3(
      -0.7 + Math.sin(elapsed * 0.05) * 0.40 + handX + Math.sin(elapsed * 8) * tensionShake,
      -0.25 + Math.cos(elapsed * 0.044) * 0.22 + handY + Math.cos(elapsed * 7) * tensionShake * 0.6,
      baseDistance + breathing
    )
    
    const lookX = 0.8 + Math.sin(elapsed * 0.06) * 0.12
    const lookY = 0.45 + Math.cos(elapsed * 0.05 + 0.5) * 0.06
    
    const dummyCamera = new THREE.PerspectiveCamera()
    dummyCamera.position.copy(timelinePos)
    dummyCamera.lookAt(lookX, lookY, -6)
    dummyCamera.rotation.z += roll
    const timelineQuat = dummyCamera.quaternion

    // --- Camera Transition Logic ---
    if (!transitionRef.current.active && !transitionRef.current.targetPlanet) {
      // Normal playback
      camera.position.copy(timelinePos)
      camera.quaternion.copy(timelineQuat)
    } else {
      // Interpolating or fixed to planet
      const t = transitionRef.current.t
      const tPlanet = transitionRef.current.targetPlanet

      if (tPlanet) {
        // We are moving to or looking at a selected planet
        const pData = tPlanet.data
        const gRef = tPlanet.groupRef
        const target = new THREE.Vector3()
        if (gRef) {
          gRef.getWorldPosition(target)
        } else if (planetRef.current?.planetGroup) {
          planetRef.current.planetGroup.getWorldPosition(target)
        } else {
          target.set(pData.cameraTarget.x, pData.cameraTarget.y, pData.cameraTarget.z)
        }
        
        const offset = new THREE.Vector3(pData.cameraOffset.x, pData.cameraOffset.y, pData.cameraOffset.z)
        
        if (t === 1) {
          if (!transitionRef.current.orbitStartPhase) {
            transitionRef.current.orbitStartPhase = elapsed
          }
          const orbitAngle = (elapsed - transitionRef.current.orbitStartPhase) * 0.05
          offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), orbitAngle)
        }
        
        const camPos = target.clone().add(offset)
        
        dummyCamera.position.copy(camPos)
        dummyCamera.lookAt(target)
        const camQuat = dummyCamera.quaternion

        camera.position.lerpVectors(transitionRef.current.startPos, camPos, t)
        camera.quaternion.slerpQuaternions(transitionRef.current.startQuat, camQuat, t)
      } else {
        // Returning to timeline path
        camera.position.lerpVectors(transitionRef.current.startPos, timelinePos, t)
        camera.quaternion.slerpQuaternions(transitionRef.current.startQuat, timelineQuat, t)
      }
    }

    // --- Planet timeline events (unchanged logic) ---
    const beaconOpacity = triangle(5, 6, 8.5, 10.5, phase)
    if (handle.beaconMaterial) handle.beaconMaterial.opacity = beaconOpacity * 0.9

    const planetOpacity = THREE.MathUtils.smoothstep(phase, 8, 15)
    if (handle.planetMaterial) handle.planetMaterial.uniforms.uOpacity.value = planetOpacity

    const ringOpacity = THREE.MathUtils.smoothstep(phase, 22, 25)
    if (handle.ringMesh) handle.ringMesh.material.opacity = ringOpacity * 0.5

    const ringLightsOpacity = THREE.MathUtils.smoothstep(phase, 26, 28)
    if (handle.ringLights) {
      handle.ringLights.material.opacity = ringLightsOpacity
      handle.ringLights.rotation.z += 0.0002 + ringLightsOpacity * 0.0003
    }

    const debris = triangle(27, 28.5, 33, 34.5, phase)
    const meteor = triangle(29.5, 30.5, 32.5, 33.5, phase)
    const shock  = triangle(32.5, 33, 36, 37.5, phase)
    const city   = THREE.MathUtils.smoothstep(phase, 35, 39)

    eventsRef.current.debris = debris
    eventsRef.current.meteor = meteor
    eventsRef.current.shock  = shock
    eventsRef.current.city   = city

    if (handle.atmosphereUniforms) {
      const base = 0.2 + planetOpacity * 0.9
      handle.atmosphereUniforms.intensity.value = base + meteor * 0.6 + shock * 1.0 + city * 0.4
    }

    if (handle.planetMaterial) {
      handle.planetMaterial.uniforms.uCityLightColor.value.setRGB(
        1.0,
        0.94 - city * 0.04,
        0.82 + city * 0.18,
      )
    }
  })

  return null
}

// ------------------------------------------------------------------
// SceneContent
// ------------------------------------------------------------------
const SceneContent = ({ selectedPlanet, onPlanetSelect, descentActive, onDescentProgress, onDescentComplete }) => {
  const planetRef = useRef()
  const eventsRef = useRef({ debris: 0, meteor: 0, shock: 0, city: 0 })
  const { camera } = useThree()

  const transitionRef = useRef({
    active: false,
    t: 0,
    startPos: new THREE.Vector3(),
    startQuat: new THREE.Quaternion(),
    targetPlanet: null
  })

  useEffect(() => {
    if (selectedPlanet) {
      transitionRef.current.active = true
      transitionRef.current.startPos.copy(camera.position)
      transitionRef.current.startQuat.copy(camera.quaternion)
      transitionRef.current.targetPlanet = selectedPlanet
      
      gsap.fromTo(transitionRef.current, { t: 0 }, {
        t: 1, duration: 1.5, ease: 'power2.inOut'
      })
    } else if (transitionRef.current.active || transitionRef.current.targetPlanet) {
      transitionRef.current.active = true
      transitionRef.current.startPos.copy(camera.position)
      transitionRef.current.startQuat.copy(camera.quaternion)
      transitionRef.current.targetPlanet = null
      transitionRef.current.orbitStartPhase = null
      
      gsap.fromTo(transitionRef.current, { t: 0 }, {
        t: 1, duration: 1.5, ease: 'power2.inOut',
        onComplete: () => {
          transitionRef.current.active = false
        }
      })
    }
  }, [selectedPlanet, camera])

  return (
    <>
      <SceneFog />
      <CinematicStars />
      <NebulaRibbon />
      <Planet ref={planetRef} position={[3.0, -0.1, -6]} radius={3.8} onPlanetSelect={(data, ref) => onPlanetSelect({data, groupRef: ref})} selectedPlanetId={selectedPlanet?.data?.id} />
      <FloatingDust />
      <ShootingStars />
      <DebrisField intensityRef={eventsRef} />
      <MeteorStreak intensityRef={eventsRef} />
      <ShockwaveRing intensityRef={eventsRef} />
      {!descentActive && <Timeline planetRef={planetRef} eventsRef={eventsRef} transitionRef={transitionRef} />}
      <TransitionWebGL active={descentActive} targetPlanet={selectedPlanet} onComplete={onDescentComplete} onProgress={onDescentProgress} />
    </>
  )
}

// ------------------------------------------------------------------
// SpaceScene
// ------------------------------------------------------------------
const SpaceScene = ({ onEnterMission }) => {
  const [showHud, setShowHud] = useState(false)
  const [selectedPlanet, setSelectedPlanet] = useState(null)
  const [descentActive, setDescentActive] = useState(false)
  const [descentProgress, setDescentProgress] = useState(0)

  useEffect(() => {
    const hudTimeout = setTimeout(() => setShowHud(true), HUD_DELAY_MS)
    return () => clearTimeout(hudTimeout)
  }, [])

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#020305]">
      <style>
        {`
          @keyframes bloom-pulse {
            0%, 100% { opacity: 0.50; transform: translate(-50%, -50%) scale(1); }
            50%       { opacity: 0.76; transform: translate(-50%, -50%) scale(1.10); }
          }
          @keyframes haze-drift {
            0%, 100% { opacity: 0.22; }
            50%       { opacity: 0.38; }
          }
          @keyframes haze-drift-b {
            0%, 100% { opacity: 0.12; transform: scale(1); }
            50%       { opacity: 0.24; transform: scale(1.08); }
          }
          @keyframes hud-fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        `}
      </style>

      <Canvas
        camera={{ position: [-1, 0, 32], fov: 34 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        className="absolute inset-0"
      >
        <color attach="background" args={['#020305']} />
        <SceneContent 
           selectedPlanet={selectedPlanet} 
           onPlanetSelect={(data) => {
              if (selectedPlanet?.data?.id === data?.data?.id) {
                 setDescentActive(true) // trigger descent on second click
              } else {
                 setSelectedPlanet(data)
              }
           }} 
           descentActive={descentActive}
           onDescentProgress={setDescentProgress}
           onDescentComplete={onEnterMission}
        />
      </Canvas>

      {/* Blur background overlay when planet selected */}
      <div 
        className={`pointer-events-none absolute inset-0 z-[4] bg-black/30 backdrop-blur-sm transition-opacity duration-1000 ${selectedPlanet ? 'opacity-100' : 'opacity-0'}`} 
      />

      {/* Upper-left violet haze */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-[560px] w-[560px] rounded-full mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(79,124,255,0.22), transparent 70%)',
          filter: 'blur(70px)',
          animation: 'haze-drift 16s ease-in-out infinite',
        }}
      />

      {/* Lower-right warm accent */}
      <div
        className="pointer-events-none absolute -bottom-24 right-0 h-[400px] w-[400px] rounded-full mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(120,60,20,0.18), transparent 70%)',
          filter: 'blur(80px)',
          animation: 'haze-drift-b 22s ease-in-out infinite',
        }}
      />

      {/* Radial vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 26%, rgba(0,0,0,0.92) 100%)',
          opacity: descentActive ? 0 : 1,
          transition: 'opacity 2s ease'
        }}
      />

      <div style={{ opacity: descentActive ? 0 : 1, transition: 'opacity 1s ease', pointerEvents: descentActive ? 'none' : 'auto' }}>
         <PlanetInfoPanel planet={selectedPlanet?.data} onClose={() => setSelectedPlanet(null)} />
      </div>

      {showHud && !selectedPlanet && !descentActive && (
        <div
          className="absolute inset-0 z-[5]"
          style={{ animation: 'hud-fade-in 1.6s ease-out forwards' }}
        >
          <PlanetScanner onEnterMission={() => {
             // If a planet is already selected, just descend. Otherwise default to Nova Prime
             if (!selectedPlanet) {
                setSelectedPlanet({ data: { id: 'nova-prime', cameraTarget: {x:3,y:-0.1,z:-6} } })
             }
             setDescentActive(true)
          }} />
        </div>
      )}

      <TransitionHTML active={descentActive} progress={descentProgress} />
    </div>
  )
}

export default SpaceScene