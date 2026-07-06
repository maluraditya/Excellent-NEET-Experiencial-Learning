import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Droplets, Pause, Play, RotateCcw, Scissors, Shield } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface BloodGroupsCoagulationLabProps { topic: any; onExit: () => void }

const W = 1280;
const H = 760;

type Tab = 'transfusion' | 'cascade';
type ABO = 'A' | 'B' | 'AB' | 'O';
type CascadeStep = 'idle' | 'platelets' | 'thrombokinase' | 'thrombin' | 'fibrin' | 'clotted';

const ABO_META: Record<ABO, { antigens: string[]; antibodies: string[]; donors: ABO[] }> = {
  A:  { antigens: ['A'],      antibodies: ['anti-B'],         donors: ['A', 'O'] },
  B:  { antigens: ['B'],      antibodies: ['anti-A'],         donors: ['B', 'O'] },
  AB: { antigens: ['A', 'B'], antibodies: [],                 donors: ['AB', 'A', 'B', 'O'] },
  O:  { antigens: [],         antibodies: ['anti-A', 'anti-B'], donors: ['O'] },
};

interface RBC { x: number; y: number; vx: number; vy: number; clumped: boolean; partner?: number }
interface Ab { x: number; y: number; vx: number; vy: number; targetAg: 'A' | 'B' }

