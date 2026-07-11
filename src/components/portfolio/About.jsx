import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { aboutCards, profile } from '../../data/profile'
import SectionHeading from './SectionHeading'

const NOVA_EASE = [0.22, 0.68, 0.35, 1]

/* Icon map — extend to match your aboutCards titles */
const CARD_ICONS = {
  Location: '📡',
  Education: '🏛',
  Interests: '⚡',
  Status: '🛰',
  Focus: '🔭',
  default: '◈',
}

export default function About() {
  const sectionRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  /* Subtle parallax on the background grid */
  const gridY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  /* Accent orb drifts upward as you scroll */
  const orbY = useTransform(scrollYProgress, [0, 1], ['10%', '-20%'])

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative overflow-hidden px-6 py-28 text-white"
    >
      {/* ── Atmospheric background ── */}
      <motion.div
        style={{ y: gridY }}
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      >
        {/* City-grid lines */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(79,124,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(79,124,255,0.8) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
        {/* Soft horizon glow */}
        <div className="absolute bottom-0 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-[#4F7CFF]/[0.05] blur-[80px]" />
      </motion.div>

      {/* Floating accent orb */}
      <motion.div
        style={{ y: orbY }}
        className="pointer-events-none absolute right-0 top-0 -z-10 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/4 rounded-full bg-[#4F7CFF]/[0.04] blur-[100px]"
        aria-hidden
      />

      <div className="mx-auto max-w-6xl">
        <SectionHeading label="Citizen Profile" title="About Me" />

        {/* Bio block */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.75, delay: 0.12, ease: NOVA_EASE }}
          className="mt-8 max-w-3xl text-[1.0625rem] leading-8 text-gray-300/90"
        >
          I&apos;m{' '}
          <span className="font-semibold text-white">{profile.name}</span>, a
          Computer Science undergraduate passionate about Full Stack Development,
          Artificial Intelligence, and immersive web experiences. I build modern
          applications that combine clean UI, scalable architecture, and
          interactive 3D worlds.
        </motion.p>

        {/* Cards grid */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {aboutCards.map((card, index) => {
            const icon = CARD_ICONS[card.title] ?? CARD_ICONS.default
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.6,
                  delay: 0.1 + index * 0.1,
                  ease: NOVA_EASE,
                }}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgba(8,10,16,0.45)] p-6 backdrop-blur-md transition-colors duration-300 hover:border-[#4F7CFF]/30"
              >
                {/* Hover glow */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#4F7CFF]/10 blur-2xl" />
                </div>

                {/* Top accent bar */}
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#4F7CFF]/20 bg-[rgba(79,124,255,0.08)] text-lg">
                    {icon}
                  </span>
                  <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#6B93FF]">
                    {card.title}
                  </p>
                </div>

                <p className="text-sm leading-6 text-gray-300">{card.value}</p>

                {/* Bottom grid line decoration */}
                <div
                  className="pointer-events-none absolute bottom-0 left-0 right-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(79,124,255,0.5), transparent)',
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