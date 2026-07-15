/**
 * HoloFooter.jsx
 *
 * Footer bar of the Holographic Portfolio Window.
 * Shows coordinates / system status / landmark metadata.
 * Empty action slots for future quick-access buttons.
 */
import React, { memo, useState, useEffect } from 'react';

const HoloFooter = memo(({ landmark }) => {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false }));

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer
      className="holo-footer flex items-center justify-between gap-4 px-6 py-3 border-t border-white/10 flex-shrink-0 text-[9px] text-white/30 tracking-[0.2em] uppercase"
    >
      {/* Left — building ref */}
      <div className="flex items-center gap-3">
        <span style={{ color: `${landmark.accentColor}80` }}>◈</span>
        <span>NODE: {landmark.id.toUpperCase()}</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">DIST: {landmark.districtId.replace('district-', '').toUpperCase()}</span>
      </div>

      {/* Center — future action slots */}
      <div className="flex items-center gap-2">
        {/* Placeholder future action buttons */}
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            disabled
            aria-hidden="true"
            className="w-6 h-6 rounded-sm border border-white/10 opacity-30 cursor-not-allowed"
          />
        ))}
      </div>

      {/* Right — system clock */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline">TYPE: {landmark.futureContentType.toUpperCase()}</span>
        <span className="hidden sm:inline">·</span>
        <span style={{ color: `${landmark.accentColor}80` }}>{time}</span>
      </div>
    </footer>
  );
});

HoloFooter.displayName = 'HoloFooter';
export default HoloFooter;
