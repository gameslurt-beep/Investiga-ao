import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import meta from '../public/meta.json';
import borders from '../public/borders.json';
import tl from '../public/m/timeline.json';

// Fuga v2 (voz Mustard) — história contada NO mapa. 9:16, 30 fps. Tempos = mix final (narração 1.08x + janelinha).
const W = 1080, H = 1920, FPS = 30;
export const FUGAM_LEN = Math.round(88.4 * FPS);
const FONT = 'Poppins', MONO = 'Mono';
const AMBER = '#ffb020', RED = '#e5262f', BLUE = '#3b74ff', CYAN = '#5fd4ff', WHITE = '#f4f7ff';

const fh = typeof window !== 'undefined' ? delayRender('fontes-fugam') : 0;
if (typeof window !== 'undefined') {
  Promise.all(
    [['P-Bold', 700], ['P-ExtraBold', 800], ['P-SemiBold', 600]].map(([f, w]) =>
      new FontFace(FONT, `url(${staticFile(`fonts/${f}.ttf`)})`, {weight: String(w)}).load(),
    ).concat([new FontFace(MONO, `url(${staticFile('fonts/mono.ttf')})`, {weight: '700'}).load()]),
  ).then((fs) => {
    fs.forEach((f) => (document as any).fonts.add(f));
    continueRender(fh);
  });
}

// ---------- util ----------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: ease});
const fade = (t: number, a: number, b: number, d = 0.25) => Math.min(ramp(t, a, a + d), 1 - ramp(t, b - d, b));
const pop = (t: number, a: number) => interpolate(t, [a, a + 0.12, a + 0.22], [1.6, 0.94, 1], clamp);
const lerpK = (t: number, ks: [number, number][]) => interpolate(t, ks.map((k) => k[0]), ks.map((k) => k[1]), {...clamp, easing: ease});

// ---------- projeção ----------
type LL = [number, number];
const wx = (lon: number) => ((lon + 180) / 360) * 256;
const wy = (lat: number) => {
  const l = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(l) + 1 / Math.cos(l)) / Math.PI) / 2) * 256;
};
const P: Record<string, LL> = {
  BSB: [-47.88, -15.79], CASA: [-47.835, -15.872], FOZ: [-54.58, -25.52], AERO: [-54.4734, -25.7373], BA: [-58.4156, -34.5592],
  P_BR: [-54.5885, -25.5855], P_AR: [-54.5878, -25.5975], VAN0: [-54.578, -25.566], FAZ: [-54.47, -25.48],
  PY: [-58.2, -23.0], BO: [-64.6, -17.0], PE: [-74.5, -9.8], EC: [-78.6, -1.4], GYE: [-79.885, -2.157], OPF: [-80.278, 25.907], ORL: [-81.31, 28.43],
};
type Cam = {x: number; y: number; z: number; tilt: number};
const fit = (a: LL, b: LL, pad = 0.62, tilt = 0): Cam => {
  const x0 = wx(a[0]), x1 = wx(b[0]), y0 = wy(a[1]), y1 = wy(b[1]);
  const z = Math.log2(Math.min((W * pad) / Math.max(1e-6, Math.abs(x1 - x0)), (H * pad * 0.6) / Math.max(1e-6, Math.abs(y1 - y0))));
  return {x: (x0 + x1) / 2, y: (y0 + y1) / 2, z, tilt};
};
const at = (p: LL, z: number, tilt = 0, dy = 0): Cam => ({x: wx(p[0]), y: wy(p[1]) + dy / 2 ** z, z, tilt});
const mid = (a: LL, b: LL): LL => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

