import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import meta from '../public/meta.json';
import borders from '../public/borders.json';

// Carta dos democratas (quem pagou o jato?) — história contada NO mapa. 9:16, 30 fps. Tempos = mix final (narração 1.08x + janelinha).
const W = 1080, H = 1920, FPS = 30;
export const DEMC_LEN = Math.round(44.6 * FPS);
const FONT = 'Poppins', MONO = 'Mono';
const GREEN = '#7cf2a2', AMBER = '#ffb020', RED = '#e5262f', BLUE = '#3b74ff', CYAN = '#5fd4ff', WHITE = '#f4f7ff';

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
  BSB: [-47.88, -15.79], FOZ: [-54.58, -25.52], AERO: [-54.4734, -25.7373],
  PY: [-58.2, -23.0], BO: [-64.6, -17.0], PE: [-74.5, -9.8], EC: [-78.6, -1.4], GYE: [-79.885, -2.157], OPF: [-80.278, 25.907],
  DC: [-77.0091, 38.8899], CB: [-77.0365, 38.8977], SD: [-77.0457, 38.8933], CONTA: [-90, 33.5],
};
type Cam = {x: number; y: number; z: number; tilt: number};
const fit = (a: LL, b: LL, pad = 0.62, tilt = 0): Cam => {
  const x0 = wx(a[0]), x1 = wx(b[0]), y0 = wy(a[1]), y1 = wy(b[1]);
  const z = Math.log2(Math.min((W * pad) / Math.max(1e-6, Math.abs(x1 - x0)), (H * pad * 0.6) / Math.max(1e-6, Math.abs(y1 - y0))));
  return {x: (x0 + x1) / 2, y: (y0 + y1) / 2, z, tilt};
};
const at = (p: LL, z: number, tilt = 0, dy = 0): Cam => ({x: wx(p[0]), y: wy(p[1]) + dy / 2 ** z, z, tilt});
const mid = (a: LL, b: LL): LL => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

