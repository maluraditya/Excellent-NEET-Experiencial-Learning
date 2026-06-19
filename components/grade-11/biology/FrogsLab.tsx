import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Brain,
    Droplets,
    FlaskConical,
    Heart,
    Layers,
    Mars,
    Microscope,
    Pause,
    Play,
    RotateCcw,
    Tag,
    Venus,
    VenusAndMars,
    Wind,
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type SystemView =
    | 'Digestive'
    | 'Respiratory'
    | 'Circulatory'
    | 'Excretory'
    | 'Nervous'
    | 'Reproductive';
type AnatomyView = 'External' | 'Internal';
type EnvironmentMode = 'Land' | 'Water' | 'Aestivation';
type SexMode = 'Male' | 'Female';
type BrainRegion = 'Fore' | 'Mid' | 'Hind' | 'All';

interface FrogsLabProps {
    topic: any;
    onExit: () => void;
}

const SYSTEM_COLORS: Record<SystemView, string> = {
    Digestive: '#d97706',
    Respiratory: '#0284c7',
    Circulatory: '#dc2626',
    Excretory: '#7c3aed',
    Nervous: '#475569',
    Reproductive: '#059669',
};

const SYSTEM_ICONS: Record<SystemView, React.ReactNode> = {
    Digestive: <FlaskConical size={13} />,
    Respiratory: <Wind size={13} />,
    Circulatory: <Heart size={13} />,
    Excretory: <Droplets size={13} />,
    Nervous: <Brain size={13} />,
    Reproductive: <VenusAndMars size={13} />,
};

const DIGEST_STEPS = [
    { id: 0, name: 'Idle', narration: 'Press Play to release a fly. NCERT: alimentary canal of carnivorous frog is short with reduced intestine.' },
    { id: 1, name: 'Capture', narration: 'The bilobed muscular tongue flicks out and captures the prey into the buccal cavity. (NCERT Pg 81)' },
    { id: 2, name: 'Pharynx', narration: 'Food crosses the pharynx and the short oesophagus toward the stomach.' },
    { id: 3, name: 'Stomach', narration: 'HCl + gastric juice from stomach walls digest food into a paste called chyme. (NCERT Pg 82)' },
    { id: 4, name: 'Duodenum', narration: 'Chyme enters the duodenum. Bile (gall bladder) emulsifies fat; pancreatic juice digests carbohydrates and proteins via a common bile duct.' },
    { id: 5, name: 'Intestine', narration: 'Final digestion. Digested food absorbed by finger-like villi and microvilli of the intestinal wall.' },
    { id: 6, name: 'Cloaca', narration: 'Undigested waste enters the rectum and is voided through the cloaca — common chamber for faeces, urine, and gametes.' },
];

