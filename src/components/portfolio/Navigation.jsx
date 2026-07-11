import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiMenuAlt3, HiX } from 'react-icons/hi'
import { navLinks } from '../../data/profile'

const scrollToSection = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

const NOVA_EASE = [0.22, 0.68, 0.35, 1]

// Sector codes per nav link — adds city-coordinate flavour
const SECTOR_CODES = {
  hero:       'NC-00',
  about:      'NC-01',
  skills:     'NC-02',
  projects:   'NC-03',
  experience: 'NC-04',
  contact:    'NC-05',
}

export default function Navigation() {
  const [scrolled,    setScrolled]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [activeId,    setActiveId]    = useState('hero')
  const [scrollPct,   setScrollPct]   = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40)
      const total = document.body.scrollHeight - window.innerHeight
      setScrollPct(total > 0 ? Math.min(100, Math.round((window.scrollY / total) * 100)) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sections = navLinks
      .map((l) => document.getElementById(l.id))
      .filter(Boolean)

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target?.id) setActiveId(visible.target.id)
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0.1, 0.3, 0.6] },
    )
    sections.forEach((s) => obs.observe(s))
    return () => obs.disconnect()
  }, [])

  const handleNavClick = (id) => { setMobileOpen(false); scrollToSection(id) }

  return (
    <>
      {/* ── Scroll progress line ── */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[55] h-[1px]">
        <div
          className="h-full bg-gradient-to-r from-[#4F7CFF]/0 via-[#4F7CFF] to-[#4F7CFF]/0 transition-all duration-150"
          style={{ width: `${scrollPct}%`, opacity: scrolled ? 0.55 : 0 }}
        />
      </div>

      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.0, duration: 0.9, ease: NOVA_EASE }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'border-b border-white/[0.06] bg-[rgba(8,10,16,0.72)] backdrop-blur-xl'
            : 'bg-transparent'
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">

          {/* ── Logo / wordmark ── */}
          <button
            type="button"
            onClick={() => handleNavClick('hero')}
            className="group flex flex-col text-left"
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-[#4F7CFF] transition group-hover:text-[#6B93FF]">
              Nova City
            </span>
            <span className="text-sm font-semibold text-white/90 transition group-hover:text-white">
              {SECTOR_CODES[activeId] ?? 'NC-00'} · District Map
            </span>
          </button>

          {/* ── Desktop links ── */}
          <ul className="hidden items-center gap-1 md:flex">
            {navLinks.slice(1).map((link) => {
              const isActive = activeId === link.id
              return (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => handleNavClick(link.id)}
                    className={`group relative rounded-lg px-3 py-2 text-[11px] uppercase tracking-[0.22em] transition-all duration-300 ${
                      isActive ? 'text-[#6B93FF]' : 'text-gray-400 hover:text-white/80'
                    }`}
                  >
                    {/* Active indicator pill */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-lg bg-[rgba(79,124,255,0.12)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          {/* ── Mobile burger ── */}
          <button
            type="button"
            className="rounded-lg border border-white/10 p-2 text-white/70 transition hover:border-[#4F7CFF]/40 hover:text-white md:hidden"
            onClick={() => setMobileOpen((p) => !p)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <HiX size={20} /> : <HiMenuAlt3 size={20} />}
          </button>
        </nav>

        {/* ── Mobile drawer ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: NOVA_EASE }}
              className="overflow-hidden border-t border-white/[0.06] bg-[rgba(8,10,16,0.94)] backdrop-blur-xl md:hidden"
            >
              <ul className="flex flex-col gap-1 px-6 py-4">
                {navLinks.map((link) => (
                  <li key={link.id}>
                    <button
                      type="button"
                      onClick={() => handleNavClick(link.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm transition ${
                        activeId === link.id
                          ? 'bg-[rgba(79,124,255,0.12)] text-[#6B93FF]'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      <span className="uppercase tracking-[0.2em]">{link.label}</span>
                      <span className="font-mono text-[9px] text-[#4F7CFF]/50">
                        {SECTOR_CODES[link.id] ?? ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  )
}