import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import world from '../public/g/world.json';
import words from '../public/g/words.json';
import gib from '../public/g/gib.json';

// "E se os continentes entrassem em guerra?" — 9:16, 30 fps.
// Mapa em pixels do mosaico mundial z4 (mundo.jpg 4096 x 2283, recortado a partir de Y0).
// Tempos em segundos = narração (narr.wav, 54,4 s).
const W = 1080, H = 1920, FPS = 30;
export const GUERRA_LEN = Math.round(55.6 * FPS);
type Pt = [number, number];
type Country = {iso: string; name: string; c: string; d: string; bb: number[]};
const COUNTRIES = world.countries as Country[];
const CBB = world.cbb as unknown as Record<string, number[]>;
const Y0 = world.Y0 as number;
const WORDS = words as {w: string; s: number; e: number}[];
const FONT = 'Poppins';

const fh = typeof window !== 'undefined' ? delayRender('fontes-guerra') : 0;
if (typeof window !== 'undefined') {
  Promise.all(
    [['P-Bold', 700], ['P-ExtraBold', 800], ['P-SemiBold', 600]].map(([f, w]) =>
      new FontFace(FONT, `url(${staticFile(`fonts/${f}.ttf`)})`, {weight: String(w)}).load(),
    ),
  ).then((fs) => {
    fs.forEach((f) => (document as any).fonts.add(f));
    continueRender(fh);
  });
}

// ---------- util ----------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const io = (t: number, r: number[], o: number[], e = ease) => interpolate(t, r, o, {...clamp, easing: e});
const pop = (t: number, t0: number, d = 0.35) => io(t, [t0, t0 + d], [0, 1], Easing.out(Easing.back(1.8)));
const fade = (t: number, a: number, b: number, d = 0.25) => io(t, [a, a + d], [0, 1]) * io(t, [b - d, b], [1, 0]);
const px = (lon: number, lat: number): Pt => {
  const l = (lat * Math.PI) / 180;
  return [((lon + 180) / 360) * 4096, ((1 - Math.log(Math.tan(l) + 1 / Math.cos(l)) / Math.PI) / 2) * 4096 - Y0];
};
const rnd = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// ---------- times (continentes) ----------
type Team = 'NA' | 'SA' | 'EU' | 'AF' | 'AS' | 'OC';
const TEAM: Record<Team, {nome: string; cor: string; flag?: string; centro: Pt}> = {
  NA: {nome: 'AMÉRICA DO NORTE', cor: '#e63946', flag: 'us', centro: px(-100, 44)},
  SA: {nome: 'AMÉRICA DO SUL', cor: '#f4f4f4', flag: 'mercosul', centro: px(-60, -15)},
  EU: {nome: 'EUROPA', cor: '#2f6fe0', flag: 'eu', centro: px(14, 50)},
  AF: {nome: 'ÁFRICA', cor: '#2bb24c', flag: 'au_union', centro: px(20, 4)},
  AS: {nome: 'ÁSIA', cor: '#ffc61a', centro: px(95, 45)},
  OC: {nome: 'OCEANIA', cor: '#38d6e8', flag: 'au', centro: px(134, -25)},
};
const ORDER: Team[] = ['NA', 'SA', 'EU', 'AF', 'AS', 'OC'];
const LIGHT: Record<Team, number> = {NA: 0.55, SA: 0.85, EU: 1.15, AF: 1.45, AS: 1.75, OC: 2.05};

// pontos de referência
const P = {
  panama: px(-79.5, 9),
  usa: px(-98, 38),
  sa: px(-58, -12),
  oc: px(134, -25),
  china: px(104, 34),
  india: px(79, 22),
  af: px(20, 3),
  gib: px(-5.6, 36),
  suez: px(33, 29),
  horn: px(46, 8),
  eu: px(12, 49),
  atl: px(-38, 33),
  moscou: px(37.6, 55.7),
};

// ---------- câmera ----------
type Cam = {cx: number; cy: number; s: number};
// Gibraltar em pixels do mundo (patch z10: 64 px do patch = 1 px do mundo)
const gp = (u: number, v: number): Pt => [(gib.x0 * 256 + u) / 64, (gib.y0 * 256 + v) / 64 - Y0 + 1]; // +1: alinhamento medido no quadro
const GA = gp(gib.a[0], gib.a[1]), GB = gp(gib.b[0], gib.b[1]);
const GC: Pt = [(GA[0] + GB[0]) / 2, (GA[1] + GB[1]) / 2];
const WORLD: Cam = {cx: 2060, cy: 1180, s: 0.27};
const K: [number, Cam][] = [
  [0, {cx: 2000, cy: 1120, s: 0.31}],
  [2.7, {cx: 2080, cy: 1120, s: 0.35}],
  [3.5, {cx: 1150, cy: 1400, s: 0.62}],
  [9.0, {cx: 1180, cy: 1420, s: 0.66}],
  [10.6, {cx: 1150, cy: 1180, s: 0.5}],
  [14.2, {cx: 1180, cy: 1330, s: 0.54}],
  [15.2, {cx: 3420, cy: 1430, s: 0.5}],
  [20.8, {cx: 3330, cy: 1380, s: 0.53}],
  [21.6, {cx: 3150, cy: 1150, s: 0.72}],
  [23.4, {cx: 3100, cy: 1160, s: 0.74}],
  [24.4, WORLD],
  [25.8, {...WORLD, s: 0.28}],
  [27.0, {cx: 2240, cy: 1430, s: 0.72}],
  [32.6, {cx: 2250, cy: 1450, s: 0.76}],
  [34.8, {cx: 2160, cy: 1300, s: 0.68}],
  [36.0, {cx: GC[0], cy: GC[1] + 0.25, s: 300}],
  [38.1, {cx: GC[0], cy: GC[1] + 0.25, s: 320}],
  [39.2, {cx: 2200, cy: 1180, s: 0.5}],
  [40.8, {cx: 2210, cy: 1200, s: 0.52}],
  [41.9, WORLD],
  [45.2, {...WORLD, s: 0.285}],
  [46.0, {cx: 2330, cy: 1080, s: 0.47}],
  [49.0, {cx: 2280, cy: 980, s: 0.5}],
  [50.4, {cx: 1960, cy: 1060, s: 0.29}],
  [55.6, {cx: 1940, cy: 1060, s: 0.31}],
];
const camera = (t: number): Cam => {
  let i = 0;
  while (i < K.length - 2 && t >= K[i + 1][0]) i++;
  const [t0, a] = K[i], [t1, b] = K[i + 1];
  const u = io(t, [t0, t1], [0, 1], Easing.inOut(Easing.cubic));
  const la = Math.log(a.s), lb = Math.log(b.s);
  const s = Math.exp(la + (lb - la) * u);
  // em zoom grande o centro acompanha a escala (senão o alvo foge da tela)
  const w = (1 / s - 1 / a.s) / (1 / b.s - 1 / a.s || 1);
  const k = Math.abs(lb - la) > 1 ? w : u;
  return {cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k, s};
};
const TILT = 13; // graus

