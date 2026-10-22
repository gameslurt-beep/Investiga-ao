import React from 'react';
import {AbsoluteFill} from 'remotion';
import '@fontsource/montserrat/800.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';

// Isometric projection matched to the original frame: x runs down-right along the back wall,
// y runs down-left away from the wall, z goes up.
const S = 60;
const OX = 28;
const OY = 403;
const C = Math.cos(Math.PI / 6);
const p = (x: number, y: number, z = 0): [number, number] => [OX + (x - y) * S * C, OY + (x + y) * S * 0.5 - z * S];
const pts = (list: number[][]) => list.map(([x, y, z]) => p(x, y, z ?? 0).join(',')).join(' ');

const X0 = -6; // wall/floor start, off screen
const RX = 11.4; // wall end
const RY = 12; // floor depth
const H = 6.9; // wall height

// --- colour helpers: every surface gets shaded from one base colour and tinted toward the room's purple
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const toHex = (a: number[]) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
};
const AMBIENT = '#4a3b6a';
const tint = (c: string) => mix(c, AMBIENT, 0.12);
const light = (c: string, t: number) => tint(mix(c, '#fff3dc', t));
const warm = (c: string) => mix(c, '#ffb866', 0.0);
const dark = (c: string, t: number) => tint(mix(c, '#1a1226', t));

const Poly: React.FC<{d: number[][]; fill: string; stroke?: string; sw?: number; op?: number; filter?: string}> = ({d, fill, stroke, sw, op, filter}) => (
  <polygon points={pts(d)} fill={fill} stroke={stroke ?? 'none'} strokeWidth={sw ?? 1} opacity={op ?? 1} strokeLinejoin="round" filter={filter} />
);

