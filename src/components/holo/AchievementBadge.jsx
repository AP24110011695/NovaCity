import React, { memo, useCallback, useRef } from 'react';
import gsap from 'gsap';

const AchievementBadge = memo(({ achievement, accentColor }) => {
  const badgeRef = useRef(null);
  const animateHover = useCallback((active) => {
    if (badgeRef.current) gsap.to(badgeRef.current, { scale: active ? 1.04 : 1, duration: 0.24, ease: 'power2.out', overwrite: 'auto' });
  }, []);
  return (
    <article ref={badgeRef} className="academy-achievement-badge relative rounded-sm border p-3 text-center" style={{ '--academy-accent': accentColor, borderColor: `${accentColor}2c`, background: `${accentColor}05` }} onMouseEnter={() => animateHover(true)} onMouseLeave={() => animateHover(false)} onFocus={() => animateHover(true)} onBlur={() => animateHover(false)} tabIndex={0}>
      <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border text-lg" style={{ color: accentColor, borderColor: `${accentColor}55`, boxShadow: `0 0 14px ${accentColor}35` }}>{achievement.icon}</span>
      <h3 className="mt-3 text-xs font-semibold text-white">{achievement.title}</h3>
      <p className="mt-1 text-[11px] leading-relaxed text-white/50">{achievement.description}</p>
      <p className="mt-2 text-[9px] uppercase tracking-[0.14em]" style={{ color: `${accentColor}a0` }}>{achievement.date}</p>
    </article>
  );
});

AchievementBadge.displayName = 'AchievementBadge';
export default AchievementBadge;
