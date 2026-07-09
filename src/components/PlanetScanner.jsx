import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const PHASE_TIMINGS = {
  toSignal: 200,
  signalHold: 1400,
  toScanning: 500,
  scanningHold: 1600,
  toData: 500,
}

const DATA_ROWS = [
  { label: 'PLANET', value: 'UNKNOWN-01' },
  { label: 'ATMOSPHERE', value: 'BREATHABLE' },
  { label: 'GRAVITY', value: '0.97 G' },
  { label: 'POPULATION', value: '8.2 BILLION' },
  { label: 'STATUS', value: 'NOVA CITY DETECTED' },
]

const ROW_STAGGER = 550
const MISSION_DELAY_AFTER_ROWS = 700

const textVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  }),
}

const missionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  }),
}

/**
 * PlanetScanner
 * Spaceship-computer HUD scan sequence. Guards against double-triggering
 * onEnterMission (button disables itself visually after the first click),
 * since the parent begins an irreversible cinematic transition on call.
 */
const PlanetScanner = ({ onEnterMission }) => {
  const [phase, setPhase] = useState('idle')
  const [visibleRows, setVisibleRows] = useState(0)
  const [showMission, setShowMission] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)

  useEffect(() => {
    const timers = []

    timers.push(setTimeout(() => setPhase('signal'), PHASE_TIMINGS.toSignal))

    timers.push(
      setTimeout(() => setPhase('signal-out'), PHASE_TIMINGS.toSignal + PHASE_TIMINGS.signalHold)
    )

    timers.push(
      setTimeout(
        () => setPhase('scanning'),
        PHASE_TIMINGS.toSignal + PHASE_TIMINGS.signalHold + PHASE_TIMINGS.toScanning
      )
    )

    timers.push(
      setTimeout(
        () => setPhase('scanning-out'),
        PHASE_TIMINGS.toSignal +
          PHASE_TIMINGS.signalHold +
          PHASE_TIMINGS.toScanning +
          PHASE_TIMINGS.scanningHold
      )
    )

    const dataStart =
      PHASE_TIMINGS.toSignal +
      PHASE_TIMINGS.signalHold +
      PHASE_TIMINGS.toScanning +
      PHASE_TIMINGS.scanningHold +
      PHASE_TIMINGS.toData

    timers.push(setTimeout(() => setPhase('data'), dataStart))

    DATA_ROWS.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleRows((prev) => Math.max(prev, i + 1))
        }, dataStart + i * ROW_STAGGER)
      )
    })

    const missionStart = dataStart + DATA_ROWS.length * ROW_STAGGER + MISSION_DELAY_AFTER_ROWS
    timers.push(setTimeout(() => setShowMission(true), missionStart))

    return () => timers.forEach(clearTimeout)
  }, [])

  const handleEnterMission = () => {
    if (hasEntered) return
    setHasEntered(true)
    onEnterMission?.()
  }

  const isSignalVisible = phase === 'signal'
  const isScanningVisible = phase === 'scanning'

  return (
    <div className="pointer-events-none flex h-full w-full items-center justify-end px-6 sm:px-12 md:px-20">
      <div
        className="pointer-events-auto w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] px-7 py-8 backdrop-blur-xl"
        style={{
          boxShadow: '0 0 40px rgba(79, 124, 255, 0.08), inset 0 0 60px rgba(79, 124, 255, 0.03)',
        }}
      >
        <div className="mb-6 h-5">
          <AnimatePresence mode="wait">
            {isSignalVisible && (
              <motion.p
                key="signal"
                variants={textVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-xs font-medium tracking-[0.3em] text-white/80"
              >
                UNKNOWN SIGNAL DETECTED
              </motion.p>
            )}

            {isScanningVisible && (
              <motion.p
                key="scanning"
                variants={textVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-xs font-medium tracking-[0.3em] text-[#4F7CFF]"
              >
                SCANNING...
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-4">
          {DATA_ROWS.map((row, i) => (
            <motion.div
              key={row.label}
              custom={0}
              variants={rowVariants}
              initial="hidden"
              animate={i < visibleRows ? 'visible' : 'hidden'}
              className="flex items-baseline justify-between border-b border-white/[0.06] pb-3"
            >
              <span className="text-[10px] font-medium tracking-[0.25em] text-white/40">
                {row.label}
              </span>
              <span className="text-sm font-light tracking-[0.08em] text-white/90">
                {row.value}
              </span>
            </motion.div>
          ))}
        </div>

        {showMission && (
          <motion.button
            type="button"
            onClick={handleEnterMission}
            disabled={hasEntered}
            initial="hidden"
            animate="visible"
            custom={0}
            variants={missionVariants}
            className="group relative mt-8 w-full cursor-pointer rounded-full border border-white/20 bg-white/[0.05] py-3 text-xs font-medium tracking-[0.35em] text-white/90 backdrop-blur-md transition-all duration-[400ms] ease-out hover:border-white/40 hover:bg-white/[0.09] disabled:cursor-default disabled:opacity-50"
            style={{ boxShadow: '0 0 0 rgba(79, 124, 255, 0)' }}
            onMouseEnter={(e) => {
              if (hasEntered) return
              e.currentTarget.style.boxShadow = '0 0 22px rgba(79, 124, 255, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 rgba(79, 124, 255, 0)'
            }}
          >
            {hasEntered ? 'ENTERING...' : 'ENTER MISSION'}
          </motion.button>
        )}
      </div>
    </div>
  )
}

export default PlanetScanner