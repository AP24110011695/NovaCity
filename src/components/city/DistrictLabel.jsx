import React from 'react';
import { Html } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';

export const DistrictLabel = ({ district, hovered, selected, onClick }) => {
  const isVisible = hovered || selected;

  return (
    <Html
      position={[0, 45, 0]}
      center
      zIndexRange={[100, 0]}
      distanceFactor={200}
    >
      <div 
        className="relative group flex flex-col items-center justify-center pointer-events-none"
      >
        {/* Invisible button for keyboard accessibility */}
        <button
          className="absolute inset-0 w-full h-full pointer-events-auto opacity-0 focus:outline-none"
          onFocus={() => {}} 
          onClick={onClick}
          tabIndex={0}
          aria-label={`Select ${district.displayName} district`}
        />

        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col items-center bg-black/60 backdrop-blur-md px-6 py-4 border border-white/20 rounded-sm pointer-events-none"
              style={{
                boxShadow: `0 0 20px ${district.color}40`,
                borderColor: `${district.color}80`
              }}
            >
              <h3 className="text-xl font-bold tracking-[0.2em] uppercase m-0" style={{ color: district.color, textShadow: `0 0 10px ${district.color}` }}>
                {district.displayName}
              </h3>
              <p className="text-xs text-white/70 mt-1 uppercase tracking-widest font-medium">
                {district.theme}
              </p>
              
              {selected && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 pt-3 border-t border-white/20 text-sm text-white/90 max-w-xs text-center"
                >
                  {district.description}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Html>
  );
};
