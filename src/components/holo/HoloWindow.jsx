/**
 * HoloWindow.jsx
 *
 * The core animated holographic panel shell.
 *
 * Animation lifecycle:
 *  mount  → GSAP opening sequence (fade + scale + blur → clear)
 *  close  → GSAP closing sequence (reverse) → onClose callback
 *
 * Visual language:
 *  - Glassmorphism panel with animated corner brackets
 *  - Colored border glow driven by landmark.accentColor
 *  - Scanline CSS overlay (defined in index.css)
 *  - Floating idle animation (CSS, no JS overhead)
 */
import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import gsap from 'gsap';
import HoloHeader from './HoloHeader';
import HoloNav from './HoloNav';
import HoloBody from './HoloBody';
import HoloFooter from './HoloFooter';

const HoloWindow = memo(({ landmark, onClose }) => {
  const windowRef  = useRef(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [isClosing, setIsClosing] = useState(false);

  // ── Opening animation ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!windowRef.current) return;
    const el = windowRef.current;

    // Start state
    gsap.set(el, { opacity: 0, scale: 0.88, filter: 'blur(12px)' });

    // Animate in
    gsap.to(el, {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      duration: 0.55,
      ease: 'power3.out',
    });
  }, [landmark.id]); // re-run if landmark changes

  // ── Closing animation ──────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    if (isClosing || !windowRef.current) return;
    setIsClosing(true);

    gsap.to(windowRef.current, {
      opacity: 0,
      scale: 0.9,
      filter: 'blur(8px)',
      duration: 0.35,
      ease: 'power2.in',
      onComplete: onClose,
    });
  }, [isClosing, onClose]);

  // ── Tab change — reset scroll position ────────────────────────────────────
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const ac = landmark.accentColor;

  return (
    /* Backdrop — click-through except on the window itself */
    <div
      className="holo-backdrop fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      aria-modal="true"
      role="dialog"
      aria-label={`${landmark.displayName} portfolio window`}
    >
      {/* Semi-transparent dark backdrop — only behind the panel */}
      <div
        className="holo-panel-shadow absolute inset-0 pointer-events-auto"
        onClick={handleClose}
        aria-hidden="true"
        style={{ background: 'rgba(0,0,0,0.45)' }}
      />

      {/* ── Main holographic panel ─────────────────────────────────────────── */}
      <div
        ref={windowRef}
        className="holo-window relative flex flex-col pointer-events-auto"
        style={{
          /* Glassmorphism */
          background: 'rgba(6, 8, 18, 0.82)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: `1px solid ${ac}30`,
          boxShadow: `0 0 0 1px ${ac}18, 0 0 60px ${ac}18, 0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 ${ac}18`,
          borderRadius: '2px',
          /* Floating animation */
          animation: 'holo-float 6s ease-in-out infinite',
          /* Sizing */
          width: 'min(760px, calc(100vw - 2rem))',
          maxHeight: 'min(640px, calc(100vh - 4rem))',
          minHeight: '400px',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated corner brackets */}
        <CornerBrackets accentColor={ac} />

        {/* Glow border animation */}
        <div
          className="holo-border-glow pointer-events-none absolute inset-0 rounded-sm"
          style={{
            boxShadow: `inset 0 0 30px ${ac}08`,
            animation: 'holo-glow-pulse 3s ease-in-out infinite',
          }}
          aria-hidden="true"
        />

        {/* ── Layout ────────────────────────────────────────────────────── */}
        <HoloHeader landmark={landmark} onClose={handleClose} />
        <HoloNav activeTab={activeTab} onTabChange={handleTabChange} accentColor={ac} />

        {/* Body is positioned relatively so scanlines overlay works */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <HoloBody activeTab={activeTab} accentColor={ac} />
        </div>

        <HoloFooter landmark={landmark} />
      </div>
    </div>
  );
});

// ── Corner bracket decoration ─────────────────────────────────────────────────
const CornerBrackets = memo(({ accentColor }) => {
  const style = { color: accentColor, opacity: 0.7 };
  const size  = 14; // px

  const bracket = (pos) => (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      style={{ ...style, width: size, height: size, position: 'absolute', ...pos }}
      aria-hidden="true"
    >
      {pos.top !== undefined && pos.left !== undefined  && <><path d="M0 10 V0 H10"/></>}
      {pos.top !== undefined && pos.right !== undefined && <><path d="M20 10 V0 H10"/></>}
      {pos.bottom !== undefined && pos.left !== undefined  && <><path d="M0 10 V20 H10"/></>}
      {pos.bottom !== undefined && pos.right !== undefined && <><path d="M20 10 V20 H10"/></>}
    </svg>
  );

  return (
    <>
      {bracket({ top: 6, left: 6 })}
      {bracket({ top: 6, right: 6 })}
      {bracket({ bottom: 6, left: 6 })}
      {bracket({ bottom: 6, right: 6 })}
    </>
  );
});

CornerBrackets.displayName = 'CornerBrackets';
HoloWindow.displayName    = 'HoloWindow';
export default HoloWindow;
