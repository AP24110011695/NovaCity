import React, { memo, useCallback, useRef } from 'react';
import gsap from 'gsap';

const CertificationCard = memo(({ certification, accentColor }) => {
  const glowRef = useRef(null);
  const toggleGlow = useCallback((visible) => {
    if (glowRef.current) gsap.to(glowRef.current, { opacity: visible ? 1 : 0, scale: visible ? 1 : 0.9, duration: 0.28, ease: 'power2.out', overwrite: 'auto' });
  }, []);

  return (
    <article className="academy-certification-card relative overflow-hidden rounded-sm border p-4" style={{ '--academy-accent': accentColor, borderColor: `${accentColor}2c`, background: 'rgba(255,255,255,0.024)' }} onMouseEnter={() => toggleGlow(true)} onMouseLeave={() => toggleGlow(false)} onFocus={() => toggleGlow(true)} onBlur={() => toggleGlow(false)} tabIndex={0}>
      <div ref={glowRef} className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl" style={{ background: accentColor, opacity: 0, transform: 'scale(0.9)' }} aria-hidden="true" />
      <div className="relative flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border font-mono text-[10px] tracking-wider" style={{ color: accentColor, borderColor: `${accentColor}60`, background: `${accentColor}10` }}>{certification.badge}</span>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: `${accentColor}b0` }}>{certification.issuer}</p>
          <h3 className="mt-1 text-sm font-semibold text-white">{certification.title}</h3>
          <p className="mt-2 text-xs leading-relaxed text-white/50">{certification.description}</p>
        </div>
      </div>
      <div className="relative mt-4 flex flex-wrap justify-between gap-2 border-t border-white/[0.07] pt-3 text-[9px] uppercase tracking-[0.12em] text-white/40">
        <span>{certification.completionDate}</span><span>ID: {certification.credentialId}</span>
        {certification.verificationUrl && <a href={certification.verificationUrl} target="_blank" rel="noopener noreferrer" style={{ color: accentColor }}>Verify</a>}
      </div>
    </article>
  );
});

CertificationCard.displayName = 'CertificationCard';
export default CertificationCard;
