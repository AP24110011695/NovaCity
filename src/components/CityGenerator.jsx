/**
 * CityGenerator.jsx
 * Nova City — Procedural Megacity Engine
 *
 * Generates a complete futuristic city procedurally.
 * Everything is instanced. Zero textures. Zero external assets.
 * Exposes buildingData for LivingCity consumption via onCityGenerated callback
 * and an optional forwarded ref.
 *
 * Usage:
 *   <CityGenerator seed={42} onCityGenerated={useCallback(d => setBuildingData(d), [])} />
 *
 * NOTE: wrap onCityGenerated in useCallback in the parent to prevent
 *       unnecessary regeneration cycles.
 */

import {
  useRef,
  useMemo,
  useEffect,
  memo,
  forwardRef,
  useImperativeHandle,
} from 'react'
import * as THREE from 'three'

// ─── City layout constants ────────────────────────────────────────────────────

const CITY_HALF = 180                                     // world-units from center to edge
const GRID_COLS = 30                                      // cells across X
const GRID_ROWS = 30                                      // cells across Z
const CELL_W    = (CITY_HALF * 2) / GRID_COLS            // ~12 units / cell
const CELL_D    = (CITY_HALF * 2) / GRID_ROWS

// Primary road column/row indices — creates a cross-hatch street grid
// Every Nth column/row is reserved as a road lane (no buildings)
const PRIMARY_ROAD_STRIDE   = 7   // major boulevard every 7 cells
const SECONDARY_ROAD_STRIDE = 3   // access road every 3rd cell within blocks

// ─── District identifiers ─────────────────────────────────────────────────────

export const DISTRICT = Object.freeze({
  CORE:        'CORE',
  COMMERCIAL:  'COMMERCIAL',
  RESIDENTIAL: 'RESIDENTIAL',
  INDUSTRIAL:  'INDUSTRIAL',
})

// Per-district generation rules
const DISTRICT_RULES = {
  [DISTRICT.CORE]: {
    radiusMax:    55,
    minW: 9,  maxW: 22,
    minH: 55, maxH: 135,
    minD: 9,  maxD: 22,
    density:       0.82,
    glassCapProb:  0.52,
    antennaProb:   0.42,
    roofIntensity: 0.70,
  },
  [DISTRICT.COMMERCIAL]: {
    radiusMax:    110,
    minW: 11, maxW: 28,
    minH: 16, maxH: 75,
    minD: 11, maxD: 28,
    density:       0.68,
    glassCapProb:  0.38,
    antennaProb:   0.14,
    roofIntensity: 0.55,
  },
  [DISTRICT.RESIDENTIAL]: {
    radiusMax:    155,
    minW: 14, maxW: 30,
    minH:  7, maxH: 32,
    minD: 14, maxD: 30,
    density:       0.54,
    glassCapProb:  0.06,
    antennaProb:   0.04,
    roofIntensity: 0.35,
  },
  [DISTRICT.INDUSTRIAL]: {
    radiusMax:    Infinity,
    minW: 24, maxW: 48,
    minH:  7, maxH: 28,
    minD: 24, maxD: 48,
    density:       0.44,
    glassCapProb:  0.00,
    antennaProb:   0.00,
    roofIntensity: 0.20,
  },
}

// ─── Seeded PRNG (LCG — fast, deterministic, no state leak) ──────────────────

function makePRNG(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0
  return function rand() {
    s = Math.imul(1664525, s) + 1013904223 | 0
    return (s >>> 0) / 0x100000000
  }
}

// ─── District classification by radial distance ───────────────────────────────

function classifyDistrict(dist) {
  if (dist < DISTRICT_RULES[DISTRICT.CORE].radiusMax)        return DISTRICT.CORE
  if (dist < DISTRICT_RULES[DISTRICT.COMMERCIAL].radiusMax)  return DISTRICT.COMMERCIAL
  if (dist < DISTRICT_RULES[DISTRICT.RESIDENTIAL].radiusMax) return DISTRICT.RESIDENTIAL
  return DISTRICT.INDUSTRIAL
}

// ─── Road cell detection ──────────────────────────────────────────────────────

function isRoadCell(col, row) {
  return (col % PRIMARY_ROAD_STRIDE === 0) || (row % PRIMARY_ROAD_STRIDE === 0)
}

// ─── Pure city data generator — runs once per seed ───────────────────────────

