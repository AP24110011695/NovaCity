import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { FaExternalLinkAlt, FaGithub } from 'react-icons/fa'
import { projects } from '../../data/profile'
import SectionHeading from './SectionHeading'

const NOVA_EASE = [0.22, 0.68, 0.35, 1]

function ProjectCard({ project, index }) {
  const cardRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'center center'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [36, 0])

  return (
    <motion.article
      ref={cardRef}
      style={{ y }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: NOVA_EASE }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-[rgba(8,10,16,0.45)] backdrop-blur-md transition-all duration-350 hover:shadow-[0_8px_40px_rgba(79,124,255,0.12)] ${
        project.featured
          ? 'border-[rgba(79,124,255,0.28)] md:col-span-2 lg:col-span-1'
          : 'border-white/[0.07] hover:border-[#4F7CFF]/35'
      }`}
    >
      {/* Hover glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#4F7CFF]/[0.07] blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-[#4F7CFF]/[0.04] blur-2xl" />
      </div>

      {/* Top-edge accent line for featured */}
      {project.featured && (
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(79,124,255,0.75), transparent)',
          }}
        />
      )}

      <div className="flex flex-1 flex-col p-6 md:p-7">
        {/* Header row */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {project.featured && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#4F7CFF]/28 bg-[rgba(79,124,255,0.1)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#6B93FF]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#6B93FF]" />
                Flagship
              </span>
            )}
          </div>
          {/* Node index */}
          <span className="shrink-0 font-mono text-[11px] text-gray-600">
            //{String(index + 1).padStart(2, '0')}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-bold leading-tight tracking-tight text-white transition-colors duration-200 group-hover:text-white md:text-xl">
          {project.title}
        </h3>

        {/* Tech stack */}
        <p className="mb-1 text-[11px] uppercase tracking-[0.28em] text-[#6B93FF]">
          {project.tech}
        </p>

        {/* Divider */}
        <div className="my-4 h-px w-full bg-white/[0.05]" />

        {/* Description */}
        <p className="mb-6 flex-1 text-[13.5px] leading-[1.7] text-gray-400">
          {project.desc}
        </p>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.03] px-4 py-2 text-[12.5px] text-gray-300 transition-all duration-200 hover:border-[#4F7CFF]/48 hover:bg-[rgba(79,124,255,0.06)] hover:text-[#6B93FF]"
            >
              <FaGithub size={12} />
              Source
            </a>
          )}
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#4F7CFF]/85 px-4 py-2 text-[12.5px] font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-[#6B93FF] hover:shadow-[0_0_16px_rgba(79,124,255,0.4)]"
            >
              <FaExternalLinkAlt size={10} />
              Live Demo
            </a>
          )}
        </div>
      </div>

      {/* Bottom scan-line on hover */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-px opacity-0 transition-opacity duration-350 group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(79,124,255,0.48), transparent)',
        }}
      />
    </motion.article>
  )
}

export default function Projects() {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const gridY = useTransform(scrollYProgress, [0, 1], ['-4%', '9%'])

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="relative overflow-hidden px-5 py-24 text-white sm:px-6 sm:py-28"
    >
      {/* ── Atmospheric background ── */}
      <motion.div
        style={{ y: gridY }}
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      >
        {/* Dot-matrix city map */}
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(79,124,255,0.9) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        {/* Central glow */}
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4F7CFF]/[0.04] blur-[120px]" />
      </motion.div>

      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <SectionHeading label="Research District" title="Projects" />
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-1 text-[11px] uppercase tracking-[0.38em] text-gray-600"
          >
            {projects.length} active nodes
          </motion.p>
        </div>

        <div className="mt-11 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <ProjectCard key={project.title} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}