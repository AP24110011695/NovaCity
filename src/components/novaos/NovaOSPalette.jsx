import React, { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { useNovaOS } from './NovaOSProvider';

const NovaOSPalette = memo(() => {
  const { closeCommandPalette, openDestination, query, quickActions, results, setQuery } = useNovaOS();
  const paletteRef = useRef(null);
  const inputRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const entries = useMemo(() => (query ? results : quickActions), [query, quickActions, results]);

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      gsap.fromTo('.nova-os-palette', { autoAlpha: 0, scale: 0.94, filter: 'blur(12px)' }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 0.4, ease: 'power3.out' });
      gsap.fromTo('.nova-os-result', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.32, stagger: 0.045, ease: 'power2.out' });
    }, paletteRef);
    inputRef.current?.focus();
    return () => context.revert();
  }, []);

  useEffect(() => setActiveIndex(0), [query]);
  useEffect(() => {
    const palette = paletteRef.current;
    if (!palette) return;
    gsap.to(palette.querySelectorAll('.nova-os-result'), { x: 0, duration: 0.14, ease: 'power2.out', overwrite: 'auto' });
    const active = palette.querySelector(`[data-result-index="${activeIndex}"]`);
    if (active) gsap.to(active, { x: 3, duration: 0.16, ease: 'power2.out', overwrite: 'auto' });
  }, [activeIndex]);

  const selectEntry = (entry) => { if (entry) openDestination(entry); };
  const onKeyDown = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); closeCommandPalette(); }
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => (index + 1) % Math.max(entries.length, 1)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => (index - 1 + entries.length) % Math.max(entries.length, 1)); }
    if (event.key === 'Enter') { event.preventDefault(); selectEntry(entries[activeIndex]); }
    if (event.key === 'Tab') {
      const focusable = paletteRef.current?.querySelectorAll('input, button:not([disabled])');
      if (!focusable?.length) return;
      const items = [...focusable];
      const current = items.indexOf(document.activeElement);
      const next = event.shiftKey ? (current <= 0 ? items.length - 1 : current - 1) : (current === items.length - 1 ? 0 : current + 1);
      event.preventDefault();
      items[next].focus();
    }
  };

  return <div className="nova-os-backdrop fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" onMouseDown={closeCommandPalette}><section ref={paletteRef} className="nova-os-palette w-full max-w-2xl overflow-hidden rounded-sm border" onMouseDown={(event) => event.stopPropagation()} onKeyDown={onKeyDown} role="dialog" aria-modal="true" aria-label="Nova OS command palette"><div className="border-b border-white/10 px-4 py-3"><label className="flex items-center gap-3"><span className="text-sm text-cyan-200">⌕</span><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Nova City or run a command…" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30" /><kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-white/35">ESC</kbd></label></div><div className="max-h-[52vh] overflow-y-auto p-2">{entries.length ? entries.map((entry, index) => <button key={entry.id} type="button" data-result-index={index} onMouseEnter={() => setActiveIndex(index)} onClick={() => selectEntry(entry)} className="nova-os-result flex w-full items-center gap-3 rounded-sm px-3 py-3 text-left" aria-selected={activeIndex === index}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-cyan-200/20 bg-cyan-200/[0.06] text-xs text-cyan-200">{entry.icon}</span><span className="min-w-0 flex-1"><span className="block text-xs font-medium text-white/85">{entry.title}</span><span className="block truncate text-[10px] text-white/40">{entry.subtitle}</span></span><span className="text-[9px] uppercase tracking-[0.13em] text-white/30">{entry.category}</span></button>) : <p className="px-3 py-8 text-center text-xs text-white/35">No signals matched your query.</p>}</div><footer className="flex justify-between border-t border-white/10 px-4 py-2 text-[9px] uppercase tracking-[0.13em] text-white/30"><span>↑↓ Navigate · Enter Select</span><span>Nova OS</span></footer></section></div>;
});

NovaOSPalette.displayName = 'NovaOSPalette';
export default NovaOSPalette;
