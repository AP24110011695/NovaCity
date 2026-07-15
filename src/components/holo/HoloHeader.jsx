/**
 * HoloHeader.jsx
 *
 * The title bar of the Holographic Portfolio Window.
 * Displays landmark name, icon, district, and the close button.
 */
import React, { memo } from 'react';

const ICONS = {
  lightning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  atom: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <circle cx="12" cy="12" r="2" />
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  ),
};

const HoloHeader = memo(({ landmark, onClose }) => {
  const IconComponent = ICONS[landmark.icon] ?? ICONS.building;

  return (
    <header className="holo-header flex items-center gap-4 px-6 py-4 border-b border-white/10 flex-shrink-0">
      {/* Icon */}
      <div
        className="flex items-center justify-center w-10 h-10 rounded-sm flex-shrink-0"
        style={{
          color: landmark.accentColor,
          background: `${landmark.accentColor}18`,
          border: `1px solid ${landmark.accentColor}40`,
          boxShadow: `0 0 16px ${landmark.accentColor}30`,
        }}
      >
        {IconComponent}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h2
          className="text-lg font-bold tracking-[0.12em] uppercase truncate m-0"
          style={{ color: landmark.accentColor, textShadow: `0 0 20px ${landmark.accentColor}80` }}
        >
          {landmark.displayName}
        </h2>
        <p className="text-[10px] text-white/40 tracking-[0.25em] uppercase mt-0.5">
          Portfolio Interface · {landmark.futureContentType}
        </p>
      </div>

      {/* Status dots */}
      <div className="hidden sm:flex items-center gap-2 mr-4">
        <span className="holo-status-dot" style={{ background: landmark.accentColor, boxShadow: `0 0 6px ${landmark.accentColor}` }} />
        <span className="text-[9px] text-white/30 tracking-widest uppercase">Online</span>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close portfolio window"
        className="holo-close-btn flex items-center justify-center w-8 h-8 rounded-sm transition-all duration-200 outline-none
                   text-white/40 hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </header>
  );
});

HoloHeader.displayName = 'HoloHeader';
export default HoloHeader;
