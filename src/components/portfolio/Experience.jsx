import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { experience } from '../../data/profile'
import SectionHeading from './SectionHeading'

const NOVA_EASE = [0.22, 0.68, 0.35, 1]

function TimelineItem({ item, index, isLast }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.65, delay: 0.1 + index * 0.12, ease: NOVA_EASE }}
      className="group relative pl-10 md:pl-14"
    >
      {/* Timeline dot */}
      <span
        className="absolute left-0 top-7 flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center rounded-full border border-[#4F7CFF]/50 bg-[rgba(8,10,16,0.9)]"
        style={{ boxShadow: '0 0 12px rgba(79,124,255,0.3)' }}
      >
        <span className="h-2 w-2 rounded-full bg-[#6B93FF]" />
      </span>

      {/* Connector line */}
      {!isLast && (
        <div
          className="absolute left-[10px] top-7 w-px"
          style={{
            height: 'calc(100% + 24px)',
            background:
              'linear-gradient(to bottom, rgba(79,124,255,0.35), rgba(79,124,255,0.08))',
          }}
        />
      )}

      {/* Card */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgba(8,10,16,0.45)] p-6 backdrop-blur-md transition-colors duration-300 group-hover:border-[#4F7CFF]/30 md:p-7">
        {/* Hover glow */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-[#4F7CFF]/[0.07] blur-3xl" />
        </div>

        {/* Header */}
        <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-bold leading-snug text-white md:text-xl">
              {item.title}
            </h3>
            <p className="mt-0.5 text-[13px] font-medium text-[#6B93FF]">
              {item.company}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 md:flex-col md:items-end">
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-gray-400">
              {item.year}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="my-4 h-px w-full bg-white/[0.06]" />

        {/* Description */}
        <p className="text-[14px] leading-7 text-gray-400">{item.desc}</p>

        {/* Bottom scan-line on hover */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(79,124,255,0.5), transparent)',
          }}
        />
      </div>
    </motion.div>
  )
}

export default function Experience() {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])

  return (
    <section
      id="experience"
      ref={sectionRef}
      className="relative overflow-hidden px-6 py-28 text-white"
    >
      {/* ── Atmospheric background ── */}
      <motion.div
        style={{ y: bgY }}
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      >
        {/* Vertical grid — suggests city elevation drawings */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(90deg, rgba(79,124,255,0.7) 1px, transparent 1px)',
            backgroundSize: '120px 100%',
          }}
        />
        {/* Right-side glow */}
        <div className="absolute -right-32 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-[#4F7CFF]/[0.04] blur-[100px]" />
      </motion.div>

      <div className="mx-auto max-w-4xl">
        <SectionHeading label="Career Timeline" title="Experience" />

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-4 text-[11px] uppercase tracking-[0.4em] text-gray-600"
        >
          Nova City · Career District
        </motion.p>

        <div className="relative mt-14">
          {experience.map((item, index) => (
            <TimelineItem
              key={item.title}
              item={item}
              index={index}
              isLast={index === experience.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}