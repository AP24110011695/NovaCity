import React, { memo, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { innovationTowerPortfolio } from '../../data/portfolio/portfolioData';
import ProjectCard from './ProjectCard';

const InnovationProjects = memo(({ accentColor }) => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches || !sectionRef.current) return undefined;

    const context = gsap.context(() => {
      gsap.fromTo(
        '.holo-project-card',
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.52, stagger: 0.1, ease: 'power3.out', clearProps: 'transform' }
      );
    }, sectionRef);

    return () => context.revert();
  }, []);

  return (
    <section ref={sectionRef} className="holo-projects" aria-label="Innovation Tower projects">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: `${accentColor}b0` }}>Innovation Tower / Project Archive</p>
          <h2 className="mt-1 text-lg font-semibold tracking-wide text-white">Active transmissions</h2>
        </div>
        <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-white/35">{innovationTowerPortfolio.projects.length} nodes</span>
      </div>
      <div className="holo-project-grid">
        {innovationTowerPortfolio.projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} accentColor={accentColor} />
        ))}
      </div>
    </section>
  );
});

InnovationProjects.displayName = 'InnovationProjects';
export default InnovationProjects;
