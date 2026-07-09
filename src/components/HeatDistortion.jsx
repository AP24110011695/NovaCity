const HeatDistortion = ({ durationMs = 4000 }) => {
  return (
    <>
      <style>
        {`
          @keyframes heat-distort-in {
            0%   { opacity: 0; }
            45%  { opacity: 0; }
            75%  { opacity: 0.5; }
            92%  { opacity: 0.7; }
            100% { opacity: 0; }
          }
        `}
      </style>

      <svg className="absolute h-0 w-0">
        <filter id="novaHeatDistortion">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.03"
            numOctaves="2"
            seed="7"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur="6s"
              values="0.012 0.03;0.018 0.045;0.012 0.03"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" />
        </filter>
      </svg>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backdropFilter: 'url(#novaHeatDistortion) blur(0.4px)',
          WebkitBackdropFilter: 'blur(0.4px)',
          animation: `heat-distort-in ${durationMs}ms ease-in forwards`,
        }}
      />
    </>
  )
}

export default HeatDistortion