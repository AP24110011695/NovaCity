import { motion } from 'framer-motion'
import { aboutCards, profile } from '../../data/profile'
import SectionHeading from './SectionHeading'

export default function About() {
  return (
    <section id="about" className="mx-auto max-w-6xl px-6 py-24 text-white">
      <SectionHeading label="Citizen Profile" title="About Me" />

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="mt-8 max-w-4xl text-lg leading-8 text-gray-300"
      >
        I&apos;m {profile.name}, a Computer Science undergraduate passionate about
        Full Stack Development, Artificial Intelligence, and immersive web
        experiences. I enjoy building modern applications that combine clean UI,
        scalable architecture, and interactive 3D experiences.
      </motion.p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {aboutCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="rounded-xl border border-white/10 bg-[rgba(8,10,16,0.25)] p-6 backdrop-blur-sm"
          >
            <h3 className="mb-2 text-xl font-semibold">{card.title}</h3>
            <p className="text-gray-300">{card.value}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
