import React, { memo, useCallback, useRef } from 'react';
import gsap from 'gsap';

const ResumePanel = memo(({ resume, accentColor }) => {
  const panelRef = useRef(null);
  const animateHover = useCallback((active) => { if (panelRef.current) gsap.to(panelRef.current, { y: active ? -3 : 0, duration: 0.25, ease: 'power2.out', overwrite: 'auto' }); }, []);
  return <section ref={panelRef} className="corporate-resume-panel rounded-sm border p-5" style={{ borderColor: `${accentColor}36`, background: `${accentColor}06` }} onMouseEnter={() => animateHover(true)} onMouseLeave={() => animateHover(false)}><p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: `${accentColor}b0` }}>Recruitment dossier</p><h2 className="mt-2 text-lg font-semibold text-white">{resume.label}</h2><p className="mt-2 text-sm leading-relaxed text-white/60">{resume.summary}</p><div className="mt-5"><p className="text-[9px] uppercase tracking-[0.15em] text-white/35">Skills overview</p><div className="mt-2 flex flex-wrap gap-2">{resume.skillsOverview.map((skill) => <span key={skill} className="rounded-sm border border-white/10 px-2 py-1 text-[10px] text-white/60">{skill}</span>)}</div></div><p className="mt-5 border-l-2 pl-3 text-xs leading-relaxed text-white/65" style={{ borderColor: accentColor }}>{resume.recruiterCta}</p><a href={resume.url} download className="mt-5 inline-flex items-center rounded-sm border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition-colors" style={{ borderColor: `${accentColor}80`, background: `${accentColor}18` }}>Download resume</a></section>;
});

ResumePanel.displayName = 'ResumePanel';
export default ResumePanel;
