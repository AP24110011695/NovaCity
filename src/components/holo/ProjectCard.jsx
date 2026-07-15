import React, { memo, useCallback, useRef } from 'react';
import gsap from 'gsap';

const ExternalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5v5m0-5L10 14" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.54 1.04 1.54 1.04.9 1.53 2.35 1.09 2.92.84.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.54 9.54 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.95.36.31.68.9.68 1.81v2.68c0 .26.18.57.69.48A10 10 0 0 0 12 2Z" />
  </svg>
);

const ProjectCard = memo(({ project, accentColor, index }) => {
  const cardRef = useRef(null);
  const glowRef = useRef(null);

  const animateGlow = useCallback((visible) => {
    if (!glowRef.current) return;
    gsap.to(glowRef.current, {
      opacity: visible ? 1 : 0,
      scale: visible ? 1 : 0.92,
      duration: visible ? 0.28 : 0.38,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  }, []);

  return (
    <article
      ref={cardRef}
      className="holo-project-card group relative flex min-w-0 flex-col overflow-hidden rounded-sm border p-4 sm:p-5"
      style={{ '--project-accent': accentColor, borderColor: `${accentColor}26`, background: 'rgba(255,255,255,0.025)' }}
      onMouseEnter={() => animateGlow(true)}
      onMouseLeave={() => animateGlow(false)}
      onFocus={() => animateGlow(true)}
      onBlur={() => animateGlow(false)}
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl"
        style={{ background: accentColor, opacity: 0, transform: 'scale(0.92)' }}
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {project.featured && (
            <span className="rounded border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ borderColor: `${accentColor}70`, color: accentColor, background: `${accentColor}12` }}>
              Featured
            </span>
          )}
          <span className="text-[9px] uppercase tracking-[0.16em] text-white/40">{project.status}</span>
        </div>
        <span className="font-mono text-[10px] text-white/30">{String(index + 1).padStart(2, '0')}</span>
      </div>

      <h3 className="relative mt-4 text-base font-semibold tracking-wide text-white">{project.title}</h3>
      <p className="relative mt-2 flex-1 text-xs leading-relaxed text-white/55">{project.description}</p>

      <div className="relative mt-4 flex flex-wrap gap-1.5">
        {project.technologies.map((technology) => (
          <span key={technology} className="rounded-sm border border-white/10 bg-white/[0.03] px-2 py-1 text-[9px] uppercase tracking-[0.11em] text-white/55">
            {technology}
          </span>
        ))}
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2 border-t border-white/[0.07] pt-3">
        {project.githubUrl && (
          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="holo-project-action" style={{ '--project-accent': accentColor }}>
            <GitHubIcon /> Source
          </a>
        )}
        {project.demoUrl && (
          <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="holo-project-action" style={{ '--project-accent': accentColor }}>
            <ExternalIcon /> Demo
          </a>
        )}
      </div>
    </article>
  );
});

ProjectCard.displayName = 'ProjectCard';
export default ProjectCard;