// quadros-chave da câmera [tempo, câmera]
const KEYS: [number, Cam][] = [
  [0, at(P.P_BR, 13.55, 52, 60)],
  [9.4, at(P.P_BR, 13.75, 52, 60)],
  [11.0, fit(P.P_BR, P.AERO, 0.78, 44)],
  [18.6, fit(P.P_BR, P.AERO, 0.74, 44)],
  [21.2, fit(P.BSB, P.FOZ, 0.62, 0)],
  [23.6, at(P.CASA, 9.9, 34)],
  [30.2, at(P.CASA, 10.15, 34)],
  [37.3, at(P.CASA, 10.3, 34)],
  [38.6, fit(P.BSB, P.FOZ, 0.64, 18)],
  [40.4, fit(P.BSB, P.FOZ, 0.64, 18)],
  [41.6, fit(P.BA, P.AERO, 0.6, 18)],
  [44.6, fit(P.BA, P.AERO, 0.6, 18)],
  [45.6, at(P.AERO, 12.0, 46, 40)],
  [51.6, at(P.AERO, 12.25, 46, 40)],
  [52.6, fit(P.FAZ, [-54.6, -25.76], 0.7, 36)],
  [62.9, fit(P.FAZ, [-54.6, -25.76], 0.66, 36)],
  [63.7, at(mid(P.P_BR, P.P_AR), 13.7, 52, 40)],
  [65.9, at(mid(P.P_BR, P.P_AR), 13.8, 52, 40)],
  [66.6, fit(P.P_AR, P.AERO, 0.6, 40)],
  [68.2, fit(P.P_AR, P.AERO, 0.5, 30)],
  [69.6, fit(P.AERO, P.GYE, 0.62, 0)],
  [73.8, fit(P.AERO, P.GYE, 0.6, 0)],
  [75.2, fit(P.AERO, P.OPF, 0.6, 0)],
  [78.0, fit(P.AERO, P.OPF, 0.6, 0)],
  [79.2, fit(P.BSB, P.ORL, 0.74, 0)],
  [84.6, fit(P.BSB, P.ORL, 0.72, 0)],
  [85.8, at(P.OPF, 6.4, 22, 120)],
  [88.4, at(P.OPF, 6.6, 26, 120)],
];
const camAt = (t: number): Cam => {
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1][0]) i++;
  const [ta, a] = KEYS[i], [tb, b] = KEYS[i + 1];
  const k = interpolate(t, [ta, tb], [0, 1], {...clamp, easing: ease});
  return {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k, tilt: a.tilt + (b.tilt - a.tilt) * k};
};
const proj = (c: Cam, p: LL) => {
  const s = 2 ** c.z;
  return [(wx(p[0]) - c.x) * s + W / 2, (wy(p[1]) - c.y) * s + H / 2] as [number, number];
};

// ---------- mapa (plano; a inclinação é aplicada no palco inteiro) ----------
const LAYERS = (['L5', 'L7', 'LB', 'L10', 'L13'] as const).map((k) => ({k, ...(meta as any)[k]})) as {k: string; z: number; x0: number; y0: number; w: number; h: number}[];
const PAD = 700; // o palco é maior que a tela para a inclinação não mostrar borda
const Mapa: React.FC<{c: Cam; red: number}> = ({c, red}) => {
  const s0 = 2 ** c.z;
  return (
    <>
      {LAYERS.map((L, i) => {
        if (c.z - L.z > 5) return null;
        const o = i === 0 ? 1 : interpolate(c.z, [L.z - 1.6, L.z - 0.8], [0, 1], clamp);
        if (o <= 0) return null;
        const k = 2 ** (c.z - L.z);
        const left = (L.x0 * 256 / 2 ** L.z - c.x) * s0 + W / 2 + PAD, top = (L.y0 * 256 / 2 ** L.z - c.y) * s0 + H / 2 + PAD;
        return (
          <Img key={L.k} src={staticFile(`${L.k}.jpg`)}
            style={{position: 'absolute', left: 0, top: 0, width: L.w, height: L.h, opacity: o, transformOrigin: '0 0',
              transform: `translate(${left}px,${top}px) scale(${k})`, filter: L.k === 'L13' ? 'brightness(1.3) contrast(1.1)' : L.k === 'LB' ? 'brightness(1.1)' : undefined,
              WebkitMaskImage: L.k === 'LB' ? 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 55%, transparent 100%)' : undefined}} />
        );
      })}
      <svg width={W + PAD * 2} height={H + PAD * 2} style={{position: 'absolute', left: 0, top: 0, opacity: interpolate(c.z, [9, 10.5], [1, 0.25], clamp)}}>
        <g transform={`translate(${W / 2 + PAD - c.x * s0},${H / 2 + PAD - c.y * s0}) scale(${s0})`}>
          <path d={(borders as any).all} fill="none" stroke="rgba(170,200,255,0.32)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
          <path d={(borders as any).BR} fill={`rgba(229,38,47,${0.16 * red})`} stroke={red > 0 ? `rgba(255,${Math.round(210 - 150 * red)},${Math.round(255 - 200 * red)},0.9)` : 'rgba(150,210,255,0.75)'}
            strokeWidth={2.6 + 2 * red} vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
    </>
  );
};

// curva suave por vários pontos (Catmull-Rom), em tela
const smooth = (pts: [number, number][], n = 24) => {
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)) as [number, number]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};
const arc = (a: [number, number], b: [number, number], bend: number) => {
  const m: [number, number] = [(a[0] + b[0]) / 2 - (b[1] - a[1]) * bend, (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend];
  return smooth([a, m, b], 30);
};
type RouteProps = {pts: [number, number][]; p: number; color: string; dashed?: boolean; width?: number; o?: number; icon?: 'plane' | 'van' | 'none'; badge?: string; glow?: boolean};
const Route: React.FC<RouteProps> = ({pts, p, color, dashed, width = 7, o = 1, icon = 'none', badge, glow = true}) => {
  if (p <= 0 || o <= 0) return null;
  // comprimento acumulado para a fração p andar em velocidade constante
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const goal = L[L.length - 1] * Math.min(1, p);
  const vis: [number, number][] = [pts[0]];
  let ang = 0;
  for (let i = 1; i < pts.length; i++) {
    if (L[i] <= goal) { vis.push(pts[i]); continue; }
    const k = (goal - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
    vis.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]);
    break;
  }
  const tip = vis[vis.length - 1], prev = vis[Math.max(0, vis.length - 2)];
  const seg = vis.length > 1 ? [tip[0] - prev[0], tip[1] - prev[1]] : [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]];
  ang = (Math.atan2(seg[1], seg[0]) * 180) / Math.PI;
  const d = 'M' + vis.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('L');
  return (
    <>
      <svg width={W + PAD * 2} height={H + PAD * 2} style={{position: 'absolute', left: 0, top: 0, opacity: o}}>
        {/* brilho sem blur: traço largo e transparente por baixo */}
        {glow && <path d={d} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={width * 4.2} strokeLinecap="round" />}
        {glow && <path d={d} fill="none" stroke={color} strokeOpacity={0.3} strokeWidth={width * 2.2} strokeLinecap="round" />}
        <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? `${width * 2.4} ${width * 2.2}` : undefined} />
        <circle cx={pts[0][0]} cy={pts[0][1]} r={width * 1.5} fill={color} />
      </svg>
      {icon !== 'none' && (
        <div style={{position: 'absolute', left: tip[0] - 44, top: tip[1] - 44, width: 88, height: 88, opacity: o,
          transform: `rotate(${icon === 'plane' ? ang + 90 : ang}deg)`}}>
          {icon === 'plane' ? <PlaneIcon color="#fff" glow={color} /> : <VanIcon />}
        </div>
      )}
      {badge && <Badge src={badge} size={112} ring={color} x={tip[0] + 78} y={tip[1] - 70} o={o} />}
    </>
  );
};
const PlaneIcon: React.FC<{color: string; glow: string; blink?: boolean}> = ({color, glow, blink}) => (
  <svg viewBox="0 0 64 64" width={88} height={88} style={{overflow: 'visible'}}>
    <circle cx={32} cy={32} r={30} fill={glow} opacity={0.22} />
    <path fill={color} stroke="#000" strokeOpacity={0.5} strokeWidth={1.2} d="M32 2c2.2 0 3.6 3 3.6 7v15l22 13v6l-22-6v13l7 5v5l-10.6-3L21.4 59v-5l7-5V36l-22 6v-6l22-13V9c0-4 1.4-7 3.6-7z" />
    {blink && <><circle cx={9} cy={39} r={3.2} fill="#ff3b3b" /><circle cx={55} cy={39} r={3.2} fill="#3bff7a" /></>}
  </svg>
);
// van vista de cima, apontando para a direita, com faróis
const VanIcon: React.FC = () => (
  <svg viewBox="0 0 88 88" width={88} height={88} style={{overflow: 'visible'}}>
    <path d="M62 36 L150 10 L150 78 L62 52 Z" fill="rgba(255,236,170,0.28)" />
    <path d="M62 38 L120 26 L120 62 L62 50 Z" fill="rgba(255,240,190,0.35)" />
    <rect x={16} y={30} width={48} height={28} rx={6} fill="#f2f2f2" stroke="#000" strokeOpacity={0.5} strokeWidth={1.5} />
    <rect x={50} y={33} width={10} height={22} rx={2} fill="#2b3442" />
    <circle cx={63} cy={35} r={2.6} fill="#fff6c8" /><circle cx={63} cy={53} r={2.6} fill="#fff6c8" />
    <circle cx={17} cy={34} r={2} fill="#ff2a2a" /><circle cx={17} cy={54} r={2} fill="#ff2a2a" />
  </svg>
);

