import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outRoot = path.join(root, 'public', 'infographics', 'generated');
const manifestPath = path.join(root, 'components', 'infographics', 'generatedTopicInfographics.ts');
const dataFiles = [
  path.join(root, 'data', 'grades', '11th', 'index.ts'),
  path.join(root, 'data', 'grades', '12th', 'index.ts'),
];

const customPhysicsIds = new Set([
  'dimensional-analysis',
  'position-velocity-acceleration-graphs',
  'projectile-motion',
  'static-kinetic-friction',
  'newtons-laws-of-motion',
  'conservation-of-momentum',
  'work-energy-theorem',
  'conservation-of-angular-momentum',
  'centre-of-mass-torque',
  'moment-of-inertia',
  'conservation-mechanical-energy',
  'keplers-laws-planetary-motion',
  'mechanical-properties-solids',
  'stokes-law',
  'fluid-dynamics',
  'pascals-law',
  'surface-tension',
  'carnot-engine',
  'zeroth-law',
  'thermodynamic-processes',
  'thermal-expansion-calorimetry',
  'heat-transfer-blackbody-radiation',
  'kinetic-theory',
  'mean-free-path',
  'equipartition',
  'shm-spring',
  'simple-pendulum',
  'wave-motion',
  'standing-waves',
  'magnetism-and-matter',
  'moving-charges-magnetism',
  'current-electricity',
  'electrostatic-potential-capacitance',
  'electric-charges-fields',
  'emi',
  'ac',
  'em_waves',
  'ray_optics',
  'wave_optics',
  'polarisation',
  'dual_nature',
  'atoms',
  'nuclei',
  'semiconductors',
]);

const subjectTheme = {
  Chemistry: {
    accent: '#0891b2',
    soft: '#ecfeff',
    mid: '#a5f3fc',
    icon: 'chemistry',
    misconceptions: [
      'Names, structures, and mechanisms must be linked together.',
      'Reaction arrows show electron or species change, not decoration.',
      'Conditions and medium often decide the observed product.',
    ],
  },
  Biology: {
    accent: '#16a34a',
    soft: '#f0fdf4',
    mid: '#bbf7d0',
    icon: 'biology',
    misconceptions: [
      'Structure and function should be read together.',
      'Flow charts show sequence, not isolated facts.',
      'Examples support the rule; they do not replace the concept.',
    ],
  },
  Physics: {
    accent: '#2563eb',
    soft: '#eff6ff',
    mid: '#bfdbfe',
    icon: 'physics',
    misconceptions: [
      'Formula use must follow the stated assumptions.',
      'Vectors need direction as well as magnitude.',
      'Graphs and diagrams encode physical meaning.',
    ],
  },
};

