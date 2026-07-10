import { useEffect, useState } from 'react'
import EnterButton from './EnterButton'

const STORY_LINES = [
  { text: 'ANOMALY DETECTED — ORBITAL RING', at: 0, hold: 2200 },
  { text: 'DEBRIS FIELD CONVERGING', at: 2400, hold: 2000 },
  { text: 'ATMOSPHERIC DISTURBANCE INBOUND', at: 4800, hold: 2200 },
  { text: 'STRUCTURES EMERGING FROM IMPACT ZONE', at: 7400, hold: 2600 },
]

const DESCEND_DELAY = 10200

/**
 * PlanetScanner
 * Environmental storytelling — cinematic captions over the space scene.
 * No dashboard UI. Mission entry via a single DESCEND action.
 */
const PlanetScanner = ({ onEnterMission }) => {
  const [activeIndex, setActiveIndex] = useState(null)
  const [showDescend, setShowDescend] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)

  useEffect(() => {
    const timers = []

    STORY_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setActiveIndex(i), line.at))
      timers.push(
        setTimeout(() => {
          setActiveIndex((prev) => (prev === i ? null : prev))
        }, line.at + line.hold),
      )
    })

    timers.push(setTimeout(() => setShowDescend(true), DESCEND_DELAY))

    return () => timers.forEach(clearTimeout)
  }, [])

  const handleEnterMission = () => {
    if (hasEntered) return
    setHasEntered(true)
    onEnterMission?.()
  }

  return (
    <div className="pointer-events-none flex h-full w-full flex-col items-center justify-end px-6 pb-20 sm:pb-24">
      <style>
        {`
          @keyframes story-caption-in {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes descend-fade-in {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      <div className="mb-10 min-h-[2rem] text-center">
        {STORY_LINES.map((line, i) => (
          <p
            key={line.text}
            className="text-xs font-light tracking-[0.38em] text-white/65 sm:text-sm"
            style={{
              display: activeIndex === i ? 'block' : 'none',
              animation: 'story-caption-in 1s ease-out forwards',
            }}
          >
            {line.text}
          </p>
        ))}
      </div>

      {showDescend && (
        <div
          className="pointer-events-auto"
          style={{ animation: 'descend-fade-in 1.2s ease-out forwards' }}
        >
          <EnterButton onClick={handleEnterMission}>
            {hasEntered ? 'DESCENDING...' : 'DESCEND'}
          </EnterButton>
        </div>
      )}
    </div>
  )
}

export default PlanetScanner
