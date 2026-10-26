import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Easing, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import geo from '../public/mapa3/geo3.json';

// Dia 3 (imposto): mapa satélite natural/escuro + leque de linhas.
// Coordenadas em pixels do mosaico br.jpg (Web Mercator z6, tile 15/28).
const W = 1920, H = 1080;
const [MW, MH] = geo.size as [number, number];
const CAP = geo.cap as Record<string, [number, number]>;
const ST = geo.states as Record<string, [number, number][][]>;
const OR = '#ff8a3d', INK = '#f4efe6', RED = '#ff3b30';

const merc = (lon: number, lat: number): [number, number] => {
  const n = 64, l = (lat * Math.PI) / 180;
  const x = ((lon + 180) / 360) * n;
  const y = ((1 - Math.log(Math.tan(l) + 1 / Math.cos(l)) / Math.PI) / 2) * n;
  return [(x - 15) * 256, (y - 28) * 256];
};

// ---------- tempo (30 fps) ----------
const T = {
  sp: [0, 40],          // destaque de SP aparece
  toBsb: [60, 130],     // SP -> Brasília
  fan: [165, 235],      // Brasília -> capitais
  label: [240, 345],    // 830 bilhões
  back: [345, 400],     // meia-volta
  home: [420, 495],     // dinheiro em casa
  pi: 500, mt: 615, rs: 675,
  hole: 765,            // buraco
  end: 900,
};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const io = (f: number, r: number[], out: number[], e = ease) => interpolate(f, r, out, {...clamp, easing: e});

// ---------- câmera ----------
const SE: [number, number] = [(CAP['São Paulo'][0] + CAP['Brasília'][0]) / 2 - 60, (CAP['São Paulo'][1] + CAP['Brasília'][1]) / 2];
const BR = merc(-51.5, -15.8);
const BRhole = merc(-50.5, -17.5);
const camera = (f: number) => {
  const a = io(f, [T.fan[0] - 10, T.fan[1] + 25], [0, 1]);
  const b = io(f, [T.hole, T.end], [0, 1], Easing.inOut(Easing.sin));
  const cx = SE[0] + (BR[0] - SE[0]) * a + (BRhole[0] - BR[0]) * b;
  const cy = SE[1] + (BR[1] - SE[1]) * a + (BRhole[1] - BR[1]) * b;
  const drift = interpolate(f, [0, T.end], [1, 1.04]);
  const s = (1.15 + (0.5 - 1.15) * a) * drift * (1 + 0.06 * b);
  return {cx, cy, s};
};
type Cam = ReturnType<typeof camera>;
const P = (c: Cam, p: [number, number]): [number, number] => [(p[0] - c.cx) * c.s + W / 2, (p[1] - c.cy) * c.s + H / 2];

// ---------- linhas ----------
const rnd = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
type Line = {pts: [number, number][]; ph: number; sp: number; a: number};
const N = 64;
const curve = (from: [number, number], to: [number, number], bend: number): [number, number][] => {
  const [sx, sy] = from, [ex, ey] = to;
  const dx = ex - sx, dy = ey - sy, L = Math.hypot(dx, dy) || 1;
  const cx = (sx + ex) / 2 - (dy / L) * bend * L, cy = (sy + ey) / 2 + (dx / L) * bend * L;
  return Array.from({length: N + 1}, (_, i) => {
    const t = i / N;
    return [(1 - t) ** 2 * sx + 2 * (1 - t) * t * cx + t * t * ex, (1 - t) ** 2 * sy + 2 * (1 - t) * t * cy + t * t * ey];
  });
};
const r1 = rnd(11);
const TRUNK: Line[] = Array.from({length: 9}, (_, i) => ({
  pts: curve(CAP['São Paulo'], CAP['Brasília'], (i - 4) * 0.035 + (r1() - 0.5) * 0.03),
  ph: r1(), sp: 0.011 + r1() * 0.006, a: 0.5 + r1() * 0.5,
}));
const r2 = rnd(5);
const DEST = Object.keys(CAP).filter((k) => k !== 'São Paulo' && k !== 'Brasília');
const FAN: (Line & {dest: string; delay: number})[] = DEST.flatMap((d) => {
  const dist = Math.hypot(CAP[d][0] - CAP['Brasília'][0], CAP[d][1] - CAP['Brasília'][1]);
  return Array.from({length: 3}, () => {
    const sign = r2() < 0.5 ? -1 : 1;
    return {
      dest: d, pts: curve(CAP['Brasília'], CAP[d], sign * (0.06 + r2() * 0.24)),
      ph: r2(), sp: (0.009 + r2() * 0.006) * Math.min(1.6, 700 / dist), a: 0.35 + r2() * 0.55, delay: r2() * 14,
    };
  });
});
// cidade -> estado (para apagar as linhas que chegam nos 3 estados)
const CITY_UF: Record<string, string> = {Teresina: 'PI', 'Cuiabá': 'MT', 'Porto Alegre': 'RS'};

