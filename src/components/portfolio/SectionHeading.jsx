import { motion } from 'framer-motion'

const NOVA_EASE = [0.22, 0.68, 0.35, 1]

export default function SectionHeading({ label, title, align = 'left' }) {
  const isCenter = align === 'center'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: NOVA_EASE }}
      className={isCenter ? 'text-center' : ''}
    >
      <p
        className={`mb-3 text-xs uppercase tracking-[0.4em] text-[#6B93FF] ${
          isCenter ? 'mx-auto' : ''
        }`}
      >
        {label}
      </p>
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
    </motion.div>
  )
}