// ---------- peças ----------
const Badge: React.FC<{src: string; size: number; ring: string; x: number; y: number; o?: number; sc?: number}> = ({src, size, ring, x, y, o = 1, sc = 1}) => (
  <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size, overflow: 'hidden',
    border: `${Math.max(4, size * 0.045)}px solid ${ring}`, boxShadow: `0 0 ${size * 0.25}px ${ring}aa, 0 10px 30px rgba(0,0,0,0.5)`,
    opacity: o, transform: `scale(${sc})`, background: '#111'}}>
    <Img src={staticFile(`v/f_${src}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  </div>
);
const Ping: React.FC<{x: number; y: number; t: number; a: number; color?: string; o?: number; r?: number}> = ({x, y, t, a, color = AMBER, o = 1, r = 90}) => {
  if (t < a || o <= 0) return null;
  const ph = ((t - a) % 1.4) / 1.4;
  return (
    <div style={{opacity: o}}>
      {[0, 0.5].map((d) => {
        const q = (ph + d) % 1;
        return <div key={d} style={{position: 'absolute', left: x - r * q, top: y - r * q, width: 2 * r * q, height: 2 * r * q, borderRadius: 999,
          border: `4px solid ${color}`, opacity: 1 - q}} />;
      })}
      <div style={{position: 'absolute', left: x - 13, top: y - 13, width: 26, height: 26, borderRadius: 26, background: color, boxShadow: `0 0 20px ${color}`}} />
    </div>
  );
};
// rótulo preso ao lugar (no palco inclinado: contra-rotação para ficar de pé)
const Tag: React.FC<{x: number; y: number; o: number; title: string; sub?: string; color?: string; align?: 'l' | 'r' | 'c'; tilt: number; size?: number}> =
  ({x, y, o, title, sub, color = CYAN, align = 'l', tilt, size = 46}) => (
    o <= 0 ? null : (
      <div style={{position: 'absolute', left: x, top: y, opacity: o, transformOrigin: '0 100%',
        transform: `translate(${align === 'l' ? 28 : align === 'r' ? -28 : 0}px,-100%) rotateX(${-tilt}deg) translateX(${align === 'r' ? '-100%' : align === 'c' ? '-50%' : '0'})`,
        whiteSpace: 'nowrap', textAlign: align === 'r' ? 'right' : align === 'c' ? 'center' : 'left'}}>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: size, color: '#fff', textShadow: '0 3px 12px #000, 0 0 3px #000'}}>{title}</div>
        {sub && <div style={{fontFamily: MONO, fontSize: size * 0.56, color, letterSpacing: 1, textShadow: '0 2px 8px #000'}}>{sub}</div>}
      </div>
    )
  );
const Stamp: React.FC<{x: number; y: number; t: number; a: number; b?: number; color?: string; size?: number; rot?: number; children: React.ReactNode}> =
  ({x, y, t, a, b = 999, color = RED, size = 60, rot = -6, children}) => {
    const o = fade(t, a, b, 0.12);
    if (o <= 0) return null;
    return (
      <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${pop(t, a)})`, opacity: o,
        border: `${size * 0.09}px solid ${color}`, color, fontFamily: FONT, fontWeight: 800, fontSize: size, padding: `${size * 0.08}px ${size * 0.32}px`,
        borderRadius: size * 0.16, whiteSpace: 'nowrap', letterSpacing: 2, background: 'rgba(8,8,12,0.7)', lineHeight: 1.1, textAlign: 'center',
        boxShadow: `0 0 30px ${color}55`}}>{children}</div>
    );
  };
