import React from 'react';

/**
 * Full-screen single-image infographic for Electromagnetic Induction.
 * One composed illustration (magnet → coil → galvanometer) with the whole
 * concept annotated around it — designed to fill a smartboard.
 * NCERT Class 12 Physics, Ch 6 — verified via the class-12-physics MCP server.
 *
 * Brand palette: red #B3202F, yellow #FFC748, dark #2A0A0E. Physics colours:
 * magnet N = red, S = blue; magnetic field = indigo; induced current = amber.
 */

const RED = '#B3202F';
const YELLOW = '#FFC748';
const DARK = '#2A0A0E';
const INDIGO = '#4338ca';
const COPPER = '#c2703d';
const SLATE = '#475569';

const Card: React.FC<{
  x: number; y: number; w: number; h: number; title: string; accent?: string; children?: React.ReactNode;
}> = ({ x, y, w, h, title, accent = RED, children }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={16} fill="#ffffff" stroke="#e2e8f0" strokeWidth={1.5} />
    <rect x={x} y={y} width={6} height={h} rx={3} fill={accent} />
    <text x={x + 20} y={y + 28} fontSize={17} fontWeight={800} fill={accent} letterSpacing={0.4}>{title}</text>
    {children}
  </g>
);

const EMIScene: React.FC = () => (
  <svg viewBox="0 0 1280 720" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img"
    aria-label="Electromagnetic induction infographic: a bar magnet moving into a coil induces a current shown on a galvanometer">
    <defs>
      <linearGradient id="emi-hdr" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={RED} />
        <stop offset="1" stopColor="#7f1d24" />
      </linearGradient>
      <marker id="emi-arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
        <path d="M0 0 L6 3 L0 6 Z" fill={YELLOW} />
      </marker>
      <marker id="emi-cur" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
        <path d="M0 0 L6 3 L0 6 Z" fill="#f59e0b" />
      </marker>
      <marker id="emi-field" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
        <path d="M0 0 L6 3 L0 6 Z" fill={INDIGO} />
      </marker>
    </defs>

    <rect x="0" y="0" width="1280" height="720" fill="#f8fafc" />

    {/* Header */}
    <rect x="0" y="0" width="1280" height="86" fill="url(#emi-hdr)" />
    <text x="40" y="42" fontSize="30" fontWeight="900" fill="#ffffff" letterSpacing={0.6}>ELECTROMAGNETIC INDUCTION</text>
    <text x="40" y="68" fontSize="16" fontWeight="600" fill={YELLOW}>Faraday’s Law &amp; Lenz’s Law — how a moving magnet makes electricity</text>
    <rect x="1090" y="28" width="150" height="30" rx="15" fill="rgba(255,255,255,0.16)" />
    <text x="1165" y="48" fontSize="13" fontWeight="800" fill="#ffffff" textAnchor="middle">NCERT XII · Ch 6</text>

    {/* ===== CENTRAL ILLUSTRATION ===== */}
    {/* Magnetic field lines from magnet N-pole through the coil */}
    {[-70, -35, 0, 35, 70].map((dy, i) => (
      <path key={i}
        d={`M 470 ${360 + dy} C 560 ${360 + dy * 0.5}, 640 ${360 + dy * 0.4}, 735 ${360 + dy * 0.35}`}
        fill="none" stroke={INDIGO} strokeWidth={2} opacity={0.5}
        markerEnd={i === 2 ? 'url(#emi-field)' : undefined} />
    ))}
    <text x="560" y="258" fontSize="13" fontWeight="700" fill={INDIGO}>magnetic field  B</text>

    {/* Bar magnet */}
    <g>
      <rect x="300" y="333" width="150" height="54" rx="6" fill="#e5e7eb" stroke={SLATE} strokeWidth="1.5" />
      <rect x="375" y="333" width="75" height="54" rx="6" fill={RED} />
      <rect x="300" y="333" width="75" height="54" fill="#2563eb" />
      <rect x="300" y="333" width="75" height="54" rx="6" fill="none" />
      <text x="337" y="367" fontSize="24" fontWeight="900" fill="#ffffff" textAnchor="middle">S</text>
      <text x="412" y="367" fontSize="24" fontWeight="900" fill="#ffffff" textAnchor="middle">N</text>
      {/* motion arrow */}
      <line x1="360" y1="312" x2="470" y2="312" stroke={YELLOW} strokeWidth="5" markerEnd="url(#emi-arrow)" />
      <text x="405" y="303" fontSize="15" fontWeight="800" fill={DARK} textAnchor="middle">motion  v</text>
    </g>

    {/* Coil / solenoid (turns as ellipses) */}
    <g>
      {[0, 1, 2, 3, 4, 5, 6].map(k => (
        <ellipse key={k} cx={745 + k * 26} cy={360} rx={13} ry={72} fill="none" stroke={COPPER} strokeWidth={5} />
      ))}
      {/* current direction ticks on the near side of each turn */}
      {[0, 1, 2, 3, 4, 5, 6].map(k => (
        <line key={k} x1={745 + k * 26} y1={288} x2={745 + k * 26} y2={300} stroke="#f59e0b" strokeWidth={3} markerEnd="url(#emi-cur)" />
      ))}
      <text x="820" y="250" fontSize="13" fontWeight="800" fill="#b45309" textAnchor="middle">induced current  I</text>
    </g>

    {/* Leads from coil to galvanometer */}
    <path d="M 745 432 L 745 486 L 690 486" fill="none" stroke={COPPER} strokeWidth={4} />
    <path d="M 901 432 L 901 486 L 758 486" fill="none" stroke={COPPER} strokeWidth={4} />
    <polygon points="700,480 686,486 700,492" fill="#f59e0b" />

    {/* Galvanometer */}
    <g>
      <circle cx="724" cy="510" r="34" fill="#ffffff" stroke={SLATE} strokeWidth="2.5" />
      <path d="M 700 528 A 30 30 0 0 1 748 528" fill="none" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="724" y1="510" x2="740" y2="486" stroke={RED} strokeWidth="3" />
      <circle cx="724" cy="510" r="3.5" fill={DARK} />
      <text x="724" y="556" fontSize="13" fontWeight="800" fill={SLATE} textAnchor="middle">G</text>
      <text x="724" y="590" fontSize="12" fontWeight="700" fill={SLATE} textAnchor="middle">needle deflects → current flows</text>
    </g>

    {/* Big takeaway under the scene */}
    <text x="620" y="640" fontSize="15" fontWeight="800" fill={DARK} textAnchor="middle">Move the magnet → flux changes → emf is induced.  Hold it still → no change → no current.</text>

    {/* ===== LEFT CALLOUTS ===== */}
    <Card x={36} y={118} w={300} h={132} title="WHAT IS EMI?" accent={RED}>
      <text x={56} y={168} fontSize={14} fill="#334155">A <tspan fontWeight="800">changing magnetic flux</tspan></text>
      <text x={56} y={190} fontSize={14} fill="#334155">through a coil sets up an</text>
      <text x={56} y={212} fontSize={14} fill="#334155">induced <tspan fontWeight="800">emf</tspan> (and current).</text>
      <text x={56} y={236} fontSize={13} fill={SLATE}>Basis of every generator.</text>
    </Card>

    <Card x={36} y={266} w={300} h={150} title="FARADAY’S LAW" accent={YELLOW}>
      <rect x={56} y={286} width={258} height={46} rx={8} fill="#fff7e6" stroke="#fde68a" />
      <text x={185} y={316} fontSize={22} fontWeight={900} fill={DARK} textAnchor="middle" fontFamily="ui-monospace, monospace">ε = − N · dΦ/dt</text>
      <text x={56} y={356} fontSize={13} fill="#334155">• Faster flux change → larger emf</text>
      <text x={56} y={378} fontSize={13} fill="#334155">• More turns N → larger emf</text>
      <text x={56} y={400} fontSize={13} fill={SLATE}>The minus sign is Lenz’s law.</text>
    </Card>

    {/* ===== RIGHT CALLOUTS ===== */}
    <Card x={944} y={118} w={300} h={150} title="MAGNETIC FLUX" accent={INDIGO}>
      <rect x={964} y={138} width={150} height={46} rx={8} fill="#eef2ff" stroke="#c7d2fe" />
      <text x={1039} y={168} fontSize={21} fontWeight={900} fill={DARK} textAnchor="middle" fontFamily="ui-monospace, monospace">Φ = B·A·cosθ</text>
      {/* tiny inset: area with field at angle */}
      <rect x={1128} y={140} width={92} height={64} rx={6} fill="#ffffff" stroke="#e2e8f0" />
      <rect x={1150} y={158} width={40} height={30} fill="#eef2ff" stroke={INDIGO} strokeWidth={1.5} />
      <line x1={1170} y1={173} x2={1170} y2={150} stroke={INDIGO} strokeWidth={2} markerEnd="url(#emi-field)" />
      <text x={1176} y={150} fontSize={11} fill={INDIGO}>θ</text>
      <text x={964} y={204} fontSize={13} fill="#334155">Depends on field B, area A,</text>
      <text x={964} y={226} fontSize={13} fill="#334155">and the tilt angle θ.</text>
      <text x={964} y={252} fontSize={12} fontWeight={700} fill={SLATE}>Unit: weber (Wb)</text>
    </Card>

    <Card x={944} y={284} w={300} h={150} title="LENZ’S LAW" accent={RED}>
      <text x={964} y={314} fontSize={14} fill="#334155">The induced current always</text>
      <text x={964} y={336} fontSize={14} fill="#334155"><tspan fontWeight="800">opposes the change</tspan> that</text>
      <text x={964} y={358} fontSize={14} fill="#334155">created it.</text>
      <rect x={964} y={372} width={258} height={44} rx={8} fill="#fef2f2" stroke="#fecaca" />
      <text x={1093} y={392} fontSize={12.5} fontWeight={700} fill={RED} textAnchor="middle">Magnet approaches N-pole →</text>
      <text x={1093} y={408} fontSize={12.5} fontWeight={700} fill={RED} textAnchor="middle">coil face becomes N to repel it</text>
    </Card>

    {/* ===== BOTTOM BAND ===== */}
    {[
      { x: 36, title: 'MOTIONAL EMF', body: 'Rod length l moving at v', eq: 'ε = B l v', accent: YELLOW },
      { x: 452, title: 'AC GENERATOR', body: 'Coil spinning in a field', eq: 'ε = N B A ω sin ωt', accent: INDIGO },
      { x: 868, title: 'REAL-WORLD USES', body: 'Generators · transformers', eq: 'induction cooktops · EV brakes', accent: RED },
    ].map((c, i) => (
      <g key={i}>
        <rect x={c.x} y={656} width={376} height={50} rx={12} fill="#ffffff" stroke="#e2e8f0" strokeWidth={1.5} />
        <rect x={c.x} y={656} width={6} height={50} rx={3} fill={c.accent} />
        <text x={c.x + 22} y={678} fontSize={13} fontWeight={900} fill={c.accent}>{c.title}</text>
        <text x={c.x + 22} y={697} fontSize={12.5} fill="#334155">{c.body}</text>
        <text x={c.x + 366} y={688} fontSize={14} fontWeight={800} fill={DARK} textAnchor="end" fontFamily="ui-monospace, monospace">{c.eq}</text>
      </g>
    ))}
  </svg>
);

export default EMIScene;
