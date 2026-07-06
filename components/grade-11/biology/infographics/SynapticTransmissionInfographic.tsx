import React from 'react';

/**
 * Visual infographic for "Synaptic Transmission" (NCERT Class 11, §18.3.2 —
 * Neural Control and Coordination). Diagram-led, minimal prose.
 * Brand palette: brand-primary red, brand-secondary yellow, brand-dark.
 * Content verified against NCERT Class 11 Biology.
 */

// Short, NCERT-faithful step labels (no long sentences — infographic style).
const FLOW: { n: number; label: string; icon: React.ReactNode }[] = [
  {
    n: 1,
    label: 'Impulse reaches axon terminal',
    icon: (
      <path d="M2 12h6l2-6 3 12 2-6h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    n: 2,
    label: 'Vesicles move to membrane',
    icon: (
      <>
        <circle cx="8" cy="8" r="3" fill="currentColor" />
        <circle cx="15" cy="14" r="3" fill="currentColor" opacity="0.6" />
        <path d="M11 9l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    n: 3,
    label: 'Fuse & release neurotransmitter',
    icon: (
      <>
        <path d="M4 6a4 4 0 0 1 4 4v0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="13" cy="9" r="1.6" fill="currentColor" />
        <circle cx="17" cy="13" r="1.6" fill="currentColor" />
        <circle cx="14" cy="16" r="1.6" fill="currentColor" />
      </>
    ),
  },
  {
    n: 4,
    label: 'Binds receptors',
    icon: (
      <>
        <circle cx="8" cy="12" r="2.4" fill="currentColor" />
        <rect x="13" y="9" width="6" height="6" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M10.4 12H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
  {
    n: 5,
    label: 'Ion channels open',
    icon: (
      <>
        <path d="M7 4v16M17 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 12h4M12 10v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
  {
    n: 6,
    label: 'New potential (EPSP / IPSP)',
    icon: (
      <path d="M2 16h5l3-9 3 6 2-3h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

const StepIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">{children}</svg>
);

const SynapticTransmissionInfographic: React.FC = () => {
  return (
    <div className="flex flex-col gap-5 font-sans text-slate-800">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-brand-primary to-rose-700 px-5 py-4 text-white shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-secondary">Neural Control &amp; Coordination</p>
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold">NCERT §18.3.2</span>
        </div>
        <h2 className="mt-1 font-display text-2xl font-extrabold leading-tight">Synaptic Transmission</h2>
      </section>

      {/* CENTREPIECE: labelled synapse diagram */}
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <svg viewBox="0 0 380 260" className="w-full" role="img" aria-label="Labelled diagram of a chemical synapse">
          {/* Axon feeding the terminal */}
          <path d="M10 118 h60" stroke="#B3202F" strokeWidth="16" strokeLinecap="round" opacity="0.35" />
          <text x="14" y="104" fontSize="9" fontWeight="700" fill="#B3202F">Axon</text>

          {/* Pre-synaptic terminal (knob) */}
          <path d="M60 70 Q150 55 168 118 Q160 178 90 175 Q45 170 55 120 Z" fill="#B3202F" opacity="0.12" stroke="#B3202F" strokeWidth="2" />
          <text x="66" y="52" fontSize="10" fontWeight="800" fill="#B3202F">Pre-synaptic terminal</text>

          {/* Synaptic vesicles */}
          <circle cx="92" cy="100" r="11" fill="#FFC748" stroke="#B3202F" strokeWidth="1.5" />
          <circle cx="120" cy="126" r="11" fill="#FFC748" stroke="#B3202F" strokeWidth="1.5" />
          <circle cx="98" cy="140" r="9" fill="#FFC748" stroke="#B3202F" strokeWidth="1.5" />
          {/* fusing vesicle at membrane */}
          <path d="M150 108 a10 10 0 0 1 0 20" fill="#FFC748" stroke="#B3202F" strokeWidth="1.5" />
          <text x="60" y="200" fontSize="9" fill="#7c2d12">Synaptic vesicles</text>
          <line x1="98" y1="140" x2="90" y2="192" stroke="#cbd5e1" strokeWidth="1" />

          {/* Neurotransmitter dots crossing the cleft */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={i} cx={176 + (i % 3) * 12} cy={100 + Math.floor(i / 3) * 26 + (i % 2) * 8} r="3.4" fill="#B3202F" />
          ))}
          <text x="176" y="82" fontSize="9" fontWeight="700" fill="#B3202F">Neurotransmitters</text>

          {/* Synaptic cleft guides */}
          <line x1="170" y1="60" x2="170" y2="185" stroke="#94a3b8" strokeWidth="1.4" strokeDasharray="4 3" />
          <line x1="218" y1="60" x2="218" y2="205" stroke="#94a3b8" strokeWidth="1.4" strokeDasharray="4 3" />
          <text x="172" y="222" fontSize="9" fill="#64748b">Synaptic cleft</text>

          {/* Post-synaptic membrane */}
          <path d="M220 60 Q340 48 360 130 Q352 200 275 205 Q225 200 222 150 Z" fill="#2A0A0E" opacity="0.09" stroke="#2A0A0E" strokeWidth="2" />
          <text x="250" y="52" fontSize="10" fontWeight="800" fill="#2A0A0E">Post-synaptic membrane</text>

          {/* Receptors */}
          {[0, 1, 2].map((i) => (
            <rect key={i} x={219} y={100 + i * 22} width="14" height="11" rx="2.5" fill="#FFC748" stroke="#2A0A0E" strokeWidth="1.5" />
          ))}
          <text x="240" y="180" fontSize="9" fill="#2A0A0E">Receptors</text>

          {/* Direction arrow */}
          <path d="M120 235 h140" stroke="#B3202F" strokeWidth="2" strokeLinecap="round" markerEnd="url(#arrow)" />
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0 0 L6 3 L0 6 Z" fill="#B3202F" />
            </marker>
          </defs>
          <text x="150" y="252" fontSize="8.5" fontWeight="700" fill="#B3202F">direction of signal</text>
        </svg>
      </section>

      {/* STEP FLOW — icon + short label, arrow-linked */}
      <section>
        <h3 className="mb-2.5 flex items-center gap-2 font-display text-sm font-bold text-brand-dark">
          <span className="h-4 w-1.5 rounded-full bg-brand-secondary" /> Signal Pathway
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {FLOW.map((s, i) => (
            <div key={s.n} className="relative flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                <StepIcon>{s.icon}</StepIcon>
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[9px] font-extrabold text-white">
                  {s.n}
                </span>
              </span>
              <span className="text-[11.5px] font-semibold leading-tight text-slate-700">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARISON — visual cards */}
      <section>
        <h3 className="mb-2.5 flex items-center gap-2 font-display text-sm font-bold text-brand-dark">
          <span className="h-4 w-1.5 rounded-full bg-brand-secondary" /> Two Types of Synapse
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-extrabold text-brand-primary">Chemical</span>
              <span className="rounded-full bg-brand-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-brand-primary">common</span>
            </div>
            <div className="mt-2 flex flex-col gap-1.5 text-[11px] font-medium text-slate-600">
              <span className="flex items-center gap-1.5"><Dot /> Neurotransmitters</span>
              <span className="flex items-center gap-1.5"><Dot /> Cleft present</span>
              <span className="flex items-center gap-1.5"><Speed level={2} /> Slower</span>
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-extrabold text-amber-700">Electrical</span>
              <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">rare</span>
            </div>
            <div className="mt-2 flex flex-col gap-1.5 text-[11px] font-medium text-slate-600">
              <span className="flex items-center gap-1.5"><Dot tone="amber" /> Membranes touch</span>
              <span className="flex items-center gap-1.5"><Dot tone="amber" /> Current flows direct</span>
              <span className="flex items-center gap-1.5"><Speed level={3} tone="amber" /> Faster</span>
            </div>
          </div>
        </div>
      </section>

      {/* OUTCOME — EPSP / IPSP */}
      <section>
        <h3 className="mb-2.5 flex items-center gap-2 font-display text-sm font-bold text-brand-dark">
          <span className="h-4 w-1.5 rounded-full bg-brand-secondary" /> New Potential Developed
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0 text-brand-primary"><path d="M2 18h6l3-12 4 12h7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <div>
              <p className="text-[12px] font-extrabold text-brand-primary">Excitatory</p>
              <p className="text-[10.5px] text-slate-500">promotes new impulse</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0 text-slate-400"><path d="M2 6h6l3 12 4-12h7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <div>
              <p className="text-[12px] font-extrabold text-slate-600">Inhibitory</p>
              <p className="text-[10.5px] text-slate-500">hinders new impulse</p>
            </div>
          </div>
        </div>
      </section>

      {/* NCERT key facts — compact chips */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
        <p className="mb-2 font-display text-[12px] font-bold text-amber-800">Remember (NCERT)</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            'Electrical synapses are rare in humans',
            'Electrical transmission is always faster',
            'Neurotransmitters stored in synaptic vesicles',
            'Vesicles sit in the axon terminal (synaptic knob)',
          ].map((f) => (
            <span key={f} className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 shadow-sm">{f}</span>
          ))}
        </div>
      </section>
    </div>
  );
};

const Dot: React.FC<{ tone?: 'red' | 'amber' }> = ({ tone = 'red' }) => (
  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone === 'amber' ? 'bg-amber-500' : 'bg-brand-primary'}`} />
);

const Speed: React.FC<{ level: number; tone?: 'red' | 'amber' }> = ({ level, tone = 'red' }) => (
  <span className="flex items-end gap-0.5">
    {[1, 2, 3].map((i) => (
      <span
        key={i}
        className={`w-1 rounded-sm ${i <= level ? (tone === 'amber' ? 'bg-amber-500' : 'bg-brand-primary') : 'bg-slate-200'}`}
        style={{ height: `${4 + i * 3}px` }}
      />
    ))}
  </span>
);

export default SynapticTransmissionInfographic;
