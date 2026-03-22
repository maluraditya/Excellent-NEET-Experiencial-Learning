import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface ThermodynamicProcessesLabProps {
    topic: any;
    onExit: () => void;
}

const R_val = 8.314;
const n_moles = 1;
const gamma_val = 1.4;
const Cv_val = R_val / (gamma_val - 1);

function pressure_calc(V: number, T: number) { return (n_moles * R_val * T) / V; }

const PROCESS_INFO: Record<string, { title: string; color: string; formula: string; desc: string; constraint: string }> = {
    isothermal: {
        title: 'Isothermal Process',
        color: '#dc2626',
        formula: 'ΔU = 0 → ΔQ = ΔW',
        desc: 'Temperature stays constant. All heat converts to work.',
        constraint: 'T = const, PV = const',
    },
    adiabatic: {
        title: 'Adiabatic Process',
        color: '#d97706',
        formula: 'ΔQ = 0 → ΔU = −ΔW',
        desc: 'No heat exchange. Internal energy does the work.',
        constraint: 'Q = 0, PV^γ = const',
    },
    isochoric: {
        title: 'Isochoric Process',
        color: '#7c3aed',
        formula: 'ΔW = 0 → ΔQ = ΔU',
        desc: 'Volume fixed. All heat changes internal energy.',
        constraint: 'V = const, ΔW = 0',
    },
    isobaric: {
        title: 'Isobaric Process',
        color: '#2563eb',
        formula: 'ΔW = PΔV',
        desc: 'Pressure constant. Heat splits into work + ΔU.',
        constraint: 'P = const',
    },
};

