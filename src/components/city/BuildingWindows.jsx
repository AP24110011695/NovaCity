import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const WINDOW_COUNT = 512

const windowGeometry = new THREE.PlaneGeometry(1, 1)

const windowMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  uniforms: {
    uTime: { value: 0 },
  },
  vertexShader: `
    attribute float aSeed;
    attribute float aOnDuration;
    attribute float aOffDuration;
    attribute float aPhase;

    varying float vBrightness;

    uniform float uTime;

    void main() {

      float period = aOnDuration + aOffDuration;

      float t = mod(uTime * 0.5 + aPhase, period);

      float onState = step(t, aOnDuration);

      float fadeIn =
          smoothstep(0.0,0.3,t)
          * onState;

      float fadeOut =
          smoothstep(0.0,0.3,period-t)
          * onState;

      vBrightness = min(fadeIn,fadeOut);

      gl_Position =
          projectionMatrix *
          modelViewMatrix *
          instanceMatrix *
          vec4(position,1.0);

    }
  `,
  fragmentShader: `
    varying float vBrightness;

    void main(){

      vec3 warmWhite = vec3(1.0,0.92,0.76);
      vec3 coolBlue  = vec3(0.72,0.84,1.0);

      vec3 color = mix(
          warmWhite,
          coolBlue,
          0.35
      );

      float glow =
          0.15 *
          smoothstep(
              0.0,
              1.0,
              vBrightness
          );

      gl_FragColor =
          vec4(
              color + glow,
              vBrightness * 0.85
          );

    }
  `,
})

export function BuildingWindows({ buildingData }) {

  const meshRef = useRef()

  const dummy = useMemo(
    () => new THREE.Object3D(),
    []
  )

  const {
    seed,
    onDuration,
    offDuration,
    phase,
  } = useMemo(() => {

    const seed = new Float32Array(WINDOW_COUNT)
    const onDuration = new Float32Array(WINDOW_COUNT)
    const offDuration = new Float32Array(WINDOW_COUNT)
    const phase = new Float32Array(WINDOW_COUNT)

    for (let i = 0; i < WINDOW_COUNT; i++) {

      seed[i] = Math.random()

      onDuration[i] =
          4 +
          Math.random() * 14

      offDuration[i] =
          2 +
          Math.random() * 10

      phase[i] =
          Math.random() * 30

    }

    return {
      seed,
      onDuration,
      offDuration,
      phase,
    }

  }, [])

  useEffect(() => {

    if (!meshRef.current) return

    placeWindows(
      meshRef.current,
      buildingData,
      dummy
    )

  }, [buildingData, dummy])

  useFrame(({ clock }) => {

    windowMaterial.uniforms.uTime.value =
      clock.getElapsedTime()

  })

  return (

    <instancedMesh
      ref={meshRef}
      args={[
        windowGeometry,
        windowMaterial,
        WINDOW_COUNT,
      ]}
      name="building-windows"
    >

      <instancedBufferAttribute
        attach="geometry-attributes-aSeed"
        args={[seed,1]}
      />

      <instancedBufferAttribute
        attach="geometry-attributes-aOnDuration"
        args={[onDuration,1]}
      />

      <instancedBufferAttribute
        attach="geometry-attributes-aOffDuration"
        args={[offDuration,1]}
      />

      <instancedBufferAttribute
        attach="geometry-attributes-aPhase"
        args={[phase,1]}
      />

    </instancedMesh>

  )

}
// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function placeWindows(mesh, buildingData, dummy) {
  const buildings =
    buildingData && buildingData.length > 0
      ? buildingData
      : generateFallbackBuildings()

  let index = 0

  for (const building of buildings) {
    if (index >= WINDOW_COUNT) break

    const rows = Math.max(2, Math.floor(building.h / 4))

    const faces = [
      {
        axis: 'z',
        sign: 1,
        width: building.w,
      },
      {
        axis: 'z',
        sign: -1,
        width: building.w,
      },
      {
        axis: 'x',
        sign: 1,
        width: building.d,
      },
      {
        axis: 'x',
        sign: -1,
        width: building.d,
      },
    ]

    for (const face of faces) {
      if (index >= WINDOW_COUNT) break

      const cols = Math.max(2, Math.floor(face.width / 3))

      const spacingX = (face.width * 0.75) / cols
      const spacingY = (building.h * 0.82) / rows

      for (let row = 0; row < rows; row++) {
        if (index >= WINDOW_COUNT) break

        for (let col = 0; col < cols; col++) {
          if (index >= WINDOW_COUNT) break

          const localX =
            -face.width * 0.375 +
            spacingX * 0.5 +
            col * spacingX

          const localY =
            building.y -
            building.h * 0.41 +
            spacingY * 0.5 +
            row * spacingY

          if (face.axis === 'z') {
            dummy.position.set(
              building.x + localX,
              localY,
              building.z + face.sign * building.d * 0.501
            )

            dummy.rotation.set(0, 0, 0)
          } else {
            dummy.position.set(
              building.x + face.sign * building.w * 0.501,
              localY,
              building.z + localX
            )

            dummy.rotation.set(
              0,
              Math.PI * 0.5,
              0
            )
          }

          dummy.scale.set(
            spacingX * 0.58,
            spacingY * 0.46,
            1
          )

          dummy.updateMatrix()

          mesh.setMatrixAt(index, dummy.matrix)

          index++
        }
      }
    }
  }

  dummy.position.set(0, -9999, 0)
  dummy.scale.setScalar(0.0001)
  dummy.updateMatrix()

  while (index < WINDOW_COUNT) {
    mesh.setMatrixAt(index, dummy.matrix)
    index++
  }

  mesh.instanceMatrix.needsUpdate = true
}

function generateFallbackBuildings() {
  const buildings = []

  for (let i = 0; i < 24; i++) {
    buildings.push({
      x: (Math.random() - 0.5) * 160,
      y: 0,
      z: (Math.random() - 0.5) * 160,
      w: 8 + Math.random() * 14,
      h: 22 + Math.random() * 60,
      d: 8 + Math.random() * 14,
    })
  }

  return buildings
}