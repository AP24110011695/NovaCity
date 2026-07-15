import React, { memo, useCallback, useState } from 'react';
import SocialLinks from './SocialLinks';

const ContactPanel = memo(({ contact, socialLinks, accentColor }) => {
  const [copied, setCopied] = useState(null);
  const copy = useCallback(async (label, value) => { try { await navigator.clipboard?.writeText(value); setCopied(label); window.setTimeout(() => setCopied(null), 1600); } catch { setCopied(null); } }, []);
  const channels = [{ label: 'Email', icon: '@', value: contact.email, href: `mailto:${contact.email}`, copyable: true }, { label: 'Location', icon: '◎', value: contact.location }, { label: 'Portfolio', icon: '◈', value: 'Open portfolio', href: contact.portfolioUrl }];
  return <section className="corporate-contact-panel" aria-label="Contact console"><p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: `${accentColor}b0` }}>Corporate Hub / Communication Console</p><h2 className="mt-1 text-lg font-semibold tracking-wide text-white">Start a conversation</h2><div className="mt-5 grid gap-2">{channels.map((channel) => <div key={channel.label} className="corporate-contact-channel flex items-center justify-between gap-3 rounded-sm border px-3 py-3" style={{ '--corporate-accent': accentColor, borderColor: `${accentColor}28`, background: 'rgba(255,255,255,0.022)' }}><span className="flex items-center gap-3"><span className="text-sm" style={{ color: accentColor }}>{channel.icon}</span><span><span className="block text-[9px] uppercase tracking-[0.14em] text-white/35">{channel.label}</span>{channel.href ? <a href={channel.href} target={channel.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="text-xs text-white/70">{channel.value}</a> : <span className="text-xs text-white/70">{channel.value}</span>}</span></span>{channel.copyable && <button type="button" onClick={() => copy(channel.label, channel.value)} className="text-[9px] uppercase tracking-[0.12em]" style={{ color: accentColor }}>{copied === channel.label ? 'Copied' : 'Copy'}</button>}</div>)}</div><h3 className="mt-6 mb-3 text-[10px] uppercase tracking-[0.2em] text-white/40">Social links</h3><SocialLinks links={socialLinks} accentColor={accentColor} /></section>;
});

ContactPanel.displayName = 'ContactPanel';
export default ContactPanel;
