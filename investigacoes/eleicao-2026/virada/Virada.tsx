import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import geo from '../public/v/geo.json';

// "A virada que nunca tinha acontecido" — 9:16, 30 fps.
// Mapa em pixels do mosaico z6 (br.jpg 3840x3584). Tempos em segundos = narração (narr.wav, 70,4 s).
const W = 1080, H = 1920, FPS = 30;
export const VIRADA_LEN = Math.round(71.5 * FPS);
type Pt = [number, number];
const ST = geo.st as unknown as Record<string, Pt[][]>;
const INFO = geo.info as unknown as Record<string, {bb: number[]; c: Pt}>;
const CAPS = geo.cap as unknown as Record<string, Pt>;
const SE = geo.se as number[];
const SIGLAS = Object.keys(ST);

const RED = '#e11d2a', BLUE = '#2a5bd7', INK = '#ffffff';
const FONT = 'Poppins';

// fontes locais
const fh = typeof window !== 'undefined' ? delayRender('fontes-virada') : 0;
if (typeof window !== 'undefined') {
  Promise.all(
    [['P-Bold', 700], ['P-ExtraBold', 800], ['P-SemiBold', 600], ['P-Regular', 400]].map(([f, w]) =>
      new FontFace(FONT, `url(${staticFile(`fonts/${f}.ttf`)})`, {weight: String(w)}).load(),
    ),
  ).then((fs) => {
    fs.forEach((f) => (document as any).fonts.add(f));
    continueRender(fh);
  });
}

// ---------- resultados ----------
const LULA2: Record<string, number> = {AC: 33.43, AP: 52.88, AM: 54.02, PA: 55.02, RO: 30.39, RR: 27.54, TO: 48.63, AL: 60.77, BA: 71.31, CE: 68.93, MA: 69.54, PB: 67.46, PE: 69.2, PI: 75.88, RN: 65.72, SE: 69.53, DF: 45.72, GO: 40.34, MT: 33.94, MS: 40.4, ES: 43.63, MG: 50.43, RJ: 46.9, SP: 46.15, PR: 37.42, RS: 42.16, SC: 30.58};
const NE = ['MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA'];
const winner2 = (s: string) => (LULA2[s] > 50 ? 'L' : 'F');
// 1º turno: igual ao 2º, exceto Minas (único estado que virou)
const winner1 = (s: string) => (s === 'MG' ? 'F' : winner2(s));

