import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export const JOURNEY_CHAPTERS = [
  { id: 'hero', label: 'Welcome', accent: '#76cfff', glow: '118, 207, 255' },
  { id: 'about', label: 'About', accent: '#a996ff', glow: '169, 150, 255' },
  { id: 'skills', label: 'Skills', accent: '#62efff', glow: '98, 239, 255' },
  { id: 'projects', label: 'Projects', accent: '#66eab6', glow: '102, 234, 182' },
  { id: 'experience', label: 'Experience', accent: '#ffc36d', glow: '255, 195, 109' },
  { id: 'education', label: 'Education', accent: '#ab9bff', glow: '171, 155, 255' },
  { id: 'achievements', label: 'Achievements', accent: '#ffe09a', glow: '255, 224, 154' },
  { id: 'contact', label: 'Contact', accent: '#c78cff', glow: '199, 140, 255' },
]

export default function JourneyOverlay() {
  const [active, setActive] = useState('hero')

  useEffect(() => {
    const chapter = JOURNEY_CHAPTERS.find((item) => item.id === active) ?? JOURNEY_CHAPTERS[0]
    document.documentElement.style.setProperty('--district-accent', chapter.accent)
    document.documentElement.style.setProperty('--district-glow', chapter.glow)
  }, [active])

  useEffect(() => {
    const sections = JOURNEY_CHAPTERS.map(({ id }) => document.getElementById(id)).filter(Boolean)
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (!visible) return
      const id = visible.target.id
      setActive(id)
      window.dispatchEvent(new CustomEvent('nova-city:chapter', { detail: id }))
    }, { rootMargin: '-36% 0px -42% 0px', threshold: [0.15, 0.45, 0.7] })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  const goTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return <nav aria-label="Nova City journey" className="journey-progress">
    {JOURNEY_CHAPTERS.map((item) => <button key={item.id} type="button" onClick={() => goTo(item.id)} className={active === item.id ? 'is-active' : ''} aria-current={active === item.id ? 'step' : undefined}>
      <span className="journey-dot">{active === item.id && <motion.span layoutId="journey-active-dot" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}</span><span>{item.label}</span>
    </button>)}
  </nav>
}
