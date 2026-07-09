import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const LIGHT_COUNT = 5

const coneGeometry = new THREE.ConeGeometry(1, 1, 18, 1, true)

const beamMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  toneMapped: false,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0x4f7cff) },
    uOpacity: { value: 0.08 },
  },
  vertexShader: `
    varying float vY;

    void main() {
      vY = position.y;

      gl_Position =
        projectionMatrix *
        modelViewMatrix *
        vec4(position,1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uOpacity;

    varying float vY;

    void main(){

      float fade =
        smoothstep(-0.5,0.5,vY);

      float shimmer =
        0.85 +
        0.15 *
        sin(
          uTime*2.4+
          vY*12.0
        );

      float alpha =
        pow(fade,1.5) *
        shimmer *
        uOpacity;

      gl_FragColor =
        vec4(
          uColor,
          alpha
        );

    }
  `,
})

function createConfig(index) {

  const angle =
    index /
    LIGHT_COUNT *
    Math.PI *
    2

  const radius =
    60 +
    Math.random()*40

  return {

    baseX:
      Math.cos(angle)*radius,

    baseZ:
      Math.sin(angle)*radius,

    baseY:0,

    length:
      55+
      Math.random()*30,

    radius:
      2.5+
      Math.random()*1.5,

    sweepSpeed:
      0.06+
      Math.random()*0.06,

    sweepRadius:
      0.18+
      Math.random()*0.22,

    sweepPhase:
      Math.random()*Math.PI*2,

    intensity:
      42+
      Math.random()*24,

    angle:
      0.045+
      Math.random()*0.025,

    penumbra:0.7,

    color:0xb8ccff

  }

}

export function Searchlights(){

  const direction = useMemo(()=>new THREE.Vector3(),[])
  const quaternion = useMemo(()=>new THREE.Quaternion(),[])
  const up = useMemo(()=>new THREE.Vector3(0,1,0),[])

  const lights = useMemo(()=>{

    return Array.from(
      {length:LIGHT_COUNT},
      (_,i)=>({

        config:createConfig(i),

        coneRef:{current:null},

        spotRef:{current:null},

        targetRef:{current:null}

      })
    )

  },[])

  useFrame(({clock})=>{

    const t =
      clock.getElapsedTime()

    beamMaterial.uniforms.uTime.value =
      t

    for(const light of lights){

      const c = light.config

      if(
        !light.coneRef.current ||
        !light.spotRef.current ||
        !light.targetRef.current
      ) continue

      const yaw =
        c.sweepPhase+
        Math.sin(
          t*c.sweepSpeed
        )*
        c.sweepRadius

      const pitch =
        0.35+
        Math.sin(
          t*c.sweepSpeed*1.37+1.2
        )*
        0.18

      const tx =
        c.baseX+
        Math.sin(yaw)*
        Math.cos(pitch)*
        c.length

      const ty =
        c.baseY+
        Math.sin(pitch)*
        c.length

      const tz =
        c.baseZ+
        Math.cos(yaw)*
        Math.cos(pitch)*
        c.length

      light.targetRef.current.position.set(
        tx,
        ty,
        tz
      )

      light.spotRef.current.target =
        light.targetRef.current

      const midX = (c.baseX+tx)*0.5
      const midY = (c.baseY+ty)*0.5
      const midZ = (c.baseZ+tz)*0.5

      light.coneRef.current.position.set(
        midX,
        midY,
        midZ
      )

      direction.set(
        tx-c.baseX,
        ty-c.baseY,
        tz-c.baseZ
      )

      const distance =
        direction.length()

      direction.normalize()

      quaternion.setFromUnitVectors(
        up,
        direction
      )

      light.coneRef.current.setRotationFromQuaternion(
        quaternion
      )

      light.coneRef.current.scale.set(
        c.radius,
        distance,
        c.radius
      )
    }

  })
      return (
    <group name="searchlights">
      {lights.map((light, index) => {
        const c = light.config

        return (
          <group key={index}>
            <mesh
              ref={light.coneRef}
              geometry={coneGeometry}
              material={beamMaterial}
              renderOrder={1}
            />

            <spotLight
              ref={light.spotRef}
              position={[
                c.baseX,
                c.baseY + 0.5,
                c.baseZ,
              ]}
              color={c.color}
              intensity={c.intensity}
              angle={c.angle}
              penumbra={c.penumbra}
              distance={c.length * 1.4}
              decay={2}
              castShadow={false}
            />

            <object3D ref={light.targetRef} />
          </group>
        )
      })}
    </group>
  )
}

export default Searchlights