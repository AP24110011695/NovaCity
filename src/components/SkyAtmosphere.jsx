/**
 * SkyAtmosphere.jsx
 * Nova City — Premium Sci-Fi Atmospheric Sky System
 *
 * An all-in-one sky environment for React Three Fiber scenes.
 * Combines four visual layers into a single composable component:
 *
 *   1. Sky Dome  — multi-band gradient with Rayleigh/Mie scattering
 *                  approximation.  Zenith, mid-sky, and horizon each
 *                  blend independently with a city-glow progress uniform.
 *
 *   2. Star Field — 2 000 procedural stars on an upper-hemisphere shell.
 *                   Per-star twinkling driven by a single time uniform.
 *                   Stars fade to zero near the horizon via a smooth
 *                   altitude mask — replicating atmospheric extinction.
 *
 *   3. Horizon Glow — additive equatorial ring that simulates light
 *                     pollution / atmospheric scattering at the horizon
 *                     line.  Colour and intensity respond to `progress`.
 *
 *   4. Nebula Wash — very faint, slowly drifting FBM noise on the dome
 *                    interior.  Adds organic depth to the sky without
 *                    competing with the stars.  Pure additive blending.
 *
 * Architecture:
 *   - Every geometry and material is created once (useMemo) and disposed
 *     on unmount.  Module-level singletons used where safe.
 *   - Per-frame work: 2–3 uniform float writes per sub-layer — zero
 *     object allocations.
 *   - No textures, models, or external assets.
 *
 * Props:
 *   progress   {number}  0→1 transition (e.g. above-clouds → in-city).
 *                         Drives sky colour shift, star fade, and glow
 *                         intensity.  Default 0.
 *   starCount  {number}  Total stars.  Default 2000.
 *   radius     {number}  Sky sphere radius.  Default 950.
 *   tint       {string}  Primary accent colour hex.  Default '#4F7CFF'.
 *   autoAnimate {bool}   If true, progress auto-advances 0→1 over
 *                         `animDuration` seconds.  Default false.
 *   animDuration {number} Seconds for auto-animate.  Default 13.
 */

import { useRef, useMemo, useEffect, memo } from 'react'
import { useFrame }                          from '@react-three/fiber'
import * as THREE                            from 'three'

// ─── Shared GLSL noise library ────────────────────────────────────────────────

const GLSL_NOISE = /* glsl */ `
  float _skyHash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }
  float _skyNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(_skyHash(i), _skyHash(i + vec2(1.0, 0.0)), f.x),
      mix(_skyHash(i + vec2(0.0, 1.0)), _skyHash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }
  float skyFbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * _skyNoise(p);
      p  = p * 2.14 + vec2(1.3, 8.1);
      a *= 0.46;
    }
    return v;
  }
`

// ─── 1. Sky Dome ──────────────────────────────────────────────────────────────

const SKY_VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SKY_FRAGMENT = /* glsl */ `
  ${GLSL_NOISE}

  uniform float uProgress;
  uniform float uTime;
  uniform vec3  uTint;
  varying vec3  vDir;

  void main() {
    vec3  dir = normalize(vDir);
    float h   = dir.y * 0.5 + 0.5;                 // 0 = nadir, 0.5 = horizon, 1 = zenith

    // ── Rayleigh-approximate colour bands ────────────────────────────────
    //    Three-zone blend: zenith ↔ mid-sky ↔ horizon, each pair shifting
    //    with uProgress (above-clouds → in-city).

    // Zenith — nearly black at night, deep navy near city
    vec3 zenithA = vec3(0.005, 0.007, 0.016);
    vec3 zenithB = vec3(0.012, 0.020, 0.050);
    vec3 zenith  = mix(zenithA, zenithB, uProgress);

    // Mid-sky — faint blue wash
    vec3 midA = vec3(0.010, 0.016, 0.035);
    vec3 midB = vec3(0.020, 0.038, 0.078);
    vec3 mid  = mix(midA, midB, uProgress);

    // Horizon — warm-shifted by light pollution at high progress
    vec3 horizA = vec3(0.018, 0.024, 0.050);
    vec3 horizB = vec3(0.042, 0.062, 0.120);
    vec3 horiz  = mix(horizA, horizB, uProgress);

    // Sub-horizon (below the geometric equator) — darker, no detail
    vec3 nadir = vec3(0.004, 0.006, 0.012);

    // ── Blend the bands ──────────────────────────────────────────────────
    //    h² pushes the zenith colour higher so the horizon band is broader.
    float hSq  = h * h;
    float midW = smoothstep(0.15, 0.50, h) * (1.0 - smoothstep(0.50, 0.90, h));

    vec3 col = mix(nadir, horiz, smoothstep(0.0, 0.50, h));
    col      = mix(col,   mid,   midW * 0.6);
    col      = mix(col,   zenith, smoothstep(0.55, 1.0, hSq));

    // ── Mie scattering glow at horizon ───────────────────────────────────
    //    Narrow band of warm-tinted additive glow right at h ≈ 0.50.
    float mie     = exp(-pow((h - 0.50) * 12.0, 2.0));
    vec3  mieCol  = mix(vec3(0.015, 0.020, 0.045), uTint * 0.12, uProgress);
    col          += mieCol * mie * (0.35 + uProgress * 0.65);

    // ── Faint noise grain on dome — breaks banding on low-bit displays ──
    vec2  noiseUV = dir.xz * 2.0 + vec2(uTime * 0.001, 0.0);
    float grain   = (skyFbm(noiseUV) - 0.5) * 0.008;
    col          += grain;

    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`

