import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Drifting ground fog — custom shader plane, no library dependency
const _fogMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  uniforms: {
    uTime:    { value: 0 },
    uColor:   { value: new THREE.Color(0x8aadff) },
    uDensity: { value: 0.18 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform float uTime;
    uniform vec3  uColor;
    uniform float uDensity;
    varying vec2  vUv;

    // 2D value noise
    float hash(vec2 p) {
      p = fract(p * vec2(127.1, 311.7));
      p += dot(p, p + 19.19);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f); // smoothstep
      return mix(
        mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), f.x),
        mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
        f.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p  = p * 2.1 + vec2(1.7, 9.2);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // Two fog layers drifting in different directions and speeds
      vec2 uv1 = vUv * 3.0 + vec2(uTime * 0.012,  uTime * 0.007);
      vec2 uv2 = vUv * 2.2 + vec2(-uTime * 0.009, uTime * 0.013);

      float f1 = fbm(uv1);
      float f2 = fbm(uv2);
      float fog = (f1 * 0.6 + f2 * 0.4);

      // Radial fade — thicker in centre, transparent at edges
      vec2 c = vUv - 0.5;
      float radial = 1.0 - smoothstep(0.2, 0.5, length(c));

      float alpha = fog * radial * uDensity;
      gl_FragColor = vec4(uColor, alpha);
    }
  `,
})

export function AtmosphericFog({ radius = 220, groundY = 0, density = 0.18 }) {
  const meshRef = useRef()

  useMemo(() => {
    _fogMat.uniforms.uDensity.value = density
  }, [density])

  useFrame(({ clock }) => {
    _fogMat.uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, groundY + 0.1, 0]}
      name="atmospheric-fog"
    >
      <planeGeometry args={[radius, radius, 1, 1]} />
      <primitive object={_fogMat} attach="material" />
    </mesh>
  )
}
