import { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Timing (ms) ──────────────────────────────────────────────────────────────
const T = {
  TOTAL:           9200,   // total scene duration
  ASTEROID_APPEAR:  400,   // asteroid fades in
  ASTEROID_TRAVEL: 1800,   // asteroid streaks across
  IMPACT_FLASH:    2000,   // white impact flash
  SHOCKWAVE_PEAK:  2400,   // ring shockwave max
  DESCENT_START:   2600,   // camera begins plunge
  CLOUDS_ENTER:    3800,   // first cloud layer visible
  CITY_GLOW_RISE:  5500,   // city glow starts bleeding through
  EXIT_FLASH:      8700,   // final white-out before CityReveal
}

// ─── GLSL helpers ─────────────────────────────────────────────────────────────
const GLSL_NOISE = /* glsl */`
  float _h(vec2 p){p=fract(p*vec2(127.1,311.7));p+=dot(p,p+19.19);return fract(p.x*p.y);}
  float _n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(_h(i),_h(i+vec2(1,0)),f.x),mix(_h(i+vec2(0,1)),_h(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*_n(p);p=p*2.1+vec2(1.7,9.2);a*=.48;}return v;}
`

// ─── Scene phases (seconds, matching T above) ──────────────────────────────
const PHASE_S = {
  descentStart: T.DESCENT_START / 1000,
  descentEnd:   T.EXIT_FLASH   / 1000,
  total:        T.TOTAL        / 1000,
}

// ─── Planet surface — what the camera dives toward ────────────────────────────
const PlanetSurface = ({ progressRef }) => {
  const meshRef  = useRef()
  const glowRef  = useRef()
  const craterRef = useRef()

  const glowUniforms = useMemo(() => ({
    glowColor: { value: new THREE.Color('#3a5fff') },
    intensity: { value: 0.0 },
    rimPower:  { value: 2.2 },
  }), [])

  const craterUniforms = useMemo(() => ({
    uTime:       { value: 0 },
    uProgress:   { value: 0 },
    uImpactTime: { value: T.IMPACT_FLASH / 1000 },
  }), [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const p = progressRef.current

    // Atmosphere glow intensifies as we get close
    const glowP = THREE.MathUtils.smoothstep(p, 0.25, 0.75)
    glowUniforms.intensity.value = glowP * 1.6
    glowUniforms.glowColor.value.setHSL(0.6 - glowP * 0.04, 0.9, 0.55 + glowP * 0.1)

    // Crater / shockwave effect
    craterUniforms.uTime.value     = t
    craterUniforms.uProgress.value = p
  })

  return (
    <group>
      {/* Main dark surface */}
      <mesh ref={meshRef} position={[0, 0, -18]}>
        <sphereGeometry args={[12, 80, 80]} />
        <meshStandardMaterial color="#07090f" roughness={0.97} metalness={0.03} />
      </mesh>

      {/* Atmospheric limb glow */}
      <mesh ref={glowRef} position={[0, 0, -18]} scale={1.035}>
        <sphereGeometry args={[12, 64, 64]} />
        <shaderMaterial
          vertexShader={/* glsl */`
            varying vec3 vNormal; varying vec3 vPos;
            void main(){vNormal=normalize(normalMatrix*normal);
              vec4 mv=modelViewMatrix*vec4(position,1.0);vPos=mv.xyz;
              gl_Position=projectionMatrix*mv;}
          `}
          fragmentShader={/* glsl */`
            varying vec3 vNormal; varying vec3 vPos;
            uniform vec3 glowColor; uniform float intensity; uniform float rimPower;
            void main(){
              vec3 vd=normalize(-vPos);
              float rim=pow(1.0-max(dot(vd,vNormal),0.0),rimPower);
              gl_FragColor=vec4(glowColor,rim*intensity);
            }
          `}
          uniforms={glowUniforms}
          transparent blending={THREE.AdditiveBlending}
          side={THREE.FrontSide} depthWrite={false}
        />
      </mesh>

      {/* Impact crater shockwave ring on surface */}
      <mesh ref={craterRef} position={[0.8, 0.4, -6]}>
        <ringGeometry args={[0.0, 3.5, 64]} />
        <shaderMaterial
          vertexShader={/* glsl */`
            varying vec2 vUv; void main(){vUv=uv;
              gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
          `}
          fragmentShader={/* glsl */`
            ${GLSL_NOISE}
            varying vec2 vUv;
            uniform float uTime; uniform float uProgress; uniform float uImpactTime;
            void main(){
              vec2 c=vUv-0.5; float r=length(c);
              float impactP=smoothstep(0.0,0.12,uProgress)*smoothstep(0.6,0.1,uProgress);
              float ring=smoothstep(0.0,0.05,r-0.28*impactP)*
                         smoothstep(0.0,0.05,(0.32*impactP)-r);
              float energy=fbm(c*4.0+uTime*0.4)*impactP;
              float glow=smoothstep(0.35,0.0,r)*impactP*0.3;
              vec3 col=mix(vec3(0.3,0.5,1.0),vec3(1.0,0.85,0.4),ring);
              gl_FragColor=vec4(col,(ring*0.9+energy*0.2+glow)*impactP);
            }
          `}
          uniforms={craterUniforms}
          transparent blending={THREE.AdditiveBlending} depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* City light bloom that rises from below as we descend */}
      <pointLight
        position={[0, -3, -12]}
        color="#4F7CFF"
        intensity={0}
        distance={45}
        decay={2}
        ref={(light) => {
          if (!light) return
          // update intensity from progress
          const updateLight = () => {
            const p2 = progressRef.current
            if (p2 > 0.65) {
              light.intensity = THREE.MathUtils.smoothstep(p2, 0.65, 0.92) * 22
            }
          }
          light._update = updateLight
        }}
      />
    </group>
  )
}

