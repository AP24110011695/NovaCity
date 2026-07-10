/**
 * CloudLayer.jsx
 * Nova City — Cinematic Volumetric Cloud System
 *
 * Architecture:
 *   - N parallel noise planes stacked at configurable Y heights form a
 *     pseudo-volumetric cloud bank.  The camera flies *through* them during
 *     descent, each slab revealing and then occluding at different rates.
 *
 *   - Fragment shader: 6-octave domain-warped FBM with dual drift layers,
 *     atmospheric blue scattering tint, and smooth radial vignette falloff.
 *
 *   - Vertex shader: gentle FBM-driven Y-displacement to break the flat-plane
 *     silhouette when viewed edge-on — gives a billowing horizon line.
 *
 *   - All geometry and material descriptors are created once (useMemo) and
 *     disposed on unmount.  The only per-frame work is writing 2 floats
 *     (uTime, uCamY) into each material's uniforms — zero allocations.
 *
 *   - Fully configurable via props. Sensible defaults produce a cinematic
 *     result with zero configuration.
 *
 *   - No textures, models, or external assets.
 *
 * Usage:
 *   <CloudLayer />                         — defaults (4 slabs, Y 50–95)
 *   <CloudLayer count={6} baseY={30} />    — 6 slabs starting at Y=30
 *   <CloudLayer opacity={0.5} speed={0.4}  — half-transparent, slow drift
 *               tint="#ff6633" />           — sunset orange tint
 */

import { useRef, useMemo, useEffect, memo } from 'react'
import { useFrame, useThree }               from '@react-three/fiber'
import * as THREE                           from 'three'

// ─── Default configuration ────────────────────────────────────────────────────

const DEFAULTS = Object.freeze({
  /** Number of stacked cloud slabs */
  count:      4,
  /** World-Y of the lowest slab */
  baseY:      50,
  /** Vertical spacing between slabs (world units) */
  spacing:    15,
  /** World-space radius of each slab plane */
  radius:     900,
  /** Plane subdivision (for vertex displacement) */
  segments:   48,
  /** Master opacity multiplier [0–1] */
  opacity:    0.88,
  /** Global drift speed multiplier */
  speed:      1.0,
  /** Atmospheric tint colour */
  tint:       '#4F7CFF',
  /** Noise detail scale — larger = smaller cloud features */
  noiseScale: 1.8,
  /** Cloud density threshold — higher = fewer / thinner clouds */
  threshold:  0.34,
  /** Vertex displacement amplitude (world units) */
  displaceAmp: 6.0,
  /** Distance from camera at which slab fades to zero (world units) */
  fadeRange:  55,
})

// ─── GLSL library: noise + FBM (shared by vertex & fragment) ──────────────────

const GLSL_NOISE_LIB = /* glsl */ `
  //
  // 2-D value noise — fast, no sin/fract artefacts
  //
  float _h(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }

  float _n(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);          // cubic Hermite
    return mix(
      mix(_h(i),              _h(i + vec2(1.0, 0.0)), f.x),
      mix(_h(i + vec2(0.0, 1.0)), _h(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  //
  // FBM — 6 octaves, lacunarity 2.12, gain 0.48
  // Returns [0 … ~1].
  //
  float fbm6(vec2 p) {
    float v = 0.0, a = 0.50;
    for (int i = 0; i < 6; i++) {
      v += a * _n(p);
      p  = p * 2.12 + vec2(1.7, 9.2);
      a *= 0.48;
    }
    return v;
  }

  //
  // Domain warp — distort sample coordinate by its own FBM.
  // Gives the organic, billowing character of real clouds.
  //
  float warpedFbm(vec2 p, float t) {
    vec2 q = vec2(
      fbm6(p + vec2(0.0, 0.0)),
      fbm6(p + vec2(5.2, 1.3))
    );
    vec2 r = vec2(
      fbm6(p + 4.0 * q + vec2(1.7 + t * 0.003, 9.2 - t * 0.002)),
      fbm6(p + 4.0 * q + vec2(8.3 - t * 0.004, 2.8 + t * 0.005))
    );
    return fbm6(p + 4.0 * r);
  }
`

// ─── Slab vertex shader ───────────────────────────────────────────────────────

