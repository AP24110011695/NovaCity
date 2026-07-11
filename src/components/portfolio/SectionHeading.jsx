import { motion } from 'framer-motion'

const NOVA_EASE = [0.22, 0.68, 0.35, 1]

/**
 * SectionHeading
 * Cinematic district-location marker. Each section in the portfolio is
 * treated as a physical district inside Nova City: a label (district name),
 * a title (landmark), an optional sector code, and a thin glowing underline.
 */
export default function SectionHeading({ label, title, align = 'left', sector }) {
  const isCenter = align === 'center'

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: NOVA_EASE }}
      className={isCenter ? 'text-center' : ''}
    >
      {/* District eyebrow */}
      <div className={`mb-3 flex items-center gap-3 ${isCenter ? 'justify-center' : ''}`}>
        {/* Leading tick mark */}
        {!isCenter && (
          <span
            className="inline-block h-3 w-[2px] rounded-full bg-[#4F7CFF]"
            style={{ boxShadow: '0 0 6px 1px rgba(79,124,255,0.6)' }}
          />
        )}
        <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-[#6B93FF]">
          {label}
        </p>
        {sector && (
          <span className="font-mono text-[9px] tracking-widest text-[#4F7CFF]/40">
            · {sector}
          </span>
        )}
      </div>

      {/* Title */}
      <h2
        className="text-3xl font-bold tracking-tight text-white md:text-4xl"
        style={{ textShadow: '0 0 40px rgba(79,124,255,0.12)' }}
      >
        {title}
      </h2>

      {/* Glowing underline */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.2, ease: NOVA_EASE }}
        className={`mt-4 h-px ${isCenter ? 'mx-auto w-24' : 'w-16'}`}
        style={{
          background: 'linear-gradient(to right, #4F7CFF, rgba(79,124,255,0.15))',
          transformOrigin: isCenter ? 'center' : 'left',
          boxShadow: '0 0 8px 1px rgba(79,124,255,0.35)',
        }}
      />
    </motion.div>
  )
}