// ─── 2. Star Field ────────────────────────────────────────────────────────────

const STAR_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;

  uniform float uTime;
  uniform float uOpacity;

  varying float vAlpha;
  varying float vPhase;

  void main() {
    vPhase = aPhase;

    // ── Altitude-based atmospheric extinction ────────────────────────────
    //    Stars near the horizon (low Y) are dimmed and reddened in reality.
    //    We simplify to a smooth opacity falloff.
    vec3  dir     = normalize(position);
    float altitude = dir.y;                          // −1 nadir … +1 zenith
    float horizFade = smoothstep(-0.02, 0.28, altitude);

    // ── Per-star twinkle ─────────────────────────────────────────────────
    //    Each star has a unique phase (aPhase) so they don't blink in sync.
    float twinkle = 0.72 + 0.28 * sin(uTime * (2.8 + aPhase * 3.2) + aPhase * 6.283);

    vAlpha = uOpacity * horizFade * twinkle;

    vec4 mvPos   = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPos.z);
    gl_Position  = projectionMatrix * mvPos;
  }
`

const STAR_FRAGMENT = /* glsl */ `
  varying float vAlpha;
  varying float vPhase;

  void main() {
    // ── Soft circular point ──────────────────────────────────────────────
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.15, d) * vAlpha;

    // ── Subtle colour variation — warm-white to blue-white ───────────────
    //    Driven by the star's unique phase value.
    vec3 warmWhite = vec3(1.00, 0.94, 0.86);
    vec3 coolBlue  = vec3(0.78, 0.86, 1.00);
    vec3 col       = mix(warmWhite, coolBlue, fract(vPhase * 7.31));

    gl_FragColor = vec4(col, a);
  }
`

// ─── 3. Horizon Glow Ring ─────────────────────────────────────────────────────

const GLOW_VERTEX = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const GLOW_FRAGMENT = /* glsl */ `
  uniform float uIntensity;
  uniform vec3  uColor;
  varying vec3  vPos;

  void main() {
    vec3  dir = normalize(vPos);
    float h   = dir.y;

    // ── Narrow Gaussian band at horizon (h ≈ 0) ─────────────────────────
    float ring  = exp(-pow(h * 8.0, 2.0));

    // ── Secondary broader wash below horizon — ground-bounce fill ────────
    float wash  = smoothstep(0.15, -0.35, h) * 0.40;

    float alpha = (ring + wash) * uIntensity * 0.08;
    gl_FragColor = vec4(uColor, alpha);
  }