// ---------- bandeiras ----------
const flagUrl = (f: string) => staticFile(`g/fl/${f}.svg`);
const pathOf = (team: Team) => COUNTRIES.filter((c) => c.c === team).map((c) => c.d).join('');
const TEAM_D: Record<Team, string> = Object.fromEntries(ORDER.map((t) => [t, pathOf(t)])) as any;
const ASIA = COUNTRIES.filter((c) => c.c === 'AS');
const EUROPE_D = TEAM_D.EU;

// pintura que se espalha a partir de um ponto (máscara circular)
const Spread: React.FC<{id: string; o: Pt; r: number}> = ({id, o, r}) => (
  <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={4096} height={2400}>
    <circle cx={o[0]} cy={o[1]} r={Math.max(0, r)} fill="#fff" />
  </mask>
);

const FlagFill: React.FC<{team: Team; flag: string; d: string; id: string; opacity?: number; mask?: string}> = ({team, flag, d, id, opacity = 0.92, mask}) => {
  const b = CBB[team];
  // bandeira esticada sobre o retângulo útil do continente (sem ilhas distantes)
  const box = BOX[team] ?? b;
  return (
    <g mask={mask ? `url(#${mask})` : undefined} opacity={opacity}>
      <defs>
        <pattern id={id} patternUnits="userSpaceOnUse" x={box[0]} y={box[1]} width={box[2] - box[0]} height={box[3] - box[1]}>
          <image href={flagUrl(flag)} x={0} y={0} width={box[2] - box[0]} height={box[3] - box[1]} preserveAspectRatio="xMidYMid slice" />
        </pattern>
      </defs>
      <path d={d} fill={`url(#${id})`} />
    </g>
  );
};
// retângulos de enquadramento da bandeira (pixels do mundo)
const BOX: Partial<Record<Team, number[]>> = {
  NA: [px(-168, 72)[0], px(-168, 72)[1], px(-52, 8)[0], px(-52, 8)[1]],
  SA: [px(-82, 13)[0], px(-82, 13)[1], px(-34, -56)[0], px(-34, -56)[1]],
  EU: [px(-25, 71)[0], px(-25, 71)[1], px(45, 34)[0], px(45, 34)[1]],
  AF: [px(-18, 38)[0], px(-18, 38)[1], px(52, -35)[0], px(52, -35)[1]],
  OC: [px(112, -9)[0], px(112, -9)[1], px(180, -48)[0], px(180, -48)[1]],
};

const AsiaMosaic: React.FC<{opacity: number; mask?: string}> = ({opacity, mask}) => (
  <g opacity={opacity} mask={mask ? `url(#${mask})` : undefined}>
    <defs>
      {ASIA.map((c) => (
        <pattern key={c.iso + c.bb[0]} id={`as_${c.iso}_${c.bb[0]}`} patternUnits="userSpaceOnUse" x={c.bb[0]} y={c.bb[1]} width={Math.max(4, c.bb[2] - c.bb[0])} height={Math.max(3, c.bb[3] - c.bb[1])}>
          <image href={flagUrl(c.iso)} width={Math.max(4, c.bb[2] - c.bb[0])} height={Math.max(3, c.bb[3] - c.bb[1])} preserveAspectRatio="xMidYMid slice" />
        </pattern>
      ))}
    </defs>
    {ASIA.map((c) => (
      <path key={c.iso + c.bb[0]} d={c.d} fill={`url(#as_${c.iso}_${c.bb[0]})`} stroke="rgba(255,255,255,0.55)" strokeWidth={0.8} />
    ))}
  </g>
);