const sub = (c: Cam, pts: [number, number][], a: number, b: number) => {
  a = Math.max(0, a); b = Math.min(1, b);
  if (b <= a) return '';
  const i0 = a * N, i1 = b * N;
  const at = (u: number) => {
    const i = Math.min(N - 1, Math.floor(u)), t = u - i;
    return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t] as [number, number];
  };
  const out = [at(i0)];
  for (let i = Math.ceil(i0); i < i1; i++) out.push(pts[i]);
  out.push(at(i1));
  return 'M' + out.map((p) => P(c, p).map((v) => v.toFixed(1)).join(' ')).join('L');
};

const Flow: React.FC<{c: Cam; l: Line; f: number; draw: number; start?: number; op: number; width?: number}> = ({c, l, f, draw, start = 0, op, width = 1}) => {
  if (op <= 0.01 || draw <= start) return null;
  const head = ((f * l.sp + l.ph) % 1.25);
  const tails: [number, number, number][] = [[0.22, 0.22, 1], [0.1, 0.5, 1.2], [0.03, 1, 1.7]];
  return (
    <g opacity={op}>
      <path d={sub(c, l.pts, start, draw)} stroke={`rgba(255,236,215,${0.24 * l.a})`} strokeWidth={width} fill="none" />
      {head - 0.22 < draw &&
        tails.map(([len, a, w], i) => (
          <path key={i} d={sub(c, l.pts, Math.max(start, head - len), Math.min(draw, head))} stroke={`rgba(255,238,220,${a * l.a})`}
            strokeWidth={w * width} strokeLinecap="round" fill="none" />
        ))}
    </g>
  );
};

// ---------- contornos ----------
const ringPath = (c: Cam, sig: string) => ST[sig].map((r) => 'M' + r.map((p) => P(c, p).map((v) => v.toFixed(1)).join(' ')).join('L') + 'Z').join('');
const centroid = (sig: string): [number, number] => {
  const r = ST[sig].reduce((a, b) => (b.length > a.length ? b : a));
  let x = 0, y = 0;
  r.forEach((p) => { x += p[0]; y += p[1]; });
  return [x / r.length, y / r.length];
};

// ---------- camadas do mapa (espaço do mosaico) ----------
const Masked: React.FC<{sig: string; op: number; children: React.ReactNode}> = ({sig, op, children}) => {
  const m = `url(${staticFile(`mapa3/mask_${sig}.png`)})`;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op, WebkitMaskImage: m, maskImage: m, WebkitMaskSize: '100% 100%', maskSize: '100% 100%'}}>
      {children}
    </div>
  );
};
const full: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: MW, height: MH};

const useFonts = () => {
  const [h] = useState(() => delayRender('fontes'));
  useEffect(() => {
    const list = [['Poppins', 'Regular', 400], ['Poppins', 'SemiBold', 600], ['Poppins', 'Bold', 700]] as const;
    Promise.all(list.map(([fam, w, n]) => new FontFace(fam, `url(${staticFile(`fonts/P-${w}.ttf`)})`, {weight: String(n)}).load()))
      .then((fs) => { fs.forEach((x) => document.fonts.add(x)); continueRender(h); });
  }, [h]);
};

