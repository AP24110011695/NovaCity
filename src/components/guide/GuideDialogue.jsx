import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'

export default function GuideDialogue({ dialogue }) {
  const dialogueRef = useRef(null)
  useLayoutEffect(() => {
    const element = dialogueRef.current
    if (!element) return undefined
    const context = gsap.context(() => gsap.fromTo(element, { autoAlpha: 0, y: 8, filter: 'blur(5px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.38, ease: 'power3.out' }), element)
    return () => context.revert()
  }, [dialogue])
  return <p ref={dialogueRef} className="m-0 max-w-[290px] text-xs leading-5 text-cyan-50/75">{dialogue}</p>
}