// ---------- util ----------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const io = (t: number, r: number[], o: number[], e = ease) => interpolate(t, r, o, {...clamp, easing: e});
const pop = (t: number, t0: number, d = 0.35) => io(t, [t0, t0 + d], [0, 1], Easing.out(Easing.back(1.7)));
const fade = (t: number, a: number, b: number, d = 0.25) => io(t, [a, a + d], [0, 1]) * io(t, [b - d, b], [1, 0]);
const rnd = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const fmt = (n: number) => Math.round(n).toLocaleString('pt-BR');
const beat = (ph: number) => Math.exp(-((((ph % 1.6) - 0.05) / 0.07) ** 2)) + 0.6 * Math.exp(-((((ph % 1.6) - 0.32) / 0.08) ** 2));
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// ---------- câmera ----------
type Cam = {cx: number; cy: number; s: number};
const BRc: Pt = [1931, 1690];
const NEc: Pt = [2520, 1420];
const K: [number, Cam][] = [
  [0, {cx: BRc[0], cy: BRc[1] + 40, s: 0.47}],
  [8.4, {cx: BRc[0], cy: BRc[1], s: 0.53}],
  [21.6, {cx: BRc[0], cy: BRc[1], s: 0.55}],
  [23.6, {cx: BRc[0], cy: BRc[1], s: 0.53}],
  [25.6, {cx: BRc[0], cy: BRc[1], s: 0.53}],
  [26.6, {cx: CAPS.RJ[0] - 40, cy: CAPS.RJ[1] - 60, s: 1.45}],
  [28.6, {cx: CAPS.RJ[0] - 50, cy: CAPS.RJ[1] - 70, s: 1.5}],
  [29.5, {cx: INFO.MG.c[0], cy: INFO.MG.c[1] + 40, s: 1.05}],
  [31.0, {cx: INFO.MG.c[0], cy: INFO.MG.c[1] + 40, s: 1.08}],
  [32.0, {cx: CAPS.SP[0] - 120, cy: CAPS.SP[1] - 90, s: 1.25}],
  [33.9, {cx: CAPS.SP[0] - 130, cy: CAPS.SP[1] - 100, s: 1.3}],
  [35.0, {cx: BRc[0], cy: BRc[1], s: 0.53}],
  [39.4, {cx: BRc[0], cy: BRc[1], s: 0.55}],
  [41.0, {cx: INFO.MG.c[0], cy: INFO.MG.c[1] + 60, s: 1.55}],
  [47.3, {cx: INFO.MG.c[0], cy: INFO.MG.c[1] + 60, s: 1.68}],
  [48.4, {cx: NEc[0], cy: NEc[1], s: 0.9}],
  [50.0, {cx: NEc[0], cy: NEc[1], s: 0.93}],
  [51.0, {cx: BRc[0], cy: BRc[1], s: 0.53}],
  [53.0, {cx: BRc[0], cy: BRc[1], s: 0.53}],
  [53.6, {cx: CAPS.SP[0] - 80, cy: CAPS.SP[1] - 120, s: 1.0}],
  [54.4, {cx: CAPS.SP[0] - 80, cy: CAPS.SP[1] - 120, s: 1.02}],
  [55.2, {cx: BRc[0], cy: BRc[1], s: 0.53}],
  [71.5, {cx: BRc[0], cy: BRc[1] + 20, s: 0.5}],
];
const camera = (t: number): Cam => {
  let i = 0;
  while (i < K.length - 2 && t >= K[i + 1][0]) i++;
  const [t0, a] = K[i], [t1, b] = K[i + 1];
  const u = io(t, [t0, t1], [0, 1], Easing.inOut(Easing.cubic));
  // zoom em escala logarítmica para o movimento ficar natural
  const s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * u);
  return {cx: a.cx + (b.cx - a.cx) * u, cy: a.cy + (b.cy - a.cy) * u, s};
};
const toScreen = (c: Cam, p: Pt): Pt => [(p[0] - c.cx) * c.s + W / 2, (p[1] - c.cy) * c.s + H / 2];

// ---------- mapa ----------
const ringD = (s: string) => ST[s].map((r) => 'M' + r.map((p) => p.join(' ')).join('L') + 'Z').join('');
const PATHS: Record<string, string> = Object.fromEntries(SIGLAS.map((s) => [s, ringD(s)]));
const BSB = CAPS.BSB;
// ordem da pintura do 1º turno: do norte para o sul, com leve sorteio
const r0 = rnd(7);
const PAINT_ORDER = [...SIGLAS].sort((a, b) => INFO[a].c[1] + r0() * 160 - (INFO[b].c[1] + r0() * 160));
const paintStart = (s: string) => 8.7 + (PAINT_ORDER.indexOf(s) / SIGLAS.length) * 2.4;

