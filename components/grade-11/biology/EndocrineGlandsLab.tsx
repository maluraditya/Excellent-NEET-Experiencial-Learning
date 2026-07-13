import React, { useMemo, useState } from 'react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface EndocrineGlandsLabProps { topic: any; onExit: () => void }

const W = 1672;
const H = 822;
const IMAGE_SRC = '/images/11th-biology/endocrine-simulation-reference-no-controls.png';

type Sex = 'M' | 'F';
type Gland = 'hypothalamus' | 'pituitary' | 'pineal' | 'thyroid' | 'parathyroid' | 'thymus' | 'adrenal' | 'pancreas' | 'kidney' | 'heart' | 'testes' | 'ovaries';
type Scenario = 'stress' | 'fed' | 'fasting' | 'cold' | 'puberty';

type Point = { x: number; y: number; size?: number; hitSize?: number };
type Rect = { x: number; y: number; w: number; h: number };

const GLANDS: Record<Gland, {
  label: string;
  hormones: string[];
  targets: string[];
  color: string;
  row: { x: number; y: number; w: number; h: number };
  points: Partial<Record<Sex, Point[]>>;
}> = {
  hypothalamus: {
    label: 'Hypothalamus',
    hormones: ['GnRH', 'TRH', 'CRH', 'GHRH'],
    targets: ['Pituitary gland'],
    color: '#f97316',
    row: { x: 38, y: 160, w: 176, h: 47 },
    points: { M: [{ x: 642, y: 137, size: 24, hitSize: 18 }], F: [{ x: 1112, y: 137, size: 24, hitSize: 18 }] },
  },
  pituitary: {
    label: 'Pituitary gland',
    hormones: ['GH', 'PRL', 'TSH', 'ACTH', 'LH / FSH'],
    targets: ['Thyroid', 'Adrenal glands', 'Gonads'],
    color: '#fbbf24',
    row: { x: 38, y: 208, w: 176, h: 47 },
    points: { M: [{ x: 626, y: 154, size: 24, hitSize: 18 }], F: [{ x: 1098, y: 154, size: 24, hitSize: 18 }] },
  },
  pineal: {
    label: 'Pineal gland',
    hormones: ['Melatonin'],
    targets: ['Sleep-wake cycle'],
    color: '#8b5cf6',
    row: { x: 38, y: 256, w: 176, h: 47 },
    points: { M: [{ x: 655, y: 119, size: 22, hitSize: 16 }], F: [{ x: 1125, y: 119, size: 22, hitSize: 16 }] },
  },
  thyroid: {
    label: 'Thyroid gland',
    hormones: ['T3', 'T4', 'Calcitonin'],
    targets: ['Metabolism', 'Growth', 'Bones'],
    color: '#ef4444',
    row: { x: 38, y: 304, w: 176, h: 47 },
    points: { M: [{ x: 610, y: 307, size: 52, hitSize: 44 }], F: [{ x: 1112, y: 307, size: 52, hitSize: 44 }] },
  },
  parathyroid: {
    label: 'Parathyroid glands',
    hormones: ['PTH'],
    targets: ['Bones', 'Kidneys'],
    color: '#f59e0b',
    row: { x: 38, y: 352, w: 176, h: 47 },
    points: { M: [{ x: 625, y: 323, size: 18, hitSize: 14 }, { x: 640, y: 323, size: 18, hitSize: 14 }], F: [{ x: 1096, y: 323, size: 18, hitSize: 14 }, { x: 1111, y: 323, size: 18, hitSize: 14 }] },
  },
  thymus: {
    label: 'Thymus',
    hormones: ['Thymosins'],
    targets: ['T-lymphocytes'],
    color: '#f59e0b',
    row: { x: 38, y: 400, w: 176, h: 47 },
    points: { M: [{ x: 625, y: 407, size: 38, hitSize: 30 }], F: [{ x: 1119, y: 407, size: 38, hitSize: 30 }] },
  },
  adrenal: {
    label: 'Adrenal glands',
    hormones: ['Epinephrine', 'Norepinephrine', 'Cortisol', 'Aldosterone'],
    targets: ['Heart', 'Blood vessels', 'Metabolism'],
    color: '#f97316',
    row: { x: 38, y: 448, w: 176, h: 47 },
    points: { M: [{ x: 581, y: 562, size: 30, hitSize: 26 }, { x: 717, y: 562, size: 30, hitSize: 26 }], F: [{ x: 1076, y: 562, size: 30, hitSize: 26 }, { x: 1206, y: 562, size: 30, hitSize: 26 }] },
  },
  pancreas: {
    label: 'Pancreas',
    hormones: ['Insulin', 'Glucagon'],
    targets: ['Liver', 'Muscle', 'Blood glucose'],
    color: '#65a30d',
    row: { x: 38, y: 496, w: 176, h: 47 },
    points: { M: [{ x: 653, y: 590, size: 44, hitSize: 36 }], F: [{ x: 1127, y: 590, size: 44, hitSize: 36 }] },
  },
  kidney: {
    label: 'Kidney JG cells',
    hormones: ['Erythropoietin', 'Renin'],
    targets: ['Bone marrow', 'Blood pressure'],
    color: '#92400e',
    row: { x: 38, y: 544, w: 176, h: 47 },
    points: { M: [{ x: 575, y: 612, size: 30, hitSize: 24 }, { x: 711, y: 612, size: 30, hitSize: 24 }], F: [{ x: 1070, y: 612, size: 30, hitSize: 24 }, { x: 1203, y: 612, size: 30, hitSize: 24 }] },
  },
  heart: {
    label: 'Heart atria',
    hormones: ['ANF'],
    targets: ['Blood pressure'],
    color: '#0ea5e9',
    row: { x: 38, y: 592, w: 176, h: 47 },
    points: { M: [{ x: 636, y: 432, size: 44, hitSize: 54 }], F: [{ x: 1114, y: 432, size: 44, hitSize: 54 }] },
  },
  testes: {
    label: 'Testes',
    hormones: ['Androgens', 'Testosterone'],
    targets: ['Male accessory organs'],
    color: '#0ea5e9',
    row: { x: 38, y: 640, w: 176, h: 47 },
    points: { M: [{ x: 614, y: 800, size: 42, hitSize: 34 }] },
  },
  ovaries: {
    label: 'Ovaries',
    hormones: ['Estrogen', 'Progesterone'],
    targets: ['Female accessory organs'],
    color: '#d946ef',
    row: { x: 38, y: 688, w: 176, h: 47 },
    points: { F: [{ x: 1075, y: 776, size: 26, hitSize: 22 }, { x: 1142, y: 776, size: 26, hitSize: 22 }] },
  },
};

