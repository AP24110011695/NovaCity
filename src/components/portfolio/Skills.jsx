import { motion } from 'framer-motion'
import { skills } from '../../data/profile'
import SectionHeading from './SectionHeading'

export default function Skills() {
  return (
    <section id="skills" className="px-6 py-24 text-white">
      <div className="mx-auto max-w-6xl">
        <SectionHeading label="Technology Stack" title="Skills" />

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {Object.entries(skills).map(([title, list], index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
              className="rounded-xl border border-white/10 bg-[rgba(8,10,16,0.25)] p-6 backdrop-blur-sm"
            >
              <h3 className="mb-5 text-2xl font-semibold">{title}</h3>

              <div className="flex flex-wrap gap-3">
                {list.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-[rgba(79,124,255,0.15)] px-4 py-2 text-sm text-[#6B93FF]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
