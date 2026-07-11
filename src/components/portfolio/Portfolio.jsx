import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { motion } from 'framer-motion'
import Navigation from './Navigation'
import Hero from './Hero'
import About from './About'
import Skills from './Skills'
import Projects from './Projects'
import Experience from './Experience'
import Contact from './Contact'
import Footer from './Footer'

const NOVA_EASE = [0.22, 0.68, 0.35, 1]

// ── Subtle parallax depth layers that move against scroll ────────────────────
// These sit fixed behind the city canvas (which is already z-0), giving
// the illusion that sections reveal city layers as you descend.
const ParallaxAtmosphere = () => (
  <div className="pointer-events-none fixed inset-0 z-[1]" aria-hidden>
    {/* Top vignette — fades as you scroll away from the landing */}
    <div
      className="absolute inset-x-0 top-0 h-[35vh]"
      style={{
        background:
          'linear-gradient(to bottom, rgba(8,10,16,0.55) 0%, transparent 100%)',
      }}
    />
    {/* Bottom vignette — always present for depth */}
    <div
      className="absolute inset-x-0 bottom-0 h-[20vh]"
      style={{
        background:
          'linear-gradient(to top, rgba(8,10,16,0.7) 0%, transparent 100%)',
      }}
    />
    {/* Left edge haze */}
    <div
      className="absolute inset-y-0 left-0 w-[12vw]"
      style={{
        background:
          'linear-gradient(to right, rgba(8,10,16,0.4) 0%, transparent 100%)',
      }}
    />
    {/* Right edge haze */}
    <div
      className="absolute inset-y-0 right-0 w-[12vw]"
      style={{
        background:
          'linear-gradient(to left, rgba(8,10,16,0.4) 0%, transparent 100%)',
      }}
    />
  </div>
)

// ── Section district separator — thin glowing line between city districts ───
const DistrictDivider = ({ coord }) => (
  <div className="relative mx-auto max-w-6xl px-6 py-2">
    <div className="flex items-center gap-4">
      <div
        className="h-px flex-1"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(79,124,255,0.25) 30%, rgba(79,124,255,0.15) 70%, transparent)',
        }}
      />
      {coord && (
        <span className="shrink-0 font-mono text-[9px] tracking-[0.3em] text-[#4F7CFF]/40">
          {coord}
        </span>
      )}
      <div
        className="h-px flex-1"
        style={{
          background:
            'linear-gradient(to left, transparent, rgba(79,124,255,0.25) 30%, rgba(79,124,255,0.15) 70%, transparent)',
        }}
      />
    </div>
  </div>
)

export default function Portfolio() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.25, smoothWheel: true, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
    let rafId = 0
    const raf = (time) => { lenis.raf(time); rafId = requestAnimationFrame(raf) }
    rafId = requestAnimationFrame(raf)
    return () => { cancelAnimationFrame(rafId); lenis.destroy() }
  }, [])

  return (
    <>
      {/* Atmospheric depth layers behind city canvas */}
      <ParallaxAtmosphere />

      {/* Scroll-depth city glow — deepens as you go further in */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-[1]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 3, ease: NOVA_EASE }}
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 80%, rgba(79,124,255,0.07), transparent 70%)',
        }}
        aria-hidden
      />

      <main className="relative z-[2] min-h-screen w-full bg-transparent text-white">
        <Navigation />
        <Hero />

        <DistrictDivider coord="NC-01 · 28.2°N · 74.4°E" />
        <About />

        <DistrictDivider coord="NC-02 · 28.3°N · 74.5°E" />
        <Skills />

        <DistrictDivider coord="NC-03 · 28.4°N · 74.6°E" />
        <Projects />

        <DistrictDivider coord="NC-04 · 28.5°N · 74.7°E" />
        <Experience />

        <DistrictDivider coord="NC-05 · 28.6°N · 74.8°E" />
        <Contact />

        <Footer />
      </main>
    </>
  )
}