const SCENARIOS: Record<Scenario, { label: string; area: { x: number; y: number; w: number; h: number }; gland: Gland; sex: Sex }> = {
  stress: { label: 'Stress', area: { x: 1350, y: 470, w: 290, h: 58 }, gland: 'adrenal', sex: 'M' },
  fed: { label: 'Fed', area: { x: 1350, y: 532, w: 290, h: 58 }, gland: 'pancreas', sex: 'M' },
  fasting: { label: 'Fasting', area: { x: 1350, y: 594, w: 290, h: 58 }, gland: 'pancreas', sex: 'F' },
  cold: { label: 'Cold', area: { x: 1350, y: 656, w: 290, h: 58 }, gland: 'thyroid', sex: 'F' },
  puberty: { label: 'Puberty', area: { x: 1350, y: 718, w: 290, h: 58 }, gland: 'ovaries', sex: 'F' },
};

const HORMONE_CHIPS: Array<{ label: string; gland: Gland; area: Rect }> = [
  { label: 'TRH', gland: 'hypothalamus', area: { x: 240, y: 168, w: 128, h: 24 } },
  { label: 'CRH', gland: 'hypothalamus', area: { x: 240, y: 196, w: 128, h: 24 } },
  { label: 'GnRH', gland: 'hypothalamus', area: { x: 240, y: 224, w: 128, h: 24 } },
  { label: 'GHRH', gland: 'hypothalamus', area: { x: 240, y: 252, w: 128, h: 24 } },
  { label: 'Dopamine', gland: 'hypothalamus', area: { x: 240, y: 280, w: 128, h: 24 } },
  { label: 'TSH', gland: 'pituitary', area: { x: 240, y: 308, w: 128, h: 24 } },
  { label: 'ACTH', gland: 'pituitary', area: { x: 240, y: 336, w: 128, h: 24 } },
  { label: 'LH / FSH', gland: 'pituitary', area: { x: 240, y: 364, w: 128, h: 24 } },
  { label: 'Prolactin', gland: 'pituitary', area: { x: 240, y: 392, w: 128, h: 24 } },
  { label: 'Melatonin', gland: 'pineal', area: { x: 240, y: 420, w: 128, h: 24 } },
  { label: 'T3 / T4', gland: 'thyroid', area: { x: 240, y: 448, w: 128, h: 24 } },
  { label: 'PTH', gland: 'parathyroid', area: { x: 240, y: 476, w: 128, h: 24 } },
  { label: 'Calcitonin', gland: 'thyroid', area: { x: 240, y: 504, w: 128, h: 24 } },
  { label: 'Cortisol', gland: 'adrenal', area: { x: 240, y: 532, w: 128, h: 24 } },
  { label: 'Aldosterone', gland: 'adrenal', area: { x: 240, y: 560, w: 128, h: 24 } },
  { label: 'Insulin', gland: 'pancreas', area: { x: 240, y: 588, w: 128, h: 24 } },
  { label: 'Glucagon', gland: 'pancreas', area: { x: 240, y: 616, w: 128, h: 24 } },
  { label: 'Epinephrine', gland: 'adrenal', area: { x: 240, y: 644, w: 128, h: 24 } },
  { label: 'ANP', gland: 'heart', area: { x: 240, y: 672, w: 128, h: 24 } },
  { label: 'Erythropoietin', gland: 'kidney', area: { x: 240, y: 700, w: 128, h: 24 } },
  { label: 'Renin', gland: 'kidney', area: { x: 240, y: 728, w: 128, h: 24 } },
];