// ─── Volumetric Cloud Bank ────────────────────────────────────────────────────
const CloudBank = ({ progressRef }) => {
  const groupRef = useRef()
  const materials = useRef([])

  const SLAB_COUNT = 6
  const slabs = useMemo(() => {
    return Array.from({ length: SLAB_COUNT }, (_, i) => {
      const t = i / (SLAB_COUNT - 1)
      return {
        y:       -2 + i * 3.2,
        scale:   90 + i * 28,
        opacity: 0.72 - t * 0.15,
        speed:   0.55 + t * 0.28,
        driftX:  Math.cos(i * 1.37) * 0.14,
        driftZ:  Math.sin(i * 2.11) * 0.11,
        noiseOff: i * 0.41,
      }
    })
  }, [])

  const uniforms = useMemo(() => slabs.map((s, i) => ({
    uTime:     { value: 0 },
    uOpacity:  { value: 0 },
    uSpeed:    { value: s.speed },
    uDrift:    { value: new THREE.Vector2(s.driftX, s.driftZ) },
    uNoise:    { value: s.noiseOff },
    uTint:     { value: new THREE.Color(i < 3 ? '#c8d4f0' : '#8aaee0') },
  })), [slabs])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const p = progressRef.current

    // Clouds visible from 40% of descent onward
    const cloudAlpha = THREE.MathUtils.smoothstep(p, 0.35, 0.58)
    // Clouds thicken then thin as we pierce through
    const pierce = THREE.MathUtils.smoothstep(p, 0.70, 0.88)

    uniforms.forEach((u, i) => {
      const layerDelay = i * 0.06
      const layerAlpha = THREE.MathUtils.smoothstep(p, 0.35 + layerDelay, 0.58 + layerDelay)
      const opacity = layerAlpha * slabs[i].opacity * (1 - pierce * 0.9)
      u.uTime.value    = t * slabs[i].speed
      u.uOpacity.value = opacity
    })
  })

  return (
    <group ref={groupRef}>
      {slabs.map((slab, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, slab.y, -10]}
        >
          <planeGeometry args={[slab.scale, slab.scale, 32, 32]} />
          <shaderMaterial
            ref={(mat) => { if (mat) materials.current[i] = mat }}
            vertexShader={/* glsl */`
              ${GLSL_NOISE}
              uniform float uTime; uniform float uNoise;
              varying vec2 vUv; varying vec3 vWorldPos;
              void main(){
                vUv=uv;
                vec2 np=(uv-0.5)*0.6+uTime*0.003+uNoise;
                float d=(fbm(np)-0.5)*7.0;
                vec3 pos=position; pos.z+=d;
                vec4 wp=modelMatrix*vec4(pos,1.0);
                vWorldPos=wp.xyz;
                gl_Position=projectionMatrix*viewMatrix*wp;
              }
            `}
            fragmentShader={/* glsl */`
              ${GLSL_NOISE}
              uniform float uTime; uniform float uOpacity;
              uniform vec2 uDrift; uniform vec3 uTint; uniform float uNoise;
              varying vec2 vUv; varying vec3 vWorldPos;
              void main(){
                vec2 uv1=(vUv-0.5)*1.8+uDrift+vec2(uTime*0.005,uTime*0.003)+uNoise;
                vec2 uv2=(vUv-0.5)*1.1-uDrift*0.7+vec2(-uTime*0.004,uTime*0.006);
                float f1=fbm(uv1); float f2=fbm(uv2);
                float cloud=f1*0.6+f2*0.4;
                cloud=smoothstep(0.34,0.62,cloud);
                // Radial vignette
                float vig=1.0-smoothstep(0.28,0.50,length(vUv-0.5));
                cloud*=vig;
                // Lit from below — city glow bleeds up
                vec3 topCol=mix(vec3(0.90,0.93,1.0),uTint,0.12);
                vec3 botCol=mix(vec3(0.20,0.30,0.52),uTint*0.6+vec3(0.3,0.4,1.0)*0.4,0.5);
                vec3 col=gl_FrontFacing?topCol:botCol;
                float rim=smoothstep(0.04,0.22,cloud)*(1.0-smoothstep(0.22,0.55,cloud));
                col+=uTint*rim*0.22;
                gl_FragColor=vec4(col,cloud*uOpacity);
              }
            `}
            uniforms={uniforms[i]}
            transparent blending={THREE.NormalBlending}
            depthWrite={false} side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// ─── Speed Streaks — motion blur illusion ────────────────────────────────────
const SpeedStreaks = ({ progressRef }) => {
  const meshRef = useRef()
  const COUNT = 80

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const seeds     = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      const angle  = Math.random() * Math.PI * 2
      const radius = 1.5 + Math.random() * 4.5
      positions[i * 3]     = Math.cos(angle) * radius
      positions[i * 3 + 1] = Math.sin(angle) * radius
      positions[i * 3 + 2] = -2 - Math.random() * 12
      seeds[i] = Math.random()
    }
    return { positions, seeds }
  }, [])

  const matRef = useRef()

  useFrame(({ clock }) => {
    const p = progressRef.current
    // Streaks appear during mid-descent, peak intensity, fade out as clouds arrive
    const streakAlpha = THREE.MathUtils.smoothstep(p, 0.18, 0.38) *
                        (1 - THREE.MathUtils.smoothstep(p, 0.55, 0.75))
    if (matRef.current) {
      matRef.current.uniforms.uAlpha.value = streakAlpha
      matRef.current.uniforms.uSpeed.value = 0.5 + p * 3.5
      matRef.current.uniforms.uTime.value  = clock.getElapsedTime()
    }
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={COUNT} itemSize={3} />
        <bufferAttribute attach="attributes-aSeed"    array={seeds}     count={COUNT} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={/* glsl */`
          attribute float aSeed;
          uniform float uTime; uniform float uSpeed; uniform float uAlpha;
          varying float vAlpha; varying float vSeed;
          void main(){
            vAlpha=uAlpha; vSeed=aSeed;
            vec3 p=position;
            // Particles rush toward camera along Z
            p.z=mod(p.z+uTime*uSpeed*6.0*(0.6+aSeed*0.8),18.0)-14.0;
            gl_PointSize=1.0+(280.0/(-( projectionMatrix*modelViewMatrix*vec4(p,1.0)).z));
            gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
          }
        `}
        fragmentShader={/* glsl */`
          varying float vAlpha; varying float vSeed;
          void main(){
            float d=length(gl_PointCoord-0.5)*2.0;
            float a=smoothstep(1.0,0.0,d)*vAlpha*(0.4+vSeed*0.5);
            gl_FragColor=vec4(0.78,0.87,1.0,a);
          }
        `}
        uniforms={{
          uTime:  { value: 0 },
          uAlpha: { value: 0 },
          uSpeed: { value: 1 },
        }}
        transparent blending={THREE.AdditiveBlending} depthWrite={false}
      />
    </points>
  )
}