function generateCityData(seed) {
  const rng = makePRNG(seed)

  const buildings   = []  // main building data (shared with LivingCity)
  const glassCaps   = []  // transparent upper curtain-wall sections
  const antennas    = []  // spire instances on core/commercial towers
  const roofStrips  = []  // flat emissive planes on building tops
  const landingPads = []  // elevated circular platforms

  // ── Main building grid sweep ──────────────────────────────────────────────

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {

      if (isRoadCell(col, row)) continue

      // World-space center of this grid cell
      const cx = (col + 0.5) * CELL_W - CITY_HALF
      const cz = (row + 0.5) * CELL_D - CITY_HALF
      const dist = Math.sqrt(cx * cx + cz * cz)

      // Circular city boundary
      if (dist > CITY_HALF * 0.94) continue

      const type  = classifyDistrict(dist)
      const rules = DISTRICT_RULES[type]

      if (rng() > rules.density) continue   // sparse cells

      // Sub-cell jitter so buildings don't sit on a perfect grid
      const jx = (rng() - 0.5) * CELL_W * 0.42
      const jz = (rng() - 0.5) * CELL_D * 0.42

      const x = cx + jx
      const z = cz + jz

      const w = rules.minW + rng() * (rules.maxW - rules.minW)
      const d = rules.minD + rng() * (rules.maxD - rules.minD)
      const h = rules.minH + rng() * (rules.maxH - rules.minH)

      const bldg = {
        x,
        y: h * 0.5,   // center Y (sits on ground at y=0)
        z,
        w,
        h,
        d,
        district: type,
        roofY: h,     // top surface world Y (used by LivingCity window system)
      }

      buildings.push(bldg)

      // Roof emissive strip — flat plane at rooftop
      roofStrips.push({
        x,
        y: h + 0.06,
        z,
        w,
        d,
        intensity: rules.roofIntensity,
      })

      // Glass curtain-wall cap (thinner, lighter upper section)
      if (rng() < rules.glassCapProb) {
        const capH = h * (0.08 + rng() * 0.18)
        const capW = w * (0.72 + rng() * 0.24)
        const capD = d * (0.72 + rng() * 0.24)
        glassCaps.push({
          x,
          y: h - capH * 0.5,
          z,
          w: capW,
          h: capH,
          d: capD,
        })
      }

      // Antenna spire
      if (rng() < rules.antennaProb) {
        const antH = 10 + rng() * 28
        const antR = 0.08 + rng() * 0.18
        antennas.push({
          x: x + (rng() - 0.5) * 1.8,
          y: h + antH * 0.5,
          z: z + (rng() - 0.5) * 1.8,
          h: antH,
          r: antR,
        })
      }
    }
  }

  // ── Landing pads — placed at primary road intersections ───────────────────

  const padCandidates = []
  for (let row = 0; row < GRID_ROWS; row += PRIMARY_ROAD_STRIDE) {
    for (let col = 0; col < GRID_COLS; col += PRIMARY_ROAD_STRIDE) {
      const x = col * CELL_W - CITY_HALF
      const z = row * CELL_D - CITY_HALF
      const dist = Math.sqrt(x * x + z * z)
      if (dist < CITY_HALF * 0.78) {
        padCandidates.push({ x, z, dist })
      }
    }
  }

  // Sort by radius, pick closest 8
  padCandidates
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 8)
    .forEach(({ x, z }, i) => {
      const elevation = 5 + rng() * 22
      const radius    = 6  + rng() * 5
      landingPads.push({ x, y: elevation, z, radius, index: i })
    })

  return { buildings, glassCaps, antennas, roofStrips, landingPads }
}

// ─── Shared geometries (module-level singletons — never recreated) ────────────

const GEO_BOX   = new THREE.BoxGeometry(1, 1, 1)
const GEO_SPIRE = new THREE.CylinderGeometry(0.04, 0.28, 1, 6, 1)
const GEO_DISK  = new THREE.CylinderGeometry(1, 1, 0.06, 40)
const GEO_TORUS = new THREE.TorusGeometry(1, 0.048, 8, 56)

// ─── Shared materials ─────────────────────────────────────────────────────────

// Core district — near-black, high metalness, blue tint
const MAT_CORE = new THREE.MeshStandardMaterial({
  color:     0x0c0e15,
  roughness: 0.70,
  metalness: 0.58,
})

// Commercial — slightly lighter, mid metalness
const MAT_COMMERCIAL = new THREE.MeshStandardMaterial({
  color:     0x101418,
  roughness: 0.64,
  metalness: 0.46,
})

