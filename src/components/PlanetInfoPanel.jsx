import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IoCloseOutline } from 'react-icons/io5'

const PlanetInfoPanel = ({ planet, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (planet) {
      // Slight delay for camera motion to start before panel appears
      const t = setTimeout(() => setIsVisible(true), 400)
      return () => clearTimeout(t)
    } else {
      setIsVisible(false)
    }
  }, [planet])

  return (
    <AnimatePresence>
      {isVisible && planet && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-12 top-1/2 z-[60] flex w-80 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl"
          style={{
            boxShadow: '0 0 30px rgba(100,140,255,0.1), inset 0 0 20px rgba(100,140,255,0.05)',
          }}
        >
          {/* Holographic glow */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
          
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(onClose, 400) // wait for exit animation
            }}
            className="absolute right-4 top-4 text-white/50 transition-colors hover:text-white"
          >
            <IoCloseOutline size={24} />
          </button>

          <h2 className="mb-1 text-2xl font-light tracking-widest text-white uppercase">
            {planet.name}
          </h2>
          <div className="mb-6 h-[1px] w-full bg-gradient-to-r from-blue-500/50 to-transparent" />

          <div className="flex flex-col gap-4 text-sm">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/40">Distance from Sun</span>
              <span className="font-mono text-blue-200/90">{planet.distance}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/40">Radius</span>
              <span className="font-mono text-blue-200/90">{planet.radius}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/40">Gravity</span>
              <span className="font-mono text-blue-200/90">{planet.gravity}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/40">Moons</span>
              <span className="font-mono text-blue-200/90">{planet.moons}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/40">Atmosphere</span>
              <span className="font-mono text-blue-200/90">{planet.atmosphere}</span>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-blue-900/20 p-4 text-xs leading-relaxed text-blue-100/70">
            {planet.funFact}
          </div>

          {/* Decorative scanner line */}
          <motion.div
            initial={{ top: 0 }}
            animate={{ top: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="pointer-events-none absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PlanetInfoPanel
