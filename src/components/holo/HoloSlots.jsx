/**
 * HoloSlots.jsx
 *
 * Empty content slots — framework stubs that will be replaced
 * with real portfolio content in future phases.
 *
 * Each slot renders a futuristic "INCOMING TRANSMISSION" placeholder
 * so the UI looks intentional even before content exists.
 */
import React, { memo } from 'react';

// ─── Shared empty-slot placeholder ───────────────────────────────────────────
const EmptySlot = ({ label, accentColor, description }) => (
  <div
    className="holo-slot flex flex-col items-center justify-center gap-4 p-10 rounded-sm border text-center"
    style={{
      borderColor: `${accentColor}20`,
      background: `${accentColor}06`,
    }}
  >
    {/* Animated signal icon */}
    <div
      className="holo-slot-icon flex items-center justify-center w-16 h-16 rounded-full"
      style={{
        border: `1px solid ${accentColor}40`,
        boxShadow: `0 0 30px ${accentColor}20`,
        animation: 'holo-pulse 3s ease-in-out infinite',
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth={1} className="w-7 h-7 opacity-60">
        <path strokeLinecap="round" d="M12 4v2m0 12v2M4 12H2m20 0h-2m-2.343-5.657-1.414 1.414M7.757 16.243l-1.414 1.414M19.071 19.071l-1.414-1.414M7.757 7.757 6.343 6.343" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </div>

    <div>
      <p className="text-[10px] tracking-[0.4em] uppercase mb-2" style={{ color: `${accentColor}80` }}>
        Incoming Transmission
      </p>
      <h3 className="text-sm font-semibold tracking-[0.15em] uppercase text-white/60 m-0">
        {label}
      </h3>
      {description && (
        <p className="text-xs text-white/30 mt-2 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
    </div>

    {/* Loading bar */}
    <div className="w-32 h-px" style={{ background: `${accentColor}20` }}>
      <div
        className="h-full"
        style={{
          background: accentColor,
          width: '30%',
          animation: 'holo-scan-bar 2s ease-in-out infinite',
          boxShadow: `0 0 8px ${accentColor}`,
        }}
      />
    </div>
  </div>
);

// ─── Individual slot exports ──────────────────────────────────────────────────
export const ProjectsSlot = memo(({ accentColor }) => (
  <EmptySlot
    label="Projects"
    accentColor={accentColor}
    description="Showcase of engineering, design, and research projects. Content initializing…"
  />
));

export const SkillsSlot = memo(({ accentColor }) => (
  <EmptySlot
    label="Skills"
    accentColor={accentColor}
    description="Technical capabilities, frameworks, and proficiency ratings. Content initializing…"
  />
));

export const ExperienceSlot = memo(({ accentColor }) => (
  <EmptySlot
    label="Experience"
    accentColor={accentColor}
    description="Career timeline and professional highlights. Content initializing…"
  />
));

export const EducationSlot = memo(({ accentColor }) => (
  <EmptySlot
    label="Education"
    accentColor={accentColor}
    description="Academic background and qualifications. Content initializing…"
  />
));

export const AchievementsSlot = memo(({ accentColor }) => (
  <EmptySlot
    label="Achievements"
    accentColor={accentColor}
    description="Awards, certifications, and milestones. Content initializing…"
  />
));

export const ResumeSlot = memo(({ accentColor }) => (
  <EmptySlot
    label="Résumé"
    accentColor={accentColor}
    description="Full CV document viewer. Content initializing…"
  />
));

export const ContactSlot = memo(({ accentColor }) => (
  <EmptySlot
    label="Contact"
    accentColor={accentColor}
    description="Get in touch, collaboration inquiries, and links. Content initializing…"
  />
));

ProjectsSlot.displayName     = 'ProjectsSlot';
SkillsSlot.displayName       = 'SkillsSlot';
ExperienceSlot.displayName   = 'ExperienceSlot';
EducationSlot.displayName    = 'EducationSlot';
AchievementsSlot.displayName = 'AchievementsSlot';
ResumeSlot.displayName       = 'ResumeSlot';
ContactSlot.displayName      = 'ContactSlot';
