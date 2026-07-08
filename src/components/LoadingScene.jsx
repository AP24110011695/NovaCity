import { useEffect, useRef, useState } from 'react'

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const TOTAL_DURATION = 3200 // ms, approximate total fake-load time
const COMPLETE_HOLD = 500 // ms, pause at 100% before notifying parent

/**
 * LoadingScene
 * Premium loading experience: black background, animated circular
 * progress loader (0 -> 100), rotating outer ring, status text and
 * subtitle. Calls onComplete once progress reaches 100 and briefly holds.
 */
const LoadingScene = ({ onComplete }) => {
  const [progress, setProgress] = useState(0)
  const startTimeRef = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    const tick = (timestamp) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const ratio = Math.min(elapsed / TOTAL_DURATION, 1)

      // Ease-out curve so progress feels organic, not linear.
      const eased = 1 - Math.pow(1 - ratio, 2)
      setProgress(Math.round(eased * 100))

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
          @keyframes loader-glow {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.7; }
          }
        `}
      </style>

      {/* Ambient glow behind loader */}
      <div
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(79, 124, 255, 0.18), transparent 70%)',
          filter: 'blur(30px)',
          animation: 'loader-glow 6s ease-in-out infinite',
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
                filter: 'drop-shadow(0 0 6px rgba(79, 124, 255, 0.5))',
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

        <p className="mt-10 text-xs font-light tracking-[0.4em] text-white/50">
          INITIALIZING NOVA CITY...
        </p>

        <p className="mt-3 text-[10px] font-light tracking-[0.3em] text-white/30">
          Preparing planetary systems...
        </p>
      </div>
    </div>
  )
}

export default LoadingScene