// caixinha estilo rastreador de voo
const FlightBox: React.FC<{x: number; y: number; o: number; t: number; strike: number}> = ({x, y, o, t, strike}) => (
  o <= 0 ? null : (
    <div style={{position: 'absolute', left: x, top: y, opacity: o, transform: `translate(-50%,-100%) scale(${interpolate(o, [0, 1], [0.9, 1])})`,
      background: 'rgba(10,14,22,0.92)', border: `3px solid ${AMBER}`, borderRadius: 14, padding: '16px 24px', fontFamily: MONO, color: WHITE,
      fontSize: 30, lineHeight: 1.35, boxShadow: '0 14px 40px rgba(0,0,0,0.7)', whiteSpace: 'nowrap'}}>
      <div style={{color: AMBER, fontSize: 36}}>LV-JQW</div>
      <div>GULFSTREAM G400</div>
      <div style={{opacity: 0.7}}>BUENOS AIRES → P. IGUAZÚ</div>
      <div style={{position: 'relative', display: 'inline-block', opacity: ramp(t, 45.3, 45.6)}}>PARTIDA 02:00
        <div style={{position: 'absolute', left: -4, top: '52%', height: 5, background: RED, width: `${strike * 104}%`}} /></div>
      <div style={{opacity: ramp(t, 47.6, 47.9)}}>PASSAGEIROS: <span style={{color: AMBER}}>4</span></div>
      {strike > 0.5 && <div style={{color: RED}}>AGUARDANDO…</div>}
    </div>
  )
);