// ---------- mapa ----------
const MapLayer: React.FC<{t: number; c: Cam}> = ({t, c}) => {
  const lit = (team: Team) => io(t, [LIGHT[team], LIGHT[team] + 0.5], [0, 1], Easing.out(Easing.cubic));
  const rad = (team: Team) => {
    const b = CBB[team];
    return lit(team) * Math.hypot(b[2] - b[0], b[3] - b[1]) * 0.75;
  };
  // conquistas
  const usOverSA = io(t, [12.7, 14.1], [0, 1], Easing.inOut(Easing.cubic)) * 900;
  const euOverAF = io(t, [38.9, 40.2], [0, 1], Easing.inOut(Easing.cubic)) * io(t, [45.7, 46.5], [1, 0]) * 1100;
  const asOverAF = io(t, [46.1, 47.4], [0, 1], Easing.inOut(Easing.cubic)) * 1150;
  const asRing = io(t, [47.7, 48.6], [0, 1]);
  // escurecimento por cena (destaca quem fala)
  const dimOthers = (team: Team) => {
    const foco = (a: number, b: number, who: Team[]) => (who.includes(team) ? 0 : fade(t, a, b, 0.4));
    return Math.max(
      foco(3.4, 14.5, ['SA', 'NA']),
      foco(15.1, 23.5, ['OC', 'AS']),
      foco(27.0, 38.3, ['AF', 'EU']),
    );
  };
  const glow3 = fade(t, 41.3, 45.4, 0.3);
  // tremor da Ásia (sombra crescendo sobre a Oceania)
  const shadow = io(t, [18.3, 20.6], [0, 1], Easing.out(Easing.cubic)) * io(t, [23.4, 24.2], [1, 0]);
  const atl = io(t, [52.8, 53.8], [0, 1]);
  return (
    <svg width={4096} height={2283} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        {ORDER.map((team) => (
          <Spread key={team} id={`lit_${team}`} o={TEAM[team].centro} r={rad(team)} />
        ))}
        <Spread id="m_us_sa" o={P.panama} r={usOverSA} />
        <Spread id="m_eu_af" o={P.gib} r={euOverAF} />
        <Spread id="m_as_af" o={P.horn} r={asOverAF} />
        <filter id="sombra" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx={0} dy={2.2} stdDeviation={2.2} floodColor="#000" floodOpacity={0.55} />
        </filter>
        <filter id="brilho" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={3} />
        </filter>
        <radialGradient id="g_sombra">
          <stop offset="0%" stopColor="#ffc61a" stopOpacity={0.5} />
          <stop offset="70%" stopColor="#ffb000" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#ffb000" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="g_atl" x1="0" x2="1">
          <stop offset="0" stopColor="#7ff3ff" stopOpacity={0} />
          <stop offset="0.5" stopColor="#7ff3ff" stopOpacity={0.55} />
          <stop offset="1" stopColor="#7ff3ff" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* continentes com bandeira (adesivo levantado) */}
      <g filter="url(#sombra)">
        {ORDER.map((team) =>
          team === 'AS' ? (
            <g key={team} mask="url(#lit_AS)">
              <AsiaMosaic opacity={0.94} />
            </g>
          ) : (
            <FlagFill key={team} team={team} flag={TEAM[team].flag!} d={TEAM_D[team]} id={`f_${team}`} mask={`lit_${team}`} />
          ),
        )}
        {/* EUA descem pela América do Sul */}
        <FlagFill team="NA" flag="us" d={TEAM_D.SA} id="f_us_sa" mask="m_us_sa" opacity={0.95} />
        {/* Europa sobre a África */}
        <FlagFill team="EU" flag="eu" d={TEAM_D.AF} id="f_eu_af" mask="m_eu_af" opacity={0.95} />
        {/* Ásia sobre a África: amarelo do time */}
        <g mask="url(#m_as_af)">
          <path d={TEAM_D.AF} fill={TEAM.AS.cor} opacity={0.9} />
        </g>
      </g>
      {/* contorno aceso de cada continente */}
      {ORDER.map((team) => (
        <path key={'o' + team} d={TEAM_D[team]} fill="none" stroke="#fff" strokeOpacity={0.85 * lit(team)} strokeWidth={1.6 / Math.max(0.5, c.s) * 0.5 + 0.6} strokeLinejoin="round" />
      ))}
      {/* brilho dos três nucleares */}
      {(['NA', 'EU', 'AS'] as Team[]).map((team) => (
        <path key={'n' + team} d={TEAM_D[team]} fill="none" stroke={TEAM[team].cor} strokeWidth={7} opacity={glow3 * (0.55 + 0.45 * Math.sin(t * 9))} filter="url(#brilho)" />
      ))}
      {/* sombra amarela da Ásia sobre a Oceania */}
      {shadow > 0 && <ellipse cx={P.china[0] + 60} cy={P.china[1] + 120} rx={1100 * shadow} ry={820 * shadow} fill="url(#g_sombra)" />}
      {/* Europa cercada: anel amarelo */}
      {asRing > 0 && (
        <path d={EUROPE_D} fill="none" stroke={TEAM.AS.cor} strokeWidth={5} strokeDasharray="1600" strokeDashoffset={1600 * (1 - asRing)} opacity={0.95} />
      )}
      {asRing > 0 && <path d={EUROPE_D} fill="#000" opacity={0.28 * asRing} />}
      {/* escurece os outros na cena */}
      {ORDER.map((team) => {
        const d = dimOthers(team);
        return d > 0 ? <path key={'d' + team} d={TEAM_D[team]} fill="#03111f" opacity={0.42 * d} /> : null;
      })}
      {/* Atlântico aceso no fim */}
      {atl > 0 && (
        <g opacity={atl}>
          <ellipse cx={P.atl[0] + 30} cy={P.atl[1] + 40} rx={250} ry={520} fill="url(#g_atl)" opacity={0.6 + 0.25 * Math.sin(t * 4)} />
        </g>
      )}
    </svg>
  );
};