`

// ─── 4. Nebula Wash ───────────────────────────────────────────────────────────

const NEBULA_VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const NEBULA_FRAGMENT = /* glsl */ `
  ${GLSL_NOISE}

  uniform float uTime;
  uniform float uIntensity;
  uniform vec3  uTint;
  varying vec3  vDir;

  void main() {
    vec3  dir = normalize(vDir);
    float h   = dir.y * 0.5 + 0.5;

    // Only visible in upper hemisphere
    float mask = smoothstep(0.45, 0.75, h);

    // Slowly drifting FBM on the spherical surface
    vec2 uv = dir.xz / (dir.y + 1.0) * 1.8;        // gnomonic-ish projection
    uv += vec2(uTime * 0.0008, uTime * 0.0006);

    float n1 = skyFbm(uv);
    float n2 = skyFbm(uv * 0.7 + vec2(4.1, 2.8) - uTime * 0.0005);
    float nebula = n1 * 0.6 + n2 * 0.4;
    nebula = smoothstep(0.38, 0.72, nebula);

    // Colour: mix between deep blue-violet and tint
    vec3 nebulaCol = mix(vec3(0.08, 0.05, 0.18), uTint * 0.3, 0.4);

    float alpha = nebula * mask * uIntensity * 0.035;
    gl_FragColor = vec4(nebulaCol, alpha);
  }
