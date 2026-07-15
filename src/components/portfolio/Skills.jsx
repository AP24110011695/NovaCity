import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { skills } from '../../data/profile'
import SectionHeading from './SectionHeading'

const NOVA_EASE = [0.22, 0.68, 0.35, 1]

/* Category accent colours — subtle palette variants all anchored to the Nova blue */
const CATEGORY_COLORS = [
  { border: 'rgba(79,124,255,0.22)',  glow: 'rgba(79,124,255,0.07)',  tag: 'rgba(79,124,255,0.12)',  tagHover: 'rgba(79,124,255,0.2)',  text: '#6B93FF' },
  { border: 'rgba(100,148,255,0.18)', glow: 'rgba(100,140,255,0.05)', tag: 'rgba(100,140,255,0.10)', tagHover: 'rgba(100,140,255,0.18)', text: '#7EA8FF' },
  { border: 'rgba(60,100,255,0.20)',  glow: 'rgba(60,100,255,0.06)',  tag: 'rgba(60,100,255,0.11)',  tagHover: 'rgba(60,100,255,0.2)',   text: '#5A82FF' },
  { border: 'rgba(79,124,255,0.16)',  glow: 'rgba(79,124,255,0.04)',  tag: 'rgba(79,124,255,0.09)',  tagHover: 'rgba(79,124,255,0.17)',  text: '#6B93FF' },
]

export default function Skills() {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const gridX = useTransform(scrollYProgress, [0, 1], ['0%', '-7%'])

  const entries = Object.entries(skills)

  return (
    <section
      id="skills"
      ref={sectionRef}
      className="relative overflow-hidden px-5 py-24 text-white sm:px-6 sm:py-28"
    >
      {/* ── Atmospheric background ── */}
      <motion.div
        style={{ x: gridX }}
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      >
        {/* Diagonal scan-line grid */}
        <div
          className="absolute inset-0 opacity-[0.028]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(79,124,255,0.7) 0px, rgba(79,124,255,0.7) 1px, transparent 1px, transparent 60px)',
          }}
        />
      </motion.div>

      {/* Left accent orb */}
      <div
        className="pointer-events-none absolute -left-48 top-1/2 -z-10 h-[500px] w-[500px] -translate-y-1/2 rounded-full blur-[100px]"
        style={{ background: 'rgba(79,124,255,0.045)' }}
        aria-hidden
      />

      <div className="mx-auto max-w-6xl">
        <SectionHeading label="Technology Stack" title="Skills & Expertise" />

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: NOVA_EASE }}
          className="mt-4 text-[11px] uppercase tracking-[0.4em] text-gray-500"
        >
          Nova City · Engineering District
        </motion.p>

        <div className="mt-11 grid gap-5 md:grid-cols-2">
          {entries.map(([title, list], catIdx) => {
            const color = CATEGORY_COLORS[catIdx % CATEGORY_COLORS.length]
            return (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.62,
                  delay: 0.08 + catIdx * 0.1,
                  ease: NOVA_EASE,
                }}
                className="group relative overflow-hidden rounded-2xl border bg-[rgba(8,10,16,0.45)] p-6 backdrop-blur-md transition-shadow duration-350 hover:shadow-[0_4px_32px_rgba(79,124,255,0.09)]"
                style={{ borderColor: color.border }}
              >
                {/* Interior glow on hover */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle at 10% 10%, ${color.glow} 0%, transparent 55%)` }}
                />

                {/* Category header */}
                <div className="mb-5 flex items-center gap-3">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ background: color.text, boxShadow: `0 0 7px ${color.text}` }}
                  />
                  <h3
                    className="text-[10.5px] font-semibold uppercase tracking-[0.4em]"
                    style={{ color: color.text }}
                  >
                    {title}
                  </h3>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {list.map((item, i) => (
                    <motion.span
                      key={item}
                      initial={{ opacity: 0, scale: 0.86 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.32,
                        delay: 0.14 + catIdx * 0.07 + i * 0.03,
                        ease: NOVA_EASE,
                      }}
                      whileHover={{ scale: 1.06, transition: { duration: 0.15 } }}
                      className="cursor-default rounded-lg border px-3 py-1.5 text-[12px] font-medium tracking-wide transition-all duration-200"
                      style={{
                        borderColor: color.border,
                        background: color.tag,
                        color: color.text,
                      }}
                    >
                      {item}
                    </motion.span>
                  ))}
                </div>

                {/* Bottom scan line */}
                <div
                  className="pointer-events-none absolute bottom-0 left-0 right-0 h-px opacity-0 transition-opacity duration-350 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${color.text}70, transparent)`,
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