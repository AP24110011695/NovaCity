import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { FaGithub, FaLinkedin, FaFileDownload } from 'react-icons/fa'
import { HiOutlineMail } from 'react-icons/hi'
import { profile } from '../../data/profile'

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

const NOVA_EASE = [0.22, 0.68, 0.35, 1]

// ── Typing effect ─────────────────────────────────────────────────────────────
function useTypewriter(text, delay = 600) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    let i = 0
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1))
        i++
        if (i >= text.length) clearInterval(interval)
      }, 36)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timer)
  }, [text, delay])
  return displayed
}

// ── HUD corner brackets ───────────────────────────────────────────────────────
const CornerBracket = ({ corner }) => {
  const size = 14
  const w = 1.5
  const color = 'rgba(79,124,255,0.45)'
  const styles = {
    tl: { top: 0, left: 0, borderTop: `${w}px solid ${color}`, borderLeft: `${w}px solid ${color}` },
    tr: { top: 0, right: 0, borderTop: `${w}px solid ${color}`, borderRight: `${w}px solid ${color}` },
    bl: { bottom: 0, left: 0, borderBottom: `${w}px solid ${color}`, borderLeft: `${w}px solid ${color}` },
    br: { bottom: 0, right: 0, borderBottom: `${w}px solid ${color}`, borderRight: `${w}px solid ${color}` },
  }
  return (
    <span
      className="pointer-events-none absolute"
      style={{ width: size, height: size, ...styles[corner] }}
    />
  )
}

// ── Scanning reticle dot ──────────────────────────────────────────────────────
const ScanDot = () => (
  <span className="relative inline-flex h-2 w-2 shrink-0">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4F7CFF] opacity-50" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#6B93FF]" />
  </span>
)

export default function Hero() {
  const typed = useTypewriter(`> SYSTEM ONLINE — ${profile.title}`, 1800)
  const [scanLine, setScanLine] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setScanLine(true), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-transparent"
      style={{ paddingTop: 'clamp(80px, 12vh, 120px)' }}
    >
      {/* ── Scan line — sweeps once on arrival ── */}
      {scanLine && (
        <div
          className="pointer-events-none absolute inset-x-0 z-[5]"
          style={{
            height: 1,
            background:
              'linear-gradient(90deg, transparent 5%, rgba(79,124,255,0.5) 25%, rgba(180,210,255,0.85) 50%, rgba(79,124,255,0.5) 75%, transparent 95%)',
            boxShadow: '0 0 18px 3px rgba(79,124,255,0.2)',
            animation: 'hero-scan 1.8s cubic-bezier(0.16,1,0.3,1) forwards',
          }}
        />
      )}

      {/* ── Radial city-glow at center ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 50% 60%, rgba(79,124,255,0.07), transparent 70%)',
        }}
      />

      {/* ── HUD coordinate overlay — top-left ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.2, ease: NOVA_EASE }}
        className="pointer-events-none absolute left-6 top-24 hidden flex-col gap-1 lg:flex"
      >
        <p className="font-mono text-[9px] tracking-[0.3em] text-[#4F7CFF]/45">
          COORDINATES
        </p>
        <p className="font-mono text-[10px] tracking-widest text-white/25">
          28.204°N  74.412°E
        </p>
        <p className="font-mono text-[10px] tracking-widest text-white/25">
          ALT: 0.24 km
        </p>
      </motion.div>

      {/* ── HUD coordinate overlay — top-right ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 1.2, ease: NOVA_EASE }}
        className="pointer-events-none absolute right-6 top-24 hidden flex-col items-end gap-1 lg:flex"
      >
        <p className="font-mono text-[9px] tracking-[0.3em] text-[#4F7CFF]/45">
          DISTRICT
        </p>
        <p className="font-mono text-[10px] tracking-widest text-white/25">
          NOVA CITY HQ
        </p>
        <p className="font-mono text-[10px] tracking-widest text-white/25">
          SECTOR NC-00
        </p>
      </motion.div>

      {/* ── Status bar — bottom of hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 1.0, ease: NOVA_EASE }}
        className="pointer-events-none absolute inset-x-0 bottom-8 flex items-center justify-center gap-3 px-6"
      >
        <ScanDot />
        <span className="font-mono text-[10px] tracking-[0.22em] text-[#6B93FF]/55 sm:tracking-[0.28em]">
          {typed}
        </span>
      </motion.div>

      {/* ── Main content ── */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-5 py-16 text-center sm:px-8">

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: NOVA_EASE }}
          className="mb-6 flex items-center justify-center gap-3"
        >
          <div className="h-px w-8 bg-[#4F7CFF]/35 sm:w-12" />
          <p className="font-mono text-[9px] uppercase tracking-[0.45em] text-[#6B93FF] sm:text-[10px] sm:tracking-[0.55em]">
            Nova City · Headquarters · Year 2178
          </p>
          <div className="h-px w-8 bg-[#4F7CFF]/35 sm:w-12" />
        </motion.div>

        {/* Name — the landmark */}
        <motion.h1
          initial={{ opacity: 0, y: 22, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.1, delay: 0.8, ease: NOVA_EASE }}
          className="mb-5 font-bold tracking-tight text-white"
          style={{
            fontSize: 'clamp(2.2rem, 7vw, 5.5rem)',
            lineHeight: 1.04,
            textShadow:
              '0 0 80px rgba(79,124,255,0.2), 0 2px 40px rgba(0,0,0,0.4)',
          }}
        >
          {profile.name.toUpperCase()}
        </motion.h1>

        {/* Title */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.1, ease: NOVA_EASE }}
          className="mb-3 text-base font-light tracking-wide text-blue-200/75 sm:text-lg md:text-xl"
        >
          {profile.title}
        </motion.p>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.25, ease: NOVA_EASE }}
          className="mx-auto mb-11 max-w-lg text-sm leading-relaxed text-gray-400 sm:text-base sm:mb-12"
        >
          {profile.tagline}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.5, ease: NOVA_EASE }}
          className="flex flex-wrap justify-center gap-2.5 sm:gap-3"
        >
          <button
            type="button"
            onClick={() => scrollTo('projects')}
            className="nova-btn-primary rounded-lg px-6 py-2.5 text-sm font-semibold sm:px-7 sm:py-3"
          >
            Explore District
          </button>

          <button
            type="button"
            onClick={() => scrollTo('contact')}
            className="nova-btn-secondary rounded-lg px-6 py-2.5 text-sm font-semibold sm:px-7 sm:py-3"
          >
            Open Terminal
          </button>

          <a
            href={profile.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="nova-btn-ghost inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold sm:px-7 sm:py-3"
          >
            <FaFileDownload size={12} />
            Resume
          </a>
        </motion.div>

        {/* Social links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.9, ease: NOVA_EASE }}
          className="mt-9 flex justify-center gap-5 sm:mt-10 sm:gap-6"
        >
          {[
            { href: profile.github,            Icon: FaGithub,      label: 'GitHub',   size: 19 },
            { href: profile.linkedin,          Icon: FaLinkedin,    label: 'LinkedIn', size: 19 },
            { href: `mailto:${profile.email}`, Icon: HiOutlineMail, label: 'Email',    size: 21 },
          ].map(({ href, Icon, label, size }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('mailto') ? undefined : '_blank'}
              rel="noopener noreferrer"
              aria-label={label}
              className="text-gray-500 transition-all duration-300 hover:text-[#6B93FF] hover:drop-shadow-[0_0_8px_rgba(79,124,255,0.55)]"
            >
              <Icon size={size} />
            </a>
          ))}
        </motion.div>

      </div>
    </section>
  )
}
