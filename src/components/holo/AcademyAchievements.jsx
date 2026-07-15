import React, { memo, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { academySpirePortfolio } from '../../data/portfolio/portfolioData';
import AchievementBadge from './AchievementBadge';

const AcademyAchievements = memo(({ accentColor }) => {
  const wallRef = useRef(null);
  useLayoutEffect(() => {
    if (!wallRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const context = gsap.context(() => {
      const badges = gsap.utils.toArray('.academy-achievement-badge');
      gsap.fromTo(badges, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.48, stagger: 0.11, ease: 'power3.out' });
      badges.forEach((badge, index) => gsap.to(badge, { y: index % 2 ? -3 : 3, duration: 2.5 + index * 0.15, repeat: -1, yoyo: true, ease: 'sine.inOut' }));
    }, wallRef);
    return () => context.revert();
  }, []);
  return <section ref={wallRef} aria-label="Academy Spire achievements"><header className="mb-5"><p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: `${accentColor}b0` }}>Academy Spire / Milestone Wall</p><h2 className="mt-1 text-lg font-semibold tracking-wide text-white">Achievements</h2></header><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{academySpirePortfolio.achievements.map((achievement) => <AchievementBadge key={achievement.id} achievement={achievement} accentColor={accentColor} />)}</div></section>;
});

AcademyAchievements.displayName = 'AcademyAchievements';
export default AcademyAchievements;
