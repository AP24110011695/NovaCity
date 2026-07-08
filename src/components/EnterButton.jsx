/**
 * EnterButton
 * Reusable premium glassmorphism button — pill shape, frosted glass
 * background, thin white border, subtle #4F7CFF glow on hover.
 * No scale/bounce on interaction; only color, border, and glow transitions.
 */
const EnterButton = ({ children, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group relative cursor-pointer rounded-full
        border border-white/20
        bg-white/[0.05]
        px-12 py-3.5
        text-xs font-medium tracking-[0.4em] text-white/90
        backdrop-blur-md
        transition-all duration-[400ms] ease-out
        hover:border-white/40
        hover:bg-white/[0.09]
      "
      style={{
        boxShadow: '0 0 0 rgba(79, 124, 255, 0)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          '0 0 24px rgba(79, 124, 255, 0.35), 0 0 6px rgba(79, 124, 255, 0.25)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 0 0 rgba(79, 124, 255, 0)'
      }}
    >
      <span className="relative z-10">{children}</span>

      {/* Subtle inner glass highlight */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-[400ms] ease-out group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 60%)',
        }}
      />
    </button>
  )
}

export default EnterButton