import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiMenuAlt3, HiX } from 'react-icons/hi'
import { navLinks } from '../../data/profile'

const scrollToSection = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

const NOVA_EASE = [0.22, 0.68, 0.35, 1]

const SECTOR_CODES = {
  hero:       'NC-00',
  about:      'NC-01',
  skills:     'NC-02',
  projects:   'NC-03',
  experience: 'NC-04',
  contact:    'NC-05',
}

export default function Navigation() {
  const [scrolled,   setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeId,   setActiveId]   = useState('hero')
  const [scrollPct,  setScrollPct]  = useState(0)

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

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false) }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleNavClick = (id) => { setMobileOpen(false); scrollToSection(id) }

  return (
    <>
      {/* ── Scroll progress line ── */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[55] h-[1px]">
        <div
          className="h-full bg-gradient-to-r from-[#4F7CFF]/0 via-[#4F7CFF] to-[#4F7CFF]/0"
          style={{
            width: `${scrollPct}%`,
            opacity: scrolled ? 0.5 : 0,
            transition: 'width 120ms linear, opacity 400ms ease',
          }}
        />
      </div>

      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.0, duration: 0.9, ease: NOVA_EASE }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'border-b border-white/[0.05] bg-[rgba(8,10,16,0.78)] backdrop-blur-2xl'
            : 'bg-transparent'
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-6">

          {/* ── Logo / wordmark ── */}
          <button
            type="button"
            onClick={() => handleNavClick('hero')}
            className="group flex flex-col text-left"
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-[#4F7CFF] transition-colors duration-200 group-hover:text-[#6B93FF]">
              Nova City
            </span>
            <span className="text-[13px] font-semibold text-white/85 transition-colors duration-200 group-hover:text-white">
              {SECTOR_CODES[activeId] ?? 'NC-00'} · District Map
            </span>
          </button>

          {/* ── Desktop links ── */}
          <ul className="hidden items-center gap-0.5 md:flex">
            {navLinks.slice(1).map((link) => {
              const isActive = activeId === link.id
              return (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => handleNavClick(link.id)}
                    className={`group relative rounded-lg px-3 py-2 text-[10.5px] uppercase tracking-[0.2em] transition-colors duration-250 ${
                      isActive ? 'text-[#6B93FF]' : 'text-gray-400 hover:text-white/85'
                    }`}
                  >
                    {/* Active indicator pill */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-lg bg-[rgba(79,124,255,0.11)]"
                        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
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
            className="rounded-lg border border-white/[0.09] p-2 text-white/65 transition-all duration-200 hover:border-[#4F7CFF]/40 hover:bg-[rgba(79,124,255,0.06)] hover:text-white md:hidden"
            onClick={() => setMobileOpen((p) => !p)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -45, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 45, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <HiX size={20} />
                </motion.span>
              ) : (
                <motion.span
                  key="open"
                  initial={{ rotate: 45, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -45, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <HiMenuAlt3 size={20} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </nav>

        {/* ── Mobile drawer ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: NOVA_EASE }}
              className="overflow-hidden border-t border-white/[0.05] bg-[rgba(8,10,16,0.96)] backdrop-blur-2xl md:hidden"
            >
              <ul className="flex flex-col gap-1 px-5 py-3">
                {navLinks.map((link, i) => (
                  <motion.li
                    key={link.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.22, ease: NOVA_EASE }}
                  >
                    <button
                      type="button"
                      onClick={() => handleNavClick(link.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm transition-colors duration-200 ${
                        activeId === link.id
                          ? 'bg-[rgba(79,124,255,0.1)] text-[#6B93FF]'
                          : 'text-gray-300 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      <span className="uppercase tracking-[0.18em] text-[12px]">{link.label}</span>
                      <span className="font-mono text-[9px] text-[#4F7CFF]/45">
                        {SECTOR_CODES[link.id] ?? ''}
                      </span>
                    </button>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  )
}