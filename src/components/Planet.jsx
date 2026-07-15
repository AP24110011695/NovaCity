import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { planetsData } from '../data/planets'

// ------------------------------------------------------------------
// Procedural planet — no external textures.
// Phase 2 upgrades:
//  • Richer day color (ocean blue + land green-brown)
//  • Multi-octave cloud system with shadow underside
//  • Thicker terminator glow (aurora band)
//  • Denser, warmer city lights on night side
//  • Specular ocean shimmer
//  • Improved atmosphere scattering (chromatic rim)
// ------------------------------------------------------------------

const noiseGLSL = `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x),
        f.y),
      mix(
        mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x),
        f.y),
      f.z);
  }

  float fbm(vec3 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 6; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  float fbmFast(vec3 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.0; a *= 0.5; }
    return v;
  }
`

const planetVertexShader = `
  varying vec3 vObjectNormal;
  varying vec3 vObjectPosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewPosition;

  void main() {
    vObjectNormal   = normalize(normal);
    vObjectPosition = position;
    vWorldNormal    = normalize(mat3(modelMatrix) * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition   = mvPosition.xyz;
    gl_Position     = projectionMatrix * mvPosition;
  }
`

const planetFragmentShader = `
  ${noiseGLSL}

  varying vec3 vObjectNormal;
  varying vec3 vObjectPosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewPosition;

  uniform float uTime;
  uniform float uOpacity;
  uniform vec3  uLightDir;
  uniform vec3  uOceanColor;
  uniform vec3  uLandColor;
  uniform vec3  uDesertColor;
  uniform vec3  uNightColor;
  uniform vec3  uCloudColor;
  uniform vec3  uPoleColor;
  uniform vec3  uCityLightColor;

  void main() {
    float NdotL   = dot(vWorldNormal, uLightDir);
    float dayAmt  = smoothstep(-0.22, 0.32, NdotL);

    // --- terrain mask (ocean vs land vs desert) ---
    float terrainNoise = fbm(vObjectPosition * 1.8 + vec3(42.0, 17.3, 5.1));
    float landMask     = smoothstep(0.44, 0.56, terrainNoise);
    float desertMask   = smoothstep(0.58, 0.66, terrainNoise) * landMask;

    vec3 terrain = mix(uOceanColor, uLandColor,   landMask);
         terrain = mix(terrain,     uDesertColor,  desertMask);

    // --- poles ---
    float poleFactor = smoothstep(0.60, 0.93, abs(vObjectNormal.y));
    terrain = mix(terrain, uPoleColor, poleFactor * 0.75);

    // --- specular ocean shimmer (day side only) ---
    vec3 viewDir  = normalize(-vViewPosition);
    vec3 halfDir  = normalize(uLightDir + viewDir);
    float spec    = pow(max(dot(vWorldNormal, halfDir), 0.0), 38.0);
    float oceanSpec = (1.0 - landMask) * (1.0 - poleFactor) * spec * dayAmt * 0.55;
    terrain += vec3(0.7, 0.85, 1.0) * oceanSpec;

    // --- clouds (two octaves, slightly different speed) ---
    vec3 cloudSeed1 = vObjectPosition * 1.65 + vec3(uTime * 0.011, uTime * 0.007, 0.0);
    vec3 cloudSeed2 = vObjectPosition * 2.10 + vec3(uTime * 0.009, uTime * 0.013, 0.0);
    float cloud1    = smoothstep(0.54, 0.72, fbmFast(cloudSeed1));
    float cloud2    = smoothstep(0.60, 0.76, fbmFast(cloudSeed2));
    float cloudAmt  = clamp(cloud1 + cloud2 * 0.5, 0.0, 1.0);

    // cloud shadow on day side, bright top on lit edge
    vec3 cloudShadow = terrain * 0.72;
    vec3 cloudBright = uCloudColor * (0.72 + dayAmt * 0.28);
    vec3 withClouds  = mix(terrain, mix(cloudShadow, cloudBright, dayAmt * 0.85 + 0.15), cloudAmt * (0.35 + dayAmt * 0.48));

    // --- city lights on night side ---
    float nightNoise  = fbm(vObjectPosition * 32.0);
    float cityMask    = smoothstep(0.862, 0.900, nightNoise)
                      * (1.0 - dayAmt)
                      * (1.0 - cloudAmt * 0.65)
                      * (1.0 - poleFactor);
    vec3 withLights   = withClouds + uCityLightColor * cityMask * 2.2;

    // --- terminator aurora band ---
    float terminator  = smoothstep(-0.18, 0.0, NdotL) * smoothstep(0.25, 0.06, NdotL);
    vec3 auroraColor  = vec3(0.3, 0.6, 1.0);
    withLights       += auroraColor * terminator * 0.18;

    // --- ambient bounce (dark side blue bounce from star) ---
    vec3 ambient      = vec3(0.04, 0.055, 0.10) * (1.0 - dayAmt) * 0.7;
    vec3 finalColor   = withLights * (0.18 + dayAmt * 0.92) + ambient;

    gl_FragColor = vec4(finalColor, uOpacity);
  }
`

