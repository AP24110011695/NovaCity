import React, { memo, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { useSkillFilters } from '../../hooks/useSkillFilters';
import SkillCard from './SkillCard';

const SkillGrid = memo(({ skills, accentColor }) => {
  const gridRef = useRef(null);
  const { filteredSkills } = useSkillFilters(skills);
  const categories = [...new Set(filteredSkills.map((skill) => skill.category))];

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches || !gridRef.current) return undefined;
    const context = gsap.context(() => {
      const cards = gsap.utils.toArray('.holo-skill-card');
      gsap.fromTo(cards, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, stagger: 0.055, duration: 0.45, ease: 'power3.out' });
      cards.forEach((card, index) => gsap.to(card, { y: index % 2 ? -3 : 3, duration: 2.4 + index * 0.08, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: index * 0.08 }));
    }, gridRef);
    return () => context.revert();
  }, [filteredSkills]);

  return (
    <div ref={gridRef} className="holo-skill-groups">
      {categories.map((category) => (
        <section key={category} className="holo-skill-category" aria-label={`${category} skills`}>
          <h3 className="mb-3 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: `${accentColor}c0` }}>
            <span className="h-px w-5" style={{ background: accentColor }} />{category}
          </h3>
          <div className="holo-skill-grid">
            {filteredSkills.filter((skill) => skill.category === category).map((skill) => <SkillCard key={skill.id} skill={skill} accentColor={accentColor} />)}
          </div>
        </section>
      ))}
    </div>
  );
});

SkillGrid.displayName = 'SkillGrid';
export default SkillGrid;