// ---------- placar de ogivas (FAS 2025) ----------
const OGIVAS: [Team, number][] = [['AS', 6549], ['NA', 5177], ['EU', 515], ['AF', 0], ['SA', 0], ['OC', 0]];
const Placar: React.FC<{t: number}> = ({t}) => {
  const o = io(t, [6.0, 6.5], [0, 1]);
  if (o <= 0) return null;
  const hi = (team: Team) => {
    if (team === 'SA') return fade(t, 7.7, 14.6);
    if (team === 'AF') return fade(t, 28.7, 30.4);
    if (team === 'OC') return fade(t, 15.0, 17.0);
    if (team === 'NA' || team === 'EU' || team === 'AS') return fade(t, 41.3, 45.4);
    return 0;
  };
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 70, opacity: o, transform: `translateY(${(1 - o) * -40}px)`, fontFamily: FONT}}>
      <div style={{textAlign: 'center', color: '#fff', fontWeight: 800, fontSize: 30, letterSpacing: 5, textShadow: '0 3px 10px rgba(0,0,0,0.6)'}}>OGIVAS NUCLEARES</div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 14, gap: 10}}>
        {OGIVAS.map(([team, n], i) => {
          const h = hi(team);
          const zero = n === 0;
          const blink = zero && h > 0 ? 0.5 + 0.5 * Math.cos(t * 14) : 0;
          const cnt = Math.round(n * io(t, [6.1 + i * 0.08, 7.3 + i * 0.08], [0, 1], Easing.out(Easing.cubic)));
          const short = {NA: 'AM. NORTE', SA: 'AM. SUL', EU: 'EUROPA', AF: 'ÁFRICA', AS: 'ÁSIA', OC: 'OCEANIA'}[team];
          return (
            <div key={team} style={{flex: 1, background: `rgba(6,22,40,${0.72 + 0.2 * h})`, borderRadius: 14, padding: '10px 4px 8px', textAlign: 'center',
              border: `3px solid ${h > 0 ? (zero ? `rgba(255,59,48,${0.4 + 0.6 * blink})` : TEAM[team].cor) : 'rgba(255,255,255,0.15)'}`,
              transform: `scale(${1 + 0.08 * h})`, boxShadow: '0 6px 18px rgba(0,0,0,0.45)'}}>
              <div style={{height: 26, display: 'flex', justifyContent: 'center'}}>
                {team === 'AS' ? (
                  <div style={{display: 'flex', gap: 2}}>
                    {['cn', 'ru', 'in'].map((f) => <Img key={f} src={flagUrl(f)} style={{height: 22, width: 22, objectFit: 'cover', borderRadius: 3}} />)}
                  </div>
                ) : (
                  <Img src={flagUrl(TEAM[team].flag!)} style={{height: 24, width: 36, objectFit: 'cover', borderRadius: 3, background: '#fff'}} />
                )}
              </div>
              <div style={{color: '#cfe0f0', fontWeight: 700, fontSize: 15, marginTop: 6}}>{short}</div>
              <div style={{color: zero ? (h > 0 ? '#ff3b30' : '#fff') : '#fff', fontWeight: 800, fontSize: 34, lineHeight: 1.1}}>{cnt.toLocaleString('pt-BR')}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- rótulos presos ao mapa ----------
const Tag: React.FC<{text: string; at: Pt; c: Cam; t0: number; t1: number; t: number; cor?: string; size?: number; dy?: number}> = ({text, at, c, t0, t1, t, cor = '#fff', size = 34, dy = 0}) => {
  const o = fade(t, t0, t1, 0.25);
  if (o <= 0) return null;
  const [x, y] = toScreen(c, at);
  const s = pop(t, t0);
  return (
    <div style={{position: 'absolute', left: x, top: y + dy, transform: `translate(-50%,-50%) scale(${s})`, opacity: o, fontFamily: FONT, fontWeight: 800, fontSize: size,
      color: '#0b1a2b', background: cor, padding: `${size * 0.16}px ${size * 0.45}px`, borderRadius: 10, whiteSpace: 'nowrap', boxShadow: '0 6px 16px rgba(0,0,0,0.45)'}}>
      {text}
    </div>
  );
};

// a tela é desenhada sem a inclinação; a inclinação é aplicada ao conjunto (mapa + rótulos) num mesmo plano
const toScreen = (c: Cam, p: Pt): Pt => [(p[0] - c.cx) * c.s + W / 2, (p[1] - c.cy) * c.s + H / 2];

// ---------- setas ----------
const Arrow: React.FC<{a: Pt; b: Pt; c: Cam; t: number; t0: number; t1: number; cor: string; bend?: number; dash?: boolean; w?: number}> = ({a, b, c, t, t0, t1, cor, bend = 0.25, dash, w = 14}) => {
  const p = io(t, [t0, t0 + 0.6], [0, 1], Easing.out(Easing.cubic));
  const o = fade(t, t0, t1, 0.3);
  if (o <= 0) return null;
  const A = toScreen(c, a), B = toScreen(c, b);
  const mx = (A[0] + B[0]) / 2 - (B[1] - A[1]) * bend, my = (A[1] + B[1]) / 2 + (B[0] - A[0]) * bend;
  const d = `M${A[0]},${A[1]} Q${mx},${my} ${B[0]},${B[1]}`;
  const len = Math.hypot(B[0] - A[0], B[1] - A[1]) * 1.25;
  const ang = (Math.atan2(B[1] - my, B[0] - mx) * 180) / Math.PI;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: o, overflow: 'visible'}}>
      <path d={d} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={w + 8} strokeLinecap="round" strokeDasharray={dash ? '2 26' : `${len}`} strokeDashoffset={dash ? -t * 60 : len * (1 - p)} />
      <path d={d} fill="none" stroke={cor} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash ? '2 26' : `${len}`} strokeDashoffset={dash ? -t * 60 : len * (1 - p)} />
      {p > 0.95 && !dash && (
        <polygon points="0,-22 40,0 0,22" fill={cor} transform={`translate(${B[0]},${B[1]}) rotate(${ang})`} stroke="rgba(0,0,0,0.3)" strokeWidth={3} />
      )}
    </svg>
  );
};

