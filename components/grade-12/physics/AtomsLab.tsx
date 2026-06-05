import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Target, Atom, Activity, Eye, EyeOff, Crosshair } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface AtomsLabProps {
    topic: any;
    onExit: () => void;
}

type AtomsMode = 'scattering' | 'bohr' | 'spectrum';
type TargetKind = 'gold' | 'aluminum' | 'custom';
type FireRate = 'single' | 'medium' | 'fast';
type SeriesKey = 'lyman' | 'balmer' | 'paschen' | 'brackett' | 'pfund';
type SpectrumView = 'emission' | 'absorption';

type Vec = { x: number; y: number };

interface AlphaParticle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    b: number;
    initialSpeed: number;
    trail: Vec[];
    color: string;
}

interface Flash {
    x: number;
    y: number;
    life: number;
    maxLife: number;
    color: string;
}

interface TransitionFx {
    from: number;
    to: number;
    progress: number;
    wavelength: number;
    energy: number;
    emitting: boolean;
}

interface ScatteringStats {
    total: number;
    over1: number;
    over90: number;
    back: number;
    histogram: number[];
    lastTheta: number;
    lastB: number;
}

const W = 1280;
const H = 760;
const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
const RYDBERG = 1.097e7;
const HC_EV_NM = 1240;
const A0_PM = 53;
const E_CHARGE = 1.602176634e-19;
const K_COULOMB = 8.9875517923e9;
const K_SIM = 140000;          // tuned Coulomb constant for the rendered (live-integrated) trajectories
const D_NEAR = 10;             // px floor on distance to avoid the 1/r^2 singularity at the nucleus
const FIELD_RADIUS = 70;       // px: interaction region. Beyond this the electron cloud screens the
                              // nucleus, so an alpha particle feels no force and flies straight (empty space).
const SCATTER_STAGE = { x: 56, y: 96, w: 1168, h: 616 };
const DETECTOR_R = 282;
const NCERT_OVER1_PERCENT = 0.14;
const NCERT_OVER90_RATIO = 8000;
// --- Statistics model (analytic Rutherford, area-weighted beam with screening) ---
// Calibrated so gold @ 7.7 MeV reproduces NCERT: 0.14% scatter > 1 deg and ~1 in 8000 > 90 deg.
const MC_B90_GOLD = 0.01118;   // impact parameter giving theta = 90 deg (units of beam half-width B = 1)
const MC_B_SCREEN = 0.0374;    // screening radius: beyond this b, theta ~ 0 (undeflected)
const MC_RATE = 9000;          // virtual alpha particles "detected" per second of running time

const TARGETS = {
    gold: { label: 'Gold (Au)', z: 79, massLabel: 'Au nucleus ~50x alpha mass', foil: '2.1 x 10^-7 m' },
    aluminum: { label: 'Aluminum (Al)', z: 13, massLabel: 'Lower Z: weaker deflection', foil: 'thin metal foil' },
};

const SERIES: Record<SeriesKey, { name: string; nf: number; region: string; color: string }> = {
    lyman: { name: 'Lyman', nf: 1, region: 'UV', color: '#8b5cf6' },
    balmer: { name: 'Balmer', nf: 2, region: 'Visible', color: '#2563eb' },
    paschen: { name: 'Paschen', nf: 3, region: 'IR', color: '#dc2626' },
    brackett: { name: 'Brackett', nf: 4, region: 'IR', color: '#b91c1c' },
    pfund: { name: 'Pfund', nf: 5, region: 'IR', color: '#991b1b' },
};

const ENERGY_LEVELS = [1, 2, 3, 4, 5, 6];
const HIST_BINS = 18;

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function drawLine(ctx: CanvasRenderingContext2D, a: Vec, b: Vec, color: string, width = 2, dash: number[] = []) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(a.x + 0.5, a.y + 0.5);
    ctx.lineTo(b.x + 0.5, b.y + 0.5);
    ctx.stroke();
    ctx.restore();
}

function drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, size = 9) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size * 0.55);
    ctx.lineTo(-size, size * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawArrow(ctx: CanvasRenderingContext2D, a: Vec, b: Vec, color: string, width = 2.5, dash: number[] = []) {
    drawLine(ctx, a, b, color, width, dash);
    drawArrowHead(ctx, b.x, b.y, Math.atan2(b.y - a.y, b.x - a.x), color, 10);
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = '#334155', align: CanvasTextAlign = 'center', font = '800 13px Inter, sans-serif') {
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
}

function drawBackground(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    for (let x = 0; x <= W; x += 40) drawLine(ctx, { x, y: 0 }, { x, y: H }, 'rgba(15,23,42,0.06)', 1);
    for (let y = 0; y <= H; y += 40) drawLine(ctx, { x: 0, y }, { x: W, y }, 'rgba(15,23,42,0.06)', 1);
}

function drawCanvasTitle(ctx: CanvasRenderingContext2D, title: string, subtitle: string, accent = '#f97316') {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    roundRect(ctx, 250, 18, 780, 58, 16);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    drawLabel(ctx, title, 640, 40, '#0f172a', 'center', '900 18px Inter, sans-serif');
    drawLabel(ctx, subtitle, 640, 62, '#334155', 'center', '800 12px Inter, monospace');
    ctx.restore();
}

function drawDataBar(ctx: CanvasRenderingContext2D, items: Array<{ label: string; value: string; color: string }>) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    roundRect(ctx, 34, 652, 1212, 76, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(15,23,42,0.14)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const step = 1212 / items.length;
    items.forEach((item, i) => {
        const x = 34 + i * step + step / 2;
        if (i > 0) drawLine(ctx, { x: 34 + i * step, y: 666 }, { x: 34 + i * step, y: 714 }, 'rgba(15,23,42,0.13)', 1);
        drawLabel(ctx, item.label, x, 680, '#475569', 'center', '900 10px Inter, sans-serif');
        drawLabel(ctx, item.value, x, 705, item.color, 'center', '900 14px Inter, monospace');
    });
    ctx.restore();
}

function energyEv(n: number) {
    return -13.6 / (n * n);
}

function wavelengthNm(ni: number, nf: number) {
    if (ni <= nf) return Infinity;
    return 1e9 / (RYDBERG * (1 / (nf * nf) - 1 / (ni * ni)));
}

function transitionEnergy(ni: number, nf: number) {
    return Math.abs(energyEv(ni) - energyEv(nf));
}

function spectrumColor(wavelength: number) {
    if (wavelength < 380) return '#a855f7';
    if (wavelength > 760) return '#b91c1c';
    if (wavelength >= 620) return '#ef4444';
    if (wavelength >= 590) return '#f97316';
    if (wavelength >= 560) return '#eab308';
    if (wavelength >= 500) return '#22c55e';
    if (wavelength >= 450) return '#06b6d4';
    return '#8b5cf6';
}

function closestApproachFm(z: number, energyMev: number) {
    const energyJ = energyMev * 1e6 * E_CHARGE;
    const d = K_COULOMB * 2 * z * E_CHARGE * E_CHARGE / energyJ;
    return d / 1e-15;
}

// Coulomb scattering strength: impact parameter (in units of beam half-width B = 1) that
// produces a 90 deg deflection. Scales with Z and inversely with kinetic energy, so heavier
// nuclei and slower alphas scatter more strongly (NCERT: b90 proportional to Z/E).
function scatterStrength(z: number, energyMev: number) {
    return MC_B90_GOLD * (z / 79) * (7.7 / energyMev);
}

// Deterministically accumulate "detected" alpha particles into the running statistics using the
// analytic Rutherford model. The beam is area-weighted (P(b < b0) = (b0/B)^2, as for a real disk
// beam) and screened beyond MC_B_SCREEN. This converges exactly to the NCERT fractions and builds
// the 1/sin^4(theta/2) angular distribution seen in NCERT Fig. 12.3.
function accumulateScattering(stats: ScatteringStats, z: number, energyMev: number, n: number) {
    if (n <= 0) return;
    const b90 = scatterStrength(z, energyMev);
    const frac = (bThreshold: number) => {
        const t = clamp(bThreshold, 0, 1);
        return t * t;
    };
    const b1 = b90 / Math.tan(0.5 * DEG);    // impact parameter for theta = 1 deg
    const bBack = b90 / Math.tan(75 * DEG);  // impact parameter for theta = 150 deg (back-scatter)
    stats.total += n;
    stats.over1 += n * frac(Math.min(b1, MC_B_SCREEN));
    stats.over90 += n * frac(b90);
    stats.back += n * frac(Math.min(bBack, MC_B_SCREEN));
    // Detector counts per 10 deg bin follow the Rutherford cross-section dsigma/dOmega ~ 1/sin^4(theta/2).
    for (let i = 0; i < HIST_BINS; i++) {
        const mid = i * 10 + 5;
        const s = Math.sin((mid * DEG) / 2);
        stats.histogram[i] += n * (1 / Math.pow(s, 4));
    }
}

function percent(count: number, total: number) {
    return total > 0 ? `${((count / total) * 100).toFixed(2)}%` : '0.00%';
}

function oneIn(count: number, total: number) {
    return count > 0 && total > 0 ? `1 in ${Math.max(1, Math.round(total / count))}` : 'none yet';
}

function getTargetZ(kind: TargetKind, customZ: number) {
    if (kind === 'custom') return customZ;
    return TARGETS[kind].z;
}

function getTargetName(kind: TargetKind, customZ: number) {
    if (kind === 'custom') return `Custom Z=${customZ}`;
    return TARGETS[kind].label;
}

function getScatteringNucleus(): Vec {
    return {
        x: SCATTER_STAGE.x + SCATTER_STAGE.w * 0.49,
        y: SCATTER_STAGE.y + SCATTER_STAGE.h * 0.5,
    };
}

const AtomsLab: React.FC<AtomsLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const lastTimeRef = useRef<number>(performance.now());
    const particlesRef = useRef<AlphaParticle[]>([]);
    const flashesRef = useRef<Flash[]>([]);
    const statsRef = useRef<ScatteringStats>({ total: 0, over1: 0, over90: 0, back: 0, histogram: Array(HIST_BINS).fill(0), lastTheta: 0, lastB: 0 });
    const spawnAccRef = useRef(0);
    const particleIdRef = useRef(0);
    const electronPhaseRef = useRef(0);
    const transitionRef = useRef<TransitionFx | null>(null);

    const [mode, setMode] = useState<AtomsMode>('scattering');
    const [isPlaying, setIsPlaying] = useState(true);
    const [targetKind, setTargetKind] = useState<TargetKind>('gold');
    const [customZ, setCustomZ] = useState(30);
    const [energyMev, setEnergyMev] = useState(7.7);
    const [beamWidth, setBeamWidth] = useState(360);
    const [fireRate, setFireRate] = useState<FireRate>('medium');
    const [showImpact, setShowImpact] = useState(true);
    const [showForce, setShowForce] = useState(true);
    const [orbitN, setOrbitN] = useState(2);
    const [targetN, setTargetN] = useState(3);
    const [showOrbitLabels, setShowOrbitLabels] = useState(true);
    const [showStandingWave, setShowStandingWave] = useState(true);
    const [series, setSeries] = useState<SeriesKey>('balmer');
    const [spectrumView, setSpectrumView] = useState<SpectrumView>('emission');
    const [showTransitions, setShowTransitions] = useState(true);
    const [statsTick, setStatsTick] = useState(0);

    const z = getTargetZ(targetKind, customZ);
    const dFm = closestApproachFm(z, energyMev);
    const currentEnergy = energyEv(orbitN);
    const selectedWave = wavelengthNm(Math.max(targetN, orbitN), Math.min(targetN, orbitN));
    const selectedDelta = transitionEnergy(Math.max(targetN, orbitN), Math.min(targetN, orbitN));

    const resetScattering = useCallback(() => {
        particlesRef.current = [];
        flashesRef.current = [];
        statsRef.current = { total: 0, over1: 0, over90: 0, back: 0, histogram: Array(HIST_BINS).fill(0), lastTheta: 0, lastB: 0 };
        spawnAccRef.current = 0;
        setStatsTick(t => t + 1);
    }, []);

    const resetAll = useCallback(() => {
        resetScattering();
        transitionRef.current = null;
        electronPhaseRef.current = 0;
        setOrbitN(2);
        setTargetN(3);
    }, [resetScattering]);

    const spawnAlpha = useCallback((single = false) => {
        const nucleus = getScatteringNucleus();
        const startX = SCATTER_STAGE.x + 78;
        const yOffset = single ? 0 : (Math.random() - 0.5) * beamWidth;
        const speed = 260 + energyMev * 38;
        const p: AlphaParticle = {
            id: particleIdRef.current++,
            x: startX,
            y: nucleus.y + yOffset,
            vx: speed,
            vy: 0,
            b: Math.abs(yOffset),
            initialSpeed: speed,
            trail: [],
            color: '#22c55e',
        };
        particlesRef.current.push(p);
        statsRef.current.lastB = Math.abs(yOffset);
        if (particlesRef.current.length > 220) particlesRef.current.shift();
    }, [beamWidth, energyMev]);

    const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
        if (mode !== 'bohr' && mode !== 'spectrum') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * W;
        const y = ((event.clientY - rect.top) / rect.height) * H;
        const level = levelFromPoint(x, y);
        if (!level) return;
        if (mode === 'bohr' && level !== orbitN) {
            const from = orbitN;
            const to = level;
            transitionRef.current = {
                from,
                to,
                progress: 0,
                wavelength: wavelengthNm(Math.max(from, to), Math.min(from, to)),
                energy: transitionEnergy(Math.max(from, to), Math.min(from, to)),
                emitting: from > to,
            };
            setTargetN(level);
            setOrbitN(level);
        }
    }, [mode, orbitN]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = W;
        canvas.height = H;
    }, []);

    // Keep the latest control values in a ref so the animation loop can read them without ever being
    // torn down. This is what guarantees the beams keep emitting when any control is changed.
    const liveRef = useRef<any>(null);
    liveRef.current = { isPlaying, mode, fireRate, z, targetKind, customZ, energyMev, beamWidth, showImpact, showForce, orbitN, targetN, showOrbitLabels, showStandingWave, series, spectrumView, showTransitions, spawnAlpha };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = (now: number) => {
            const dt = Math.min(now - lastTimeRef.current, 100);
            lastTimeRef.current = now;
            const dtSec = dt / 1000;
            const L = liveRef.current;
            drawBackground(ctx);

            if (L.isPlaying) {
                electronPhaseRef.current += dtSec * 1.7;
                if (transitionRef.current) {
                    transitionRef.current.progress += dtSec * 1.4;
                    if (transitionRef.current.progress >= 1.2) transitionRef.current = null;
                }
            }

            if (L.mode === 'scattering') {
                if (L.isPlaying) {
                    const rate = L.fireRate === 'single' ? 0 : L.fireRate === 'medium' ? 11 : 28;
                    spawnAccRef.current += dtSec * rate;
                    while (spawnAccRef.current >= 1) {
                        L.spawnAlpha(false);
                        spawnAccRef.current -= 1;
                    }
                    // Accumulate the detected-particle statistics for the running experiment.
                    const mcScale = L.fireRate === 'single' ? 0 : L.fireRate === 'fast' ? 1.6 : 1;
                    accumulateScattering(statsRef.current, L.z, L.energyMev, dtSec * MC_RATE * mcScale);
                }
                drawScattering(ctx, dtSec, L.isPlaying, L.z, L.targetKind, L.customZ, L.energyMev, L.beamWidth, L.showImpact, L.showForce, statsRef.current, particlesRef.current, flashesRef.current, electronPhaseRef.current);
            } else if (L.mode === 'bohr') {
                drawBohr(ctx, L.orbitN, L.targetN, electronPhaseRef.current, transitionRef.current, L.showOrbitLabels, L.showStandingWave);
            } else {
                drawSpectrumMode(ctx, L.series, L.spectrumView, L.showTransitions);
            }

            if (Math.floor(now / 250) !== Math.floor((now - dt) / 250)) setStatsTick(t => t + 1);
            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    const currentStats = statsRef.current;
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 z-20 hidden w-[360px] 2xl:block">
            <div className="flex flex-col gap-3">
                {mode === 'scattering' && (
                    <>
                        <GraphCard title="N(theta) vs theta" subtitle="NCERT Fig. 12.3, log scale">
                            <ScatteringGraph stats={currentStats} tick={statsTick} />
                        </GraphCard>
                        <GraphCard title="Impact Parameter" subtitle="Small b gives large theta">
                            <ImpactGraph b={currentStats.lastB} theta={currentStats.lastTheta} beamWidth={beamWidth} />
                        </GraphCard>
                    </>
                )}
                {mode === 'bohr' && (
                    <>
                        <GraphCard title="Energy Levels" subtitle="E_n = -13.6/n^2 eV">
                            <EnergyLevelsSvg currentN={orbitN} targetN={targetN} />
                        </GraphCard>
                        <GraphCard title="Orbit Radius" subtitle="r_n = a0 n^2">
                            <RadiusSvg currentN={orbitN} />
                        </GraphCard>
                    </>
                )}
                {mode === 'spectrum' && (
                    <>
                        <GraphCard title="Hydrogen Series" subtitle="Rydberg formula">
                            <SeriesGraph seriesKey={series} />
                        </GraphCard>
                        <GraphCard title="Visible Balmer Lines" subtitle="H-alpha to H-delta">
                            <BalmerInset />
                        </GraphCard>
                    </>
                )}
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 z-20 hidden w-[310px] 2xl:block">
            <div className="flex flex-col gap-3">
                <div className={`${mode === 'scattering' ? 'border-orange-200 bg-orange-50/95 text-orange-950' : 'border-indigo-200 bg-indigo-50/95 text-indigo-950'} rounded-xl border p-4 shadow-xl backdrop-blur`}>
                    <div className="text-base font-extrabold">{mode === 'scattering' ? 'Rutherford Scattering' : mode === 'bohr' ? 'Bohr Model' : 'Hydrogen Spectrum'}</div>
                    <div className="mt-2 space-y-2 text-sm font-semibold leading-snug">
                        {mode === 'scattering' && (
                            <>
                                <p>F = (1/4πε0)(2e)(Ze)/r^2. Newton's 2nd law + Coulomb repulsion bend each alpha particle along a hyperbola; a small impact parameter b gives a large scattering angle theta.</p>
                                <p>The atom is mostly empty space, so most alpha particles pass straight through. Only ~0.14% scatter beyond 1 degree and about 1 in 8000 beyond 90 degrees (near head-on).</p>
                            </>
                        )}
                        {mode === 'bohr' && (
                            <>
                                <p>E_n = -13.6/n^2 eV, r_n = a0 n^2, L = nh/2π.</p>
                                <p>Transitions emit or absorb photons: hν = E_i - E_f.</p>
                            </>
                        )}
                        {mode === 'spectrum' && (
                            <>
                                <p>1/λ = R(1/n_f^2 - 1/n_i^2), R = 1.097 x 10^7 m^-1.</p>
                                <p>Emission gives bright lines; absorption gives dark lines at the same wavelengths.</p>
                            </>
                        )}
                    </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="text-base font-extrabold text-slate-900">Real-time values</div>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-500">Live</span>
                    </div>
                    <div className="space-y-2">
                        {mode === 'scattering' && (
                            <>
                                <ValueRow label="Target" value={getTargetName(targetKind, customZ)} color="text-orange-700" bg="bg-orange-50" />
                                <ValueRow label="Alpha energy" value={`${energyMev.toFixed(1)} MeV`} color="text-red-700" bg="bg-red-50" />
                                <ValueRow label="Closest approach" value={`${dFm.toFixed(1)} fm`} color="text-purple-700" bg="bg-purple-50" />
                                <ValueRow label="Recorded hits" value={`${Math.round(currentStats.total).toLocaleString()}`} color="text-slate-700" bg="bg-slate-50" />
                                <ValueRow label="Scattered > 1 deg" value={`${percent(currentStats.over1, currentStats.total)} (NCERT ${NCERT_OVER1_PERCENT}%)`} color="text-blue-700" bg="bg-blue-50" />
                                <ValueRow label="Scattered > 90 deg" value={`${oneIn(currentStats.over90, currentStats.total)} (NCERT ~1 in ${NCERT_OVER90_RATIO})`} color="text-rose-700" bg="bg-rose-50" />
                                <ValueRow label="Last theta" value={`${currentStats.lastTheta.toFixed(1)} deg`} color="text-emerald-700" bg="bg-emerald-50" />
                            </>
                        )}
                        {mode === 'bohr' && (
                            <>
                                <ValueRow label="Current level" value={`n = ${orbitN}`} color="text-indigo-700" bg="bg-indigo-50" />
                                <ValueRow label="Energy" value={`${currentEnergy.toFixed(3)} eV`} color="text-blue-700" bg="bg-blue-50" />
                                <ValueRow label="Radius" value={`${(A0_PM * orbitN * orbitN).toFixed(0)} pm`} color="text-cyan-700" bg="bg-cyan-50" />
                                <ValueRow label="Transition ΔE" value={`${selectedDelta.toFixed(2)} eV`} color="text-emerald-700" bg="bg-emerald-50" />
                                <ValueRow label="Photon λ" value={Number.isFinite(selectedWave) ? `${selectedWave.toFixed(0)} nm` : 'select lower n'} color="text-fuchsia-700" bg="bg-fuchsia-50" />
                            </>
                        )}
                        {mode === 'spectrum' && (
                            <>
                                <ValueRow label="Selected series" value={SERIES[series].name} color="text-indigo-700" bg="bg-indigo-50" />
                                <ValueRow label="Final level" value={`n_f = ${SERIES[series].nf}`} color="text-blue-700" bg="bg-blue-50" />
                                <ValueRow label="Region" value={SERIES[series].region} color="text-purple-700" bg="bg-purple-50" />
                                <ValueRow label="View" value={spectrumView} color="text-emerald-700" bg="bg-emerald-50" />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );

    const simulationJSX = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} onClick={handleCanvasClick} className="absolute inset-0 h-full w-full cursor-crosshair" />
                <div className="absolute right-5 top-5 flex gap-2">
                    <button onClick={() => setIsPlaying(v => !v)} className="rounded-lg bg-white px-3 py-2 text-slate-700 shadow-lg ring-1 ring-slate-200 hover:bg-slate-50" aria-label={isPlaying ? 'Pause' : 'Play'}>
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button onClick={resetAll} className="rounded-lg bg-white px-3 py-2 text-slate-700 shadow-lg ring-1 ring-slate-200 hover:bg-slate-50" aria-label="Reset">
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    const controlsJSX = (
        <div className="space-y-4 p-4">
            <div className="grid grid-cols-3 gap-2">
                <ModeButton active={mode === 'scattering'} icon={<Target size={18} />} label="Scattering" onClick={() => setMode('scattering')} />
                <ModeButton active={mode === 'bohr'} icon={<Atom size={18} />} label="Bohr Model" onClick={() => setMode('bohr')} />
                <ModeButton active={mode === 'spectrum'} icon={<Activity size={18} />} label="Spectrum" onClick={() => setMode('spectrum')} />
            </div>

            <button
                onClick={() => setIsPlaying(v => !v)}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-black text-white shadow-lg transition ${isPlaying ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
                {isPlaying ? <><Pause size={20} /> Pause</> : <><Play size={20} /> {mode === 'scattering' ? 'Start beams' : 'Start'}</>}
            </button>

            {mode === 'scattering' && (
                <div className="grid gap-4 md:grid-cols-2">
                    <ControlBlock label="Target material">
                        <div className="grid grid-cols-3 gap-2">
                            {(['gold', 'aluminum', 'custom'] as TargetKind[]).map(item => (
                                <button key={item} onClick={() => { setTargetKind(item); resetScattering(); }} className={`rounded-lg px-3 py-2 text-sm font-extrabold ${targetKind === item ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{item === 'gold' ? 'Gold' : item === 'aluminum' ? 'Aluminum' : 'Custom'}</button>
                            ))}
                        </div>
                        {targetKind === 'custom' && <Slider label="Custom Z" value={customZ} min={1} max={92} step={1} onChange={setCustomZ} suffix="" />}
                    </ControlBlock>
                    <ControlBlock label="Alpha particle beam">
                        <Slider label="Energy K" value={energyMev} min={2} max={10} step={0.5} onChange={setEnergyMev} suffix=" MeV" />
                        <Slider label="Beam width" value={beamWidth} min={200} max={460} step={20} onChange={setBeamWidth} suffix=" px" />
                    </ControlBlock>
                    <ControlBlock label="Fire rate">
                        <div className="grid grid-cols-3 gap-2">
                            {(['single', 'medium', 'fast'] as FireRate[]).map(item => (
                                <button key={item} onClick={() => setFireRate(item)} className={`rounded-lg px-3 py-2 text-sm font-extrabold capitalize ${fireRate === item ? 'bg-orange-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{item}</button>
                            ))}
                        </div>
                    </ControlBlock>
                    <ControlBlock label="Overlays">
                        <div className="grid grid-cols-2 gap-2">
                            <ToggleButton active={showImpact} onClick={() => setShowImpact(v => !v)} label="Impact b" />
                            <ToggleButton active={showForce} onClick={() => setShowForce(v => !v)} label="Force vectors" />
                        </div>
                    </ControlBlock>
                </div>
            )}

            {mode === 'bohr' && (
                <div className="grid gap-4 md:grid-cols-2">
                    <ControlBlock label="Current orbit and transition">
                        <Slider label="Current orbit n" value={orbitN} min={1} max={6} step={1} onChange={setOrbitN} suffix="" />
                        <Slider label="Transition level n" value={targetN} min={1} max={6} step={1} onChange={setTargetN} suffix="" />
                        <button onClick={() => {
                            if (targetN === orbitN) return;
                            const from = orbitN;
                            const to = targetN;
                            transitionRef.current = {
                                from,
                                to,
                                progress: 0,
                                wavelength: wavelengthNm(Math.max(from, to), Math.min(from, to)),
                                energy: transitionEnergy(Math.max(from, to), Math.min(from, to)),
                                emitting: from > to,
                            };
                            setOrbitN(to);
                        }} className="mt-3 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white shadow hover:bg-indigo-700">Run transition</button>
                    </ControlBlock>
                    <ControlBlock label="Visual aids">
                        <div className="grid grid-cols-2 gap-2">
                            <ToggleButton active={showOrbitLabels} onClick={() => setShowOrbitLabels(v => !v)} label="Orbit labels" />
                            <ToggleButton active={showStandingWave} onClick={() => setShowStandingWave(v => !v)} label="nλ = 2πr" />
                        </div>
                    </ControlBlock>
                </div>
            )}

            {mode === 'spectrum' && (
                <div className="grid gap-4 md:grid-cols-2">
                    <ControlBlock label="Series and spectrum view">
                        <div className="grid grid-cols-5 gap-2">
                            {(Object.keys(SERIES) as SeriesKey[]).map(key => (
                                <button key={key} onClick={() => setSeries(key)} className={`rounded-lg px-2 py-2 text-xs font-extrabold ${series === key ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{SERIES[key].name}</button>
                            ))}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            {(['emission', 'absorption'] as SpectrumView[]).map(item => (
                                <button key={item} onClick={() => setSpectrumView(item)} className={`rounded-lg px-3 py-2 text-sm font-extrabold capitalize ${spectrumView === item ? 'bg-purple-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{item}</button>
                            ))}
                        </div>
                    </ControlBlock>
                    <ControlBlock label="Overlays">
                        <ToggleButton active={showTransitions} onClick={() => setShowTransitions(v => !v)} label="Transition arrows" />
                    </ControlBlock>
                </div>
            )}
        </div>
    );

    return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationJSX} ControlsComponent={controlsJSX} />;
};

function drawScattering(ctx: CanvasRenderingContext2D, dt: number, isPlaying: boolean, z: number, kind: TargetKind, customZ: number, energyMev: number, beamWidth: number, showImpact: boolean, showForce: boolean, stats: ScatteringStats, particles: AlphaParticle[], flashes: Flash[], phase: number) {
    const nucleus = getScatteringNucleus();
    const { x, y, w, h } = SCATTER_STAGE;
    drawScatteringStage(ctx);
    drawCanvasTitle(ctx, 'Rutherford Alpha-Particle Scattering', 'Coulomb repulsion | small impact parameter b gives large scattering angle theta', '#f97316');

    ctx.save();
    roundRect(ctx, x, y, w, h, 24);
    ctx.clip();

    const field = ctx.createRadialGradient(nucleus.x, nucleus.y, 0, nucleus.x, nucleus.y, 340);
    field.addColorStop(0, 'rgba(250,204,21,0.42)');
    field.addColorStop(0.18, 'rgba(249,115,22,0.2)');
    field.addColorStop(0.46, 'rgba(250,204,21,0.08)');
    field.addColorStop(1, 'rgba(250,204,21,0)');
    ctx.fillStyle = field;
    ctx.beginPath();
    ctx.arc(nucleus.x, nucleus.y, 340, 0, Math.PI * 2);
    ctx.fill();
    drawCoulombField(ctx, nucleus, z);

    drawSource(ctx, beamWidth, nucleus);
    drawGoldFoil(ctx, nucleus, kind, customZ);
    drawElectronCloud(ctx, nucleus, z, phase, particles);
    drawDetectorArc(ctx, nucleus);

    if (isPlaying) {
        // Sub-step the integration so the curved trajectories stay stable and frame-rate independent.
        const sub = Math.max(1, Math.ceil(dt / 0.0028));
        const sdt = dt / sub;
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            for (let s = 0; s < sub; s++) {
                const dx = p.x - nucleus.x;
                const dy = p.y - nucleus.y;
                const dist = Math.hypot(dx, dy);
                // Coulomb repulsion only inside the (screened) interaction region. Outside it the
                // particle travels in a straight line, which is why most alphas cross undeflected.
                if (dist < FIELD_RADIUS) {
                    const d = Math.max(D_NEAR, dist);
                    const force = K_SIM * z * (5.5 / energyMev) / (d * d);
                    p.vx += (dx / d) * force * sdt;
                    p.vy += (dy / d) * force * sdt;
                }
                p.x += p.vx * sdt;
                p.y += p.vy * sdt;
            }
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 80) p.trail.shift();

            const dxNow = p.x - nucleus.x;
            const dyNow = p.y - nucleus.y;
            const distNow = Math.max(D_NEAR, Math.hypot(dxNow, dyNow));
            if (showForce && particles.length < 80 && i % 7 === 0 && distNow < FIELD_RADIUS) {
                const end = { x: p.x + (dxNow / distNow) * 34, y: p.y + (dyNow / distNow) * 34 };
                drawArrow(ctx, { x: p.x, y: p.y }, end, 'rgba(239,68,68,0.55)', 1.6);
            }

            if (p.x > x + w - 18 || p.x < x + 18 || p.y < y + 18 || p.y > y + h - 18) {
                const theta = Math.acos(clamp(p.vx / Math.max(1, Math.hypot(p.vx, p.vy)), -1, 1)) * RAD;
                stats.lastTheta = theta;
                stats.lastB = p.b;
                const arcPoint = detectorPoint(nucleus, p);
                if (arcPoint) flashes.push({ x: arcPoint.x, y: arcPoint.y, life: 0, maxLife: 0.3, color: p.color });
                particles.splice(i, 1);
            }
        }
    }

    particles.forEach(p => drawAlpha(ctx, p));
    updateFlashes(ctx, flashes, dt);

    if (showImpact && stats.lastB > 0) {
        const y = nucleus.y + (stats.lastB > beamWidth / 2 ? beamWidth / 2 : stats.lastB);
        drawLine(ctx, { x: SCATTER_STAGE.x + 160, y }, { x: nucleus.x, y }, 'rgba(100,116,139,0.42)', 1.2, [7, 7]);
        drawLine(ctx, { x: nucleus.x, y }, { x: nucleus.x, y: nucleus.y }, 'rgba(239,68,68,0.65)', 1.6, [4, 5]);
        drawLabel(ctx, `impact parameter b = ${stats.lastB.toFixed(0)} px`, nucleus.x - 112, y - 18, '#be123c', 'left', '800 12px Inter, sans-serif');
    }

    ctx.restore();
}

function drawScatteringStage(ctx: CanvasRenderingContext2D) {
    const { x, y, w, h } = SCATTER_STAGE;
    ctx.save();
    const chamber = ctx.createLinearGradient(x, y, x + w, y + h);
    chamber.addColorStop(0, '#08111f');
    chamber.addColorStop(0.48, '#111827');
    chamber.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = chamber;
    roundRect(ctx, x, y, w, h, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.28)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    for (let gx = x + 36; gx < x + w; gx += 44) drawLine(ctx, { x: gx, y }, { x: gx, y: y + h }, 'rgba(148,163,184,0.055)', 1);
    for (let gy = y + 36; gy < y + h; gy += 44) drawLine(ctx, { x, y: gy }, { x: x + w, y: gy }, 'rgba(148,163,184,0.055)', 1);
    ctx.fillStyle = 'rgba(15,23,42,0.48)';
    roundRect(ctx, x + 28, y + 22, 230, 68, 14);
    ctx.fill();
    drawLabel(ctx, 'Vacuum scattering chamber', x + 44, y + 46, '#e2e8f0', 'left', '900 13px Inter, sans-serif');
    drawLabel(ctx, 'Gold foil target and rotatable ZnS detector', x + 44, y + 70, '#94a3b8', 'left', '800 12px Inter, sans-serif');
    ctx.restore();
}

function drawCoulombField(ctx: CanvasRenderingContext2D, nucleus: Vec, z: number) {
    ctx.save();
    const ringCount = 8;
    for (let i = 1; i <= ringCount; i++) {
        const r = 24 + i * 33;
        const alpha = 0.2 * (1 - i / (ringCount + 1));
        ctx.strokeStyle = `rgba(250,204,21,${alpha})`;
        ctx.lineWidth = i % 2 === 0 ? 1.4 : 0.8;
        ctx.setLineDash(i % 2 === 0 ? [8, 10] : [2, 10]);
        ctx.beginPath();
        ctx.arc(nucleus.x, nucleus.y, r, 0, Math.PI * 2);
        ctx.stroke();
    }
    const rays = 16;
    for (let i = 0; i < rays; i++) {
        const a = (i / rays) * Math.PI * 2;
        const inner = 26;
        const outer = 212 + clamp(z, 1, 92) * 0.9;
        drawLine(
            ctx,
            { x: nucleus.x + Math.cos(a) * inner, y: nucleus.y + Math.sin(a) * inner },
            { x: nucleus.x + Math.cos(a) * outer, y: nucleus.y + Math.sin(a) * outer },
            'rgba(251,191,36,0.08)',
            1
        );
    }
    ctx.restore();
}

function drawSource(ctx: CanvasRenderingContext2D, beamWidth: number, nucleus: Vec) {
    const { x } = SCATTER_STAGE;
    const cy = nucleus.y;
    const sourceX = x + 58;
    const collimatorX = x + 140;
    const beamStartX = collimatorX + 52;
    const beamEndX = nucleus.x - 48;
    ctx.save();
    const sourceGlow = ctx.createRadialGradient(sourceX, cy, 0, sourceX, cy, 116);
    sourceGlow.addColorStop(0, 'rgba(248,113,113,0.42)');
    sourceGlow.addColorStop(1, 'rgba(248,113,113,0)');
    ctx.fillStyle = sourceGlow;
    ctx.beginPath();
    ctx.arc(sourceX, cy, 116, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, sourceX - 38, cy - 84, 72, 168, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(248,250,252,0.24)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.fillRect(collimatorX - 24, cy - beamWidth / 2 - 34, 26, 32);
    ctx.fillRect(collimatorX - 24, cy + beamWidth / 2 + 2, 26, 32);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(collimatorX + 2, cy - beamWidth / 2 - 24, 34, 22);
    ctx.fillRect(collimatorX + 2, cy + beamWidth / 2 + 2, 34, 22);
    drawLabel(ctx, '214Bi alpha source', sourceX + 5, cy - 110, '#f8fafc', 'center', '900 12px Inter, sans-serif');
    drawLabel(ctx, 'Lead collimator', collimatorX + 6, cy + beamWidth / 2 + 52, '#cbd5e1', 'center', '800 11px Inter, sans-serif');
    for (let i = -4; i <= 4; i++) {
        const y = cy + (i / 4) * (beamWidth / 2);
        drawLine(ctx, { x: beamStartX, y }, { x: beamEndX, y }, 'rgba(248,113,113,0.22)', 1.4, [6, 8]);
    }
    drawLabel(ctx, 'narrow alpha beam', (beamStartX + beamEndX) / 2, cy - beamWidth / 2 - 28, '#fca5a5', 'center', '900 12px Inter, sans-serif');
    ctx.restore();
}

function drawGoldFoil(ctx: CanvasRenderingContext2D, nucleus: Vec, kind: TargetKind, customZ: number) {
    const foilTop = SCATTER_STAGE.y + 54;
    const foilBottom = SCATTER_STAGE.y + SCATTER_STAGE.h - 74;
    const foilHeight = foilBottom - foilTop;
    ctx.save();
    const foilGrad = ctx.createLinearGradient(nucleus.x - 12, foilTop, nucleus.x + 12, foilBottom);
    foilGrad.addColorStop(0, 'rgba(254,240,138,0.18)');
    foilGrad.addColorStop(0.5, 'rgba(250,204,21,0.56)');
    foilGrad.addColorStop(1, 'rgba(202,138,4,0.20)');
    ctx.fillStyle = foilGrad;
    ctx.fillRect(nucleus.x - 5, foilTop, 10, foilHeight);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(nucleus.x - 5, foilTop, 10, foilHeight);
    for (let y = foilTop + 12; y <= foilBottom - 12; y += 21) {
        const offset = Math.sin(y * 0.13) * 5;
        ctx.fillStyle = kind === 'aluminum' ? 'rgba(203,213,225,0.42)' : 'rgba(253,224,71,0.42)';
        ctx.beginPath();
        ctx.arc(nucleus.x + offset, y, 2.1, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 30;
    ctx.fillStyle = kind === 'aluminum' ? '#94a3b8' : '#facc15';
    ctx.beginPath();
    ctx.arc(nucleus.x, nucleus.y, kind === 'gold' ? 16 : 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    drawLabel(ctx, '+', nucleus.x, nucleus.y, '#0f172a', 'center', '900 13px Inter, sans-serif');
    drawLabel(ctx, `${getTargetName(kind, customZ)} nucleus`, nucleus.x, nucleus.y + 46, '#fde68a', 'center', '900 12px Inter, sans-serif');
    drawLabel(ctx, kind === 'gold' ? 'Au foil: 2.1 x 10^-7 m' : 'Thin target foil', nucleus.x, foilTop - 22, '#fde68a', 'center', '900 13px Inter, sans-serif');
    drawLabel(ctx, 'electron cloud is too light to deflect alpha particles strongly', nucleus.x + 178, nucleus.y + 72, '#93c5fd', 'center', '800 11px Inter, sans-serif');
    ctx.restore();
}

// Fill electron shells (capacity 2n^2) in order until the Z electrons run out. Illustrative, not
// strict Aufbau order, but it gives the right number of shells and electrons per element.
function electronShells(z: number): number[] {
    const shells: number[] = [];
    let remaining = Math.max(1, Math.round(z));
    let n = 1;
    while (remaining > 0 && n <= 7) {
        const take = Math.min(2 * n * n, remaining);
        shells.push(take);
        remaining -= take;
        n++;
    }
    return shells;
}

// Draw the electron cloud orbiting the selected atom's nucleus. The alpha particles plough straight
// through it: electrons are ~7000x lighter, so they cannot deflect the alpha (they only jiggle and
// spark when an alpha sweeps past). This is the "electron cloud is too light" point made visual.
function drawElectronCloud(ctx: CanvasRenderingContext2D, nucleus: Vec, z: number, phase: number, particles: AlphaParticle[]) {
    const shells = electronShells(z);
    ctx.save();
    shells.forEach((count, si) => {
        const r = 96 + si * 28;
        // faint orbit ring
        ctx.strokeStyle = 'rgba(125,211,252,0.14)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 8]);
        ctx.beginPath();
        ctx.arc(nucleus.x, nucleus.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        const dir = si % 2 === 0 ? 1 : -1;
        const speed = 0.55 - si * 0.05;
        for (let k = 0; k < count; k++) {
            const ang = (k / count) * Math.PI * 2 + phase * speed * dir;
            let ex = nucleus.x + Math.cos(ang) * r;
            let ey = nucleus.y + Math.sin(ang) * r;
            // alpha sweeps past: nudge the electron aside and spark, but never touch the alpha's path.
            let nearest: AlphaParticle | null = null;
            let nd = 1e9;
            for (const p of particles) {
                const d = Math.hypot(p.x - ex, p.y - ey);
                if (d < nd) { nd = d; nearest = p; }
            }
            if (nearest && nd < 24) {
                const push = ((24 - nd) / 24) * 9;
                const nx = (ex - nearest.x) / Math.max(1, nd);
                const ny = (ey - nearest.y) / Math.max(1, nd);
                ex += nx * push;
                ey += ny * push;
                ctx.strokeStyle = 'rgba(125,211,252,0.45)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(nearest.x, nearest.y);
                ctx.lineTo(ex, ey);
                ctx.stroke();
            }
            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(ex, ey, 2.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });
    drawLabel(ctx, `Z = ${Math.round(z)}: ${shells.reduce((a, b) => a + b, 0)} electrons, ${shells.length} shells`, nucleus.x, nucleus.y + 90, '#7dd3fc', 'center', '800 11px Inter, sans-serif');
    ctx.restore();
}

function drawDetectorArc(ctx: CanvasRenderingContext2D, nucleus: Vec) {
    ctx.save();
    ctx.strokeStyle = 'rgba(34,211,238,0.32)';
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.arc(nucleus.x, nucleus.y, DETECTOR_R, -1.33, 1.33);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(nucleus.x, nucleus.y, DETECTOR_R, Math.PI - 1.1, Math.PI + 1.1);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(226,232,240,0.64)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(nucleus.x, nucleus.y, DETECTOR_R, -1.33, 1.33);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(nucleus.x, nucleus.y, DETECTOR_R, Math.PI - 1.1, Math.PI + 1.1);
    ctx.stroke();
    ctx.setLineDash([]);
    drawLabel(ctx, 'Rotatable ZnS screen + microscope', nucleus.x + 216, nucleus.y - 202, '#e0f2fe', 'center', '900 12px Inter, sans-serif');
    drawLabel(ctx, '0 deg', nucleus.x + DETECTOR_R + 24, nucleus.y + 4, '#bae6fd', 'left', '800 11px Inter, sans-serif');
    drawLabel(ctx, '90 deg', nucleus.x + 8, nucleus.y - DETECTOR_R - 18, '#fecdd3', 'center', '800 11px Inter, sans-serif');
    drawLabel(ctx, 'back scatter', nucleus.x - DETECTOR_R - 66, nucleus.y + 4, '#fde68a', 'left', '900 11px Inter, sans-serif');
    ctx.restore();
}

function drawAlpha(ctx: CanvasRenderingContext2D, p: AlphaParticle) {
    const speed = Math.hypot(p.vx, p.vy);
    const theta = Math.acos(clamp(p.vx / Math.max(1, speed), -1, 1)) * RAD;
    p.color = theta > 90 ? '#fbbf24' : theta > 10 ? '#ef4444' : '#22c55e';
    if (p.trail.length > 1) {
        for (let i = 1; i < p.trail.length; i++) {
            const a = i / p.trail.length;
            ctx.save();
            ctx.globalAlpha = 0.08 + a * 0.58;
            drawLine(ctx, p.trail[i - 1], p.trail[i], p.color, 1.6);
            ctx.restore();
        }
    }
    ctx.save();
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 18;
    const grad = ctx.createRadialGradient(p.x - 2, p.y - 2, 0, p.x, p.y, 9);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.32, p.color);
    grad.addColorStop(1, 'rgba(15,23,42,0.05)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
    ctx.fill();
    if (p.trail.length < 40 || theta > 35) drawLabel(ctx, 'α', p.x, p.y - 13, '#f8fafc', 'center', '900 10px Inter, sans-serif');
    ctx.restore();
}

function detectorPoint(nucleus: Vec, p: AlphaParticle) {
    const ang = Math.atan2(p.vy, p.vx);
    return { x: nucleus.x + Math.cos(ang) * DETECTOR_R, y: nucleus.y + Math.sin(ang) * DETECTOR_R };
}

function updateFlashes(ctx: CanvasRenderingContext2D, flashes: Flash[], dt: number) {
    for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.life += dt;
        const t = f.life / f.maxLife;
        if (t >= 1) {
            flashes.splice(i, 1);
            continue;
        }
        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 28 * t);
        grad.addColorStop(0, f.color);
        grad.addColorStop(0.28, 'rgba(255,255,255,0.92)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 28 * t, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${0.75 * (1 - t)})`;
        ctx.lineWidth = 1.4;
        for (let k = 0; k < 6; k++) {
            const a = k * Math.PI / 3;
            drawLine(
                ctx,
                { x: f.x + Math.cos(a) * 4, y: f.y + Math.sin(a) * 4 },
                { x: f.x + Math.cos(a) * (18 + 20 * t), y: f.y + Math.sin(a) * (18 + 20 * t) },
                `rgba(255,255,255,${0.55 * (1 - t)})`,
                1.2
            );
        }
    }
}

function drawBohr(ctx: CanvasRenderingContext2D, orbitN: number, targetN: number, phase: number, fx: TransitionFx | null, labels: boolean, standing: boolean) {
    drawCanvasTitle(ctx, 'Bohr Model of Hydrogen Atom', 'E_n = -13.6/n^2 eV  |  r_n = a0 n^2  |  L = nh/2π', '#6366f1');
    const center = { x: 455, y: 365 };
    const maxR = 270;
    const radiusFor = (n: number) => 28 + (n * n / 36) * maxR;

    ctx.save();
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(center.x, center.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    drawLabel(ctx, 'p+', center.x, center.y, '#ffffff', 'center', '900 12px Inter, sans-serif');
    ctx.restore();

    ENERGY_LEVELS.forEach(n => {
        const r = radiusFor(n);
        ctx.save();
        ctx.strokeStyle = n === orbitN ? '#2563eb' : 'rgba(14,116,144,0.44)';
        ctx.lineWidth = n === orbitN ? 3 : 1.4;
        ctx.setLineDash([7, 8]);
        ctx.beginPath();
        ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        if (standing) drawStandingWave(ctx, center, r, n);
        if (labels) drawLabel(ctx, `n=${n}`, center.x + r + 22, center.y, '#0e7490', 'left', '900 12px Inter, sans-serif');
    });

    const r = radiusFor(orbitN);
    const ex = center.x + r * Math.cos(phase * (1.4 / orbitN));
    const ey = center.y + r * Math.sin(phase * (1.4 / orbitN));
    ctx.save();
    ctx.shadowColor = '#2563eb';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(ex, ey, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawLabel(ctx, 'electron', ex + 38, ey - 12, '#1d4ed8', 'left', '800 11px Inter, sans-serif');

    if (fx) drawPhotonFx(ctx, center, fx);
    drawEnergyPanel(ctx, orbitN, targetN);
    drawDataBar(ctx, [
        { label: 'Current orbit', value: `n=${orbitN}`, color: '#4f46e5' },
        { label: 'Energy', value: `${energyEv(orbitN).toFixed(3)} eV`, color: '#2563eb' },
        { label: 'Radius', value: `${(A0_PM * orbitN * orbitN).toFixed(0)} pm`, color: '#0891b2' },
        { label: 'Ionization', value: `${Math.abs(energyEv(orbitN)).toFixed(2)} eV`, color: '#be123c' },
        { label: 'Transition', value: targetN === orbitN ? 'select n' : `${orbitN} -> ${targetN}`, color: '#7c3aed' },
        { label: 'Photon', value: targetN === orbitN ? '-' : `${wavelengthNm(Math.max(orbitN, targetN), Math.min(orbitN, targetN)).toFixed(0)} nm`, color: '#15803d' },
    ]);
}

function drawStandingWave(ctx: CanvasRenderingContext2D, center: Vec, r: number, n: number) {
    ctx.save();
    ctx.strokeStyle = 'rgba(37,99,235,0.32)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i <= 240; i++) {
        const t = (i / 240) * Math.PI * 2;
        const wave = Math.sin(t * n) * 5;
        const x = center.x + (r + wave) * Math.cos(t);
        const y = center.y + (r + wave) * Math.sin(t);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
}

function drawPhotonFx(ctx: CanvasRenderingContext2D, center: Vec, fx: TransitionFx) {
    const p = clamp(fx.progress, 0, 1);
    const color = spectrumColor(fx.wavelength);
    const start = fx.emitting ? { x: center.x + 110, y: center.y - 100 } : { x: center.x - 170, y: center.y + 110 };
    const end = fx.emitting ? { x: center.x + 300, y: center.y - 190 } : { x: center.x + 10, y: center.y + 25 };
    const head = { x: lerp(start.x, end.x, p), y: lerp(start.y, end.y, p) };
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let i = 0; i <= 36; i++) {
        const t = i / 36;
        const x = lerp(start.x, head.x, t);
        const y = lerp(start.y, head.y, t) + Math.sin(t * Math.PI * 8 + fx.progress * 10) * 8;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    drawArrowHead(ctx, head.x, head.y, Math.atan2(end.y - start.y, end.x - start.x), color, 11);
    ctx.restore();
    drawLabel(ctx, `${fx.emitting ? 'emits' : 'absorbs'} hν = ${fx.energy.toFixed(2)} eV`, head.x, head.y - 28, color, 'center', '900 12px Inter, sans-serif');
    drawLabel(ctx, `λ = ${fx.wavelength.toFixed(0)} nm`, head.x, head.y - 10, color, 'center', '900 12px Inter, sans-serif');
}

function drawEnergyPanel(ctx: CanvasRenderingContext2D, currentN: number, targetN: number) {
    const x = 780;
    const y = 112;
    const w = 410;
    const h = 492;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    roundRect(ctx, x, y, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(99,102,241,0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawLabel(ctx, 'Hydrogen Energy Levels', x + 24, y + 28, '#0f172a', 'left', '900 16px Inter, sans-serif');
    const yForE = (e: number) => y + 54 + ((0 - e) / 13.6) * 380;
    drawLine(ctx, { x: x + 70, y: yForE(0) }, { x: x + w - 36, y: yForE(0) }, '#64748b', 1.2);
    drawLabel(ctx, 'n=∞  0 eV', x + 70, yForE(0) - 14, '#475569', 'left', '800 11px Inter, sans-serif');
    ENERGY_LEVELS.forEach(n => {
        const yy = yForE(energyEv(n));
        drawLine(ctx, { x: x + 70, y: yy }, { x: x + w - 36, y: yy }, n === currentN ? '#2563eb' : '#94a3b8', n === currentN ? 3 : 1.5);
        drawLabel(ctx, `n=${n}`, x + 26, yy, n === currentN ? '#2563eb' : '#475569', 'left', '900 12px Inter, sans-serif');
        drawLabel(ctx, `${energyEv(n).toFixed(n === 1 ? 1 : 2)} eV`, x + w - 32, yy, '#334155', 'right', '800 11px Inter, sans-serif');
    });
    if (currentN !== targetN) {
        const fromY = yForE(energyEv(currentN));
        const toY = yForE(energyEv(targetN));
        drawArrow(ctx, { x: x + 240, y: fromY }, { x: x + 240, y: toY }, currentN > targetN ? '#16a34a' : '#7c3aed', 3);
    }
    ctx.restore();
}

function levelFromPoint(x: number, y: number) {
    const panelX = 780;
    if (x < panelX || x > 1190) return null;
    const yForE = (e: number) => 112 + 54 + ((0 - e) / 13.6) * 380;
    for (const n of ENERGY_LEVELS) {
        if (Math.abs(y - yForE(energyEv(n))) < 16) return n;
    }
    return null;
}

function drawSpectrumMode(ctx: CanvasRenderingContext2D, seriesKey: SeriesKey, view: SpectrumView, showArrows: boolean) {
    drawCanvasTitle(ctx, 'Hydrogen Spectrum', '1/λ = R(1/n_f² - 1/n_i²)  |  bright emission lines / dark absorption lines', '#6366f1');
    const selected = SERIES[seriesKey];
    drawSpectrumEnergyDiagram(ctx, selected, showArrows);
    drawSpectrumStrip(ctx, selected, view);
    drawDataBar(ctx, [
        { label: 'Series', value: selected.name, color: '#4f46e5' },
        { label: 'Final n_f', value: `${selected.nf}`, color: '#2563eb' },
        { label: 'Region', value: selected.region, color: '#7c3aed' },
        { label: 'Rydberg R', value: '1.097e7 m^-1', color: '#15803d' },
        { label: 'View', value: view, color: '#be123c' },
    ]);
}

function drawSpectrumEnergyDiagram(ctx: CanvasRenderingContext2D, series: { name: string; nf: number; color: string }, showArrows: boolean) {
    const x = 92;
    const y = 118;
    const w = 430;
    const h = 500;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    roundRect(ctx, x, y, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(99,102,241,0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawLabel(ctx, `${series.name} series transitions`, x + 24, y + 28, '#0f172a', 'left', '900 16px Inter, sans-serif');
    const yForN = (n: number) => y + 70 + ((0 - energyEv(n)) / 13.6) * 360;
    ENERGY_LEVELS.forEach(n => {
        const yy = yForN(n);
        drawLine(ctx, { x: x + 95, y: yy }, { x: x + w - 44, y: yy }, n === series.nf ? series.color : '#94a3b8', n === series.nf ? 3 : 1.4);
        drawLabel(ctx, `n=${n}`, x + 36, yy, n === series.nf ? series.color : '#475569', 'left', '900 12px Inter, sans-serif');
    });
    if (showArrows) {
        for (let ni = series.nf + 1; ni <= Math.min(8, series.nf + 5); ni++) {
            const startY = yForN(Math.min(ni, 6));
            const endY = yForN(series.nf);
            const xx = x + 130 + (ni - series.nf - 1) * 42;
            drawArrow(ctx, { x: xx, y: startY }, { x: xx, y: endY }, spectrumColor(wavelengthNm(ni, series.nf)), 2.2);
        }
    }
    ctx.restore();
}

function drawSpectrumStrip(ctx: CanvasRenderingContext2D, series: { name: string; nf: number; region: string; color: string }, view: SpectrumView) {
    const x = 590;
    const y = 155;
    const w = 600;
    const h = 350;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    roundRect(ctx, x, y, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(99,102,241,0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawLabel(ctx, `${series.name} ${view} spectrum`, x + 28, y + 32, '#0f172a', 'left', '900 16px Inter, sans-serif');
    const sx = x + 54;
    const sy = y + 120;
    const sw = w - 108;
    const sh = 96;
    const grad = ctx.createLinearGradient(sx, 0, sx + sw, 0);
    grad.addColorStop(0, view === 'emission' ? '#020617' : '#ede9fe');
    grad.addColorStop(0.5, view === 'emission' ? '#020617' : '#ffffff');
    grad.addColorStop(1, view === 'emission' ? '#020617' : '#fee2e2');
    ctx.fillStyle = grad;
    roundRect(ctx, sx, sy, sw, sh, 12);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.stroke();
    const minNm = series.nf === 2 ? 390 : series.nf === 1 ? 80 : 800;
    const maxNm = series.nf === 2 ? 700 : series.nf === 1 ? 125 : 2200;
    for (let ni = series.nf + 1; ni <= series.nf + 8; ni++) {
        const lam = wavelengthNm(ni, series.nf);
        const pos = clamp((lam - minNm) / (maxNm - minNm), 0, 1);
        const lx = sx + pos * sw;
        const color = spectrumColor(lam);
        ctx.strokeStyle = view === 'emission' ? color : '#0f172a';
        ctx.lineWidth = ni <= series.nf + 4 ? 4 : 2;
        ctx.shadowColor = view === 'emission' ? color : 'transparent';
        ctx.shadowBlur = view === 'emission' ? 10 : 0;
        drawLine(ctx, { x: lx, y: sy + 8 }, { x: lx, y: sy + sh - 8 }, ctx.strokeStyle as string, ctx.lineWidth);
        if (ni <= series.nf + 4) drawLabel(ctx, `${ni}->${series.nf}`, lx, sy + sh + 24, color, 'center', '800 11px Inter, sans-serif');
        if (ni <= series.nf + 4) drawLabel(ctx, `${lam.toFixed(0)} nm`, lx, sy - 18, color, 'center', '800 10px Inter, sans-serif');
    }
    drawLine(ctx, { x: sx, y: sy + sh + 48 }, { x: sx + sw, y: sy + sh + 48 }, '#475569', 1.4);
    drawLabel(ctx, `${minNm} nm`, sx, sy + sh + 68, '#475569', 'center', '800 11px Inter, sans-serif');
    drawLabel(ctx, `${maxNm} nm`, sx + sw, sy + sh + 68, '#475569', 'center', '800 11px Inter, sans-serif');
    drawLabel(ctx, series.region === 'Visible' ? 'Balmer visible region: Hα red, Hβ cyan, Hγ/Hδ violet' : `${series.region} region lines are outside visible light`, x + w / 2, y + h - 44, '#334155', 'center', '900 13px Inter, sans-serif');
    ctx.restore();
}

function GraphCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
            <div className="mb-2">
                <div className="text-lg font-extrabold text-slate-900">{title}</div>
                <div className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</div>
            </div>
            {children}
        </div>
    );
}

function ScatteringGraph({ stats }: { stats: ScatteringStats; tick: number }) {
    const maxCount = Math.max(1, ...stats.histogram);
    const bars = stats.histogram.map((count, i) => {
        const x = 42 + i * 15;
        const h = (Math.log10(count + 1) / Math.log10(maxCount + 1)) * 118;
        return <rect key={i} x={x} y={162 - h} width="9" height={h} fill="#2563eb" opacity="0.82" />;
    });
    const curve = Array.from({ length: 120 }, (_, i) => {
        const theta = 1 + (i / 119) * 179;
        const theoretical = 1 / Math.pow(Math.sin((theta * DEG) / 2), 4);
        const y = 160 - clamp(Math.log10(theoretical) / 7, 0, 1) * 130;
        const x = 42 + (theta / 180) * 270;
        return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
    return (
        <svg viewBox="0 0 340 220" className="h-[230px] w-full">
            <path d="M38 28V164H318" stroke="#475569" fill="none" />
            {[1, 3, 5, 7].map((p, i) => <g key={p}><line x1="38" x2="318" y1={164 - i * 34} y2={164 - i * 34} stroke="#e2e8f0" /><text x="8" y={168 - i * 34} className="fill-slate-600 text-[10px]">10^{p}</text></g>)}
            <path d={curve} stroke="#ca8a04" strokeWidth="3" fill="none" />
            {bars}
            <text x="180" y="205" textAnchor="middle" className="fill-slate-700 text-[12px]">Scattering angle θ (0° to 180°)</text>
            <text x="54" y="18" className="fill-slate-700 text-[11px]">log N</text>
        </svg>
    );
}

function ImpactGraph({ b, theta, beamWidth }: { b: number; theta: number; beamWidth: number }) {
    const bY = 112 + clamp(b / (beamWidth / 2), 0, 1) * 72;
    const thetaX = 44 + clamp(theta / 180, 0, 1) * 250;
    return (
        <svg viewBox="0 0 340 190" className="h-[200px] w-full">
            <line x1="48" y1="112" x2="306" y2="112" stroke="#475569" strokeWidth="2" />
            <circle cx="170" cy="112" r="9" fill="#ca8a04" />
            <line x1="48" y1={bY} x2="170" y2={bY} stroke="#64748b" strokeDasharray="6 5" />
            <line x1="170" y1="112" x2="170" y2={bY} stroke="#be123c" strokeDasharray="5 5" />
            <text x="190" y={(112 + bY) / 2} className="fill-rose-700 text-[12px]">b</text>
            <line x1="44" y1="160" x2="294" y2="160" stroke="#475569" />
            <circle cx={thetaX} cy="160" r="6" fill="#2563eb" />
            <text x="170" y="182" textAnchor="middle" className="fill-slate-700 text-[12px]">Last θ = {theta.toFixed(1)}°</text>
        </svg>
    );
}

function EnergyLevelsSvg({ currentN, targetN }: { currentN: number; targetN: number }) {
    const yForN = (n: number) => 184 - ((energyEv(n) + 13.6) / 13.6) * 136;
    return (
        <svg viewBox="0 0 340 220" className="h-[230px] w-full">
            <path d="M52 30V184H310" stroke="#475569" fill="none" />
            {[1, 2, 3, 4, 5, 6].map(n => <g key={n}><line x1="82" x2="286" y1={yForN(n)} y2={yForN(n)} stroke={n === currentN ? '#2563eb' : '#94a3b8'} strokeWidth={n === currentN ? 3 : 1.5} /><text x="26" y={yForN(n) + 4} className="fill-slate-700 text-[11px]">n={n}</text><text x="292" y={yForN(n) + 4} className="fill-slate-600 text-[10px]">{energyEv(n).toFixed(2)}</text></g>)}
            {currentN !== targetN && <line x1="184" x2="184" y1={yForN(currentN)} y2={yForN(targetN)} stroke="#7c3aed" strokeWidth="3" markerEnd="url(#arrow)" />}
            <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#7c3aed" /></marker></defs>
            <text x="170" y="210" textAnchor="middle" className="fill-slate-700 text-[12px]">Click levels on canvas to transition</text>
        </svg>
    );
}

function RadiusSvg({ currentN }: { currentN: number }) {
    return (
        <svg viewBox="0 0 340 190" className="h-[200px] w-full">
            <circle cx="170" cy="95" r="10" fill="#ef4444" />
            {[1, 2, 3, 4, 5, 6].map(n => <circle key={n} cx="170" cy="95" r={12 + n * n * 2.5} fill="none" stroke={n === currentN ? '#2563eb' : '#94a3b8'} strokeDasharray="5 6" strokeWidth={n === currentN ? 3 : 1} />)}
            <text x="170" y="174" textAnchor="middle" className="fill-slate-700 text-[12px]">r_n = a0 n^2 = {(A0_PM * currentN * currentN).toFixed(0)} pm</text>
        </svg>
    );
}

function SeriesGraph({ seriesKey }: { seriesKey: SeriesKey }) {
    const s = SERIES[seriesKey];
    return (
        <svg viewBox="0 0 340 220" className="h-[230px] w-full">
            <path d="M42 26V176H314" stroke="#475569" fill="none" />
            {[s.nf, s.nf + 1, s.nf + 2, s.nf + 3, s.nf + 4].map((n, i) => {
                const y = 168 - i * 30;
                return <g key={n}><line x1="76" x2="292" y1={y} y2={y} stroke={n === s.nf ? s.color : '#94a3b8'} strokeWidth={n === s.nf ? 3 : 1.5} /><text x="22" y={y + 4} className="fill-slate-700 text-[11px]">n={n}</text></g>;
            })}
            {[1, 2, 3, 4].map(k => <line key={k} x1={100 + k * 42} x2={100 + k * 42} y1={168 - k * 30} y2="168" stroke={spectrumColor(wavelengthNm(s.nf + k, s.nf))} strokeWidth="3" markerEnd="url(#seriesArrow)" />)}
            <defs><marker id="seriesArrow" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#334155" /></marker></defs>
            <text x="170" y="210" textAnchor="middle" className="fill-slate-700 text-[12px]">{s.name}: final level n_f = {s.nf}</text>
        </svg>
    );
}

function BalmerInset() {
    const lines = [
        { name: 'Hα', nm: 656, color: '#ef4444' },
        { name: 'Hβ', nm: 486, color: '#06b6d4' },
        { name: 'Hγ', nm: 434, color: '#8b5cf6' },
        { name: 'Hδ', nm: 410, color: '#7c3aed' },
    ];
    return (
        <svg viewBox="0 0 340 180" className="h-[190px] w-full">
            <rect x="28" y="52" width="284" height="56" rx="10" fill="#020617" />
            {lines.map(l => {
                const x = 28 + ((l.nm - 400) / 300) * 284;
                return <g key={l.name}><line x1={x} x2={x} y1="58" y2="102" stroke={l.color} strokeWidth="4" /><text x={x} y="132" textAnchor="middle" className="fill-slate-700 text-[11px]">{l.name}</text><text x={x} y="150" textAnchor="middle" className="fill-slate-600 text-[10px]">{l.nm}</text></g>;
            })}
            <text x="170" y="30" textAnchor="middle" className="fill-slate-950 text-[14px] font-black">Visible Balmer spectrum</text>
        </svg>
    );
}

function ValueRow({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
    return (
        <div className={`rounded-lg border border-slate-100 ${bg} px-3 py-2.5`}>
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
            <div className={`mt-1 font-mono text-base font-extrabold ${color}`}>{value}</div>
        </div>
    );
}

function ModeButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
    return <button onClick={onClick} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-extrabold transition ${active ? 'bg-indigo-600 text-white shadow' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{icon}{label}</button>;
}

function ToggleButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return <button onClick={onClick} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-extrabold ${active ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{active ? <Eye size={16} /> : <EyeOff size={16} />}{label}</button>;
}

function ControlBlock({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500"><Crosshair size={15} />{label}</div>
            {children}
        </div>
    );
}

function Slider({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (value: number) => void }) {
    return (
        <label className="mt-2 block">
            <div className="mb-1 flex items-center justify-between text-sm font-bold text-slate-700">
                <span>{label}</span>
                <span className="rounded-full bg-indigo-50 px-2 py-1 font-mono text-xs font-black text-indigo-700">{value}{suffix}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} className="w-full accent-indigo-600" />
        </label>
    );
}

export default AtomsLab;
