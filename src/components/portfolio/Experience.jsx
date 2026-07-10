import { motion } from 'framer-motion'
import { experience } from '../../data/profile'
import SectionHeading from './SectionHeading'

export default function Experience() {
  return (
    <section id="experience" className="px-6 py-24 text-white">
      <div className="mx-auto max-w-6xl">
        <SectionHeading label="Career Timeline" title="Experience" />

        <div className="relative mt-12 space-y-6">
          <div className="absolute bottom-0 left-[11px] top-0 hidden w-px bg-[rgba(79,124,255,0.2)] md:block" />

          {experience.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative rounded-xl border border-white/10 bg-[rgba(8,10,16,0.25)] p-6 backdrop-blur-sm md:pl-10"
            >
              <span className="absolute left-0 top-8 hidden h-3 w-3 -translate-x-1/2 rounded-full bg-[#4F7CFF] md:block" />

              <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                <div>
                  <h3 className="text-xl font-semibold md:text-2xl">{item.title}</h3>
                  <p className="text-[#6B93FF]">{item.company}</p>
                </div>
                <span className="text-sm text-gray-400 md:text-right">{item.year}</span>
              </div>

              <p className="mt-4 text-gray-300">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
