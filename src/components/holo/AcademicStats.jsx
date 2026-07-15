import React, { memo, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

const AcademicStats = memo(({ education, certifications, achievements, accentColor }) => {
  const statsRef = useRef(null);
  const stats = [['Education', education.length], ['Credentials', certifications.length], ['Milestones', achievements.length]];
  useLayoutEffect(() => {
    if (!statsRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const context = gsap.context(() => gsap.fromTo('.academy-stat', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' }), statsRef);
    return () => context.revert();
  }, []);
  return <div ref={statsRef} className="academy-stats grid grid-cols-3 gap-2">{stats.map(([label, value]) => <div key={label} className="academy-stat rounded-sm border px-2 py-3 text-center" style={{ borderColor: `${accentColor}24`, background: `${accentColor}04` }}><span className="block text-base font-semibold" style={{ color: accentColor }}>{value}</span><span className="text-[8px] uppercase tracking-[0.13em] text-white/40">{label}</span></div>)}</div>;
});

AcademicStats.displayName = 'AcademicStats';
export default AcademicStats;
