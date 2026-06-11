import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, Atom } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface Props { topic: Topic; onExit: () => void; }

const W = 1280, H = 760;
const CX = 640, CY = 380;

type Mol = {
    key: string;
    formula: string;
    pretty: string;
    central: string;
    ligand: string;
    bp: number;
    lp: number;
    shape: string;
    geometryName: string;
    ideal: string;
    actual: string;
    category: 'no-lp' | 'has-lp';
    note: string;
};

const MOLECULES: Mol[] = [
    { key: 'BeCl2', formula: 'BeCl2', pretty: 'BeCl₂', central: 'Be', ligand: 'Cl', bp: 2, lp: 0, shape: 'Linear', geometryName: 'Linear', ideal: '180°', actual: '180°', category: 'no-lp', note: 'AB₂, 2 bond pairs. Two ligands placed at 180° to maximise distance.' },
    { key: 'BF3', formula: 'BF3', pretty: 'BF₃', central: 'B', ligand: 'F', bp: 3, lp: 0, shape: 'Trigonal Planar', geometryName: 'Trigonal Planar', ideal: '120°', actual: '120°', category: 'no-lp', note: 'AB₃, three bond pairs evenly spaced in a plane.' },
    { key: 'CH4', formula: 'CH4', pretty: 'CH₄', central: 'C', ligand: 'H', bp: 4, lp: 0, shape: 'Tetrahedral', geometryName: 'Tetrahedral', ideal: '109.5°', actual: '109.5°', category: 'no-lp', note: 'AB₄, four equivalent bond pairs at the corners of a tetrahedron.' },
    { key: 'PCl5', formula: 'PCl5', pretty: 'PCl₅', central: 'P', ligand: 'Cl', bp: 5, lp: 0, shape: 'Trigonal Bipyramidal', geometryName: 'Trigonal Bipyramidal', ideal: '90°, 120°', actual: '90°, 120°', category: 'no-lp', note: 'AB₅. Three equatorial bonds at 120°, two axial at 90° to the plane.' },
    { key: 'SF6', formula: 'SF6', pretty: 'SF₆', central: 'S', ligand: 'F', bp: 6, lp: 0, shape: 'Octahedral', geometryName: 'Octahedral', ideal: '90°', actual: '90°', category: 'no-lp', note: 'AB₆. Six bonds at 90° — perfect octahedron.' },
    { key: 'SO2', formula: 'SO2', pretty: 'SO₂', central: 'S', ligand: 'O', bp: 2, lp: 1, shape: 'Bent', geometryName: 'Trigonal Planar', ideal: '120°', actual: '119.5°', category: 'has-lp', note: 'AB₂E. Should be 120° but lp-bp > bp-bp ⇒ angle squeezed to 119.5°.' },
    { key: 'NH3', formula: 'NH3', pretty: 'NH₃', central: 'N', ligand: 'H', bp: 3, lp: 1, shape: 'Trigonal Pyramidal', geometryName: 'Tetrahedral', ideal: '109.5°', actual: '107°', category: 'has-lp', note: 'AB₃E. One lp ⇒ tetrahedral parent distorts to pyramidal; angle 107°.' },
    { key: 'H2O', formula: 'H2O', pretty: 'H₂O', central: 'O', ligand: 'H', bp: 2, lp: 2, shape: 'Bent (V-shape)', geometryName: 'Tetrahedral', ideal: '109.5°', actual: '104.5°', category: 'has-lp', note: 'AB₂E₂. Two lp give lp-lp + lp-bp repulsion ⇒ bent, 104.5°.' },
    { key: 'SF4', formula: 'SF4', pretty: 'SF₄', central: 'S', ligand: 'F', bp: 4, lp: 1, shape: 'See-saw', geometryName: 'Trigonal Bipyramidal', ideal: '90°, 120°', actual: '< 90°, < 120°', category: 'has-lp', note: 'AB₄E. Lone pair occupies equatorial position (NCERT Table 4.8 — more stable).' },
    { key: 'ClF3', formula: 'ClF3', pretty: 'ClF₃', central: 'Cl', ligand: 'F', bp: 3, lp: 2, shape: 'T-shape', geometryName: 'Trigonal Bipyramidal', ideal: '90°', actual: '< 90°', category: 'has-lp', note: 'AB₃E₂. Both lp sit in equatorial positions ⇒ T-shape.' },
    { key: 'XeF2', formula: 'XeF2', pretty: 'XeF₂', central: 'Xe', ligand: 'F', bp: 2, lp: 3, shape: 'Linear', geometryName: 'Trigonal Bipyramidal', ideal: '180°', actual: '180°', category: 'has-lp', note: 'AB₂E₃. Three lp in equatorial plane; two F atoms axial ⇒ linear.' },
    { key: 'BrF5', formula: 'BrF5', pretty: 'BrF₅', central: 'Br', ligand: 'F', bp: 5, lp: 1, shape: 'Square Pyramidal', geometryName: 'Octahedral', ideal: '90°', actual: '< 90°', category: 'has-lp', note: 'AB₅E. One lp pushes the 4 basal F atoms down slightly from 90°.' },
    { key: 'XeF4', formula: 'XeF4', pretty: 'XeF₄', central: 'Xe', ligand: 'F', bp: 4, lp: 2, shape: 'Square Planar', geometryName: 'Octahedral', ideal: '90°', actual: '90°', category: 'has-lp', note: 'AB₄E₂. Two lp axial (trans) ⇒ four F in one plane at 90°.' },
];