const StateFill: React.FC<{s: string; t: number}> = ({s, t}) => {
  const [x0, y0, x1, y1] = INFO[s].bb;
  const w = x1 - x0, h = y1 - y0;
  const c = INFO[s].c;
  const p0 = paintStart(s);
  // tinta que se espalha a partir do centro do estado
  const r = io(t, [p0, p0 + 0.7], [0, 1], Easing.out(Easing.cubic)) * Math.hypot(w, h);
  if (r <= 0) return null;
  const col1 = winner1(s) === 'L' ? RED : BLUE;
  // pulsação: onda saindo de Brasília; mais forte onde a vitória foi maior
  const strength = Math.min(1, 0.35 + Math.abs(LULA2[s] - 50) / 26);
  const d = dist(c, BSB) / 1400;
  let pulse = beat(Math.max(0, t - d * 0.9)) * strength;
  // batida forte no "três semanas"
  pulse *= 0.45 + 0.9 * fade(t, 21.6, 23.9, 0.3);
  // destaques
  const flash = (t0: number, on: boolean) => (on ? io(t, [t0, t0 + 0.12], [0, 1]) * io(t, [t0 + 0.12, t0 + 1.4], [1, 0]) : 0);
  const allWave = flash(34.5 + d * 1.2, true) * 0.6;
  const hi =
    flash(26.0, s === 'RJ') + flash(29.0, s === 'MG') + flash(31.5, s === 'SP') + allWave +
    flash(48.3 + NE.indexOf(s) * 0.17, NE.includes(s)) + flash(53.1, s === 'SP') +
    (winner2(s) === 'F' ? flash(54.6 + (PAINT_ORDER.indexOf(s) / 27) * 1.6, true) : 0) + flash(51.0, winner1(s) === 'F') * 0.6;
  // virada de Minas: o vermelho cresce a partir de BH
  const flipR = s === 'MG' ? io(t, [44.15, 45.6], [0, 1], Easing.inOut(Easing.quad)) * Math.hypot(w, h) * 1.1 : 0;
  const bh: Pt = [CAPS.BH[0] - x0, CAPS.BH[1] - y0];
  const base: React.CSSProperties = {
    position: 'absolute', left: x0, top: y0, width: w, height: h,
    WebkitMaskImage: `url(${staticFile(`v/m_${s}.png`)})`, WebkitMaskSize: '100% 100%',
    maskImage: `url(${staticFile(`v/m_${s}.png`)})`, maskSize: '100% 100%',
  };
  const alpha = 0.66 + 0.16 * strength;
  return (
    <>
      <div style={{...base, background: col1, opacity: alpha + 0.12 * pulse, clipPath: `circle(${r}px at ${c[0] - x0}px ${c[1] - y0}px)`}} />
      {flipR > 0 && <div style={{...base, background: RED, opacity: alpha + 0.12 * pulse, clipPath: `circle(${flipR}px at ${bh[0]}px ${bh[1]}px)`}} />}
      <div style={{...base, background: '#fff', opacity: Math.min(0.55, 0.13 * pulse + 0.38 * hi), clipPath: `circle(${r}px at ${c[0] - x0}px ${c[1] - y0}px)`}} />
    </>
  );
};

