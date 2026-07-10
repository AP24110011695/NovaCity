import { motion } from 'framer-motion'
import { FaExternalLinkAlt, FaGithub } from 'react-icons/fa'
import { projects } from '../../data/profile'
import SectionHeading from './SectionHeading'

export default function Projects() {
  return (
    <section id="projects" className="px-6 py-24 text-white">
      <div className="mx-auto max-w-6xl">
        <SectionHeading label="Research District" title="Projects" />

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <motion.article
              key={project.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`flex flex-col rounded-xl border bg-[rgba(8,10,16,0.25)] p-6 backdrop-blur-sm transition hover:border-[rgba(79,124,255,0.4)] ${
                project.featured
                  ? 'border-[rgba(79,124,255,0.25)] md:col-span-2 lg:col-span-1'
                  : 'border-white/10'
              }`}
            >
              {project.featured && (
                <span className="mb-3 w-fit rounded-full bg-[rgba(79,124,255,0.15)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#6B93FF]">
                  Flagship Project
                </span>
              )}

              <h3 className="mb-3 text-2xl font-semibold">{project.title}</h3>
              <p className="mb-4 text-sm text-[#6B93FF]">{project.tech}</p>
              <p className="mb-6 flex-1 text-gray-300">{project.desc}</p>

              <div className="flex flex-wrap gap-3">
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm transition hover:border-[#4F7CFF]/50 hover:text-[#6B93FF]"
                  >
                    <FaGithub />
                    GitHub
                  </a>
                )}
                {project.live && (
                  <a
                    href={project.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#4F7CFF] px-4 py-2 text-sm font-medium transition hover:bg-[#6B93FF]"
                  >
                    <FaExternalLinkAlt size={12} />
                    Live Demo
                  </a>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
