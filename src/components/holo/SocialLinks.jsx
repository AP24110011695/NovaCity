import React, { memo } from 'react';

const SocialLinks = memo(({ links, accentColor }) => <div className="grid gap-2 sm:grid-cols-3">{links.map((link) => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="corporate-social-link flex items-center gap-2 rounded-sm border px-3 py-2" style={{ '--corporate-accent': accentColor, borderColor: `${accentColor}2c` }}><span className="flex h-6 w-6 items-center justify-center rounded-sm text-[9px] font-semibold" style={{ color: accentColor, background: `${accentColor}12` }}>{link.icon}</span><span className="text-[10px] uppercase tracking-[0.12em] text-white/65">{link.label}</span></a>)}</div>);

SocialLinks.displayName = 'SocialLinks';
export default SocialLinks;
