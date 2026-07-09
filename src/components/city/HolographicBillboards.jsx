import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const BILLBOARD_COUNT = 28

const planeGeo = new THREE.PlaneGeometry(1, 1)

const billboardMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
  uniforms: {
    uTime: { value: 0 },
  },
  vertexShader: `
    attribute float aFlickerSeed;
    attribute float aFlickerSpeed;
    attribute float aBrightness;

    varying float vFlickerSeed;
    varying float vFlickerSpeed;
    varying float vBrightness;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vFlickerSeed = aFlickerSeed;
      vFlickerSpeed = aFlickerSpeed;
      vBrightness = aBrightness;

      gl_Position =
        projectionMatrix *
        modelViewMatrix *
        instanceMatrix *
        vec4(position,1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;

    varying float vFlickerSeed;
    varying float vFlickerSpeed;
    varying float vBrightness;
    varying vec2 vUv;

    float rand(float n){
      return fract(sin(n)*43758.5453);
    }

    void main(){

      float gridH = step(0.96, fract(vUv.y*14.0));
      float gridV = step(0.97, fract(vUv.x*6.0));
      float grid = max(gridH,gridV);

      float scroll = fract(vUv.y-uTime*0.04*vFlickerSpeed);

      float scanBar =
          smoothstep(0.0,0.04,scroll)
        * smoothstep(0.12,0.04,scroll)
        * 0.45;

      float flicker =
        0.85 +
        0.15*sin(
          uTime*vFlickerSpeed+
          vFlickerSeed*6.28318
        );

      float blink =
        step(
          0.985,
          rand(floor(uTime*1.7+vFlickerSeed))
        );

      flicker *= (1.0-blink*0.85);

      float alpha =
        (grid*0.6+scanBar+0.15)
        *flicker
        *vBrightness;

      alpha += 0.08;

      vec3 color =
        mix(
          vec3(0.31,0.49,1.0),
          vec3(0.85,0.93,1.0),
          grid
        );

      gl_FragColor =
        vec4(color,alpha*0.75);
    }
  `,
})

export function HolographicBillboards({ buildingPositions }) {
  const meshRef = useRef()

  const dummy = useMemo(() => new THREE.Object3D(), [])

  const { positions, scales } = useMemo(() => {
    const src =
      buildingPositions?.length
        ? buildingPositions
        : Array.from({ length: BILLBOARD_COUNT }, () => ({
            x: (Math.random() - 0.5) * 160,
            y: 8 + Math.random() * 40,
            z: (Math.random() - 0.5) * 160,
          }))

    const positions = []
    const scales = []

    for (let i = 0; i < BILLBOARD_COUNT; i++) {
      const b = src[i % src.length]

      positions.push({
        x: b.x + (Math.random() - 0.5) * 4,
        y: (b.y ?? 12) + Math.random() * 12,
        z: b.z + (Math.random() - 0.5) * 4,
        ry: Math.random() * Math.PI * 2,
      })

      scales.push({
        w: 3 + Math.random() * 5,
        h: 2 + Math.random() * 3.5,
      })
    }

    return { positions, scales }
  }, [buildingPositions])

  const { flickerSeed, flickerSpeed, brightness } = useMemo(() => {
    const flickerSeed = new Float32Array(BILLBOARD_COUNT)
    const flickerSpeed = new Float32Array(BILLBOARD_COUNT)
    const brightness = new Float32Array(BILLBOARD_COUNT)

    for (let i = 0; i < BILLBOARD_COUNT; i++) {
      flickerSeed[i] = Math.random()
      flickerSpeed[i] = 0.4 + Math.random() * 1.2
      brightness[i] = 0.5 + Math.random() * 0.5
    }

    return {
      flickerSeed,
      flickerSpeed,
      brightness,
    }
  }, [])

  useEffect(() => {
    if (!meshRef.current) return

    for (let i = 0; i < BILLBOARD_COUNT; i++) {
      const p = positions[i]
      const s = scales[i]

      dummy.position.set(p.x, p.y, p.z)
      dummy.rotation.set(0, p.ry, 0)
      dummy.scale.set(s.w, s.h, 1)
      dummy.updateMatrix()

      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  }, [positions, scales, dummy])

  useFrame(({ clock }) => {
    billboardMat.uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[planeGeo, billboardMat, BILLBOARD_COUNT]}
    >
      <instancedBufferAttribute
        attach="geometry-attributes-aFlickerSeed"
        args={[flickerSeed, 1]}
      />

      <instancedBufferAttribute
        attach="geometry-attributes-aFlickerSpeed"
        args={[flickerSpeed, 1]}
      />

      <instancedBufferAttribute
        attach="geometry-attributes-aBrightness"
        args={[brightness, 1]}
      />
    </instancedMesh>
  )
}