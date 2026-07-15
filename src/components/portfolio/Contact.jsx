import { useRef, useState } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { FaGithub, FaLinkedin } from 'react-icons/fa'
import { HiOutlineMail } from 'react-icons/hi'
import { profile } from '../../data/profile'
import SectionHeading from './SectionHeading'

const NOVA_EASE = [0.22, 0.68, 0.35, 1]

const CHANNELS = [
  {
    href: (p) => `mailto:${p.email}`,
    Icon: HiOutlineMail,
    label: 'Direct Signal',
    value: (p) => p.email,
    size: 18,
  },
  {
    href: (p) => p.github,
    Icon: FaGithub,
    label: 'Source Hub',
    value: () => 'GitHub',
    size: 16,
    external: true,
  },
  {
    href: (p) => p.linkedin,
    Icon: FaLinkedin,
    label: 'Network Node',
    value: () => 'LinkedIn',
    size: 16,
    external: true,
  },
]

function TerminalInput({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.3em] text-gray-500">
        <span className="h-px w-3.5 bg-[#4F7CFF]/38" />
        {label}
      </span>
      {children}
    </label>
  )
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const sectionRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const orbY = useTransform(scrollYProgress, [0, 1], ['10%', '-15%'])

  const handleSubmit = (e) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Nova City — Message from ${form.name}`)
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`,
    )
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`
    setSubmitted(true)
  }

  const sharedInputClass =
    'w-full rounded-xl border border-white/[0.07] bg-[rgba(8,10,16,0.6)] px-4 py-3 text-sm text-white placeholder-gray-600/80 outline-none transition-all duration-200 focus:border-[#4F7CFF]/55 focus:bg-[rgba(8,10,16,0.82)] focus:shadow-[0_0_0_3px_rgba(79,124,255,0.08)]'

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative overflow-hidden px-5 py-24 text-white sm:px-6 sm:py-28"
    >
      {/* ── Atmospheric background ── */}
      <motion.div
        style={{ y: orbY }}
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(79,124,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(79,124,255,0.7) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4F7CFF]/[0.055] blur-[120px]" />
      </motion.div>

      <div className="mx-auto max-w-4xl">
        <SectionHeading label="Communication Terminal" title="Contact" align="center" />

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.12, ease: NOVA_EASE }}
          className="mx-auto mt-5 max-w-xl text-center text-[14.5px] leading-7 text-gray-400"
        >
          Establish a connection with Nova City. Whether it&apos;s collaboration,
          opportunities, or a conversation about technology — the terminal is open.
        </motion.p>

        {/* Channel links */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.22, ease: NOVA_EASE }}
          className="mt-10 flex flex-wrap justify-center gap-3"
        >
          {CHANNELS.map(({ href, Icon, label, value, size, external }) => (
            <a
              key={label}
              href={href(profile)}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="group inline-flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.07] bg-[rgba(8,10,16,0.4)] px-5 py-3.5 transition-all duration-250 hover:border-[#4F7CFF]/38 hover:bg-[rgba(79,124,255,0.06)] hover:shadow-[0_4px_20px_rgba(79,124,255,0.1)]"
            >
              <Icon size={size} className="text-gray-400 transition-colors duration-200 group-hover:text-[#6B93FF]" />
              <span className="text-[10px] uppercase tracking-[0.28em] text-gray-600 transition-colors duration-200 group-hover:text-[#6B93FF]">
                {label}
              </span>
              <span className="text-[11.5px] text-gray-300">{value(profile)}</span>
            </a>
          ))}
        </motion.div>

        {/* Form panel */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.72, delay: 0.32, ease: NOVA_EASE }}
          className="relative mt-11 overflow-hidden rounded-2xl border border-white/[0.07] bg-[rgba(8,10,16,0.5)] backdrop-blur-md"
        >
          {/* Panel header bar */}
          <div className="flex items-center gap-3 border-b border-white/[0.05] px-6 py-4">
            <div className="flex gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#4F7CFF]/45" />
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-600">
              /terminal/transmit
            </p>
          </div>

          {/* Top accent */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(79,124,255,0.55), transparent)',
            }}
          />

          <form onSubmit={handleSubmit} className="space-y-5 p-6 md:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              <TerminalInput label="Name">
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={sharedInputClass}
                  placeholder="Your name"
                />
              </TerminalInput>
              <TerminalInput label="Email">
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={sharedInputClass}
                  placeholder="your@email.com"
                />
              </TerminalInput>
            </div>

            <TerminalInput label="Message">
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className={`${sharedInputClass} resize-none`}
                placeholder="Your transmission..."
              />
            </TerminalInput>

            <div className="flex items-center justify-between gap-4">
              <button
                type="submit"
                className="nova-btn-primary rounded-xl px-7 py-2.5 text-sm font-semibold"
              >
                Send Transmission
              </button>

              <AnimatePresence>
                {submitted && (
                  <motion.p
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-[12.5px] text-[#6B93FF]"
                  >
                    ✓ Your email client should open shortly.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  )
}