import StarField from "./StarField";
import SpaceBackground from "./SpaceBackground";
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// Sequential phases of the cinematic intro.
// 'black' -> 'year' -> 'earth' -> 'final'
const PHASE_TIMINGS = {
  toYear: 1500,   // black screen before "YEAR 2178" appears
  yearHold: 2000, // how long "YEAR 2178" stays visible
  toEarth: 800,   // fade-out gap before earth line appears
  earthHold: 2000, // how long the earth line stays visible
  toFinal: 800,   // fade-out gap before final reveal
}

const textVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
}

const finalItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 1.2, ease: [0.16, 1, 0.3, 1] },
  }),
}

// Soft floating dust motes — purely decorative, drift extremely slowly.
const random = (min, max) => Math.random() * (max - min) + min

const generateDust = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    top: random(0, 100),
    left: random(0, 100),
    size: random(1, 2.4),
    opacity: random(0.15, 0.4),
    duration: random(18, 34),
    delay: random(0, 10),
    xDrift: random(-20, 20),
  }))
}

const IntroSequence = () => {
  const [phase, setPhase] = useState('black')

  const dust = useMemo(() => generateDust(36), [])

  useEffect(() => {
    const timers = []

    timers.push(setTimeout(() => setPhase('year'), PHASE_TIMINGS.toYear))

    timers.push(
      setTimeout(
        () => setPhase('year-out'),
        PHASE_TIMINGS.toYear + PHASE_TIMINGS.yearHold
      )
    )

    timers.push(
      setTimeout(
        () => setPhase('earth'),
        PHASE_TIMINGS.toYear + PHASE_TIMINGS.yearHold + PHASE_TIMINGS.toEarth
      )
    )

    timers.push(
      setTimeout(
        () => setPhase('earth-out'),
        PHASE_TIMINGS.toYear +
          PHASE_TIMINGS.yearHold +
          PHASE_TIMINGS.toEarth +
          PHASE_TIMINGS.earthHold
      )
    )

    timers.push(
      setTimeout(
        () => setPhase('final'),
        PHASE_TIMINGS.toYear +
          PHASE_TIMINGS.yearHold +
          PHASE_TIMINGS.toEarth +
          PHASE_TIMINGS.earthHold +
          PHASE_TIMINGS.toFinal
      )
    )

    return () => timers.forEach(clearTimeout)
  }, [])

  const isYearVisible = phase === 'year'
  const isEarthVisible = phase === 'earth'
  const isFinal = phase === 'final'

  return (
      <section className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#050608]">
          {/* <SpaceBackground /> */}
          <StarField />
      <style>
        {`
          @keyframes beam-drift {
            0%, 100% {
              opacity: 0.35;
              transform: translateX(-50%) scaleY(1);
            }
            50% {
              opacity: 0.55;
              transform: translateX(-50%) scaleY(1.06);
            }
          }

          @keyframes dust-float {
            0% {
              transform: translate(0, 0);
            }
            50% {
              transform: translate(var(--dust-x, 10px), -14px);
            }
            100% {
              transform: translate(0, 0);
            }
          }

          @keyframes glow-breathe {
            0%, 100% {
              opacity: 0.5;
              transform: translate(-50%, -50%) scale(1);
            }
            50% {
              opacity: 0.75;
              transform: translate(-50%, -50%) scale(1.08);
            }
          }
        `}
      </style>

      {/* Animated light beam descending from the top of the screen */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[70%] w-[1px]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(79, 124, 255, 0.45), rgba(79, 124, 255, 0.08) 55%, transparent 100%)',
          filter: 'blur(1.5px)',
          transformOrigin: 'top center',
          animation: 'beam-drift 16s ease-in-out infinite',
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[45%] w-[60px] -translate-x-1/2"
        style={{
          background:
            'linear-gradient(to bottom, rgba(79, 124, 255, 0.12), transparent 100%)',
          filter: 'blur(18px)',
        }}
      />

      {/* Floating dust layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {dust.map((mote) => (
          <span
            key={mote.id}
            className="absolute rounded-full bg-white"
            style={{
              top: `${mote.top}%`,
              left: `${mote.left}%`,
              width: `${mote.size}px`,
              height: `${mote.size}px`,
              opacity: mote.opacity,
              '--dust-x': `${mote.xDrift}px`,
              animation: `dust-float ${mote.duration}s ease-in-out infinite`,
              animationDelay: `${mote.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Ambient base glow for overall depth */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.05)_0%,_transparent_60%)]" />

      {/* Cinematic radial glow behind the title, only during final phase */}
      {isFinal && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[820px] rounded-full"
          style={{
            background:
              'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(79, 124, 255, 0.22), rgba(79, 124, 255, 0.06) 45%, transparent 75%)',
            filter: 'blur(40px)',
            animation: 'glow-breathe 10s ease-in-out infinite',
          }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <AnimatePresence mode="wait">
          {isYearVisible && (
            <motion.p
              key="year"
              variants={textVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-sm font-light tracking-[0.55em] text-white/70 sm:text-base md:text-lg"
            >
              YEAR 2178
            </motion.p>
          )}

          {isEarthVisible && (
            <motion.p
              key="earth"
              variants={textVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="max-w-xl text-lg font-light tracking-[0.18em] text-white/70 sm:text-xl md:text-2xl"
            >
              EARTH COULD NO LONGER HOLD US.
            </motion.p>
          )}
        </AnimatePresence>

        {isFinal && (
          <div className="flex flex-col items-center">
            <motion.h1
              initial="hidden"
              animate="visible"
              custom={0}
              variants={finalItemVariants}
              className="relative text-6xl font-semibold tracking-[0.22em] text-white antialiased sm:text-7xl md:text-9xl"
              style={{ textShadow: '0 0 60px rgba(79, 124, 255, 0.25)' }}
            >
              NOVA CITY
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={0.8}
              variants={finalItemVariants}
              className="mt-8 max-w-md text-sm font-light leading-relaxed tracking-[0.32em] text-white/55 sm:text-base md:text-lg"
            >
              THE FIRST HUMAN CIVILIZATION BEYOND EARTH
            </motion.p>

            <motion.button
              initial="hidden"
              animate="visible"
              custom={1.6}
              variants={finalItemVariants}
              whileHover={{ borderColor: 'rgba(79, 124, 255, 0.5)' }}
              className="mt-16 rounded-full border border-white/15 bg-white/[0.04] px-12 py-3.5 text-xs font-medium tracking-[0.4em] text-white/90 backdrop-blur-md transition-all duration-500 hover:bg-white/[0.07]"
              style={{ boxShadow: '0 0 0 rgba(79, 124, 255, 0)' }}
            >
              ENTER
            </motion.button>
          </div>
        )}
      </div>
    </section>
  )
}

export default IntroSequence