const MapLayer: React.FC<{t: number; c: Cam}> = ({t, c}) => {
  const painted = io(t, [8.6, 9.6], [0, 1]);
  const gl = 0.5 + 0.5 * beat(t);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 3840, height: 3584, transformOrigin: '0 0',
      transform: `translate(${W / 2 - c.cx * c.s}px, ${H / 2 - c.cy * c.s}px) scale(${c.s})`}}>
      <Img src={staticFile('v/br.jpg')} style={{position: 'absolute', left: 0, top: 0, width: 3840, height: 3584}} />
      {/* Sudeste em alta resolução (z8), com borda suave */}
      <Img src={staticFile('v/se.jpg')} style={{position: 'absolute', left: SE[0], top: SE[1], width: SE[2], height: SE[3],
        WebkitMaskImage: 'radial-gradient(closest-side, #000 82%, transparent 100%)', maskImage: 'radial-gradient(closest-side, #000 82%, transparent 100%)',
        WebkitMaskSize: '100% 100%', opacity: io(c.s, [0.6, 0.9], [0, 1])}} />
      {SIGLAS.map((s) => <StateFill key={s} s={s} t={t} />)}
      <svg width={3840} height={3584} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={6 / c.s} /></filter>
        </defs>
        <g fill="none" stroke="#fff" strokeLinejoin="round">
          <g filter="url(#glow)" opacity={0.25 + 0.35 * gl * painted} strokeWidth={5 / c.s}>
            {SIGLAS.map((s) => <path key={s} d={PATHS[s]} />)}
          </g>
          <g opacity={0.55 + 0.4 * painted} strokeWidth={1.6 / c.s}>
            {SIGLAS.map((s) => <path key={s} d={PATHS[s]} />)}
          </g>
          {/* contorno aceso de Minas na virada */}
          {([['MG', 40.8, 47.6], ['RJ', 26.0, 28.9], ['MG', 29.0, 31.4], ['SP', 31.5, 34.2], ['SP', 53.0, 54.4]] as [string, number, number][]).map(([sg, a, b], i) => (
            <g key={i} opacity={fade(t, a, b, 0.3)}>
              <path d={PATHS[sg]} stroke="#ffe27a" strokeWidth={4 / c.s} filter="url(#glow)" />
              <path d={PATHS[sg]} stroke="#ffe27a" strokeWidth={2.2 / c.s} />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

// ---------- votos que sobem (partículas) ----------
const r1 = rnd(42);
const PARTS = Array.from({length: 260}, () => {
  const s = SIGLAS[Math.floor(r1() * SIGLAS.length)];
  const [x0, y0, x1, y1] = INFO[s].bb;
  return {p: [x0 + (x1 - x0) * (0.25 + r1() * 0.5), y0 + (y1 - y0) * (0.25 + r1() * 0.5)] as Pt, t0: 23.9 + r1() * 15, d: 1.1 + r1() * 0.8, sz: 3 + r1() * 5};
});
const Particles: React.FC<{t: number; c: Cam}> = ({t, c}) => {
  const target: Pt = [150, 300];
  const dense = io(t, [36.8, 37.4], [0, 1]) * io(t, [38.9, 39.5], [1, 0]);
  return (
    <>
      {PARTS.map((q, i) => {
        // no "10 milhões" todas sobem juntas
        const t0 = dense > 0 && i % 2 === 0 ? 37.0 + (i % 40) * 0.035 : q.t0;
        const u = (t - t0) / q.d;
        if (u <= 0 || u >= 1) return null;
        const [sx, sy] = toScreen(c, q.p);
        const e = Easing.in(Easing.quad)(u);
        const x = sx + (target[0] - sx) * e, y = sy + (target[1] - sy) * e - Math.sin(u * Math.PI) * 120;
        const a = Math.sin(u * Math.PI);
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: q.sz, height: q.sz, borderRadius: 99, background: '#ffd2d2',
          boxShadow: `0 0 ${q.sz * 3}px ${q.sz}px rgba(255,60,60,0.7)`, opacity: a}} />;
      })}
    </>
  );
};

// ---------- peças de interface ----------
const Badge: React.FC<{src: string; size: number; ring: string; x: number; y: number; o?: number; sc?: number}> = ({src, size, ring, x, y, o = 1, sc = 1}) => (
  <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size, overflow: 'hidden',
    border: `${Math.max(4, size * 0.045)}px solid ${ring}`, boxShadow: `0 0 ${size * 0.25}px ${ring}aa, 0 10px 30px rgba(0,0,0,0.5)`,
    opacity: o, transform: `scale(${sc})`}}>
    <Img src={staticFile(`v/f_${src}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  </div>
);
const Txt: React.FC<{x: number; y: number; size: number; color?: string; w?: number; o?: number; sc?: number; children: React.ReactNode; weight?: number; ls?: number}> =
  ({x, y, size, color = INK, w = 900, o = 1, sc = 1, children, weight = 800, ls = 0}) => (
    <div style={{position: 'absolute', left: x - w / 2, top: y - size * 0.62, width: w, textAlign: 'center', fontFamily: FONT, fontWeight: weight,
      fontSize: size, color, lineHeight: 1.1, letterSpacing: ls, opacity: o, transform: `scale(${sc})`,
      textShadow: '0 4px 18px rgba(0,0,0,0.75), 0 0 2px rgba(0,0,0,0.9)'}}>{children}</div>
  );
const Chip: React.FC<{x: number; y: number; color: string; o: number; sc?: number; children: React.ReactNode; size?: number}> = ({x, y, color, o, sc = 1, children, size = 44}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${sc}) rotate(-3deg)`, opacity: o, background: color,
    color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: size, padding: `${size * 0.18}px ${size * 0.5}px`, borderRadius: 10, whiteSpace: 'nowrap',
    boxShadow: '0 8px 26px rgba(0,0,0,0.5)', border: '3px solid rgba(255,255,255,0.9)'}}>{children}</div>
);

