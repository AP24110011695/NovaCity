import { useEffect, useRef, useState, useMemo } from 'react'

const RADIUS        = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const TOTAL_DURATION = 4200
const COMPLETE_HOLD  = 600

const STATUS_MESSAGES = [
  { text: 'Initializing Core Systems...',   at: 0    },
  { text: 'Calibrating Navigation...',      at: 0.13 },
  { text: 'Mapping Stellar Coordinates...', at: 0.27 },
  { text: 'Synchronizing Orbital Data...',  at: 0.44 },
  { text: 'Engaging Warp Trajectory...',    at: 0.61 },
  { text: 'Final System Verification...',   at: 0.80 },
  { text: 'Mission Ready.',                 at: 0.97 },
]

const GLOW_MILESTONES = [25, 50, 75, 100]
const STAR_COUNT = 120
const random = (min, max) => Math.random() * (max - min) + min

const generateStars = () =>
  Array.from({ length: STAR_COUNT }, (_, i) => ({
    id:       i,
    top:      random(0, 100),
    left:     random(0, 100),
    size:     random(0.8, 2.4),
    opacity:  random(0.08, 0.38),
    duration: random(3.5, 9),
    delay:    random(0, 6),
    color:    ['#ffffff', '#c8d8ff', '#ffe8a0', '#c0a8ff', '#ffc8a0'][Math.floor(Math.random() * 5)],
  }))

/**
 * LoadingScene — Phase 2 polish
 * Premium cinematic loader matching space aesthetic:
 *  • Multi-color star field backdrop (CSS, consistent with StarField component)
 *  • Drifting nebula hazes behind the ring
 *  • Two-layer progress ring: outer dashes + main arc
 *  • Animated corner brackets (HUD frame)
 *  • Subtle scan line
 *  • Nova-blue accent system throughout
 *  • Smooth milestone flare bursts
 */
