import EnterButton from "./EnterButton";
import StarField from "./StarField";
import { useEffect, useMemo, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// Sequential phases of the cinematic intro.
// 'black' -> 'transmission' -> 'year' -> 'earth' -> 'final'
const PHASE_TIMINGS = {
  toTransmission: 800,   // silence before "TRANSMISSION INCOMING"
  transmissionHold: 1400, // how long transmission text stays
  toYear: 2200,          // black screen before "YEAR 2178" appears (from transmission end)
  yearHold: 3000,        // how long "YEAR 2178" stays visible
  toEarth: 1200,         // fade-out gap before earth line appears
  earthHold: 3200,       // how long the earth line stays visible
  toFinal: 1400,         // fade-out gap before final reveal
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

const transmissionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 0.5,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.5, ease: 'easeIn' },
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

const IntroSequence = ({ onEnter }) => {
  const [phase, setPhase] = useState('black')
  const [titleSpacing, setTitleSpacing] = useState('0.60em')
  const titleRef = useRef(null)

  const dust = useMemo(() => generateDust(36), [])

  useEffect(() => {
    const timers = []

    // Transmission phase
    const t0 = PHASE_TIMINGS.toTransmission
    timers.push(setTimeout(() => setPhase('transmission'), t0))

    const t1 = t0 + PHASE_TIMINGS.transmissionHold
    timers.push(setTimeout(() => setPhase('transmission-out'), t1))

    // Year phase
    const t2 = t1 + PHASE_TIMINGS.toYear
    timers.push(setTimeout(() => setPhase('year'), t2))

    const t3 = t2 + PHASE_TIMINGS.yearHold
    timers.push(setTimeout(() => setPhase('year-out'), t3))

    // Earth phase
    const t4 = t3 + PHASE_TIMINGS.toEarth
    timers.push(setTimeout(() => setPhase('earth'), t4))

    const t5 = t4 + PHASE_TIMINGS.earthHold
    timers.push(setTimeout(() => setPhase('earth-out'), t5))

    // Final reveal
    const t6 = t5 + PHASE_TIMINGS.toFinal
    timers.push(setTimeout(() => setPhase('final'), t6))

    return () => timers.forEach(clearTimeout)
  }, [])

  // Animate title letter-spacing from ultra-wide to settled
  useEffect(() => {
    if (phase === 'final') {
      setTitleSpacing('0.60em')
      // Start wide, animate to settled
      requestAnimationFrame(() => {
        setTitleSpacing('0.22em')
      })
    }
  }, [phase])

  const isTransmissionVisible = phase === 'transmission'
  const isYearVisible = phase === 'year'
  const isEarthVisible = phase === 'earth'
  const isFinal = phase === 'final'

  // Compute beam width phase: starts narrow, widens as phases progress
  const beamPhase = (() => {
    switch (phase) {
      case 'black': return 0
      case 'transmission': case 'transmission-out': return 0.15
      case 'year': case 'year-out': return 0.35
      case 'earth': case 'earth-out': return 0.6
      case 'final': return 1
      default: return 0
    }
  })()

  const beamWidth = 1 + beamPhase * 2.5 // px: 1 → 3.5
  const beamGlowWidth = 60 + beamPhase * 80 // px: 60 → 140

  return (
      <section className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#050608]">
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

          @keyframes glow-breathe-dramatic {
            0%, 100% {
              opacity: 0.4;
              transform: translate(-50%, -50%) scale(1);
              filter: blur(40px);
            }
            35% {
              opacity: 0.85;
              transform: translate(-50%, -50%) scale(1.12);
              filter: blur(35px);
            }
            65% {
              opacity: 0.6;
              transform: translate(-50%, -50%) scale(1.05);
              filter: blur(42px);
            }
          }

          @keyframes scan-line-sweep {
            0% {
              top: -2px;
              opacity: 0;
            }
            5% {
              opacity: 1;
            }
            95% {
              opacity: 1;
            }
            100% {
              top: 100%;
              opacity: 0;
            }
          }

          @keyframes signal-flicker {
            0%, 100% { opacity: 1; }
            4% { opacity: 0.3; }
            6% { opacity: 1; }
            28% { opacity: 1; }
            30% { opacity: 0.15; }
            31% { opacity: 0.9; }
            32% { opacity: 0.2; }
            34% { opacity: 1; }
            60% { opacity: 1; }
            61% { opacity: 0.4; }
            62% { opacity: 1; }
            85% { opacity: 1; }
            86% { opacity: 0.25; }
            88% { opacity: 1; }
          }
        `}
      </style>

      {/* Scan-line sweep — thin bright horizontal line descending the screen */}
      <div
        className="pointer-events-none absolute inset-x-0 z-[5]"
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent 5%, rgba(79, 124, 255, 0.5) 30%, rgba(255, 255, 255, 0.7) 50%, rgba(79, 124, 255, 0.5) 70%, transparent 95%)',
          boxShadow: '0 0 12px 3px rgba(79, 124, 255, 0.2)',
          animation: 'scan-line-sweep 8s linear infinite',
        }}
      />

      {/* Animated light beam descending from the top — gradually widens */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[70%]"
        style={{
          width: `${beamWidth}px`,
          background:
            'linear-gradient(to bottom, rgba(79, 124, 255, 0.45), rgba(79, 124, 255, 0.08) 55%, transparent 100%)',
          filter: 'blur(1.5px)',
          transformOrigin: 'top center',
          animation: 'beam-drift 16s ease-in-out infinite',
          transition: 'width 2s ease-out',
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[45%] -translate-x-1/2"
        style={{
          width: `${beamGlowWidth}px`,
          background:
            'linear-gradient(to bottom, rgba(79, 124, 255, 0.12), transparent 100%)',
          filter: 'blur(18px)',
          transition: 'width 2s ease-out',
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

      {/* Cinematic radial glow behind the title — dramatic breathing */}
      {isFinal && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[920px] rounded-full"
          style={{
            background:
              'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(79, 124, 255, 0.28), rgba(79, 124, 255, 0.08) 40%, transparent 72%)',
            animation: 'glow-breathe-dramatic 7s ease-in-out infinite',
          }}
        />
      )}

      {/* Secondary wider glow layer for more depth during final */}
      {isFinal && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[1100px] rounded-full"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(79, 124, 255, 0.10), transparent 70%)',
            transform: 'translate(-50%, -50%)',
            filter: 'blur(50px)',
            animation: 'glow-breathe 12s ease-in-out infinite',
          }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <AnimatePresence mode="wait">
          {isTransmissionVisible && (
            <motion.p
              key="transmission"
              variants={transmissionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-[10px] font-light tracking-[0.5em] text-white/40 uppercase sm:text-xs"
            >
              Transmission Incoming
            </motion.p>
          )}

          {isYearVisible && (
            <motion.div
              key="year"
              variants={textVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center gap-3"
            >
              <p
                className="text-sm font-light tracking-[0.55em] text-white/70 sm:text-base md:text-lg"
                style={{
                  animation: 'signal-flicker 3s step-end 1 forwards',
                }}
              >
                YEAR 2178
              </p>
            </motion.div>
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
              ref={titleRef}
              initial="hidden"
              animate="visible"
              custom={0}
              variants={finalItemVariants}
              className="relative text-6xl font-semibold text-white antialiased sm:text-7xl md:text-9xl"
              style={{
                letterSpacing: titleSpacing,
                transition: 'letter-spacing 2.0s cubic-bezier(0.16, 1, 0.3, 1)',
                textShadow: '0 0 80px rgba(79, 124, 255, 0.3), 0 0 160px rgba(79, 124, 255, 0.1)',
              }}
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

            <motion.div
  initial="hidden"
  animate="visible"
  custom={1.6}
  variants={finalItemVariants}
>
  <EnterButton onClick={onEnter}>
  ENTER
</EnterButton>
</motion.div>
          </div>
        )}
      </div>
    </section>
  )
}

export default IntroSequence