// ---------- relógio da história (minutos desde segunda 00:00) ----------
const STORY: [number, number][] = [
  [0, 2810], [18.8, 2810], [23.4, 660], [30.2, 665], [37.3, 668], [37.6, 1260], [48.7, 1560 - 2], [49.2, 1560], [56.0, 2096], [56.6, 2100],
  [60.9, 2280], [61.8, 2640], [62.7, 2810], [63.7, 2810], [66.4, 2850], [68.0, 2852], [74.1, 3262], [78.0, 3262],
];
const DAYS = ['SEG', 'TER', 'QUA'];
const hhmm = (m: number) => `${String(Math.floor((m % 1440) / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
const TopBar: React.FC<{t: number}> = ({t}) => {
  const m = lerpK(t, STORY);
  const night = t >= 37.6 && t < 48.7;
  const label = night ? 'SEG · NOITE' : `${DAYS[Math.min(2, Math.floor(m / 1440))]} · ${hhmm(m)}`;
  const rew = t > 18.8 && t < 23.4;
  const oMain = fade(t, 0.15, 78.2, 0.3);
  // prazo: entregue na segunda 11h, vence terça 11h
  const oPrazo = fade(t, 24.9, 78.2, 0.3);
  const left = Math.max(0, 2100 - m);
  const venc = m >= 2100;
  const flash = venc ? 0.6 + 0.4 * Math.sin(t * 9) : 1;
  // avião esperando desde terça 02:00
  const oWait = fade(t, 49.2, 78.2, 0.3);
  const wait = Math.max(0, Math.min(m, 2850) - 1560);
  const done = m >= 2850;
  const box = (o: number, title: string, val: string, col: string, sub?: string) => (
    <div style={{width: 430, opacity: o, background: 'rgba(8,10,16,0.82)', border: `3px solid ${col}`, borderRadius: 14, padding: '10px 16px', textAlign: 'center',
      transform: `scale(${interpolate(o, [0, 1], [0.85, 1])})`, boxShadow: `0 0 26px ${col}44`}}>
      <div style={{fontFamily: MONO, fontSize: 24, color: 'rgba(255,255,255,0.75)', letterSpacing: 2}}>{title}</div>
      <div style={{fontFamily: MONO, fontSize: 58, color: col, lineHeight: 1.1}}>{val}</div>
      {sub && <div style={{fontFamily: MONO, fontSize: 22, color: col, letterSpacing: 2}}>{sub}</div>}
    </div>
  );
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 110}}>
      <div style={{display: 'flex', justifyContent: 'center', opacity: oMain}}>
        <div style={{fontFamily: MONO, fontSize: 50, color: '#0a0a0a', background: rew ? WHITE : AMBER, padding: '6px 26px', borderRadius: 8, letterSpacing: 3,
          boxShadow: `0 0 30px ${AMBER}66`}}>{rew ? '◀◀ ' : ''}{label}</div>
      </div>
      <div style={{display: 'flex', justifyContent: 'center', gap: 30, marginTop: 22}}>
        {box(oPrazo, 'PRAZO DO PASSAPORTE', venc ? 'VENCIDO' : `${hhmm(left).replace(':', 'h')}`, venc ? RED : WHITE, venc ? 'TER · 11:00' : 'ATÉ TER · 11:00')}
        {box(oWait * (done ? 1 : 1), 'AVIÃO ESPERANDO', `${Math.floor(wait / 60)}h${String(Math.floor(wait % 60)).padStart(2, '0')}`, done ? '#3bff7a' : AMBER, done ? 'DECOLOU' : 'DESDE 02:00')}
      </div>
      {venc && t < 60 && <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 0, opacity: 0}}>{flash}</div>}
    </div>
  );
};
const Source: React.FC<{t: number; a: number; b: number; children: React.ReactNode}> = ({t, a, b, children}) => {
  const o = fade(t, a, b, 0.2);
  return o <= 0 ? null : (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 60, textAlign: 'center', fontFamily: MONO, fontSize: 26, color: 'rgba(255,255,255,0.78)',
      letterSpacing: 1, opacity: o, textShadow: '0 2px 8px #000'}}>FONTE: {children}</div>
  );
};

// ---------- legenda ----------
const WORDS = (tl as any).words as {w: string; s: number; e: number}[];
const FIXW: Record<string, string> = {'vã': 'van', 'Fós': 'Foz', '-feira,': '', '-feira.': '', 'C': 'C5N', '-5N,': '', 'Piru.': 'Peru.', 'ao': 'o', '10h50': 'Dez e cinquenta', 'Destino?': 'Destino:'};
const CAPS = (() => {
  const ws: {w: string; s: number; e: number}[] = [];
  WORDS.forEach((w) => {
    let x = w.w in FIXW ? FIXW[w.w] : w.w;
    if (w.w === '-feira,' || w.w === '-feira.') { if (ws.length) ws[ws.length - 1].w += w.w.replace('-', '-'); return; }
    if (!x) return;
    ws.push({...w, w: x});
  });
  const out: {s: number; e: number; t: string}[] = [];
  let cur: typeof ws = [];
  const flush = () => { if (cur.length) out.push({s: cur[0].s, e: cur[cur.length - 1].e, t: cur.map((c) => c.w).join(' ')}); cur = []; };
  ws.forEach((w, i) => {
    cur.push(w);
    const len = cur.map((c) => c.w).join(' ').length;
    const end = /[.?!,:]$/.test(w.w) || (ws[i + 1] && ws[i + 1].s - w.e > 0.3);
    if (end || cur.length >= 4 || len > 18) flush();
  });
  flush();
  return out.map((c, i) => ({...c, e: Math.min(out[i + 1] ? out[i + 1].s : c.e + 0.6, c.e + 0.45)}));
})();
const Caption: React.FC<{t: number}> = ({t}) => {
  const c = CAPS.find((q) => t >= q.s - 0.05 && t < q.e);
  if (!c) return null;
  const sc = interpolate(t, [c.s - 0.05, c.s + 0.08], [0.9, 1], clamp);
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 1540, textAlign: 'center', transform: `scale(${sc})`}}>
      <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 64, color: '#fff', lineHeight: 1.15, textTransform: 'uppercase',
        WebkitTextStroke: '3px #000', paintOrder: 'stroke fill', textShadow: '0 6px 20px rgba(0,0,0,0.9)'}}>{c.t.replace(/[.,]$/, '')}</span>
    </div>
  );
};

// ---------- composição ----------
export const FugaM: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const c = camAt(t);
  const S = (p: LL): [number, number] => { const q = proj(c, p); return [q[0] + PAD, q[1] + PAD]; };
  const tilt = c.tilt;
  // posição na TELA de um ponto do palco inclinado (mesma perspectiva do CSS)
  const scr = (q: [number, number]): [number, number] => {
    const a = (tilt * Math.PI) / 180, oy = PAD + H * 0.55, py = PAD + H * 0.42, px = PAD + W / 2;
    const dy = q[1] - oy, y1 = oy + dy * Math.cos(a), z1 = dy * Math.sin(a), k = 1500 / (1500 - z1);
    return [px + (q[0] - px) * k - PAD, py + (y1 - py) * k - PAD];
  };

  // posições (no palco)
  const pBR = S(P.P_BR), pAR = S(P.P_AR), van0 = S(P.VAN0), aero = S(P.AERO), casa = S(P.CASA), bsb = S(P.BSB), foz = S(P.FOZ), ba = S(P.BA), faz = S(P.FAZ);
  const gye = S(P.GYE), opf = S(P.OPF), orl = S(P.ORL);

  // van: aproxima-se da ponte (abertura) e depois cruza (63,7–65,8)
  const vanApproach = ramp(t, 0.6, 14.5) * 0.92;
  const vanCross = ramp(t, 63.8, 65.9);
  const vanPts = smooth([van0, [(van0[0] + pBR[0]) / 2 + 30, (van0[1] + pBR[1]) / 2], pBR, pAR], 20);
  const vanP = t < 40 ? vanApproach * 0.5 : 0.5 + vanCross * 0.5;
  const vanO = fade(t, 0.3, 19.2, 0.4) + fade(t, 63.3, 67.0, 0.3);

  // jato parado em Puerto Iguazú (abertura e 45–68)
  const jetO = fade(t, 0.3, 19.2, 0.4) + fade(t, 44.4, 66.5, 0.2);
  const blink = Math.floor(t * 2.4) % 2 === 0;

  // rotas
  const rBsbFoz = arc(bsb, foz, 0.1);
  const rBaAero = arc(ba, aero, -0.12);
  const rAeroGye = smooth([aero, S(P.PY), S(P.BO), S(P.PE), gye], 26);
  const rGyeOpf = arc(gye, opf, 0.12);
  const r2022 = arc(bsb, orl, 0.16);
  const r2022back = arc(orl, bsb, 0.16);
  const red = fade(t, 68.6, 74.4, 0.5);

  // janelinha (vídeo real do Flávio): 30,6–37,3
  const jA = 30.55, jB = 37.35;
  const jo = fade(t, jA - 0.15, jB, 0.25);
  const dimJ = jo * 0.45;

  return (
    <AbsoluteFill style={{background: '#04060c', overflow: 'hidden'}}>
      {/* palco do mapa, inclinado quando a câmera "desce" */}
      <div style={{position: 'absolute', left: -PAD, top: -PAD, width: W + PAD * 2, height: H + PAD * 2, perspective: 1500, perspectiveOrigin: `50% ${PAD + H * 0.42}px`}}>
        <div style={{position: 'absolute', inset: 0, transformOrigin: `50% ${PAD + H * 0.55}px`, transform: `rotateX(${tilt}deg)`, transformStyle: 'preserve-3d'}}>
          <Mapa c={c} red={red} />

          {/* ===== ABERTURA: ponte, van chegando, jato do outro lado ===== */}
          <Route pts={vanPts} p={vanP} color={AMBER} width={8} o={vanO} icon="van" glow />
          {jetO > 0 && (
            <div style={{position: 'absolute', left: aero[0] - 44, top: aero[1] - 44, opacity: jetO, transform: 'rotate(-35deg)'}}>
              <PlaneIcon color="#fff" glow={AMBER} blink={blink} />
            </div>
          )}
          <Tag x={pBR[0]} y={pBR[1]} o={fade(t, 1.0, 9.6) * (1 - ramp(t, 9.4, 9.8))} title="PONTE TANCREDO NEVES" sub="BRASIL → ARGENTINA" tilt={tilt} align="l" size={40} />
          <Tag x={aero[0]} y={aero[1] - 40} o={fade(t, 15.0, 19.0)} title="PUERTO IGUAZÚ" sub="AEROPORTO · ARGENTINA" tilt={tilt} align="r" size={42} />
          <Tag x={pBR[0] - 20} y={pBR[1] - 30} o={fade(t, 10.3, 15.0)} title="4 PESSOAS" sub="SENADOR · ESPOSA · 2 FILHAS" tilt={tilt} align="l" size={44} color={AMBER} />
          <Tag x={(pBR[0] + aero[0]) / 2} y={(pBR[1] + aero[1]) / 2 + 40} o={fade(t, 15.2, 19.0)} title="RIO IGUAÇU" tilt={tilt} align="c" size={34} color={CYAN} />

          {/* ===== Brasília: casa do pai e a PF ===== */}
          <Ping x={casa[0]} y={casa[1]} t={t} a={24.6} o={fade(t, 24.6, 37.6)} color={RED} />
          <Tag x={casa[0]} y={casa[1]} o={fade(t, 25.2, 30.6)} title="CASA DO PAI" sub="JARDIM BOTÂNICO · BRASÍLIA" tilt={tilt} />
          <Stamp x={casa[0] + 140} y={casa[1] + 110} t={t} a={28.75} b={30.5} color={RED} size={46}>POLÍCIA FEDERAL</Stamp>

          {/* ===== rotas de segunda à noite ===== */}
          <Route pts={rBsbFoz} p={ramp(t, 37.7, 40.2)} color={AMBER} o={fade(t, 37.6, 52.4, 0.3)} icon={t < 40.4 ? 'plane' : 'none'} badge={t < 41.4 ? 'flavio' : undefined} />
          <Tag x={bsb[0]} y={bsb[1]} o={fade(t, 37.8, 41.4)} title="BRASÍLIA" sub="SEGUNDA · NOITE" tilt={tilt} />
          <Route pts={rBaAero} p={ramp(t, 41.0, 44.6)} color={WHITE} o={fade(t, 40.9, 45.8, 0.3)} icon={t < 44.6 ? 'plane' : 'none'} />
          <Tag x={ba[0]} y={ba[1]} o={fade(t, 41.0, 45.4)} title="BUENOS AIRES" sub="JATINHO PARTICULAR" tilt={tilt} align="r" />
          <Ping x={foz[0]} y={foz[1]} t={t} a={40.2} o={fade(t, 40.2, 45.4)} color={AMBER} />
          <Tag x={foz[0]} y={foz[1]} o={fade(t, 40.3, 45.4)} title="FOZ DO IGUAÇU" tilt={tilt} />

          {/* ===== fazenda (local não divulgado) ===== */}
          {(() => {
            const o = fade(t, 52.4, 63.6, 0.4);
            if (o <= 0) return null;
            const r = 150 + 12 * Math.sin(t * 3);
            return (
              <div style={{opacity: o}}>
                <div style={{position: 'absolute', left: faz[0] - r, top: faz[1] - r, width: r * 2, height: r * 2, borderRadius: 999, border: `4px dashed ${AMBER}`,
                  background: `${AMBER}22`}} />
                <Badge src="flavio" size={110} ring={AMBER} x={faz[0]} y={faz[1]} />
                <Tag x={faz[0]} y={faz[1] - 170} o={1} title="FAZENDA EM FOZ" sub="LOCAL NÃO DIVULGADO" tilt={tilt} color={AMBER} align="c" />
              </div>
            );
          })()}

          {/* ===== rota até Guayaquil e Miami ===== */}
          <Route pts={rAeroGye} p={ramp(t, 67.6, 74.0)} color={AMBER} o={fade(t, 67.4, 78.4, 0.3)} icon={t < 74.1 ? 'plane' : 'none'} />
          {([['PARAGUAI', P.PY, 70.48], ['BOLÍVIA', P.BO, 71.44], ['PERU', P.PE, 72.39], ['EQUADOR', P.EC, 73.13]] as [string, LL, number][]).map(([n, p, a]) => {
            const q = S(p);
            return <Tag key={n} x={q[0]} y={q[1] - 20} o={fade(t, a, 74.0)} title={n} tilt={tilt} align="c" size={44} />;
          })}
          {(() => {
            const o = fade(t, 68.5, 74.2, 0.4);
            if (o <= 0) return null;
            const q = S([-56, -7]);
            return <Tag x={q[0]} y={q[1]} o={o} title="ESPAÇO AÉREO" sub="BRASILEIRO · EVITADO" tilt={tilt} align="c" size={44} color={RED} />;
          })()}
          <Tag x={gye[0]} y={gye[1]} o={fade(t, 74.0, 78.2)} title="GUAYAQUIL" sub="QUA · 06:22" tilt={tilt} align="r" />
          <Route pts={rGyeOpf} p={ramp(t, 75.1, 77.6)} color={AMBER} o={fade(t, 75.0, 78.6, 0.3)} icon={t < 77.7 ? 'plane' : 'none'} />

          {/* ===== 2022: o pai ===== */}
          <Route pts={r2022} p={ramp(t, 78.6, 81.2)} color={BLUE} dashed o={fade(t, 78.5, 88.4, 0.3) * 0.9} icon={t < 81.3 ? 'plane' : 'none'} badge={t < 82.3 ? 'jair' : undefined} />
          <Tag x={orl[0]} y={orl[1]} o={fade(t, 80.4, 84.6)} title="FLÓRIDA" sub="DEZ · 2022" tilt={tilt} color={BLUE} />
          <Route pts={r2022back} p={ramp(t, 82.4, 83.2)} color={BLUE} o={fade(t, 82.3, 88.4, 0.3) * 0.55} width={5} />
          {t > 83.1 && <Badge src="jair" size={140} ring={BLUE} x={bsb[0]} y={bsb[1]} o={fade(t, 83.1, 88.4, 0.2)} sc={pop(t, 83.1)} />}
          <Stamp x={bsb[0]} y={bsb[1] + 120} t={t} a={84.1} b={88.4} color={RED} size={48}>PRESO</Stamp>
          <Route pts={rGyeOpf} p={1} color={AMBER} o={fade(t, 78.4, 88.4, 0.3)} width={6} />
          <Ping x={opf[0]} y={opf[1]} t={t} a={84.9} o={fade(t, 84.9, 88.4)} color={AMBER} r={120} />
          {t > 84.9 && <Badge src="flavio" size={170} ring={AMBER} x={opf[0] + 10} y={opf[1] - 150} o={ramp(t, 84.9, 85.2)} sc={pop(t, 84.9)} />}
          <Tag x={opf[0]} y={opf[1]} o={fade(t, 85.4, 88.4)} title="MIAMI" sub="OPA-LOCKA" tilt={tilt} />
        </div>
      </div>

      {/* vinheta */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.6) 100%)'}} />
      {/* alerta do prazo vencido */}
      {t > 57.7 && t < 59.9 && <AbsoluteFill style={{boxShadow: `inset 0 0 160px ${RED}`, opacity: 0.6 * fade(t, 57.7, 59.9, 0.2) * (0.6 + 0.4 * Math.sin(t * 12))}} />}
      {/* tempo acelerando */}
      {t > 60.7 && t < 63.4 && <AbsoluteFill style={{background: `rgba(255,190,90,${0.07 * (0.5 + 0.5 * Math.sin(t * 14))})`}} />}
      {dimJ > 0 && <AbsoluteFill style={{background: `rgba(2,3,6,${dimJ})`}} />}
      {t < 0.5 && <AbsoluteFill style={{background: '#000', opacity: 1 - ramp(t, 0, 0.5)}} />}

      {/* caixinha do jato */}
      <FlightBox x={scr(aero)[0]} y={scr(aero)[1] - 70} o={fade(t, 45.1, 51.9, 0.25)} t={t} strike={ramp(t, 49.5, 50.0)} />

      {/* janelinha presa a Brasília */}
      {jo > 0 && (
        <>
          <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: jo}}>
            <line x1={scr(casa)[0]} y1={scr(casa)[1]} x2={560} y2={640} stroke={RED} strokeWidth={4} />
          </svg>
          <div style={{position: 'absolute', left: 540, top: 470, width: 480, height: 608, borderRadius: 18, overflow: 'hidden', opacity: jo,
            transform: `scale(${interpolate(t, [jA - 0.15, jA + 0.2], [0.8, 1], clamp)})`, border: '5px solid #fff', boxShadow: '0 18px 60px rgba(0,0,0,0.75)'}}>
            <Sequence from={Math.round(jA * FPS)} layout="none">
              <OffthreadVideo src={staticFile('m/jan.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </Sequence>
            <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 14px', background: 'linear-gradient(0deg,rgba(0,0,0,0.85),rgba(0,0,0,0))',
              fontFamily: MONO, fontSize: 22, color: '#fff', letterSpacing: 1}}>FLÁVIO BOLSONARO · SEG 26/10</div>
          </div>
        </>
      )}

      <TopBar t={t} />
      {jo <= 0.05 && <Caption t={t} />}
      {jo > 0.05 && (
        <div style={{position: 'absolute', left: 60, right: 60, top: 1180, textAlign: 'center', opacity: jo, fontFamily: FONT, fontWeight: 800, fontSize: 52, color: '#fff',
          lineHeight: 1.2, textShadow: '0 4px 16px #000'}}>
          {t < 34.6 ? '"Eu fui intimado a entregar os meus passaportes"' : '"Eu nunca pensei em sair do país"'}
        </div>
      )}

      <Source t={t} a={0.3} b={19.2}>MIGRACIONES (ARGENTINA)</Source>
      <Source t={t} a={30.4} b={37.4}>VÍDEO DO SENADOR / METRÓPOLES</Source>
      <Source t={t} a={37.7} b={40.8}>INFOBAE</Source>
      <Source t={t} a={41.0} b={52.2}>H2FOZ</Source>
      <Source t={t} a={52.3} b={56.0}>C5N</Source>
      <Source t={t} a={56.1} b={63.5}>STF · H2FOZ</Source>
      <Source t={t} a={63.7} b={67.3}>MIGRACIONES (ARGENTINA)</Source>
      <Source t={t} a={67.4} b={78.2}>FLIGHTAWARE · G1</Source>

      <Audio src={staticFile('m/mix.wav')} />
    </AbsoluteFill>
  );
};