const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vPosition;

  void main() {
    vNormal      = normalize(normalMatrix * normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 mv      = modelViewMatrix * vec4(position, 1.0);
    vPosition    = mv.xyz;
    gl_Position  = projectionMatrix * mv;
  }
`

// Chromatic atmosphere: blue-shifted rim, warmer near terminator
const atmosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vPosition;

  uniform vec3  glowColor;
  uniform float intensity;
  uniform vec3  uLightDir;

  void main() {
    vec3  viewDir     = normalize(-vPosition);
    float rim         = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.2);
    float lightFactor = smoothstep(-0.55, 0.65, dot(vWorldNormal, uLightDir));
    float scatter     = mix(0.5, 1.4, lightFactor);

    // Chromatic split: blue on dark side, slightly warm on lit side
    vec3 nightAtmo = vec3(0.18, 0.32, 0.80);
    vec3 dayAtmo   = glowColor;
    vec3 chromatic = mix(nightAtmo, dayAtmo, lightFactor);

    gl_FragColor = vec4(chromatic, rim * intensity * scatter);
  }
`

// ------------------------------------------------------------------
// SmallPlanet — background orbital body (no ref needed externally)
// ------------------------------------------------------------------
const smallPlanetVert = `
  varying vec3 vN;
  varying vec3 vPos;
  varying vec3 vWN;
  varying vec3 vView;
  void main() {
    vN   = normalize(normal);
    vPos = position;
    vWN  = normalize(mat3(modelMatrix) * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`

const smallPlanetFrag = `
  ${noiseGLSL}
  varying vec3 vN;
  varying vec3 vPos;
  varying vec3 vWN;
  varying vec3 vView;
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3  uLightDir;
  uniform vec3  uColor1;
  uniform vec3  uColor2;
  uniform vec3  uColor3;

  void main() {
    float NdotL  = dot(vWN, uLightDir);
    float dayAmt = smoothstep(-0.2, 0.35, NdotL);

    float n1 = fbm(vPos * 2.1);
    float n2 = fbm(vPos * 3.8 + vec3(5.1, 2.3, 1.7));
    float mask1 = smoothstep(0.42, 0.58, n1);
    float mask2 = smoothstep(0.50, 0.64, n2) * mask1;

    vec3 col = mix(uColor1, uColor2, mask1);
         col = mix(col, uColor3, mask2 * 0.7);

    float poles = smoothstep(0.62, 0.92, abs(vN.y));
    col = mix(col, vec3(0.82, 0.88, 0.95), poles * 0.6);

    // cloud layer
    vec3 cSeed = vPos * 2.0 + vec3(uTime * 0.009, 0.0, uTime * 0.006);
    float clouds = smoothstep(0.56, 0.72, fbmFast(cSeed));
    col = mix(col, vec3(0.78, 0.82, 0.88), clouds * (0.25 + dayAmt * 0.4));

    vec3 ambient = vec3(0.04, 0.05, 0.09) * (1.0 - dayAmt);
    col = col * (0.15 + dayAmt * 0.9) + ambient;

    gl_FragColor = vec4(col, uOpacity);
  }
`

const SmallPlanet = ({ planetId, orbitRadius, orbitSpeed, orbitPhase, size, color1, color2, color3, tilt = 0, lightDir, onPlanetSelect, selectedPlanetId }) => {
  const groupRef    = useRef()
  const meshRef     = useRef()
  const atmoRef     = useRef()
  const orbitLineRef = useRef()
  const orbitParticlesRef = useRef()
  const [hovered, setHovered] = useState(false)
  const planet = planetsData[planetId]
  const isLocked = selectedPlanetId && selectedPlanetId !== planetId

  const particleCount = 5
  const particlesPositions = useMemo(() => new Float32Array(particleCount * 3), [])

  const uniforms = useMemo(() => ({
    uTime:     { value: 0 },
    uOpacity:  { value: 0 },
    uLightDir: { value: lightDir },
    uColor1:   { value: new THREE.Color(color1) },
    uColor2:   { value: new THREE.Color(color2) },
    uColor3:   { value: new THREE.Color(color3) },
  }), [lightDir, color1, color2, color3])

  const atmoUniforms = useMemo(() => ({
    glowColor:  { value: new THREE.Color('#4F7CFF') },
    intensity:  { value: 0.28 },
    uLightDir:  { value: lightDir },
  }), [lightDir])

  const ringCount = 180
  const ringPositions = useMemo(() => {
    const pos = new Float32Array(ringCount * 3)
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2
      pos[i*3] = Math.cos(angle) * orbitRadius
      pos[i*3+1] = Math.sin(angle * 0.4 + tilt) * orbitRadius * 0.22
      pos[i*3+2] = Math.sin(angle) * orbitRadius - 6
    }
    return pos
  }, [orbitRadius, tilt])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    uniforms.uTime.value += 0.016
    // Fade in slowly
    uniforms.uOpacity.value = Math.min(uniforms.uOpacity.value + 0.004, 0.92)

    // Orbit
    if (groupRef.current) {
      const angle = t * orbitSpeed + orbitPhase
      groupRef.current.position.x = Math.cos(angle) * orbitRadius
      groupRef.current.position.y = Math.sin(angle * 0.4 + tilt) * orbitRadius * 0.22
      groupRef.current.position.z = Math.sin(angle) * orbitRadius - 6
    }
    // Slow self-rotation and hover effects
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003
      const pulse = hovered ? Math.sin(t * 5) * 0.02 : 0
      const targetScale = hovered ? 1.05 + pulse : 1
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
    }
    if (atmoRef.current) {
      const pulse = hovered ? Math.sin(t * 5) * 0.02 : 0
      const targetScale = hovered ? 1.1 + pulse : 1.06
      atmoRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
      atmoUniforms.intensity.value = THREE.MathUtils.lerp(atmoUniforms.intensity.value, hovered ? 0.45 : 0.28, 0.1)
    }
    if (orbitLineRef.current) {
      orbitLineRef.current.rotation.y += 0.001
    }
    if (orbitParticlesRef.current) {
      for (let i = 0; i < particleCount; i++) {
        const angle = t * orbitSpeed * 4 + i * (Math.PI * 2 / particleCount)
        particlesPositions[i*3] = Math.cos(angle) * orbitRadius
        particlesPositions[i*3+1] = Math.sin(angle * 0.4 + tilt) * orbitRadius * 0.22
        particlesPositions[i*3+2] = Math.sin(angle) * orbitRadius - 6
      }
      orbitParticlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <>
      <points ref={orbitLineRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={ringCount} array={ringPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#8ab4ff" size={0.06} transparent opacity={0.25} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      <points ref={orbitParticlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particleCount} array={particlesPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#ffffff" size={0.12} transparent opacity={0.8} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      <group ref={groupRef}>
        <mesh 
          ref={meshRef}
          onClick={(e) => { e.stopPropagation(); if (!isLocked) onPlanetSelect?.(planet, groupRef.current) }}
          onPointerOver={(e) => { e.stopPropagation(); if (!isLocked) { setHovered(true); document.body.style.cursor = 'pointer' } }}
          onPointerOut={(e) => { e.stopPropagation(); if (!isLocked) { setHovered(false); document.body.style.cursor = 'auto' } }}
        >
          <sphereGeometry args={[size, 96, 96]} />
          <shaderMaterial
            vertexShader={smallPlanetVert}
            fragmentShader={smallPlanetFrag}
            uniforms={uniforms}
            transparent
          />
        </mesh>
        <mesh ref={atmoRef} scale={1.06} pointerEvents="none">
          <sphereGeometry args={[size, 48, 48]} />
          <shaderMaterial
            vertexShader={atmosphereVertexShader}
            fragmentShader={atmosphereFragmentShader}
            uniforms={atmoUniforms}
            transparent
            blending={THREE.AdditiveBlending}
            side={THREE.FrontSide}
            depthWrite={false}
          />
        </mesh>
        
        {hovered && (
          <Html position={[0, size * 1.5, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="flex flex-col items-center">
              <div className="whitespace-nowrap rounded border border-blue-500/30 bg-black/60 px-2 py-1 text-[10px] font-mono tracking-widest text-blue-200 backdrop-blur">
                {planet?.name}
              </div>
              <div className="mt-1 h-4 w-[1px] bg-gradient-to-b from-blue-500/50 to-transparent" />
            </div>
          </Html>
        )}
      </group>
    </>
  )
}

// ------------------------------------------------------------------
// Main Planet (forwardRef — controlled by SpaceScene Timeline)
// ------------------------------------------------------------------
const RING_LIGHT_COUNT = 32

const Planet = forwardRef(({ position = [0, 0, -6], radius = 2.4, onPlanetSelect, selectedPlanetId }, ref) => {
  const planetGroupRef  = useRef()
  const planetMeshRef   = useRef()
  const planetMaterialRef = useRef()
  const atmosphereMeshRef = useRef()
  const beaconRef       = useRef()
  const ringGroupRef    = useRef()
  const ringMeshRef     = useRef()
  const ringLightsRef   = useRef()
  
  const [hovered, setHovered] = useState(false)
  const planet = planetsData['nova-prime']
  const isLocked = selectedPlanetId && selectedPlanetId !== planet.id

  const lightDir = useMemo(() => new THREE.Vector3(-0.6, 0.35, 0.55).normalize(), [])

  const planetUniforms = useMemo(() => ({
    uTime:          { value: 0 },
    uOpacity:       { value: 0 },
    uLightDir:      { value: lightDir },
    uOceanColor:    { value: new THREE.Color(0.05, 0.12, 0.28) },
    uLandColor:     { value: new THREE.Color(0.13, 0.21, 0.10) },
    uDesertColor:   { value: new THREE.Color(0.32, 0.22, 0.12) },
    uNightColor:    { value: new THREE.Color(0.02, 0.02, 0.035) },
    uCloudColor:    { value: new THREE.Color(0.72, 0.76, 0.84) },
    uPoleColor:     { value: new THREE.Color(0.72, 0.79, 0.92) },
    uCityLightColor:{ value: new THREE.Color(1.0, 0.94, 0.82) },
  }), [lightDir])

  const atmosphereUniforms = useMemo(() => ({
    glowColor: { value: new THREE.Color('#4F7CFF') },
    intensity: { value: 0.2 },
    uLightDir: { value: lightDir },
  }), [lightDir])

  const ringRadius = radius * 2.6

  const ringLightAngles = useMemo(
    () => Array.from({ length: RING_LIGHT_COUNT }, (_, i) => (i / RING_LIGHT_COUNT) * Math.PI * 2),
    []
  )

  useEffect(() => {
    if (!ringLightsRef.current) return
    const dummy = new THREE.Object3D()
    ringLightAngles.forEach((angle, i) => {
      dummy.position.set(Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, 0)
      dummy.updateMatrix()
      ringLightsRef.current.setMatrixAt(i, dummy.matrix)
    })
    ringLightsRef.current.instanceMatrix.needsUpdate = true
  }, [ringLightAngles, ringRadius])

  useFrame((state, delta) => {
    if (planetGroupRef.current) {
      planetGroupRef.current.rotation.y += delta * 0.006
      const pulse = hovered ? Math.sin(state.clock.getElapsedTime() * 4) * 0.015 : 0
      const targetScale = hovered ? 1.02 + pulse : 1
      planetGroupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
    }
    if (atmosphereUniforms) {
      atmosphereUniforms.intensity.value = THREE.MathUtils.lerp(atmosphereUniforms.intensity.value, hovered ? 0.35 : 0.2, 0.1)
    }
    planetUniforms.uTime.value += delta
  })

  useImperativeHandle(ref, () => ({
    beaconMaterial:     beaconRef.current?.material,
    planetMaterial:     planetMaterialRef.current,
    atmosphereMaterial: atmosphereMeshRef.current?.material,
    atmosphereUniforms,
    ringMesh:           ringMeshRef.current,
    ringLights:         ringLightsRef.current,
    planetGroup:        planetGroupRef.current,
  }), [atmosphereUniforms])

  return (
    <group position={position}>
      <mesh ref={beaconRef}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color="#4F7CFF" transparent opacity={0} toneMapped={false} />
      </mesh>

      {/* Key light from upper-left */}
      <pointLight position={[-4, 1.5, 2]}  color="#4F7CFF" intensity={16} distance={24} decay={2} />
      {/* Warm fill from right */}
      <pointLight position={[3, -1, 4]}    color="#ffffff" intensity={1.4} distance={18} decay={2} />
      {/* Rim light from behind */}
      <pointLight position={[0, 0, -14]}   color="#223366" intensity={8}  distance={20} decay={2} />

      <group ref={planetGroupRef}>
        <mesh 
          ref={planetMeshRef}
          onClick={(e) => { e.stopPropagation(); if (!isLocked) onPlanetSelect?.(planet, null) }}
          onPointerOver={(e) => { e.stopPropagation(); if (!isLocked) { setHovered(true); document.body.style.cursor = 'pointer' } }}
          onPointerOut={(e) => { e.stopPropagation(); if (!isLocked) { setHovered(false); document.body.style.cursor = 'auto' } }}
        >
          <sphereGeometry args={[radius, 128, 128]} />
          <shaderMaterial
            ref={planetMaterialRef}
            vertexShader={planetVertexShader}
            fragmentShader={planetFragmentShader}
            uniforms={planetUniforms}
            transparent
          />
        </mesh>

        <mesh ref={atmosphereMeshRef} scale={1.062} pointerEvents="none">
          <sphereGeometry args={[radius, 96, 96]} />
          <shaderMaterial
            vertexShader={atmosphereVertexShader}
            fragmentShader={atmosphereFragmentShader}
            uniforms={atmosphereUniforms}
            transparent
            blending={THREE.AdditiveBlending}
            side={THREE.FrontSide}
            depthWrite={false}
          />
        </mesh>
        
        {hovered && (
          <Html position={[0, radius * 1.25, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="flex flex-col items-center">
              <div className="whitespace-nowrap rounded border border-blue-500/30 bg-black/60 px-3 py-1.5 text-xs font-mono tracking-widest text-blue-200 backdrop-blur">
                {planet?.name}
              </div>
              <div className="mt-1 h-6 w-[1px] bg-gradient-to-b from-blue-500/50 to-transparent" />
            </div>
          </Html>
        )}
      </group>

      <group ref={ringGroupRef} rotation={[Math.PI / 2.6, 0, 0]}>
        <mesh ref={ringMeshRef}>
          <ringGeometry args={[ringRadius - 0.025, ringRadius + 0.025, 160]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent opacity={0}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>

        <instancedMesh ref={ringLightsRef} args={[null, null, RING_LIGHT_COUNT]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshBasicMaterial color="#c8e0ff" transparent opacity={0} toneMapped={false} />
        </instancedMesh>
      </group>

      {/* Secondary companion planets — in their own orbit around main planet */}
      <SmallPlanet
        planetId="obsidian"
        orbitRadius={9.5}
        orbitSpeed={0.042}
        orbitPhase={0.8}
        size={0.68}
        color1="#1a0a06"
        color2="#3d1a08"
        color3="#6b3010"
        tilt={0.3}
        lightDir={lightDir}
        onPlanetSelect={onPlanetSelect}
        selectedPlanetId={selectedPlanetId}
      />
      <SmallPlanet
        planetId="celestia"
        orbitRadius={14.5}
        orbitSpeed={0.022}
        orbitPhase={3.2}
        size={1.05}
        color1="#060e1a"
        color2="#0d2040"
        color3="#1a3a5c"
        tilt={-0.2}
        lightDir={lightDir}
        onPlanetSelect={onPlanetSelect}
        selectedPlanetId={selectedPlanetId}
      />
    </group>
  )
})

Planet.displayName = 'Planet'

export default Planet