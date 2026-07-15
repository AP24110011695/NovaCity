import React, { memo, useCallback, useRef } from 'react';
import gsap from 'gsap';

const ExperienceCard = memo(({ experience, accentColor, type }) => {
  const cardRef = useRef(null);
  const onHover = useCallback((active) => {
    if (cardRef.current) gsap.to(cardRef.current, { x: active ? 4 : 0, duration: 0.22, ease: 'power2.out', overwrite: 'auto' });
  }, []);
  return (
    <article ref={cardRef} className="corporate-experience-card relative rounded-sm border p-4" style={{ '--corporate-accent': accentColor, borderColor: `${accentColor}2b`, background: 'rgba(255,255,255,0.024)' }} onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)} onFocus={() => onHover(true)} onBlur={() => onHover(false)} tabIndex={0}>
      <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[9px] uppercase tracking-[0.18em]" style={{ color: `${accentColor}b0` }}>{type}</p><h3 className="mt-1 text-sm font-semibold text-white">{experience.role}</h3><p className="mt-1 text-xs text-white/55">{experience.company}</p></div><span className="text-right text-[9px] uppercase tracking-[0.12em] text-white/40">{experience.duration}<br />{experience.location}</span></div>
      <div className="mt-4 grid gap-3 text-xs leading-relaxed text-white/55 sm:grid-cols-2"><div><p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-white/35">Responsibilities</p><ul className="grid gap-1 pl-3">{experience.responsibilities.map((item) => <li key={item}>{item}</li>)}</ul></div><div><p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-white/35">Highlights</p><ul className="grid gap-1 pl-3">{experience.achievements.map((item) => <li key={item}>{item}</li>)}</ul></div></div>
      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/[0.07] pt-3">{experience.technologies.map((technology) => <span key={technology} className="rounded-sm border border-white/10 px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-white/50">{technology}</span>)}</div>
    </article>
  );
});

ExperienceCard.displayName = 'ExperienceCard';
export default ExperienceCard;