const BODY_HOTSPOTS = (Object.keys(GLANDS) as Gland[])
  .flatMap(gland =>
    Object.entries(GLANDS[gland].points).flatMap(([sexKey, points]) =>
      (points ?? []).map((point, index) => ({ gland, sexKey: sexKey as Sex, point, index }))
    )
  )
  .sort((a, b) => (b.point.size ?? 24) - (a.point.size ?? 24));

const EndocrineGlandsLab: React.FC<EndocrineGlandsLabProps> = ({ topic, onExit }) => {
  const [selectedGland, setSelectedGland] = useState<Gland>('thyroid');
  const [selectedSex, setSelectedSex] = useState<Sex>('M');
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('stress');
  const [pulseSeed, setPulseSeed] = useState(0);

  const selected = GLANDS[selectedGland];
  const highlightPoints = useMemo(() => {
    const points = selected.points[selectedSex] ?? selected.points.M ?? selected.points.F ?? [];
    if (selectedGland === 'thyroid' || selectedGland === 'adrenal' || selectedGland === 'pancreas') {
      return points;
    }
    return points;
  }, [selected, selectedGland, selectedSex]);

  const chooseGland = (gland: Gland, sex: Sex = selectedSex) => {
    const resolvedSex = GLANDS[gland].points[sex] ? sex : GLANDS[gland].points.M ? 'M' : 'F';
    setSelectedGland(gland);
    setSelectedSex(resolvedSex);
    setPulseSeed(seed => seed + 1);
  };

  const chooseScenario = (scenario: Scenario) => {
    const next = SCENARIOS[scenario];
    setSelectedScenario(scenario);
    chooseGland(next.gland, next.sex);
  };

  const simulationComponent = (
    <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
        <img
          src={IMAGE_SRC}
          alt="Human Endocrine System simulation"
          className="absolute inset-0 h-full w-full select-none object-cover"
          draggable={false}
        />

      {(Object.keys(GLANDS) as Gland[]).map(gland => {
        const area = GLANDS[gland].row;
        return (
          <button
            key={gland}
            type="button"
            aria-label={`Select ${GLANDS[gland].label}`}
            onClick={() => chooseGland(gland)}
            className="absolute rounded-xl outline-none transition focus-visible:ring-4 focus-visible:ring-sky-400/80"
            style={{ left: area.x, top: area.y, width: area.w, height: area.h }}
          />
        );
      })}

      {(Object.keys(SCENARIOS) as Scenario[]).map(scenario => {
        const item = SCENARIOS[scenario];
        return (
          <button
            key={scenario}
            type="button"
            aria-label={`Run ${item.label} scenario`}
            onClick={() => chooseScenario(scenario)}
            className="absolute rounded-xl outline-none transition focus-visible:ring-4 focus-visible:ring-sky-400/80"
            style={{ left: item.area.x, top: item.area.y, width: item.area.w, height: item.area.h }}
          />
        );
      })}

      {HORMONE_CHIPS.map(chip => (
        <button
          key={chip.label}
          type="button"
          aria-label={`Select ${chip.label}`}
          onClick={() => chooseGland(chip.gland)}
          className="absolute rounded-full outline-none transition focus-visible:ring-4 focus-visible:ring-sky-400/80"
          style={{ left: chip.area.x, top: chip.area.y, width: chip.area.w, height: chip.area.h }}
        />
      ))}

      {BODY_HOTSPOTS.map(({ gland, sexKey, point, index }) => (
        <button
          key={`${gland}-${sexKey}-${index}`}
          type="button"
          aria-label={`Select ${GLANDS[gland].label} on ${sexKey === 'M' ? 'male' : 'female'} body`}
          onClick={() => chooseGland(gland, sexKey as Sex)}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: point.x, top: point.y, width: point.hitSize ?? point.size ?? 24, height: point.hitSize ?? point.size ?? 24 }}
        />
      ))}

      {highlightPoints.map((point, index) => (
        <div
          key={`${selectedGland}-${selectedSex}-${index}-${pulseSeed}`}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] bg-white/15 shadow-[0_0_30px_rgba(255,255,255,0.95)]"
          style={{
            left: point.x,
            top: point.y,
            width: point.size ?? 42,
            height: point.size ?? 42,
            borderColor: selected.color,
            boxShadow: `0 0 0 7px ${toRgba(selected.color, 0.16)}, 0 0 34px ${toRgba(selected.color, 0.85)}`,
            animation: 'endocrine-ping 1.5s ease-out 2',
          }}
        />
      ))}

      {highlightPoints[0] && (
        <div
          key={`label-${selectedGland}-${selectedSex}-${pulseSeed}`}
          className="pointer-events-none absolute rounded-xl border bg-white/95 px-3 py-2 text-xs font-black text-slate-900 shadow-xl"
          style={{
            left: Math.min(highlightPoints[0].x + 28, W - 315),
            top: Math.max(highlightPoints[0].y - 20, 92),
            borderColor: selected.color,
            color: selected.color,
          }}
        >
          {selected.label}
        </div>
      )}

      <div
        className="absolute rounded-[18px] border border-slate-200 bg-white/95 shadow-[0_12px_36px_rgba(15,23,42,0.10)] backdrop-blur-sm"
        style={{ left: 1337, top: 28, width: 312, height: 378 }}
      >
        <div className="flex items-center gap-2 px-5 pt-4 text-[20px] font-black text-[#183a63]">
          <span className="flex items-center justify-center rounded-lg border border-slate-200 text-[#3a6f9a]" style={{ width: 34, height: 34 }}>O</span>
          Focused gland
        </div>
        <div className="mx-3 mt-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex gap-4">
            <div
              className="flex h-[116px] w-[108px] shrink-0 items-center justify-center rounded-xl border-2"
              style={{ borderColor: selected.color, backgroundColor: toRgba(selected.color, 0.11) }}
            >
              <GlandGlyph gland={selectedGland} color={selected.color} />
            </div>
            <div className="min-w-0">
              <div className="text-[19px] font-black leading-tight" style={{ color: selected.color }}>
                {selected.label}
              </div>
              <div className="mt-2 text-[12px] font-bold leading-snug text-[#27476c]">
                {selected.hormones.slice(0, 3).join(', ')} coordinate {selected.targets.slice(0, 3).join(', ')}.
              </div>
            </div>
          </div>
          <div className="mt-4 text-[13px] font-black text-[#183a63]">Key hormones</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {selected.hormones.slice(0, 4).map(hormone => (
              <span
                key={hormone}
                className="rounded-full border px-3 py-1 text-[12px] font-black"
                style={{ borderColor: selected.color, color: selected.color, backgroundColor: toRgba(selected.color, 0.14) }}
              >
                {hormone}
              </span>
            ))}
          </div>
          <div className="mt-4 text-[13px] font-black text-[#183a63]">Target organs</div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {selected.targets.slice(0, 4).map((target, index) => (
              <div key={target} className="min-w-0 text-center">
                <div
                  className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-[18px] font-black"
                  style={{ color: selected.color, backgroundColor: toRgba(selected.color, 0.10) }}
                >
                  {['H', 'B', 'L', 'M'][index % 4]}
                </div>
                <div className="mt-1 truncate text-[10px] font-bold text-[#27476c]">{target.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute rounded-xl border-2 bg-white/75" style={{
        left: SCENARIOS[selectedScenario].area.x,
        top: SCENARIOS[selectedScenario].area.y,
        width: SCENARIOS[selectedScenario].area.w,
        height: SCENARIOS[selectedScenario].area.h,
        borderColor: GLANDS[SCENARIOS[selectedScenario].gland].color,
      }} />

      <div
        className="pointer-events-none absolute rounded-xl border-2 bg-white/35"
        style={{
          left: selected.row.x,
          top: selected.row.y,
          width: selected.row.w,
          height: selected.row.h,
          borderColor: selected.color,
          boxShadow: `0 0 22px ${toRgba(selected.color, 0.38)}`,
        }}
      />

        <style>{`
          @keyframes endocrine-ping {
            0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.95; }
            70% { transform: translate(-50%, -50%) scale(1.35); opacity: 0.35; }
            100% { transform: translate(-50%, -50%) scale(1.45); opacity: 0.95; }
          }
        `}</style>
      </div>
    </div>
  );

  return (
    <TopicLayoutContainer
      topic={topic}
      onExit={onExit}
      SimulationComponent={simulationComponent}
      simulationStageWidth={W}
      simulationStageHeight={H}
      simulationAreaFlex="1 1 100%"
      simulationClassName="overflow-hidden bg-white"
      rootClassName="bg-white text-slate-900"
    />
  );
};