// barra do cabo de guerra: fração do Lula (votos válidos)
const barLula = (t: number) => {
  const p1 = 45.16 / (45.16 + 47.03);
  let p = p1;
  p += io(t, [26.0, 27.0], [0, 0.004]) + io(t, [29.0, 30.0], [0, 0.005]) + io(t, [31.5, 32.6], [0, 0.007]) + io(t, [37.2, 38.6], [0, 0.0035]);
  p += io(t, [57.95, 58.9], [0, 0.5179 - (p1 + 0.0195)], Easing.out(Easing.back(1.4)));
  return p;
};

const TopBar: React.FC<{t: number}> = ({t}) => {
  // intro: retratos grandes no centro; depois sobem para o topo
  const m = io(t, [8.3, 9.2], [0, 1], Easing.inOut(Easing.cubic));
  const lx = 330 + (130 - 330) * m, fx = 750 + (950 - 750) * m, y = 900 + (250 - 900) * m;
  const size = 330 + (170 - 330) * m;
  const lo = pop(t, 0.05), fo = pop(t, 4.3);
  const win = t > 58.2;
  const lsc = 1 + 0.12 * io(t, [58.2, 58.8], [0, 1]);
  const barO = io(t, [9.0, 9.6], [0, 1]);
  const p = barLula(t);
  const bx = 240, bw = 600, by = 236;
  const pct = (v: number) => v.toFixed(2).replace('.', ',') + '%';
  const showPct1 = io(t, [10.7, 11.2], [0, 1]) * io(t, [57.9, 58.2], [1, 0]);
  const showPct2 = io(t, [58.4, 58.9], [0, 1]);
  return (
    <>
      <Badge src="lula" size={size} ring={RED} x={lx} y={y} o={Math.min(1, lo)} sc={(0.6 + 0.4 * lo) * lsc} />
      <Badge src="flavio" size={size} ring={BLUE} x={fx} y={y} o={Math.min(1, fo)} sc={0.6 + 0.4 * fo} />
      <Txt x={lx} y={y + size / 2 + 44 - 12 * m} size={46 - 22 * m} o={Math.min(1, lo)} w={240}>LULA</Txt>
      <Txt x={fx} y={y + size / 2 + 44 - 12 * m} size={46 - 22 * m} o={Math.min(1, fo)} w={m > 0.5 ? 240 : 460}>{m > 0.5 ? <>FLÁVIO<br />BOLSONARO</> : 'FLÁVIO BOLSONARO'}</Txt>
      {barO > 0 && (
        <div style={{position: 'absolute', left: bx, top: by - 22, width: bw, height: 44, borderRadius: 30, overflow: 'hidden', opacity: barO,
          border: '3px solid rgba(255,255,255,0.85)', boxShadow: '0 6px 24px rgba(0,0,0,0.5)', background: BLUE}}>
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${p * 100}%`, background: RED}} />
          <div style={{position: 'absolute', left: '50%', top: -4, bottom: -4, width: 3, background: 'rgba(255,255,255,0.9)'}} />
        </div>
      )}
      <Txt x={bx + 95} y={by + 62} size={40} o={showPct1} w={260}>{pct(45.16)}</Txt>
      <Txt x={bx + bw - 95} y={by + 62} size={40} o={showPct1} w={260}>{pct(47.03)}</Txt>
      <Txt x={bx + 95} y={by + 62} size={46} o={showPct2} w={260} sc={win ? 1.05 : 1}>{pct(51.79)}</Txt>
      <Txt x={bx + bw - 95} y={by + 62} size={40} o={showPct2} w={260}>{pct(48.21)}</Txt>
      <Txt x={540} y={by - 58} size={26} weight={700} ls={4} o={barO * io(t, [57.9, 58.2], [1, 0])} w={600}>1º TURNO · 4 DE OUTUBRO</Txt>
      <Txt x={540} y={by - 58} size={26} weight={700} ls={4} o={showPct2} w={600}>2º TURNO · 25 DE OUTUBRO</Txt>
    </>
  );
};

// régua do tempo 1989 → 2026
const YEARS = ['1989', '2002', '2006', '2010', '2014', '2018', '2022', '2026'];
const Timeline: React.FC<{t: number}> = ({t}) => {
  const o = fade(t, 15.5, 19.1, 0.3) + fade(t, 65.8, 71.5, 0.4);
  if (o <= 0) return null;
  const end = t > 60;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1430, height: 220, opacity: o, background: 'rgba(6,12,24,0.72)', borderRadius: 22,
      border: '2px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(6px)'}}>
      <div style={{position: 'absolute', left: 30, right: 30, top: 32, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: '#cfd8e6'}}>
        QUEM SAIU NA FRENTE NO 1º TURNO…
      </div>
      {YEARS.map((y, i) => {
        const x = 40 + i * 112;
        const tk = end ? 66.0 + i * 0.06 : 15.8 + i * 0.3;
        const isNow = i === YEARS.length - 1;
        const s = pop(t, tk, 0.3);
        const mark = !isNow ? '✓' : end && t > 68.9 ? '✗' : '?';
        const col = !isNow ? '#7ee39b' : end && t > 68.9 ? '#ff6b6b' : '#ffd84a';
        return (
          <div key={y} style={{position: 'absolute', left: x, top: 84, width: 100, textAlign: 'center', fontFamily: FONT}}>
            <div style={{fontSize: 30, fontWeight: 700, color: isNow ? '#ffd84a' : '#fff'}}>{y}</div>
            <div style={{fontSize: 52, fontWeight: 800, color: col, transform: `scale(${s})`, opacity: Math.min(1, s)}}>{mark}</div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: -64, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 40, color: '#fff',
        opacity: (end ? io(t, [69.3, 69.7], [0, 1]) : io(t, [17.6, 18.0], [0, 1])), textShadow: '0 4px 18px rgba(0,0,0,0.8)'}}>
        {end ? 'ATÉ AGORA.' : '…VENCEU O 2º. SEMPRE.'}
      </div>
    </div>
  );
};

// apoios dos derrotados: retratos voam até o lado do Flávio
const Endorse: React.FC<{t: number}> = ({t}) => {
  const ppl: [string, string][] = [['caiado', 'CAIADO'], ['zema', 'ZEMA'], ['cury', 'CURY']];
  return (
    <>
      {ppl.map(([k, n], i) => {
        const t0 = 19.2 + i * 0.25;
        const a = pop(t, t0);
        const fly = io(t, [20.6 + i * 0.1, 21.4 + i * 0.1], [0, 1], Easing.in(Easing.cubic));
        if (a <= 0 || fly >= 1) return null;
        const x0 = 300 + i * 240, y0 = 1250;
        const x = x0 + (950 - x0) * fly, y = y0 + (250 - y0) * fly;
        const sc = (0.6 + 0.4 * a) * (1 - 0.7 * fly);
        return (
          <React.Fragment key={k}>
            <Badge src={k} size={180} ring={BLUE} x={x} y={y} sc={sc} />
            <Txt x={x} y={y + 128} size={34} o={1 - fly} w={260}>{n}</Txt>
          </React.Fragment>
        );
      })}
    </>
  );
};

const BigCounter: React.FC<{t: number; t0: number; t1: number; from: number; to: number; y: number; size: number; color?: string; prefix?: string; suffix?: string; dur?: number}> =
  ({t, t0, t1, from, to, y, size, color = INK, prefix = '', suffix = '', dur = 0.9}) => {
    const o = fade(t, t0, t1, 0.2);
    if (o <= 0) return null;
    const v = io(t, [t0, t0 + dur], [from, to], Easing.out(Easing.cubic));
    return <Txt x={540} y={y} size={size} color={color} o={o} sc={0.85 + 0.15 * pop(t, t0, 0.3)} w={1040}>{prefix}{fmt(v)}{suffix}</Txt>;
  };

export const Virada: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const c = camera(t);
  const vig = 0.55;
  // rótulos de estado na escada dos votos
  const step = (t0: number, t1: number, label: string, value: string, size: number) => (
    <>
      <Txt x={540} y={1330} size={40} weight={700} ls={3} o={fade(t, t0, t1, 0.2)} w={900}>{label}</Txt>
      <Txt x={540} y={1330 + size * 0.95} size={size} color="#ffd9d9" o={fade(t, t0 + 0.05, t1, 0.2)} sc={0.7 + 0.3 * pop(t, t0 + 0.6)} w={1040}>{value}</Txt>
    </>
  );
  // Minas: placar antes/depois
  const mgO = fade(t, 42.1, 47.6, 0.25);
  const mg2 = io(t, [44.1, 44.5], [0, 1]);
  const stamp = pop(t, 46.0, 0.3);
  // Nordeste 9/9
  const ne = Math.min(9, Math.max(0, Math.floor((t - 48.3) / 0.17) + 1));
  // checks do Bolsonaro
  const chk = (t0: number, txt: string, i: number) => (
    <Chip x={540} y={1300 + i * 110} color={BLUE} o={fade(t, t0, 57.85, 0.15)} sc={pop(t, t0, 0.3)} size={46}>✓ {txt}</Chip>
  );
  const lost = fade(t, 57.95, 59.5, 0.15);
  return (
    <AbsoluteFill style={{background: '#0b2a4a', overflow: 'hidden'}}>
      <MapLayer t={t} c={c} />
      <Particles t={t} c={c} />
      {/* vinheta para o texto ler bem */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 48%, transparent 45%, rgba(3,10,22,${vig}) 100%)`}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,10,22,0.55) 0%, transparent 22%, transparent 62%, rgba(3,10,22,0.6) 100%)'}} />

      {/* gancho */}
      <Txt x={540} y={1330} size={58} o={fade(t, 0.3, 3.8, 0.25)} w={980}>FEZ ALGO QUE VOCÊ<br />NUNCA VIU</Txt>
      <Txt x={540} y={1330} size={58} o={fade(t, 5.0, 8.2, 0.25)} w={980}>PASSOU POR ALGO INÉDITO</Txt>
      {/* 2 milhões */}
      <Txt x={540} y={1340} size={96} color="#cfe0ff" o={fade(t, 12.9, 15.4, 0.2)} sc={0.8 + 0.2 * pop(t, 12.9)} w={1040}>+2 MILHÕES</Txt>
      <Txt x={540} y={1440} size={36} weight={700} ls={3} o={fade(t, 13.2, 15.4, 0.2)} w={900}>DE VOTOS DE VANTAGEM</Txt>
      <Timeline t={t} />
      <Endorse t={t} />
      {/* três semanas */}
      <Txt x={540} y={1330} size={170} color="#fff" o={fade(t, 21.7, 23.9, 0.15)} sc={1 + 0.06 * beat(t - 21.7)} w={1040}>
        {Math.max(0, 21 - Math.floor(io(t, [22.0, 23.6], [0, 21], Easing.in(Easing.quad))))}
      </Txt>
      <Txt x={540} y={1460} size={44} weight={700} ls={6} o={fade(t, 21.7, 23.9, 0.15)} w={900}>DIAS</Txt>
      <Txt x={540} y={1330} size={50} o={fade(t, 23.8, 25.8, 0.2)} w={980}>OS VOTOS COMEÇARAM<br />A APARECER</Txt>
      {/* escada */}
      {step(26.0, 28.9, 'RIO DE JANEIRO', '+870 MIL', 110)}
      {step(29.0, 31.4, 'MINAS GERAIS', '+1,1 MILHÃO', 128)}
      {step(31.5, 34.2, 'SÃO PAULO', '+2,6 MILHÕES', 146)}
      <Txt x={540} y={1330} size={56} o={fade(t, 34.4, 37.1, 0.2)} w={980}>EM TODOS OS ESTADOS</Txt>
      <Txt x={540} y={1410} size={40} weight={700} ls={4} o={fade(t, 35.9, 37.1, 0.2)} w={900}>SEM EXCEÇÃO</Txt>
      <BigCounter t={t} t0={37.2} t1={39.3} from={0} to={10356232} y={1340} size={124} color="#ffd9d9" prefix="+" dur={1.3} />
      <Txt x={540} y={1450} size={40} weight={700} ls={3} o={fade(t, 37.4, 39.3, 0.2)} w={900}>VOTOS NOVOS PARA LULA</Txt>
      {/* Minas */}
      <Txt x={540} y={1300} size={44} weight={800} ls={4} o={fade(t, 39.4, 42.0, 0.2)} w={980}>UM ESTADO MUDOU DE COR</Txt>
      {mgO > 0 && (
        <div style={{position: 'absolute', left: 90, right: 90, top: 1280, height: 250, opacity: mgO, background: 'rgba(6,12,24,0.75)', borderRadius: 22,
          border: '2px solid rgba(255,255,255,0.25)', fontFamily: FONT, color: '#fff'}}>
          <div style={{position: 'absolute', top: 24, width: '100%', textAlign: 'center', fontSize: 28, fontWeight: 700, letterSpacing: 4, color: '#ffe27a'}}>
            MINAS GERAIS · {mg2 < 0.5 ? '1º TURNO' : '2º TURNO'}
          </div>
          {[['LULA', mg2 < 0.5 ? '5,1 mi' : '6,3 mi', RED, 0], ['FLÁVIO', mg2 < 0.5 ? '5,7 mi' : '6,2 mi', BLUE, 1]].map(([n, v, col, i]) => {
            const lead = mg2 < 0.5 ? i === 1 : i === 0;
            return (
              <div key={n as string} style={{position: 'absolute', top: 80, left: (i as number) === 0 ? 40 : 470, width: 390, textAlign: 'center'}}>
                <div style={{fontSize: 30, fontWeight: 700, color: col as string}}>{n}</div>
                <div style={{fontSize: lead ? 88 : 64, fontWeight: 800, opacity: lead ? 1 : 0.7}}>{v}</div>
              </div>
            );
          })}
        </div>
      )}
      <Chip x={540} y={1140} color={RED} o={stamp * io(t, [47.4, 47.7], [1, 0])} sc={0.4 + 0.6 * stamp + 0.6 * (1 - Math.min(1, stamp))} size={96}>VIROU</Chip>
      {/* Nordeste */}
      <Txt x={540} y={1330} size={44} weight={700} ls={4} o={fade(t, 47.9, 50.5, 0.2)} w={900}>NORDESTE</Txt>
      <Txt x={540} y={1440} size={150} color="#ffd9d9" o={fade(t, 48.2, 50.5, 0.2)} sc={1 + 0.05 * (t > 48.3 ? beat((t - 48.3) * 3) : 0)} w={1040}>{ne}/9</Txt>
      {/* o que o Bolsonaro ganhou */}
      {chk(50.75, 'GANHOU O 1º TURNO', 0)}
      {chk(53.05, 'GANHOU SÃO PAULO', 1)}
      {chk(54.5, '13 ESTADOS + DF', 2)}
      <Txt x={540} y={1450} size={110} color="#ffffff" o={lost} sc={0.9 + 0.1 * pop(t, 57.95, 0.25)} w={1040}>E PERDEU.</Txt>
      {/* placar final */}
      <Txt x={540} y={1040} size={34} weight={800} ls={4} color="#ff8a8a" o={fade(t, 59.7, 71.5, 0.2)} w={600}>LULA</Txt>
      <BigCounter t={t} t0={59.7} t1={71.5} from={0} to={64256232} y={1120} size={96} color="#ffffff" dur={1.4} />
      <Txt x={540} y={1215} size={30} weight={800} ls={4} color="#8fb0ff" o={fade(t, 62.1, 71.5, 0.2)} w={600}>FLÁVIO BOLSONARO</Txt>
      <BigCounter t={t} t0={62.1} t1={71.5} from={0} to={59826041} y={1290} size={72} color="#dfe8ff" dur={1.4} />

      <TopBar t={t} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 34, textAlign: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 20, color: 'rgba(255,255,255,0.6)', letterSpacing: 1}}>
        Fonte: TSE · votos válidos, eleição presidencial 2026
      </div>
      <Audio src={staticFile('v/narr.wav')} />
      <Audio src={staticFile('v/sfx.wav')} volume={0.6} />
      <Audio src={staticFile('v/musica.mp3')} volume={(fr) => {
        const s = fr / FPS;
        const base = 0.16 + 0.06 * io(s, [23.5, 24.5], [0, 1]);
        const duck = s < 58.9 ? io(s, [57.7, 58.1], [1, 0.25]) : io(s, [59.2, 60.2], [0.25, 1]);
        return base * duck * io(s, [70.0, 71.5], [1, 0]);
      }} />
    </AbsoluteFill>
  );
};
