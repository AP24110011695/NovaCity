import { memo, useRef } from 'react'
import gsap from 'gsap'

const GuideActions = memo(function GuideActions({ suggestions, onSelect }) {
  const buttonsRef = useRef([])
  const hover = (index, active) => { const button = buttonsRef.current[index]; if (button) gsap.to(button, { x: active ? 4 : 0, duration: 0.18, ease: 'power2.out', overwrite: 'auto' }) }
  return <div className="mt-3 flex flex-wrap gap-2">{suggestions.map((suggestion, index) => <button key={suggestion.id} ref={(node) => { buttonsRef.current[index] = node }} type="button" onMouseEnter={() => hover(index, true)} onMouseLeave={() => hover(index, false)} onClick={() => onSelect(suggestion)} className="rounded-sm border border-cyan-200/25 bg-cyan-200/[0.06] px-2.5 py-1.5 text-[10px] font-medium tracking-[0.08em] text-cyan-100/85 transition-colors hover:bg-cyan-200/[0.13]">{suggestion.label}</button>)}</div>
})
export default GuideActions