const VERTEX_SHADER = /* glsl */ `
  ${GLSL_NOISE_LIB}

  uniform float uTime;
  uniform float uDisplaceAmp;
  uniform float uNoiseScale;

  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;

    // Gentle Y-displacement via low-frequency FBM — gives a billowing edge
    vec2 np  = uv * uNoiseScale * 0.4 + vec2(uTime * 0.002, uTime * 0.003);
    float d  = fbm6(np) - 0.5;
    vec3 pos = position;
    pos.z   += d * uDisplaceAmp;           // plane lies in XY, Z is "up" before rotation

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos     = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

// ─── Slab fragment shader ─────────────────────────────────────────────────────

const FRAGMENT_SHADER = /* glsl */ `
  ${GLSL_NOISE_LIB}

  uniform float uTime;
  uniform float uOpacity;
  uniform float uNoiseScale;
  uniform float uThreshold;
  uniform vec2  uDrift;
  uniform vec3  uTint;
  uniform float uCamY;
  uniform float uSlabY;
  uniform float uFadeRange;

  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    // ── Primary cloud noise (domain-warped FBM) ──────────────────────────
    vec2 base = (vUv - 0.5) * uNoiseScale;

    vec2 uv1  = base + uDrift + vec2(uTime * 0.005,  uTime * 0.003);
    vec2 uv2  = base * 0.55 - uDrift * 0.7 + vec2(-uTime * 0.004, uTime * 0.006);

    float f1  = warpedFbm(uv1, uTime);
    float f2  = fbm6(uv2);                   // second layer: plain FBM for contrast

    float cloud = f1 * 0.60 + f2 * 0.40;

    // ── Density threshold with soft edge ─────────────────────────────────
    cloud = smoothstep(uThreshold, uThreshold + 0.28, cloud);

    // ── Radial vignette — fade out toward plane edges ────────────────────
    float vignette = 1.0 - smoothstep(0.30, 0.50, length(vUv - 0.5));
    cloud *= vignette;

    // ── Camera-distance fade ─────────────────────────────────────────────
    //    Cloud slab fades when camera is far; max opacity when near/inside.
    float dist       = abs(uCamY - uSlabY);
    float distFactor = 1.0 - smoothstep(0.0, uFadeRange, dist);
    cloud *= distFactor;

    // ── Atmospheric colour ───────────────────────────────────────────────
    //    Top side: bright white with a hint of tint.
    //    Bottom side: deeper tint (blue atmospheric scattering).
    vec3 topCol    = mix(vec3(0.92, 0.94, 0.98), uTint, 0.10);
    vec3 bottomCol = mix(vec3(0.30, 0.38, 0.54), uTint, 0.35);

    // gl_FrontFacing = camera looking at the top surface
    vec3 col = gl_FrontFacing ? topCol : bottomCol;

    // ── Subtle edge highlight (rim-light approximation) ──────────────────
    //    Brightens where cloud density drops off — simulates silver lining.
    float rimStrength = smoothstep(0.04, 0.22, cloud) * (1.0 - smoothstep(0.22, 0.55, cloud));
    col += uTint * rimStrength * 0.18;

    // ── Final compositing ────────────────────────────────────────────────
    float alpha = cloud * uOpacity;
    gl_FragColor = vec4(col, alpha);
  }
