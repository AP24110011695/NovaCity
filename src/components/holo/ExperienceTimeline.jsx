import React, { memo, useLayoutEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import ExperienceCard from './ExperienceCard';

const ExperienceTimeline = memo(({ experience, internships, accentColor }) => {
  const timelineRef = useRef(null);
  const entries = useMemo(() => [...experience.map((item) => ({ ...item, type: 'Experience' })), ...internships.map((item) => ({ ...item, type: 'Internship' }))], [experience, internships]);
  useLayoutEffect(() => {
    if (!timelineRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const context = gsap.context(() => {
      gsap.fromTo('.corporate-timeline-line', { scaleY: 0 }, { scaleY: 1, transformOrigin: 'top', duration: 0.8, ease: 'power2.inOut' });
      gsap.fromTo('.corporate-timeline-entry', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.48, stagger: 0.12, ease: 'power3.out' });
      gsap.utils.toArray('.corporate-experience-card').forEach((card, index) => gsap.to(card, { y: index % 2 ? -3 : 3, duration: 2.5 + index * 0.14, repeat: -1, yoyo: true, ease: 'sine.inOut' }));
    }, timelineRef);
    return () => context.revert();
  }, [entries]);
  return <section ref={timelineRef} className="relative" aria-label="Experience timeline"><div className="corporate-timeline-line absolute bottom-0 left-[7px] top-1 w-px" style={{ background: `linear-gradient(${accentColor}, ${accentColor}15)` }} aria-hidden="true" /><div className="grid gap-5">{entries.map((item) => <div key={item.id} className="corporate-timeline-entry relative pl-7"><span className="absolute left-0 top-2 h-[15px] w-[15px] rounded-full border" style={{ borderColor: accentColor, background: '#080a10', boxShadow: `0 0 12px ${accentColor}` }} /><ExperienceCard experience={item} type={item.type} accentColor={accentColor} /></div>)}</div></section>;
});

ExperienceTimeline.displayName = 'ExperienceTimeline';
export default ExperienceTimeline;
