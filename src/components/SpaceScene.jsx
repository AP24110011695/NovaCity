import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Planet from './Planet'
import PlanetScanner from './PlanetScanner'

const LOOP_DURATION = 38
const HUD_DELAY_MS = 22000

const triangle = (riseStart, riseEnd, fallStart, fallEnd, x) => {
  const rise = THREE.MathUtils.smoothstep(x, riseStart, riseEnd)
  const fall = 1 - THREE.MathUtils.smoothstep(x, fallStart, fallEnd)
  return Math.min(rise, fall)
}

const SceneFog = () => {
  const { scene } = useThree()
  scene.fog = new THREE.FogExp2('#04060A', 0.028)
  return null
}

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

  void main() {
    vColorMix = aColorMix;
    float twinkle = 1.0 + sin(uTime * aTwinkleSpeed + aPhase) * aTwinkleAmount;
    vBrightness = twinkle;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z) * twinkle;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const starFragmentShader = `
  varying float vColorMix;
  varying float vBrightness;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    float alpha = smoothstep(0.5, 0.0, dist);

    vec3 white = vec3(1.0, 1.0, 1.0);
    vec3 blue = vec3(0.56, 0.63, 1.0);
    vec3 color = mix(white, blue, vColorMix);

    gl_FragColor = vec4(color, alpha * clamp(vBrightness, 0.0, 1.4) * 0.9);
  }
`

const CinematicStars = () => {
  const materialRef = useRef()
  const count = 6000

  const { positions, sizes, colorMix, phase, twinkleSpeed, twinkleAmount } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const colorMix = new Float32Array(count)
    const phase = new Float32Array(count)
    const twinkleSpeed = new Float32Array(count)
    const twinkleAmount = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const radius = 55 + Math.random() * 45
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      sizes[i] = Math.random() * 1.8 + 0.4
      colorMix[i] = Math.random() < 0.35 ? Math.random() * 0.6 + 0.4 : 0
      phase[i] = Math.random() * Math.PI * 2
      const doesTwinkle = Math.random() < 0.4
      twinkleSpeed[i] = doesTwinkle ? Math.random() * 0.5 + 0.15 : 0.05
      twinkleAmount[i] = doesTwinkle ? Math.random() * 0.35 + 0.1 : 0.03
    }

    return { positions, sizes, colorMix, phase, twinkleSpeed, twinkleAmount }
  }, [])

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aColorMix" count={count} array={colorMix} itemSize={1} />
        <bufferAttribute attach="attributes-aPhase" count={count} array={phase} itemSize={1} />
        <bufferAttribute attach="attributes-aTwinkleSpeed" count={count} array={twinkleSpeed} itemSize={1} />
        <bufferAttribute attach="attributes-aTwinkleAmount" count={count} array={twinkleAmount} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uPixelRatio: { value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 1.5) : 1 },
        }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

const DustLayer = ({ count, zRange, speed, size, opacity, spread }) => {
  const pointsRef = useRef()

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * spread
      arr[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.65
      arr[i * 3 + 2] = zRange[0] + Math.random() * (zRange[1] - zRange[0])
    }
    return arr
  }, [count, zRange, spread])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const t = clock.getElapsedTime()
    pointsRef.current.rotation.y = t * speed
    pointsRef.current.position.y = Math.sin(t * speed * 4) * 0.25
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
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
    <DustLayer count={90} zRange={[2, 6]} speed={0.02} size={0.05} opacity={0.4} spread={16} />
    <DustLayer count={160} zRange={[-4, 2]} speed={0.01} size={0.032} opacity={0.28} spread={22} />
    <DustLayer count={120} zRange={[-14, -4]} speed={0.005} size={0.02} opacity={0.16} spread={30} />
  </>
)

