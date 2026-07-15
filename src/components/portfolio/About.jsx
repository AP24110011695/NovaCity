import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { aboutCards, profile } from '../../data/profile'
import SectionHeading from './SectionHeading'

const NOVA_EASE = [0.22, 0.68, 0.35, 1]

const CARD_ICONS = {
  Location:  '📡',
  Education: '🏛',
  Interests: '⚡',
  Status:    '🛰',
  Focus:     '🔭',
  Mission:   '🎯',
  default:   '◈',
}

export default function About() {
  const sectionRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const gridY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const orbY  = useTransform(scrollYProgress, [0, 1], ['10%', '-18%'])

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative overflow-hidden px-5 py-24 text-white sm:px-6 sm:py-28"
    >
      {/* ── Atmospheric background ── */}
      <motion.div
        style={{ y: gridY }}
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-[0.032]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(79,124,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(79,124,255,0.8) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
        <div className="absolute bottom-0 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-[#4F7CFF]/[0.045] blur-[80px]" />
      </motion.div>

      {/* Floating accent orb */}
      <motion.div
        style={{ y: orbY }}
        className="pointer-events-none absolute right-0 top-0 -z-10 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/4 rounded-full bg-[#4F7CFF]/[0.038] blur-[100px]"
        aria-hidden
      />

      <div className="mx-auto max-w-6xl">
        <SectionHeading label="Citizen Profile" title="About Me" />

        {/* Bio block */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.72, delay: 0.12, ease: NOVA_EASE }}
          className="mt-7 max-w-3xl text-[15px] leading-[1.85] text-gray-300/88"
        >
          I&apos;m{' '}
          <span className="font-semibold text-white">{profile.name}</span>, a
          Computer Science undergraduate passionate about Full Stack Development,
          Artificial Intelligence, and immersive web experiences. I build modern
          applications that combine clean UI, scalable architecture, and
          interactive 3D worlds.
        </motion.p>

        {/* Cards grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3 sm:gap-5">
          {aboutCards.map((card, index) => {
            const icon = CARD_ICONS[card.title] ?? CARD_ICONS.default
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.58,
                  delay: 0.1 + index * 0.1,
                  ease: NOVA_EASE,
                }}
                whileHover={{ y: -4, transition: { duration: 0.22 } }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[rgba(8,10,16,0.45)] p-5 backdrop-blur-md transition-all duration-300 hover:border-[#4F7CFF]/28 hover:shadow-[0_4px_24px_rgba(79,124,255,0.1)] sm:p-6"
              >
                {/* Hover glow */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#4F7CFF]/[0.09] blur-2xl" />
                </div>

                {/* Top accent bar */}
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#4F7CFF]/18 bg-[rgba(79,124,255,0.07)] text-base sm:h-9 sm:w-9 sm:text-lg">
                    {icon}
                  </span>
                  <p className="text-[10px] font-medium uppercase tracking-[0.33em] text-[#6B93FF]">
                    {card.title}
                  </p>
                </div>

                <p className="text-[13.5px] leading-6 text-gray-300">{card.value}</p>

                {/* Bottom grid line decoration */}
                <div
                  className="pointer-events-none absolute bottom-0 left-0 right-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(79,124,255,0.45), transparent)',
                  }}
                />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}