import React, { memo, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { corporateHubPortfolio } from '../../data/portfolio/portfolioData';
import ExperienceTimeline from './ExperienceTimeline';

const CorporateExperience = memo(({ accentColor }) => { const ref = useRef(null); useLayoutEffect(() => { if (!ref.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined; const context = gsap.context(() => gsap.fromTo('.corporate-experience-title', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }), ref); return () => context.revert(); }, []); return <section ref={ref}><header className="corporate-experience-title mb-5"><p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: `${accentColor}b0` }}>Corporate Hub / Career Log</p><h2 className="mt-1 text-lg font-semibold tracking-wide text-white">Experience &amp; internships</h2></header><ExperienceTimeline experience={corporateHubPortfolio.experience} internships={corporateHubPortfolio.internships} accentColor={accentColor} /></section>; });
CorporateExperience.displayName = 'CorporateExperience'; export default CorporateExperience;
