import { useEffect, useRef, useState, useMemo } from 'react'

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const TOTAL_DURATION = 4000
const COMPLETE_HOLD  = 500

const STATUS_MESSAGES = [
  { text: 'Initializing Core Systems...',   at: 0    },
  { text: 'Calibrating Navigation...',      at: 0.14 },
  { text: 'Mapping Stellar Coordinates...', at: 0.28 },
  { text: 'Synchronizing Orbital Data...',  at: 0.45 },
  { text: 'Engaging Warp Trajectory...',    at: 0.62 },
  { text: 'Final System Verification...',   at: 0.80 },
  { text: 'Mission Ready.',                 at: 0.97 },
]

const GLOW_MILESTONES = [25, 50, 75, 100]

const PARTICLE_COUNT = 22
const random = (min, max) => Math.random() * (max - min) + min

const generateParticles = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id:       i,
    top:      random(0, 100),
    left:     random(0, 100),
    size:     random(1, 2.2),
    opacity:  random(0.10, 0.30),
    duration: random(16, 30),
    delay:    random(0, 8),
    xDrift:   random(-16, 16),
  }))

/**
 * LoadingScene
 * Minimal premium loader: circular progress ring, status text,
 * floating particles, milestone glow pulses.
 * Removed waveform bars (looked like a DJ/audio visualizer, out of tone).
 */
const LoadingScene = ({ onComplete }) => {
  const [progress,          setProgress]          = useState(0)
  const [activeStatusIndex, setActiveStatusIndex] = useState(0)
  const [glowIntensity,     setGlowIntensity]     = useState(0.4)
  const startTimeRef       = useRef(null)
  const frameRef           = useRef(null)
  const lastMilestoneRef   = useRef(-1)

  const particles = useMemo(() => generateParticles(PARTICLE_COUNT), [])

  useEffect(() => {
    const tick = (timestamp) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const ratio   = Math.min(elapsed / TOTAL_DURATION, 1)
      const eased   = 1 - Math.pow(1 - ratio, 2.5)
      const cur     = Math.round(eased * 100)
      setProgress(cur)

      let newIndex = 0
      for (let i = STATUS_MESSAGES.length - 1; i >= 0; i--) {
        if (eased >= STATUS_MESSAGES[i].at) { newIndex = i; break }
      }
      setActiveStatusIndex(newIndex)

      for (const milestone of GLOW_MILESTONES) {
        if (cur >= milestone && lastMilestoneRef.current < milestone) {
          lastMilestoneRef.current = milestone
          setGlowIntensity(1.0)
          setTimeout(() => setGlowIntensity(0.4), 400)
        }
      }

      if (ratio < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setTimeout(() => onComplete?.(), COMPLETE_HOLD)
      }
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [onComplete])

  const dashOffset = CIRCUMFERENCE * (1 - progress / 100)

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#050608]">
      <style>{`
        @keyframes loader-rotate         { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes loader-rotate-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg);    } }
        @keyframes loading-scan-line {
          0%   { top: -2px; opacity: 0; }
          4%   { opacity: 0.6; }
          96%  { opacity: 0.6; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes loading-particle-float {
          0%,100% { transform: translate(0, 0); }
          50%     { transform: translate(var(--p-x, 10px), -12px); }
        }
        @keyframes status-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes outer-ring-2-rotate { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes loader-glow-pulse {
          0%,100% { opacity: 0.55; }
          50%     { opacity: 0.80; }
        }
      `}</style>

      {/* Scan line */}
      <div
        className="pointer-events-none absolute inset-x-0 z-[2]"
        style={{
          height: '1px',
          background: 'linear-gradient(90deg,transparent 8%,rgba(100,60,220,0.35) 30%,rgba(255,255,255,0.5) 50%,rgba(100,60,220,0.35) 70%,transparent 92%)',
          boxShadow: '0 0 10px 2px rgba(100,60,220,0.12)',
          animation: 'loading-scan-line 6s linear infinite',
        }}
      />

      {/* Particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-white"
            style={{
              top: `${p.top}%`, left: `${p.left}%`,
              width: `${p.size}px`, height: `${p.size}px`,
              opacity: p.opacity,
              '--p-x': `${p.xDrift}px`,
              animation: `loading-particle-float ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Ambient glow behind loader */}
      <div
        className="pointer-events-none absolute h-[400px] w-[400px] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(100,60,220,${0.10 + glowIntensity * 0.16}), transparent 70%)`,
          filter: `blur(${28 - glowIntensity * 7}px)`,
          transform: `scale(${1 + glowIntensity * 0.12})`,
          transition: 'all 0.4s ease-out',
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Ring loader */}
        <div className="relative h-32 w-32">
          {/* Outer dashed decorative ring */}
          <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full"
            style={{ animation: 'loader-rotate 14s linear infinite' }}>
            <circle cx="64" cy="64" r="60" fill="none"
              stroke="rgba(100,60,220,0.18)" strokeWidth="1" strokeDasharray="2 10" />
          </svg>
          {/* Counter-rotating faint ring */}
          <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full"
            style={{ animation: 'outer-ring-2-rotate 22s linear infinite' }}>
            <circle cx="64" cy="64" r="63" fill="none"
              stroke="rgba(79,124,255,0.09)" strokeWidth="0.5" strokeDasharray="5 16" />
          </svg>
          {/* Progress ring */}
          <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="64" cy="64" r={RADIUS} fill="none"
              stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
            <circle cx="64" cy="64" r={RADIUS} fill="none"
              stroke="#7040e0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{
                transition: 'stroke-dashoffset 0.15s linear',
                filter: `drop-shadow(0 0 ${5 + glowIntensity * 7}px rgba(100,60,220,${0.5 + glowIntensity * 0.35}))`,
              }}
            />
          </svg>
          {/* Percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-light tracking-widest text-white/90">{progress}%</span>
          </div>
        </div>

        {/* Label */}
        <p className="mt-10 text-xs font-light tracking-[0.42em] text-white/45">
          INITIALIZING NOVA CITY...
        </p>

        {/* Status message */}
        <div className="mt-3 flex h-5 items-center justify-center">
          <p
            key={activeStatusIndex}
            className="text-[10px] font-light tracking-[0.30em] text-white/28"
            style={{ animation: 'status-fade-in 0.6s ease-out forwards' }}
          >
            {STATUS_MESSAGES[activeStatusIndex].text}
          </p>
        </div>

        {/* Minimal coordinate display — replaces childish waveform bars */}
        <div className="mt-10 flex flex-col items-center gap-1 opacity-20">
          <p className="text-[9px] font-light tracking-[0.4em] text-white/60">
            {String(progress).padStart(3, '0')} / 100
          </p>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      </div>
    </div>
  )
}

export default LoadingScene