// Box lit from the lamp on the right: +x face is the lit side, +y face the shaded side,
// with a thin rim highlight on the top's front edges.
const Box: React.FC<{x: number; y: number; z?: number; w: number; d: number; h: number; c: string; rim?: boolean}> = ({x, y, z = 0, w, d, h, c, rim = true}) => (
  <g>
    <Poly d={[[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]} fill={tint(c)} />
    <Poly d={[[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]} fill={dark(c, 0.28)} />
    <Poly d={[[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]} fill={light(c, 0.14)} />
    {rim && (
      <polyline points={pts([[x, y + d, z + h], [x + w, y + d, z + h], [x + w, y, z + h]])} fill="none" stroke="#fff3dc" strokeOpacity={0.35} strokeWidth={1.4} />
    )}
  </g>
);

// Soft contact shadow: the footprint, slightly grown and blurred.
const Contact: React.FC<{x: number; y: number; w: number; d: number; op?: number}> = ({x, y, w, d, op = 0.45}) => (
  <Poly d={[[x - 0.1, y - 0.05, 0], [x + w + 0.15, y - 0.05, 0], [x + w + 0.15, y + d + 0.2, 0], [x - 0.1, y + d + 0.2, 0]]} fill="#1a0f14" op={op} filter="url(#blur6)" />
);

const onWall = (x0: number, x1: number, z0: number, z1: number, off = 0.01) => [[x0, off, z0], [x1, off, z0], [x1, off, z1], [x0, off, z1]];

const Floor: React.FC = () => {
  const shades = ['#b5743f', '#be7d47', '#a86a38', '#c4864f', '#b0703c'];
  const planks: React.ReactNode[] = [];
  const PL = 1.0; // plank length along x
  const PW = 0.42; // plank width along y
  for (let c = 0; X0 + c * PL < RX; c++) {
    const xa = X0 + c * PL;
    const xb = xa + PL;
    const [s0, s1] = c % 2 === 0 ? [0, PW * 1.2] : [PW * 1.2, 0];
    for (let j = -2; j * PW < RY + 1; j++) {
      const d = [[xa, j * PW + s0, 0], [xb, j * PW + s1, 0], [xb, (j + 1) * PW + s1, 0], [xa, (j + 1) * PW + s0, 0]];
      planks.push(<Poly key={`${c}-${j}`} d={d} fill={shades[(c * 3 + j * 2 + 50) % 5]} stroke="#6a3c20" sw={1.1} />);
    }
  }
  return (
    <g>
      {/* slab thickness under the open edge */}
      <Poly d={[[RX, 0, 0], [RX, RY, 0], [RX, RY, -0.35], [RX, 0, -0.35]]} fill="#3b2418" />
      <g clipPath="url(#floorClip)">{planks}</g>
    </g>
  );
};

const WallPanels: React.FC = () => {
  const cols: React.ReactNode[] = [];
  for (let x = X0; x < RX - 1; x += 2.75) {
    cols.push(<Poly key={`l${x}`} d={onWall(x + 0.3, x + 2.45, 0.6, 2.9)} fill="none" stroke="#c9bde0" sw={1.2} op={0.45} />);
    cols.push(<Poly key={`u${x}`} d={onWall(x + 0.3, x + 2.45, 3.4, 6.2)} fill="none" stroke="#c9bde0" sw={1.2} op={0.45} />);
  }
  return <g>{cols}</g>;
};

const Wall: React.FC = () => (
  <g>
    <Poly d={[[X0, 0, 0], [RX, 0, 0], [RX, 0, H], [X0, 0, H]]} fill="url(#wallGrad)" />
    <WallPanels />
    {/* chair rail and white baseboard */}
    <polyline points={pts([[X0, 0.01, 3.15], [RX, 0.01, 3.15]])} stroke="#c9bde0" strokeOpacity={0.4} strokeWidth={2} />
    <Box x={X0} y={0} w={RX - X0} d={0.1} h={0.4} c="#f3ead8" />
    {/* warm light on the wall from lamp + candles */}
    <g clipPath="url(#wallClip)" style={{mixBlendMode: 'screen'}}>
      <ellipse cx={470} cy={470} rx={260} ry={300} fill="url(#wallGlow)" />
      <ellipse cx={240} cy={470} rx={160} ry={160} fill="url(#wallGlow)" opacity={0.7} />
    </g>
    {/* dark corner at the top-left of the wall */}
    <g clipPath="url(#wallClip)">
      <rect x={-50} y={-80} width={500} height={300} fill="url(#wallShade)" />
    </g>
  </g>
);

const WallCaps: React.FC = () => (
  <g>
    {/* thick cream top of the wall and the cut end of the wall */}
    <Poly d={[[X0, -0.35, H], [RX + 0.35, -0.35, H], [RX + 0.35, 0, H], [X0, 0, H]]} fill="#f3e9d6" />
    <polyline points={pts([[X0, 0, H], [RX + 0.35, 0, H]])} stroke="#fff8ea" strokeWidth={2} />
    <Poly d={[[RX, -0.35, 0], [RX, 0, 0], [RX, 0, H], [RX, -0.35, H]]} fill="#e6dac3" />
    <Poly d={[[RX, 0, -0.35], [RX + 0.35, 0, -0.35], [RX + 0.35, 0, H], [RX, 0, H]]} fill="#fbf2e1" />
    <Poly d={[[RX + 0.35, -0.35, -0.35], [RX + 0.35, 0, -0.35], [RX + 0.35, 0, H], [RX + 0.35, -0.35, H]]} fill="#d6c9b0" />
  </g>
);

const MetroMap: React.FC = () => {
  const x0 = 5.7;
  const z0 = 3.6;
  const W = 3.3;
  const Hm = 1.9;
  const lines = [
    {c: '#f2d84c', a: [0.05, 1.45], b: [3.1, 0.75]},
    {c: '#3fbf5f', a: [0.05, 1.0], b: [3.1, 0.25]},
    {c: '#ee6a4a', a: [0.9, 1.85], b: [1.55, 0.05]},
    {c: '#56c2ee', a: [0.05, 1.15], b: [2.8, 0.05]},
  ];
  return (
    <g>
      <Poly d={onWall(x0 + 0.06, x0 + W + 0.06, z0 - 0.08, z0 + Hm - 0.08, 0.015)} fill="#000" op={0.18} filter="url(#blur3)" />
      <Poly d={onWall(x0, x0 + W, z0, z0 + Hm, 0.02)} fill="#f7f4ee" />
      {lines.map((l) => {
        const [ax, ay] = p(x0 + l.a[0], 0.03, z0 + l.a[1]);
        const [bx, by] = p(x0 + l.b[0], 0.03, z0 + l.b[1]);
        return <line key={l.c} x1={ax} y1={ay} x2={bx} y2={by} stroke={l.c} strokeWidth={4.5} strokeLinecap="round" />;
      })}
    </g>
  );
};

const StringLights: React.FC = () => {
  const n = 16;
  const wire: number[][] = [];
  const bulbs: React.ReactNode[] = [];
  for (let i = 0; i <= n * 4; i++) {
    const t = i / (n * 4);
    const x = 5.6 + t * 5.6;
    const sag = Math.abs(Math.sin(t * Math.PI * 4)) * 0.18;
    wire.push([x, 0.03, 6.45 - sag]);
  }
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = 5.6 + t * 5.6;
    const sag = Math.abs(Math.sin(t * Math.PI * 4)) * 0.18;
    const [cx, cy] = p(x, 0.04, 6.45 - sag - 0.12);
    bulbs.push(
      <g key={i}>
        <circle cx={cx} cy={cy} r={7} fill="url(#bulb)" opacity={0.7} />
        <ellipse cx={cx} cy={cy} rx={3} ry={3.6} fill="#fff1c2" />
      </g>,
    );
  }
  return (
    <g>
      <polyline points={pts(wire)} fill="none" stroke="#2b2238" strokeWidth={1.2} />
      {bulbs}
    </g>
  );
};

const Fireplace: React.FC = () => {
  const x = 2.7;
  const w = 2.5;
  // opening drawn in the fireplace's front plane (y = 0.61): rounded top corners
  const xo0 = x + 0.5;
  const xo1 = x + w - 0.5;
  const zt = 1.85;
  const rr = 0.3;
  const outline: number[][] = [[xo0, 0.61, 0.15]];
  for (let i = 0; i <= 8; i++) {
    const t = Math.PI - (i / 8) * (Math.PI / 2);
    outline.push([xo0 + rr + Math.cos(t) * rr, 0.61, zt - rr + Math.sin(t) * rr]);
  }
  for (let i = 0; i <= 8; i++) {
    const t = Math.PI / 2 - (i / 8) * (Math.PI / 2);
    outline.push([xo1 - rr + Math.cos(t) * rr, 0.61, zt - rr + Math.sin(t) * rr]);
  }
  outline.push([xo1, 0.61, 0.15]);
  const candles = [0.95, 1.25, 1.55].map((t, i) => {
    const [cx, cy] = p(x + t, 0.45, 0.15);
    const h = [38, 54, 34][i];
    return (
      <g key={t}>
        <circle cx={cx} cy={cy - h - 6} r={22} fill="url(#flame)" />
        <rect x={cx - 5} y={cy - h} width={10} height={h} fill="#fbf6ea" />
        <rect x={cx + 1} y={cy - h} width={4} height={h} fill="#e2d9c6" />
        <ellipse cx={cx} cy={cy - h - 7} rx={3.2} ry={6.5} fill="#ffe08a" />
      </g>
    );
  });
  return (
    <g>
      {/* gold mirror and vase on the mantle, behind the HUD */}
      <Poly d={onWall(x + 0.35, x + w - 0.2, 2.95, 5.4, 0.02)} fill="#d9a33a" />
      <Poly d={onWall(x + 0.5, x + w - 0.35, 3.1, 5.25, 0.03)} fill="#6f6590" />
      <Box x={x} y={0} w={w} d={0.6} h={2.6} c="#f4ecdc" />
      <Poly d={outline} fill="#5b3a29" />
      {candles}
      <Box x={x - 0.15} y={0} z={2.6} w={w + 0.3} d={0.75} h={0.16} c="#fbf4e6" />
      <Box x={x + 0.25} y={0.1} z={2.76} w={0.9} d={0.4} h={0.12} c="#3d5f9a" rim={false} />
      <Box x={x + 0.3} y={0.12} z={2.88} w={0.8} d={0.36} h={0.1} c="#c0503f" rim={false} />
      <Box x={x + 1.7} y={0.15} z={2.76} w={0.35} d={0.35} h={0.75} c="#3a3140" />
    </g>
  );
};

const Bookshelf: React.FC = () => {
  const x = 0.3;
  const w = 1.9;
  const d = 0.7;
  const colors = ['#c0503f', '#3d5f9a', '#d9a441', '#7b5c9e', '#4f8a64', '#e8ddc8', '#8d9ac9'];
  const books: React.ReactNode[] = [];
  [0.3, 1.7, 3.1].forEach((z, row) => {
    let bx = x + 0.12;
    for (let k = 0; k < 7; k++) {
      const bw = 0.18 + ((k + row) % 3) * 0.04;
      const bh = 0.85 + ((k * 2 + row) % 4) * 0.1;
      books.push(<Box key={`${row}-${k}`} x={bx} y={0.1} z={z} w={bw} d={0.5} h={bh} c={colors[(k + row * 3) % 7]} rim={false} />);
      bx += bw + 0.02;
    }
  });
  const posts = [[x, d - 0.12], [x + w - 0.12, d - 0.12]];
  return (
    <g>
      <Contact x={x} y={0} w={w} d={d} />
      {[0.18, 1.58, 2.98, 4.38].map((z) => (
        <Box key={z} x={x} y={0} z={z} w={w} d={d} h={0.12} c="#6b4429" />
      ))}
      {books}
      {posts.map(([px, py]) => (
        <Box key={px} x={px} y={py} w={0.12} d={0.12} h={4.6} c="#6b4429" rim={false} />
      ))}
    </g>
  );
};

const Sofa: React.FC = () => {
  const x = 5.9;
  const w = 3.2;
  const c = '#3f6d63';
  return (
    <g>
      <Contact x={x} y={0.45} w={w} d={1.85} op={0.55} />
      {[[x + 0.1, 2.05], [x + w - 0.25, 2.05]].map(([lx, ly]) => (
        <Box key={lx} x={lx} y={ly} w={0.15} d={0.15} h={0.25} c="#2a1c16" rim={false} />
      ))}
      <Box x={x} y={0.45} z={0.2} w={w} d={0.75} h={1.25} c={c} />
      <Box x={x} y={0.45} z={0.2} w={0.42} d={1.75} h={0.85} c={c} />
      <Box x={x} y={1.2} z={0.2} w={w} d={1.0} h={0.45} c={c} />
      <Box x={x + 0.42} y={1.2} z={0.65} w={w - 0.84} d={0.95} h={0.16} c={mix(c, '#5b8a7f', 0.35)} />
      {/* pillows leaning on the back */}
      <Box x={x + 0.48} y={1.2} z={0.81} w={0.5} d={0.2} h={0.5} c="#f0b545" />
      <Box x={x + w - 0.95} y={1.2} z={0.81} w={0.45} d={0.2} h={0.48} c="#c4553f" />
      <Box x={x + w - 0.42} y={0.45} z={0.2} w={0.42} d={1.75} h={0.85} c={c} />
    </g>
  );
};

// Flat 2D cat sticker lying on the seat, facing camera like the original.
const Cat: React.FC = () => {
  const [cx, cy] = p(7.95, 1.85, 0.81);
  return (
    <g transform={`translate(${cx - 52},${cy - 34})`}>
      <ellipse cx={66} cy={30} rx={50} ry={16} fill="#f09a3e" />
      <ellipse cx={70} cy={37} rx={42} ry={8} fill="#d98330" />
      <path d="M112 30 q20 2 18 18" stroke="#f09a3e" strokeWidth={9} fill="none" strokeLinecap="round" />
      {[52, 68, 84, 98].map((x) => (
        <path key={x} d={`M${x} 15 l-3 14`} stroke="#c56f24" strokeWidth={4.5} strokeLinecap="round" />
      ))}
      <ellipse cx={24} cy={28} rx={21} ry={18} fill="#f4a245" />
      <path d="M8 16 l2 -16 l12 11 z" fill="#f4a245" />
      <path d="M30 10 l12 -10 l3 16 z" fill="#f4a245" />
      <path d="M11 12 l1.5 -8 l6 6 z" fill="#e68a8a" opacity={0.7} />
      <circle cx={15} cy={27} r={6.5} fill="#f6d64a" />
      <circle cx={32} cy={27} r={6.5} fill="#f6d64a" />
      <circle cx={15.5} cy={27.5} r={3.6} fill="#1b1620" />
      <circle cx={32.5} cy={27.5} r={3.6} fill="#1b1620" />
      <circle cx={14} cy={25.5} r={1.2} fill="#fff" />
      <circle cx={31} cy={25.5} r={1.2} fill="#fff" />
      <path d="M22 35 l2 2 l2 -2" stroke="#7a3f1d" strokeWidth={1.6} fill="none" />
    </g>
  );
};

const Rug: React.FC = () => {
  const x0 = 5.1;
  const x1 = 9.8;
  const y0 = 2.5;
  const y1 = 6.4;
  const b = 0.38; // navy border width
  const dots: React.ReactNode[] = [];
  const along = (xa: number, ya: number, xb: number, yb: number, n: number) => {
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const [cx, cy] = p(xa + (xb - xa) * t, ya + (yb - ya) * t);
      dots.push(<ellipse key={`${xa}${ya}${i}`} cx={cx} cy={cy} rx={2.8} ry={1.8} fill="#e9c35c" />);
    }
  };
  const m = b / 2;
  along(x0 + m, y0 + m, x1 - m, y0 + m, 22);
  along(x0 + m, y1 - m, x1 - m, y1 - m, 22);
  along(x0 + m, y0 + m, x0 + m, y1 - m, 18);
  along(x1 - m, y0 + m, x1 - m, y1 - m, 18);
  const fringe: React.ReactNode[] = [];
  for (let i = 0; i <= 40; i++) {
    const x = x0 + ((x1 - x0) * i) / 40;
    const [a1, a2] = p(x, y0);
    const [b1, b2] = p(x - 0.12, y0 - 0.22);
    const [c1, c2] = p(x, y1);
    const [d1, d2] = p(x + 0.12, y1 + 0.22);
    fringe.push(<line key={`f${i}`} x1={a1} y1={a2} x2={b1} y2={b2} stroke="#efe3c8" strokeWidth={1.3} />);
    fringe.push(<line key={`g${i}`} x1={c1} y1={c2} x2={d1} y2={d2} stroke="#efe3c8" strokeWidth={1.3} />);
  }
  const spots = [[x0 + 0.9, y0 + 0.9], [x1 - 0.9, y0 + 0.9], [x0 + 0.9, y1 - 0.9], [x1 - 0.9, y1 - 0.9]];
  const cxm = (x0 + x1) / 2;
  const cym = (y0 + y1) / 2;
  return (
    <g>
      {fringe}
      <Poly d={[[x0, y0], [x1, y0], [x1, y1], [x0, y1]]} fill="#22306a" />
      <Poly d={[[x0 + b, y0 + b], [x1 - b, y0 + b], [x1 - b, y1 - b], [x0 + b, y1 - b]]} fill="#ad3e33" stroke="#efe3c8" sw={2} />
      <Poly d={[[x0 + 0.06, y0 + 0.06], [x1 - 0.06, y0 + 0.06], [x1 - 0.06, y1 - 0.06], [x0 + 0.06, y1 - 0.06]]} fill="none" stroke="#efe3c8" sw={1} op={0.7} />
      {dots}
      {spots.map(([sx, sy]) => {
        const [cx, cy] = p(sx, sy);
        return <ellipse key={`${sx}${sy}`} cx={cx} cy={cy} rx={17} ry={10} fill="#22306a" />;
      })}
      <Poly d={[[cxm, cym - 1.0], [cxm + 1.3, cym], [cxm, cym + 1.0], [cxm - 1.3, cym]]} fill="#22306a" />
      <Poly d={[[cxm, cym - 0.6], [cxm + 0.8, cym], [cxm, cym + 0.6], [cxm - 0.8, cym]]} fill="#e9b949" />
    </g>
  );
};

const CoffeeTable: React.FC = () => {
  const x = 6.5;
  const y = 4.1;
  const w = 1.75;
  const d = 1.25;
  const c = '#7a4f30';
  const [kx, ky] = p(x + 0.85, y + 0.55, 0.85);
  const [mx, my] = p(x + 1.35, y + 0.35, 0.85);
  return (
    <g>
      <Contact x={x} y={y} w={w} d={d} op={0.5} />
      {[[x, y], [x + w - 0.13, y], [x, y + d - 0.13], [x + w - 0.13, y + d - 0.13]].map(([lx, ly]) => (
        <Box key={`${lx}${ly}`} x={lx} y={ly} w={0.13} d={0.13} h={0.72} c={dark(c, 0.15)} rim={false} />
      ))}
      <Box x={x + 0.05} y={y + 0.05} z={0.25} w={w - 0.1} d={d - 0.1} h={0.07} c={c} rim={false} />
      <Box x={x + 0.3} y={y + 0.3} z={0.32} w={0.7} d={0.5} h={0.12} c="#e8b745" rim={false} />
      <Box x={x + 1.05} y={y + 0.45} z={0.32} w={0.45} d={0.4} h={0.18} c="#b94a3a" rim={false} />
      <Box x={x} y={y} z={0.72} w={w} d={d} h={0.13} c={c} />
      <circle cx={kx} cy={ky - 34} r={70} fill="url(#flame)" />
      <rect x={kx - 6} y={ky - 26} width={12} height={24} fill="#fbf6ea" />
      <rect x={kx + 1} y={ky - 26} width={5} height={24} fill="#e2d9c6" />
      <ellipse cx={kx} cy={ky - 33} rx={3.4} ry={7} fill="#ffe08a" />
      <rect x={mx - 7} y={my - 18} width={14} height={17} rx={2} fill="#8a8798" />
      <ellipse cx={mx} cy={my - 18} rx={7} ry={3} fill="#5c5868" />
    </g>
  );
};

const SideTable: React.FC = () => {
  const x = 8.3;
  const y = 7.6;
  const w = 1.4;
  const d = 0.9;
  const c = '#6e4429';
  const [vx, vy] = p(x + 0.4, y + 0.35, 1.3);
  const [a1, a2] = p(x + 0.25, y + 0.35, 1.31);
  const [b1, b2] = p(x + 1.25, y + 0.65, 1.31);
  return (
    <g>
      <Contact x={x} y={y} w={w} d={d} />
      {[[x, y], [x + w - 0.12, y], [x, y + d - 0.12], [x + w - 0.12, y + d - 0.12]].map(([lx, ly]) => (
        <Box key={`${lx}${ly}`} x={lx} y={ly} w={0.12} d={0.12} h={1.2} c={dark(c, 0.15)} rim={false} />
      ))}
      <Box x={x} y={y} z={1.2} w={w} d={d} h={0.1} c={c} />
      <line x1={a1} y1={a2} x2={b1} y2={b2} stroke="#efe9de" strokeWidth={3} strokeLinecap="round" />
      <path d={`M${vx - 10} ${vy} L${vx - 12} ${vy - 22} L${vx - 6} ${vy - 28} L${vx + 6} ${vy - 28} L${vx + 12} ${vy - 22} L${vx + 10} ${vy} Z`} fill="#e8e3d8" />
      <path d={`M${vx + 2} ${vy} L${vx + 4} ${vy - 28} L${vx + 6} ${vy - 28} L${vx + 12} ${vy - 22} L${vx + 10} ${vy} Z`} fill="#c9c2b4" />
    </g>
  );
};

const FloorLamp: React.FC = () => {
  const x = 10.55;
  const y = 1.0;
  const [tx, ty] = p(x, y, 2.35);
  return (
    <g>
      <Contact x={x - 0.3} y={y - 0.3} w={0.6} d={0.6} op={0.5} />
      <Box x={x - 0.28} y={y - 0.28} w={0.56} d={0.56} h={0.08} c="#7a6650" />
      <Box x={x - 0.04} y={y - 0.04} w={0.08} d={0.08} h={2.35} c="#8d7350" rim={false} />
      <path d={`M${tx - 16} ${ty} L${tx - 21} ${ty - 44} L${tx + 21} ${ty - 44} L${tx + 16} ${ty} Z`} fill="#d8c7a6" />
      <path d={`M${tx} ${ty} L${tx} ${ty - 44} L${tx + 21} ${ty - 44} L${tx + 16} ${ty} Z`} fill="#c2ae8b" />
      <ellipse cx={tx} cy={ty - 44} rx={21} ry={8} fill="#f1e6cf" />
      <ellipse cx={tx} cy={ty - 44} rx={10} ry={4} fill="#5e4d3a" />
    </g>
  );
};

const Plant: React.FC = () => {
  const [cx, cy] = p(10.6, 10.6, 1.0);
  const leaves = [
    {dx: -26, h: 120, lean: -18, c: '#2f6b47'},
    {dx: -8, h: 150, lean: -4, c: '#3a7d55'},
    {dx: 10, h: 135, lean: 14, c: '#2a5f40'},
    {dx: 24, h: 100, lean: 26, c: '#347350'},
  ];
  return (
    <g>
      <Contact x={10.15} y={10.15} w={0.9} d={0.9} />
      {leaves.map((l) => (
        <path key={l.dx} d={`M${cx + l.dx - 9} ${cy - 4} L${cx + l.dx + l.lean} ${cy - l.h} L${cx + l.dx + 9} ${cy - 4} Z`} fill={l.c} />
      ))}
      <path d={`M${cx - 30} ${cy - 10} L${cx - 24} ${cy + 46} L${cx + 24} ${cy + 46} L${cx + 30} ${cy - 10} L${cx} ${cy - 20} Z`} fill="#a29fc0" />
      <path d={`M${cx} ${cy - 20} L${cx} ${cy + 46} L${cx + 24} ${cy + 46} L${cx + 30} ${cy - 10} Z`} fill="#8582a6" />
    </g>
  );
};

const Hud: React.FC = () => (
  <div
    style={{
      position: 'absolute', left: 30, top: 130, width: 288, padding: '14px 16px 12px',
      background: 'rgba(24,21,38,0.58)', backdropFilter: 'blur(7px)', borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'JetBrains Mono', color: '#fff',
    }}
  >
    <div style={{position: 'absolute', left: -6, top: -6, width: 18, height: 18, borderLeft: '3px solid #f5a623', borderTop: '3px solid #f5a623'}} />
    <div style={{position: 'absolute', right: -6, bottom: -6, width: 18, height: 18, borderRight: '3px solid #f5a623', borderBottom: '3px solid #f5a623'}} />
    <div style={{fontSize: 15, letterSpacing: 0.5}}>
      <span style={{color: '#f5a623', fontWeight: 700}}>DAY 1</span>
      <span style={{color: '#b9b6c8', fontSize: 13}}> · SAT 17 OCT</span>
    </div>
    <div style={{fontSize: 44, fontWeight: 700, lineHeight: 1.1}}>
      10:29<span style={{fontSize: 18, color: '#b9b6c8', marginLeft: 8}}>PM</span>
    </div>
    <div style={{fontSize: 13, color: '#c9c6d6'}}>
      <svg width={10} height={13} style={{marginRight: 4, verticalAlign: -1}}><path d="M5 0 a5 5 0 0 1 5 5 c0 3.5 -5 8 -5 8 s-5 -4.5 -5 -8 a5 5 0 0 1 5 -5z" fill="#f5a623" /></svg>6TH FLOOR · PIGALLE
    </div>
    <div style={{height: 1, background: 'rgba(255,255,255,0.12)', margin: '10px 0 8px'}} />
    <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
      <div>
        <span style={{color: '#ef4444', fontSize: 28}}>♥</span>
        <span style={{fontSize: 34, fontWeight: 700, marginLeft: 8}}>111</span>
        <span style={{fontSize: 12, color: '#b9b6c8', marginLeft: 4}}>BPM</span>
      </div>
      <span style={{color: '#f5a623', fontWeight: 700, fontSize: 17}}>TENSE</span>
    </div>
    <svg width={256} height={22} style={{display: 'block', marginTop: -6}}>
      <path d="M0 15 H34 l4 -2 l3 4 l4 -15 l4 19 l3 -6 H104 l4 -2 l3 4 l4 -15 l4 19 l3 -6 H174 l4 -2 l3 4 l4 -15 l4 19 l3 -6 H256" stroke="#fff" strokeWidth={1.5} fill="none" />
    </svg>
    <div style={{display: 'flex', gap: 3, marginTop: 4}}>
      {Array.from({length: 16}).map((_, i) => (
        <div key={i} style={{flex: 1, height: 9, borderRadius: 1, background: i < 6 ? '#22c55e' : i < 8 ? '#f59e0b' : 'rgba(255,255,255,0.12)'}} />
      ))}
    </div>
  </div>
);

export const Scene2: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 70% 45%, #3a2c33 0%, #1d1620 45%, #120e17 100%)'}}>
    <svg width={720} height={1280} viewBox="0 0 720 1280">
      <defs>
        <filter id="blur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id="blur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
        <clipPath id="floorClip"><polygon points={pts([[X0, 0, 0], [RX, 0, 0], [RX, RY, 0], [X0, RY, 0]])} /></clipPath>
        <clipPath id="wallClip"><polygon points={pts([[X0, 0, 0], [RX, 0, 0], [RX, 0, H], [X0, 0, H]])} /></clipPath>
        <linearGradient id="wallGrad" x1="0" y1="0" x2="1" y2="0.5">
          <stop offset="0" stopColor="#564b74" />
          <stop offset="0.6" stopColor="#6c5f8a" />
          <stop offset="1" stopColor="#625581" />
        </linearGradient>
        <radialGradient id="wallGlow">
          <stop offset="0" stopColor="#c98f86" stopOpacity={0.55} />
          <stop offset="1" stopColor="#c98f86" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="wallShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#140f20" stopOpacity={0.55} />
          <stop offset="1" stopColor="#140f20" stopOpacity={0} />
        </linearGradient>
        <radialGradient id="flame">
          <stop offset="0" stopColor="#ffd27a" stopOpacity={0.8} />
          <stop offset="1" stopColor="#ff9d2e" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="bulb">
          <stop offset="0" stopColor="#fff0b0" stopOpacity={0.85} />
          <stop offset="1" stopColor="#ffd36b" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="pool">
          <stop offset="0" stopColor="#ffc377" stopOpacity={0.5} />
          <stop offset="1" stopColor="#ffc377" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="vignette" cx="0.48" cy="0.5" r="0.75">
          <stop offset="0.45" stopColor="#0d0a12" stopOpacity={0} />
          <stop offset="1" stopColor="#0d0a12" stopOpacity={0.75} />
        </radialGradient>
        <linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#140c10" stopOpacity={0} />
          <stop offset="1" stopColor="#140c10" stopOpacity={0.45} />
        </linearGradient>
      </defs>

      <Floor />
      <g clipPath="url(#floorClip)">
        <g style={{mixBlendMode: 'screen'}}>
          <ellipse cx={190} cy={740} rx={340} ry={260} fill="url(#pool)" />
          <ellipse cx={500} cy={740} rx={240} ry={170} fill="url(#pool)" opacity={0.7} />
          <ellipse cx={240} cy={560} rx={200} ry={130} fill="url(#pool)" opacity={0.7} />
        </g>
        <rect x={0} y={600} width={720} height={520} fill="url(#floorFade)" />
        {/* shadow where the wall meets the floor */}
        <Poly d={[[X0, 0, 0], [RX, 0, 0], [RX, 0.5, 0], [X0, 0.5, 0]]} fill="#1a0f14" op={0.35} filter="url(#blur6)" />
      </g>
      <Wall />
      <WallCaps />
      <MetroMap />
      <StringLights />
      <Bookshelf />
      <Fireplace />
      <Rug />
      <g style={{mixBlendMode: 'screen'}}>
        <ellipse cx={185} cy={735} rx={230} ry={150} fill="url(#pool)" opacity={0.8} />
      </g>
      <Sofa />
      <Cat />
      <FloorLamp />
      <CoffeeTable />
      <SideTable />
      <Plant />
      <rect x={0} y={0} width={720} height={1280} fill="url(#vignette)" />
    </svg>
    <Hud />
    <div
      style={{
        position: 'absolute', top: 1100, width: '100%', textAlign: 'center',
        fontFamily: 'Montserrat', fontWeight: 800, fontSize: 46, color: '#fff',
        textShadow: '0 3px 10px rgba(0,0,0,0.8)', letterSpacing: 0.5,
      }}
    >
      THE <span style={{color: '#c7f13b'}}>COUCH</span>
    </div>
  </AbsoluteFill>
);
