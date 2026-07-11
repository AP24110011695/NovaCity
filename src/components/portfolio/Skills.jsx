import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { skills } from '../../data/profile'
import SectionHeading from './SectionHeading'

const NOVA_EASE = [0.22, 0.68, 0.35, 1]

/* Category accent colours — cycles through Nova-palette variants */
const CATEGORY_COLORS = [
  { border: 'rgba(79,124,255,0.25)',  glow: 'rgba(79,124,255,0.08)',  tag: 'rgba(79,124,255,0.14)',  text: '#6B93FF' },
  { border: 'rgba(120,160,255,0.20)', glow: 'rgba(100,140,255,0.06)', tag: 'rgba(100,140,255,0.12)', text: '#7EA8FF' },
  { border: 'rgba(60,100,255,0.22)',  glow: 'rgba(60,100,255,0.07)',  tag: 'rgba(60,100,255,0.13)',  text: '#5A82FF' },
  { border: 'rgba(79,124,255,0.18)',  glow: 'rgba(79,124,255,0.05)',  tag: 'rgba(79,124,255,0.10)',  text: '#6B93FF' },
]

export default function Skills() {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const gridX = useTransform(scrollYProgress, [0, 1], ['0%', '-8%'])

  const entries = Object.entries(skills)

  return (
    <section
      id="skills"
      ref={sectionRef}
      className="relative overflow-hidden px-6 py-28 text-white"
    >
      {/* ── Atmospheric background ── */}
      <motion.div
        style={{ x: gridX }}
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      >
        {/* Diagonal scan-line grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(79,124,255,0.7) 0px, rgba(79,124,255,0.7) 1px, transparent 1px, transparent 60px)',
          }}
        />
      </motion.div>

      {/* Left accent orb */}
      <div
        className="pointer-events-none absolute -left-48 top-1/2 -z-10 h-[500px] w-[500px] -translate-y-1/2 rounded-full blur-[100px]"
        style={{ background: 'rgba(79,124,255,0.05)' }}
        aria-hidden
      />

      <div className="mx-auto max-w-6xl">
        <SectionHeading label="Technology Stack" title="Skills & Expertise" />

        {/* District label row */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: NOVA_EASE }}
          className="mt-4 text-[11px] uppercase tracking-[0.4em] text-gray-500"
        >
          Nova City · Engineering District
        </motion.p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {entries.map(([title, list], catIdx) => {
            const color = CATEGORY_COLORS[catIdx % CATEGORY_COLORS.length]
            return (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.65,
                  delay: 0.08 + catIdx * 0.1,
                  ease: NOVA_EASE,
                }}
                className="group relative overflow-hidden rounded-2xl border bg-[rgba(8,10,16,0.45)] p-6 backdrop-blur-md transition-colors duration-300"
                style={{ borderColor: color.border }}
              >
                {/* Interior glow on hover */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle at 10% 10%, ${color.glow} 0%, transparent 60%)` }}
                />

                {/* Category header */}
                <div className="mb-6 flex items-center gap-3">
                  {/* Animated dot */}
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: color.text, boxShadow: `0 0 8px ${color.text}` }}
                  />
                  <h3
                    className="text-[11px] font-semibold uppercase tracking-[0.4em]"
                    style={{ color: color.text }}
                  >
                    {title}
                  </h3>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2.5">
                  {list.map((item, i) => (
                    <motion.span
                      key={item}
                      initial={{ opacity: 0, scale: 0.88 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.35,
                        delay: 0.15 + catIdx * 0.08 + i * 0.035,
                        ease: NOVA_EASE,
                      }}
                      whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
                      className="cursor-default rounded-lg border px-3.5 py-1.5 text-[12.5px] font-medium tracking-wide transition-colors duration-200"
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
                  className="pointer-events-none absolute bottom-0 left-0 right-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${color.text}80, transparent)`,
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