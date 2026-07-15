import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGuide } from './GuideProvider'
import GuideDialogue from './GuideDialogue'

const GuideActions = lazy(() => import('./GuideActions'))

export default function GuideController() {
  const { dialogue, suggestions, selectSuggestion, isVisible, setVisible } = useGuide()
  const panelRef = useRef(null)
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return undefined
    const context = gsap.context(() => gsap.fromTo(panel, { autoAlpha: 0, x: -18 }, { autoAlpha: 1, x: 0, duration: .5, ease: 'power3.out' }), panel)
    return () => context.revert()
  }, [isVisible])
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') setVisible(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [setVisible])

  if (!isVisible) return <button type="button" onClick={() => setVisible(true)} className="fixed bottom-7 left-6 z-[45] flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-sm text-white/75 backdrop-blur transition hover:border-cyan-200/60 hover:text-cyan-100" aria-label="Open exploration help">?</button>

  return <aside ref={panelRef} className="fixed bottom-7 left-6 z-[45] w-[min(340px,calc(100vw-3rem))] overflow-hidden rounded-xl border border-white/15 bg-black/70 p-4 shadow-[0_0_35px_rgba(60,174,255,0.12)] backdrop-blur-md" aria-label="How to explore Nova City"><div className="relative flex items-start justify-between gap-4"><div><p className="mb-2 text-[9px] font-medium tracking-[.32em] text-cyan-100/80">HOW TO EXPLORE</p><p className="text-xs leading-6 text-white/65">↑ Scroll to travel through the story<br />🖱 Click interactive planets and buildings<br />✨ Hover glowing landmarks to discover projects<br />Esc or × to close</p><div className="mt-3 border-t border-white/10 pt-3"><GuideDialogue dialogue={dialogue} /></div></div><button type="button" onClick={() => setVisible(false)} className="text-xs text-white/45 hover:text-white" aria-label="Close exploration help">×</button></div><Suspense fallback={null}><GuideActions suggestions={suggestions} onSelect={selectSuggestion} /></Suspense></aside>
}
