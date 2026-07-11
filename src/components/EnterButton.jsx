import { useRef } from 'react'

/**
 * EnterButton
 * Reusable premium glassmorphism button — pill shape, frosted glass
 * background, thin white border, subtle #4F7CFF glow on hover.
 * No scale/bounce on interaction; only color, border, glow, and light
 * transitions — enhanced with a magnetic cursor-follow tilt (position
 * only, still no scale/bounce), a light sweep across the surface, a
 * traveling border highlight, and a focus-visible ring for keyboard
 * users. Pass `disabled` to lock the button during an in-progress
 * transition (e.g. while a parent cinematic exit is playing).
 */
const EnterButton = ({ children, onClick, disabled = false }) => {
  const btnRef = useRef(null)
  const frameRef = useRef(null)

  const handlePointerMove = (e) => {
    if (disabled) return
    const el = btnRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5

    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      el.style.setProperty('--magnet-x', `${px * 6}px`)
      el.style.setProperty('--magnet-y', `${py * 5}px`)
      el.style.setProperty('--glow-x', `${(px + 0.5) * 100}%`)
      el.style.setProperty('--glow-y', `${(py + 0.5) * 100}%`)
    })
  }

  const resetMagnet = () => {
    const el = btnRef.current
    if (!el) return
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    el.style.setProperty('--magnet-x', '0px')
    el.style.setProperty('--magnet-y', '0px')
  }

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label="Enter Nova City"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetMagnet}
      className="
        group relative isolate cursor-pointer overflow-hidden rounded-full
        border border-white/20
        bg-white/[0.05]
        px-10 py-3 sm:px-12 sm:py-3.5
        text-xs font-medium tracking-[0.32em] text-white/90 sm:tracking-[0.4em]
        backdrop-blur-md
        transition-[border-color,background-color,box-shadow] duration-[450ms] ease-[cubic-bezier(0.19,1,0.22,1)]
        hover:border-white/40
        hover:bg-white/[0.09]
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#4F7CFF]/70
        focus-visible:ring-offset-2
        focus-visible:ring-offset-black
        disabled:cursor-default
        disabled:opacity-60
      "
      style={{
        transform: 'translate3d(var(--magnet-x, 0px), var(--magnet-y, 0px), 0)',
        transition: 'transform 500ms cubic-bezier(0.19,1,0.22,1), border-color 450ms, background-color 450ms, box-shadow 450ms ease-out',
        boxShadow: '0 0 0 rgba(79, 124, 255, 0)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          '0 0 28px rgba(79, 124, 255, 0.4), 0 0 8px rgba(79, 124, 255, 0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 0 0 rgba(79, 124, 255, 0)'
      }}
    >
      {/* Traveling light sweep across the surface on hover */}
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-[opacity] duration-300 ease-out group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.16) 48%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.16) 52%, transparent 70%)',
          animation: 'enter-btn-sweep 1.6s cubic-bezier(0.22,1,0.36,1) infinite',
        }}
      />

      {/* Cursor-tracked soft glow following pointer position */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(120px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(79,124,255,0.25), transparent 70%)',
        }}
      />

      {/* Subtle inner glass highlight */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-[400ms] ease-out group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Rotating light traveling around the border on hover */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-70"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0%, rgba(79,124,255,0.55) 8%, transparent 20%)',
          animation: 'enter-btn-orbit 3.2s linear infinite',
          mixBlendMode: 'screen',
        }}
      />

      <span className="relative z-10">{children}</span>

      <style>
        {`
          @keyframes enter-btn-sweep {
            0% { transform: translateX(-120%); }
            60%, 100% { transform: translateX(120%); }
          }
          @keyframes enter-btn-orbit {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @media (prefers-reduced-motion: reduce) {
            .group span {
              animation: none !important;
            }
          }
        `}
      </style>
    </button>
  )
}

export default EnterButton