const WIDE = () => fit(P.AERO, P.DC, 0.62, 22);
const KEYS: [number, Cam][] = [
  [0, at(P.AERO, 12.4, 46, 40)],
  [2.6, at(P.AERO, 12.6, 46, 40)],
  [4.2, WIDE()],
  [6.3, WIDE()],
  [6.9, fit(P.FOZ, P.OPF, 0.7, 16)],
  [10.6, fit(P.FOZ, P.OPF, 0.7, 16)],
  [11.3, WIDE()],
  [17.0, WIDE()],
  [17.5, fit(P.AERO, P.CONTA, 0.6, 14)],
  [20.6, fit(P.AERO, P.CONTA, 0.6, 14)],
  [23.2, at(P.DC, 9.8, 28, 30)],
  [24.9, at(P.DC, 10.0, 28, 30)],
  [26.0, at(mid(P.DC, P.SD), 12.4, 40, 40)],
  [28.5, at(mid(P.DC, P.SD), 12.6, 40, 40)],
  [29.4, WIDE()],
  [45.8, fit(P.AERO, P.DC, 0.56, 22)],
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
const LAYERS = (['L3', 'L5', 'L7', 'LB', 'L10', 'L13', 'LW8', 'LW10', 'LW13'] as const).map((k) => ({k, ...(meta as any)[k]})) as {k: string; z: number; x0: number; y0: number; w: number; h: number}[];
const PAD = 700; // o palco é maior que a tela para a inclinação não mostrar borda
const Mapa: React.FC<{c: Cam; red: number}> = ({c, red}) => {
  const s0 = 2 ** c.z;
  return (
    <>
      {LAYERS.map((L, i) => {
        if (c.z - L.z > 5) return null;
        const o = i <= 1 ? 1 : interpolate(c.z, [L.z - 1.6, L.z - 0.8], [0, 1], clamp);
        if (o <= 0) return null;
        const k = 2 ** (c.z - L.z);
        const left = (L.x0 * 256 / 2 ** L.z - c.x) * s0 + W / 2 + PAD, top = (L.y0 * 256 / 2 ** L.z - c.y) * s0 + H / 2 + PAD;
        return (
          <Img key={L.k} src={staticFile(`${L.k}.jpg`)}
            style={{position: 'absolute', left: 0, top: 0, width: L.w, height: L.h, opacity: o, transformOrigin: '0 0',
              transform: `translate(${left}px,${top}px) scale(${k})`, filter: L.k === 'L13' ? 'brightness(1.3) contrast(1.1)' : L.k === 'LB' ? 'brightness(1.1)' : undefined,
              WebkitMaskImage: L.k === 'LB' || L.k.startsWith('LW') ? 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 55%, transparent 100%)' : undefined}} />
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

const Source: React.FC<{t: number; a: number; b: number; children: React.ReactNode}> = ({t, a, b, children}) => {
  const o = fade(t, a, b, 0.2);
  return o <= 0 ? null : (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 60, textAlign: 'center', fontFamily: MONO, fontSize: 26, color: 'rgba(255,255,255,0.78)',
      letterSpacing: 1, opacity: o, textShadow: '0 2px 8px #000'}}>FONTE: {children}</div>
  );
};

// ---------- roteiro: [início, fim, texto] (tempos estimados até chegar a narração) ----------
const EST = [0, 3.6, 3.7, 6.2, 6.6, 10.4, 11.0, 16.8, 17.4, 21.2, 21.8, 24.6, 25.2, 28.2, 28.8, 36.4, 37.0, 41.2, 41.8, 45.5, 47];
const REAL = [0, 2.3, 3.26, 6.4, 7.46, 11.3, 12.18, 17.3, 17.88, 20.4, 21.26, 23.9, 24.28, 26.6, 27.34, 33.9, 34.58, 37.7, 38.56, 43.0, 44.2];
const LINES: [number, number, string][] = [
  [0.0, 2.3, 'Quem pagou o jato do Flávio Bolsonaro?'],
  [3.26, 6.4, 'Agora vinte e cinco deputados americanos querem saber.'],
  [7.46, 11.3, 'Flávio Bolsonaro foi para os Estados Unidos, passando pela Argentina.'],
  [12.18, 17.3, 'O jato que o levou foi providenciado por um assessor da Casa Branca. Ele mesmo confirmou.'],
  [17.88, 20.4, 'O voo foi pago por uma conta nos Estados Unidos.'],
  [21.26, 23.9, 'Vinte e cinco deputados americanos não gostaram.'],
  [24.28, 26.6, 'Escreveram ao secretário de Estado, Marco Rubio.'],
  [27.34, 33.9, 'Querem saber se o governo ajudou na viagem, se soube da decisão do STF antes e se combinou o roteiro.'],
  [34.58, 37.7, 'O Departamento de Estado tem até treze de novembro para responder.'],
  [38.56, 43.0, 'Até lá, uma pergunta continua sem resposta: quem pagou?'],
];
const WORDS: [string, number, number][] = [["Quem", 0.0, 0.36], ["pagou", 0.36, 0.78], ["o", 0.78, 0.94], ["jato", 0.94, 1.24], ["do", 1.24, 1.48], ["Flávio", 1.48, 1.82], ["Bolsonaro?", 1.82, 2.2], ["Agora,", 3.26, 3.56], ["25", 3.94, 4.16], ["deputados", 4.16, 4.9], ["americanos", 4.9, 5.64], ["querem", 5.64, 5.92], ["saber.", 5.92, 6.24], ["Flávio", 7.46, 8.06], ["Bolsonaro", 8.06, 8.56], ["foi", 8.56, 8.86], ["para", 8.86, 9.02], ["os", 9.02, 9.14], ["Estados", 9.14, 9.36], ["Unidos,", 9.36, 9.72], ["passando", 10.08, 10.5], ["pela", 10.5, 10.7], ["Argentina.", 10.7, 11.1], ["O", 12.18, 12.32], ["jato", 12.32, 12.6], ["que", 12.6, 12.76], ["o", 12.76, 12.82], ["levou", 12.82, 13.1], ["foi", 13.1, 13.34], ["providenciado", 13.34, 14.0], ["por", 14.0, 14.18], ["um", 14.18, 14.32], ["assessor", 14.32, 14.8], ["da", 14.8, 14.94], ["Casa", 14.94, 15.16], ["Branca.", 15.16, 15.52], ["Ele", 16.14, 16.36], ["mesmo", 16.36, 16.58], ["confirmou.", 16.58, 17.16], ["O", 17.88, 18.08], ["voo", 18.08, 18.3], ["foi", 18.3, 18.42], ["pago", 18.42, 18.68], ["por", 18.68, 18.86], ["uma", 18.86, 18.98], ["conta", 18.98, 19.34], ["nos", 19.34, 19.56], ["Estados", 19.56, 19.84], ["Unidos.", 19.84, 20.2], ["25", 21.26, 21.72], ["deputados", 21.72, 22.36], ["americanos", 22.36, 22.98], ["não", 22.98, 23.26], ["gostaram.", 23.26, 23.7], ["Escreveram", 24.28, 24.84], ["ao", 24.84, 24.96], ["secretário", 24.96, 25.38], ["de", 25.38, 25.52], ["Estado,", 25.52, 25.78], ["Marco", 26.0, 26.14], ["Rubio.", 26.14, 26.54], ["Querem", 27.34, 27.54], ["saber", 27.54, 27.84], ["se", 27.84, 28.02], ["o", 28.02, 28.1], ["governo", 28.1, 28.36], ["ajudou", 28.36, 28.86], ["na", 28.86, 28.98], ["viagem.", 28.98, 29.34], ["Se", 29.34, 30.0], ["soube", 30.0, 30.4], ["da", 30.4, 30.52], ["decisão", 30.52, 30.98], ["do", 30.98, 31.08], ["STF", 31.08, 31.56], ["antes,", 31.56, 31.84], ["se", 32.42, 32.52], ["combinou", 32.52, 33.22], ["o", 33.22, 33.32], ["roteiro.", 33.32, 33.68], ["O", 34.58, 34.84], ["Departamento", 34.84, 35.28], ["de", 35.28, 35.44], ["Estado", 35.44, 35.7], ["tem", 35.7, 35.9], ["até", 35.9, 36.02], ["13", 36.02, 36.48], ["de", 36.48, 36.64], ["novembro", 36.64, 37.06], ["para", 37.06, 37.22], ["responder.", 37.22, 37.6], ["Até", 38.56, 38.78], ["lá,", 38.78, 38.94], ["uma", 39.44, 39.6], ["pergunta", 39.6, 40.08], ["continua", 40.08, 40.7], ["sem", 40.7, 40.9], ["resposta.", 40.9, 41.24], ["Quem", 42.26, 42.42], ["pagou?", 42.42, 42.84]];
const CAPS = (() => {
  const out: {s: number; e: number; t: string}[] = [];
  let cur: [string, number, number][] = [];
  const flush = () => { if (cur.length) out.push({s: cur[0][1], e: cur[cur.length - 1][2], t: cur.map((c) => c[0]).join(' ')}); cur = []; };
  WORDS.forEach((w, i) => {
    cur.push(w);
    const len = cur.map((c) => c[0]).join(' ').length;
    if (/[.?:,]$/.test(w[0]) || cur.length >= 3 || len > 16 || (WORDS[i + 1] && WORDS[i + 1][1] - w[2] > 0.5)) flush();
  });
  flush();
  return out.map((c, i) => ({...c, e: Math.min(out[i + 1] ? out[i + 1].s : c.e + 0.6, c.e + 0.5)}));
})();
const Caption: React.FC<{t: number}> = ({t}) => {
  const c = CAPS.find((q) => t >= q.s - 0.02 && t < q.e);
  if (!c) return null;
  const sc = interpolate(t, [c.s - 0.02, c.s + 0.1], [0.9, 1], clamp);
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 1560, textAlign: 'center', transform: `scale(${sc})`}}>
      <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 64, color: '#fff', lineHeight: 1.15, textTransform: 'uppercase',
        WebkitTextStroke: '3px #000', paintOrder: 'stroke fill', textShadow: '0 6px 20px rgba(0,0,0,0.9)'}}>{c.t.replace(/[.,:]$/, '')}</span>
    </div>
  );
};

// ---------- topo: nível de poder + deputados + prazo ----------
const TIERS: [number, string][] = [[6.6, 'JATO'], [11.0, 'CASA BRANCA'], [17.4, 'DINHEIRO'], [21.8, 'CONGRESSO'], [25.2, 'DEPT. DE ESTADO']];
const TopBar: React.FC<{t: number}> = ({t}) => {
  let n = 0;
  TIERS.forEach(([a], i) => { if (t >= a) n = i + 1; });
  const name = n ? TIERS[n - 1][1] : '';
  const o = ramp(t, 6.4, 6.9) * (1 - ramp(t, 45.0, 45.6));
  const dep = Math.round(interpolate(t, [21.9, 24.4], [0, 25], clamp));
  const depO = ramp(t, 21.8, 22.2) * (1 - ramp(t, 36.4, 36.9));
  const prazoO = ramp(t, 37.0, 37.5);
  const days = Math.round(interpolate(t, [37.2, 40.6], [0, 14], clamp));
  const box = (o2: number, title: string, val: string, col: string, sub?: string) => (
    <div style={{width: 400, opacity: o2, background: 'rgba(8,10,16,0.82)', border: `3px solid ${col}`, borderRadius: 14, padding: '10px 16px', textAlign: 'center',
      transform: `scale(${interpolate(o2, [0, 1], [0.85, 1])})`, boxShadow: `0 0 26px ${col}44`}}>
      <div style={{fontFamily: MONO, fontSize: 22, color: 'rgba(255,255,255,0.75)', letterSpacing: 2}}>{title}</div>
      <div style={{fontFamily: MONO, fontSize: 54, color: col, lineHeight: 1.1}}>{val}</div>
      {sub && <div style={{fontFamily: MONO, fontSize: 20, color: col, letterSpacing: 2}}>{sub}</div>}
    </div>
  );
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 110}}>
      <div style={{display: 'flex', justifyContent: 'center', opacity: o}}>
        <div style={{fontFamily: MONO, fontSize: 40, color: '#0a0a0a', background: AMBER, padding: '6px 26px', borderRadius: 8, letterSpacing: 3, boxShadow: `0 0 30px ${AMBER}66`,
          transform: `scale(${pop(t, TIERS[Math.max(0, n - 1)][0])})`}}>NÍVEL {n} · {name}</div>
      </div>
      <div style={{display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20}}>
        {depO > 0 && box(depO, 'DEPUTADOS', `${dep}`, CYAN, 'DEMOCRATAS · EUA')}
        {prazoO > 0 && box(prazoO, 'PRAZO PARA RESPONDER', days >= 14 ? '13 NOV' : `${14 - days} DIAS`, days >= 14 ? WHITE : AMBER, 'SEM RESPOSTA')}
      </div>
    </div>
  );
};

