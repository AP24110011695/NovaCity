import { useMemo } from 'react'

// Multi-color star palette — NOVA CITY: deep space, not clean white only
const STAR_COLORS = [
  '#ffffff',   // white
  '#c8d8ff',   // cool blue-white
  '#ffe8a0',   // warm gold
  '#c0a8ff',   // pale violet
  '#ffc8a0',   // warm orange
]

const LAYERS = {
  near: {
    count:    40,
    size:     [1.8, 3.2],
    opacity:  [0.75, 1.0],
    duration: [2.5, 4.0],
    blur:     0,
  },
  medium: {
    count:    65,
    size:     [1.0, 1.9],
    opacity:  [0.45, 0.72],
    duration: [3.5, 5.5],
    blur:     0,
  },
  far: {
    count:    90,
    size:     [0.4, 1.1],
    opacity:  [0.14, 0.42],
    duration: [4.5, 7.5],
    blur:     0.25,
  },
}

const random  = (min, max) => Math.random() * (max - min) + min
const pick    = (arr) => arr[Math.floor(Math.random() * arr.length)]

const generateStars = (layerName, config) =>
  Array.from({ length: config.count }, (_, i) => ({
    id:         `${layerName}-${i}`,
    top:        random(0, 100),
    left:       random(0, 100),
    size:       random(config.size[0], config.size[1]),
    maxOpacity: random(config.opacity[0], config.opacity[1]),
    duration:   random(config.duration[0], config.duration[1]),
    delay:      random(0, 6),
    blur:       config.blur,
    color:      pick(STAR_COLORS),
  }))

/**
 * StarField — CSS starfield with 3 depth layers, colorful stars,
 * layered nebula hazes (violet + blue + gold), and a soft vignette.
 * Palette: multi-hue space, not pure white. Cinematic mood.
 */
const StarField = () => {
  const stars = useMemo(() => [
    ...generateStars('near',   LAYERS.near),
    ...generateStars('medium', LAYERS.medium),
    ...generateStars('far',    LAYERS.far),
  ], [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: var(--star-min); transform: scale(0.88); }
          50%      { opacity: var(--star-max); transform: scale(1.12); }
        }
        @keyframes nebula-drift-a {
          0%,100% { transform: translate(-3%,-2%) scale(1); }
          50%     { transform: translate(2%,3%) scale(1.07); }
        }
        @keyframes nebula-drift-b {
          0%,100% { transform: translate(2%,3%) scale(1.04); }
          50%     { transform: translate(-2%,-2%) scale(1); }
        }
        @keyframes nebula-drift-c {
          0%,100% { transform: translate(1%,-3%) scale(1.02); }
          50%     { transform: translate(-1%,2%) scale(1.06); }
        }
        @keyframes glow-pulse {
          0%,100% { opacity: 0.45; }
          50%     { opacity: 0.72; }
        }
      `}</style>

      {/* Nebula layer — violet, upper-left */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 50% at 22% 22%, rgba(90,30,160,0.11), transparent 60%)',
        animation: 'nebula-drift-a 85s ease-in-out infinite',
      }} />

      {/* Nebula layer — deep blue, right-center */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 44% at 76% 58%, rgba(25,60,160,0.10), transparent 65%)',
        animation: 'nebula-drift-b 110s ease-in-out infinite',
      }} />

      {/* Nebula layer — warm amber, lower-center */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 50% 35% at 48% 78%, rgba(100,55,10,0.07), transparent 65%)',
        animation: 'nebula-drift-c 130s ease-in-out infinite',
      }} />

      {/* Nova blue glow near bottom center */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 38% at 50% 100%, rgba(79,124,255,0.16), transparent 70%)',
        animation: 'glow-pulse 14s ease-in-out infinite',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 82% 82% at 50% 50%, transparent 38%, rgba(0,0,0,0.6) 100%)',
      }} />

      {/* Stars */}
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full"
          style={{
            top:               `${star.top}%`,
            left:              `${star.left}%`,
            width:             `${star.size}px`,
            height:            `${star.size}px`,
            backgroundColor:   star.color,
            filter:            star.blur ? `blur(${star.blur}px)` : undefined,
            '--star-min':      star.maxOpacity * 0.22,
            '--star-max':      star.maxOpacity,
            animation:         `star-twinkle ${star.duration}s ease-in-out infinite`,
            animationDelay:    `${star.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export default StarField