const FrogsLab: React.FC<FrogsLabProps> = ({ topic, onExit }) => {
    const [anatomy, setAnatomy] = useState<AnatomyView>('Internal');
    const [systemView, setSystemView] = useState<SystemView>('Digestive');
    const [environment, setEnvironment] = useState<EnvironmentMode>('Land');
    const [sex, setSex] = useState<SexMode>('Male');
    const [brainRegion, setBrainRegion] = useState<BrainRegion>('All');
    const [showEndocrine, setShowEndocrine] = useState(false);
    const [showLymphatic, setShowLymphatic] = useState(false);
    const [showLabels, setShowLabels] = useState(true);
    const [playing, setPlaying] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [digestStep, setDigestStep] = useState(0);
    const [digestProgress, setDigestProgress] = useState(0);
    const [breathPhase, setBreathPhase] = useState(0);
    const [bloodPhase, setBloodPhase] = useState(0);
    const [ovaLaid, setOvaLaid] = useState(0);
    const [tadpoleStage, setTadpoleStage] = useState(0);
    const rafRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);

    useEffect(() => {
        const tick = (t: number) => {
            const last = lastTimeRef.current || t;
            let dt = (t - last) / 1000;
            lastTimeRef.current = t;
            if (dt > 0.1) dt = 0.1;
            if (playing) {
                const k = speed;
                setBreathPhase((p) => (p + dt * 1.6 * k) % (Math.PI * 2));
                setBloodPhase((p) => (p + dt * 0.45 * k) % 1);
                if (systemView === 'Digestive') {
                    setDigestProgress((p) => {
                        let next = p + dt * 0.22 * k;
                        if (next >= 1) {
                            next = 0;
                            setDigestStep((s) => (s >= DIGEST_STEPS.length - 1 ? 1 : s + 1));
                        }
                        return next;
                    });
                }
                if (systemView === 'Reproductive' && sex === 'Female') {
                    setOvaLaid((n) => Math.min(3000, n + dt * 220 * k));
                    setTadpoleStage((s) => (s + dt * 0.18 * k) % 4);
                }
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            lastTimeRef.current = 0;
        };
    }, [playing, speed, systemView, sex]);

    const resetLab = useCallback(() => {
        setAnatomy('Internal');
        setSystemView('Digestive');
        setEnvironment('Land');
        setSex('Male');
        setBrainRegion('All');
        setShowEndocrine(false);
        setShowLymphatic(false);
        setShowLabels(true);
        setPlaying(true);
        setSpeed(1);
        setDigestStep(0);
        setDigestProgress(0);
        setOvaLaid(0);
        setTadpoleStage(0);
    }, []);

    const respirationLabel = useMemo(() => {
        if (environment === 'Water') return 'Cutaneous only';
        if (environment === 'Aestivation') return 'Skin only (dormant)';
        return 'Buccal · Skin · Lungs';
    }, [environment]);

    const liveNarration = useMemo(() => {
        if (anatomy === 'External')
            return 'External features (NCERT Pg 81 · Fig 7.1): smooth slippery moist skin, dorsal olive-green with dark spots, ventral pale yellow. Body = head + trunk (no neck, no tail). Nictitating membrane protects eyes in water; tympanum receives sound. Forelimbs end in 4 digits; hind limbs in 5 webbed digits.';
        if (systemView === 'Digestive') return DIGEST_STEPS[digestStep].narration;
        if (systemView === 'Respiratory') {
            if (environment === 'Water')
                return 'In water the highly vascularised, moist skin acts as the aquatic respiratory organ. Dissolved O₂ diffuses through the skin into capillaries.';
            if (environment === 'Aestivation')
                return 'During aestivation (hot/dry) and hibernation (cold), gas exchange occurs solely through the moist skin. Lungs are inactive.';
            return 'On land all three respiratory organs operate: buccal cavity, moist vascular skin, and a pair of pink sac-like lungs in the thorax. Air path: nostrils → buccal cavity → lungs.';
        }
        if (systemView === 'Circulatory')
            return 'Closed, single circulation. Vena cava → sinus venosus → right atrium; lung/skin blood → left atrium. Both atria empty into the single ventricle where oxygenated & deoxygenated blood mix, then exit via the ventral conus arteriosus. Hepatic & renal portal systems route blood through liver and kidneys.';
        if (systemView === 'Excretory')
            return 'A pair of bean-shaped kidneys filter blood; nephrons produce urea — frog is ureotelic. In ♂ the ureter doubles as the urinogenital duct; in ♀, ureter and oviduct open separately into the cloaca. Urinary bladder lies ventral to the rectum.';
        if (systemView === 'Nervous')
            return 'CNS = brain + spinal cord. Fore-brain (olfactory lobes, paired cerebral hemispheres, diencephalon) · Mid-brain (paired optic lobes) · Hind-brain (cerebellum + medulla oblongata → foramen magnum → spinal cord). 10 pairs of cranial nerves. PNS = cranial + spinal nerves. ANS = sympathetic + parasympathetic.';
        if (sex === 'Male')
            return 'Male: a pair of yellowish ovoid testes attached to the upper kidneys by mesorchium (peritoneal fold). 10–12 vasa efferentia enter the kidney and open into Bidder’s canal → urinogenital duct → cloaca. Sperms shed into water; fertilisation is external.';
        return 'Female: a pair of ovaries near the kidneys with no functional connection. Paired oviducts open separately into the cloaca. A mature female lays 2 500–3 000 ova at a time. Eggs hatch into tadpoles that metamorphose into adults.';
    }, [anatomy, systemView, digestStep, environment, sex]);

    // ───── Left aside: NCERT figure thumbnails ─────
    const graphPanel = (
        <aside
            className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20
                       hidden w-[340px] 2xl:block overflow-y-auto pr-1"
        >
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">NCERT Fig 7.1</div>
                    <div className="text-xs font-semibold text-slate-500">External features of <i>Rana tigrina</i> · dorsal view</div>
                    <img
                        src="/images/11th-biology/frog-dissection.jpg"
                        alt="NCERT Fig 7.1 — dissected frog (Rana tigrina) showing in-situ organs"
                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white object-contain"
                    />
                    <svg viewBox="0 0 320 360" className="mt-2 w-full" style={{ display: 'none' }}>
                        {/* ── Body silhouette: head + trunk fused, no neck, no tail ── */}
                        <defs>
                            <radialGradient id="frogSkin" cx="50%" cy="35%" r="65%">
                                <stop offset="0%" stopColor="#a3d650" />
                                <stop offset="60%" stopColor="#7cba32" />
                                <stop offset="100%" stopColor="#4d7c0f" />
                            </radialGradient>
                        </defs>
                        <path
                            d="M160 28
                               C 128 28, 100 40, 88 64
                               C 78 80, 76 96, 82 110
                               C 70 130, 62 168, 80 206
                               C 96 240, 128 252, 160 252
                               C 192 252, 224 240, 240 206
                               C 258 168, 250 130, 238 110
                               C 244 96, 242 80, 232 64
                               C 220 40, 192 28, 160 28 Z"
                            fill="url(#frogSkin)"
                            stroke="#365314"
                            strokeWidth="2"
                        />
                        {/* dorsal spots */}
                        {[
                            [128, 138, 6], [186, 152, 5], [156, 178, 5],
                            [110, 108, 4], [212, 116, 4], [142, 218, 4.5],
                            [180, 226, 4], [122, 188, 4]
                        ].map(([x, y, r], i) => (
                            <circle key={i} cx={x} cy={y} r={r} fill="#3f6212" opacity="0.55" />
                        ))}
                        {/* mid-dorsal line (faint) */}
                        <path d="M160 60 Q 158 140 160 240" stroke="#3f6212" strokeWidth="0.6" fill="none" opacity="0.4" />

                        {/* ── Eye domes (bulging, dorsal) ── */}
                        <ellipse cx="132" cy="60" rx="14" ry="11" fill="#7cba32" stroke="#365314" strokeWidth="1.5" />
                        <ellipse cx="188" cy="60" rx="14" ry="11" fill="#7cba32" stroke="#365314" strokeWidth="1.5" />
                        {/* sclera */}
                        <ellipse cx="132" cy="58" rx="9" ry="7.5" fill="#fef3c7" stroke="#365314" strokeWidth="0.8" />
                        <ellipse cx="188" cy="58" rx="9" ry="7.5" fill="#fef3c7" stroke="#365314" strokeWidth="0.8" />
                        {/* iris */}
                        <ellipse cx="132" cy="58" rx="6" ry="5.5" fill="#d97706" />
                        <ellipse cx="188" cy="58" rx="6" ry="5.5" fill="#d97706" />
                        {/* pupil */}
                        <ellipse cx="132" cy="58" rx="2.5" ry="4.5" fill="#0f172a" />
                        <ellipse cx="188" cy="58" rx="2.5" ry="4.5" fill="#0f172a" />
                        {/* highlight */}
                        <circle cx="130" cy="55" r="1.2" fill="white" />
                        <circle cx="186" cy="55" r="1.2" fill="white" />
                        {/* nictitating-membrane edge hint */}
                        <path d="M124 58 Q132 64 140 58" stroke="#65a30d" strokeWidth="0.8" fill="none" opacity="0.6" />
                        <path d="M180 58 Q188 64 196 58" stroke="#65a30d" strokeWidth="0.8" fill="none" opacity="0.6" />

                        {/* ── External nostrils ── */}
                        <ellipse cx="152" cy="44" rx="1.6" ry="2.2" fill="#0f172a" />
                        <ellipse cx="168" cy="44" rx="1.6" ry="2.2" fill="#0f172a" />

                        {/* ── Mouth: wide curve across the snout ── */}
                        <path d="M112 74 Q 140 86 160 82 Q 180 86 208 74" stroke="#365314" strokeWidth="1.8" fill="none" strokeLinecap="round" />

                        {/* ── Tympanum (eardrum) behind each eye ── */}
                        <circle cx="108" cy="78" r="7" fill="#7cba32" stroke="#365314" strokeWidth="1.5" />
                        <circle cx="108" cy="78" r="4.5" fill="#78350f" />
                        <circle cx="108" cy="78" r="2" fill="#451a03" />
                        <circle cx="212" cy="78" r="7" fill="#7cba32" stroke="#365314" strokeWidth="1.5" />
                        <circle cx="212" cy="78" r="4.5" fill="#78350f" />
                        <circle cx="212" cy="78" r="2" fill="#451a03" />

                        {/* ── Forelimbs (short, 4 digits, NOT webbed) ── */}
                        <path d="M86 116 q -22 -4 -38 -18" stroke="#365314" strokeWidth="3" fill="none" strokeLinecap="round" />
                        <path d="M234 116 q 22 -4 38 -18" stroke="#365314" strokeWidth="3" fill="none" strokeLinecap="round" />
                        {/* digits on each forelimb — 4 each */}
                        <g stroke="#365314" strokeWidth="1.4" fill="none" strokeLinecap="round">
                            <path d="M48 98 l -5 -5" />
                            <path d="M50 100 l -7 -3" />
                            <path d="M52 102 l -7 0" />
                            <path d="M54 104 l -6 3" />
                            <path d="M272 98 l 5 -5" />
                            <path d="M270 100 l 7 -3" />
                            <path d="M268 102 l 7 0" />
                            <path d="M266 104 l 6 3" />
                        </g>

                        {/* ── Hind limbs (long, 5 digits, fully webbed) ── */}
                        <path d="M88 220 q -22 18 -42 46" stroke="#365314" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                        <path d="M232 220 q 22 18 42 46" stroke="#365314" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                        {/* webbing fan (translucent) */}
                        <path d="M40 270 Q 50 286 78 286 Q 64 282 56 274 Z" fill="#84cc16" opacity="0.55" stroke="#365314" strokeWidth="0.8" />
                        <path d="M280 270 Q 270 286 242 286 Q 256 282 264 274 Z" fill="#84cc16" opacity="0.55" stroke="#365314" strokeWidth="0.8" />
                        {/* digit lines — 5 per foot */}
                        <g stroke="#365314" strokeWidth="1.5" fill="none" strokeLinecap="round">
                            <path d="M46 268 l -4 -12" />
                            <path d="M50 272 l -2 -14" />
                            <path d="M54 274 l 1 -14" />
                            <path d="M58 274 l 4 -13" />
                            <path d="M62 272 l 6 -12" />
                            <path d="M274 268 l 4 -12" />
                            <path d="M270 272 l 2 -14" />
                            <path d="M266 274 l -1 -14" />
                            <path d="M262 274 l -4 -13" />
                            <path d="M258 272 l -6 -12" />
                        </g>

                        {/* ── Leader lines + labels (NCERT-style) ── */}
                        <g fontFamily="ui-sans-serif, system-ui" fontSize="9" fontWeight="700" fill="#1e293b">
                            {/* eye */}
                            <line x1="118" y1="58" x2="60" y2="40" stroke="#94a3b8" strokeWidth="0.8" />
                            <text x="6" y="42">eye</text>
                            {/* nostril */}
                            <line x1="150" y1="44" x2="100" y2="20" stroke="#94a3b8" strokeWidth="0.8" />
                            <text x="60" y="18">external nostril</text>
                            {/* tympanum */}
                            <line x1="100" y1="78" x2="58" y2="86" stroke="#94a3b8" strokeWidth="0.8" />
                            <text x="6" y="88">tympanum</text>
                            {/* mouth */}
                            <line x1="120" y1="80" x2="60" y2="116" stroke="#94a3b8" strokeWidth="0.8" />
                            <text x="6" y="118">mouth</text>
                            {/* forelimb (right side) */}
                            <line x1="245" y1="108" x2="304" y2="80" stroke="#94a3b8" strokeWidth="0.8" />
                            <text x="240" y="76" textAnchor="start">forelimb · 4 digits</text>
                            {/* trunk */}
                            <line x1="232" y1="160" x2="306" y2="160" stroke="#94a3b8" strokeWidth="0.8" />
                            <text x="278" y="162">trunk</text>
                            {/* head */}
                            <line x1="124" y1="46" x2="40" y2="56" stroke="#94a3b8" strokeWidth="0.8" />
                            <text x="6" y="58" style={{ display: 'none' }}>head</text>
                            {/* dorsal skin */}
                            <line x1="186" y1="130" x2="298" y2="120" stroke="#94a3b8" strokeWidth="0.8" />
                            <text x="244" y="122">dorsal skin</text>
                            {/* hind limb (right) */}
                            <line x1="252" y1="244" x2="312" y2="232" stroke="#94a3b8" strokeWidth="0.8" />
                            <text x="232" y="234" textAnchor="start">hind limb</text>
                            {/* webbed digits */}
                            <line x1="270" y1="278" x2="312" y2="294" stroke="#94a3b8" strokeWidth="0.8" />
                            <text x="232" y="296" textAnchor="start">5 webbed digits</text>
                            {/* cloacal aperture hint (rear) */}
                            <line x1="160" y1="250" x2="60" y2="260" stroke="#94a3b8" strokeWidth="0.8" />
                            <text x="6" y="262">cloacal aperture</text>
                        </g>

                        {/* scale bar */}
                        <g transform="translate(120, 332)">
                            <line x1="0" y1="0" x2="80" y2="0" stroke="#0f172a" strokeWidth="1.4" />
                            <line x1="0" y1="-4" x2="0" y2="4" stroke="#0f172a" strokeWidth="1.4" />
                            <line x1="80" y1="-4" x2="80" y2="4" stroke="#0f172a" strokeWidth="1.4" />
                            <text x="40" y="18" textAnchor="middle" fontSize="9" fontWeight="700" fill="#475569">~ 5 cm</text>
                        </g>
                    </svg>
                    <div className="mt-2 text-[11px] text-slate-600 leading-snug">
                        Body = <strong>head + trunk</strong> (no neck, no tail). Dorsal skin olive-green with dark spots; ventral skin pale yellow. <strong>Forelimbs:</strong> 4 unwebbed digits. <strong>Hind limbs:</strong> 5 fully webbed digits, longer and muscular for leaping/swimming.
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">NCERT Fig 7.2</div>
                    <div className="text-xs font-semibold text-slate-500">internal organs · ventral view</div>
                    <svg viewBox="0 0 300 200" className="mt-2 w-full">
                        <rect x="100" y="20" width="100" height="160" rx="50" fill="#fde68a" stroke="#92400e" strokeWidth="2" />
                        <ellipse cx="135" cy="50" rx="10" ry="22" fill="#fb7185" />
                        <ellipse cx="165" cy="50" rx="10" ry="22" fill="#fb7185" />
                        <path d="M150 70 L140 80 L160 80 Z" fill="#dc2626" />
                        <ellipse cx="130" cy="90" rx="16" ry="10" fill="#7c2d12" />
                        <ellipse cx="160" cy="100" rx="14" ry="10" fill="#fbbf24" />
                        <path d="M155 110 C175 120 165 145 140 145 C120 145 130 165 155 165" stroke="#c2410c" strokeWidth="6" fill="none" />
                        <circle cx="150" cy="175" r="4" fill="#78350f" />
                        <text x="220" y="50" fontSize="9" fontWeight="700" fill="#7f1d1d">lungs</text>
                        <text x="220" y="72" fontSize="9" fontWeight="700" fill="#dc2626">heart</text>
                        <text x="20" y="92" fontSize="9" fontWeight="700" fill="#5c1f08">liver</text>
                        <text x="220" y="100" fontSize="9" fontWeight="700" fill="#92400e">stomach</text>
                        <text x="220" y="135" fontSize="9" fontWeight="700" fill="#9a3412">intestine</text>
                        <text x="170" y="183" fontSize="9" fontWeight="700" fill="#78350f">cloaca</text>
                    </svg>
                    <div className="mt-2 text-[11px] text-slate-600 leading-snug">
                        Single body cavity holds digestive, circulatory, respiratory, excretory, reproductive systems.
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">{sex === 'Male' ? 'NCERT Fig 7.3' : 'NCERT Fig 7.4'}</div>
                    <div className="text-xs font-semibold text-slate-500">
                        {sex === 'Male' ? 'male reproductive system' : 'female reproductive system'}
                    </div>
                    <svg viewBox="0 0 300 170" className="mt-2 w-full">
                        {sex === 'Male' ? (
                            <>
                                <ellipse cx="120" cy="60" rx="14" ry="22" fill="#fde047" stroke="#a16207" strokeWidth="2" />
                                <ellipse cx="180" cy="60" rx="14" ry="22" fill="#fde047" stroke="#a16207" strokeWidth="2" />
                                <path d="M120 85 L130 110 L150 130" stroke="#10b981" strokeWidth="3" fill="none" />
                                <path d="M180 85 L170 110 L150 130" stroke="#10b981" strokeWidth="3" fill="none" />
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <line key={i} x1={130 + i} y1={60 + i * 2} x2={140 + i} y2={90 + i * 2} stroke="#059669" strokeWidth="1" />
                                ))}
                                <circle cx="150" cy="142" r="6" fill="#065f46" />
                                <text x="20" y="64" fontSize="9" fontWeight="700" fill="#a16207">testis</text>
                                <text x="220" y="64" fontSize="9" fontWeight="700" fill="#a16207">testis</text>
                                <text x="20" y="115" fontSize="9" fontWeight="700" fill="#059669">vasa efferentia</text>
                                <text x="180" y="160" fontSize="9" fontWeight="700" fill="#065f46">cloaca</text>
                            </>
                        ) : (
                            <>
                                <ellipse cx="115" cy="65" rx="22" ry="30" fill="#bbf7d0" stroke="#15803d" strokeWidth="2" />
                                <ellipse cx="185" cy="65" rx="22" ry="30" fill="#bbf7d0" stroke="#15803d" strokeWidth="2" />
                                {[[105,55],[120,55],[112,72],[125,72],[195,55],[180,55],[188,72],[175,72]].map(([x,y],i) => (
                                    <circle key={i} cx={x} cy={y} r="3.5" fill="#fef08a" stroke="#a16207" />
                                ))}
                                <path d="M100 95 C85 115 120 140 150 142" stroke="#22c55e" strokeWidth="3" fill="none" />
                                <path d="M200 95 C215 115 180 140 150 142" stroke="#22c55e" strokeWidth="3" fill="none" />
                                <circle cx="150" cy="142" r="6" fill="#065f46" />
                                <text x="20" y="68" fontSize="9" fontWeight="700" fill="#15803d">ovary</text>
                                <text x="220" y="68" fontSize="9" fontWeight="700" fill="#15803d">ovary</text>
                                <text x="20" y="120" fontSize="9" fontWeight="700" fill="#16a34a">oviduct</text>
                                <text x="180" y="160" fontSize="9" fontWeight="700" fill="#065f46">cloaca</text>
                            </>
                        )}
                    </svg>
                    <div className="mt-2 text-[11px] text-slate-600 leading-snug">
                        {sex === 'Male'
                            ? '10–12 vasa efferentia → Bidder’s canal → urinogenital duct → cloaca.'
                            : 'Ovaries near kidneys (no connection). Oviducts open separately. 2 500–3 000 ova / clutch.'}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">3-chambered heart</div>
                    <div className="text-xs font-semibold text-slate-500">2 atria + 1 ventricle (single circulation)</div>
                    <svg viewBox="0 0 300 130" className="mt-2 w-full">
                        <ellipse cx="100" cy="50" rx="36" ry="26" fill="#bfdbfe" stroke="#1e3a8a" strokeWidth="2" />
                        <ellipse cx="200" cy="50" rx="36" ry="26" fill="#fecaca" stroke="#991b1b" strokeWidth="2" />
                        <path d="M70 70 Q150 110 230 70 Q220 120 150 122 Q80 120 70 70Z" fill="#a855f7" stroke="#581c87" strokeWidth="2" />
                        <text x="100" y="55" textAnchor="middle" fontSize="11" fontWeight="900" fill="#1e3a8a">RA</text>
                        <text x="200" y="55" textAnchor="middle" fontSize="11" fontWeight="900" fill="#991b1b">LA</text>
                        <text x="150" y="105" textAnchor="middle" fontSize="11" fontWeight="900" fill="white">Ventricle (mixed)</text>
                    </svg>
                    <div className="mt-2 text-[11px] text-slate-600 leading-snug">
                        Sinus venosus → RA · pulmonary/cutaneous → LA · single ventricle mixes blood → conus arteriosus.
                    </div>
                </div>
            </div>
        </aside>
    );

    // ───── Right aside: Theory card + Real-time values ─────
    const valuesPanel = (
        <aside
            className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20
                       hidden w-[310px] 2xl:block overflow-y-auto pl-1"
        >
            <div className="flex flex-col gap-3">
                {/* Theory card */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-emerald-900">
                        {anatomy === 'External' ? 'External features' : `${systemView} system`}
                    </div>
                    <div className="text-xs font-semibold text-emerald-700">
                        NCERT Class 11 · Ch 7 · §7.2 · Figs 7.1–7.4
                    </div>
                    <p className="mt-2 text-sm leading-snug text-emerald-900">{liveNarration}</p>
                    <div className="mt-3 border-t border-emerald-200 pt-2">
                        <div className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 mb-1">
                            NCERT pinpoints
                        </div>
                        <NCERTFacts systemView={systemView} sex={sex} anatomy={anatomy} />
                    </div>
                </div>

                {/* Real-time values card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-base font-extrabold text-slate-900">Real-time values</div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            LIVE
                        </span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <ValueRow label="Species" value="Rana tigrina" tint="bg-emerald-50" tone="text-emerald-700" italic />
                        <ValueRow label="Heart" value="3 chambers (2A + 1V)" tint="bg-rose-50" tone="text-rose-700" />
                        <ValueRow label="Circulation" value="Closed · single · mixed" tint="bg-amber-50" tone="text-amber-700" />
                        <ValueRow label="Respiration" value={respirationLabel} tint="bg-sky-50" tone="text-sky-700" />
                        <ValueRow label="Excretion" value="Ureotelic (urea)" tint="bg-violet-50" tone="text-violet-700" />
                        <ValueRow
                            label={sex === 'Female' ? 'Ova / clutch' : 'Vasa efferentia'}
                            value={sex === 'Female' ? `${Math.round(ovaLaid).toLocaleString()} / 3 000` : '10 – 12 per testis'}
                            tint="bg-emerald-50"
                            tone="text-emerald-700"
                        />
                        {systemView === 'Digestive' && (
                            <ValueRow
                                label="Digestive stage"
                                value={DIGEST_STEPS[digestStep].name}
                                tint="bg-amber-50"
                                tone="text-amber-700"
                            />
                        )}
                        {systemView === 'Nervous' && (
                            <ValueRow
                                label="Cranial nerves"
                                value="10 pairs"
                                tint="bg-slate-50"
                                tone="text-slate-700"
                            />
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );

    // ───── Simulation: canvas-only stage ─────
    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <svg
                    viewBox="0 0 1280 760"
                    className="absolute inset-0 h-full w-full"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <FrogStageDefs />
                    <Environment env={environment} />

                    {/* Centerpiece — the huge frog */}
                    <g transform="translate(640 400)">
                        <FrogBody
                            environment={environment}
                            anatomy={anatomy}
                            systemView={systemView}
                            sex={sex}
                        />
                        {anatomy === 'External' ? (
                            <ExternalOverlay sex={sex} showLabels={showLabels} />
                        ) : (
                            <>
                                <DigestiveLayer
                                    active={systemView === 'Digestive'}
                                    step={digestStep}
                                    progress={digestProgress}
                                    showLabels={showLabels}
                                />
                                <RespiratoryLayer
                                    active={systemView === 'Respiratory'}
                                    env={environment}
                                    phase={breathPhase}
                                    showLabels={showLabels}
                                />
                                <CirculatoryLayer
                                    active={systemView === 'Circulatory'}
                                    phase={bloodPhase}
                                    showLymphatic={showLymphatic}
                                    showLabels={showLabels}
                                />
                                <ExcretoryLayer
                                    active={systemView === 'Excretory'}
                                    sex={sex}
                                    phase={bloodPhase}
                                    showLabels={showLabels}
                                />
                                <NervousLayer
                                    active={systemView === 'Nervous'}
                                    region={brainRegion}
                                    showEndocrine={showEndocrine}
                                    showLabels={showLabels}
                                />
                                <ReproductiveLayer
                                    active={systemView === 'Reproductive'}
                                    sex={sex}
                                    showLabels={showLabels}
                                    tadpoleStage={tadpoleStage}
                                />
                            </>
                        )}
                    </g>

                    {/* Short canvas labels (allowed by standard) */}
                    <text x="40" y="48" fontSize="22" fontWeight="900" fill="#0f172a" fontStyle="italic">
                        Rana tigrina
                    </text>
                    <text x="40" y="68" fontSize="12" fontWeight="700" fill="#64748b">
                        {anatomy === 'External' ? 'External · ventral view' : `${systemView} system · ventral view`}
                    </text>
                </svg>

                {/* Pause / Play / Reset — canvas top-right only */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                    <button
                        onClick={() => setPlaying((p) => !p)}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
                        title={playing ? 'Pause' : 'Play'}
                    >
                        {playing ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button
                        onClick={resetLab}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Reset"
                    >
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    // ───── Controls (bottom strip) ─────
    const controlsCombo = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-h-[36vh] overflow-y-auto">
            <div className="p-4 grid grid-cols-12 gap-4">
                <div className="col-span-12 flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-2">
                    <Microscope size={16} className="text-emerald-700" />
                    Frog Anatomy Bench
                </div>
                <div className="col-span-12 lg:col-span-2">
                    <SectionLabel icon={<Tag size={12} />}>View</SectionLabel>
                    <div className="grid grid-cols-2 gap-1.5">
                        {(['External', 'Internal'] as AnatomyView[]).map((v) => (
                            <button
                                key={v}
                                onClick={() => setAnatomy(v)}
                                className={`rounded-lg text-[11px] font-bold py-2 transition ${
                                    anatomy === v
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
                                }`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4">
                    <SectionLabel icon={<Layers size={12} />}>Organ system</SectionLabel>
                    {/* organ system buttons unchanged below */}
                    <div className="grid grid-cols-3 gap-1.5">
                        {(Object.keys(SYSTEM_COLORS) as SystemView[]).map((s) => (
                            <button
                                key={s}
                                onClick={() => setSystemView(s)}
                                className={`rounded-lg px-2 py-2 text-[11px] font-bold flex items-center justify-center gap-1.5 border transition ${
                                    systemView === s
                                        ? 'text-white border-transparent shadow-sm'
                                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                }`}
                                style={
                                    systemView === s
                                        ? { backgroundColor: SYSTEM_COLORS[s] }
                                        : undefined
                                }
                            >
                                {SYSTEM_ICONS[s]}
                                {s}
                            </button>
                        ))}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                        <button
                            onClick={() => setShowLymphatic((p) => !p)}
                            disabled={systemView !== 'Circulatory'}
                            className={`rounded-lg py-2 text-[11px] font-bold border transition ${
                                systemView !== 'Circulatory'
                                    ? 'opacity-40 cursor-not-allowed bg-white border-slate-200 text-slate-500'
                                    : showLymphatic
                                    ? 'bg-teal-600 text-white border-teal-600'
                                    : 'bg-white text-teal-700 border-teal-300'
                            }`}
                        >
                            Lymphatic: {showLymphatic ? 'ON' : 'OFF'}
                        </button>
                        <button
                            onClick={() => setShowEndocrine((p) => !p)}
                            disabled={systemView !== 'Nervous'}
                            className={`rounded-lg py-2 text-[11px] font-bold border transition ${
                                systemView !== 'Nervous'
                                    ? 'opacity-40 cursor-not-allowed bg-white border-slate-200 text-slate-500'
                                    : showEndocrine
                                    ? 'bg-pink-600 text-white border-pink-600'
                                    : 'bg-white text-pink-700 border-pink-300'
                            }`}
                        >
                            Endocrine: {showEndocrine ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-3">
                    <div>
                        <SectionLabel icon={<Wind size={12} />}>Environment</SectionLabel>
                        <div className="grid grid-cols-3 gap-1.5">
                            {(['Land', 'Water', 'Aestivation'] as EnvironmentMode[]).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setEnvironment(m)}
                                    className={`rounded-lg py-2 text-[11px] font-bold border transition ${
                                        environment === m
                                            ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300'
                                    }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>

                        <SectionLabel className="mt-3" icon={<VenusAndMars size={12} />}>
                            Sex
                        </SectionLabel>
                        <div className="grid grid-cols-2 gap-1.5">
                            {(['Male', 'Female'] as SexMode[]).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setSex(m)}
                                    className={`rounded-lg py-2 text-[11px] font-bold border transition flex items-center justify-center gap-1.5 ${
                                        sex === m
                                            ? m === 'Male'
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-pink-600 text-white border-pink-600'
                                            : 'bg-white text-slate-700 border-slate-200'
                                    }`}
                                >
                                    {m === 'Male' ? <Mars size={12} /> : <Venus size={12} />}
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <SectionLabel icon={<Brain size={12} />}>Brain region</SectionLabel>
                        <div className="grid grid-cols-2 gap-1.5">
                            {(['All', 'Fore', 'Mid', 'Hind'] as BrainRegion[]).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setBrainRegion(r)}
                                    disabled={systemView !== 'Nervous'}
                                    className={`rounded-lg py-2 text-[11px] font-bold border transition ${
                                        systemView !== 'Nervous'
                                            ? 'opacity-40 cursor-not-allowed bg-white border-slate-200 text-slate-500'
                                            : brainRegion === r
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-700 border-slate-200'
                                    }`}
                                >
                                    {r}-brain
                                </button>
                            ))}
                        </div>

                        <SectionLabel className="mt-3" icon={<Tag size={12} />}>
                            Display
                        </SectionLabel>
                        <button
                            onClick={() => setShowLabels((p) => !p)}
                            className={`w-full rounded-lg py-2 text-[11px] font-bold border transition ${
                                showLabels
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-700 border-slate-200'
                            }`}
                        >
                            Anatomical labels: {showLabels ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>

                {systemView === 'Digestive' && anatomy === 'Internal' && (
                    <div className="col-span-12 grid grid-cols-12 gap-3 items-center pt-1 border-t border-slate-100">
                        <div className="col-span-12 lg:col-span-9">
                            <SectionLabel icon={<FlaskConical size={12} />}>
                                Digestive playback · {DIGEST_STEPS[digestStep].name}
                            </SectionLabel>
                            <div className="grid grid-cols-7 gap-1">
                                {DIGEST_STEPS.map((s, i) => (
                                    <button
                                        key={s.id}
                                        onClick={() => {
                                            setDigestStep(i);
                                            setDigestProgress(0);
                                        }}
                                        className={`rounded px-1 py-1 text-[9.5px] font-bold border transition ${
                                            digestStep === i
                                                ? 'bg-amber-500 text-white border-amber-500'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                                        }`}
                                    >
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="col-span-12 lg:col-span-3">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase mb-1">
                                <span>Speed</span>
                                <span className="text-slate-800">{speed.toFixed(2)}×</span>
                            </div>
                            <input
                                type="range"
                                min={0.25}
                                max={3}
                                step={0.05}
                                value={speed}
                                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                className="w-full accent-emerald-600"
                            />
                        </div>
                    </div>
                )}
                {systemView !== 'Digestive' && (
                    <div className="col-span-12 pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase mb-1">
                            <span>Animation speed</span>
                            <span className="text-slate-800">{speed.toFixed(2)}×</span>
                        </div>
                        <input
                            type="range"
                            min={0.25}
                            max={3}
                            step={0.05}
                            value={speed}
                            onChange={(e) => setSpeed(parseFloat(e.target.value))}
                            className="w-full accent-emerald-600"
                        />
                    </div>
                )}
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

// ═══════════════════════════════════════════════════════════════════════════
// SVG defs
// ═══════════════════════════════════════════════════════════════════════════
const FrogStageDefs: React.FC = () => (
    <defs>
        <radialGradient id="skinDorsal" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#bef264" />
            <stop offset="45%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#3f6212" />
        </radialGradient>
        <radialGradient id="skinDorsalWet" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#99f6e4" />
            <stop offset="45%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#0f766e" />
        </radialGradient>
        <radialGradient id="bellyCavity" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="60%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#fcd34d" />
        </radialGradient>
        <radialGradient id="cavityRim" cx="50%" cy="50%" r="60%">
            <stop offset="80%" stopColor="#fcd34d" stopOpacity="0" />
            <stop offset="100%" stopColor="#92400e" stopOpacity="0.6" />
        </radialGradient>
        <radialGradient id="lungTissue" cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#fecaca" />
            <stop offset="60%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#9f1239" />
        </radialGradient>
        <linearGradient id="heartTissue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#9f1239" />
        </linearGradient>
        <radialGradient id="liverTissue" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#9a3412" />
            <stop offset="100%" stopColor="#5c1f08" />
        </radialGradient>
        <radialGradient id="stomachTissue" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
        <radialGradient id="intestineTissue" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#fdba74" />
            <stop offset="100%" stopColor="#c2410c" />
        </radialGradient>
        <radialGradient id="kidneyTissue" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#4c1d95" />
        </radialGradient>
        <radialGradient id="brainGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#fbcfe8" />
            <stop offset="100%" stopColor="#be185d" />
        </radialGradient>
        <pattern id="dorsalSpots" patternUnits="userSpaceOnUse" width="80" height="80">
            <ellipse cx="20" cy="20" rx="8" ry="5" fill="#3f6212" opacity="0.45" />
            <ellipse cx="58" cy="44" rx="7" ry="4" fill="#3f6212" opacity="0.4" />
            <ellipse cx="32" cy="62" rx="9" ry="5" fill="#3f6212" opacity="0.45" />
        </pattern>
        <filter id="bodyShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
            <feOffset dx="0" dy="6" result="off" />
            <feComponentTransfer><feFuncA type="linear" slope="0.35" /></feComponentTransfer>
            <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
        <marker id="arrowSky" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="#0284c7" />
        </marker>
        <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="#dc2626" />
        </marker>
    </defs>
);

// ═══════════════════════════════════════════════════════════════════════════
// Environment background
// ═══════════════════════════════════════════════════════════════════════════
const Environment: React.FC<{ env: EnvironmentMode }> = ({ env }) => {
    if (env === 'Water') {
        return (
            <g>
                <rect x="0" y="0" width="1280" height="760" fill="url(#waterBg)" />
                <defs>
                    <linearGradient id="waterBg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e0f2fe" />
                        <stop offset="100%" stopColor="#bae6fd" />
                    </linearGradient>
                </defs>
                {Array.from({ length: 50 }).map((_, i) => {
                    const x = 20 + (i * 47) % 1240;
                    const y = 20 + ((i * 71) % 720);
                    const r = 2 + ((i * 13) % 4);
                    return <circle key={i} cx={x} cy={y} r={r} fill="#38bdf8" opacity="0.4" />;
                })}
                {[80, 300, 540, 800, 1060].map((x, i) => (
                    <path
                        key={i}
                        d={`M${x} 20 Q${x + 18} 32 ${x + 36} 20 T${x + 72} 20`}
                        stroke="#0ea5e9"
                        strokeWidth="1.5"
                        fill="none"
                        opacity="0.4"
                    />
                ))}
            </g>
        );
    }
    if (env === 'Aestivation') {
        return (
            <g>
                <rect x="0" y="0" width="1280" height="760" fill="url(#aestBg)" />
                <defs>
                    <linearGradient id="aestBg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fef3c7" />
                        <stop offset="100%" stopColor="#fed7aa" />
                    </linearGradient>
                </defs>
                <circle cx="1140" cy="120" r="50" fill="#fbbf24" opacity="0.55" />
                <circle cx="1140" cy="120" r="32" fill="#fde68a" />
            </g>
        );
    }
    return (
        <g>
            <rect x="0" y="0" width="1280" height="760" fill="url(#landBg)" />
            <defs>
                <linearGradient id="landBg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f7fee7" />
                    <stop offset="100%" stopColor="#ecfccb" />
                </linearGradient>
            </defs>
            {/* faint grass */}
            {Array.from({ length: 30 }).map((_, i) => {
                const x = 30 + (i * 41) % 1240;
                const y = 720;
                return (
                    <path
                        key={i}
                        d={`M${x} ${y} q5 -14 10 0 q5 -16 10 0`}
                        stroke="#84cc16"
                        strokeWidth="1.2"
                        fill="none"
                        opacity="0.5"
                    />
                );
            })}
        </g>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// Frog body — realistic top-down, spread-eagle pose
// All coords centered at (0,0). Body cavity opening when Internal view.
// ═══════════════════════════════════════════════════════════════════════════
const FrogBody: React.FC<{
    environment: EnvironmentMode;
    anatomy: AnatomyView;
    systemView: SystemView;
    sex: SexMode;
}> = ({ environment, anatomy }) => {
    const skinFill = environment === 'Water' ? 'url(#skinDorsalWet)' : 'url(#skinDorsal)';
    const glow = environment === 'Water';

    return (
        <g filter="url(#bodyShadow)">
            {/*
                ─── Limbs are drawn first so the body silhouette paints over the
                inner ends, making the attachments look natural. ───
                Each limb uses thick stroke + round linecap to form clean
                capsules (upper arm / forearm / hand, thigh / shank / foot).
            */}

            {/* ════════════════════════════════════════════════════════════════
                HIND LIMBS — classic sitting pose: thigh angles out to a wide
                knee (the widest point of the frog), shank drops down, ending in
                a long webbed foot with 5 splayed toes.
               ════════════════════════════════════════════════════════════════ */}
            {(['right', 'left'] as const).map((side) => (
                <g key={`hind-${side}`} transform={side === 'left' ? 'scale(-1,1)' : undefined}>
                    {/* ZIG-ZAG hind leg (right-side coords; left is the mirror):
                        THIGH out + down to a wide knee, SHANK folds back in + down
                        to the ankle, then a webbed foot with long toes. */}
                    {/* THIGH */}
                    <line x1="90" y1="60" x2="300" y2="160" stroke="#365314" strokeWidth="62" strokeLinecap="round" />
                    <line x1="90" y1="60" x2="300" y2="160" stroke={skinFill} strokeWidth="54" strokeLinecap="round" />
                    {/* SHANK — folds back (the zig-zag) */}
                    <line x1="300" y1="160" x2="185" y2="272" stroke="#365314" strokeWidth="48" strokeLinecap="round" />
                    <line x1="300" y1="160" x2="185" y2="272" stroke={skinFill} strokeWidth="40" strokeLinecap="round" />
                    {/* WEBBED FOOT — membrane through the long splayed toe tips */}
                    <path
                        d="M185 272 L270 296 L282 328 L262 350 L230 356 L198 348 L170 328 Z"
                        fill={skinFill}
                        stroke="#365314"
                        strokeWidth="3"
                        strokeLinejoin="round"
                    />
                    {/* 5 long toes radiating from the ankle */}
                    <g stroke="#365314" strokeWidth="3.5" fill="none" strokeLinecap="round">
                        <line x1="185" y1="272" x2="270" y2="296" />
                        <line x1="185" y1="272" x2="282" y2="328" />
                        <line x1="185" y1="272" x2="262" y2="350" />
                        <line x1="185" y1="272" x2="230" y2="356" />
                        <line x1="185" y1="272" x2="198" y2="348" />
                    </g>
                </g>
            ))}

            {/* ════════════════════════════════════════════════════════════════
                FORELIMBS — angle out + up from the shoulders, bend at the elbow,
                hand with 4 splayed fingers (NOT webbed).
               ════════════════════════════════════════════════════════════════ */}
            {(['right', 'left'] as const).map((side) => (
                <g key={`fore-${side}`} transform={side === 'left' ? 'scale(-1,1)' : undefined}>
                    {/* ZIG-ZAG foreleg (right-side coords; left is the mirror):
                        UPPER ARM out + up to the elbow, FOREARM folds back up toward
                        the hand, then 4 long fingers spread (NOT webbed). */}
                    {/* UPPER ARM — reaches outward */}
                    <line x1="95" y1="-150" x2="190" y2="-176" stroke="#365314" strokeWidth="32" strokeLinecap="round" />
                    <line x1="95" y1="-150" x2="190" y2="-176" stroke={skinFill} strokeWidth="24" strokeLinecap="round" />
                    {/* FOREARM — continues out + up (zig-zag bend at the elbow) */}
                    <line x1="190" y1="-176" x2="245" y2="-202" stroke="#365314" strokeWidth="26" strokeLinecap="round" />
                    <line x1="190" y1="-176" x2="245" y2="-202" stroke={skinFill} strokeWidth="18" strokeLinecap="round" />
                    {/* 4 LONG fingers fanning out + up from the hand */}
                    <g stroke="#365314" strokeWidth="11" strokeLinecap="round" fill="none">
                        <line x1="245" y1="-202" x2="302" y2="-206" />
                        <line x1="245" y1="-202" x2="298" y2="-232" />
                        <line x1="245" y1="-202" x2="278" y2="-252" />
                        <line x1="245" y1="-202" x2="252" y2="-258" />
                    </g>
                    <g stroke={skinFill} strokeWidth="6" strokeLinecap="round" fill="none">
                        <line x1="245" y1="-202" x2="302" y2="-206" />
                        <line x1="245" y1="-202" x2="298" y2="-232" />
                        <line x1="245" y1="-202" x2="278" y2="-252" />
                        <line x1="245" y1="-202" x2="252" y2="-258" />
                    </g>
                </g>
            ))}

            {/* ════════════════════════════════════════════════════════════════
                MAIN BODY SILHOUETTE — distinct rounded head that necks in, then
                flares to a wide trunk and tapers to a narrow pelvic end.
               ════════════════════════════════════════════════════════════════ */}
            <path
                d="M0 -272
                   C36 -270 66 -256 88 -226
                   C112 -192 134 -156 154 -116
                   C174 -76 186 -34 190 14
                   C192 64 184 112 166 154
                   C146 192 116 222 80 242
                   C54 253 26 257 0 257
                   C-26 257 -54 253 -80 242
                   C-116 222 -146 192 -166 154
                   C-184 112 -192 64 -190 14
                   C-186 -34 -174 -76 -154 -116
                   C-134 -156 -112 -192 -88 -226
                   C-66 -256 -36 -270 0 -272 Z"
                fill={skinFill}
                stroke={glow ? '#5eead4' : '#365314'}
                strokeWidth={glow ? 8 : 4}
                filter={glow ? 'url(#glow)' : undefined}
            />

            {/* dorsal spots pattern overlay (must trace the same outline) */}
            <path
                d="M0 -272
                   C36 -270 66 -256 88 -226
                   C112 -192 134 -156 154 -116
                   C174 -76 186 -34 190 14
                   C192 64 184 112 166 154
                   C146 192 116 222 80 242
                   C54 253 26 257 0 257
                   C-26 257 -54 253 -80 242
                   C-116 222 -146 192 -166 154
                   C-184 112 -192 64 -190 14
                   C-186 -34 -174 -76 -154 -116
                   C-134 -156 -112 -192 -88 -226
                   C-66 -256 -36 -270 0 -272 Z"
                fill="url(#dorsalSpots)"
                opacity={environment === 'Water' ? 0.35 : 0.85}
            />

            {/* mid-dorsal stripe */}
            <path d="M0 -240 L0 250" stroke="#365314" strokeWidth="2" opacity="0.35" strokeDasharray="3 4" />

            {/* ─── Head detail (eyes, nostrils, tympanum) ─── */}
            {/* eyes — bulging at the top-side corners; pupils shifted OUTWARD so the
                frog looks out to the sides, not toward the viewer */}
            <ellipse cx="-80" cy="-212" rx="34" ry="32" fill={skinFill} stroke="#365314" strokeWidth="4" />
            <ellipse cx="80" cy="-212" rx="34" ry="32" fill={skinFill} stroke="#365314" strokeWidth="4" />
            {/* golden eyeball */}
            <circle cx="-80" cy="-214" r="21" fill="#fbbf24" stroke="#365314" strokeWidth="2" />
            <circle cx="80" cy="-214" r="21" fill="#fbbf24" stroke="#365314" strokeWidth="2" />
            {/* dark pupil on the OUTER edge of each eye */}
            <circle cx="-91" cy="-214" r="9" fill="#0f172a" />
            <circle cx="91" cy="-214" r="9" fill="#0f172a" />
            {/* highlight */}
            <circle cx="-87" cy="-219" r="3.5" fill="white" />
            <circle cx="87" cy="-219" r="3.5" fill="white" />
            {/* nostrils near the snout (no mouth, no tympanum — matches reference) */}
            <circle cx="-10" cy="-250" r="3" fill="#0f172a" />
            <circle cx="10" cy="-250" r="3" fill="#0f172a" />

            {/* ─── BODY CAVITY (Internal view only) ─── */}
            {anatomy === 'Internal' && (
                <>
                    {/* cream cavity opening shaped like the trunk */}
                    <path
                        d="M0 -150
                           C-70 -150 -110 -120 -120 -70
                           C-130 -20 -130 50 -115 110
                           C-95 170 -60 210 -30 220
                           C-10 224 10 224 30 220
                           C60 210 95 170 115 110
                           C130 50 130 -20 120 -70
                           C110 -120 70 -150 0 -150Z"
                        fill="url(#bellyCavity)"
                        stroke="#92400e"
                        strokeWidth="2.5"
                    />
                    {/* cavity rim shadow */}
                    <path
                        d="M0 -150
                           C-70 -150 -110 -120 -120 -70
                           C-130 -20 -130 50 -115 110
                           C-95 170 -60 210 -30 220
                           C-10 224 10 224 30 220
                           C60 210 95 170 115 110
                           C130 50 130 -20 120 -70
                           C110 -120 70 -150 0 -150Z"
                        fill="url(#cavityRim)"
                    />
                    {/* surgical pin marks on cavity edge */}
                    {[-130, -80, -20, 60, 120, 170, 210].map((y, i) => (
                        <g key={i}>
                            <circle cx={-122 - Math.abs(y) * 0.02} cy={y} r="2.5" fill="#475569" />
                            <circle cx={122 + Math.abs(y) * 0.02} cy={y} r="2.5" fill="#475569" />
                        </g>
                    ))}
                </>
            )}
        </g>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// External overlay
// ═══════════════════════════════════════════════════════════════════════════
const ExternalOverlay: React.FC<{ sex: SexMode; showLabels: boolean }> = ({ sex, showLabels }) => (
    <g>
        {/* nictitating membrane sweep */}
        <path d="M-94 -218 q28 16 56 0" stroke="#bef264" strokeWidth="3" fill="none" opacity="0.85" />
        <path d="M38 -218 q28 16 56 0" stroke="#bef264" strokeWidth="3" fill="none" opacity="0.85" />
        {/* vocal sac on chin (♂) */}
        {sex === 'Male' && (
            <>
                <ellipse cx="0" cy="-130" rx="58" ry="26" fill="#fbbf24" opacity="0.55" />
                <ellipse
                    cx="0"
                    cy="-130"
                    rx="58"
                    ry="26"
                    fill="none"
                    stroke="#b45309"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                />
                {/* copulatory pad on 1st digit of left forelimb */}
                <circle cx="-292" cy="-26" r="8" fill="#f97316" stroke="#9a3412" strokeWidth="1.5" />
            </>
        )}
        {showLabels && (
            <>
                <Label x={-200} y={-260} text="Nictitating membrane" color="#3f6212" align="right" />
                <Label x={-200} y={-180} text="Tympanum (ear)" color="#365314" align="right" />
                <Label x={200} y={-260} text="Nostrils" color="#0f172a" align="left" />
                <Label x={200} y={-180} text="Eye (simple, in orbit)" color="#365314" align="left" />
                <Label x={-300} y={-100} text="Forelimb · 4 digits" color="#3f6212" align="right" />
                <Label x={300} y={-100} text="Forelimb · 4 digits" color="#3f6212" align="left" />
                <Label x={-400} y={300} text="Hind limb · 5 webbed digits" color="#3f6212" align="right" />
                <Label x={400} y={300} text="Hind limb · 5 webbed digits" color="#3f6212" align="left" />
                <Label
                    x={0}
                    y={-110}
                    text={sex === 'Male' ? 'Vocal sac (♂ only)' : 'No vocal sac (♀)'}
                    color="#b45309"
                    align="center"
                />
                {sex === 'Male' && (
                    <Label x={-360} y={-20} text="Copulatory pad (♂)" color="#9a3412" align="right" />
                )}
                <Label x={0} y={150} text="Dorsal: olive-green · Ventral: pale-yellow" color="#365314" align="center" />
            </>
        )}
    </g>
);

// ═══════════════════════════════════════════════════════════════════════════
// Digestive
// ═══════════════════════════════════════════════════════════════════════════
const DigestiveLayer: React.FC<{
    active: boolean;
    step: number;
    progress: number;
    showLabels: boolean;
}> = ({ active, step, progress, showLabels }) => {
    const op = active ? 1 : 0.18;

    const waypoints: [number, number][] = [
        [0, -200], // buccal
        [0, -150], // pharynx
        [0, -90], // oesophagus
        [-40, -30], // stomach
        [40, 30], // duodenum
        [0, 100], // intestine
        [0, 200], // cloaca
    ];
    const bolusIndex = Math.min(step, waypoints.length - 1);
    const from = waypoints[Math.max(0, bolusIndex - 1)];
    const to = waypoints[bolusIndex];
    const bx = from[0] + (to[0] - from[0]) * progress;
    const by = from[1] + (to[1] - from[1]) * progress;

    return (
        <g opacity={op}>
            {/* Oesophagus */}
            <path d="M0 -150 L0 -90" stroke="#d97706" strokeWidth="12" strokeLinecap="round" />
            {/* Heart placeholder shadow above (for context) */}
            {/* Liver (large dark red, left side) */}
            <path
                d="M-100 -90 C-120 -50 -100 -10 -50 -10 C-20 -14 -10 -50 -30 -86 Z"
                fill="url(#liverTissue)"
                stroke="#3f1d04"
                strokeWidth="2"
            />
            <path
                d="M-50 -10 C-30 -8 -10 -16 -20 -50 C-32 -78 -56 -82 -78 -68"
                fill="none"
                stroke="#3f1d04"
                strokeWidth="1.5"
                opacity="0.6"
            />
            {/* Gall bladder (green sac on liver) */}
            <ellipse cx="-30" cy="-30" rx="10" ry="14" fill="#22c55e" stroke="#14532d" strokeWidth="1.8" />
            {/* Bile duct */}
            <path d="M-22 -18 Q0 0 30 22" stroke="#22c55e" strokeWidth="2" fill="none" strokeDasharray="3 2" />
            {/* Stomach (J-shape, yellow-orange) */}
            <path
                d="M-30 -86 C-72 -68 -86 -10 -40 8 C0 20 30 -10 24 -50 C20 -76 -2 -90 -30 -86Z"
                fill="url(#stomachTissue)"
                stroke="#7c2d12"
                strokeWidth="2.5"
            />
            {/* Pancreas (thin orange strip) */}
            <path
                d="M24 -50 q30 4 40 30"
                stroke="#fb923c"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
            />
            {/* Duodenum + coiled intestine */}
            <path
                d="M30 22 C70 30 80 60 50 80 C20 96 -30 84 -40 110 C-50 138 0 158 40 144 C72 132 76 168 40 184 C0 200 -40 192 -30 218 L0 220"
                stroke="url(#intestineTissue)"
                strokeWidth="14"
                fill="none"
                strokeLinecap="round"
            />
            {/* villi accent */}
            <path
                d="M-30 110 q-2 4 0 8 m-3 -6 q-2 4 0 8"
                stroke="#fde68a"
                strokeWidth="2.5"
                fill="none"
            />
            {/* Rectum → Cloaca */}
            <circle cx="0" cy="220" r="9" fill="#78350f" />
            {/* Tongue + insect during steps 0 & 1 */}
            {step <= 1 && (
                <>
                    <path
                        d={
                            step === 1
                                ? `M0 -210 Q${-20 + progress * 60} ${-260 - progress * 30} ${-30 + progress * 60} ${-280 - progress * 30}`
                                : 'M0 -210 L0 -200'
                        }
                        stroke="#ec4899"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                    />
                    <g transform={`translate(${-30 + progress * 60} ${-280 - progress * 30})`}>
                        <ellipse rx="7" ry="5" fill="#0f172a" />
                        <path d="M-9 -7 L0 0 M9 -7 L0 0" stroke="#0f172a" strokeWidth="1.4" />
                        <ellipse cx="-8" cy="-4" rx="4" ry="3" fill="#0ea5e9" opacity="0.5" />
                        <ellipse cx="8" cy="-4" rx="4" ry="3" fill="#0ea5e9" opacity="0.5" />
                    </g>
                </>
            )}
            {/* Bolus traveling */}
            {step >= 2 && <circle cx={bx} cy={by} r="9" fill="#7c2d12" stroke="#fde68a" strokeWidth="2" />}
            {/* Chyme ripples in stomach */}
            {step === 3 && (
                <circle
                    cx="-15"
                    cy="-40"
                    r={8 + progress * 14}
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="2"
                    opacity={1 - progress}
                />
            )}

            {showLabels && (
                <>
                    <Label x={-220} y={-150} text="Buccal cavity" color="#92400e" align="right" />
                    <Label x={-220} y={-90} text="Oesophagus" color="#92400e" align="right" />
                    <Label x={-220} y={-40} text="Liver" color="#5c1f08" align="right" />
                    <Label x={-220} y={-10} text="Gall bladder + bile duct" color="#15803d" align="right" />
                    <Label x={220} y={-50} text="Stomach (HCl + gastric juice)" color="#7c2d12" align="left" />
                    <Label x={220} y={-15} text="Pancreas" color="#9a3412" align="left" />
                    <Label x={220} y={50} text="Duodenum" color="#9a3412" align="left" />
                    <Label x={220} y={120} text="Intestine (villi · microvilli)" color="#9a3412" align="left" />
                    <Label x={220} y={210} text="Rectum → Cloaca" color="#78350f" align="left" />
                </>
            )}
        </g>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// Respiratory
// ═══════════════════════════════════════════════════════════════════════════
const RespiratoryLayer: React.FC<{
    active: boolean;
    env: EnvironmentMode;
    phase: number;
    showLabels: boolean;
}> = ({ active, env, phase, showLabels }) => {
    const op = active ? 1 : 0.18;
    const inflate = (Math.sin(phase) + 1) / 2;
    const lungRx = 40 + inflate * 8;
    const lungRy = 78 + inflate * 12;
    const lungsActive = env === 'Land';

    return (
        <g opacity={op}>
            {/* lungs */}
            <ellipse
                cx="-70"
                cy="-50"
                rx={lungRx}
                ry={lungRy}
                fill={lungsActive ? 'url(#lungTissue)' : '#fee2e2'}
                stroke="#7f1d1d"
                strokeWidth="2.5"
                opacity={env === 'Aestivation' ? 0.4 : 1}
            />
            <ellipse
                cx="70"
                cy="-50"
                rx={lungRx}
                ry={lungRy}
                fill={lungsActive ? 'url(#lungTissue)' : '#fee2e2'}
                stroke="#7f1d1d"
                strokeWidth="2.5"
                opacity={env === 'Aestivation' ? 0.4 : 1}
            />
            {/* alveolar texture */}
            {Array.from({ length: 12 }).map((_, i) => {
                const a = (i / 12) * Math.PI * 2;
                const x = Math.cos(a) * 26;
                const y = Math.sin(a) * 50;
                return (
                    <g key={i} opacity={lungsActive ? 0.4 : 0.15}>
                        <circle cx={-70 + x} cy={-50 + y} r="6" fill="#fda4af" />
                        <circle cx={70 + x} cy={-50 + y} r="6" fill="#fda4af" />
                    </g>
                );
            })}
            {/* Trachea + buccal */}
            <path d="M0 -200 L0 -130" stroke="#0284c7" strokeWidth="6" />
            <path d="M0 -130 L-50 -100 M0 -130 L50 -100" stroke="#0284c7" strokeWidth="4" />
            <ellipse
                cx="0"
                cy="-200"
                rx="50"
                ry="18"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeDasharray="3 3"
                opacity={env === 'Land' ? 0.9 : 0.3}
            />
            {/* O2 particles down trachea (land) */}
            {env === 'Land' &&
                Array.from({ length: 6 }).map((_, i) => {
                    const t = (phase / (Math.PI * 2) + i / 6) % 1;
                    const y = -240 + t * 180;
                    const x = i % 2 === 0 ? -8 : 8;
                    return <circle key={i} cx={x} cy={y} r="4.5" fill="#0284c7" opacity={0.85} />;
                })}
            {/* Water: O2 around skin */}
            {env === 'Water' &&
                Array.from({ length: 22 }).map((_, i) => {
                    const ang = (i / 22) * Math.PI * 2;
                    const r = 240 + Math.sin(phase * 2 + i) * 18;
                    return (
                        <circle
                            key={i}
                            cx={Math.cos(ang) * r}
                            cy={Math.sin(ang) * r * 0.85}
                            r="4"
                            fill="#0ea5e9"
                            opacity="0.85"
                        />
                    );
                })}
            {/* arrows pointing inward in water */}
            {env === 'Water' &&
                Array.from({ length: 12 }).map((_, i) => {
                    const ang = (i / 12) * Math.PI * 2;
                    const x1 = Math.cos(ang) * 240;
                    const y1 = Math.sin(ang) * 240 * 0.85;
                    const x2 = Math.cos(ang) * 190;
                    const y2 = Math.sin(ang) * 190 * 0.85;
                    return (
                        <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#0284c7"
                            strokeWidth="1.8"
                            markerEnd="url(#arrowSky)"
                        />
                    );
                })}

            {showLabels && (
                <>
                    <Label x={-220} y={-50} text="Left lung" color="#7f1d1d" align="right" />
                    <Label x={220} y={-50} text="Right lung" color="#7f1d1d" align="left" />
                    <Label x={-220} y={-200} text={env === 'Aestivation' ? 'Nostrils (inactive)' : 'Nostrils'} color="#0f172a" align="right" />
                    <Label x={220} y={-130} text="Buccal cavity" color="#0284c7" align="left" />
                    <Label
                        x={0}
                        y={260}
                        text={
                            env === 'Water'
                                ? 'Cutaneous: dissolved O₂ → vascular skin (closed system)'
                                : env === 'Aestivation'
                                ? 'Aestivation / Hibernation: gas exchange via skin only'
                                : 'Pulmonary + Buccal + Cutaneous respiration on land'
                        }
                        color="#0284c7"
                        align="center"
                    />
                </>
            )}
        </g>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// Circulatory
// ═══════════════════════════════════════════════════════════════════════════
const CirculatoryLayer: React.FC<{
    active: boolean;
    phase: number;
    showLymphatic: boolean;
    showLabels: boolean;
}> = ({ active, phase, showLymphatic, showLabels }) => {
    const op = active ? 1 : 0.18;
    const ventBeat = 1 + 0.1 * Math.sin(phase * 12);

    return (
        <g opacity={op}>
            {/* Major arteries (red) */}
            <path d="M0 -50 C-80 -20 -150 40 -200 140" stroke="#dc2626" strokeWidth="4.5" fill="none" />
            <path d="M0 -50 C80 -20 150 40 200 140" stroke="#dc2626" strokeWidth="4.5" fill="none" />
            <path d="M0 -50 L0 230" stroke="#dc2626" strokeWidth="4" fill="none" />
            {/* Veins (blue) */}
            <path d="M-200 140 C-150 100 -80 0 -10 -50" stroke="#2563eb" strokeWidth="4" fill="none" />
            <path d="M200 140 C150 100 80 0 10 -50" stroke="#2563eb" strokeWidth="4" fill="none" />
            {/* Hepatic portal */}
            <path
                d="M0 100 C-40 60 -50 20 -40 -10"
                stroke="#7c3aed"
                strokeWidth="3"
                fill="none"
                strokeDasharray="5 3"
            />
            {/* Renal portal */}
            <path
                d="M-80 180 C-60 130 -50 100 -40 80"
                stroke="#059669"
                strokeWidth="3"
                fill="none"
                strokeDasharray="5 3"
            />
            <path
                d="M80 180 C60 130 50 100 40 80"
                stroke="#059669"
                strokeWidth="3"
                fill="none"
                strokeDasharray="5 3"
            />
            {/* Sinus venosus */}
            <path d="M-40 -90 L-10 -60 L-50 -55 Z" fill="#2563eb" stroke="#1e3a8a" strokeWidth="1.8" />

            {/* Heart */}
            <g transform={`translate(0 -60) scale(${ventBeat})`}>
                <path
                    d="M-32 -22 C-66 -56 -100 -10 -56 28 C-32 48 0 70 0 70 C0 70 32 48 56 28 C100 -10 66 -56 32 -22 C18 -38 -18 -38 -32 -22Z"
                    fill="url(#heartTissue)"
                    stroke="#7f1d1d"
                    strokeWidth="2.5"
                />
                <line x1="0" y1="-30" x2="0" y2="20" stroke="#7f1d1d" strokeWidth="2" />
                <line x1="-44" y1="6" x2="44" y2="6" stroke="#7f1d1d" strokeWidth="2" />
                <text x="-22" y="0" textAnchor="middle" fontSize="12" fontWeight="900" fill="white">RA</text>
                <text x="22" y="0" textAnchor="middle" fontSize="12" fontWeight="900" fill="white">LA</text>
                <text x="0" y="36" textAnchor="middle" fontSize="13" fontWeight="900" fill="white">V</text>
            </g>
            {/* Conus arteriosus */}
            <path d="M-12 12 L12 12 L0 50 Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1.8" />

            {/* Animated blood cells */}
            {Array.from({ length: 18 }).map((_, i) => {
                const t = (phase + i / 18) % 1;
                const ang = t * Math.PI * 2;
                const cx = Math.cos(ang) * (160 + (i % 3) * 8);
                const cy = Math.sin(ang) * (140 + (i % 3) * 6);
                const oxy = Math.sin(ang) > 0;
                return (
                    <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r="3.5"
                        fill={oxy ? '#dc2626' : '#2563eb'}
                        opacity={0.9}
                    />
                );
            })}
            {/* mixed (purple) cells leaving ventricle */}
            {Array.from({ length: 6 }).map((_, i) => {
                const t = (phase + i / 6) % 1;
                const y = 10 + t * 50;
                return <circle key={i} cx={0} cy={y} r="3.5" fill="#a855f7" />;
            })}

            {/* Lymphatic */}
            {showLymphatic && (
                <g opacity="0.9">
                    {[
                        [-150, 40, -180, 140],
                        [150, 40, 180, 140],
                        [0, 50, 0, 220],
                    ].map(([x1, y1, x2, y2], i) => (
                        <path
                            key={i}
                            d={`M${x1} ${y1} C${(x1 + x2) / 2} ${(y1 + y2) / 2 - 14} ${x2} ${y2}`}
                            stroke="#14b8a6"
                            strokeWidth="2.5"
                            strokeDasharray="2 4"
                            fill="none"
                        />
                    ))}
                    {[
                        [-150, 40], [150, 40], [-180, 140], [180, 140], [0, 220],
                    ].map(([cx, cy], i) => (
                        <circle key={i} cx={cx} cy={cy} r="5" fill="#0d9488" />
                    ))}
                    <text x="0" y="280" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0d9488">
                        Lymph · lymph channels · lymph nodes · lacteals
                    </text>
                </g>
            )}

            {showLabels && (
                <>
                    <Label x={-220} y={-90} text="Sinus venosus" color="#1e3a8a" align="right" />
                    <Label x={220} y={-90} text="Vena cava in" color="#1e3a8a" align="left" />
                    <Label x={220} y={-60} text="3-chambered heart" color="#7f1d1d" align="left" />
                    <Label x={220} y={30} text="Conus arteriosus (ventral)" color="#7f1d1d" align="left" />
                    <Label x={-260} y={140} text="Hepatic portal · Renal portal" color="#7c3aed" align="right" />
                    <Label x={260} y={140} text="Closed · single circulation" color="#dc2626" align="left" />
                </>
            )}
        </g>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// Excretory
// ═══════════════════════════════════════════════════════════════════════════
const ExcretoryLayer: React.FC<{
    active: boolean;
    sex: SexMode;
    phase: number;
    showLabels: boolean;
}> = ({ active, sex, phase, showLabels }) => {
    const op = active ? 1 : 0.18;
    return (
        <g opacity={op}>
            {/* Kidneys (bean-shaped, dark red-violet) */}
            <path
                d="M-50 40 C-72 40 -82 80 -72 130 C-62 170 -36 170 -34 120 C-32 90 -34 40 -50 40Z"
                fill="url(#kidneyTissue)"
                stroke="#3b0764"
                strokeWidth="2"
            />
            <path
                d="M50 40 C72 40 82 80 72 130 C62 170 36 170 34 120 C32 90 34 40 50 40Z"
                fill="url(#kidneyTissue)"
                stroke="#3b0764"
                strokeWidth="2"
            />
            {/* Adrenals on kidneys */}
            <ellipse cx="-50" cy="40" rx="16" ry="6" fill="#fbbf24" stroke="#a16207" strokeWidth="1.2" />
            <ellipse cx="50" cy="40" rx="16" ry="6" fill="#fbbf24" stroke="#a16207" strokeWidth="1.2" />
            {/* Ureters */}
            <path d="M-50 170 C-44 195 -20 215 0 220" stroke="#7c3aed" strokeWidth="3.5" fill="none" />
            <path d="M50 170 C44 195 20 215 0 220" stroke="#7c3aed" strokeWidth="3.5" fill="none" />
            {/* Urinary bladder */}
            <ellipse cx="0" cy="195" rx="40" ry="22" fill="#ede9fe" stroke="#6d28d9" strokeWidth="2.5" />
            {/* Cloaca */}
            <circle cx="0" cy="230" r="9" fill="#5b21b6" />
            {/* Urine droplets along ureters */}
            {Array.from({ length: 6 }).map((_, i) => {
                const t = (phase + i / 6) % 1;
                const y = 170 + t * 50;
                const xL = -50 + t * 50;
                const xR = 50 - t * 50;
                return (
                    <g key={i}>
                        <circle cx={xL} cy={y} r="3" fill="#7c3aed" />
                        <circle cx={xR} cy={y} r="3" fill="#7c3aed" />
                    </g>
                );
            })}
            {/* Blood filtration arrows */}
            <path d="M0 0 L-30 30 M0 0 L30 30" stroke="#dc2626" strokeWidth="2.5" markerEnd="url(#arrowRed)" />

            {showLabels && (
                <>
                    <Label x={-200} y={80} text="Kidney · nephrons" color="#5b21b6" align="right" />
                    <Label x={-200} y={40} text="Adrenal gland" color="#a16207" align="right" />
                    <Label
                        x={200}
                        y={120}
                        text={sex === 'Male' ? 'Ureter = urinogenital duct (♂)' : 'Ureter (♀ · separate from oviduct)'}
                        color="#5b21b6"
                        align="left"
                    />
                    <Label x={200} y={195} text="Urinary bladder (ventral to rectum)" color="#5b21b6" align="left" />
                    <Label x={200} y={235} text="Cloaca · ureotelic" color="#5b21b6" align="left" />
                </>
            )}
        </g>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// Nervous
// ═══════════════════════════════════════════════════════════════════════════
const NervousLayer: React.FC<{
    active: boolean;
    region: BrainRegion;
    showEndocrine: boolean;
    showLabels: boolean;
}> = ({ active, region, showEndocrine, showLabels }) => {
    const op = active ? 1 : 0.18;
    const visible = (r: BrainRegion) => region === 'All' || region === r;
    return (
        <g opacity={op}>
            {/* Brain in cranium - placed above body, inside the head */}
            <g transform="translate(0 -210)">
                {/* cranium */}
                <ellipse
                    cx="0"
                    cy="0"
                    rx="110"
                    ry="44"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                />
                {/* Fore-brain: olfactory + cerebral + diencephalon */}
                <g opacity={visible('Fore') ? 1 : 0.15}>
                    <circle cx="-22" cy="-22" r="8" fill="#fbcfe8" stroke="#be185d" strokeWidth="1.5" />
                    <circle cx="22" cy="-22" r="8" fill="#fbcfe8" stroke="#be185d" strokeWidth="1.5" />
                    <ellipse cx="-22" cy="-2" rx="20" ry="14" fill="url(#brainGrad)" stroke="#be185d" strokeWidth="1.8" />
                    <ellipse cx="22" cy="-2" rx="20" ry="14" fill="url(#brainGrad)" stroke="#be185d" strokeWidth="1.8" />
                    <ellipse cx="0" cy="14" rx="12" ry="7" fill="#f9a8d4" stroke="#be185d" strokeWidth="1.5" />
                </g>
                {/* Mid-brain: optic lobes */}
                <g opacity={visible('Mid') ? 1 : 0.15}>
                    <circle cx="-14" cy="28" r="8" fill="#fde68a" stroke="#a16207" strokeWidth="1.5" />
                    <circle cx="14" cy="28" r="8" fill="#fde68a" stroke="#a16207" strokeWidth="1.5" />
                </g>
                {/* Hind-brain: cerebellum + medulla */}
                <g opacity={visible('Hind') ? 1 : 0.15}>
                    <ellipse cx="0" cy="44" rx="20" ry="7" fill="#bae6fd" stroke="#0369a1" strokeWidth="1.5" />
                    <path d="M0 50 L0 70" stroke="#0369a1" strokeWidth="8" />
                </g>
            </g>
            {/* Spinal cord */}
            <rect x="-5" y="-140" width="10" height="380" rx="5" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
            {/* 10 pairs of cranial nerves */}
            {Array.from({ length: 10 }).map((_, i) => {
                const ang = -Math.PI / 2.6 + (i / 9) * (Math.PI / 1.3);
                const x = Math.cos(ang) * 130;
                const y = -210 + Math.sin(ang) * 50;
                return (
                    <g key={i}>
                        <line x1="0" y1="-210" x2={x} y2={y} stroke="#94a3b8" strokeWidth="1.5" />
                        <line x1="0" y1="-210" x2={-x} y2={y} stroke="#94a3b8" strokeWidth="1.5" />
                    </g>
                );
            })}
            {/* Spinal nerves */}
            {[-100, -60, -20, 20, 60, 100, 140, 180, 220].map((y) => (
                <g key={y}>
                    <path d={`M0 ${y} C-40 ${y - 4} -80 ${y + 4} -120 ${y + 14}`} stroke="#94a3b8" strokeWidth="1.5" fill="none" />
                    <path d={`M0 ${y} C40 ${y - 4} 80 ${y + 4} 120 ${y + 14}`} stroke="#94a3b8" strokeWidth="1.5" fill="none" />
                </g>
            ))}
            {/* Endocrine glands */}
            {showEndocrine && (
                <g>
                    <Gland x={0} y={-198} c="#ec4899" t="Pituitary" />
                    <Gland x={-22} y={-148} c="#06b6d4" t="Thyroid" />
                    <Gland x={22} y={-148} c="#06b6d4" t="Parathyroid" />
                    <Gland x={0} y={-100} c="#a855f7" t="Thymus" />
                    <Gland x={0} y={-176} c="#84cc16" t="Pineal" />
                    <Gland x={-50} y={40} c="#fbbf24" t="Adrenal" />
                    <Gland x={50} y={40} c="#fbbf24" t="Adrenal" />
                    <Gland x={20} y={20} c="#f97316" t="Pancreatic islet" />
                </g>
            )}
            {showLabels && (
                <>
                    <Label x={-220} y={-240} text="Olfactory + cerebral hemispheres" color="#be185d" align="right" />
                    <Label x={220} y={-240} text="Diencephalon · forebrain" color="#be185d" align="left" />
                    <Label x={220} y={-180} text="Optic lobes (mid-brain)" color="#a16207" align="left" />
                    <Label x={220} y={-150} text="Cerebellum · medulla" color="#0369a1" align="left" />
                    <Label x={-220} y={-120} text="10 pairs cranial nerves" color="#475569" align="right" />
                    <Label x={220} y={200} text="Spinal cord · spinal nerves" color="#475569" align="left" />
                </>
            )}
        </g>
    );
};

const Gland: React.FC<{ x: number; y: number; c: string; t: string }> = ({ x, y, c, t }) => (
    <g>
        <circle cx={x} cy={y} r="5" fill={c} stroke="white" strokeWidth="1.4" />
        <text x={x + 8} y={y + 4} fontSize="9" fontWeight="800" fill={c}>
            {t}
        </text>
    </g>
);

// ═══════════════════════════════════════════════════════════════════════════
// Reproductive
// ═══════════════════════════════════════════════════════════════════════════
const ReproductiveLayer: React.FC<{
    active: boolean;
    sex: SexMode;
    showLabels: boolean;
    tadpoleStage: number;
}> = ({ active, sex, showLabels, tadpoleStage }) => {
    const op = active ? 1 : 0.18;
    return (
        <g opacity={op}>
            {sex === 'Male' ? (
                <>
                    {/* Kidneys (context, lighter) */}
                    <path
                        d="M-50 40 C-72 40 -82 80 -72 130 C-62 170 -36 170 -34 120 C-32 90 -34 40 -50 40Z"
                        fill="#7c2d12"
                        opacity="0.55"
                    />
                    <path
                        d="M50 40 C72 40 82 80 72 130 C62 170 36 170 34 120 C32 90 34 40 50 40Z"
                        fill="#7c2d12"
                        opacity="0.55"
                    />
                    {/* Testes (yellowish ovoid) attached above kidneys */}
                    <ellipse cx="-60" cy="0" rx="22" ry="32" fill="#fde047" stroke="#a16207" strokeWidth="2.5" />
                    <ellipse cx="60" cy="0" rx="22" ry="32" fill="#fde047" stroke="#a16207" strokeWidth="2.5" />
                    {/* Mesorchium (peritoneal fold) */}
                    <path d="M-60 -32 q-6 -14 0 -28" stroke="#10b981" strokeWidth="2" fill="none" strokeDasharray="3 2" />
                    <path d="M60 -32 q6 -14 0 -28" stroke="#10b981" strokeWidth="2" fill="none" strokeDasharray="3 2" />
                    {/* 10–12 vasa efferentia connecting testis → kidney */}
                    {Array.from({ length: 11 }).map((_, i) => {
                        const t = i / 10;
                        return (
                            <g key={i}>
                                <line
                                    x1={-60 + 18}
                                    y1={-20 + t * 40}
                                    x2={-50}
                                    y2={50 + t * 18}
                                    stroke="#059669"
                                    strokeWidth="1.6"
                                />
                                <line
                                    x1={60 - 18}
                                    y1={-20 + t * 40}
                                    x2={50}
                                    y2={50 + t * 18}
                                    stroke="#059669"
                                    strokeWidth="1.6"
                                />
                            </g>
                        );
                    })}
                    {/* Bidder's canal inside kidney */}
                    <path d="M-50 50 L-50 160" stroke="#047857" strokeWidth="3" />
                    <path d="M50 50 L50 160" stroke="#047857" strokeWidth="3" />
                    {/* Urinogenital duct → cloaca */}
                    <path d="M-50 170 C-44 200 -22 218 0 222" stroke="#10b981" strokeWidth="3.5" fill="none" />
                    <path d="M50 170 C44 200 22 218 0 222" stroke="#10b981" strokeWidth="3.5" fill="none" />
                    <circle cx="0" cy="230" r="9" fill="#065f46" />
                    {/* Sperms drifting outside cloaca */}
                    {Array.from({ length: 22 }).map((_, i) => {
                        const ang = (i / 22) * Math.PI * 2;
                        const r = 80 + (i % 4) * 8;
                        const x = Math.cos(ang) * r;
                        const y = 320 + Math.sin(ang) * r * 0.25;
                        return (
                            <g key={i} transform={`translate(${x} ${y})`}>
                                <circle r="2.5" fill="#0ea5e9" />
                                <path d={`M0 0 L${Math.cos(ang) * 8} ${Math.sin(ang) * 8 + 1}`} stroke="#0ea5e9" strokeWidth="1.2" />
                            </g>
                        );
                    })}

                    {showLabels && (
                        <>
                            <Label x={-200} y={0} text="Testis (yellow ovoid)" color="#a16207" align="right" />
                            <Label x={200} y={0} text="Testis" color="#a16207" align="left" />
                            <Label x={-200} y={-30} text="Mesorchium" color="#059669" align="right" />
                            <Label x={200} y={50} text="10–12 vasa efferentia" color="#059669" align="left" />
                            <Label x={-200} y={140} text="Bidder’s canal" color="#047857" align="right" />
                            <Label x={200} y={170} text="Urinogenital duct" color="#10b981" align="left" />
                            <Label x={0} y={260} text="Cloaca → external fertilisation" color="#065f46" align="center" />
                        </>
                    )}
                </>
            ) : (
                <>
                    {/* Ovaries (grape-like with ova) */}
                    <ellipse cx="-65" cy="40" rx="36" ry="48" fill="#bbf7d0" stroke="#15803d" strokeWidth="2.5" />
                    <ellipse cx="65" cy="40" rx="36" ry="48" fill="#bbf7d0" stroke="#15803d" strokeWidth="2.5" />
                    {[
                        [-80, 18], [-50, 18], [-65, 38], [-80, 58], [-50, 58], [-65, 78],
                        [80, 18], [50, 18], [65, 38], [80, 58], [50, 58], [65, 78],
                    ].map(([cx, cy], i) => (
                        <circle key={i} cx={cx} cy={cy} r="5.5" fill="#fef08a" stroke="#a16207" strokeWidth="1.2" />
                    ))}
                    {/* Oviducts opening separately into cloaca */}
                    <path d="M-90 90 C-110 140 -50 200 -8 222" stroke="#22c55e" strokeWidth="3.5" fill="none" />
                    <path d="M90 90 C110 140 50 200 8 222" stroke="#22c55e" strokeWidth="3.5" fill="none" />
                    <circle cx="0" cy="230" r="9" fill="#065f46" />
                    {/* External eggs being laid in water */}
                    {Array.from({ length: 16 }).map((_, i) => {
                        const ang = (i / 16) * Math.PI * 2;
                        const r = 80 + (i % 3) * 12;
                        const x = Math.cos(ang) * r;
                        const y = 320 + Math.sin(ang) * r * 0.25;
                        return (
                            <circle key={i} cx={x} cy={y} r="4" fill="#fde68a" stroke="#a16207" strokeWidth="1" />
                        );
                    })}

                    {/* Tadpole metamorphosis strip */}
                    <g transform="translate(-180 360)">
                        {['Egg', 'Tadpole', 'Tadpole+legs', 'Froglet'].map((label, i) => {
                            const x = i * 90;
                            const highlight = Math.floor(tadpoleStage) === i;
                            return (
                                <g key={label} transform={`translate(${x} 0)`}>
                                    <rect
                                        x="-38"
                                        y="-26"
                                        width="76"
                                        height="46"
                                        rx="10"
                                        fill={highlight ? '#a7f3d0' : 'white'}
                                        stroke={highlight ? '#059669' : '#cbd5e1'}
                                        strokeWidth="2"
                                    />
                                    {i === 0 && <circle cx="0" cy="-4" r="8" fill="#fde68a" stroke="#a16207" strokeWidth="1.2" />}
                                    {i === 1 && (
                                        <g>
                                            <circle cx="-7" cy="-4" r="6" fill="#0f172a" />
                                            <path d="M-1 -4 q14 -2 22 8" stroke="#0f172a" strokeWidth="1.8" fill="none" />
                                        </g>
                                    )}
                                    {i === 2 && (
                                        <g>
                                            <circle cx="-7" cy="-4" r="6" fill="#0f172a" />
                                            <path d="M-1 -4 q14 -2 22 8" stroke="#0f172a" strokeWidth="1.8" fill="none" />
                                            <line x1="-3" y1="2" x2="-8" y2="12" stroke="#0f172a" strokeWidth="1.4" />
                                            <line x1="3" y1="2" x2="8" y2="12" stroke="#0f172a" strokeWidth="1.4" />
                                        </g>
                                    )}
                                    {i === 3 && (
                                        <g>
                                            <ellipse cx="0" cy="-2" rx="12" ry="8" fill="#22c55e" />
                                            <circle cx="-5" cy="-7" r="2.5" fill="#0f172a" />
                                            <circle cx="5" cy="-7" r="2.5" fill="#0f172a" />
                                        </g>
                                    )}
                                    <text x="0" y="16" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0f172a">
                                        {label}
                                    </text>
                                </g>
                            );
                        })}
                        <text x="135" y="40" textAnchor="middle" fontSize="11" fontWeight="700" fill="#065f46">
                            Metamorphosis · external development in water
                        </text>
                    </g>

                    {showLabels && (
                        <>
                            <Label x={-200} y={40} text="Ovary (no link to kidney)" color="#15803d" align="right" />
                            <Label x={200} y={40} text="Ovary" color="#15803d" align="left" />
                            <Label x={-200} y={130} text="Oviduct" color="#16a34a" align="right" />
                            <Label x={200} y={130} text="Oviduct" color="#16a34a" align="left" />
                            <Label x={0} y={260} text="Oviducts open separately into cloaca · 2 500 – 3 000 ova" color="#065f46" align="center" />
                        </>
                    )}
                </>
            )}
        </g>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════
const Label: React.FC<{
    x: number;
    y: number;
    text: string;
    color: string;
    align?: 'left' | 'right' | 'center';
}> = ({ x, y, text, color, align = 'center' }) => {
    const w = Math.max(60, text.length * 6.6 + 16);
    const tx = align === 'left' ? x + 8 : align === 'right' ? x - 8 : x;
    const anchor = align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle';
    const rectX = align === 'left' ? x + 4 : align === 'right' ? x - w - 4 : x - w / 2;
    return (
        <g>
            {/* leader line */}
            {align === 'left' && (
                <line x1={x - 60} y1={y} x2={x} y2={y} stroke={color} strokeWidth="1.2" opacity="0.7" />
            )}
            {align === 'right' && (
                <line x1={x} y1={y} x2={x + 60} y2={y} stroke={color} strokeWidth="1.2" opacity="0.7" />
            )}
            <rect
                x={rectX}
                y={y - 11}
                width={w}
                height="20"
                rx="10"
                fill="white"
                stroke={color}
                strokeWidth="1.4"
                opacity="0.97"
            />
            <text x={tx} y={y + 3} textAnchor={anchor} fontSize="11" fontWeight="800" fill={color}>
                {text}
            </text>
        </g>
    );
};

const ValueRow: React.FC<{ label: string; value: string; tint: string; tone: string; italic?: boolean }> = ({
    label,
    value,
    tint,
    tone,
    italic,
}) => (
    <div className={`rounded-lg border border-slate-100 ${tint} px-3 py-2`}>
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
        <div className={`mt-0.5 font-mono text-[13px] font-extrabold truncate ${tone} ${italic ? 'italic' : ''}`}>
            {value}
        </div>
    </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode; icon?: React.ReactNode; className?: string }> = ({
    children,
    icon,
    className = '',
}) => (
    <div className={`text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1 ${className}`}>
        {icon}
        {children}
    </div>
);

const NCERTFacts: React.FC<{ systemView: SystemView; sex: SexMode; anatomy: AnatomyView }> = ({
    systemView,
    sex,
    anatomy,
}) => {
    const facts: string[] = (() => {
        if (anatomy === 'External')
            return [
                'Body = head + trunk (no neck, no tail).',
                'Dorsal: olive-green with dark spots · Ventral: pale yellow.',
                'Forelimbs 4 digits · Hind limbs 5 webbed digits.',
                '♂: vocal sacs + copulatory pad on 1st forelimb digit.',
            ];
        if (systemView === 'Digestive')
            return [
                'Path: mouth → buccal → pharynx → oesophagus → stomach → intestine → rectum → cloaca.',
                'Stomach: HCl + gastric juice → chyme. Duodenum gets bile + pancreatic juice.',
                'Absorption via villi and microvilli.',
            ];
        if (systemView === 'Respiratory')
            return [
                'Water: cutaneous respiration through moist vascular skin.',
                'Land: buccal cavity, skin, and lungs all act as respiratory organs.',
                'Aestivation / hibernation: gas exchange via skin only.',
            ];
        if (systemView === 'Circulatory')
            return [
                'Closed vascular system + lymphatic system; single circulation.',
                'Heart: 2 atria + 1 ventricle + pericardium; sinus venosus → RA; ventricle → ventral conus arteriosus.',
                'Hepatic portal (liver↔intestine) · Renal portal (kidney↔lower body) · RBCs nucleated.',
            ];
        if (systemView === 'Excretory')
            return [
                'Pair of bean-shaped kidneys; nephrons = uriniferous tubules.',
                '♂ ureter = urinogenital duct → cloaca. ♀ ureter and oviduct open separately.',
                'Urinary bladder ventral to rectum; frog is ureotelic.',
            ];
        if (systemView === 'Nervous')
            return [
                'CNS + PNS + ANS · 10 pairs of cranial nerves.',
                'Fore-brain (olfactory + cerebral hemispheres + diencephalon) · Mid-brain (optic lobes) · Hind-brain (cerebellum + medulla).',
                'Senses: papillae · taste buds · nasal epithelium · eyes · tympanum.',
            ];
        if (sex === 'Male')
            return [
                'Pair of yellowish ovoid testes attached to upper kidneys by mesorchium.',
                '10–12 vasa efferentia → Bidder’s canal → urinogenital duct → cloaca.',
                'Cloaca carries faeces, urine, sperms; fertilisation is external.',
            ];
        return [
            'Pair of ovaries near kidneys with NO functional connection.',
            'Paired oviducts open separately into the cloaca.',
            'A mature female lays 2 500 – 3 000 ova per clutch; eggs hatch into tadpoles.',
        ];
    })();
    return (
        <ul className="space-y-1.5 leading-relaxed text-[11.5px] text-slate-700">
            {facts.map((f, i) => (
                <li key={i} className="flex gap-2">
                    <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{f}</span>
                </li>
            ))}
        </ul>
    );
};

export default FrogsLab;