function extractString(block, key) {
  const single = new RegExp(`${key}: '((?:\\\\'|[^'])*)'`).exec(block);
  if (single) return single[1].replace(/\\'/g, "'");
  const double = new RegExp(`${key}: "((?:\\\\"|[^"])*)"`).exec(block);
  if (double) return double[1].replace(/\\"/g, '"');
  return '';
}

function parseTopics() {
  const topics = [];
  for (const file of dataFiles) {
    const grade = file.includes(`${path.sep}11th${path.sep}`) ? '11th' : '12th';
    const text = fs.readFileSync(file, 'utf8');
    const blocks = [...text.matchAll(/\{[\s\S]*?id: '[^']+'[\s\S]*?\n\s*\}/g)].map((match) => match[0]);
    for (const block of blocks) {
      const topic = {
        id: extractString(block, 'id'),
        title: extractString(block, 'title'),
        subject: extractString(block, 'subject'),
        grade,
        unit: extractString(block, 'unit'),
        chapter: extractString(block, 'chapter'),
        branch: extractString(block, 'branch'),
        description: extractString(block, 'description'),
      };
      if (topic.id && topic.title && topic.subject) topics.push(topic);
    }
  }
  return topics;
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrap(value, max = 42) {
  const words = String(value ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    if (current && `${current} ${word}`.length > max) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function dedupe(items) {
  return [...new Set(items.filter(Boolean).map((item) => item.trim()).filter(Boolean))];
}

function phrases(topic) {
  const text = `${topic.title}. ${topic.chapter}. ${topic.branch}. ${topic.description}`;
  const parts = text
    .split(/[.;:,—-]/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => part.length > 12 && part.length < 110);
  const defaults = [
    `Connect ${topic.chapter || topic.title} to the simulation controls`,
    `Track cause, process, and outcome`,
    `Use the diagram before memorising terms`,
  ];
  return dedupe([...parts, ...defaults]).slice(0, 8);
}

function panel(title, lines, x, y, w, h, theme) {
  let cursor = y + 88;
  const body = lines.slice(0, 4).map((line) => {
    const wrapped = wrap(line, Math.floor((w - 78) / 12));
    const row = `
      <circle cx="${x + 30}" cy="${cursor - 8}" r="5" fill="${theme.accent}"/>
      ${wrapped.map((item, i) => `<text x="${x + 48}" y="${cursor + i * 27}" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="650" fill="#0f172a">${esc(item)}</text>`).join('')}`;
    cursor += wrapped.length * 27 + 14;
    return row;
  }).join('');

  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
      <rect x="${x}" y="${y}" width="${w}" height="52" rx="10" fill="#eff6ff"/>
      <rect x="${x}" y="${y + 34}" width="${w}" height="18" fill="#eff6ff"/>
      <rect x="${x + 14}" y="${y + 13}" width="8" height="25" rx="4" fill="${theme.accent}"/>
      <text x="${x + 34}" y="${y + 36}" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="950" fill="#0f172a">${esc(title)}</text>
      ${body}
    </g>`;
}

function textBlock(lines, x, y, options = {}) {
  const size = options.size ?? 24;
  const weight = options.weight ?? 750;
  const fill = options.fill ?? '#0f172a';
  return lines.map((line, i) => `<text x="${x}" y="${y + i * Math.round(size * 1.32)}" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(line)}</text>`).join('');
}

function centralVisual(topic, theme, keyPhrases) {
  const icon = theme.icon;
  const titleWords = wrap(topic.title, 24).slice(0, 3);
  const label = topic.subject.toUpperCase();

  const chemistry = `
    <g>
      <path d="M705 420 C815 300 1085 300 1195 420" fill="none" stroke="#38bdf8" stroke-width="4" opacity="0.45"/>
      <path d="M705 650 C815 770 1085 770 1195 650" fill="none" stroke="#38bdf8" stroke-width="4" opacity="0.45"/>
      <circle cx="950" cy="478" r="104" fill="white" stroke="${theme.accent}" stroke-width="7"/>
      <circle cx="830" cy="575" r="54" fill="${theme.mid}" stroke="${theme.accent}" stroke-width="5"/>
      <circle cx="1085" cy="585" r="62" fill="#cffafe" stroke="${theme.accent}" stroke-width="5"/>
      <line x1="880" y1="550" x2="910" y2="510" stroke="#0f172a" stroke-width="7"/>
      <line x1="1005" y1="520" x2="1048" y2="558" stroke="#0f172a" stroke-width="7"/>
      <path d="M780 695 C895 630 1038 635 1165 695" fill="none" stroke="${theme.accent}" stroke-width="7" stroke-linecap="round"/>
      <text x="950" y="490" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="40" font-weight="950" fill="#0f172a">REACTION</text>
      <text x="950" y="538" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="850" fill="${theme.accent}">structure -> property</text>
      <text x="780" y="378" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="850" fill="#0f172a">BOND / ION</text>
      <text x="1078" y="378" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="850" fill="#0f172a">ENERGY</text>
    </g>`;

  const biology = `
    <g>
      <path d="M705 430 C828 298 1072 298 1195 430" fill="none" stroke="#38bdf8" stroke-width="4" opacity="0.42"/>
      <path d="M705 650 C828 774 1072 774 1195 650" fill="none" stroke="#38bdf8" stroke-width="4" opacity="0.42"/>
      <ellipse cx="950" cy="520" rx="220" ry="140" fill="white" stroke="${theme.accent}" stroke-width="7"/>
      <circle cx="950" cy="520" r="62" fill="${theme.mid}" stroke="${theme.accent}" stroke-width="5"/>
      <path d="M785 520 C820 430 905 390 950 390 C1035 390 1110 455 1115 520 C1105 625 1025 665 950 665 C865 665 800 615 785 520Z" fill="none" stroke="#15803d" stroke-width="6"/>
      <path d="M860 445 C940 500 970 545 1050 600" fill="none" stroke="#0f172a" stroke-width="5" stroke-dasharray="12 10"/>
      <text x="950" y="525" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="39" font-weight="950" fill="#0f172a">SYSTEM</text>
      <text x="950" y="572" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="850" fill="${theme.accent}">structure -> function</text>
    </g>`;

  const generic = `
    <g>
      <rect x="730" y="378" width="440" height="260" rx="28" fill="white" stroke="${theme.accent}" stroke-width="7"/>
      <path d="M790 575 C890 440 1020 450 1120 525" fill="none" stroke="${theme.accent}" stroke-width="8" stroke-linecap="round"/>
      <circle cx="805" cy="575" r="18" fill="#ef4444"/>
      <circle cx="1120" cy="525" r="18" fill="#10b981"/>
      <text x="950" y="505" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="39" font-weight="950" fill="#0f172a">MODEL</text>
    </g>`;

  const art = icon === 'chemistry' ? chemistry : icon === 'biology' ? biology : generic;
  return `
    <g filter="url(#shadow)">
      <rect x="590" y="190" width="740" height="600" rx="14" fill="white" stroke="#bfdbfe" stroke-width="4"/>
      <path d="M626 320 C750 188 872 188 960 320 C1048 188 1170 188 1294 320" fill="none" stroke="#7dd3fc" stroke-width="4" opacity="0.32"/>
      <path d="M626 660 C750 792 872 792 960 660 C1048 792 1170 792 1294 660" fill="none" stroke="#7dd3fc" stroke-width="4" opacity="0.32"/>
      <text x="960" y="238" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="950" fill="#64748b">${esc(label)} DIAGRAM</text>
      ${art}
      ${textBlock(titleWords, 665, 316, { size: 34, weight: 950, fill: '#0f172a' })}
      <rect x="668" y="700" width="584" height="54" rx="14" fill="${theme.soft}" stroke="${theme.mid}" stroke-width="2"/>
      <text x="960" y="735" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="850" fill="${theme.accent}">${esc(wrap(keyPhrases[0] || topic.chapter || topic.title, 48)[0])}</text>
    </g>`;
}

function makeSvg(topic) {
  const theme = subjectTheme[topic.subject] ?? subjectTheme.Physics;
  const keyPhrases = phrases(topic);
  const core = keyPhrases.slice(0, 4);
  const flow = keyPhrases.slice(2, 6).length >= 3 ? keyPhrases.slice(2, 6) : keyPhrases.slice(0, 4);
  const teacherCue = [
    `Start with ${topic.title}`,
    `Ask: what changes, what remains constant, and why?`,
    `Close with a labelled diagram or pathway`,
  ];
  const links = [
    topic.branch ? `${topic.branch} practice` : `${topic.subject} practice`,
    topic.chapter ? `${topic.chapter} questions` : 'NCERT exercise links',
    'Simulation controls and observation table',
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="${esc(topic.title)} infographic">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#0f172a" flood-opacity="0.14"/>
    </filter>
  </defs>
  <rect width="1920" height="1080" fill="white"/>
  <rect x="26" y="26" width="1868" height="1028" rx="18" fill="#ffffff" stroke="#dbeafe" stroke-width="5"/>
  <text x="960" y="76" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="950" fill="#0f172a">${esc(topic.title.toUpperCase())}</text>
  <circle cx="878" cy="112" r="6" fill="#ef4444"/><circle cx="910" cy="112" r="6" fill="#2563eb"/><circle cx="942" cy="112" r="6" fill="#16a34a"/><circle cx="974" cy="112" r="6" fill="#f59e0b"/><circle cx="1006" cy="112" r="6" fill="#06b6d4"/>
  <text x="960" y="140" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="850" fill="#475569">${esc(`${topic.grade} ${topic.subject} - ${topic.chapter || topic.unit || topic.branch}`)}</text>
  ${centralVisual(topic, theme, keyPhrases)}
  <g filter="url(#shadow)">
    ${panel('WHAT IT SHOWS', core, 74, 168, 455, 410, theme)}
    ${panel('NCERT CHECKPOINTS', flow, 1390, 168, 455, 410, theme)}
    ${panel('TEACHER CUE', teacherCue, 74, 610, 455, 270, theme)}
    ${panel('COMMON MISCONCEPTIONS', theme.misconceptions, 1390, 610, 455, 270, theme)}
    ${panel('CLASSROOM APPLICATIONS', links, 590, 825, 740, 150, theme)}
  </g>
</svg>
`;
}

const allTopics = parseTopics();
const generatedTopics = allTopics.filter((topic) => !customPhysicsIds.has(topic.id));
fs.mkdirSync(outRoot, { recursive: true });

const manifest = [];
for (const topic of generatedTopics) {
  const subjectSlug = topic.subject.toLowerCase();
  const gradeSlug = topic.grade;
  const dir = path.join(outRoot, gradeSlug, subjectSlug);
  fs.mkdirSync(dir, { recursive: true });
  const fileName = `${topic.id}.svg`;
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, makeSvg(topic), 'utf8');
  manifest.push({
    topicId: topic.id,
    label: topic.title.length > 26 ? `${topic.title.slice(0, 23).trim()}...` : topic.title,
    description: `${topic.grade} ${topic.subject}: ${topic.chapter || topic.branch || topic.title}`,
    src: `/infographics/generated/${gradeSlug}/${subjectSlug}/${fileName}`,
    alt: `${topic.title} infographic`,
  });
}

const manifestBody = `export const GENERATED_TOPIC_INFOGRAPHICS = ${JSON.stringify(manifest, null, 2)} as const;\n`;
fs.writeFileSync(manifestPath, manifestBody, 'utf8');

console.log(`Generated ${generatedTopics.length} all-subject infographics in ${outRoot}`);
console.log(`Wrote manifest: ${manifestPath}`);