const DebrisField = ({ intensityRef }) => {
  const ref = useRef()
  const count = 180

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (i % 7) * 0.15
      const radius = 5.5 + (i % 5) * 0.44
      arr[i * 3] = Math.cos(angle) * radius + 3
      arr[i * 3 + 1] = ((i % 11) / 11 - 0.5) * 3.5 - 0.1
      arr[i * 3 + 2] = Math.sin(angle) * radius - 6
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const intensity = intensityRef.current.debris
    ref.current.rotation.y = clock.getElapsedTime() * (0.08 + intensity * 0.25)
    ref.current.material.opacity = intensity * 0.55
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color="#8aa4ff"
        size={0.06}
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
  const ref = useRef()
  const trailRef = useRef()

  useFrame(({ clock }) => {
    if (!ref.current) return
    const intensity = intensityRef.current.meteor
    const startX = -14
    const endX = 5
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
          transparent
          opacity={0}
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
    const scale = 1 + intensity * 0.45
    ref.current.scale.setScalar(scale)
    ref.current.material.opacity = intensity * 0.35
  })

  return (
    <mesh ref={ref} position={[3, -0.1, -6]} rotation={[Math.PI / 2.2, 0, 0]}>
      <ringGeometry args={[4.2, 4.28, 128]} />
      <meshBasicMaterial
        color="#4F7CFF"
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

const Timeline = ({ planetRef, eventsRef }) => {
  useFrame(({ clock, camera }) => {
    const elapsed = clock.getElapsedTime()
    const phase = Math.min(elapsed, LOOP_DURATION)

    const handle = planetRef.current
    if (!handle) return

    const approach = THREE.MathUtils.smoothstep(phase, 5.5, 34)
    const baseDistance = THREE.MathUtils.lerp(26, 4.6, approach)

    const breathing = Math.sin(elapsed * 0.15) * 0.12
    const handX = Math.sin(elapsed * 0.37) * 0.012 + Math.sin(elapsed * 0.91 + 1.3) * 0.006
    const handY = Math.sin(elapsed * 0.29 + 0.7) * 0.01 + Math.cos(elapsed * 0.53) * 0.005
    const roll = Math.sin(elapsed * 0.08) * 0.01 + Math.sin(elapsed * 0.21 + 2.0) * 0.005

    const tensionShake = triangle(29, 30, 36, 38, phase) * 0.04
    camera.position.z = baseDistance + breathing
    camera.position.x = -0.7 + Math.sin(elapsed * 0.05) * 0.35 + handX + Math.sin(elapsed * 8) * tensionShake
    camera.position.y = -0.25 + Math.cos(elapsed * 0.045) * 0.18 + handY + Math.cos(elapsed * 7) * tensionShake * 0.6

    camera.lookAt(0.8, 0.45, -6)
    camera.rotation.z += roll

    const beaconOpacity = triangle(5, 6, 8.5, 10.5, phase)
    if (handle.beaconMaterial) {
      handle.beaconMaterial.opacity = beaconOpacity * 0.9
    }

    const planetOpacity = THREE.MathUtils.smoothstep(phase, 8, 15)
    if (handle.planetMaterial) {
      handle.planetMaterial.uniforms.uOpacity.value = planetOpacity
    }

    const ringOpacity = THREE.MathUtils.smoothstep(phase, 22, 25)
    if (handle.ringMesh) {
      handle.ringMesh.material.opacity = ringOpacity * 0.5
    }

    const ringLightsOpacity = THREE.MathUtils.smoothstep(phase, 26, 28)
    if (handle.ringLights) {
      handle.ringLights.material.opacity = ringLightsOpacity
      handle.ringLights.rotation.z += 0.0002 + ringLightsOpacity * 0.0003
    }

    const debris = triangle(27, 28.5, 33, 34.5, phase)
    const meteor = triangle(29.5, 30.5, 32.5, 33.5, phase)
    const shock = triangle(32.5, 33, 36, 37.5, phase)
    const city = THREE.MathUtils.smoothstep(phase, 35, 39)

    eventsRef.current.debris = debris
    eventsRef.current.meteor = meteor
    eventsRef.current.shock = shock
    eventsRef.current.city = city

    if (handle.atmosphereUniforms) {
      const base = 0.2 + planetOpacity * 0.9
      handle.atmosphereUniforms.intensity.value =
        base + meteor * 0.6 + shock * 0.9 + city * 0.4
    }

    if (handle.planetMaterial) {
      handle.planetMaterial.uniforms.uCityLightColor.value.setRGB(
        0.85 + city * 0.15,
        0.89 + city * 0.1,
        1.0,
      )
    }
  })

  return null
}

const SceneContent = () => {
  const planetRef = useRef()
  const eventsRef = useRef({ debris: 0, meteor: 0, shock: 0, city: 0 })

  return (
    <>
      <SceneFog />
      <CinematicStars />
      <Planet ref={planetRef} position={[3.0, -0.1, -6]} radius={3.8} />
      <FloatingDust />
      <DebrisField intensityRef={eventsRef} />
      <MeteorStreak intensityRef={eventsRef} />
      <ShockwaveRing intensityRef={eventsRef} />
      <Timeline planetRef={planetRef} eventsRef={eventsRef} />
    </>
  )
}

const SpaceScene = ({ onEnterMission }) => {
  const [showHud, setShowHud] = useState(false)

  useEffect(() => {
    const hudTimeout = setTimeout(() => setShowHud(true), HUD_DELAY_MS)
    return () => clearTimeout(hudTimeout)
  }, [])

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#020305]">
      <style>
        {`
          @keyframes bloom-pulse {
            0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
            50%      { opacity: 0.8;  transform: translate(-50%, -50%) scale(1.08); }
          }
          @keyframes haze-drift {
            0%, 100% { opacity: 0.25; }
            50%      { opacity: 0.4; }
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
        <SceneContent />
      </Canvas>

      <div
        className="pointer-events-none absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(79,124,255,0.25), transparent 70%)',
          filter: 'blur(60px)',
          animation: 'haze-drift 14s ease-in-out infinite',
        }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 28%, rgba(0,0,0,0.92) 100%)',
        }}
      />

      {showHud && (
        <div
          className="absolute inset-0 z-[5]"
          style={{ animation: 'hud-fade-in 1.6s ease-out forwards' }}
        >
          <PlanetScanner onEnterMission={onEnterMission} />
        </div>
      )}
    </div>
  )
}

export default SpaceScene