const GlandGlyph: React.FC<{ gland: Gland; color: string }> = ({ gland, color }) => {
  if (gland === 'thyroid') {
    return (
      <svg viewBox="0 0 80 80" className="h-20 w-20" aria-hidden="true">
        <ellipse cx="28" cy="40" rx="15" ry="28" fill={color} />
        <ellipse cx="52" cy="40" rx="15" ry="28" fill={color} />
        <rect x="34" y="34" width="12" height="14" rx="5" fill={color} />
      </svg>
    );
  }
  if (gland === 'adrenal') {
    return (
      <svg viewBox="0 0 80 80" className="h-20 w-20" aria-hidden="true">
        <path d="M14 50 C24 22 56 22 66 50 C50 42 30 42 14 50 Z" fill={color} />
        <ellipse cx="28" cy="54" rx="10" ry="16" fill={color} opacity="0.75" />
        <ellipse cx="52" cy="54" rx="10" ry="16" fill={color} opacity="0.75" />
      </svg>
    );
  }
  if (gland === 'pancreas') {
    return (
      <svg viewBox="0 0 80 80" className="h-20 w-20" aria-hidden="true">
        <path d="M10 43 C25 27 60 28 70 43 C57 51 28 55 10 43 Z" fill={color} />
        <circle cx="24" cy="42" r="5" fill="white" opacity="0.55" />
        <circle cx="39" cy="43" r="4" fill="white" opacity="0.45" />
        <circle cx="53" cy="42" r="4" fill="white" opacity="0.45" />
      </svg>
    );
  }
  if (gland === 'testes' || gland === 'ovaries' || gland === 'parathyroid') {
    return (
      <svg viewBox="0 0 80 80" className="h-20 w-20" aria-hidden="true">
        <circle cx="28" cy="40" r="15" fill={color} />
        <circle cx="52" cy="40" r="15" fill={color} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20" aria-hidden="true">
      <circle cx="40" cy="40" r="24" fill={color} />
      <circle cx="32" cy="34" r="6" fill="white" opacity="0.45" />
      <circle cx="48" cy="47" r="5" fill="white" opacity="0.35" />
    </svg>
  );
};

const toRgba = (hex: string, alpha: number) => {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default EndocrineGlandsLab;
