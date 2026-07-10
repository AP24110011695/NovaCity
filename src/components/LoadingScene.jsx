import { useEffect, useRef, useState, useMemo } from 'react'

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const TOTAL_DURATION = 5000
const COMPLETE_HOLD = 600

const STATUS_MESSAGES = [
  { text: 'Initializing Core Systems...', at: 0 },
  { text: 'Calibrating Navigation...', at: 0.14 },
  { text: 'Mapping Stellar Coordinates...', at: 0.28 },
  { text: 'Synchronizing Orbital Data...', at: 0.45 },
  { text: 'Engaging Warp Trajectory...', at: 0.62 },
  { text: 'Final System Verification...', at: 0.80 },
  { text: 'Mission Ready.', at: 0.97 },
]

const GLOW_MILESTONES = [25, 50, 75, 100]

const PARTICLE_COUNT = 28
const random = (min, max) => Math.random() * (max - min) + min

const generateParticles = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    top: random(0, 100),
    left: random(0, 100),
    size: random(1, 2.2),
    opacity: random(0.12, 0.35),
    duration: random(16, 30),
    delay: random(0, 8),
    xDrift: random(-18, 18),
  }))

const WAVE_BAR_COUNT = 24

/**
 * LoadingScene
 * Premium loading experience: black background, animated circular
 * progress loader (0 -> 100), rotating outer ring, cycling status text,
 * scan-line sweep, floating particles, glow pulses at milestones,
 * and a waveform equalizer. Calls onComplete once progress reaches
 * 100 and briefly holds.
 */