const LoadingScene = ({ onComplete }) => {
  const [progress,          setProgress]          = useState(0)
  const [activeStatusIndex, setActiveStatusIndex] = useState(0)
  const [glowIntensity,     setGlowIntensity]     = useState(0.3)
  const [flareActive,       setFlareActive]        = useState(false)
  const startTimeRef       = useRef(null)
  const frameRef           = useRef(null)
  const lastMilestoneRef   = useRef(-1)
  const progressRef        = useRef(-1)
  const statusRef          = useRef(-1)

  const stars = useMemo(() => generateStars(), [])

  useEffect(() => {
    const timeoutIds = []
    const tick = (timestamp) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const ratio   = Math.min(elapsed / TOTAL_DURATION, 1)
      const eased   = 1 - Math.pow(1 - ratio, 2.5)
      const cur     = Math.round(eased * 100)
      if (cur !== progressRef.current) {
        progressRef.current = cur
        setProgress(cur)
      }

      let newIndex = 0
      for (let i = STATUS_MESSAGES.length - 1; i >= 0; i--) {
        if (eased >= STATUS_MESSAGES[i].at) { newIndex = i; break }
      }
      if (newIndex !== statusRef.current) {
        statusRef.current = newIndex
        setActiveStatusIndex(newIndex)
      }

      for (const milestone of GLOW_MILESTONES) {
        if (cur >= milestone && lastMilestoneRef.current < milestone) {
          lastMilestoneRef.current = milestone
          setGlowIntensity(1.0)
          setFlareActive(true)
          timeoutIds.push(window.setTimeout(() => { setGlowIntensity(0.3); setFlareActive(false) }, 500))
        }
      }

      if (ratio < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        timeoutIds.push(window.setTimeout(() => onComplete?.(), COMPLETE_HOLD))
      }
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      timeoutIds.forEach((id) => window.clearTimeout(id))
    }
  }, [onComplete])

  const dashOffset = CIRCUMFERENCE * (1 - progress / 100)

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#050608]" role="status" aria-live="polite" aria-label={`Nova City loading: ${progress}%`}>
      <style>{`
        @keyframes loader-rotate         { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes loader-rotate-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg);    } }
        @keyframes loading-scan-line {
          0%   { top: -2px; opacity: 0; }
          4%   { opacity: 0.5; }
          96%  { opacity: 0.5; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes star-twinkle {
          0%,100% { opacity: var(--so-min); transform: scale(0.85); }
          50%     { opacity: var(--so-max); transform: scale(1.15); }
        }
        @keyframes status-fade-in {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nebula-drift-a {
          0%,100% { transform: translate(-2%,-1%) scale(1);    }
          50%     { transform: translate(2%,2%) scale(1.06);   }
        }
        @keyframes nebula-drift-b {
          0%,100% { transform: translate(2%,2%) scale(1.04);   }
          50%     { transform: translate(-2%,-2%) scale(1);     }
        }
        @keyframes nebula-drift-c {
          0%,100% { transform: translate(1%,-2%) scale(1.02);  }
          50%     { transform: translate(-1%,2%) scale(1.05);  }
        }
        @keyframes flare-burst {
          0%   { opacity: 0;   transform: translate(-50%,-50%) scale(0.6); }
          25%  { opacity: 0.9; transform: translate(-50%,-50%) scale(1.4); }
          100% { opacity: 0;   transform: translate(-50%,-50%) scale(1.9); }
        }
        @keyframes corner-tl {
          from { opacity: 0; transform: translate(-6px, -6px); }
          to   { opacity: 1; transform: translate(0, 0); }
        }
        @keyframes corner-br {
          from { opacity: 0; transform: translate(6px, 6px); }
          to   { opacity: 1; transform: translate(0, 0); }
        }
        @keyframes hud-glow {
          0%,100% { opacity: 0.30; }
          50%     { opacity: 0.55; }
        }
      `}</style>

      {/* ── Background stars ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {stars.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full"
            style={{
              top:            `${s.top}%`,
              left:           `${s.left}%`,
              width:          `${s.size}px`,
              height:         `${s.size}px`,
              backgroundColor: s.color,
              '--so-min':     s.opacity * 0.15,
              '--so-max':     s.opacity,
              animation:      `star-twinkle ${s.duration}s ease-in-out infinite`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* ── Nebula hazes ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* violet upper-left */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 65% 48% at 18% 20%, rgba(80,25,160,0.13), transparent 62%)',
          animation: 'nebula-drift-a 90s ease-in-out infinite',
        }} />
        {/* blue right */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 55% 42% at 80% 60%, rgba(20,55,160,0.10), transparent 62%)',
          animation: 'nebula-drift-b 115s ease-in-out infinite',
        }} />
        {/* nova-blue bottom accent */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 36% at 50% 108%, rgba(79,124,255,0.16), transparent 68%)',
          animation: 'hud-glow 14s ease-in-out infinite',
        }} />
        {/* warm amber lower */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 45% 30% at 44% 82%, rgba(90,45,8,0.07), transparent 65%)',
          animation: 'nebula-drift-c 130s ease-in-out infinite',
        }} />
      </div>

      {/* ── Scan line ── */}
      <div
        className="pointer-events-none absolute inset-x-0 z-[2]"
        style={{
          height: '1px',
          background: 'linear-gradient(90deg,transparent 5%,rgba(79,124,255,0.28) 28%,rgba(200,220,255,0.45) 50%,rgba(79,124,255,0.28) 72%,transparent 95%)',
          boxShadow: '0 0 12px 2px rgba(79,124,255,0.10)',
          animation: 'loading-scan-line 7s linear infinite',
        }}
      />

      {/* ── Ambient ring glow ── */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: '420px', height: '420px',
          background: `radial-gradient(circle, rgba(79,124,255,${0.08 + glowIntensity * 0.14}), transparent 70%)`,
          filter: `blur(${30 - glowIntensity * 8}px)`,
          transform: `translate(-50%,-50%) scale(${1 + glowIntensity * 0.1})`,
          left: '50%', top: '50%',
          transition: 'all 0.45s ease-out',
        }}
      />

      {/* ── Milestone flare burst ── */}
      {flareActive && (
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: '180px', height: '180px',
            background: 'radial-gradient(circle, rgba(140,180,255,0.55), rgba(79,124,255,0.15) 50%, transparent 70%)',
            filter: 'blur(4px)',
            left: '50%', top: '50%',
            animation: 'flare-burst 0.5s ease-out forwards',
          }}
        />
      )}

      {/* ── HUD corner brackets ── */}
      <div className="pointer-events-none absolute inset-0 z-[3]">
        {/* top-left */}
        <div style={{ position: 'absolute', top: 28, left: 28, animation: 'corner-tl 1.2s ease-out forwards' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M0 20 L0 0 L20 0" stroke="rgba(79,124,255,0.5)" strokeWidth="1.5"/>
          </svg>
        </div>
        {/* top-right */}
        <div style={{ position: 'absolute', top: 28, right: 28, animation: 'corner-br 1.2s ease-out forwards' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M32 20 L32 0 L12 0" stroke="rgba(79,124,255,0.5)" strokeWidth="1.5"/>
          </svg>
        </div>
        {/* bottom-left */}
        <div style={{ position: 'absolute', bottom: 28, left: 28, animation: 'corner-tl 1.2s ease-out forwards' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M0 12 L0 32 L20 32" stroke="rgba(79,124,255,0.5)" strokeWidth="1.5"/>
          </svg>
        </div>
        {/* bottom-right */}
        <div style={{ position: 'absolute', bottom: 28, right: 28, animation: 'corner-br 1.2s ease-out forwards' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M32 12 L32 32 L12 32" stroke="rgba(79,124,255,0.5)" strokeWidth="1.5"/>
          </svg>
        </div>
      </div>

      {/* ── Vignette ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 35%, rgba(0,0,0,0.65) 100%)' }}
      />

      {/* ── Main loader widget ── */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Progress ring */}
        <div className="relative h-36 w-36">
          {/* Outermost slow dashed ring */}
          <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full"
            style={{ animation: 'loader-rotate 18s linear infinite' }}>
            <circle cx="64" cy="64" r="61" fill="none"
              stroke="rgba(79,124,255,0.14)" strokeWidth="1" strokeDasharray="3 14" />
          </svg>
          {/* Counter-rotating accent ring */}
          <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full"
            style={{ animation: 'loader-rotate-reverse 28s linear infinite' }}>
            <circle cx="64" cy="64" r="63.5" fill="none"
              stroke="rgba(120,160,255,0.08)" strokeWidth="0.5" strokeDasharray="6 20" />
          </svg>
          {/* Second inner decorative ring */}
          <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full"
            style={{ animation: 'loader-rotate 10s linear infinite' }}>
            <circle cx="64" cy="64" r="48" fill="none"
              stroke="rgba(79,124,255,0.07)" strokeWidth="0.5" strokeDasharray="1 8" />
          </svg>
          {/* Progress arc */}
          <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="64" cy="64" r={RADIUS} fill="none"
              stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            <circle
              cx="64" cy="64" r={RADIUS}
              fill="none"
              stroke="url(#arcGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{
                transition: 'stroke-dashoffset 0.12s linear',
                filter: `drop-shadow(0 0 ${4 + glowIntensity * 8}px rgba(79,124,255,${0.45 + glowIntensity * 0.40}))`,
              }}
            />
            <defs>
              <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#6090ff" />
                <stop offset="100%" stopColor="#a0c0ff" />
              </linearGradient>
            </defs>
          </svg>
          {/* Centre percentage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-lg font-light tracking-widest text-white/90">{progress}%</span>
            <span className="text-[8px] font-light tracking-[0.35em] text-white/25">LOADING</span>
          </div>
        </div>

        {/* Title */}
        <p className="mt-8 text-[11px] font-light tracking-[0.52em] text-white/40">
          NOVA CITY
        </p>

        {/* Status message */}
        <div className="mt-2 flex h-5 items-center justify-center">
          <p
            key={activeStatusIndex}
            className="text-[10px] font-light tracking-[0.32em] text-white/30"
            style={{ animation: 'status-fade-in 0.65s ease-out forwards' }}
          >
            {STATUS_MESSAGES[activeStatusIndex].text}
          </p>
        </div>

        {/* Coordinate display */}
        <div className="mt-8 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-3 opacity-25">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#4F7CFF]/50" />
            <p className="text-[9px] font-light tracking-[0.44em] text-white/60">
              {String(progress).padStart(3, '0')} / 100
            </p>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#4F7CFF]/50" />
          </div>
          {/* Sub-label */}
          <p className="text-[8px] font-light tracking-[0.55em] text-white/15">
            INITIALIZING NOVA CITY
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoadingScene
