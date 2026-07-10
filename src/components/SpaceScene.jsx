import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Planet from './Planet'
import PlanetScanner from './PlanetScanner'

const LOOP_DURATION = 40
const HUD_DELAY_MS = 26500

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

const Timeline = ({ planetRef }) => {
  useFrame(({ clock, camera }) => {
    const elapsed = clock.getElapsedTime()
    const phase = elapsed % LOOP_DURATION

    const handle = planetRef.current
    if (!handle) return

    const approach = THREE.MathUtils.smoothstep(phase, 5.5, 36)
    const baseDistance = THREE.MathUtils.lerp(26, 5.2, approach)

    const breathing = Math.sin(elapsed * 0.15) * 0.12
    const handX = Math.sin(elapsed * 0.37) * 0.012 + Math.sin(elapsed * 0.91 + 1.3) * 0.006
    const handY = Math.sin(elapsed * 0.29 + 0.7) * 0.01 + Math.cos(elapsed * 0.53) * 0.005
    const roll = Math.sin(elapsed * 0.08) * 0.01 + Math.sin(elapsed * 0.21 + 2.0) * 0.005

    camera.position.z = baseDistance + breathing
    camera.position.x = -0.7 + Math.sin(elapsed * 0.05) * 0.35 + handX
    camera.position.y = -0.25 + Math.cos(elapsed * 0.045) * 0.18 + handY

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
    if (handle.atmosphereUniforms) {
      handle.atmosphereUniforms.intensity.value = 0.2 + planetOpacity * 0.9
    }

    const ringOpacity = THREE.MathUtils.smoothstep(phase, 24, 26.5)
    if (handle.ringMesh) {
      handle.ringMesh.material.opacity = ringOpacity * 0.5
    }

    const ringLightsOpacity = THREE.MathUtils.smoothstep(phase, 29, 31.5)
    if (handle.ringLights) {
      handle.ringLights.material.opacity = ringLightsOpacity
      handle.ringLights.rotation.z += 0.0002 + ringLightsOpacity * 0.0003
    }
  })

  return null
}

const SceneContent = () => {
  const planetRef = useRef()

  return (
    <>
      <SceneFog />
      

      <CinematicStars />
      
      <Planet ref={planetRef} position={[3.0, -0.1, -6]} radius={3.8} />
      <FloatingDust />

      <Timeline planetRef={planetRef} />
    </>
  )
}

const SpaceScene = ({ onEnterMission }) => {
  const [showHud, setShowHud] = useState(false)
  const [hudKey, setHudKey] = useState(0)

  useEffect(() => {
    let hudTimeout

    const scheduleHud = () => {
      setShowHud(false)
      hudTimeout = setTimeout(() => {
        setShowHud(true)
      }, HUD_DELAY_MS)
    }

    scheduleHud()

    const loopInterval = setInterval(() => {
      setHudKey((prev) => prev + 1)
      scheduleHud()
    }, LOOP_DURATION * 1000)

    return () => {
      clearTimeout(hudTimeout)
      clearInterval(loopInterval)
    }
  }, [])

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#020305]">
      <style>
        {`
          @keyframes loop-fade {
            0%   { opacity: 1; }
            5%   { opacity: 0; }
            95%  { opacity: 0; }
            100% { opacity: 1; }
          }
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
          style={{ animation: 'hud-fade-in 1.2s ease-out forwards' }}
        >
          <PlanetScanner key={hudKey} onEnterMission={onEnterMission} />
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0 z-10 bg-black"
        style={{ animation: 'loop-fade 40s linear infinite' }}
      />
    </div>
  )
}

export default SpaceScene