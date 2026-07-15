function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export function generateDistrict(seed = 42, center = {x: 0, z: 0}, radius = 100, count = 150) {
  const rng = mulberry32(seed)
  const buildings = []

  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2
    // Skew distribution towards center slightly
    const r = Math.pow(rng(), 1.2) * radius
    
    const x = center.x + Math.cos(angle) * r
    const z = center.z + Math.sin(angle) * r
    
    // Distance from the true city center (Hero Building is at 0, 0, -20)
    const distToCenter = Math.sqrt(x*x + (z+20)*(z+20))
    // Buildings get shorter the further they are from center
    const heightFactor = Math.max(0, (120 - distToCenter) / 120)
    const h = 10 + rng() * 40 * heightFactor + rng() * 20
    
    // Width and depth
    const w = 3 + rng() * 5
    const d = 3 + rng() * 5

    // Prevent intersection with hero building (radius ~10)
    if (distToCenter < 12) continue

    const hasAntenna = rng() > 0.7 && h > 20
    const hasNeon = rng() > 0.8
    const windowPattern = Math.floor(rng() * 3)

    buildings.push({
      x, y: 0, z, w, h, d,
      hasAntenna,
      hasNeon,
      windowPattern,
      colorSeed: rng(),
      id: `${seed}-${i}`
    })
  }

  // Sort by distance from center for better rendering/z-buffer (optional)
  return buildings.sort((a,b) => {
     return Math.sqrt(a.x*a.x + a.z*a.z) - Math.sqrt(b.x*b.x + b.z*b.z)
  })
}