const BloodGroupsCoagulationLab: React.FC<BloodGroupsCoagulationLabProps> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);

  const [paused, setPaused] = useState(false);
  const [tab, setTab] = useState<Tab>('transfusion');

  // Transfusion state
  const [donor, setDonor] = useState<ABO>('O');
  const [recipient, setRecipient] = useState<ABO>('AB');
  const [donorRh, setDonorRh] = useState<'+' | '-'>('+');
  const [recipientRh, setRecipientRh] = useState<'+' | '-'>('+');
  const [transfused, setTransfused] = useState(false);
  const rbcsRef = useRef<RBC[]>([]);
  const absRef = useRef<Ab[]>([]);

  // Cascade state
  const [cascadeStep, setCascadeStep] = useState<CascadeStep>('idle');
  const [platelets, setPlatelets] = useState(100); // %
  const [stepMode, setStepMode] = useState(false);
  const cascadeProgressRef = useRef(0);
  const bleedDropsRef = useRef<{ x: number; y: number; vy: number; alpha: number }[]>([]);

  const compatible = ABO_META[recipient].donors.includes(donor) && !(recipientRh === '-' && donorRh === '+');

  const handleReset = useCallback(() => {
    rbcsRef.current = [];
    absRef.current = [];
    setTransfused(false);
    setCascadeStep('idle');
    cascadeProgressRef.current = 0;
    bleedDropsRef.current = [];
  }, []);

  const initTransfusion = () => {
    handleReset();
    // recipient RBCs
    for (let i = 0; i < 14; i++) {
      rbcsRef.current.push({
        x: 800 + Math.random() * 280,
        y: 240 + Math.random() * 280,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        clumped: false,
      });
    }
    // antibodies in recipient plasma
    for (const ab of ABO_META[recipient].antibodies) {
      const targetAg = ab.endsWith('A') ? 'A' : 'B';
      for (let i = 0; i < 12; i++) {
        absRef.current.push({
          x: 800 + Math.random() * 280,
          y: 240 + Math.random() * 280,
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 0.5) * 14,
          targetAg: targetAg as 'A' | 'B',
        });
      }
    }
    setTransfused(true);
  };

  const startCut = () => {
    handleReset();
    setCascadeStep('platelets');
  };

  useEffect(() => {
    const tick = (now: number) => {
      const dt = Math.min(60, now - (lastRef.current || now));
      lastRef.current = now;
      if (!paused) step(dt / 1000);
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, tab, donor, recipient, donorRh, recipientRh, transfused, cascadeStep, platelets, stepMode]);

  const step = (dt: number) => {
    if (tab === 'transfusion' && transfused) {
      // add donor RBCs over time (spawn flux)
      if (Math.random() < 0.5 && rbcsRef.current.length < 50) {
        const ag = ABO_META[donor].antigens;
        rbcsRef.current.push({
          x: 200 + Math.random() * 120,
          y: 240 + Math.random() * 280,
          vx: 30 + Math.random() * 20,
          vy: (Math.random() - 0.5) * 10,
          clumped: false,
          // donor RBC carries donor antigens — store as marker via x position trick: we'll check clumping later
        });
        // tag donor RBC with antigen via an external map (use array index)
        (rbcsRef.current[rbcsRef.current.length - 1] as any).antigen = ag;
      }
      // move RBCs
      for (const r of rbcsRef.current) {
        if (r.clumped) continue;
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        if (r.x < 30 || r.x > W - 30) r.vx *= -1;
        if (r.y < 220 || r.y > 560) r.vy *= -1;
      }
      // antibody movement + collision detection with donor RBCs
      for (const a of absRef.current) {
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        if (a.x < 30 || a.x > W - 30) a.vx *= -1;
        if (a.y < 220 || a.y > 560) a.vy *= -1;
        // check collision with RBCs carrying matching antigen
        for (const r of rbcsRef.current) {
          if (r.clumped) continue;
          const ag = (r as any).antigen as string[] | undefined;
          if (!ag) continue;
          if (!ag.includes(a.targetAg)) continue;
          if (Math.hypot(r.x - a.x, r.y - a.y) < 18) {
            r.clumped = true;
            r.vx = 0; r.vy = 0;
            // pull antibody into the clump
            a.x = r.x;
            a.y = r.y;
            a.vx = 0; a.vy = 0;
          }
        }
      }
    } else if (tab === 'cascade' && cascadeStep !== 'idle') {
      cascadeProgressRef.current += dt * (platelets / 100) * (stepMode ? 0 : 0.6);
      const order: CascadeStep[] = ['platelets', 'thrombokinase', 'thrombin', 'fibrin', 'clotted'];
      const idx = order.indexOf(cascadeStep);
      if (cascadeProgressRef.current >= 1 && idx < order.length - 1) {
        cascadeProgressRef.current = 0;
        setCascadeStep(order[idx + 1]);
      }
      // bleed drops until clot
      if (cascadeStep !== 'clotted' && Math.random() < 0.6) {
        bleedDropsRef.current.push({ x: 640 + (Math.random() - 0.5) * 30, y: 380, vy: 80, alpha: 1 });
      }
      bleedDropsRef.current = bleedDropsRef.current
        .map(d => ({ ...d, y: d.y + d.vy * dt, alpha: d.alpha - dt * 0.4 }))
        .filter(d => d.alpha > 0);
    }
  };

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    if (tab === 'transfusion') drawTransfusion(ctx);
    else drawCascade(ctx);
  };

  const drawTransfusion = (ctx: CanvasRenderingContext2D) => {
    // banner
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 18px Inter';
    ctx.fillText('Transfusion Bench — pour donor blood into recipient', 30, 50);
    ctx.font = '500 12px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('NCERT §15.1.3 Table 15.1 — ABO antigen / antibody pairing', 30, 70);

    // donor vial (left)
    drawVial(ctx, 200, 380, `Donor ${donor}${donorRh}`, '#dc2626');
    // recipient vial (right)
    drawVial(ctx, 1080, 380, `Recipient ${recipient}${recipientRh}`, '#0891b2');
    // arrow
    if (transfused) {
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(290, 380);
      ctx.lineTo(380, 380);
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(380, 380);
      ctx.lineTo(370, 372);
      ctx.lineTo(370, 388);
      ctx.closePath();
      ctx.fill();
    }

    // recipient blood chamber
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(380, 220, 590, 340);
    ctx.setLineDash([]);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 11px Inter';
    ctx.fillText('Recipient plasma + RBCs', 390, 214);

    // RBCs
    for (const r of rbcsRef.current) {
      const ag = (r as any).antigen as string[] | undefined;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 11, 0, Math.PI * 2);
      ctx.fillStyle = r.clumped ? '#7f1d1d' : '#fecaca';
      ctx.fill();
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // antigens as small spikes
      if (ag) {
        for (const a of ag) {
          ctx.fillStyle = a === 'A' ? '#0891b2' : '#7c3aed';
          ctx.beginPath();
          ctx.arc(r.x + (a === 'A' ? -7 : 7), r.y - 7, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    // antibodies (Y-shape)
    for (const a of absRef.current) {
      ctx.strokeStyle = a.targetAg === 'A' ? '#0891b2' : '#7c3aed';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x, a.y + 6);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x - 5, a.y - 5);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x + 5, a.y - 5);
      ctx.stroke();
    }

    // verdict badge
    if (transfused) {
      const clumpedCount = rbcsRef.current.filter(r => r.clumped).length;
      const hasReaction = clumpedCount > 0;
      ctx.fillStyle = hasReaction ? '#fee2e2' : '#dcfce7';
      ctx.strokeStyle = hasReaction ? '#dc2626' : '#16a34a';
      ctx.lineWidth = 2;
      ctx.fillRect(420, 600, 540, 70);
      ctx.strokeRect(420, 600, 540, 70);
      ctx.fillStyle = hasReaction ? '#991b1b' : '#166534';
      ctx.font = '800 20px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(hasReaction ? '⚠ CLUMPING — RBC destruction' : '✓ SAFE — compatible transfusion', 690, 635);
      ctx.font = '500 11px Inter';
      ctx.fillText(
        hasReaction
          ? `Recipient ${recipient} has anti-${ABO_META[recipient].antibodies.join('/')} antibodies — donor ${donor} antigens get attacked.`
          : `Recipient ${recipient} accepts donor ${donor}: ${ABO_META[recipient].donors.join(', ')} are all compatible.`,
        690, 655,
      );
      ctx.textAlign = 'left';
    }
  };

  const drawVial = (ctx: CanvasRenderingContext2D, x: number, y: number, label: string, fill: string) => {
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.fillRect(x - 45, y - 100, 90, 200);
    ctx.strokeRect(x - 45, y - 100, 90, 200);
    ctx.fillStyle = fill;
    ctx.fillRect(x - 43, y - 30, 86, 128);
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 13px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 120);
    ctx.textAlign = 'left';
  };

  const drawCascade = (ctx: CanvasRenderingContext2D) => {
    // banner
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 18px Inter';
    ctx.fillText('Cut & Cascade — clotting in real time', 30, 50);
    ctx.font = '500 12px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('NCERT §15.1.4 — Platelets → Thrombokinase → Prothrombin → Thrombin → Fibrinogen → Fibrin', 30, 70);

    // vessel
    ctx.fillStyle = '#fecaca';
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 3;
    ctx.fillRect(200, 300, 880, 100);
    ctx.strokeRect(200, 300, 880, 100);
    ctx.fillStyle = '#7f1d1d';
    ctx.font = '600 11px Inter';
    ctx.fillText('Blood vessel', 220, 290);

    // cut location
    if (cascadeStep !== 'idle') {
      const closed = cascadeStep === 'clotted';
      // gap in vessel
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(620, 300, 40, 100);
      // bleed drops
      if (!closed) {
        for (const d of bleedDropsRef.current) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220, 38, 38, ${d.alpha})`;
          ctx.fill();
        }
      }
    }

    // cascade steps as horizontal flow
    const stages: { step: CascadeStep; label: string; color: string }[] = [
      { step: 'platelets',     label: 'Platelets activated',      color: '#f59e0b' },
      { step: 'thrombokinase', label: 'Thrombokinase enzyme complex', color: '#ea580c' },
      { step: 'thrombin',      label: 'Prothrombin → Thrombin',   color: '#7c3aed' },
      { step: 'fibrin',        label: 'Fibrinogen → Fibrin mesh', color: '#16a34a' },
      { step: 'clotted',       label: 'Clot formed',              color: '#475569' },
    ];
    const order: CascadeStep[] = ['idle', 'platelets', 'thrombokinase', 'thrombin', 'fibrin', 'clotted'];
    const curIdx = order.indexOf(cascadeStep);
    for (let i = 0; i < stages.length; i++) {
      const s = stages[i];
      const sIdx = order.indexOf(s.step);
      const active = sIdx === curIdx;
      const done = sIdx < curIdx;
      const y = 470 + i * 42;
      ctx.fillStyle = active ? s.color : done ? '#94a3b8' : '#e2e8f0';
      ctx.beginPath();
      ctx.arc(280, y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = active ? s.color : done ? '#475569' : '#94a3b8';
      ctx.font = active ? '700 13px Inter' : '600 13px Inter';
      ctx.fillText(`${i + 1}. ${s.label}`, 310, y + 4);
      if (active) {
        // progress bar
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(700, y - 7, 200, 14);
        ctx.fillStyle = s.color;
        ctx.fillRect(700, y - 7, 200 * cascadeProgressRef.current, 14);
      }
    }

    // fibrin mesh weave at clotted state
    if (cascadeStep === 'clotted') {
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(610 + Math.random() * 60, 300);
        ctx.lineTo(610 + Math.random() * 60, 400);
        ctx.stroke();
      }
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(610, 305 + i * 12);
        ctx.lineTo(670, 305 + i * 12);
        ctx.stroke();
      }
      ctx.fillStyle = '#14532d';
      ctx.font = '700 14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Fibrin mesh', 640, 290);
      ctx.textAlign = 'left';
    }

    // platelet count warning
    if (platelets < 30) {
      ctx.fillStyle = '#fee2e2';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.fillRect(800, 300, 270, 80);
      ctx.strokeRect(800, 300, 270, 80);
      ctx.fillStyle = '#991b1b';
      ctx.font = '700 14px Inter';
      ctx.fillText('⚠ Low platelets — cascade stalls', 810, 325);
      ctx.font = '500 11px Inter';
      ctx.fillText('Haemophilia-like bleeding state', 810, 345);
      ctx.fillText('(NCERT: 1.5–3.5 lakh /mm³ normal)', 810, 365);
    }
  };

  const advanceStep = () => {
    const order: CascadeStep[] = ['idle', 'platelets', 'thrombokinase', 'thrombin', 'fibrin', 'clotted'];
    const idx = order.indexOf(cascadeStep);
    if (idx < order.length - 1) {
      cascadeProgressRef.current = 0;
      setCascadeStep(order[idx + 1]);
    }
  };

  const graphPanel = (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
      <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">ABO Compatibility</div>
          <div className="text-xs font-semibold text-slate-500">NCERT Table 15.1</div>
          <table className="w-full mt-2 text-xs">
            <thead>
              <tr className="text-slate-500">
                <th className="text-left font-bold pb-1">Recipient</th>
                <th className="text-left font-bold pb-1">Donors</th>
              </tr>
            </thead>
            <tbody>
              {(['A', 'B', 'AB', 'O'] as ABO[]).map(r => (
                <tr key={r} className={r === recipient ? 'bg-amber-50' : ''}>
                  <td className="py-1 font-bold">{r}</td>
                  <td className="py-1 font-mono">{ABO_META[r].donors.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-slate-500 mt-2">
            <b>O</b> = universal donor · <b>AB</b> = universal recipient
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Rh Grouping</div>
          <p className="text-[11px] text-slate-600 mt-2 leading-snug">
            ~80% of humans are <b>Rh⁺</b>. If an Rh⁻ person receives Rh⁺ blood, they develop anti-Rh antibodies. <b>Erythroblastosis foetalis</b>: Rh⁻ mother carrying Rh⁺ foetus — second pregnancy attack. Prevented by anti-Rh injection after first delivery.
          </p>
        </div>
      </div>
    </aside>
  );

  const valuesPanel = (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/95 p-4 shadow-xl backdrop-blur">
          <div className="text-base font-extrabold text-rose-900">Coagulation Cascade</div>
          <div className="text-xs font-semibold text-rose-700 mt-0.5">NCERT §15.1.4</div>
          <ol className="mt-2 text-sm leading-snug text-rose-950 list-decimal pl-5 space-y-0.5">
            <li>Injury → <b>platelets</b> activated</li>
            <li>Cascade → <b>thrombokinase</b> complex</li>
            <li>Thrombokinase: <b>prothrombin → thrombin</b></li>
            <li>Thrombin: <b>fibrinogen → fibrin</b></li>
            <li>Fibrin mesh traps cells → <b>clot</b></li>
          </ol>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-slate-900">Real-time values</div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 animate-pulse">LIVE</span>
          </div>
          <div className="mt-3 space-y-2">
            <Cell label="Active tab" value={tab === 'transfusion' ? 'Transfusion' : 'Cascade'} />
            {tab === 'transfusion' ? (
              <>
                <Cell label="Donor" value={`${donor}${donorRh}`} />
                <Cell label="Recipient" value={`${recipient}${recipientRh}`} />
                <Cell label="Compatibility" value={<span className={compatible ? 'text-emerald-700' : 'text-red-700'}>{compatible ? 'Compatible' : 'Incompatible'}</span>} />
                <Cell label="Clumped RBCs" value={rbcsRef.current.filter(r => r.clumped).length} />
              </>
            ) : (
              <>
                <Cell label="Cascade step" value={cascadeStep} />
                <Cell label="Platelet count" value={`${platelets} %`} />
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );

  const simulationCombo = (
    <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
        <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
          <button onClick={() => setPaused(p => !p)} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50">
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
          <button onClick={handleReset} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50">
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
      {graphPanel}
      {valuesPanel}
    </div>
  );

  const controlsComponent = (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow">
      <div className="flex items-center gap-2 mb-3">
        <Droplets size={18} className="text-rose-600" />
        <h3 className="text-sm font-bold text-slate-800">Blood Groups & Coagulation Bench</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Tab</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(['transfusion', 'cascade'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-bold rounded-md ${tab === t ? 'bg-white text-rose-700 shadow' : 'text-slate-600 hover:text-slate-800'}`}>
                {t === 'transfusion' ? '1 · Transfusion Bench' : '2 · Cut & Cascade'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'transfusion' ? (
          <>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Donor blood</label>
              <div className="mt-1.5 flex gap-1">
                {(['A', 'B', 'AB', 'O'] as ABO[]).map(g => (
                  <button key={g} onClick={() => setDonor(g)} className={`px-3 py-1.5 text-xs font-bold rounded-md border ${donor === g ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-slate-200 text-slate-600'}`}>{g}</button>
                ))}
                <button onClick={() => setDonorRh(r => r === '+' ? '-' : '+')} className="ml-2 px-3 py-1.5 text-xs font-bold rounded-md border bg-white border-slate-200">Rh {donorRh}</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Recipient blood</label>
              <div className="mt-1.5 flex gap-1">
                {(['A', 'B', 'AB', 'O'] as ABO[]).map(g => (
                  <button key={g} onClick={() => setRecipient(g)} className={`px-3 py-1.5 text-xs font-bold rounded-md border ${recipient === g ? 'bg-cyan-50 border-cyan-300 text-cyan-700' : 'bg-white border-slate-200 text-slate-600'}`}>{g}</button>
                ))}
                <button onClick={() => setRecipientRh(r => r === '+' ? '-' : '+')} className="ml-2 px-3 py-1.5 text-xs font-bold rounded-md border bg-white border-slate-200">Rh {recipientRh}</button>
              </div>
            </div>
            <div className="md:col-span-2">
              <button onClick={initTransfusion} className="px-4 py-2 text-sm font-bold rounded-md bg-rose-600 text-white hover:bg-rose-700">
                <Droplets size={14} className="inline mr-1" /> Transfuse
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
                <span><Shield size={11} className="inline" /> Platelet count</span>
                <span className="font-mono text-slate-700">{platelets}%</span>
              </label>
              <input type="range" min={0} max={150} step={5} value={platelets} onChange={e => setPlatelets(parseInt(e.target.value))} className="w-full mt-1 accent-amber-600" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Cascade controls</label>
              <div className="mt-1.5 flex gap-2 flex-wrap">
                <button onClick={startCut} className="px-3 py-1.5 text-xs font-bold rounded-md bg-rose-600 text-white"><Scissors size={11} className="inline" /> Make cut</button>
                <button onClick={() => setStepMode(s => !s)} className={`px-3 py-1.5 text-xs font-bold rounded-md border ${stepMode ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-600'}`}>Step mode {stepMode ? 'ON' : 'OFF'}</button>
                {stepMode && <button onClick={advanceStep} className="px-3 py-1.5 text-xs font-bold rounded-md bg-slate-800 text-white">▶ Next step</button>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <TopicLayoutContainer
      topic={topic}
      onExit={onExit}
      SimulationComponent={simulationCombo}
      ControlsComponent={controlsComponent}
    />
  );
};

const Cell: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-100 bg-rose-50 px-3 py-2">
    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-0.5 font-mono text-sm font-extrabold text-rose-700">{value}</div>
  </div>
);

export default BloodGroupsCoagulationLab;
