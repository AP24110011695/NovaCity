/**
 * HoloNav.jsx
 *
 * Tab navigation for the Holographic Portfolio Window.
 * Each tab maps to a future content slot (Projects, Skills, etc.)
 * Active tab is highlighted with the landmark's accent color.
 */
import React, { memo } from 'react';

const CONTENT_TABS = [
  { id: 'projects',     label: 'Projects',     icon: '◈' },
  { id: 'skills',       label: 'Skills',        icon: '◎' },
  { id: 'experience',   label: 'Experience',    icon: '◉' },
  { id: 'education',    label: 'Education',     icon: '◇' },
  { id: 'achievements', label: 'Achievements',  icon: '✦' },
  { id: 'resume',       label: 'Résumé',        icon: '≡' },
  { id: 'contact',      label: 'Contact',       icon: '⊕' },
];

const HoloNav = memo(({ activeTab, onTabChange, accentColor }) => {
  return (
    <nav
      role="tablist"
      aria-label="Portfolio sections"
      className="holo-nav flex items-center gap-1 px-4 border-b border-white/10 overflow-x-auto"
    >
      {CONTENT_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`holo-panel-${tab.id}`}
            id={`holo-tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => {
              // Arrow key navigation between tabs
              const tabs = CONTENT_TABS.map(t => t.id);
              const idx = tabs.indexOf(activeTab);
              if (e.key === 'ArrowRight') onTabChange(tabs[(idx + 1) % tabs.length]);
              if (e.key === 'ArrowLeft')  onTabChange(tabs[(idx - 1 + tabs.length) % tabs.length]);
            }}
            className="holo-nav-tab relative flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-[0.15em] uppercase whitespace-nowrap transition-all duration-300 outline-none"
            style={{
              color: isActive ? accentColor : 'rgba(255,255,255,0.4)',
              borderBottom: isActive ? `2px solid ${accentColor}` : '2px solid transparent',
            }}
          >
            {/* Focus ring */}
            <span className="absolute inset-0 rounded-sm ring-offset-0 focus-visible:ring-2 focus-visible:ring-white/40 pointer-events-none" />
            <span className="opacity-70">{tab.icon}</span>
            {tab.label}
            {/* Active tab glow */}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: `${accentColor}`, boxShadow: `0 0 8px 2px ${accentColor}80` }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
});

HoloNav.displayName = 'HoloNav';
export { CONTENT_TABS };
export default HoloNav;