// ─── Atmospheric Particles — ember glow near impact ──────────────────────────
const ImpactDebris = ({ progressRef }) => {
  const COUNT = 200
  const meshRef = useRef()
  const matRef  = useRef()

  const { pos, vel } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const vel = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2
      const r     = Math.random() * 2.5
      pos[i*3]   = Math.cos(angle) * r + 0.8
      pos[i*3+1] = Math.sin(angle) * r + 0.4
      pos[i*3+2] = -3 - Math.random() * 4
      vel[i*3]   = (Math.random() - 0.5) * 0.04
      vel[i*3+1] = (Math.random() - 0.5) * 0.04
      vel[i*3+2] = (Math.random() - 0.5) * 0.02
    }
    return { pos, vel }
  }, [])

  useFrame(({ clock }) => {
    const p  = progressRef.current
    // Only visible briefly around impact
    const visible = THREE.MathUtils.smoothstep(p, 0.08, 0.18) *
                    (1 - THREE.MathUtils.smoothstep(p, 0.32, 0.50))
    if (matRef.current) {
      matRef.current.uniforms.uAlpha.value = visible
      matRef.current.uniforms.uTime.value  = clock.getElapsedTime()
    }
  })

  return (
    <points ref={meshRef} geometry={(() => {
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(pos.slice(), 3))
      return g
    })()}>
      <shaderMaterial
        ref={matRef}
        vertexShader={/* glsl */`
          uniform float uTime; varying float vY;
          void main(){
            vec3 p=position;
            p.y+=mod(uTime*0.3+position.y*0.4,4.0)*0.6;
            vY=p.y;
            gl_PointSize=2.0;
            gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
          }
        `}
        fragmentShader={/* glsl */`
          uniform float uAlpha; varying float vY;
          void main(){
            float d=length(gl_PointCoord-0.5)*2.0;
            vec3 col=mix(vec3(1.0,0.65,0.2),vec3(0.4,0.6,1.0),smoothstep(0.0,2.0,vY));
            gl_FragColor=vec4(col,smoothstep(1.0,0.0,d)*uAlpha*0.8);
          }
        `}
        uniforms={{ uTime: { value: 0 }, uAlpha: { value: 0 } }}
        transparent blending={THREE.AdditiveBlending} depthWrite={false}
      />
    </points>
  )
}

