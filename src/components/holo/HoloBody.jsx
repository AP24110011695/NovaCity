/**
 * HoloBody.jsx
 *
 * The scrollable main content region of the Holographic Window.
 * Switches between content slots based on the active tab.
 * Applies a lazy-render pattern: only mounts when visible.
 */
import React, { memo, Suspense, lazy } from 'react';
import {
  ProjectsSlot,
  SkillsSlot,
  ExperienceSlot,
  EducationSlot,
  AchievementsSlot,
  ResumeSlot,
  ContactSlot,
} from './HoloSlots';

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

const HoloBody = memo(({ activeTab, accentColor }) => {
  const SlotComponent = SLOT_MAP[activeTab] ?? ProjectsSlot;

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
        <SlotComponent accentColor={accentColor} />
      </Suspense>
    </div>
  );
});

HoloBody.displayName = 'HoloBody';
export default HoloBody;