// ---------- etiqueta de jornal ----------
const Tag: React.FC<{at: [number, number]; dx: number; dy: number; op: number; kicker: string; big: string; small?: string; src?: string; color?: string}> = ({at, dx, dy, op, kicker, big, small, src, color = OR}) => {
  const [x, y] = at, lx = x + dx, ly = y + dy;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op}}>
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <circle cx={x} cy={y} r={6} fill={color} />
        <circle cx={x} cy={y} r={14} stroke={color} strokeWidth={2} fill="none" />
        <path d={`M${x + (dx > 0 ? 10 : -10)} ${y - 10}L${lx} ${ly}L${lx + (dx > 0 ? 36 : -36)} ${ly}`} stroke={INK} strokeWidth={2} fill="none" />
      </svg>
      <div style={{position: 'absolute', left: dx > 0 ? lx + 50 : undefined, right: dx > 0 ? undefined : W - lx + 50, top: ly - 34,
        fontFamily: 'Poppins', color: INK, textAlign: dx > 0 ? 'left' : 'right', textShadow: '0 2px 18px rgba(0,0,0,.85)'}}>
        <div style={{fontSize: 22, fontWeight: 600, letterSpacing: 3, color: '#c3c8d4'}}>{kicker}</div>
        <div style={{fontSize: big.length > 6 ? 72 : 104, fontWeight: 700, lineHeight: 1.05}}>
          {big}{small && <span style={{fontSize: 30, fontWeight: 400, marginLeft: 14}}>{small}</span>}
        </div>
        {src && <div style={{fontSize: 17, color: '#9aa0ae', letterSpacing: 1.5, marginTop: 6}}>{src}</div>}
      </div>
    </div>
  );
};