const ThermodynamicProcessesLab: React.FC<ThermodynamicProcessesLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    const [gasState, setGasState] = useState({ T: 400, V: 3.0 });
    const [process, setProcess] = useState<string>('');
    const [action, setAction] = useState(0.5);

    const historyRef = useRef<{ V: number; P: number; proc: string }[]>([]);
    const processRef = useRef('');
    processRef.current = process;
    const gasRef = useRef(gasState);
    gasRef.current = gasState;
    const actionRef = useRef(action);
    actionRef.current = action;
    const energyRef = useRef({ dQ: 0, dU: 0, dW: 0 });

    const reset = useCallback(() => {
        setGasState({ T: 400, V: 3.0 });
        setProcess('');
        setAction(0.5);
        historyRef.current = [];
        energyRef.current = { dQ: 0, dU: 0, dW: 0 };
    }, []);

    // Canvas auto-resize
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        const resizeObserver = new ResizeObserver(() => {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        });
        resizeObserver.observe(parent);
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        return () => resizeObserver.disconnect();
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        if (W < 10 || H < 10) { animRef.current = requestAnimationFrame(draw); return; }

        const gas = gasRef.current;
        const P_val = pressure_calc(gas.V, gas.T);
        const proc = processRef.current;
        const act = actionRef.current;
        const e = energyRef.current;

        // ─── Physics update ───
        if (proc && act !== 0.5) {
            const dir = act > 0.5 ? 1 : -1;
            const speed = Math.abs(act - 0.5) * 3; // Increased responsiveness here (from 2 to 3)
            let newV = gas.V, newT = gas.T;
            let ddQ = 0, ddU = 0, ddW = 0;

            if (proc === 'isothermal') {
                const dV = dir * 0.015 * speed;
                newV = Math.max(1.5, Math.min(8, gas.V + dV));
                ddW = pressure_calc(gas.V, gas.T) * (newV - gas.V) * 1000;
                ddQ = ddW; ddU = 0;
            } else if (proc === 'adiabatic') {
                const dV = dir * 0.015 * speed;
                newV = Math.max(1.5, Math.min(8, gas.V + dV));
                newT = gas.T * Math.pow(gas.V / newV, gamma_val - 1);
                newT = Math.max(150, Math.min(1200, newT));
                ddQ = 0; ddU = n_moles * Cv_val * (newT - gas.T); ddW = -ddU;
            } else if (proc === 'isochoric') {
                const dT = dir * 0.3 * speed;
                newT = Math.max(150, Math.min(1200, gas.T + dT));
                ddW = 0; ddU = n_moles * Cv_val * (newT - gas.T); ddQ = ddU;
            } else if (proc === 'isobaric') {
                const Pcurr = pressure_calc(gas.V, gas.T);
                const dV = dir * 0.015 * speed;
                newV = Math.max(1.5, Math.min(8, gas.V + dV));
                newT = Pcurr * newV / (n_moles * R_val);
                newT = Math.max(150, Math.min(1200, newT));
                if (newT < 150 || newT > 1200) newV = gas.V;
                ddW = Pcurr * (newV - gas.V) * 1000;
                ddU = n_moles * Cv_val * (newT - gas.T); ddQ = ddU + ddW;
            }

            if (newV !== gas.V || newT !== gas.T) {
                energyRef.current = { dQ: e.dQ + ddQ, dU: e.dU + ddU, dW: e.dW + ddW };
                setGasState({ T: newT, V: newV });
                historyRef.current.push({ V: newV, P: pressure_calc(newV, newT), proc });
            }
        }

        // ─── Clear ───
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc'; // Soft White
        ctx.fillRect(0, 0, W, H);

        const procInfo = proc ? PROCESS_INFO[proc] : null;
        const time = Date.now() * 0.001;

        // DYNAMIC VIEWPORT SCALING (Laptop vs Smartboard)
        const scale = W < 1000 ? 1.0 : (W > 1500 ? 1.3 : 1.0 + (W - 1000) * 0.0006);
        const fs = (base: number) => Math.max(10, Math.min(base * scale, W * 0.03, H * 0.045));
        const pad = Math.min(W * 0.03, H * 0.035, scale * 24);
        const halfW = (W - pad * 3) / 2;

        // ─── LEFT: GAS CYLINDER ───
        const cylPanelX = pad;
        const cylPanelY = pad * 2.5;
        const cylPanelW = halfW;
        const cylPanelH = H - pad * 3.5;

        ctx.fillStyle = '#ffffff';
        roundRect(ctx, cylPanelX, cylPanelY, cylPanelW, cylPanelH, 16); ctx.fill();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5;
        roundRect(ctx, cylPanelX, cylPanelY, cylPanelW, cylPanelH, 16); ctx.stroke();

        const cylW2 = Math.min(cylPanelW * 0.55, 240 * scale);
        const cylH2 = Math.min(cylPanelH * (H < 650 ? 0.42 : 0.52), 280 * scale);
        const cylX = cylPanelX + (cylPanelW - cylW2) / 2;
        const cylTopY = cylPanelY + cylPanelH * 0.1;

        ctx.fillStyle = '#64748b';
        ctx.font = `bold ${fs(13)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('EXPERIMENTAL GAS CYLINDER', cylPanelX + cylPanelW / 2, cylPanelY + pad * 1.1);

        const maxV = 9, minV = 1.5;
        const pistonNorm = (gas.V - minV) / (maxV - minV);
        const pistonY = cylTopY + cylH2 - 12 - pistonNorm * (cylH2 * 0.85);

        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4 * scale;
        ctx.strokeRect(cylX, cylTopY, cylW2, cylH2);

        const tempNorm = Math.max(0, Math.min(1, (gas.T - 150) / 850));
        const gR = Math.round(59 + tempNorm * 190);
        const gB = Math.round(235 - tempNorm * 180);

        const gasBg = ctx.createLinearGradient(cylX, pistonY, cylX, cylTopY + cylH2);
        gasBg.addColorStop(0, `rgba(${gR}, 60, ${gB}, 0.15)`);
        gasBg.addColorStop(1, `rgba(${gR}, 60, ${gB}, 0.35)`);
        ctx.fillStyle = gasBg;
        ctx.fillRect(cylX + 4, pistonY + 5, cylW2 - 8, cylTopY + cylH2 - pistonY - 9);

        const molSpeed = tempNorm * 4 + 0.6;
        ctx.fillStyle = `rgb(${gR}, 70, ${gB})`;
        const molCount = Math.max(10, Math.min(25, Math.round(cylW2 / 8)));
        for (let i = 0; i < molCount; i++) {
            const seed = i * 7.31;
            const gasHeight = cylTopY + cylH2 - pistonY - 20;
            if (gasHeight < 10) continue;
            const mx = cylX + 16 + ((Math.sin(time * molSpeed + seed) * 0.5 + 0.5) * (cylW2 - 32));
            const my = pistonY + 14 + ((Math.cos(time * molSpeed * 1.34 + seed * 2.17) * 0.5 + 0.5) * gasHeight);
            const molR = Math.max(3, Math.min(6, cylW2 * 0.025));
            ctx.beginPath(); ctx.arc(mx, my, molR, 0, Math.PI * 2); ctx.fill();
        }

        ctx.fillStyle = '#475569';
        ctx.fillRect(cylX + 4, pistonY - 10 * scale, cylW2 - 8, 16 * scale);
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2 * scale;
        ctx.strokeRect(cylX + 4, pistonY - 10 * scale, cylW2 - 8, 16 * scale);

        const cylCenterX = cylX + cylW2 / 2;
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 5 * scale;
        ctx.beginPath(); ctx.moveTo(cylCenterX, pistonY - 10 * scale); ctx.lineTo(cylCenterX, cylTopY - 25 * scale); ctx.stroke();
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cylCenterX - 15 * scale, cylTopY - 32 * scale, 30 * scale, 10 * scale);

        let baseColor = '#f1f5f9';   let labelColor = '#64748b';
        let baseLabel = 'READY';
        if (proc === 'isothermal') {
            baseColor = act > 0.5 ? '#dc2626' : act < 0.5 ? '#2563eb' : '#f1f5f9';
            labelColor = act === 0.5 ? '#64748b' : '#ffffff';
            baseLabel = `CONSTANT T = ${Math.round(gas.T)}K`;
        } else if (proc === 'adiabatic') {
            baseColor = '#94a3b8'; labelColor = '#ffffff'; baseLabel = 'INSULATED (dQ=0)';
        } else if (proc === 'isochoric' || proc === 'isobaric') {
            baseColor = act > 0.5 ? '#dc2626' : act < 0.5 ? '#2563eb' : '#f1f5f9';
            labelColor = act === 0.5 ? '#64748b' : '#ffffff';
            baseLabel = act > 0.5 ? 'HEATING...' : act < 0.5 ? 'COOLING...' : (proc === 'isochoric' ? 'FIXED VOLUME' : 'READY');
        }
        ctx.fillStyle = baseColor;
        roundRect(ctx, cylX - 8, cylTopY + cylH2 + 6 * scale, cylW2 + 16, 28 * scale, 8); ctx.fill();
        ctx.fillStyle = labelColor; ctx.font = `bold ${fs(12)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(baseLabel, cylCenterX, cylTopY + cylH2 + 25 * scale);

        const tempReadoutY = cylTopY + cylH2 + 60 * scale;
        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(22)}px monospace`; ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(gas.T)} K`, cylCenterX, tempReadoutY);
        ctx.fillStyle = '#94a3b8'; ctx.font = `bold ${fs(10)}px sans-serif`;
        ctx.fillText('TEMPERATURE', cylCenterX, tempReadoutY + fs(13));

        const stateY = tempReadoutY + fs(13) + 22 * scale;
        const col1P = cylPanelX + cylPanelW * 0.3;
        const col2V = cylPanelX + cylPanelW * 0.7;
        ctx.fillStyle = '#d97706'; ctx.font = `bold ${fs(18)}px monospace`;
        ctx.fillText(`${(P_val / 1000).toFixed(1)} kPa`, col1P, stateY);
        ctx.fillStyle = '#94a3b8'; ctx.font = `bold ${fs(10)}px sans-serif`;
        ctx.fillText('PRESSURE', col1P, stateY + fs(12));
        ctx.fillStyle = '#2563eb'; ctx.font = `bold ${fs(18)}px monospace`;
        ctx.fillText(`${gas.V.toFixed(2)} L`, col2V, stateY);
        ctx.fillStyle = '#94a3b8'; ctx.font = `bold ${fs(10)}px sans-serif`;
        ctx.fillText('VOLUME', col2V, stateY + fs(12));

        if (procInfo) {
            const infoY = cylPanelY + cylPanelH - pad * 2.2;
            ctx.fillStyle = procInfo.color; ctx.fillRect(cylPanelX + pad, infoY, 6, 34 * scale);
            ctx.fillStyle = procInfo.color; ctx.font = `bold ${fs(14)}px sans-serif`; ctx.textAlign = 'left';
            ctx.fillText(procInfo.title.toUpperCase(), cylPanelX + pad + 15 * scale, infoY + 12 * scale);
            ctx.fillStyle = '#334155'; ctx.font = `bold ${fs(10)}px monospace`;
            ctx.fillText(procInfo.formula, cylPanelX + pad + 15 * scale, infoY + 28 * scale);
        }

        // ─── RIGHT: P-V GRAPH ───
        const gPanelX = pad * 2 + halfW;
        const gPanelW = halfW;
        const gPanelH = H - pad * 3.5;

        ctx.fillStyle = '#ffffff';
        roundRect(ctx, gPanelX, cylPanelY, gPanelW, gPanelH, 16); ctx.fill();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5;
        roundRect(ctx, gPanelX, cylPanelY, gPanelW, gPanelH, 16); ctx.stroke();

        const gMarginL = pad * 3.2;
        const gMarginR = pad * 1.5;
        const gMarginT = pad * 2.5;
        const gMarginB = pad * 3.2;
        const gx = gPanelX + gMarginL;
        const gy = cylPanelY + gMarginT;
        const gw = gPanelW - gMarginL - gMarginR;
        const gh = gPanelH * 0.58 - gMarginT;

        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(14)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('PV INDICATOR DIAGRAM', gPanelX + gPanelW / 2, cylPanelY + pad * 1.2);

        ctx.strokeStyle = '#334155'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();

        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(13)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('Volume (V) →', gx + gw / 2, gy + gh + pad * 2);
        ctx.save(); ctx.translate(gx - pad * 2, gy + gh / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillText('Pressure (P) →', 0, 0); ctx.restore();

        const vMinPlot = 1, vMaxPlot = 9, pMinPlot = 0, pMaxPlot = 4500;
        const sv_x = (v: number) => gx + ((v - vMinPlot) / (vMaxPlot - vMinPlot)) * gw;
        const sp_y = (p: number) => gy + gh - ((p - pMinPlot) / (pMaxPlot - pMinPlot)) * gh;

        const hist_data = historyRef.current;
        if (hist_data.length > 1) {
            let prevPr = hist_data[0].proc;
            ctx.lineWidth = 4.5;
            ctx.beginPath(); ctx.moveTo(sv_x(hist_data[0].V), sp_y(hist_data[0].P));
            for (let i = 1; i < hist_data.length; i++) {
                if (hist_data[i].proc !== prevPr) {
                    ctx.strokeStyle = PROCESS_INFO[prevPr]?.color || '#cbd5e1';
                    ctx.stroke(); ctx.beginPath();
                    ctx.moveTo(sv_x(hist_data[i - 1].V), sp_y(hist_data[i - 1].P));
                    prevPr = hist_data[i].proc;
                }
                ctx.lineTo(sv_x(hist_data[i].V), sp_y(hist_data[i].P));
            }
            ctx.strokeStyle = PROCESS_INFO[prevPr]?.color || '#cbd5e1';
            ctx.stroke();
        }

        const dotC = procInfo?.color || '#94a3b8';
        ctx.fillStyle = dotC; ctx.beginPath(); ctx.arc(sv_x(gas.V), sp_y(P_val), 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(sv_x(gas.V), sp_y(P_val), 8, 0, Math.PI * 2); ctx.stroke();

        const ebY_area = gy + gh + pad * 4;
        const ebH_area = gPanelH - (ebY_area - cylPanelY) - pad;
        if (ebH_area > 80) {
            ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(15)}px sans-serif`; ctx.textAlign = 'center';
            ctx.fillText('FIRST LAW: ΔQ = ΔU + ΔW', gPanelX + gPanelW / 2, ebY_area - 15);

            const maxE_val = Math.max(Math.abs(e.dQ), Math.abs(e.dU), Math.abs(e.dW), 1) * 1.2;
            const eb_data = [
                { label: 'HEAT ΔQ', val: e.dQ, color: '#dc2626' },
                { label: 'INT. ENG ΔU', val: e.dU, color: '#d97706' },
                { label: 'WORK ΔW', val: e.dW, color: '#2563eb' },
            ];
            const bSp = Math.min(ebH_area / 3.5, 45);
            const bH = 18;
            const bFW = gPanelW * 0.55;
            const bStartX = gPanelX + gPanelW * 0.28;

            eb_data.forEach((b, i) => {
                const bY_val = ebY_area + i * bSp;
                ctx.fillStyle = '#475569'; ctx.font = `bold ${fs(12)}px sans-serif`; ctx.textAlign = 'left';
                ctx.fillText(b.label, gPanelX + pad, bY_val + bH * 0.85);

                ctx.fillStyle = '#f8fafc'; roundRect(ctx, bStartX, bY_val, bFW, bH, 5); ctx.fill();
                const fill_w = (Math.abs(b.val) / maxE_val) * (bFW / 2);
                ctx.fillStyle = b.color;
                if (b.val >= 0) roundRect(ctx, bStartX + bFW / 2, bY_val, fill_w, bH, 5);
                else roundRect(ctx, bStartX + bFW / 2 - fill_w, bY_val, fill_w, bH, 5);
                ctx.fill();

                ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(bStartX + bFW / 2, bY_val - 3); ctx.lineTo(bStartX + bFW / 2, bY_val + bH + 3); ctx.stroke();

                ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(13)}px monospace`; ctx.textAlign = 'right';
                ctx.fillText(`${b.val >= 0 ? '+' : ''}${b.val.toFixed(0)} J`, gPanelX + gPanelW - pad, bY_val + bH * 0.85);
            });
        }

        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(20)}px sans-serif`; ctx.textAlign = 'left';
        ctx.fillText('Thermodynamic Processes & The First Law', pad, pad * 1.2);

        animRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw]);

    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="flex flex-col gap-2 md:gap-4 w-full text-slate-700 p-1 md:p-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {Object.entries(PROCESS_INFO).map(([key, info]) => (
                    <button
                        key={key}
                        onClick={() => {
                            setProcess(key); setAction(0.5);
                            energyRef.current = { dQ: 0, dU: 0, dW: 0 };
                            historyRef.current = [];
                        }}
                        className={`p-2 md:p-4 rounded-xl border-2 font-bold text-xs md:text-sm lg:text-base transition-all shadow-md active:scale-95 ${
                            process === key
                                ? 'text-white border-transparent'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                        style={process === key ? { backgroundColor: info.color } : {}}
                    >
                        {info.title.replace(' Process', '').toUpperCase()}
                    </button>
                ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 mt-1 md:mt-2">
                <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-0.5 md:mb-1">
                        <span className="text-blue-700 font-bold uppercase tracking-tight text-[10px] md:text-xs">
                          {process === 'isochoric' ? '← cool' : '← compress'}
                        </span>
                        <span className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2">Control</span>
                        <span className="text-red-700 font-bold uppercase tracking-tight text-[10px] md:text-xs">
                          {process === 'isochoric' ? 'heat →' : 'expand →'}
                        </span>
                    </label>
                    <input type="range" min="0" max="1" step="0.01" value={action}
                        onChange={(e) => setAction(Number(e.target.value))}
                        onPointerUp={() => setAction(0.5)}
                        onPointerLeave={() => setAction(0.5)}
                        onPointerCancel={() => setAction(0.5)}
                        disabled={!process}
                        className="w-full h-3 md:h-4 rounded-lg bg-slate-200 appearance-none cursor-pointer disabled:opacity-50" />
                    <div className="text-center text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {!process ? 'Select a process to start' : 'Hold and slide to execute'}
                    </div>
                </div>
                <div className="flex items-center justify-center">
                    <button onClick={reset}
                        className="flex items-center justify-center gap-2 md:gap-3 w-full md:w-auto px-6 lg:px-12 py-3 lg:py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-all font-bold text-xs md:text-sm lg:text-lg shadow-sm active:scale-95">
                        <RotateCcw size={18} className="md:w-5 md:h-5 lg:w-6 lg:h-6" /> RESET SYSTEM
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer topic={topic} onExit={onExit}
            SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />
    );
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

export default ThermodynamicProcessesLab;