type Vec3 = [number, number, number];
type Site = { v: Vec3; type: 'bp' | 'lp' };

const layout = (bp: number, lp: number): Site[] => {
    const t = bp + lp;
    const σ = Math.sqrt;

    if (t === 2) return [
        { v: [ 1, 0, 0], type: 'bp' },
        { v: [-1, 0, 0], type: bp === 2 ? 'bp' : 'lp' },
    ];

    if (t === 3) {
        const sites: Site[] = [
            { v: [ 1, 0, 0], type: 'bp' },
            { v: [ -0.5,  σ(3)/2, 0], type: 'bp' },
            { v: [ -0.5, -σ(3)/2, 0], type: 'bp' },
        ];
        sites.forEach((s, i) => { s.type = i < bp ? 'bp' : 'lp'; });
        return sites;
    }

    if (t === 4) {
        const tetra: Vec3[] = [
            [ 1, 1, 1], [-1,-1, 1], [-1, 1,-1], [ 1,-1,-1]
        ].map(([x,y,z]) => [x / σ(3), y / σ(3), z / σ(3)] as Vec3);
        return tetra.map((v, i) => ({ v, type: i < bp ? 'bp' : 'lp' }));
    }

    if (t === 5) {
        const equ: Vec3[] = [
            [1, 0, 0],
            [Math.cos(2 * Math.PI / 3), Math.sin(2 * Math.PI / 3), 0],
            [Math.cos(4 * Math.PI / 3), Math.sin(4 * Math.PI / 3), 0],
        ];
        const ax: Vec3[] = [[0, 0,  1], [0, 0, -1]];
        const sites: Site[] = [];
        const eqLp = Math.min(lp, 3);
        const eqBp = 3 - eqLp;
        const axLp = lp - eqLp;
        const axBp = 2 - axLp;
        for (let i = 0; i < eqLp; i++)  sites.push({ v: equ[i], type: 'lp' });
        for (let i = 0; i < eqBp; i++)  sites.push({ v: equ[eqLp + i], type: 'bp' });
        for (let i = 0; i < axLp; i++)  sites.push({ v: ax[i], type: 'lp' });
        for (let i = 0; i < axBp; i++)  sites.push({ v: ax[axLp + i], type: 'bp' });
        return sites;
    }

    if (t === 6) {
        const oct: Vec3[] = [
            [ 1, 0, 0], [-1, 0, 0],
            [ 0, 1, 0], [ 0,-1, 0],
            [ 0, 0, 1], [ 0, 0,-1],
        ];
        return oct.map((v, i) => ({ v, type: i < lp ? 'lp' : 'bp' }));
    }

    return [];
};

