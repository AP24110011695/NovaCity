import React, { memo } from 'react';
import { researchNexusPortfolio } from '../../data/portfolio/portfolioData';
import SkillGrid from './SkillGrid';

const ResearchSkills = memo(({ accentColor }) => (
  <section className="holo-research-skills" aria-label="Research Nexus skills and technologies">
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: `${accentColor}b0` }}>Research Nexus / Technology Matrix</p>
        <h2 className="mt-1 text-lg font-semibold tracking-wide text-white">Skills &amp; technologies</h2>
      </div>
      <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-white/35">{researchNexusPortfolio.skills.length} signals</span>
    </div>
    <SkillGrid skills={researchNexusPortfolio.skills} accentColor={accentColor} />
  </section>
));

ResearchSkills.displayName = 'ResearchSkills';
export default ResearchSkills;
