import React from 'react';
import { InfographicBlock, InfographicSpec, Tone } from './types';

/**
 * Renders an InfographicSpec into a clean, brand-consistent visual panel.
 * Brand palette: brand-primary (red #B3202F), brand-secondary (yellow #FFC748),
 * brand-dark (#2A0A0E). Diagram-led, minimal prose — reads as an infographic.
 */

const toneText: Record<Tone, string> = {
  red: 'text-brand-primary',
  amber: 'text-amber-700',
  slate: 'text-slate-600',
};
const toneDot: Record<Tone, string> = {
  red: 'bg-brand-primary',
  amber: 'bg-amber-500',
  slate: 'bg-slate-400',
};
const toneCard: Record<Tone, string> = {
  red: 'border-brand-primary/20 bg-brand-primary/5',
  amber: 'border-amber-200 bg-amber-50',
  slate: 'border-slate-200 bg-slate-50',
};
const toneTag: Record<Tone, string> = {
  red: 'bg-brand-primary/15 text-brand-primary',
  amber: 'bg-amber-200 text-amber-800',
  slate: 'bg-slate-200 text-slate-600',
};

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="mb-2.5 flex items-center gap-2 font-display text-sm font-bold text-brand-dark">
    <span className="h-4 w-1.5 rounded-full bg-brand-secondary" />
    {children}
  </h3>
);

const Block: React.FC<{ block: InfographicBlock }> = ({ block }) => {
  switch (block.kind) {
    case 'diagram':
      return (
        <section>
          {block.heading && <SectionHeading>{block.heading}</SectionHeading>}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            {block.svg}
            {block.caption && (
              <p className="mt-2 text-center text-[10.5px] italic text-slate-400">{block.caption}</p>
            )}
          </div>
        </section>
      );

    case 'steps':
      return (
        <section>
          <SectionHeading>{block.heading}</SectionHeading>
          <div className="grid grid-cols-2 gap-2.5">
            {block.items.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                {block.ordered !== false && (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary text-[11px] font-extrabold text-white">
                    {i + 1}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-[11.5px] font-semibold leading-tight text-slate-700">{s.label}</p>
                  {s.sub && <p className="mt-0.5 text-[10px] leading-tight text-slate-400">{s.sub}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case 'compare':
      return (
        <section>
          <SectionHeading>{block.heading}</SectionHeading>
          <div className={`grid gap-3 ${block.columns.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {block.columns.map((c, i) => {
              const tone = c.tone ?? (i === 0 ? 'red' : 'amber');
              return (
                <div key={i} className={`rounded-xl border p-3 ${toneCard[tone]}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className={`font-display text-[13px] font-extrabold ${toneText[tone]}`}>{c.title}</span>
                    {c.tag && <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${toneTag[tone]}`}>{c.tag}</span>}
                  </div>
                  <ul className="mt-2 flex flex-col gap-1.5 text-[11px] font-medium text-slate-600">
                    {c.points.map((p, j) => (
                      <li key={j} className="flex items-start gap-1.5">
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${toneDot[tone]}`} />
                        <span className="leading-snug">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      );

    case 'formula':
      return (
        <section>
          <SectionHeading>{block.heading}</SectionHeading>
          <div className="flex flex-col gap-2.5">
            {block.items.map((f, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3 shadow-sm">
                <p className="text-center font-mono text-base font-bold text-brand-primary">{f.expr}</p>
                {f.note && <p className="mt-1.5 text-center text-[11px] text-slate-500">{f.note}</p>}
              </div>
            ))}
          </div>
        </section>
      );

    case 'stats':
      return (
        <section>
          <SectionHeading>{block.heading}</SectionHeading>
          <div className={`grid gap-3 ${block.items.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {block.items.map((s, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                <p className="font-display text-lg font-extrabold leading-none text-brand-primary">{s.value}</p>
                <p className="mt-1.5 text-[10.5px] font-medium leading-tight text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case 'points':
      return (
        <section>
          <SectionHeading>{block.heading}</SectionHeading>
          <div className="flex flex-col gap-2">
            {block.items.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${toneDot[block.tone ?? 'red']}`} />
                <div>
                  <p className="text-[12px] font-semibold leading-tight text-slate-700">{s.label}</p>
                  {s.sub && <p className="mt-0.5 text-[10.5px] leading-snug text-slate-400">{s.sub}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case 'facts':
      return (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
          <p className="mb-2 font-display text-[12px] font-bold text-amber-800">{block.heading}</p>
          <div className="flex flex-wrap gap-1.5">
            {block.items.map((f, i) => (
              <span key={i} className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 shadow-sm">{f}</span>
            ))}
          </div>
        </section>
      );

    default:
      return null;
  }
};

const InfographicRenderer: React.FC<{ spec: InfographicSpec }> = ({ spec }) => (
  <div className="flex flex-col gap-5 font-sans text-slate-800">
    {/* Hero */}
    <section className="rounded-2xl bg-gradient-to-br from-brand-primary to-rose-700 px-5 py-4 text-white shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-secondary">{spec.eyebrow}</p>
        {spec.ncertRef && (
          <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold">{spec.ncertRef}</span>
        )}
      </div>
      <h2 className="mt-1 font-display text-2xl font-extrabold leading-tight">{spec.title}</h2>
      {spec.tagline && <p className="mt-1.5 text-[12.5px] leading-snug text-white/90">{spec.tagline}</p>}
    </section>

    {spec.blocks.map((block, i) => (
      <Block key={i} block={block} />
    ))}
  </div>
);

export default InfographicRenderer;