export const Dia3: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const c = camera(f);

  // tratamento do mapa
  const spOn = io(f, T.sp, [0, 1]);
  const dim = Math.max(io(f, T.sp, [0, 0.55]), io(f, [T.pi - 20, T.pi + 20], [0.55, 0.75]), io(f, [T.hole, T.hole + 40], [0.75, 1]));
  const spGlow = 1 + 0.5 * io(f, [T.back[1] - 10, T.back[1] + 15], [0, 1]) - 0.5 * io(f, [T.home[1], T.home[1] + 30], [0, 1]);
  const hit = {PI: T.pi, MT: T.mt, RS: T.rs} as Record<string, number>;
  const lit = (s: string) => io(f, [hit[s], hit[s] + 15], [0, 1]);
  const red = io(f, [T.hole, T.hole + 30], [0, 1]);

  // desenho das linhas
  const trunkDraw = io(f, T.toBsb, [0, 1]);
  const trunkBack = io(f, [T.back[0] + 25, T.back[1] + 10], [1, 0]);
  const fanBack = io(f, [T.back[0], T.back[0] + 35], [1, 0]);
  // depois da meia-volta, o leque fica só como rastro apagado, e some nos 3 estados
  const ghost = io(f, [T.pi - 25, T.pi], [0, 1]) * (1 - io(f, [T.hole, T.hole + 25], [0, 1]));

  const bsb = P(c, CAP['Brasília']), sp = P(c, CAP['São Paulo']);
  const n830 = Math.round(io(f, [T.label[0] + 5, T.label[0] + 45], [0, 830], Easing.out(Easing.cubic)));
  const labelOp = io(f, [T.label[0], T.label[0] + 10], [0, 1]) * (1 - io(f, [T.back[0] + 5, T.back[0] + 20], [0, 1]));

  return (
    <AbsoluteFill style={{background: '#04060c', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: MW, height: MH, transformOrigin: '0 0',
        transform: `translate(${W / 2 - c.cx * c.s}px, ${H / 2 - c.cy * c.s}px) scale(${c.s})`}}>
        <Img src={staticFile('mapa3/nat.jpg')} style={full} />
        <Img src={staticFile('mapa3/dark.jpg')} style={{...full, opacity: dim}} />
        <Masked sig="SP" op={spOn}><Img src={staticFile('mapa3/nat.jpg')} style={full} /></Masked>
        <Masked sig="SP" op={spOn * 0.22 * spGlow}><div style={{...full, background: OR}} /></Masked>
        {(['PI', 'MT', 'RS'] as const).map((s) => (
          <React.Fragment key={s}>
            <Masked sig={s} op={lit(s) * (1 - red) * 0.9}><Img src={staticFile('mapa3/nat.jpg')} style={full} /></Masked>
            <Masked sig={s} op={red * 0.48}><div style={{...full, background: RED}} /></Masked>
          </React.Fragment>
        ))}
        {/* pré-carrega as máscaras */}
        {['SP', 'PI', 'MT', 'RS'].map((s) => <Img key={s} src={staticFile(`mapa3/mask_${s}.png`)} style={{display: 'none'}} />)}
      </div>

      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* divisas */}
        <g fill="none" stroke={`rgba(255,255,255,${0.2 - 0.06 * red})`} strokeWidth={1}>
          {Object.keys(ST).map((s) => <path key={s} d={ringPath(c, s)} />)}
        </g>
        {/* SP aceso */}
        <path d={ringPath(c, 'SP')} fill="none" stroke="#ffc48c" strokeWidth={2.4} opacity={spOn * Math.min(1, spGlow)} filter="url(#soft)" />
        {(['PI', 'MT', 'RS'] as const).map((s) => (
          <path key={s} d={ringPath(c, s)} fill="none" stroke={red > 0 ? `rgb(255,${Math.round(255 - 196 * red)},${Math.round(255 - 207 * red)})` : INK}
            strokeWidth={2.2} opacity={lit(s)} filter="url(#soft)" />
        ))}
        {/* linhas */}
        <g filter="url(#glow)">
          {TRUNK.map((l, i) => (
            <Flow key={i} c={c} l={l} f={f} draw={Math.min(trunkDraw, trunkBack)} op={1} width={1.3} />
          ))}
          {FAN.map((l, i) => {
            const d = io(f, [T.fan[0] + l.delay, T.fan[1] + l.delay], [0, 1]);
            const uf = CITY_UF[l.dest];
            const gone = uf ? io(f, [hit[uf] + 15, hit[uf] + 45], [1, 0]) : 1;
            const live = Math.min(d, fanBack);
            return (
              <React.Fragment key={i}>
                <Flow c={c} l={l} f={f} draw={live} op={1} />
                {ghost > 0 && <path d={sub(c, l.pts, 0, 1)} stroke={`rgba(255,236,215,${0.2 * l.a})`} strokeDasharray="2 6" strokeWidth={1}
                  fill="none" opacity={ghost * gone} />}
              </React.Fragment>
            );
          })}
        </g>
        {/* pontos */}
        <circle cx={sp[0]} cy={sp[1]} r={5} fill={OR} opacity={spOn} />
        <circle cx={bsb[0]} cy={bsb[1]} r={4.5} fill={INK} opacity={io(f, [T.toBsb[1] - 15, T.toBsb[1]], [0, 1]) * (1 - red)} />
      </svg>

      {/* rótulos simples */}
      <div style={{position: 'absolute', left: bsb[0] + 16, top: bsb[1] - 16, fontFamily: 'Poppins', fontWeight: 600, fontSize: 22, letterSpacing: 2.5,
        color: INK, textShadow: '0 2px 12px #000', opacity: io(f, [T.toBsb[1] - 15, T.toBsb[1]], [0, 1]) * (1 - io(f, [T.fan[0], T.fan[0] + 20], [0, 1]))}}>BRASÍLIA</div>
      <div style={{position: 'absolute', left: sp[0] + 18, top: sp[1] + 2, fontFamily: 'Poppins', fontWeight: 600, fontSize: 22, letterSpacing: 2.5,
        color: '#ffd2ad', textShadow: '0 2px 12px #000', opacity: io(f, [20, 45], [0, 1]) * (1 - io(f, [T.fan[0], T.fan[0] + 20], [0, 1]))}}>SÃO PAULO</div>

      <Tag at={sp} dx={170} dy={-150} op={labelOp} kicker="IMPOSTOS FEDERAIS PAGOS EM SP · 2022" big={`R$ ${n830}`} small="bilhões"
        src="FONTE: RECEITA FEDERAL · CÁLCULO GAZETA DO POVO" />
      <Tag at={P(c, centroid('PI'))} dx={150} dy={-110} op={lit('PI') * (1 - io(f, [T.hole - 10, T.hole + 10], [0, 1]))} kicker="PIAUÍ" big="Hospital" color={INK} />
      <Tag at={P(c, centroid('MT'))} dx={-170} dy={-120} op={lit('MT') * (1 - io(f, [T.hole - 10, T.hole + 10], [0, 1]))} kicker="MATO GROSSO" big="BR" small="rodovia federal" color={INK} />
      <Tag at={P(c, centroid('RS'))} dx={170} dy={40} op={lit('RS') * (1 - io(f, [T.hole - 10, T.hole + 10], [0, 1]))} kicker="RIO GRANDE DO SUL" big="Universidade" small="federal" color={INK} />

      {/* vinheta + marcador do dia */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)'}} />
      <div style={{position: 'absolute', left: 64, top: 52, fontFamily: 'Poppins', color: INK, opacity: io(f, [5, 25], [0, 1])}}>
        <span style={{fontSize: 30, fontWeight: 700, color: OR}}>DIA 3</span>
        <span style={{fontSize: 24, fontWeight: 600, letterSpacing: 3, marginLeft: 18}}>IMPOSTO</span>
      </div>
    </AbsoluteFill>
  );
};