`

// ─── Per-slab configuration generator ─────────────────────────────────────────

/**
 * Deterministic per-slab variation — each slab gets a slightly different
 * drift vector, noise scale, and threshold so they don't look like copies.
 */
function slabConfig(index, count) {
  // Golden-ratio–based angular offset for drift direction
  const angle = index * 2.399                        // golden angle ≈ 137.5°
  const mag   = 0.12 + (index / Math.max(count, 1)) * 0.18
  const dx    = Math.cos(angle) * mag
  const dz    = Math.sin(angle) * mag

  // Scale and threshold variation
  const scaleMul    = 1.0 + Math.sin(index * 1.7) * 0.25
  const threshShift = (index % 2 === 0 ? 0.03 : -0.02) * (index + 1) / count

  return { dx, dz, scaleMul, threshShift }
}

// ─── Single slab mesh component ───────────────────────────────────────────────

const CloudSlab = memo(function CloudSlab({
  y,
  index,
  count,
  radius,
  segments,
  opacity,
  speed,
  tint,
  noiseScale,
  threshold,
  displaceAmp,
  fadeRange,
}) {
  const matRef = useRef(null)
  const { dx, dz, scaleMul, threshShift } = useMemo(
    () => slabConfig(index, count),
    [index, count]
  )

  // Tint as THREE.Color — stable across renders
  const tintColor = useMemo(() => new THREE.Color(tint), [tint])

  // Create material once, dispose on unmount
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite:  false,
      side:        THREE.DoubleSide,
      uniforms: {
        uTime:        { value: 0 },
        uOpacity:     { value: opacity },
        uNoiseScale:  { value: noiseScale * scaleMul },
        uThreshold:   { value: Math.max(0.1, threshold + threshShift) },
        uDrift:       { value: new THREE.Vector2(dx, dz) },
        uTint:        { value: tintColor },
        uCamY:        { value: 0 },
        uSlabY:       { value: y },
        uFadeRange:   { value: fadeRange },
        uDisplaceAmp: { value: displaceAmp * (0.8 + 0.4 * Math.sin(index)) },
      },
      vertexShader:   VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync prop changes into existing material uniforms (no re-creation)
  useEffect(() => {
    const u = material.uniforms
    u.uOpacity.value    = opacity
    u.uNoiseScale.value = noiseScale * scaleMul
    u.uThreshold.value  = Math.max(0.1, threshold + threshShift)
    u.uSlabY.value      = y
    u.uFadeRange.value  = fadeRange
    u.uTint.value.set(tint)
    u.uDisplaceAmp.value = displaceAmp * (0.8 + 0.4 * Math.sin(index))
  }, [material, opacity, noiseScale, scaleMul, threshold, threshShift, y, fadeRange, tint, displaceAmp, index])

  // Store material ref for useFrame
  useEffect(() => {
    matRef.current = material
    return () => { material.dispose() }
  }, [material])

  // ── Per-frame: write exactly 2 floats — uTime, uCamY ──────────────────
  useFrame(({ clock, camera }) => {
    const mat = matRef.current
    if (!mat) return
    mat.uniforms.uTime.value = clock.getElapsedTime() * speed
    mat.uniforms.uCamY.value = camera.position.y
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <planeGeometry args={[radius, radius, segments, segments]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
})

// ─── Public component ─────────────────────────────────────────────────────────

/**
 * CloudLayer
 *
 * Renders a stack of N procedural noise planes that together form a
 * massive volumetric-looking cloud bank.  Designed for a cinematic camera
 * that descends through the layer — each slab fades based on proximity
 * to the camera's Y position.
 *
 * Props (all optional):
 *   count        {number}   — Number of slabs               (default 4)
 *   baseY        {number}   — World-Y of lowest slab         (default 50)
 *   spacing      {number}   — Vertical gap between slabs     (default 15)
 *   radius       {number}   — XZ size of each plane          (default 900)
 *   segments     {number}   — Subdivision for displacement   (default 48)
 *   opacity      {number}   — Master opacity [0–1]           (default 0.88)
 *   speed        {number}   — Drift speed multiplier         (default 1.0)
 *   tint         {string}   — Hex colour for atmo tint       (default '#4F7CFF')
 *   noiseScale   {number}   — Detail scale                   (default 1.8)
 *   threshold    {number}   — Density cutoff                 (default 0.34)
 *   displaceAmp  {number}   — Vertex displacement height     (default 6.0)
 *   fadeRange    {number}   — Cam-distance fade range        (default 55)
 */
export const CloudLayer = memo(function CloudLayer(props) {
  const {
    count       = DEFAULTS.count,
    baseY       = DEFAULTS.baseY,
    spacing     = DEFAULTS.spacing,
    radius      = DEFAULTS.radius,
    segments    = DEFAULTS.segments,
    opacity     = DEFAULTS.opacity,
    speed       = DEFAULTS.speed,
    tint        = DEFAULTS.tint,
    noiseScale  = DEFAULTS.noiseScale,
    threshold   = DEFAULTS.threshold,
    displaceAmp = DEFAULTS.displaceAmp,
    fadeRange   = DEFAULTS.fadeRange,
  } = props

  // Pre-compute slab Y-positions — stable across renders
  const slabYs = useMemo(() => {
    const ys = []
    for (let i = 0; i < count; i++) {
      ys.push(baseY + i * spacing)
    }
    return ys
  }, [count, baseY, spacing])

  return (
    <group name="cloud-layer">
      {slabYs.map((y, i) => (
        <CloudSlab
          key={`cloud-slab-${i}`}
          y={y}
          index={i}
          count={count}
          radius={radius}
          segments={segments}
          opacity={opacity}
          speed={speed}
          tint={tint}
          noiseScale={noiseScale}
          threshold={threshold}
          displaceAmp={displaceAmp}
          fadeRange={fadeRange}
        />
      ))}
    </group>
  )
})

export default CloudLayer