`

// ─── Star geometry factory ────────────────────────────────────────────────────

function createStarGeometry(count, radius) {
  const geo    = new THREE.BufferGeometry()
  const pos    = new Float32Array(count * 3)
  const sizes  = new Float32Array(count)
  const phases = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const cosP  = Math.random() * 1.6 - 0.6       // upper-hemisphere bias
    const sinP  = Math.sqrt(Math.max(0, 1 - cosP * cosP))

    pos[i * 3]     = radius * sinP * Math.cos(theta)
    pos[i * 3 + 1] = radius * Math.abs(cosP)
    pos[i * 3 + 2] = radius * sinP * Math.sin(theta)

    // Size distribution — mostly small, occasional bright
    const r = Math.random()
    sizes[i] = r < 0.92
      ? 0.5 + r * 1.8                              // 92% small–medium
      : 2.0 + (r - 0.92) * 12.5                    // 8%  bright giants

    phases[i] = Math.random()                       // unique twinkle phase
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos,    3))
  geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes,  1))
  geo.setAttribute('aPhase',   new THREE.BufferAttribute(phases, 1))
  return geo
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SkyDome = memo(function SkyDome({ radius, tintColor }) {
  const matRef = useRef()

  const geo = useMemo(() => new THREE.SphereGeometry(radius, 32, 16), [radius])
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uProgress: { value: 0 },
      uTime:     { value: 0 },
      uTint:     { value: tintColor },
    },
    vertexShader:   SKY_VERTEX,
    fragmentShader: SKY_FRAGMENT,
  }), [tintColor])

  useEffect(() => {
    matRef.current = mat
    return () => { mat.dispose(); geo.dispose() }
  }, [mat, geo])

  return (
    <mesh geometry={geo} material={mat} ref={(m) => { if (m) matRef.current = mat }}
          userData={{ skyDomeMat: mat }} />
  )
})

const StarField = memo(function StarField({ count, radius, tintColor }) {
  const matRef = useRef()

  const geo = useMemo(() => createStarGeometry(count, radius * 0.98), [count, radius])
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
    uniforms: {
      uTime:    { value: 0 },
      uOpacity: { value: 1 },
    },
    vertexShader:   STAR_VERTEX,
    fragmentShader: STAR_FRAGMENT,
  }), [])

  useEffect(() => {
    matRef.current = mat
    return () => { mat.dispose(); geo.dispose() }
  }, [mat, geo])

  return (
    <points geometry={geo} material={mat}
            userData={{ starMat: mat }} />
  )
})

const HorizonGlow = memo(function HorizonGlow({ radius, tintColor }) {
  const geo = useMemo(() => new THREE.SphereGeometry(radius * 0.95, 32, 16), [radius])
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite:  false,
    side:        THREE.BackSide,
    blending:    THREE.AdditiveBlending,
    uniforms: {
      uIntensity: { value: 0 },
      uColor:     { value: tintColor },
    },
    vertexShader:   GLOW_VERTEX,
    fragmentShader: GLOW_FRAGMENT,
  }), [tintColor])

  useEffect(() => () => { mat.dispose(); geo.dispose() }, [mat, geo])

  return (
    <mesh geometry={geo} material={mat} userData={{ glowMat: mat }} />
  )
})

const NebulaWash = memo(function NebulaWash({ radius, tintColor }) {
  const geo = useMemo(() => new THREE.SphereGeometry(radius * 0.93, 24, 12), [radius])
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite:  false,
    side:        THREE.BackSide,
    blending:    THREE.AdditiveBlending,
    uniforms: {
      uTime:      { value: 0 },
      uIntensity: { value: 1 },
      uTint:      { value: tintColor },
    },
    vertexShader:   NEBULA_VERTEX,
    fragmentShader: NEBULA_FRAGMENT,
  }), [tintColor])

  useEffect(() => () => { mat.dispose(); geo.dispose() }, [mat, geo])

  return (
    <mesh geometry={geo} material={mat} userData={{ nebulaMat: mat }} />
  )
})

// ─── Uniform driver — single useFrame for the entire system ───────────────────

function AtmosphereDriver({ groupRef, progress, autoAnimate, animDuration }) {
  const progressRef = useRef(progress)
  const autoRef     = useRef(0)

  // Sync controlled prop
  useEffect(() => {
    if (!autoAnimate) progressRef.current = progress
  }, [progress, autoAnimate])

  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime()

    // Auto-animate mode
    if (autoAnimate) {
      autoRef.current = Math.min(1, autoRef.current + delta / animDuration)
      progressRef.current = easeInOutCubic(autoRef.current)
    }

    const p = progressRef.current
    const group = groupRef.current
    if (!group) return

    // Walk children and update uniforms by userData keys
    group.traverse((child) => {
      const ud = child.userData

      // Sky dome
      if (ud.skyDomeMat) {
        ud.skyDomeMat.uniforms.uProgress.value = p
        ud.skyDomeMat.uniforms.uTime.value     = elapsed
      }

      // Stars — fade as city glow increases
      if (ud.starMat) {
        ud.starMat.uniforms.uTime.value    = elapsed
        ud.starMat.uniforms.uOpacity.value = 1.0 - remap(p, 0.35, 0.90)
      }

      // Horizon glow — ramps up with progress
      if (ud.glowMat) {
        ud.glowMat.uniforms.uIntensity.value = remap(p, 0.10, 0.80)
      }

      // Nebula — subtle, fades slightly at high progress
      if (ud.nebulaMat) {
        ud.nebulaMat.uniforms.uTime.value      = elapsed
        ud.nebulaMat.uniforms.uIntensity.value  = 1.0 - p * 0.4
      }
    })
  })

  return null
}

// ─── Math helpers (no imports needed) ─────────────────────────────────────────

const clamp01 = (v) => Math.max(0, Math.min(1, v))
const remap   = (x, a, b) => clamp01((x - a) / (b - a))

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

// ─── Public component ─────────────────────────────────────────────────────────

/**
 * SkyAtmosphere
 *
 * Drop-in atmospheric sky system for React Three Fiber scenes.
 * Place inside a <Canvas> — it renders its own group containing the sky
 * dome, star field, horizon glow, and nebula wash.
 *
 * Control the atmosphere's visual state with the `progress` prop (0–1):
 *   0 = deep space / above clouds — stars bright, sky black, no glow
 *   1 = city level — sky gains navy tint, stars fade, horizon glows
 *
 * Or set `autoAnimate` to smoothly ramp 0→1 over `animDuration` seconds.
 */
export const SkyAtmosphere = memo(function SkyAtmosphere({
  progress     = 0,
  starCount    = 2000,
  radius       = 950,
  tint         = '#4F7CFF',
  autoAnimate  = false,
  animDuration = 13,
}) {
  const groupRef = useRef()
  const tintColor = useMemo(() => new THREE.Color(tint), [tint])

  return (
    <group ref={groupRef} name="sky-atmosphere">
      {/* Uniform driver — one useFrame for all sub-layers */}
      <AtmosphereDriver
        groupRef={groupRef}
        progress={progress}
        autoAnimate={autoAnimate}
        animDuration={animDuration}
      />

      {/* Layer 1 — Sky gradient dome */}
      <SkyDome radius={radius} tintColor={tintColor} />

      {/* Layer 2 — Star field with twinkling + horizon fade */}
      <StarField count={starCount} radius={radius} tintColor={tintColor} />

      {/* Layer 3 — Additive horizon glow ring */}
      <HorizonGlow radius={radius} tintColor={tintColor} />

      {/* Layer 4 — Faint nebula wash on upper dome */}
      <NebulaWash radius={radius} tintColor={tintColor} />
    </group>
  )
})

export default SkyAtmosphere
