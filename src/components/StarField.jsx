import { useMemo } from 'react'

// Depth layer configuration — controls size, brightness, and motion feel per layer.
const LAYERS = {
  near: {
    count: 40,
    size: [1.8, 3],
    opacity: [0.7, 1],
    duration: [2.5, 4],
    blur: 0,
  },
  medium: {
    count: 60,
    size: [1, 1.8],
    opacity: [0.4, 0.7],
    duration: [3.5, 5.5],
    blur: 0,
  },
  far: {
    count: 80,
    size: [0.4, 1],
    opacity: [0.15, 0.4],
    duration: [4.5, 7],
    blur: 0.2,
  },
}

const random = (min, max) => Math.random() * (max - min) + min

const generateStars = (layerName, config) => {
  return Array.from({ length: config.count }, (_, i) => ({
    id: `${layerName}-${i}`,
    layer: layerName,
    top: random(0, 100),
    left: random(0, 100),
    size: random(config.size[0], config.size[1]),
    maxOpacity: random(config.opacity[0], config.opacity[1]),
    duration: random(config.duration[0], config.duration[1]),
    delay: random(0, 6),
    blur: config.blur,
  }))
}

/**
 * StarField
 * Pure React/CSS starfield with 3 depth layers (near, medium, far),
 * a slow-moving nebula haze, a soft blue glow near the bottom center,
 * and an edge vignette. No canvas, no external libraries.
 * Palette restricted to #4F7CFF, white, and black — Interstellar mood,
 * not neon/cyberpunk.
 */
const StarField = () => {
  const stars = useMemo(() => {
    return [
      ...generateStars('near', LAYERS.near),
      ...generateStars('medium', LAYERS.medium),
      ...generateStars('far', LAYERS.far),
    ]
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>
        {`
          @keyframes star-twinkle {
            0%, 100% {
              opacity: var(--star-min-opacity);
              transform: scale(0.9);
            }
            50% {
              opacity: var(--star-max-opacity);
              transform: scale(1.1);
            }
          }

          @keyframes nebula-drift-1 {
            0% {
              transform: translate(-3%, -2%) scale(1);
            }
            50% {
              transform: translate(3%, 2%) scale(1.08);
            }
            100% {
              transform: translate(-3%, -2%) scale(1);
            }
          }

          @keyframes nebula-drift-2 {
            0% {
              transform: translate(2%, 3%) scale(1.05);
            }
            50% {
              transform: translate(-2%, -3%) scale(1);
            }
            100% {
              transform: translate(2%, 3%) scale(1.05);
            }
          }

          @keyframes glow-pulse {
            0%, 100% {
              opacity: 0.5;
            }
            50% {
              opacity: 0.75;
            }
          }
        `}
      </style>

      {/* Nebula layer 1 — faint blue haze, upper region, very slow drift */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 25% 20%, rgba(79, 124, 255, 0.07), transparent 60%)',
          animation: 'nebula-drift-1 90s ease-in-out infinite',
        }}
      />

      {/* Nebula layer 2 — faint white/blue haze, opposite corner, very slow drift */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 75% 60%, rgba(255, 255, 255, 0.035), transparent 65%)',
          animation: 'nebula-drift-2 110s ease-in-out infinite',
        }}
      />

      {/* Soft blue glow near bottom center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(79, 124, 255, 0.18), transparent 70%)',
          animation: 'glow-pulse 14s ease-in-out infinite',
        }}
      />

      {/* Vignette — draws focus toward the center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0, 0, 0, 0.55) 100%)',
        }}
      />

      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            filter: star.blur ? `blur(${star.blur}px)` : undefined,
            '--star-min-opacity': star.maxOpacity * 0.25,
            '--star-max-opacity': star.maxOpacity,
            animation: `star-twinkle ${star.duration}s ease-in-out infinite`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export default StarField