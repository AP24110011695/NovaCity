import React, { memo, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

const EducationTimeline = memo(({ entries, accentColor }) => {
  const timelineRef = useRef(null);

  useLayoutEffect(() => {
    if (!timelineRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const context = gsap.context(() => {
      gsap.fromTo('.academy-timeline-line', { scaleY: 0 }, { scaleY: 1, duration: 0.75, ease: 'power2.inOut', transformOrigin: 'top' });
      gsap.fromTo('.academy-timeline-entry', { autoAlpha: 0, x: 22 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.16, ease: 'power3.out' });
    }, timelineRef);
    return () => context.revert();
  }, [entries]);

  return (
    <section ref={timelineRef} className="academy-timeline relative" aria-label="Education timeline">
      <div className="academy-timeline-line absolute bottom-0 left-[7px] top-1 w-px" style={{ background: `linear-gradient(${accentColor}, ${accentColor}20)` }} aria-hidden="true" />
      <div className="grid gap-5">
        {entries.map((entry) => (
          <article key={entry.id} className="academy-timeline-entry relative pl-7">
            <span className="absolute left-0 top-1 h-[15px] w-[15px] rounded-full border" style={{ borderColor: accentColor, background: '#080a10', boxShadow: `0 0 12px ${accentColor}` }} aria-hidden="true" />
            <div className="rounded-sm border p-4" style={{ borderColor: `${accentColor}28`, background: `${accentColor}05` }}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: `${accentColor}b0` }}>{entry.institution}</p>
                  <h3 className="mt-1 text-sm font-semibold text-white">{entry.degree}</h3>
                </div>
                <span className="text-[10px] uppercase tracking-[0.14em] text-white/45">{entry.duration}</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white/55">{entry.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px]">
                <span className="rounded-sm border px-2 py-1 uppercase tracking-[0.12em]" style={{ color: accentColor, borderColor: `${accentColor}48` }}>CGPA: {entry.cgpa}</span>
                {entry.coursework.map((course) => <span key={course} className="text-white/40">{course}</span>)}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
});

EducationTimeline.displayName = 'EducationTimeline';
export default EducationTimeline;
