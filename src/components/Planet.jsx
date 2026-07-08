import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ------------------------------------------------------------------
// Procedural planet — no external textures. Surface variation, moving
// clouds, night-side city lights, poles, and terminator are all
// computed in-shader from noise, driven by uTime.
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
        mix(hash(i + vec3(0.0,0.0,0.0)), hash(i + vec3(1.0,0.0,0.0)), f.x),
        mix(hash(i + vec3(0.0,1.0,0.0)), hash(i + vec3(1.0,1.0,0.0)), f.x),
        f.y),
      mix(
        mix(hash(i + vec3(0.0,0.0,1.0)), hash(i + vec3(1.0,0.0,1.0)), f.x),
        mix(hash(i + vec3(0.0,1.0,1.0)), hash(i + vec3(1.0,1.0,1.0)), f.x),
        f.y),
      f.z);
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }
`

const planetVertexShader = `
  varying vec3 vObjectNormal;
  varying vec3 vObjectPosition;
  varying vec3 vWorldNormal;
  varying vec3 vViewPosition;

  void main() {
    vObjectNormal = normalize(normal);
    vObjectPosition = position;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
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
  uniform vec3 uLightDir;
  uniform vec3 uDayColor;
  uniform vec3 uNightColor;
  uniform vec3 uCloudColor;
  uniform vec3 uPoleColor;
  uniform vec3 uCityLightColor;

  void main() {
    float NdotL = dot(vWorldNormal, uLightDir);
    float dayAmount = smoothstep(-0.18, 0.28, NdotL);

    float surfaceNoise = fbm(vObjectPosition * 2.2);
    vec3 baseColor = mix(uNightColor * 0.5, uDayColor, surfaceNoise * 0.5 + 0.5);

    float poleFactor = smoothstep(0.66, 0.95, abs(vObjectNormal.y));
    baseColor = mix(baseColor, uPoleColor, poleFactor * 0.5);

    vec3 cloudCoord = vObjectPosition * 1.7 + vec3(uTime * 0.012, uTime * 0.007, 0.0);
    float cloudNoise = fbm(cloudCoord);
    float cloudAmount = smoothstep(0.56, 0.76, cloudNoise);
    vec3 withClouds = mix(baseColor, uCloudColor, cloudAmount * (0.3 + dayAmount * 0.45));

    float nightNoise = fbm(vObjectPosition * 34.0);
    float cityMask = smoothstep(0.865, 0.905, nightNoise) * (1.0 - dayAmount) * (1.0 - cloudAmount * 0.7);
    vec3 withLights = withClouds + uCityLightColor * cityMask * 1.5;

    vec3 ambientBounce = vec3(0.045, 0.06, 0.11) * (1.0 - dayAmount) * 0.5;

    vec3 finalColor = withLights * (0.22 + dayAmount * 0.9) + ambientBounce;

    gl_FragColor = vec4(finalColor, uOpacity);
  }
`

const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vPosition = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vPosition;

  uniform vec3 glowColor;
  uniform float intensity;
  uniform vec3 uLightDir;

  void main() {
    vec3 viewDir = normalize(-vPosition);
    float rim = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);

    float lightFactor = smoothstep(-0.5, 0.6, dot(vWorldNormal, uLightDir));
    float scatter = mix(0.55, 1.35, lightFactor);

    gl_FragColor = vec4(glowColor, rim * intensity * scatter);
  }
`

const RING_LIGHT_COUNT = 26

const Planet = forwardRef(({ position = [0, 0, -6], radius = 2.4 }, ref) => {
  const planetGroupRef = useRef()
  const planetMeshRef = useRef()
  const planetMaterialRef = useRef()
  const atmosphereMeshRef = useRef()
  const beaconRef = useRef()
  const ringGroupRef = useRef()
  const ringMeshRef = useRef()
  const ringLightsRef = useRef()

  const lightDir = useMemo(() => new THREE.Vector3(-0.6, 0.35, 0.55).normalize(), [])

  const planetUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uLightDir: { value: lightDir },
      uDayColor: { value: new THREE.Color(0.1, 0.11, 0.15) },
      uNightColor: { value: new THREE.Color(0.02, 0.02, 0.035) },
      uCloudColor: { value: new THREE.Color(0.58, 0.63, 0.72) },
      uPoleColor: { value: new THREE.Color(0.68, 0.75, 0.88) },
      uCityLightColor: { value: new THREE.Color(0.85, 0.89, 1.0) },
    }),
    [lightDir]
  )

  const atmosphereUniforms = useMemo(
    () => ({
      glowColor: { value: new THREE.Color('#4F7CFF') },
      intensity: { value: 0.2 },
      uLightDir: { value: lightDir },
    }),
    [lightDir]
  )

  const ringRadius = radius * 2.6

  const ringLightAngles = useMemo(
    () =>
      Array.from(
        { length: RING_LIGHT_COUNT },
        (_, i) => (i / RING_LIGHT_COUNT) * Math.PI * 2
      ),
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

  // Internal, continuous animation: rotation + cloud time. Timeline (in
  // SpaceScene) only drives crossfade opacities, never per-frame motion.
  useFrame((_, delta) => {
    if (planetGroupRef.current) {
      planetGroupRef.current.rotation.y += delta * 0.008
    }
    planetUniforms.uTime.value += delta
  })

  useImperativeHandle(
    ref,
    () => ({
      beaconMaterial: beaconRef.current?.material,
      planetMaterial: planetMaterialRef.current,
      atmosphereMaterial: atmosphereMeshRef.current?.material,
      atmosphereUniforms,
      ringMesh: ringMeshRef.current,
      ringLights: ringLightsRef.current,
    }),
    [atmosphereUniforms]
  )

  return (
    <group position={position}>
      <mesh ref={beaconRef}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color="#4F7CFF" transparent opacity={0} toneMapped={false} />
      </mesh>

      <pointLight position={[-4, 1.5, 2]} color="#4F7CFF" intensity={14} distance={22} decay={2} />
      <pointLight position={[3, -1, 4]} color="#ffffff" intensity={1.2} distance={16} decay={2} />

      <group ref={planetGroupRef}>
        <mesh ref={planetMeshRef}>
          <sphereGeometry args={[radius, 128, 128]} />
          <shaderMaterial
            ref={planetMaterialRef}
            vertexShader={planetVertexShader}
            fragmentShader={planetFragmentShader}
            uniforms={planetUniforms}
            transparent
          />
        </mesh>

        <mesh ref={atmosphereMeshRef} scale={1.055}>
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
      </group>

      <group ref={ringGroupRef} rotation={[Math.PI / 2.6, 0, 0]}>
        <mesh ref={ringMeshRef}>
          <ringGeometry args={[ringRadius - 0.025, ringRadius + 0.025, 160]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>

        <instancedMesh ref={ringLightsRef} args={[null, null, RING_LIGHT_COUNT]}>
          <sphereGeometry args={[0.032, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} toneMapped={false} />
        </instancedMesh>
      </group>
    </group>
  )
})

Planet.displayName = 'Planet'

export default Planet