// pontinhos dos 25 deputados (em volta do Capitólio, em graus)
const rr = (s: number) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
const DEPS: LL[] = (() => { const r = rr(23); return Array.from({length: 25}, () => { const a = r() * 6.283, d = 0.06 + r() * 0.3; return [P.DC[0] + Math.cos(a) * d, P.DC[1] + Math.sin(a) * d * 0.8] as LL; }); })();


// ---------- títulos grandes por fato (entram com impacto) ----------
const Big: React.FC<{t: number; a: number; b: number; y?: number; size?: number; color?: string; sub?: string; children: React.ReactNode}> = ({t, a, b, y = 430, size = 120, color = '#fff', sub, children}) => {
  const o = fade(t, a, b, 0.15);
  if (o <= 0) return null;
  const k = interpolate(t, [a, a + 0.1, a + 0.28], [1.8, 0.94, 1], clamp);
  const shake = t > a && t < a + 0.35 ? Math.sin((t - a) * 90) * 10 * (1 - (t - a) / 0.35) : 0;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', opacity: o, transform: `translateX(${shake}px) scale(${k})`}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: size, color, lineHeight: 1, letterSpacing: 2, textTransform: 'uppercase',
        WebkitTextStroke: '4px #000', paintOrder: 'stroke fill', textShadow: `0 0 40px ${color}88, 0 8px 24px rgba(0,0,0,0.9)`}}>{children}</div>
      {sub && <div style={{fontFamily: MONO, fontSize: 34, color: CYAN, letterSpacing: 4, marginTop: 10, textShadow: '0 3px 10px #000'}}>{sub}</div>}
    </div>
  );
};
const Flash: React.FC<{t: number; at: number[]}> = ({t, at}) => {
  const o = Math.max(0, ...at.map((a) => (t >= a && t < a + 0.18 ? 1 - (t - a) / 0.18 : 0)));
  return o > 0 ? <AbsoluteFill style={{background: '#fff', opacity: 0.22 * o}} /> : null;
};