// ---------- peças do tabuleiro (Flow) ----------
// Cada peça: imagem recortada (public/g/pecas/NN.png), caminho no mapa, quica ao pousar.
type Peca = {img: string; path: Pt[]; t0: number; t1: number; out: number; size: number};
const L = (lon: number, lat: number) => px(lon, lat);
const PECAS: Peca[] = [
  // América do Sul sozinha
  {img: 'inf_branco', path: [L(-56, -12)], t0: 6.3, t1: 6.3, out: 14.0, size: 150},
  // América do Norte desce
  {img: 'inf_vermelho', path: [L(-102, 26), L(-88, 15), L(-79.5, 8.8), L(-70, 0)], t0: 12.6, t1: 14.1, out: 14.6, size: 140},
  {img: 'porta_vermelho', path: [L(-68, 27), L(-55, 12), L(-36, -6)], t0: 12.7, t1: 14.2, out: 14.6, size: 170},
  {img: 'tanque_vermelho', path: [L(-94, 22), L(-80, 7), L(-62, -14)], t0: 12.9, t1: 14.1, out: 14.6, size: 140},
  // Oceania sozinha no Pacífico
  {img: 'inf_ciano', path: [L(134, -25)], t0: 15.15, t1: 15.15, out: 23.4, size: 150},
  // Ásia: os dois maiores exércitos
  {img: 'inf_amarelo', path: [L(104, 34)], t0: 21.35, t1: 21.35, out: 23.6, size: 150},
  {img: 'inf_amarelo', path: [L(78, 21)], t0: 22.4, t1: 22.4, out: 23.6, size: 150},
  // África
  {img: 'inf_verde', path: [L(22, 5)], t0: 28.0, t1: 28.0, out: 34.7, size: 150},
  // Europa desce
  {img: 'tanque_azul', path: [L(-4, 40), L(-6, 33), L(-2, 22)], t0: 38.9, t1: 40.2, out: 41.2, size: 140},
  {img: 'inf_azul', path: [L(12, 46), L(13, 36), L(14, 24)], t0: 39.0, t1: 40.3, out: 41.2, size: 140},
  {img: 'navio_azul', path: [L(-14, 41), L(-9, 36.5)], t0: 38.95, t1: 40.2, out: 41.2, size: 150},
  // três continentes com bomba atômica
  {img: 'missil_vermelho', path: [L(-100, 40)], t0: 41.35, t1: 41.35, out: 45.4, size: 130},
  {img: 'missil_azul', path: [L(10, 50)], t0: 41.6, t1: 41.6, out: 45.4, size: 130},
  {img: 'missil_amarelo', path: [L(95, 50)], t0: 41.85, t1: 41.85, out: 45.4, size: 130},
  // Ásia entra pela África e cerca a Europa
  {img: 'inf_amarelo', path: [L(48, 24), L(42, 10), L(26, 2)], t0: 46.1, t1: 47.4, out: 50.2, size: 140},
  {img: 'inf_amarelo', path: [L(45, 56), L(30, 52)], t0: 47.7, t1: 48.6, out: 50.2, size: 130},
  {img: 'tanque_amarelo', path: [L(8, 20), L(10, 33)], t0: 47.8, t1: 48.7, out: 50.2, size: 130},
  {img: 'navio_amarelo', path: [L(64, 14), L(46, 12.5)], t0: 46.3, t1: 47.6, out: 50.2, size: 140},
  // frente a frente no Atlântico
  {img: 'porta_vermelho', path: [L(-66, 36), L(-50, 34)], t0: 52.8, t1: 53.8, out: 56, size: 120},
  {img: 'navio_amarelo', path: [L(-12, 36), L(-26, 34)], t0: 52.9, t1: 53.9, out: 56, size: 110},
  {img: 'inf_azul', path: [L(9, 48)], t0: 46.2, t1: 46.2, out: 50.2, size: 120},
];
const PecaView: React.FC<{p: Peca; c: Cam; t: number}> = ({p, c, t}) => {
  const o = io(t, [p.t0, p.t0 + 0.2], [0, 1]) * io(t, [p.out, p.out + 0.3], [1, 0]);
  if (o <= 0) return null;
  const u = p.t1 > p.t0 ? io(t, [p.t0, p.t1], [0, 1], Easing.inOut(Easing.quad)) : 1;
  let at: Pt = p.path[0];
  if (p.path.length > 1) {
    const seg = (p.path.length - 1) * u;
    const i = Math.min(p.path.length - 2, Math.floor(seg));
    const f = seg - i;
    at = [p.path[i][0] + (p.path[i + 1][0] - p.path[i][0]) * f, p.path[i][1] + (p.path[i + 1][1] - p.path[i][1]) * f];
  }
  const [x, y] = toScreen(c, at);
  const hop = u < 1 ? Math.abs(Math.sin(u * Math.PI * 6)) * 18 : 0;
  const land = u >= 1 ? 1 + 0.12 * Math.exp(-(t - p.t1) * 9) * Math.cos((t - p.t1) * 30) : 1;
  const sz = p.size * pop(t, p.t0, 0.3);
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: o}}>
      <div style={{position: 'absolute', left: -sz * 0.36, top: -sz * 0.08, width: sz * 0.72, height: sz * 0.2, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', filter: 'blur(6px)'}} />
      <Img src={staticFile(`g/pecas/${p.img}.png`)} style={{position: 'absolute', left: -sz / 2, top: -sz * 0.9 - hop, width: sz, height: sz, objectFit: 'contain', transform: `scale(${land})`, transformOrigin: '50% 90%'}} />
    </div>
  );
};

