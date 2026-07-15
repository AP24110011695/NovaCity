import { useEffect, useState } from 'react'
import EnterButton from './EnterButton'

// ─── Cinematic captions — no boxes, pure atmospheric text ─────────────────────
const CAPTIONS = [
  { text: 'NOVA CITY DETECTED',           at: 0,    hold: 2600 },
  { text: 'ORBITAL RING ESTABLISHED',     at: 3000, hold: 2400 },
  { text: 'ATMOSPHERIC ENTRY APPROVED',   at: 6000, hold: 2600 },
]

const DESCEND_DELAY = 9200

/**
 * PlanetScanner — Phase 1 rebuild
 * Purely atmospheric cinematic captions. No dashboard UI, no boxes, no borders.
 * Just text + a single DESCEND action that emerges when the moment is right.
 */
const PlanetScanner = ({ onEnterMission }) => {
  const [activeIndex, setActiveIndex] = useState(null)
  const [showDescend, setShowDescend] = useState(false)
  const [hasEntered,  setHasEntered]  = useState(false)

  useEffect(() => {
    const timers = []

    CAPTIONS.forEach((caption, i) => {
      timers.push(setTimeout(() => setActiveIndex(i), caption.at))
      timers.push(
        setTimeout(() => {
          setActiveIndex((prev) => (prev === i ? null : prev))
        }, caption.at + caption.hold),
      )
    })

    timers.push(setTimeout(() => setShowDescend(true), DESCEND_DELAY))

    return () => timers.forEach(clearTimeout)
  }, [])

  const handleEnter = () => {
    if (hasEntered) return
    setHasEntered(true)
    onEnterMission?.()
  }

  return (
    <>
      <style>{`
        @keyframes caption-rise {
          from { opacity: 0; transform: translateY(8px) ; letter-spacing: 0.5em; }
          to   { opacity: 1; transform: translateY(0px) ; letter-spacing: 0.45em; }
        }
        @keyframes caption-fall {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes descend-rise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes scanline-drift {
          from { top: -2px; }
          to   { top: 100%; }
        }
      `}</style>

      {/* Ambient scan line — very subtle, no HUD feel */}
      <div
        className="pointer-events-none absolute inset-x-0 z-0"
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent 10%, rgba(100,140,255,0.18) 35%, rgba(200,220,255,0.28) 50%, rgba(100,140,255,0.18) 65%, transparent 90%)',
          animation: 'scanline-drift 14s linear infinite',
        }}
      />

      {/* Captions — bottom-center, pure typography */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[22%] flex flex-col items-center gap-2">
        {CAPTIONS.map((caption, i) => (
          <div
            key={caption.text}
            style={{
              display: activeIndex === i ? 'block' : 'none',
              animation: activeIndex === i ? 'caption-rise 0.9s cubic-bezier(0.16,1,0.3,1) forwards' : undefined,
            }}
          >
            {/* Minimal accent line above text */}
            <div
              style={{
                width: 24,
                height: 1,
                background: 'rgba(120,160,255,0.4)',
                margin: '0 auto 8px',
              }}
            />
            <p
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                fontSize: 'clamp(9px, 1.5vw, 11px)',
                fontWeight: 300,
                letterSpacing: '0.45em',
                color: 'rgba(200,215,255,0.65)',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              {caption.text}
            </p>
          </div>
        ))}
      </div>

      {/* DESCEND button — appears when ready */}
      {showDescend && (
        <div
          className="pointer-events-auto absolute inset-x-0 bottom-[8%] flex flex-col items-center gap-5"
          style={{ animation: 'descend-rise 1.4s cubic-bezier(0.16,1,0.3,1) forwards', opacity: 0 }}
        >
          {/* Subtle separator */}
          <div
            style={{
              width: 40,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(100,140,255,0.3), transparent)',
            }}
          />
          <EnterButton onClick={handleEnter}>
            {hasEntered ? 'DESCENDING...' : 'DESCEND'}
          </EnterButton>
        </div>
      )}
    </>
  )
}

export default PlanetScanner