import React, { memo, useCallback, useRef } from 'react';
import gsap from 'gsap';

const ICONS = {
  api: '⌁', bolt: 'ϟ', brackets: '‹›', branch: '⌘', chart: '◫', cloud: '☁', code: '</>', cube: '◇', database: '◉', layout: '▦', network: '⌘', react: '◌', server: '▣', spark: '✦', style: '◒', terminal: '>_',
};

const SkillCard = memo(({ skill, accentColor }) => {
  const glowRef = useRef(null);

  const animateGlow = useCallback((visible) => {
    if (!glowRef.current) return;
    gsap.to(glowRef.current, { opacity: visible ? 1 : 0, scale: visible ? 1 : 0.88, duration: visible ? 0.25 : 0.35, ease: 'power2.out', overwrite: 'auto' });
  }, []);

  return (
    <article
      className="holo-skill-card relative min-w-0 overflow-hidden rounded-sm border p-4"
      style={{ '--skill-accent': accentColor, borderColor: `${accentColor}26`, background: 'rgba(255,255,255,0.024)' }}
      onMouseEnter={() => animateGlow(true)}
      onMouseLeave={() => animateGlow(false)}
      onFocus={() => animateGlow(true)}
      onBlur={() => animateGlow(false)}
      tabIndex={0}
    >
      <div ref={glowRef} className="pointer-events-none absolute -right-9 -top-9 h-28 w-28 rounded-full blur-3xl" style={{ background: accentColor, opacity: 0, transform: 'scale(0.88)' }} aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-3">
        <span className="holo-skill-icon flex h-9 w-9 items-center justify-center rounded-sm border font-mono text-sm" style={{ color: accentColor, borderColor: `${accentColor}50`, background: `${accentColor}0d` }} aria-hidden="true">
          {ICONS[skill.icon] ?? '◈'}
        </span>
        <span className="text-[9px] uppercase tracking-[0.15em] text-white/40">{skill.years} yr{skill.years === 1 ? '' : 's'}</span>
      </div>
      <h3 className="relative mt-4 text-sm font-semibold tracking-wide text-white">{skill.name}</h3>
      <p className="relative mt-1 text-[10px] uppercase tracking-[0.16em]" style={{ color: `${accentColor}b0` }}>{skill.proficiency}</p>
      <p className="relative mt-3 text-xs leading-relaxed text-white/50">{skill.description}</p>
    </article>
  );
});

SkillCard.displayName = 'SkillCard';
export default SkillCard;