// ---------- contador / textos grandes ----------
const BigNumber: React.FC<{t: number}> = ({t}) => {
  const o = fade(t, 30.6, 33.2, 0.25);
  if (o <= 0) return null;
  const v = 1.5 * io(t, [30.7, 31.9], [0, 1], Easing.out(Easing.cubic));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', fontFamily: FONT, opacity: o, transform: `scale(${pop(t, 30.6, 0.4)})`}}>
      <div style={{fontWeight: 800, fontSize: 150, color: '#fff', lineHeight: 1, textShadow: '0 8px 24px rgba(0,0,0,0.6)'}}>{v.toFixed(1).replace('.', ',')}</div>
      <div style={{fontWeight: 800, fontSize: 48, color: TEAM.AF.cor, letterSpacing: 3, textShadow: '0 4px 14px rgba(0,0,0,0.7)'}}>BILHÃO DE PESSOAS</div>
    </div>
  );
};

// pontos de população (África)
const r1 = rnd(11);
const AF_DOTS: Pt[] = Array.from({length: 160}, () => {
  // amostragem na caixa da África, filtrada depois por um polígono simples
  const lon = -16 + r1() * 64, lat = -33 + r1() * 66;
  return [lon, lat] as Pt;
}).filter(([lon, lat]) => {
  // contorno grosseiro do continente (lon, lat)
  const poly: Pt[] = [[-17, 21], [-10, 30], [-5, 35.5], [10, 37], [32, 31], [35, 28], [43, 12], [51, 11.5], [40, -3], [40, -15], [35, -24], [27, -34], [18, -34], [12, -18], [9, -1], [9, 4], [-8, 4.5], [-13, 8], [-17, 15]];
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}).map(([lon, lat]) => px(lon, lat));

const MINERIOS: [string, number, number][] = [
  ['COBALTO', 25.5, -10.5],
  ['OURO', 27.5, -26.5],
  ['PLATINA', 29.5, -24],
  ['BAUXITA', -12, 11],
  ['COBRE', 28, -13],
  ['PETRÓLEO', 6.5, 5.5],
  ['URÂNIO', 8, 18],
];

// ---------- legenda (palavras) ----------
const CHUNKS = (() => {
  const out: {ws: typeof WORDS; s: number; e: number}[] = [];
  let cur: typeof WORDS = [];
  WORDS.forEach((w, i) => {
    cur.push(w);
    const next = WORDS[i + 1];
    const gap = next ? next.s - w.e : 9;
    const brk = /[.,:?…]$/.test(w.w) || cur.length >= 3 || gap > 0.35;
    if (brk) {
      out.push({ws: cur, s: cur[0].s, e: next ? Math.min(next.s, w.e + 0.6) : w.e + 1});
      cur = [];
    }
  });
  return out;
})();
const KEY: [RegExp, string][] = [
  [/^(américa|sul|norte)/i, '#ffd84a'],
  [/^(oceania|pacífico)/i, TEAM.OC.cor],
  [/^(china|índia|ásia)/i, TEAM.AS.cor],
  [/^áfrica/i, '#4ee06f'],
  [/^europa/i, '#6fa2ff'],
  [/^(nuclear|nucleares|atômica|guerra|invadida|último|cercada|bomba)/i, '#ff4d4d'],
  [/^(bilhão|catorze|quilômetros|três|nenhuma|duas)/i, '#ffd84a'],
  [/^(atlântico|oceano)/i, '#7ff3ff'],
];
const Caption: React.FC<{t: number}> = ({t}) => {
  const ch = CHUNKS.find((c) => t >= c.s - 0.05 && t < c.e);
  if (!ch) return null;
  const s = pop(t, ch.s - 0.05, 0.22);
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 1440, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 70, lineHeight: 1.1, transform: `scale(${0.85 + 0.15 * s})`}}>
      {ch.ws.map((w, i) => {
        const col = KEY.find(([re]) => re.test(w.w.replace(/[^\wÀ-ú]/g, '')))?.[1] ?? '#fff';
        const on = t >= w.s - 0.03;
        return (
          <span key={i} style={{color: col, opacity: on ? 1 : 0.0, WebkitTextStroke: '3px rgba(0,0,0,0.85)', paintOrder: 'stroke fill', textShadow: '0 6px 16px rgba(0,0,0,0.7)', marginRight: 18, display: 'inline-block'}}>
            {w.w.replace(/[.,:…]$/, '')}
          </span>
        );
      })}
    </div>
  );
};