// ─── Shockwave Ring ───────────────────────────────────────────────────────────
const ShockwaveRing = ({ progressRef }) => {
  const matRef = useRef()

  useFrame(() => {
    const p = progressRef.current
    if (!matRef.current) return
    const ring = THREE.MathUtils.smoothstep(p, 0.07, 0.14) *
                 (1 - THREE.MathUtils.smoothstep(p, 0.14, 0.30))
    matRef.current.uniforms.uProgress.value = ring
    matRef.current.uniforms.uRadius.value   = 0.05 + ring * 2.8
  })

  return (
    <mesh position={[0.8, 0.4, -5]} rotation={[0.3, 0.1, 0]}>
      <ringGeometry args={[0, 4.5, 96]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={/* glsl */`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
        fragmentShader={/* glsl */`
          varying vec2 vUv;
          uniform float uProgress; uniform float uRadius;
          void main(){
            vec2 c=vUv-0.5; float r=length(c)*9.0;
            float ring=smoothstep(0.0,0.12,r-uRadius+0.15)*smoothstep(0.0,0.12,uRadius+0.02-r);
            vec3 col=mix(vec3(0.5,0.7,1.0),vec3(1.0,0.9,0.5),smoothstep(0.5,1.5,r));
            gl_FragColor=vec4(col,ring*uProgress*0.85);
          }
        `}
        uniforms={{ uProgress: { value: 0 }, uRadius: { value: 0 } }}
        transparent blending={THREE.AdditiveBlending} depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ─── Descent Camera ───────────────────────────────────────────────────────────
const DescentCamera = ({ progressRef }) => {
  useFrame(({ clock, camera }) => {
    const rawT = clock.getElapsedTime()
    const p    = progressRef.current

    const ds = PHASE_S.descentStart
    const de = PHASE_S.descentEnd
    const dp = THREE.MathUtils.clamp((rawT - ds) / (de - ds), 0, 1)

    // Ease-in-cubic then ease-off near the end so it doesn't snap
    const eased = dp < 0.8
      ? Math.pow(dp / 0.8, 2.6) * 0.88
      : 0.88 + (dp - 0.8) / 0.2 * 0.12

    camera.position.z = THREE.MathUtils.lerp(11, -8, eased)

    // Camera shake — ramps up mid-descent, eases off before flash
    const shakeEnvelope = THREE.MathUtils.smoothstep(dp, 0.12, 0.55) *
                          (1 - THREE.MathUtils.smoothstep(dp, 0.80, 0.95))
    const shakeAmt  = shakeEnvelope * 0.12
    const highFreq  = shakeAmt * 0.5

    camera.position.x =
      Math.sin(rawT * 11.3) * shakeAmt +
      Math.sin(rawT * 23.7 + 1.1) * highFreq +
      Math.sin(rawT * 2.1) * 0.018

    camera.position.y =
      Math.cos(rawT * 13.7) * shakeAmt * 0.85 +
      Math.sin(rawT * 31.1 + 0.4) * highFreq * 0.7 +
      Math.sin(rawT * 1.7 + 0.7) * 0.014

    // Roll shake
    camera.rotation.z =
      Math.sin(rawT * 8.9) * shakeAmt * 0.25 +
      Math.sin(rawT * 1.4) * 0.004

    camera.lookAt(0, 0, -18)
  })
  return null
}

// ─── Star background — fades out as we enter atmosphere ──────────────────────
const DescentStars = ({ progressRef }) => {
  const matRef = useRef()
  const COUNT  = 2800

  const { pos, sizes } = useMemo(() => {
    const pos   = new Float32Array(COUNT * 3)
    const sizes = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      const r = 50 + Math.random() * 30
      const t = Math.random() * Math.PI * 2
      const ph = Math.acos(2 * Math.random() - 1)
      pos[i*3]   = r * Math.sin(ph) * Math.cos(t)
      pos[i*3+1] = r * Math.sin(ph) * Math.sin(t)
      pos[i*3+2] = r * Math.cos(ph)
      sizes[i] = 0.5 + Math.random() * 1.4
    }
    return { pos, sizes }
  }, [])

  useFrame(() => {
    const p = progressRef.current
    if (matRef.current) {
      matRef.current.uniforms.uAlpha.value =
        1 - THREE.MathUtils.smoothstep(p, 0.18, 0.55)
    }
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={pos}   count={COUNT} itemSize={3} />
        <bufferAttribute attach="attributes-aSize"    array={sizes} count={COUNT} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={/* glsl */`
          attribute float aSize;
          uniform float uAlpha;
          varying float vA;
          void main(){
            vA=uAlpha;
            vec4 mv=modelViewMatrix*vec4(position,1.0);
            gl_PointSize=aSize*(200.0/-mv.z);
            gl_Position=projectionMatrix*mv;
          }
        `}
        fragmentShader={/* glsl */`
          varying float vA;
          void main(){
            float d=length(gl_PointCoord-0.5)*2.0;
            gl_FragColor=vec4(1.0,1.0,1.0,smoothstep(1.0,0.0,d)*vA*0.88);
          }
        `}
        uniforms={{ uAlpha: { value: 1 } }}
        transparent blending={THREE.AdditiveBlending} depthWrite={false}
      />
    </points>
  )
}

// ─── Atmospheric scattering tint overlay (CSS layer) ─────────────────────────
const ScatteringOverlay = ({ progress }) => {
  // Blue-orange-white: space → re-entry plasma → clouds → city glow
  const opacity    = Math.max(0, Math.min(1, (progress - 0.12) / 0.25))
  const isEntryHeat = progress > 0.22 && progress < 0.42
  const isCityGlow  = progress > 0.70

  const bg = isEntryHeat
    ? `radial-gradient(ellipse at 50% 50%, rgba(255,120,30,${opacity * 0.32}), rgba(255,60,0,${opacity * 0.18}) 40%, transparent 70%)`
    : isCityGlow
    ? `radial-gradient(ellipse at 50% 60%, rgba(79,124,255,${(progress - 0.70) * 0.55}), transparent 65%)`
    : `radial-gradient(ellipse at 50% 50%, rgba(30,60,180,${opacity * 0.22}), transparent 70%)`

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      style={{ background: bg, transition: 'background 0.4s ease' }}
    />
  )
}

// ─── HUD text ─────────────────────────────────────────────────────────────────
const HUD_LINES = [
  { text: 'IMPACT DETECTED — NOVA CITY COORDINATES CONFIRMED', at: 2100, hold: 1400 },
  { text: 'INITIATING ATMOSPHERIC ENTRY SEQUENCE',              at: 3100, hold: 1300 },
  { text: 'HULL TEMPERATURE: CRITICAL — HOLD COURSE',           at: 4400, hold: 1400 },
  { text: 'BREAKING THROUGH CLOUD LAYER — DESCENT NOMINAL',     at: 5800, hold: 1500 },
  { text: 'NOVA CITY APPROACH VECTOR LOCKED',                   at: 7200, hold: 1200 },
]

const HUDText = () => {
  const [activeIdx, setActiveIdx] = useState(null)

  useEffect(() => {
    const timers = []
    HUD_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setActiveIdx(i), line.at))
      timers.push(setTimeout(() => setActiveIdx(prev => prev === i ? null : prev), line.at + line.hold))
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="pointer-events-none absolute bottom-14 left-1/2 z-20 -translate-x-1/2 text-center">
      <style>{`
        @keyframes hud-in  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes hud-out { from{opacity:1} to{opacity:0} }
      `}</style>
      {HUD_LINES.map((line, i) => (
        <p
          key={line.text}
          className="text-[10px] font-light tracking-[0.38em] text-white/70"
          style={{
            display: activeIdx === i ? 'block' : 'none',
            animation: 'hud-in 0.7s ease-out forwards',
            textShadow: '0 0 12px rgba(79,124,255,0.6)',
          }}
        >
          {line.text}
        </p>
      ))}
    </div>
  )
}

// ─── Canvas scene ─────────────────────────────────────────────────────────────
const DescentScene = ({ progressRef }) => (
  <>
    <color attach="background" args={['#020308']} />
    <fog attach="fog" args={['#080d18', 6, 32]} />
    <ambientLight intensity={0.06} color="#4060ff" />

    <DescentStars     progressRef={progressRef} />
    <PlanetSurface    progressRef={progressRef} />
    <ShockwaveRing    progressRef={progressRef} />
    <ImpactDebris     progressRef={progressRef} />
    <CloudBank        progressRef={progressRef} />
    <SpeedStreaks     progressRef={progressRef} />
    <DescentCamera    progressRef={progressRef} />
  </>
)

// ─── Main component ───────────────────────────────────────────────────────────
const AtmosphereTransition = ({ onComplete }) => {
  const [progress, setProgress] = useState(0)
  const progressRef = useRef(0)   // mutable, no re-render on write from rAF

  // RAF-driven progress — drives all visual layers
  useEffect(() => {
    let start = null
    let raf   = null
    const TOTAL = T.TOTAL

    const tick = (now) => {
      if (!start) start = now
      const elapsed = now - start
      const p = Math.min(elapsed / TOTAL, 1)
      progressRef.current = p

      // Only re-render at key thresholds to keep React out of the hot path
      setProgress(Math.round(p * 40) / 40)

      if (p < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        onComplete?.()
      }
    }

    raf = requestAnimationFrame(tick)
    return () => { if (raf) cancelAnimationFrame(raf) }
  }, [onComplete])

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#020308]">
      <style>{`
        @keyframes atm-brightness {
          0%,55%{opacity:0} 78%{opacity:0.28} 100%{opacity:0.55}
        }
        @keyframes atm-exit-flash {
          0%,91%{opacity:0} 95%{opacity:1} 100%{opacity:1}
        }
        @keyframes atm-vignette-in {
          0%{opacity:0} 30%{opacity:1}
        }
        @keyframes asteroid-streak {
          0%   {opacity:0;  transform:translate(-60vw,-30vh) rotate(-38deg) scaleX(0.2)}
          8%   {opacity:1;}
          22%  {opacity:0.9;transform:translate(0,0) rotate(-38deg) scaleX(1)}
          30%  {opacity:0;  transform:translate(30vw,15vh) rotate(-38deg) scaleX(1.4)}
          100% {opacity:0;}
        }
        @keyframes impact-flash {
          0%,17%{opacity:0} 21%{opacity:1} 27%{opacity:0} 100%{opacity:0}
        }
        @keyframes heat-warp {
          0%{opacity:0} 22%{opacity:0} 42%{opacity:0.6} 75%{opacity:0.85} 90%{opacity:0.4} 100%{opacity:0}
        }
        @keyframes city-glow-rise {
          0%,60%{opacity:0} 80%{opacity:0.45} 90%{opacity:0.75} 100%{opacity:0}
        }
      `}</style>

      {/* Three.js canvas */}
      <Canvas
        camera={{ position: [0, 0, 11], fov: 58 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        className="absolute inset-0"
      >
        <DescentScene progressRef={progressRef} />
      </Canvas>

      {/* Asteroid streak — pure CSS element */}
      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{ animation: `asteroid-streak ${T.TOTAL}ms linear forwards` }}
      >
        <div
          style={{
            position: 'absolute',
            top: '42%',
            left: '50%',
            width: '140px',
            height: '3px',
            background: 'linear-gradient(90deg, transparent, rgba(255,200,80,0.9), rgba(255,255,255,1) 90%, transparent)',
            borderRadius: '50%',
            filter: 'blur(1px)',
            boxShadow: '0 0 18px 4px rgba(255,180,60,0.7), 0 0 40px 10px rgba(255,100,20,0.35)',
          }}
        />
      </div>

      {/* Impact white flash */}
      <div
        className="pointer-events-none absolute inset-0 z-[8] bg-white"
        style={{ animation: `impact-flash ${T.TOTAL}ms linear forwards` }}
      />

      {/* Atmospheric scattering — reactive to progress */}
      <ScatteringOverlay progress={progress} />

      {/* Heat distortion — SVG filter */}
      <svg className="absolute h-0 w-0">
        <filter id="novaDescent">
          <feTurbulence type="turbulence" baseFrequency="0.009 0.025" numOctaves="3" seed="14" result="noise">
            <animate attributeName="baseFrequency" dur="5s"
              values="0.009 0.025;0.016 0.040;0.009 0.025" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div
        className="pointer-events-none absolute inset-0 z-[11]"
        style={{
          backdropFilter: 'url(#novaDescent) blur(0.3px)',
          WebkitBackdropFilter: 'blur(0.3px)',
          animation: `heat-warp ${T.TOTAL}ms ease-in-out forwards`,
        }}
      />

      {/* City glow bleed-through */}
      <div
        className="pointer-events-none absolute inset-0 z-[12]"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 70%, rgba(79,124,255,0.6), rgba(20,40,120,0.3) 50%, transparent 75%)',
          animation: `city-glow-rise ${T.TOTAL}ms ease-in-out forwards`,
        }}
      />

      {/* Ambient brightness rise */}
      <div
        className="pointer-events-none absolute inset-0 z-[13] bg-[#c8d4ff]"
        style={{ animation: `atm-brightness ${T.TOTAL}ms ease-in forwards`, mixBlendMode: 'screen' }}
      />

      {/* Edge vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-[14]"
        style={{
          background: 'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 30%, rgba(0,0,0,0.75) 100%)',
          animation: 'atm-vignette-in 1.2s ease-out forwards',
        }}
      />

      {/* HUD text */}
      <HUDText />

      {/* Final white-out exit flash */}
      <div
        className="pointer-events-none absolute inset-0 z-[20] bg-white"
        style={{ animation: `atm-exit-flash ${T.TOTAL}ms linear forwards` }}
      />
    </div>
  )
}

export default AtmosphereTransition