// Glass curtain wall caps — dark teal-blue, very smooth
const MAT_GLASS = new THREE.MeshStandardMaterial({
  color:       0x18263a,
  roughness:   0.04,
  metalness:   0.92,
  transparent: true,
  opacity:     0.72,
})

// Residential — warm dark grey
const MAT_RESIDENTIAL = new THREE.MeshStandardMaterial({
  color:     0x0f0e0d,
  roughness: 0.84,
  metalness: 0.16,
})

// Industrial — near-matte, cold dark
const MAT_INDUSTRIAL = new THREE.MeshStandardMaterial({
  color:     0x080909,
  roughness: 0.94,
  metalness: 0.06,
})

// Roof emissive strip — blue (#4F7CFF)
const MAT_ROOF = new THREE.MeshStandardMaterial({
  color:             0x4f7cff,
  emissive:          new THREE.Color(0x4f7cff),
  emissiveIntensity: 0.60,
  roughness:         0.40,
  metalness:         0.60,
})

// Antenna spire — dark metal with faint blue tip glow
const MAT_SPIRE = new THREE.MeshStandardMaterial({
  color:             0x0a0b12,
  roughness:         0.42,
  metalness:         0.88,
  emissive:          new THREE.Color(0x4f7cff),
  emissiveIntensity: 0.10,
})

// Landing pad disk
const MAT_PAD = new THREE.MeshStandardMaterial({
  color:             0x111824,
  roughness:         0.38,
  metalness:         0.82,
  emissive:          new THREE.Color(0x4f7cff),
  emissiveIntensity: 0.18,
})

// Landing pad ring — brighter blue glow
const MAT_PAD_RING = new THREE.MeshStandardMaterial({
  color:             0x4f7cff,
  emissive:          new THREE.Color(0x4f7cff),
  emissiveIntensity: 0.70,
  roughness:         0.28,
  metalness:         0.80,
})

// Road surface
const MAT_ROAD = new THREE.MeshStandardMaterial({
  color:     0x0b0c0f,
  roughness: 1.0,
  metalness: 0.0,
})

// Ground — custom shader with world-space grid lines
const MAT_GROUND = new THREE.ShaderMaterial({
  uniforms: {
    uCityHalf: { value: CITY_HALF },
    uPrimary:  { value: CELL_W * PRIMARY_ROAD_STRIDE },
    uSecondary:{ value: CELL_W },
  },
  vertexShader: /* glsl */`
    varying vec3 vWorld;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorld = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `,
  fragmentShader: /* glsl */`
    uniform float uCityHalf;
    uniform float uPrimary;
    uniform float uSecondary;
    varying vec3 vWorld;

    // Anti-aliased grid lines without fwidth (works everywhere)
    float gridLine(vec2 p, float period, float halfWidth) {
      vec2 g = abs(mod(p + period * 0.5, period) - period * 0.5);
      float d = min(g.x, g.y);
      return 1.0 - smoothstep(0.0, halfWidth, d);
    }

    void main() {
      vec2 p = vWorld.xz;

      float dist   = length(p);
      float radial = 1.0 - smoothstep(uCityHalf * 0.70, uCityHalf * 0.95, dist);
      float edge   = smoothstep(uCityHalf * 0.96, uCityHalf * 0.84, dist);

      // Block-level grid (primary roads)
      float grid1 = gridLine(p, uPrimary,   0.28) * 0.14;
      // Cell-level grid (secondary)
      float grid2 = gridLine(p, uSecondary, 0.10) * 0.04;
      float grid  = (grid1 + grid2) * radial;

      vec3 base    = vec3(0.026, 0.028, 0.036);
      vec3 accent  = vec3(0.31,  0.49,  1.00);
      vec3 col     = mix(base, accent, grid);

      gl_FragColor = vec4(col, edge);
    }
  `,
  transparent: true,
})

// ─── Scratch Object3D for instance matrix computation ────────────────────────
// Single module-level dummy — setInstances is always called synchronously.

const _dummy = new THREE.Object3D()
_dummy.matrixAutoUpdate = false

/**
 * Apply per-instance transforms to an InstancedMesh.
 * mapFn(dummy, item, index) should mutate dummy.position / scale / rotation.
 */