// ---------- composição ----------
export const Guerra: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = camera(t);
  const cPrev = camera(t - 1 / FPS);
  // borrão de movimento proporcional à velocidade da câmera
  const speed = Math.hypot((c.cx - cPrev.cx) * c.s, (c.cy - cPrev.cy) * c.s) + Math.abs(Math.log(c.s / cPrev.s)) * 900;
  const blur = Math.min(10, Math.max(0, speed - 12) * 0.12);
  // leve deriva contínua (a câmera nunca para)
  const drift = Math.sin(t * 0.7) * 6;
  // Gibraltar: patch de alta resolução
  const gO = [gib.x0 * 4, gib.y0 * 4 - Y0];
  const gibV = io(t, [34.8, 35.4], [0, 1]) * io(t, [38.6, 39.2], [1, 0]);
  const ruler = io(t, [36.0, 36.6], [0, 1], Easing.inOut(Easing.cubic));
  const A = toScreen(c, GA), B = toScreen(c, GB);
  const shake = fade(t, 40.0, 40.7, 0.1) * Math.sin(t * 70) * 6 + fade(t, 44.4, 44.9, 0.1) * Math.sin(t * 80) * 8;
  const flash = io(t, [0, 0.12], [1, 0]) * 0.0 + Math.max(0, 1 - Math.abs(t - 24.35) * 6) * 0.35;
  const vign = fade(t, 43.2, 45.6, 0.3) * (0.25 + 0.1 * Math.sin(t * 8));
  const r2 = rnd(5);
  return (
    <AbsoluteFill style={{background: '#2079b0', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, perspective: 1700, perspectiveOrigin: '50% 30%'}}>
        <div style={{position: 'absolute', inset: -120, transform: `rotateX(${TILT}deg) translate(${shake}px, ${drift}px)`, transformOrigin: '50% 60%', filter: blur > 0.3 ? `blur(${blur}px)` : undefined}}>
          <div style={{position: 'absolute', left: 120, top: 120, width: W, height: H}}>
            {/* mapa */}
            <div style={{position: 'absolute', left: 0, top: 0, width: 4096, height: 2283, transformOrigin: '0 0',
              transform: `translate(${W / 2 - c.cx * c.s}px, ${H / 2 - c.cy * c.s}px) scale(${c.s})`}}>
              <Img src={staticFile('g/mundo.jpg')} style={{position: 'absolute', left: -4096, top: 0, width: 4096, height: 2283, WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 7%, #000 93%, transparent 100%)', maskImage: 'linear-gradient(180deg, transparent 0%, #000 7%, #000 93%, transparent 100%)'}} />
              <Img src={staticFile('g/mundo.jpg')} style={{position: 'absolute', left: 0, top: 0, width: 4096, height: 2283, WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 7%, #000 93%, transparent 100%)', maskImage: 'linear-gradient(180deg, transparent 0%, #000 7%, #000 93%, transparent 100%)'}} />
              <Img src={staticFile('g/mundo.jpg')} style={{position: 'absolute', left: 4096, top: 0, width: 4096, height: 2283, WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 7%, #000 93%, transparent 100%)', maskImage: 'linear-gradient(180deg, transparent 0%, #000 7%, #000 93%, transparent 100%)'}} />
              {gibV > 0 && (
                <Img src={staticFile('g/gib.jpg')} style={{position: 'absolute', left: gO[0], top: gO[1], width: 20, height: 20, opacity: gibV,
                  WebkitMaskImage: 'radial-gradient(circle, #000 55%, transparent 72%)', maskImage: 'radial-gradient(circle, #000 55%, transparent 72%)'}} />
              )}
              <div style={{opacity: 1 - gibV * io(t, [35.6, 36.0], [0, 1])}}>
                <MapLayer t={t} c={c} />
              </div>
            </div>
            {/* população da África */}
            {AF_DOTS.map((p, i) => {
              const t0 = 30.6 + (i / AF_DOTS.length) * 1.3;
              const o = io(t, [t0, t0 + 0.15], [0, 1]) * io(t, [34.6, 35.2], [1, 0]);
              if (o <= 0) return null;
              const [x, y] = toScreen(c, p);
              return <div key={i} style={{position: 'absolute', left: x - 5, top: y - 5, width: 10, height: 10, borderRadius: 5, background: '#fff', opacity: o * 0.9, boxShadow: '0 0 8px #fff'}} />;
            })}
            {/* minérios */}
            {MINERIOS.map(([n, lon, lat], i) => {
              const t0 = 33.1 + i * 0.18;
              const o = io(t, [t0, t0 + 0.2], [0, 1]) * io(t, [34.7, 35.2], [1, 0]);
              if (o <= 0) return null;
              const [x, y] = toScreen(c, px(lon, lat));
              const s = pop(t, t0);
              return (
                <div key={n} style={{position: 'absolute', left: x, top: y, opacity: o, transform: `translate(-50%,-50%) scale(${s})`, textAlign: 'center'}}>
                  <div style={{width: 30, height: 30, margin: '0 auto', transform: 'rotate(45deg)', background: 'linear-gradient(135deg,#fff6c2,#ffc61a 50%,#b07a00)', boxShadow: '0 0 18px #ffd84a', border: '2px solid #fff'}} />
                  <div style={{marginTop: 8, fontFamily: FONT, fontWeight: 800, fontSize: 22, color: '#fff', textShadow: '0 2px 6px #000, 0 0 2px #000'}}>{n}</div>
                </div>
              );
            })}
            {/* régua de Gibraltar */}
            {ruler > 0 && gibV > 0.5 && (
              <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
                <line x1={A[0]} y1={A[1]} x2={A[0] + (B[0] - A[0]) * ruler} y2={A[1] + (B[1] - A[1]) * ruler} stroke="#ffd84a" strokeWidth={10} strokeLinecap="round" />
                <circle cx={A[0]} cy={A[1]} r={16} fill="#ffd84a" stroke="#000" strokeWidth={3} />
                {ruler > 0.98 && <circle cx={B[0]} cy={B[1]} r={16 * pop(t, 36.6)} fill="#ffd84a" stroke="#000" strokeWidth={3} />}
              </svg>
            )}
            {ruler > 0.9 && gibV > 0.5 && (
              <div style={{position: 'absolute', left: (A[0] + B[0]) / 2 + 60, top: (A[1] + B[1]) / 2 - 20, transform: `translate(0,-50%) scale(${pop(t, 36.4)})`, fontFamily: FONT, fontWeight: 800, fontSize: 96, color: '#ffd84a', WebkitTextStroke: '4px #000', paintOrder: 'stroke fill', opacity: gibV}}>
                14 km
              </div>
            )}
            {gibV > 0.5 && (
              <>
                <Tag text="EUROPA" at={gp(560, 300)} c={c} t0={35.9} t1={38.4} t={t} cor="#6fa2ff" size={40} />
                <Tag text="ÁFRICA" at={gp(560, 900)} c={c} t0={36.1} t1={38.4} t={t} cor="#4ee06f" size={40} />
              </>
            )}
            {/* setas */}
            <Arrow a={P.sa} b={P.usa} c={c} t={t} t0={10.9} t1={14.4} cor="#4ee06f" bend={-0.25} />
            <Arrow a={P.usa} b={P.sa} c={c} t={t} t0={12.65} t1={14.4} cor="#ff3b30" bend={-0.25} />
            <Arrow a={P.eu} b={P.af} c={c} t={t} t0={38.8} t1={41.0} cor="#2f6fe0" bend={0.15} />
            <Arrow a={P.china} b={P.horn} c={c} t={t} t0={46.0} t1={48.6} cor="#ffc61a" bend={-0.2} />
            <Arrow a={P.moscou} b={P.eu} c={c} t={t} t0={47.7} t1={49.6} cor="#ffc61a" bend={0.2} />
            <Arrow a={P.af} b={P.eu} c={c} t={t} t0={47.8} t1={49.6} cor="#ffc61a" bend={-0.2} />
            {/* trajetórias nucleares travadas */}
            <Arrow a={P.usa} b={P.eu} c={c} t={t} t0={43.3} t1={45.4} cor="#ff4d4d" bend={-0.3} dash w={10} />
            <Arrow a={P.eu} b={P.china} c={c} t={t} t0={43.4} t1={45.4} cor="#ff4d4d" bend={-0.25} dash w={10} />
            <Arrow a={P.china} b={[P.usa[0] + 4096, P.usa[1]]} c={c} t={t} t0={43.5} t1={45.4} cor="#ff4d4d" bend={-0.12} dash w={10} />
            {/* peças */}
            {PECAS.map((p, i) => <PecaView key={i} p={p} c={c} t={t} />)}
            {/* rótulos */}
            {ORDER.map((team) => (
              <Tag key={team} text={TEAM[team].nome} at={TEAM[team].centro} c={c} t0={LIGHT[team] + 0.1} t1={3.4} t={t} cor="#fff" size={30} />
            ))}
            <Tag text="ALIAR" at={[(P.sa[0] + P.usa[0]) / 2 - 170, (P.sa[1] + P.usa[1]) / 2]} c={c} t0={11.2} t1={14.4} t={t} cor="#4ee06f" size={40} />
            <Tag text="INVADIDA" at={[(P.sa[0] + P.usa[0]) / 2 + 170, (P.sa[1] + P.usa[1]) / 2 + 40]} c={c} t0={13.1} t1={14.4} t={t} cor="#ff4d4d" size={40} />
            <Tag text="OCEANIA" at={P.oc} c={c} t0={15.1} t1={18.3} t={t} cor={TEAM.OC.cor} size={38} />
            <Tag text="CHINA · 2,0 mi soldados" at={P.china} c={c} t0={21.5} t1={23.6} t={t} cor={TEAM.AS.cor} size={34} dy={-60} />
            <Tag text="ÍNDIA · 1,5 mi soldados" at={P.india} c={c} t0={22.5} t1={23.6} t={t} cor={TEAM.AS.cor} size={34} dy={40} />
            <Tag text="ÁFRICA" at={TEAM.AF.centro} c={c} t0={27.9} t1={30.4} t={t} cor="#4ee06f" size={46} />
            <Tag text="0 ogivas" at={TEAM.AF.centro} c={c} t0={28.9} t1={30.4} t={t} cor="#ff4d4d" size={36} dy={80} />
            <Tag text="EUROPA" at={P.eu} c={c} t0={38.7} t1={40.9} t={t} cor="#6fa2ff" size={40} dy={-70} />
            <Tag text="TRAVADA" at={TEAM.AF.centro} c={c} t0={40.0} t1={41.0} t={t} cor="#ffd84a" size={50} />
            <Tag text="ÁSIA" at={P.horn} c={c} t0={46.1} t1={48.6} t={t} cor={TEAM.AS.cor} size={44} dy={60} />
            <Tag text="CERCADA" at={P.eu} c={c} t0={48.0} t1={50.0} t={t} cor="#ff4d4d" size={44} />
            <Tag text="OCEANO ATLÂNTICO" at={[P.atl[0] + 30, P.atl[1] + 330]} c={c} t0={53.0} t1={55.6} t={t} cor="#7ff3ff" size={46} />
          </div>
        </div>
      </div>
      {/* camadas fixas na tela */}
      <Placar t={t} />
      <BigNumber t={t} />
      <Caption t={t} />
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 55%, rgba(120,0,0,1) 100%)', opacity: vign}} />
      <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 36, textAlign: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 19, color: 'rgba(255,255,255,0.75)', textShadow: '0 1px 4px #000'}}>
        Ogivas: FAS 2025 · Exércitos: IISS 2025 · População: ONU · Simulação hipotética
      </div>
      <Audio src={staticFile('g/mix.wav')} />
    </AbsoluteFill>
  );
};