const VSEPRTheoryLab: React.FC<Props> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef    = useRef<number>(0);
    const yawRef    = useRef(0);

    const [molKey,  setMolKey]  = useState<string>('CH4');
    const [paused,  setPaused]  = useState(false);
    const [showLp,  setShowLp]  = useState(true);
    const [showAng, setShowAng] = useState(true);

    const mol = useMemo(() => MOLECULES.find(m => m.key === molKey)!, [molKey]);
    const sites = useMemo(() => layout(mol.bp, mol.lp), [mol]);

    const handleReset = useCallback(() => {
        setMolKey('CH4'); setPaused(false); setShowLp(true); setShowAng(true);
        yawRef.current = 0;
    }, []);

    const drawFrame = useCallback(() => {
        const cv = canvasRef.current; if (!cv) return;
        const ctx = cv.getContext('2d'); if (!ctx) return;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(100,116,139,0.06)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        ctx.font      = '12px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`Parent geometry: ${mol.geometryName} · Ideal ${mol.ideal} · Actual ${mol.actual}`, 30, 76);

        const badgeColor = mol.category === 'no-lp' ? '#16a34a' : '#d97706';
        const badgeLabel = mol.category === 'no-lp' ? 'NCERT Table 4.6 · No lone pair' : 'NCERT Table 4.7 · Has lone pair(s)';
        ctx.font      = 'bold 11px sans-serif';
        ctx.fillStyle = badgeColor;
        ctx.fillText(badgeLabel, 30, H - 28);

        const yaw    = yawRef.current;
        const pitch  = 0.45;
        const scale  = 195;
        const cy = Math.cos(yaw),   sy = Math.sin(yaw);
        const cp = Math.cos(pitch), sp = Math.sin(pitch);

        const project = (v: Vec3): { x: number; y: number; z: number } => {
            const x1 =  v[0] * cy + v[2] * sy;
            const z1 = -v[0] * sy + v[2] * cy;
            const y2 = v[1] * cp - z1 * sp;
            const z2 = v[1] * sp + z1 * cp;
            return { x: CX + x1 * scale, y: CY - y2 * scale, z: z2 };
        };

        const projected = sites.map(s => ({ site: s, p: project(s.v) }));

        ctx.lineWidth   = 6;
        ctx.lineCap     = 'round';
        const bondList = projected.filter(o => o.site.type === 'bp').map(o => ({ p: o.p, z: o.p.z })).sort((a, b) => a.z - b.z);
        for (const o of bondList) {
            const grad = ctx.createLinearGradient(CX, CY, o.p.x, o.p.y);
            grad.addColorStop(0, '#475569');
            grad.addColorStop(1, '#94a3b8');
            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(CX, CY);
            ctx.lineTo(o.p.x, o.p.y);
            ctx.stroke();
        }

        if (showAng) {
            const bps = projected.filter(o => o.site.type === 'bp');
            for (let i = 0; i < bps.length; i++) {
                for (let j = i + 1; j < bps.length; j++) {
                    const a = sites.filter(s => s.type === 'bp')[i].v;
                    const b = sites.filter(s => s.type === 'bp')[j].v;
                    const dot = a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
                    const angDeg = Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
                    if (Math.abs(angDeg - 180) < 1) continue;
                    if (bps.length > 3 && Math.abs(angDeg - 90) > 1 && Math.abs(angDeg - 120) > 1) continue;
                    const mx = (bps[i].p.x + bps[j].p.x) / 2;
                    const my = (bps[i].p.y + bps[j].p.y) / 2;
                    const dx = mx - CX, dy = my - CY;
                    const d  = Math.hypot(dx, dy) || 1;
                    const lx = CX + (dx / d) * 80;
                    const ly = CY + (dy / d) * 80;

                    const r = 56;
                    const a1 = Math.atan2(bps[i].p.y - CY, bps[i].p.x - CX);
                    const a2 = Math.atan2(bps[j].p.y - CY, bps[j].p.x - CX);
                    let da = a2 - a1;
                    while (da >  Math.PI) da -= Math.PI * 2;
                    while (da < -Math.PI) da += Math.PI * 2;
                    ctx.strokeStyle = '#fb7185';
                    ctx.lineWidth   = 1.2;
                    ctx.beginPath();
                    if (da > 0) ctx.arc(CX, CY, r, a1, a2);
                    else        ctx.arc(CX, CY, r, a2, a1);
                    ctx.stroke();

                    ctx.font      = 'bold 10px monospace';
                    ctx.fillStyle = '#be123c';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${angDeg.toFixed(1)}°`, lx, ly + 4);
                    ctx.textAlign = 'left';
                }
            }
        }

        const drawOrder = projected.slice().sort((a, b) => a.p.z - b.p.z);

        for (const { site, p } of drawOrder) {
            if (site.type === 'bp') {
                const r = 22;
                const grad = ctx.createRadialGradient(p.x - 6, p.y - 6, 2, p.x, p.y, r);
                grad.addColorStop(0, '#fde68a');
                grad.addColorStop(0.6, '#f59e0b');
                grad.addColorStop(1, '#b45309');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#92400e';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.font      = 'bold 12px sans-serif';
                ctx.fillStyle = '#1e293b';
                ctx.textAlign = 'center';
                ctx.fillText(mol.ligand, p.x, p.y + 4);
                ctx.textAlign = 'left';
            } else if (showLp) {
                const dx = p.x - CX, dy = p.y - CY;
                const dist = Math.hypot(dx, dy) || 1;
                const nx = dx / dist, ny = dy / dist;
                const lobeLen = 38, lobeWid = 22;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(Math.atan2(ny, nx));
                const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, lobeLen);
                grad.addColorStop(0, '#fef9c3');
                grad.addColorStop(0.6, '#facc15');
                grad.addColorStop(1, '#facc1500');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.ellipse(0, 0, lobeLen, lobeWid, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#a16207';
                ctx.lineWidth = 1.2;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.ellipse(0, 0, lobeLen, lobeWid, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#713f12';
                ctx.beginPath(); ctx.arc(-7, 0, 2.4, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc( 7, 0, 2.4, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
        }

        ctx.beginPath();
        ctx.arc(CX, CY, 30, 0, Math.PI * 2);
        const cg = ctx.createRadialGradient(CX - 8, CY - 8, 4, CX, CY, 30);
        cg.addColorStop(0, '#c4b5fd');
        cg.addColorStop(0.7, '#7c3aed');
        cg.addColorStop(1, '#4c1d95');
        ctx.fillStyle = cg;
        ctx.fill();
        ctx.strokeStyle = '#3b0764';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.font      = 'bold 14px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(mol.central, CX, CY + 5);
        ctx.textAlign = 'left';

        const lx = W - 200, ly = H - 90;
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('LEGEND', lx, ly);
        ctx.beginPath(); ctx.arc(lx + 10, ly + 16, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#7c3aed'; ctx.fill();
        ctx.fillStyle = '#475569'; ctx.fillText('Central atom', lx + 24, ly + 20);

        ctx.beginPath(); ctx.arc(lx + 10, ly + 36, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b'; ctx.fill();
        ctx.fillStyle = '#475569'; ctx.fillText(`Bonded ${mol.ligand}`, lx + 24, ly + 40);

        ctx.fillStyle = '#facc15';
        ctx.beginPath(); ctx.ellipse(lx + 10, ly + 56, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#475569'; ctx.fillText('Lone pair', lx + 26, ly + 60);
    }, [mol, sites, showLp, showAng]);

    useEffect(() => { drawFrame(); }, [drawFrame]);

    useEffect(() => {
        let last = performance.now();
        const loop = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.1);
            last = now;
            if (!paused) yawRef.current += dt * 0.6;
            drawFrame();
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafRef.current);
    }, [drawFrame, paused]);

    const repulsionCard = (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">Repulsion Order</div>
            <div className="text-xs font-semibold text-slate-500 mb-2">NCERT §4.6 — Nyholm & Gillespie (1957)</div>
            <div className="flex flex-col gap-1.5">
                {[
                    { label: 'lp – lp', tier: 'Strongest', col: '#dc2626', bg: '#fee2e2', frac: 100 },
                    { label: 'lp – bp', tier: 'Intermediate', col: '#d97706', bg: '#fef3c7', frac: 65 },
                    { label: 'bp – bp', tier: 'Weakest',  col: '#16a34a', bg: '#d1fae5', frac: 35 },
                ].map(r => (
                    <div key={r.label} className="rounded-lg border border-slate-100 px-2.5 py-1.5" style={{ backgroundColor: r.bg }}>
                        <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="font-mono text-slate-800">{r.label}</span>
                            <span style={{ color: r.col }}>{r.tier}</span>
                        </div>
                        <div className="mt-1 h-1.5 bg-white rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${r.frac}%`, backgroundColor: r.col }} />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-2 text-[10px] text-slate-500 italic leading-snug">
                Lone pairs are localised on the central atom and occupy more space than bonded pairs.
            </div>
        </div>
    );

    const distortionData = [
        { mol: 'NH₃',  ideal: 109.5, actual: 107.0, color: '#0891b2' },
        { mol: 'H₂O',  ideal: 109.5, actual: 104.5, color: '#0369a1' },
        { mol: 'SO₂',  ideal: 120.0, actual: 119.5, color: '#16a34a' },
        { mol: 'CH₄',  ideal: 109.5, actual: 109.5, color: '#7c3aed' },
        { mol: 'BF₃',  ideal: 120.0, actual: 120.0, color: '#d97706' },
    ];

    const distortionCard = (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">Angle Distortion</div>
            <div className="text-xs font-semibold text-slate-500 mb-2">NCERT Tables 4.7 + 4.8 — ideal vs actual</div>
            <svg width={310} height={170} className="block">
                {distortionData.map((d, i) => {
                    const y0 = 16 + i * 30;
                    const idealX = 80;
                    const actualLen = ((d.actual - 95) / 30) * 200;
                    const idealLen  = ((d.ideal  - 95) / 30) * 200;
                    return (
                        <g key={d.mol}>
                            <text x={6} y={y0 + 4} fontSize={11} fontWeight="bold" fill="#475569">{d.mol}</text>
                            <rect x={idealX} y={y0 - 5} width={idealLen} height={4} fill="#e2e8f0" rx={2} />
                            <rect x={idealX} y={y0 + 1} width={actualLen} height={6} fill={d.color} rx={2} />
                            <text x={idealX + actualLen + 4} y={y0 + 7} fontSize={9} fill={d.color} fontWeight="bold">{d.actual}°</text>
                            <text x={idealX + idealLen + 4} y={y0 - 3} fontSize={8} fill="#94a3b8">{d.ideal}° ideal</text>
                        </g>
                    );
                })}
                <text x={6} y={163} fontSize={9} fill="#64748b" fontStyle="italic">
                    Lone-pair repulsion squeezes bond angles below ideal.
                </text>
            </svg>
        </div>
    );

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                {repulsionCard}
                {distortionCard}
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-violet-200 bg-violet-50/95 p-4 shadow-xl">
                    <div className="text-base font-extrabold text-violet-900">VSEPR Postulates</div>
                    <div className="text-xs font-semibold text-violet-600 mb-2">NCERT §4.6 — Sidgwick & Powell · Nyholm & Gillespie</div>
                    <ul className="text-xs leading-relaxed text-violet-900 space-y-1.5">
                        <li>• Shape depends on the number of <strong>valence-shell electron pairs</strong> (bonded + lone) around the central atom.</li>
                        <li>• Electron pairs repel one another and arrange themselves to <strong>minimise repulsion</strong>.</li>
                        <li>• A multiple bond counts as <strong>one super-pair</strong>.</li>
                        <li>• Repulsion order: <span className="font-mono font-bold">lp-lp &gt; lp-bp &gt; bp-bp</span></li>
                        <li>• In 5-pair geometries, lone pairs prefer <strong>equatorial</strong> positions (Table 4.8).</li>
                    </ul>
                    <div className="mt-3 rounded-xl border border-violet-300 bg-white/80 p-2.5">
                        <div className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">Two Categories</div>
                        <div className="text-[11px] text-slate-700 mt-1">
                            <span className="font-bold text-emerald-700">No-lp (Table 4.6):</span> BeCl₂, BF₃, CH₄, PCl₅, SF₆
                        </div>
                        <div className="text-[11px] text-slate-700 mt-0.5">
                            <span className="font-bold text-amber-700">Has-lp (Table 4.7):</span> SO₂, NH₃, H₂O, SF₄, ClF₃, XeF₂, BrF₅, XeF₄
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-base font-extrabold text-slate-900">Real-time Values</div>
                        <span className="animate-pulse rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">LIVE</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <div className="rounded-lg border border-slate-100 bg-violet-50 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Molecule</div>
                            <div className="mt-0.5 font-mono text-xl font-extrabold text-violet-700">{mol.pretty}</div>
                            <div className="text-[9px] text-violet-500 font-semibold">{mol.geometryName} (parent) → {mol.shape}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            <div className="rounded-lg border border-slate-100 bg-blue-50 px-2 py-1.5 text-center">
                                <div className="text-[9px] font-bold uppercase text-slate-500">Bond pairs</div>
                                <div className="font-mono text-lg font-extrabold text-blue-700">{mol.bp}</div>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-amber-50 px-2 py-1.5 text-center">
                                <div className="text-[9px] font-bold uppercase text-slate-500">Lone pairs</div>
                                <div className="font-mono text-lg font-extrabold text-amber-700">{mol.lp}</div>
                            </div>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Type</div>
                            <div className="font-mono text-sm font-extrabold text-slate-800">
                                AB{mol.bp}{mol.lp > 0 ? `E${mol.lp > 1 ? mol.lp : ''}` : ''}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                                <div className="text-[9px] font-bold uppercase text-slate-400">Ideal</div>
                                <div className="font-mono text-sm font-extrabold text-slate-600">{mol.ideal}</div>
                            </div>
                            <div className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5">
                                <div className="text-[9px] font-bold uppercase text-rose-400">Actual</div>
                                <div className="font-mono text-sm font-extrabold text-rose-700">{mol.actual}</div>
                            </div>
                        </div>
                        <div className="rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-violet-500">Why this shape</div>
                            <div className="text-[10px] text-violet-900 leading-snug mt-0.5">{mol.note}</div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );

    const inCanvasStatus = (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-md text-xs font-bold">
            <Atom size={12} className="text-violet-600" />
            <span className="font-mono text-slate-700">{mol.pretty}</span>
            <span className="text-violet-700 text-base font-extrabold">{mol.shape}</span>
            <span className="text-slate-300">|</span>
            <span className="text-blue-700 font-mono">{mol.bp}bp</span>
            <span className="text-amber-700 font-mono">{mol.lp}lp</span>
            <span className="text-slate-300">|</span>
            <span className="text-rose-700 font-mono">{mol.actual}</span>
        </div>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
                <div className="absolute top-3 left-3 z-10 pointer-events-auto">{inCanvasStatus}</div>
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                    <button onClick={() => setPaused(p => !p)}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
                        title={paused ? 'Play' : 'Pause'}>
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button onClick={handleReset}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Reset">
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    const noLpMols  = MOLECULES.filter(m => m.category === 'no-lp');
    const hasLpMols = MOLECULES.filter(m => m.category === 'has-lp');

    const molButton = (m: Mol) => {
        const active = m.key === molKey;
        const isLp   = m.category === 'has-lp';
        const onCls  = isLp ? 'bg-amber-500 border-amber-600 text-white shadow-md scale-105' : 'bg-emerald-500 border-emerald-600 text-white shadow-md scale-105';
        const offCls = isLp ? 'bg-amber-50 border-amber-200 text-amber-800 hover:scale-105 hover:shadow' : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:scale-105 hover:shadow';
        return (
            <button key={m.key} onClick={() => setMolKey(m.key)}
                className={`min-w-[88px] flex-1 px-2 py-1.5 rounded-lg border transition-all flex flex-col items-center text-center ${active ? onCls : offCls}`}
                title={`${m.pretty} — ${m.shape} (${m.actual})`}>
                <span className="font-mono text-sm font-extrabold">{m.pretty}</span>
                <span className={`text-[9px] mt-0.5 ${active ? 'text-white/85' : 'opacity-70'}`}>{m.shape}</span>
                <span className={`text-[8px] ${active ? 'text-white/70' : 'opacity-60'}`}>{m.actual}</span>
            </button>
        );
    };

    const controlsCombo = (
        <div className="w-full flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Atom size={16} className="text-violet-600" />
                <span className="text-sm font-extrabold text-slate-800">VSEPR Geometry Bench</span>
                <span className="ml-auto font-mono text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-2 py-0.5">
                    {mol.pretty} · {mol.shape}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1.4fr_auto] gap-3">

                <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                            No lone pair · NCERT Table 4.6
                        </span>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-2 flex flex-wrap gap-1.5">
                        {noLpMols.map(molButton)}
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                            With lone pair(s) · NCERT Table 4.7
                        </span>
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-2 flex flex-wrap gap-1.5">
                        {hasLpMols.map(molButton)}
                    </div>
                </div>

                <div className="md:w-[150px]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">View</div>
                    <div className="flex flex-col gap-1.5">
                        <button onClick={() => setShowLp(s => !s)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                                showLp ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}>
                            Lone pairs
                        </button>
                        <button onClick={() => setShowAng(s => !s)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                                showAng ? 'bg-rose-500 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}>
                            Bond angles
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo}
        />
    );
};

export default VSEPRTheoryLab;