function applyInstances(mesh, items, mapFn) {
  if (!mesh || !items.length) return
  for (let i = 0; i < items.length; i++) {
    _dummy.position.set(0, 0, 0)
    _dummy.rotation.set(0, 0, 0)
    _dummy.scale.set(1, 1, 1)
    mapFn(_dummy, items[i], i)
    _dummy.updateMatrix()
    mesh.setMatrixAt(i, _dummy.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Generic instanced box buildings.
 * One instance per entry in `data`, using the provided material.
 */
const BuildingInstances = memo(function BuildingInstances({ data, material }) {
  const ref = useRef()
  useEffect(() => {
    applyInstances(ref.current, data, (d, b) => {
      d.position.set(b.x, b.y, b.z)
      d.scale.set(b.w, b.h, b.d)
    })
  }, [data])
  if (!data.length) return null
  return (
    <instancedMesh
      ref={ref}
      args={[GEO_BOX, material, data.length]}
      castShadow
      receiveShadow={false}
      frustumCulled={false}
      name={`buildings-${data[0]?.district ?? 'unknown'}`}
    />
  )
})

/**
 * Flat emissive roof strip — one per building.
 * Scaled to match building footprint.
 */
const RoofStrips = memo(function RoofStrips({ data }) {
  const ref = useRef()
  useEffect(() => {
    applyInstances(ref.current, data, (d, s) => {
      d.position.set(s.x, s.y, s.z)
      d.scale.set(s.w, 0.14, s.d)   // very flat — 0.14 units tall
    })
  }, [data])
  if (!data.length) return null
  return (
    <instancedMesh
      ref={ref}
      args={[GEO_BOX, MAT_ROOF, data.length]}
      frustumCulled={false}
      name="roof-strips"
    />
  )
})

/**
 * Glass curtain-wall cap sections on taller buildings.
 */
const GlassCaps = memo(function GlassCaps({ data }) {
  const ref = useRef()
  useEffect(() => {
    applyInstances(ref.current, data, (d, b) => {
      d.position.set(b.x, b.y, b.z)
      d.scale.set(b.w, b.h, b.d)
    })
  }, [data])
  if (!data.length) return null
  return (
    <instancedMesh
      ref={ref}
      args={[GEO_BOX, MAT_GLASS, data.length]}
      frustumCulled={false}
      name="glass-caps"
    />
  )
})

/**
 * Antenna spires — thin tapered cylinders on core/commercial towers.
 */
const Antennas = memo(function Antennas({ data }) {
  const ref = useRef()
  useEffect(() => {
    applyInstances(ref.current, data, (d, a) => {
      d.position.set(a.x, a.y, a.z)
      // Non-uniform scale: uniform radius per axis, height on Y
      d.scale.set(a.r * 2, a.h, a.r * 2)
    })
  }, [data])
  if (!data.length) return null
  return (
    <instancedMesh
      ref={ref}
      args={[GEO_SPIRE, MAT_SPIRE, data.length]}
      frustumCulled={false}
      name="antennas"
    />
  )
})

/**
 * Road surface grid — instanced flat boxes along road axes.
 * One segment per primary road column, one per primary road row.
 */
const Roads = memo(function Roads() {
  const segments = useMemo(() => {
    const segs = []
    const totalSize = CITY_HALF * 2

    // Vertical road strips (along Z axis)
    for (let col = 0; col < GRID_COLS; col += PRIMARY_ROAD_STRIDE) {
      const wx = col * CELL_W - CITY_HALF
      segs.push({ x: wx, z: 0, scaleX: CELL_W, scaleZ: totalSize })
    }
    // Horizontal road strips (along X axis)
    for (let row = 0; row < GRID_ROWS; row += PRIMARY_ROAD_STRIDE) {
      const wz = row * CELL_D - CITY_HALF
      segs.push({ x: 0, z: wz, scaleX: totalSize, scaleZ: CELL_D })
    }
    return segs
  }, [])

  const ref = useRef()
  useEffect(() => {
    applyInstances(ref.current, segments, (d, s) => {
      d.position.set(s.x, 0.015, s.z)
      d.scale.set(s.scaleX, 0.03, s.scaleZ)
    })
  }, [segments])

  return (
    <instancedMesh
      ref={ref}
      args={[GEO_BOX, MAT_ROAD, segments.length]}
      receiveShadow
      frustumCulled={false}
      name="roads"
    />
  )
})

/**
 * Landing pads — elevated circular platforms at road intersections.
 * Each pad: platform disk + outer glow ring + inner alignment ring + support column.
 */
const LandingPads = memo(function LandingPads({ data }) {
  const diskRef  = useRef()
  const ringORef = useRef()
  const ringIRef = useRef()
  const colRef   = useRef()

  useEffect(() => {
    if (!diskRef.current || !data.length) return

    applyInstances(diskRef.current, data, (d, p) => {
      d.position.set(p.x, p.y, p.z)
      d.scale.set(p.radius, 1, p.radius)
    })

    // Outer ring at radius = p.radius
    applyInstances(ringORef.current, data, (d, p) => {
      d.position.set(p.x, p.y + 0.06, p.z)
      d.scale.setScalar(p.radius)
    })

    // Inner alignment ring at radius = p.radius * 0.48
    applyInstances(ringIRef.current, data, (d, p) => {
      d.position.set(p.x, p.y + 0.06, p.z)
      d.scale.setScalar(p.radius * 0.48)
    })

    // Support column from ground to platform underside
    applyInstances(colRef.current, data, (d, p) => {
      d.position.set(p.x, p.y * 0.5, p.z)
      d.scale.set(1.6, p.y, 1.6)
    })
  }, [data])

  if (!data.length) return null
  const n = data.length

  return (
    <group name="landing-pads">
      <instancedMesh ref={diskRef}  args={[GEO_DISK,  MAT_PAD,      n]} frustumCulled={false} />
      <instancedMesh ref={ringORef} args={[GEO_TORUS, MAT_PAD_RING, n]} frustumCulled={false} />
      <instancedMesh ref={ringIRef} args={[GEO_TORUS, MAT_PAD_RING, n]} frustumCulled={false} />
      {/* Support column uses a flat-scaled box — simple, cheap */}
      <instancedMesh ref={colRef}   args={[GEO_BOX,   MAT_INDUSTRIAL, n]} frustumCulled={false} />
    </group>
  )
})

/**
 * Ground plane with world-space grid shader.
 */
const Ground = memo(function Ground() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      receiveShadow
      name="ground"
    >
      <planeGeometry args={[CITY_HALF * 2.3, CITY_HALF * 2.3, 1, 1]} />
      <primitive object={MAT_GROUND} attach="material" />
    </mesh>
  )
})

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * CityGenerator
 *
 * Props:
 *   seed              {number}    Deterministic generation seed (default 42)
 *   onCityGenerated   {function}  Called with buildingData[] after generation
 *                                 Wrap in useCallback in parent!
 *
 * Ref:
 *   ref.current.buildingData   — same array passed to onCityGenerated
 */
export const CityGenerator = forwardRef(function CityGenerator(
  { seed = 42, onCityGenerated },
  ref
) {
  // All data generated once per seed — deterministic and pure
  const cityData = useMemo(() => generateCityData(seed), [seed])

  // Expose buildingData via ref for imperative access
  useImperativeHandle(ref, () => ({
    buildingData: cityData.buildings,
  }), [cityData])

  // Notify parent — fires whenever seed (and thus cityData) changes
  useEffect(() => {
    if (typeof onCityGenerated === 'function') {
      onCityGenerated(cityData.buildings)
    }
  }, [cityData, onCityGenerated])

  // Split buildings by district — each district uses a different material
  const coreBuildings   = useMemo(
    () => cityData.buildings.filter(b => b.district === DISTRICT.CORE),
    [cityData]
  )
  const commBuildings   = useMemo(
    () => cityData.buildings.filter(b => b.district === DISTRICT.COMMERCIAL),
    [cityData]
  )
  const residBuildings  = useMemo(
    () => cityData.buildings.filter(b => b.district === DISTRICT.RESIDENTIAL),
    [cityData]
  )
  const indBuildings    = useMemo(
    () => cityData.buildings.filter(b => b.district === DISTRICT.INDUSTRIAL),
    [cityData]
  )

  return (
    <group name="nova-city">

      {/* ── Ground surface ── */}
      <Ground />

      {/* ── Road grid ── */}
      <Roads />

      {/* ── Building masses by district ── */}
      <BuildingInstances data={coreBuildings}  material={MAT_CORE}        />
      <BuildingInstances data={commBuildings}  material={MAT_COMMERCIAL}  />
      <BuildingInstances data={residBuildings} material={MAT_RESIDENTIAL} />
      <BuildingInstances data={indBuildings}   material={MAT_INDUSTRIAL}  />

      {/* ── Glass curtain-wall upper sections ── */}
      <GlassCaps data={cityData.glassCaps} />

      {/* ── Emissive roof strips ── */}
      <RoofStrips data={cityData.roofStrips} />

      {/* ── Antenna spires ── */}
      <Antennas data={cityData.antennas} />

      {/* ── Elevated landing pads ── */}
      <LandingPads data={cityData.landingPads} />

    </group>
  )
})
