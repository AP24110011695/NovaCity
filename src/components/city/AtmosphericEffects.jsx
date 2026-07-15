import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const GLSL_NOISE = \`
  float hash(vec2 p){p=fract(p*vec2(127.1,311.7));p+=dot(p,p+19.19);return fract(p.x*p.y);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.0;a*=.5;}return v;}
\`

export const GroundFog = () => {
  const matRef = useRef()
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.2, -20]}>
      <planeGeometry args={[300, 300, 32, 32]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={\`
          \${GLSL_NOISE}
          uniform float uTime;
          varying vec2 vUv;
          varying vec3 vPos;
          void main(){
            vUv = uv;
            vec2 np = uv * 4.0 + uTime * 0.02;
            float h = fbm(np) * 4.0; // wave height
            vec3 pos = position; pos.z += h;
            vPos = (modelMatrix * vec4(pos, 1.0)).xyz;
            gl_Position = projectionMatrix * viewMatrix * vec4(vPos, 1.0);
          }
        \`}
        fragmentShader={\`
          \${GLSL_NOISE}
          uniform float uTime;
          varying vec2 vUv;
          varying vec3 vPos;
          void main(){
            float d = length(vPos.xz) / 120.0;
            float alpha = (1.0 - smoothstep(0.2, 1.0, d)) * 0.45;
            float n = fbm(vUv * 8.0 - vec2(uTime * 0.05, 0.0));
            vec3 col = mix(vec3(0.04, 0.08, 0.15), vec3(0.15, 0.25, 0.5), n);
            gl_FragColor = vec4(col, alpha * n);
          }
        \`}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export const VolumetricRays = () => {
  const meshRef = useRef()
  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.05) * 0.1
  })
  return (
    <mesh ref={meshRef} position={[0, 30, -50]} rotation={[0, 0, 0]}>
      <planeGeometry args={[200, 150]} />
      <shaderMaterial
        vertexShader={\`varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}\`}
        fragmentShader={\`
          varying vec2 vUv;
          void main(){
            float rays = max(0.0, sin(vUv.x * 50.0) * sin(vUv.x * 17.0));
            float alpha = rays * smoothstep(1.0, 0.0, vUv.y) * smoothstep(0.0, 0.3, vUv.y);
            float edge = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x);
            gl_FragColor = vec4(0.3, 0.5, 0.9, alpha * edge * 0.15);
          }
        \`}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export const DriftingDust = () => {
  const COUNT = 1500
  const matRef = useRef()
  
  const pos = useMemo(() => {
    const arr = new Float32Array(COUNT * 3)
    for(let i=0; i<COUNT; i++){
      arr[i*3] = (Math.random() - 0.5) * 100
      arr[i*3+1] = Math.random() * 30
      arr[i*3+2] = (Math.random() - 0.5) * 100 - 10
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={pos} count={COUNT} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={\`
          uniform float uTime;
          void main(){
            vec3 p = position;
            p.x += sin(uTime * 0.15 + p.y) * 3.0;
            p.y += sin(uTime * 0.1 + p.x) * 1.5;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            // Size attenuation
            gl_PointSize = (120.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        \`}
        fragmentShader={\`
          void main(){
            float d = length(gl_PointCoord - 0.5);
            gl_FragColor = vec4(0.5, 0.7, 1.0, smoothstep(0.5, 0.1, d) * 0.4);
          }
        \`}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
