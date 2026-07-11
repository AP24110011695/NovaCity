import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { FaGithub, FaLinkedin, FaFileDownload } from 'react-icons/fa'
import { HiOutlineMail } from 'react-icons/hi'
import { profile } from '../../data/profile'

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

const NOVA_EASE = [0.22, 0.68, 0.35, 1]

// ── Typing effect for the status line ────────────────────────────────────────
function useTypewriter(text, delay = 600) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    let i = 0
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1))
        i++
        if (i >= text.length) clearInterval(interval)
      }, 38)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timer)
  }, [text, delay])
  return displayed
}

// ── HUD corner brackets ───────────────────────────────────────────────────────
const CornerBracket = ({ corner }) => {
  const size = 16
  const w = 1.5
  const color = 'rgba(79,124,255,0.5)'
  const styles = {
    'tl': { top: 0, left: 0, borderTop: `${w}px solid ${color}`, borderLeft: `${w}px solid ${color}` },
    'tr': { top: 0, right: 0, borderTop: `${w}px solid ${color}`, borderRight: `${w}px solid ${color}` },
    'bl': { bottom: 0, left: 0, borderBottom: `${w}px solid ${color}`, borderLeft: `${w}px solid ${color}` },
    'br': { bottom: 0, right: 0, borderBottom: `${w}px solid ${color}`, borderRight: `${w}px solid ${color}` },
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
  <span className="relative inline-flex h-2 w-2">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4F7CFF] opacity-50" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#6B93FF]" />
  </span>
)

export default function Hero() {
  const typed = useTypewriter(`> SYSTEM ONLINE — ${profile.title}`, 1800)
  const [scanLine, setScanLine] = useState(false)

  useEffect(() => {
    // Trigger the scan line sweep after a short delay (arrival feel)
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
              'linear-gradient(90deg, transparent 5%, rgba(79,124,255,0.6) 30%, rgba(180,210,255,0.9) 50%, rgba(79,124,255,0.6) 70%, transparent 95%)',
            boxShadow: '0 0 20px 4px rgba(79,124,255,0.25)',
            animation: 'hero-scan 1.6s cubic-bezier(0.16,1,0.3,1) forwards',
          }}
        />
      )}

      {/* ── Radial city-glow at center ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 50% 60%, rgba(79,124,255,0.08), transparent 70%)',
        }}
      />

      {/* ── HUD coordinate overlay — top-left ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.2, ease: NOVA_EASE }}
        className="pointer-events-none absolute left-8 top-24 hidden flex-col gap-1 md:flex"
      >
        <p className="font-mono text-[9px] tracking-[0.3em] text-[#4F7CFF]/50">
          COORDINATES
        </p>
        <p className="font-mono text-[10px] tracking-widest text-white/30">
          28.204°N  74.412°E
        </p>
        <p className="font-mono text-[10px] tracking-widest text-white/30">
          ALT: 0.24 km
        </p>
      </motion.div>

      {/* ── HUD coordinate overlay — top-right ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 1.2, ease: NOVA_EASE }}
        className="pointer-events-none absolute right-8 top-24 hidden flex-col items-end gap-1 md:flex"
      >
        <p className="font-mono text-[9px] tracking-[0.3em] text-[#4F7CFF]/50">
          DISTRICT
        </p>
        <p className="font-mono text-[10px] tracking-widest text-white/30">
          NOVA CITY HQ
        </p>
        <p className="font-mono text-[10px] tracking-widest text-white/30">
          SECTOR NC-00
        </p>
      </motion.div>

      {/* ── Status bar — bottom of hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 1.0, ease: NOVA_EASE }}
        className="pointer-events-none absolute inset-x-0 bottom-10 flex items-center justify-center gap-3 px-6"
      >
        <ScanDot />
        <span className="font-mono text-[10px] tracking-[0.25em] text-[#6B93FF]/60">
          {typed}
        </span>
      </motion.div>

      {/* ── Main content ── */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-16 text-center md:px-8">

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: NOVA_EASE }}
          className="mb-6 flex items-center justify-center gap-3"
        >
          <div className="h-px w-12 bg-[#4F7CFF]/40" />
          <p className="font-mono text-[10px] uppercase tracking-[0.55em] text-[#6B93FF]">
            Nova City · Headquarters · Year 2178
          </p>
          <div className="h-px w-12 bg-[#4F7CFF]/40" />
        </motion.div>

        {/* Name — the landmark */}
        <motion.h1
          initial={{ opacity: 0, y: 22, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.1, delay: 0.8, ease: NOVA_EASE }}
          className="mb-5 font-bold tracking-tight text-white"
          style={{
            fontSize: 'clamp(2.4rem, 7vw, 5.5rem)',
            lineHeight: 1.05,
            textShadow:
              '0 0 80px rgba(79,124,255,0.22), 0 2px 40px rgba(0,0,0,0.4)',
          }}
        >
          {profile.name.toUpperCase()}
        </motion.h1>

        {/* Title */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.1, ease: NOVA_EASE }}
          className="mb-3 text-lg font-light tracking-wide text-blue-200/80 md:text-xl"
        >
          {profile.title}
        </motion.p>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.25, ease: NOVA_EASE }}
          className="mx-auto mb-12 max-w-lg text-base leading-relaxed text-gray-400"
        >
          {profile.tagline}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.5, ease: NOVA_EASE }}
          className="flex flex-wrap justify-center gap-3"
        >
          <button
            type="button"
            onClick={() => scrollTo('projects')}
            className="nova-btn-primary group relative overflow-hidden rounded-lg px-7 py-3 text-sm font-semibold"
          >
            <span className="relative z-10">Explore District</span>
          </button>

          <button
            type="button"
            onClick={() => scrollTo('contact')}
            className="nova-btn-secondary rounded-lg px-7 py-3 text-sm font-semibold"
          >
            Open Terminal
          </button>

          <a
            href={profile.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="nova-btn-ghost inline-flex items-center gap-2 rounded-lg px-7 py-3 text-sm font-semibold"
          >
            <FaFileDownload size={13} />
            Resume
          </a>
        </motion.div>

        {/* Social links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.9, ease: NOVA_EASE }}
          className="mt-10 flex justify-center gap-6"
        >
          {[
            { href: profile.github,        Icon: FaGithub,      label: 'GitHub',   size: 20 },
            { href: profile.linkedin,      Icon: FaLinkedin,    label: 'LinkedIn', size: 20 },
            { href: `mailto:${profile.email}`, Icon: HiOutlineMail, label: 'Email',    size: 22 },
          ].map(({ href, Icon, label, size }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('mailto') ? undefined : '_blank'}
              rel="noopener noreferrer"
              aria-label={label}
              className="text-gray-500 transition-all duration-300 hover:text-[#6B93FF] hover:drop-shadow-[0_0_8px_rgba(79,124,255,0.6)]"
            >
              <Icon size={size} />
            </a>
          ))}
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4, duration: 1 }}
          className="mt-16 flex flex-col items-center gap-2"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.45em] text-white/20">
            Descend into the City
          </p>
          <div
            className="h-8 w-px"
            style={{
              background:
                'linear-gradient(to bottom, rgba(79,124,255,0.4), transparent)',
              animation: 'hero-scroll-pulse 2s ease-in-out infinite',
            }}
          />
        </motion.div>
      </div>
    </section>
  )
}