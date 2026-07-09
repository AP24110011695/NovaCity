import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const cloudVertexShader = `
  attribute float aSize;
  attribute float aSpeed;
  attribute float aSeed;

  uniform float uProgress;
  uniform float uPixelRatio;

  varying float vAlpha;

  void main() {
    // Clouds rush toward the camera as uProgress increases.
    vec3 pos = position;
    pos.z += uProgress * aSpeed * 40.0;
    float wrapped = mod(pos.z + 20.0, 40.0) - 20.0;
    pos.z = wrapped;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float sizeBoost = 1.0 + uProgress * 2.2;
    gl_PointSize = aSize * uPixelRatio * sizeBoost * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    // Density ramps up with progress so the sky fills with cloud coverage.
    vAlpha = clamp(uProgress * 1.6 - aSeed * 0.3, 0.0, 1.0);
  }
`

const cloudFragmentShader = `
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    float falloff = smoothstep(0.5, 0.0, dist);
    vec3 color = mix(vec3(0.55, 0.65, 0.85), vec3(1.0), vAlpha);
    gl_FragColor = vec4(color, falloff * vAlpha * 0.85);
  }
`

/**
 * CloudLayer
 * Thin cloud particles that rush toward the camera and thicken into
 * full coverage as `progress` (0 -> 1) advances, driven imperatively
 * from the parent's camera timeline via setProgress(). No React state,
 * no re-renders — a single uniform update per frame.
 */
const CloudLayer = forwardRef((_, ref) => {
  const materialRef = useRef()
  const targetProgress = useRef(0)
  const count = 900

  const { positions, sizes, speeds, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const speeds = new Float32Array(count)
    const seeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14
      positions[i * 3 + 2] = -20 + Math.random() * 40

      sizes[i] = Math.random() * 40 + 20
      speeds[i] = Math.random() * 0.6 + 0.4
      seeds[i] = Math.random()
    }

    return { positions, sizes, speeds, seeds }
  }, [])

  useImperativeHandle(ref, () => ({
    setProgress: (value) => {
      targetProgress.current = value
    },
  }))

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uProgress.value = targetProgress.current
    }
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aSpeed" count={count} array={speeds} itemSize={1} />
        <bufferAttribute attach="attributes-aSeed" count={count} array={seeds} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={cloudVertexShader}
        fragmentShader={cloudFragmentShader}
        uniforms={{
          uProgress: { value: 0 },
          uPixelRatio: { value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 1.5) : 1 },
        }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
})

CloudLayer.displayName = 'CloudLayer'

export default CloudLayer