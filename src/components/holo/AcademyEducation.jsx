import React, { memo, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { academySpirePortfolio } from '../../data/portfolio/portfolioData';
import AcademicStats from './AcademicStats';
import CertificationCard from './CertificationCard';
import EducationTimeline from './EducationTimeline';

const AcademyEducation = memo(({ accentColor }) => {
  const sectionRef = useRef(null);
  useLayoutEffect(() => {
    if (!sectionRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const context = gsap.context(() => gsap.fromTo('.academy-certification-card', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.1, ease: 'power3.out' }), sectionRef);
    return () => context.revert();
  }, []);
  const { education, certifications, achievements, timeline } = academySpirePortfolio;
  return <section ref={sectionRef} aria-label="Academy Spire education and certifications"><header className="mb-5"><p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: `${accentColor}b0` }}>Academy Spire / Academic Record</p><h2 className="mt-1 text-lg font-semibold tracking-wide text-white">Education &amp; credentials</h2></header><AcademicStats education={education} certifications={certifications} achievements={achievements} accentColor={accentColor} /><div className="mt-6"><EducationTimeline entries={timeline} accentColor={accentColor} /></div><div className="mt-6"><h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: `${accentColor}c0` }}>Credential archive</h3><div className="grid gap-3 sm:grid-cols-2">{certifications.map((certification) => <CertificationCard key={certification.id} certification={certification} accentColor={accentColor} />)}</div></div></section>;
});

AcademyEducation.displayName = 'AcademyEducation';
export default AcademyEducation;
