/**
 * HoloBody.jsx
 *
 * The scrollable main content region of the Holographic Window.
 * Switches between content slots based on the active tab.
 * Applies a lazy-render pattern: only mounts when visible.
 */
import React, { lazy, memo, Suspense } from 'react';
import {
  ProjectsSlot,
  SkillsSlot,
  ExperienceSlot,
  EducationSlot,
  AchievementsSlot,
  ResumeSlot,
  ContactSlot,
} from './HoloSlots';
import InnovationProjects from './InnovationProjects';

const ResearchSkills = lazy(() => import('./ResearchSkills'));
const AcademyEducation = lazy(() => import('./AcademyEducation'));
const AcademyAchievements = lazy(() => import('./AcademyAchievements'));
const CorporateExperience = lazy(() => import('./CorporateExperience'));
const CorporateResume = lazy(() => import('./CorporateResume'));
const CorporateContact = lazy(() => import('./CorporateContact'));

// Minimal fallback while a slot loads
const SlotFallback = () => (
  <div className="flex items-center justify-center h-48 text-white/20 text-xs tracking-widest animate-pulse">
    DECRYPTING…
  </div>
);

const SLOT_MAP = {
  projects:     ProjectsSlot,
  skills:       SkillsSlot,
  experience:   ExperienceSlot,
  education:    EducationSlot,
  achievements: AchievementsSlot,
  resume:       ResumeSlot,
  contact:      ContactSlot,
};

const HoloBody = memo(({ activeTab, accentColor, landmark }) => {
  const SlotComponent = SLOT_MAP[activeTab] ?? ProjectsSlot;
  const isInnovationProjects = landmark.id === 'landmark-innovation' && activeTab === 'projects';
  const isResearchSkills = landmark.id === 'landmark-research' && activeTab === 'skills';
  const isAcademyEducation = landmark.id === 'landmark-academy' && activeTab === 'education';
  const isAcademyAchievements = landmark.id === 'landmark-academy' && activeTab === 'achievements';
  const isCorporateExperience = landmark.id === 'landmark-corporate' && activeTab === 'experience';
  const isCorporateResume = landmark.id === 'landmark-corporate' && activeTab === 'resume';
  const isCorporateContact = landmark.id === 'landmark-corporate' && activeTab === 'contact';

  return (
    <div
      role="tabpanel"
      id={`holo-panel-${activeTab}`}
      aria-labelledby={`holo-tab-${activeTab}`}
      className="holo-body flex-1 overflow-y-auto px-6 py-6"
      tabIndex={0}
    >
      {/* Scan lines overlay — purely cosmetic */}
      <div className="holo-scanlines pointer-events-none absolute inset-0 z-10" aria-hidden="true" />

      <Suspense fallback={<SlotFallback />}>
        {isInnovationProjects ? <InnovationProjects accentColor={accentColor} /> : isResearchSkills ? <ResearchSkills accentColor={accentColor} /> : isAcademyEducation ? <AcademyEducation accentColor={accentColor} /> : isAcademyAchievements ? <AcademyAchievements accentColor={accentColor} /> : isCorporateExperience ? <CorporateExperience accentColor={accentColor} /> : isCorporateResume ? <CorporateResume accentColor={accentColor} /> : isCorporateContact ? <CorporateContact accentColor={accentColor} /> : <SlotComponent accentColor={accentColor} />}
      </Suspense>
    </div>
  );
});

HoloBody.displayName = 'HoloBody';
export default HoloBody;
