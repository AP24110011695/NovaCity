import { motion } from 'framer-motion'

const NOVA_EASE = [0.22, 0.68, 0.35, 1]

/**
 * SectionHeading
 * Cinematic district-location marker. Each section in the portfolio is
 * treated as a physical district inside Nova City.
 */
export default function SectionHeading({ label, title, align = 'left', sector }) {
  const isCenter = align === 'center'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.75, ease: NOVA_EASE }}
      className={isCenter ? 'text-center' : ''}
    >
      {/* District eyebrow */}
      <div className={`mb-3 flex items-center gap-3 ${isCenter ? 'justify-center' : ''}`}>
        {/* Leading tick mark */}
        {!isCenter && (
          <span
            className="inline-block h-3 w-[2px] shrink-0 rounded-full bg-[#4F7CFF]"
            style={{ boxShadow: '0 0 5px 1px rgba(79,124,255,0.55)' }}
          />
        )}
        <p className="font-mono text-[10px] uppercase tracking-[0.44em] text-[#6B93FF]">
          {label}
        </p>
        {sector && (
          <span className="font-mono text-[9px] tracking-widest text-[#4F7CFF]/38">
            · {sector}
          </span>
        )}
      </div>

      {/* Title */}
      <h2
        className="font-bold tracking-tight text-white"
        style={{
          fontSize: 'clamp(1.65rem, 3vw, 2.5rem)',
          lineHeight: 1.15,
          textShadow: '0 0 40px rgba(79,124,255,0.1)',
        }}
      >
        {title}
      </h2>

      {/* Glowing underline */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.85, delay: 0.18, ease: NOVA_EASE }}
        className={`mt-4 h-px ${isCenter ? 'mx-auto w-20' : 'w-14'}`}
        style={{
          background: 'linear-gradient(to right, #4F7CFF, rgba(79,124,255,0.12))',
          transformOrigin: isCenter ? 'center' : 'left',
          boxShadow: '0 0 7px 1px rgba(79,124,255,0.3)',
        }}
      />
    </motion.div>
  )
}