const days14 = (t: number) => { const d = Math.round(interpolate(t, [37.2, 40.6], [0, 14], clamp)); return d >= 14 ? '13 DE NOVEMBRO' : `${14 - d} DIAS`; };
// ---------- composição ----------
export const DemC: React.FC = () => {
  const f = useCurrentFrame();
  const tR = f / FPS;
  const t = interpolate(tR, REAL, EST, clamp);
  const c = camAt(t);
  const S = (p: LL): [number, number] => { const q = proj(c, p); return [q[0] + PAD, q[1] + PAD]; };
  const tilt = c.tilt;
  const aero = S(P.AERO), foz = S(P.FOZ), dc = S(P.DC), cb = S(P.CB), sd = S(P.SD), conta = S(P.CONTA), opf = S(P.OPF), gye = S(P.GYE), bsb = S(P.BSB);

  const rAeroGye = smooth([aero, S(P.PY), S(P.BO), S(P.PE), gye], 26);
  const rGyeOpf = arc(gye, opf, 0.12);
  const rFull = [...rAeroGye, ...rGyeOpf];
  const rBefore = arc(aero, dc, 0.18);
  const rCbAero = arc(cb, aero, 0.14);
  const rContaAero = arc(conta, aero, -0.1);
  const rCarta = arc(dc, sd, 0.3);
  const q1 = arc(dc, opf, 0.1), q2 = arc(dc, bsb, 0.12), q3 = arc(dc, gye, 0.12);
  const blink = Math.floor(t * 2.4) % 2 === 0;
  const dm = (a: number, keep = 0.22) => 1 - (1 - keep) * ramp(t, a, a + 0.5);

  // jato parado em Puerto Iguazú até decolar
  const jetO = fade(t, 0.0, 7.0, 0.3) + 0 * t;
  // jato pousado em Miami
  const planeEnd = ramp(t, 6.8, 10.4);

  return (
    <AbsoluteFill style={{background: '#04060c', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: -PAD, top: -PAD, width: W + PAD * 2, height: H + PAD * 2, perspective: 1500, perspectiveOrigin: `50% ${PAD + H * 0.42}px`}}>
        <div style={{position: 'absolute', inset: 0, transformOrigin: `50% ${PAD + H * 0.55}px`, transform: `rotateX(${tilt}deg)`, transformStyle: 'preserve-3d'}}>
          <Mapa c={c} red={0} />

          {/* gancho: jato com "?" e linha tracejada até Washington */}
          {jetO > 0 && (
            <div style={{position: 'absolute', left: aero[0] - 44, top: aero[1] - 44, opacity: jetO, transform: 'rotate(-35deg)'}}>
              <PlaneIcon color="#fff" glow={AMBER} blink={blink} />
            </div>
          )}
          <Tag x={aero[0]} y={aero[1] - 50} o={fade(t, 0.3, 4.4)} title="QUEM PAGOU?" sub="JATO · PUERTO IGUAZÚ" tilt={tilt} align="c" size={54} color={AMBER} />
          <Route pts={rBefore} p={ramp(t, 3.6, 5.0)} color={CYAN} dashed o={fade(t, 3.6, 6.9, 0.3)} width={5} />
          {t > 3.6 && t < 6.9 && DEPS.map((d, i) => {
            const q = S(d);
            const on = ramp(t, 4.4 + i * 0.03, 4.6 + i * 0.03);
            return <div key={i} style={{position: 'absolute', left: q[0] - 7, top: q[1] - 7, width: 14, height: 14, borderRadius: 14, background: CYAN, boxShadow: `0 0 14px ${CYAN}`,
              opacity: on * fade(t, 3.6, 6.9, 0.3)}} />;
          })}
          <Tag x={dc[0]} y={dc[1] - 40} o={fade(t, 4.6, 6.9)} title="WASHINGTON" sub="25 DEPUTADOS" tilt={tilt} align="c" size={40} color={CYAN} />

          {/* 1. rota: Foz > Puerto Iguazú > Equador > Miami */}
          <Ping x={foz[0]} y={foz[1]} t={t} a={6.6} o={fade(t, 6.6, 8.2)} color={AMBER} r={70} />
          <Route pts={rFull} p={planeEnd} color={AMBER} o={fade(t, 6.7, 45.6, 0.3) * dm(11.3, 0.5)} width={6} icon={t < 10.5 ? 'plane' : 'none'} badge={t < 11.0 ? 'flavio' : undefined} />
          <Tag x={foz[0]} y={foz[1]} o={fade(t, 6.7, 9.6)} title="FOZ DO IGUAÇU" tilt={tilt} align="l" size={36} />
          <Tag x={gye[0]} y={gye[1]} o={fade(t, 8.6, 10.8)} title="EQUADOR" tilt={tilt} align="r" size={36} />
          <Ping x={opf[0]} y={opf[1]} t={t} a={10.4} o={fade(t, 10.4, 17.0)} color={AMBER} r={90} />
          <Tag x={opf[0]} y={opf[1]} o={fade(t, 10.4, 16.8)} title="MIAMI" sub="CHEGADA" tilt={tilt} align="r" size={38} />

          {/* 2. Casa Branca providenciou o jato */}
          <Route pts={rCbAero} p={ramp(t, 11.3, 13.4)} color={WHITE} o={fade(t, 11.2, 45.6, 0.3) * 0.9 * dm(17.4)} width={6} />
          <Ping x={cb[0]} y={cb[1]} t={t} a={11.2} o={fade(t, 11.2, 17.2)} color={WHITE} r={80} />
          <Tag x={cb[0]} y={cb[1] - 36} o={fade(t, 11.3, 17.2)} title="JASON MILLER" sub="ASSESSOR · CASA BRANCA" tilt={tilt} align="c" size={42} color={WHITE} />
          <Stamp x={(cb[0] + aero[0]) / 2} y={(cb[1] + aero[1]) / 2} t={t} a={14.7} b={17.0} color={AMBER} size={50}>CONFIRMOU</Stamp>

          {/* 3. o voo foi pago por uma conta nos EUA */}
          {(() => {
            const o = fade(t, 17.4, 45.6, 0.3) * dm(21.8);
            if (o <= 0) return null;
            const pulse = 1 + 0.08 * Math.sin(t * 5);
            return (
              <>
                <div style={{position: 'absolute', left: conta[0] - 90 * pulse, top: conta[1] - 90 * pulse, width: 180 * pulse, height: 180 * pulse, borderRadius: 999,
                  border: `5px dashed ${GREEN}`, background: `${GREEN}18`, opacity: o}} />
                <div style={{position: 'absolute', left: conta[0] - 40, top: conta[1] - 52, width: 80, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 90, color: GREEN, opacity: o}}>?</div>
                <svg width={W + PAD * 2} height={H + PAD * 2} style={{position: 'absolute', left: 0, top: 0, opacity: o * ramp(t, 18.0, 18.4)}}>
                  <path d={'M' + rContaAero.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('L')} fill="none" stroke={GREEN} strokeWidth={8} strokeLinecap="round"
                    strokeDasharray="2 16" strokeDashoffset={-t * 90} />
                </svg>
              </>
            );
          })()}
          <Tag x={conta[0]} y={conta[1] - 100} o={fade(t, 17.5, 45.6) * dm(21.8)} title="CONTA NOS EUA" sub="LOCAL NÃO INFORMADO" tilt={tilt} align="c" size={40} color={GREEN} />

          {/* 4. 25 deputados no Capitólio */}
          {t > 21.8 && DEPS.map((d, i) => {
            const q = S(d);
            const on = ramp(t, 21.9 + i * 0.1, 22.1 + i * 0.1);
            return <div key={i} style={{position: 'absolute', left: q[0] - 9, top: q[1] - 9, width: 18, height: 18, borderRadius: 18, background: CYAN, border: '2px solid #fff',
              boxShadow: `0 0 16px ${CYAN}`, opacity: on * fade(t, 21.8, 29.2, 0.4)}} />;
          })}
          <Tag x={dc[0]} y={dc[1] - 30} o={fade(t, 22.0, 25.2)} title="CAPITÓLIO" sub="CÂMARA DOS EUA" tilt={tilt} align="c" size={40} color={CYAN} />

          {/* 5. carta ao secretário de Estado */}
          <Route pts={rCarta} p={ramp(t, 25.4, 27.0)} color={CYAN} o={fade(t, 25.3, 29.3, 0.3)} width={7} />
          <Ping x={sd[0]} y={sd[1]} t={t} a={26.8} o={fade(t, 26.8, 29.2)} color={AMBER} r={60} />
          <Tag x={sd[0]} y={sd[1]} o={fade(t, 26.9, 29.2)} title="MARCO RUBIO" sub="DEPARTAMENTO DE ESTADO" tilt={tilt} align="r" size={38} color={AMBER} />

          {/* 6. as três dúvidas voltam para a rota */}
          <Route pts={q1} p={ramp(t, 29.4, 31.0)} color={CYAN} dashed o={fade(t, 29.4, 45.6, 0.3) * 0.9 * dm(31.6, 0.5)} width={5} />
          <Route pts={q2} p={ramp(t, 31.6, 33.4)} color={CYAN} dashed o={fade(t, 31.6, 45.6, 0.3) * 0.9 * dm(34.0, 0.5)} width={5} />
          <Route pts={q3} p={ramp(t, 34.0, 36.0)} color={CYAN} dashed o={fade(t, 34.0, 45.6, 0.3) * 0.9} width={5} />
          <Tag x={opf[0]} y={opf[1] + 40} o={fade(t, 30.0, 37.0)} title="A VIAGEM" tilt={tilt} align="r" size={36} color={CYAN} />
          <Tag x={bsb[0]} y={bsb[1]} o={fade(t, 32.2, 37.0)} title="A DECISÃO DO STF" tilt={tilt} align="r" size={36} color={CYAN} />
          <Tag x={gye[0]} y={gye[1] + 40} o={fade(t, 34.6, 37.0)} title="O ROTEIRO" sub="ARGENTINA · EQUADOR" tilt={tilt} align="r" size={36} color={CYAN} />

          {[[opf, 10.4], [cb, 11.2], [sd, 26.8]].map(([q, a], i) => {
            const ph = (t - (a as number)) / 1.0;
            if (ph < 0 || ph > 1) return null;
            const pt = q as [number, number];
            return <div key={i} style={{position: 'absolute', left: pt[0] - 160 * ph, top: pt[1] - 160 * ph, width: 320 * ph, height: 320 * ph, borderRadius: 999, border: `5px solid ${WHITE}`, opacity: 1 - ph}} />;
          })}
          {/* 7-8. sem resposta */}
        </div>
      </div>

      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.6) 100%)'}} />
      {t < 0.4 && <AbsoluteFill style={{background: '#000', opacity: 1 - ramp(t, 0, 0.4)}} />}
      {t > 46.2 && <AbsoluteFill style={{background: '#000', opacity: ramp(t, 46.2, 47.0)}} />}

      <Flash t={t} at={[0.35, 6.9, 11.3, 17.5, 21.9, 25.4, 34.6]} />
      <Big t={t} a={0.2} b={4.2} size={150} color={AMBER}>QUEM PAGOU?</Big>
      <Big t={t} a={11.3} b={17.2} size={110}>CASA BRANCA</Big>
      <Big t={t} a={17.6} b={20.6} size={96} color={GREEN} y={330} sub="ORIGEM DO DINHEIRO">CONTA NOS EUA</Big>
      <Big t={t} a={21.9} b={24.2} size={230} color={CYAN} y={380}>{Math.round(interpolate(t, [21.9, 24.0], [1, 25], clamp))}</Big>
      <Big t={t} a={25.4} b={29.2} size={96} color={AMBER} sub="SECRETÁRIO DE ESTADO">MARCO RUBIO</Big>
      <Big t={t} a={29.4} b={31.5} size={84} color={CYAN}>AJUDOU NA VIAGEM?</Big>
      <Big t={t} a={31.6} b={33.9} size={84} color={CYAN}>SABIA DA DECISÃO?</Big>
      <Big t={t} a={34.0} b={36.8} size={84} color={CYAN}>COMBINOU O ROTEIRO?</Big>
      <Big t={t} a={41.2} b={45.6} size={140} color={AMBER}>QUEM PAGOU?</Big>
      <Big t={t} a={37.1} b={41.0} size={150} color={WHITE} y={400}>{days14(t)}</Big>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1000}}><Stamp x={540} y={0} t={t} a={39.0} b={45.6} color={AMBER} size={56}>SEM RESPOSTA</Stamp></div>
      <TopBar t={t} />
      <Caption t={tR} />
      <Source t={t} a={6.6} b={10.8}>G1 · FLIGHTAWARE</Source>
      <Source t={t} a={11.0} b={16.9}>METRÓPOLES</Source>
      <Source t={t} a={17.4} b={21.4}>CARTACAPITAL</Source>
      <Source t={t} a={21.8} b={36.6}>CARTA DOS DEMOCRATAS · METRÓPOLES · CARTACAPITAL</Source>
      <Source t={t} a={37.0} b={45.6}>CARTA DOS DEMOCRATAS · METRÓPOLES</Source>
    </AbsoluteFill>
  );
};
