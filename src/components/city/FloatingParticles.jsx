import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 2400

// Single shared geometry — tiny point sprite
const _particleGeo = (() => {
  const geo = new THREE.BufferGeometry()
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const seeds     = new Float32Array(PARTICLE_COUNT)
  const speeds    = new Float32Array(PARTICLE_COUNT)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Spread across the city volume
    positions[i * 3 + 0] = (Math.random() - 0.5) * 200
    positions[i * 3 + 1] = Math.random() * 80
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200
    seeds[i]  = Math.random()
    speeds[i] = 0.04 + Math.random() * 0.12
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aSeed',    new THREE.BufferAttribute(seeds,     1))
  geo.setAttribute('aSpeed',   new THREE.BufferAttribute(speeds,    1))
  return geo
})()

// Additive point material — particles only visible when lit from certain angles
const _particleMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uTime:     { value: 0 },
    uSize:     { value: 1.8 },
    uMaxAlpha: { value: 0.22 },
  },
  vertexShader: /* glsl */`
    attribute float aSeed;
    attribute float aSpeed;
    uniform float uTime;
    uniform float uSize;
    varying float vAlpha;

    void main() {
      // Slow float upward, wrapping within volume
      vec3 p = position;
      float drift = mod(p.y + uTime * aSpeed * 8.0, 80.0);
      p.y = drift;

      // Horizontal drift — Lissajous-ish micro wobble
      p.x += sin(uTime * aSpeed * 2.1 + aSeed * 6.28) * 0.8;
      p.z += cos(uTime * aSpeed * 1.7 + aSeed * 3.14) * 0.8;

      // Twinkle: alpha pulses per particle
      vAlpha = 0.3 + 0.7 * abs(sin(uTime * (0.4 + aSeed) + aSeed * 9.0));

      vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = uSize * (280.0 / -mvPos.z);
      gl_Position  = projectionMatrix * mvPos;
    }
  `,
  fragmentShader: /* glsl */`
    uniform float uMaxAlpha;
    varying float vAlpha;

    void main() {
      // Circular soft point
      float d = length(gl_PointCoord - 0.5) * 2.0;
      float alpha = smoothstep(1.0, 0.0, d) * vAlpha * uMaxAlpha;
      gl_FragColor = vec4(0.72, 0.84, 1.0, alpha);
    }
  `,
})

export function FloatingParticles({ maxAlpha = 0.22, size = 1.8 }) {
  const pointsRef = useRef()

  useMemo(() => {
    _particleMat.uniforms.uMaxAlpha.value = maxAlpha
    _particleMat.uniforms.uSize.value     = size
  }, [maxAlpha, size])

  useFrame(({ clock }) => {
    _particleMat.uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <points
      ref={pointsRef}
      geometry={_particleGeo}
      material={_particleMat}
      name="floating-particles"
    />
  )
}
