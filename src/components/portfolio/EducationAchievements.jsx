import { motion } from 'framer-motion'
import { portfolioData } from '../../data/portfolio/portfolioData'
import SectionHeading from './SectionHeading'

const ease = [0.22, 0.68, 0.35, 1]

export function Education() {
  return <section id="education" className="journey-section relative px-5 py-24 sm:px-6 sm:py-28">
    <div className="journey-panel mx-auto max-w-5xl"><SectionHeading label="Knowledge Library" title="Education" />
      <div className="mt-10 grid gap-5 md:grid-cols-2">{portfolioData.education.map((item, index) => <motion.article key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.12, duration: 0.6, ease }} className="journey-card p-6">
        <p className="text-xs uppercase tracking-[.28em] text-[#6B93FF]">{item.duration}</p><h3 className="mt-3 text-xl font-semibold">{item.degree}</h3><p className="mt-2 text-sm text-white/60">{item.institution}</p><p className="mt-5 text-sm leading-7 text-white/70">{item.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">{item.coursework.map((course) => <span key={course} className="rounded-full border border-[#4F7CFF]/25 bg-[#4F7CFF]/10 px-3 py-1 text-xs text-blue-100/80">{course}</span>)}</div>
      </motion.article>)}</div>
    </div></section>
}

export function Achievements() {
  return <section id="achievements" className="journey-section relative px-5 py-14 sm:px-6 sm:py-16">
    <div className="journey-panel mx-auto max-w-5xl"><SectionHeading label="Achievement Hall" title="Achievements & Certificates" />
      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[...portfolioData.achievements, ...portfolioData.certifications].map((item, index) => <motion.article key={item.id} initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.08, duration: 0.55, ease }} className="journey-card p-4 sm:p-5">
        <p className="font-mono text-[10px] tracking-[.2em] text-[#6B93FF]">{item.date || item.completionDate}</p><h3 className="mt-2 text-[15px] font-semibold">{item.title}</h3><p className="mt-1.5 text-xs text-white/60">{item.issuer || 'NOVA CITY ARCHIVE'}</p><p className="mt-3 text-xs leading-5 text-white/70">{item.description}</p>
      </motion.article>)}</div>
    </div></section>
}