const LoadingScene = ({ onComplete }) => {
  const [progress, setProgress] = useState(0)
  const [activeStatusIndex, setActiveStatusIndex] = useState(0)
  const [glowIntensity, setGlowIntensity] = useState(0.4)
  const startTimeRef = useRef(null)
  const frameRef = useRef(null)
  const lastMilestoneRef = useRef(-1)

  const particles = useMemo(() => generateParticles(PARTICLE_COUNT), [])

  const waveBars = useMemo(
    () =>
      Array.from({ length: WAVE_BAR_COUNT }, (_, i) => ({
        id: i,
        duration: random(0.6, 1.4),
        delay: random(0, 0.8),
        maxHeight: random(6, 18),
      })),
    []
  )

  useEffect(() => {
    const tick = (timestamp) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const ratio = Math.min(elapsed / TOTAL_DURATION, 1)

      // Ease-out curve so progress feels organic, not linear.
      const eased = 1 - Math.pow(1 - ratio, 2.5)
      const currentProgress = Math.round(eased * 100)
      setProgress(currentProgress)

      // Update status message based on progress ratio
      let newIndex = 0
      for (let i = STATUS_MESSAGES.length - 1; i >= 0; i--) {
        if (eased >= STATUS_MESSAGES[i].at) {
          newIndex = i
          break
        }
      }
      setActiveStatusIndex(newIndex)

      // Glow pulse at milestones
      for (const milestone of GLOW_MILESTONES) {
        if (currentProgress >= milestone && lastMilestoneRef.current < milestone) {
          lastMilestoneRef.current = milestone
          setGlowIntensity(1.0)
          setTimeout(() => setGlowIntensity(0.4), 400)
        }
      }

      if (ratio < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setTimeout(() => {
          onComplete?.()
        }, COMPLETE_HOLD)
      }
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [onComplete])

  const dashOffset = CIRCUMFERENCE * (1 - progress / 100)

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#050608]">
      <style>
        {`
          @keyframes loader-rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes loader-rotate-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          @keyframes loading-scan-line {
            0% {
              top: -2px;
              opacity: 0;
            }
            4% {
              opacity: 0.7;
            }
            96% {
              opacity: 0.7;
            }
            100% {
              top: 100%;
              opacity: 0;
            }
          }
          @keyframes loading-particle-float {
            0% {
              transform: translate(0, 0);
            }
            50% {
              transform: translate(var(--p-x, 10px), -12px);
            }
            100% {
              transform: translate(0, 0);
            }
          }
          @keyframes status-fade-in {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes wave-bar-pulse {
            0%, 100% {
              height: 2px;
              opacity: 0.3;
            }
            50% {
              height: var(--bar-h, 12px);
              opacity: 0.8;
            }
          }
          @keyframes outer-ring-2-rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(-360deg); }
          }
        `}
      </style>

      {/* Scan-line sweep */}
      <div
        className="pointer-events-none absolute inset-x-0 z-[2]"
        style={{
          height: '1px',
          background:
            'linear-gradient(90deg, transparent 8%, rgba(79, 124, 255, 0.35) 30%, rgba(255, 255, 255, 0.5) 50%, rgba(79, 124, 255, 0.35) 70%, transparent 92%)',
          boxShadow: '0 0 10px 2px rgba(79, 124, 255, 0.12)',
          animation: 'loading-scan-line 6s linear infinite',
        }}
      />

      {/* Floating particle layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-white"
            style={{
              top: `${p.top}%`,
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              '--p-x': `${p.xDrift}px`,
              animation: `loading-particle-float ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Ambient glow behind loader — pulses stronger at milestones */}
      <div
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(79, 124, 255, ${0.12 + glowIntensity * 0.18}), transparent 70%)`,
          filter: `blur(${30 - glowIntensity * 8}px)`,
          transform: `scale(${1 + glowIntensity * 0.15})`,
          transition: 'all 0.4s ease-out',
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative h-32 w-32">
          {/* Slowly rotating outer ring, purely decorative */}
          <svg
            viewBox="0 0 128 128"
            className="absolute inset-0 h-full w-full"
            style={{ animation: 'loader-rotate 12s linear infinite' }}
          >
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="none"
              stroke="rgba(79, 124, 255, 0.15)"
              strokeWidth="1"
              strokeDasharray="2 8"
            />
          </svg>

          {/* Second decorative ring — counter-rotating, wider dashes */}
          <svg
            viewBox="0 0 128 128"
            className="absolute inset-0 h-full w-full"
            style={{ animation: 'outer-ring-2-rotate 20s linear infinite' }}
          >
            <circle
              cx="64"
              cy="64"
              r="63"
              fill="none"
              stroke="rgba(79, 124, 255, 0.08)"
              strokeWidth="0.5"
              strokeDasharray="4 14"
            />
          </svg>

          {/* Progress ring */}
          <svg
            viewBox="0 0 128 128"
            className="absolute inset-0 h-full w-full -rotate-90"
          >
            <circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="2"
            />
            <circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke="#4F7CFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{
                transition: 'stroke-dashoffset 0.15s linear',
                filter: `drop-shadow(0 0 ${6 + glowIntensity * 6}px rgba(79, 124, 255, ${0.5 + glowIntensity * 0.3}))`,
              }}
            />
          </svg>

          {/* Percentage readout */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-light tracking-widest text-white/90">
              {progress}%
            </span>
          </div>
        </div>

        {/* Primary status label */}
        <p className="mt-10 text-xs font-light tracking-[0.4em] text-white/50">
          INITIALIZING NOVA CITY...
        </p>

        {/* Rotating system status messages */}
        <div className="mt-3 h-5 flex items-center justify-center">
          <p
            key={activeStatusIndex}
            className="text-[10px] font-light tracking-[0.3em] text-white/30"
            style={{
              animation: 'status-fade-in 0.6s ease-out forwards',
            }}
          >
            {STATUS_MESSAGES[activeStatusIndex].text}
          </p>
        </div>

        {/* Waveform equalizer bars */}
        <div
          className="mt-8 flex items-end justify-center gap-[3px]"
          style={{ height: '22px' }}
        >
          {waveBars.map((bar) => (
            <div
              key={bar.id}
              className="rounded-sm"
              style={{
                width: '2px',
                background: 'linear-gradient(to top, rgba(79, 124, 255, 0.6), rgba(79, 124, 255, 0.15))',
                '--bar-h': `${bar.maxHeight}px`,
                animation: `wave-bar-pulse ${bar.duration}s ease-in-out infinite`,
                animationDelay: `${bar.delay}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default LoadingScene