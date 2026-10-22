import React from 'react';
import {AbsoluteFill} from 'remotion';
import '@fontsource/montserrat/800.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';

// Isometric projection: x runs down-right, y runs down-left, z goes up.
const S = 56;
const OX = 300;
const OY = 600;
const C = Math.cos(Math.PI / 6);
const p = (x: number, y: number, z = 0) => [OX + (x - y) * S * C, OY + (x + y) * S * 0.5 - z * S];
const pts = (list: number[][]) => list.map(([x, y, z]) => p(x, y, z).join(',')).join(' ');

const RX = 9; // room length along x
const RY = 8; // room depth along y
const H = 6; // wall height

const Poly: React.FC<{d: number[][]; fill: string; stroke?: string; op?: number}> = ({d, fill, stroke, op}) => (
  <polygon points={pts(d)} fill={fill} stroke={stroke ?? 'none'} strokeWidth={1} opacity={op ?? 1} strokeLinejoin="round" />
);

// A box shows three faces to the camera: top, the +x face and the +y face.
const Box: React.FC<{x: number; y: number; z?: number; w: number; d: number; h: number; top: string; fx: string; fy: string}> = ({
  x, y, z = 0, w, d, h, top, fx, fy,
}) => (
  <g>
    <Poly d={[[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]} fill={fx} />
    <Poly d={[[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]} fill={fy} />
    <Poly d={[[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]} fill={top} />
  </g>
);

// Rectangle drawn flat on the wall y=0 (spans x,z) or the wall x=0 (spans y,z).
const onBackWall = (x0: number, x1: number, z0: number, z1: number) => [[x0, 0.01, z0], [x1, 0.01, z0], [x1, 0.01, z1], [x0, 0.01, z1]];
const onSideWall = (y0: number, y1: number, z0: number, z1: number) => [[0.01, y0, z0], [0.01, y1, z0], [0.01, y1, z1], [0.01, y0, z1]];

const Floor: React.FC = () => {
  // Herringbone approximated with alternating plank strips.
  const tiles: React.ReactNode[] = [];
  const shades = ['#8a5a34', '#93623a', '#7f5230', '#996a40'];
  for (let i = 0; i < RX; i++) {
    for (let j = 0; j < RY; j++) {
      for (let k = 0; k < 3; k++) {
        const along = (i + j) % 2 === 0;
        const a = k / 3;
        const b = (k + 1) / 3;
        const d = along
          ? [[i, j + a, 0], [i + 1, j + a, 0], [i + 1, j + b, 0], [i, j + b, 0]]
          : [[i + a, j, 0], [i + b, j, 0], [i + b, j + 1, 0], [i + a, j + 1, 0]];
        tiles.push(<Poly key={`${i}-${j}-${k}`} d={d} fill={shades[(i * 7 + j * 3 + k) % 4]} stroke="#6e4628" />);
      }
    }
  }
  return <g>{tiles}</g>;
};

const Walls: React.FC = () => (
  <g>
    {/* back wall (y=0) and side wall (x=0) */}
    <Poly d={[[0, 0, 0], [RX, 0, 0], [RX, 0, H], [0, 0, H]]} fill="#5b5378" />
    <Poly d={[[0, 0, 0], [0, RY, 0], [0, RY, H], [0, 0, H]]} fill="#4a4366" />
    {/* wainscot panels */}
    {[0.5, 3.2, 5.9].map((x) => (
      <Poly key={x} d={onBackWall(x, x + 2.4, 0.5, 2.6)} fill="none" stroke="#7a7299" />
    ))}
    {[0.6, 4.6].map((y) => (
      <Poly key={y} d={onSideWall(y, y + 2.8, 0.5, 2.6)} fill="none" stroke="#655d85" />
    ))}
    {/* cream trim on top of the walls and the open end */}
    <Poly d={[[0, -0.3, H], [RX + 0.3, -0.3, H], [RX + 0.3, 0, H], [0, 0, H]]} fill="#efe6d2" />
    <Poly d={[[-0.3, -0.3, H], [0, -0.3, H], [0, RY + 0.3, H], [-0.3, RY + 0.3, H]]} fill="#efe6d2" />
    <Poly d={[[RX, -0.3, 0], [RX + 0.3, -0.3, 0], [RX + 0.3, -0.3, H], [RX, -0.3, H]]} fill="#d9cfb8" />
    <Poly d={[[RX + 0.3, -0.3, 0], [RX + 0.3, 0, 0], [RX + 0.3, 0, H], [RX + 0.3, -0.3, H]]} fill="#efe6d2" />
    <Poly d={[[-0.3, RY + 0.3, 0], [0, RY + 0.3, 0], [0, RY + 0.3, H], [-0.3, RY + 0.3, H]]} fill="#e3d9c3" />
  </g>
);

const MetroMap: React.FC = () => {
  const lines = [
    {c: '#f2c94c', a: [0.3, 1.2], b: [2.7, 0.4]},
    {c: '#27ae60', a: [0.2, 0.6], b: [2.8, 1.6]},
    {c: '#eb5757', a: [1.0, 1.9], b: [1.8, 0.1]},
    {c: '#56ccf2', a: [0.3, 1.5], b: [2.6, 1.1]},
  ];
  const x0 = 5.2;
  const z0 = 3.1;
  return (
    <g>
      <Poly d={onBackWall(x0, x0 + 3, z0, z0 + 2)} fill="#f4f1ea" />
      {lines.map((l) => {
        const [ax, ay] = p(x0 + l.a[0], 0.02, z0 + l.a[1]);
        const [bx, by] = p(x0 + l.b[0], 0.02, z0 + l.b[1]);
        return <line key={l.c} x1={ax} y1={ay} x2={bx} y2={by} stroke={l.c} strokeWidth={5} strokeLinecap="round" />;
      })}
    </g>
  );
};

const StringLights: React.FC = () => {
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < 18; i++) {
    const t = i / 17;
    const x = 3.3 + t * 5.4;
    const sag = Math.sin(((i % 6) / 6) * Math.PI) * 0.25;
    const [cx, cy] = p(x, 0.02, 5.6 - sag);
    dots.push(
      <g key={i}>
        <circle cx={cx} cy={cy} r={9} fill="url(#bulb)" />
        <circle cx={cx} cy={cy} r={2.6} fill="#fff6d0" />
      </g>,
    );
  }
  return <g>{dots}</g>;
};

const Fireplace: React.FC = () => (
  <g>
    <Box x={0} y={1.6} w={0.5} d={2.6} h={2.4} top="#f5efe2" fx="#e9e1cf" fy="#d8ceb8" />
    <Poly d={[[0.51, 2.2, 0.2], [0.51, 3.6, 0.2], [0.51, 3.6, 1.7], [0.51, 2.2, 1.7]]} fill="#3b2a20" />
    {[2.5, 2.9, 3.3].map((y, i) => {
      const [cx, cy] = p(0.4, y, 0.6 + (i % 2) * 0.25);
      return (
        <g key={y}>
          <rect x={cx - 4} y={cy} width={8} height={30 - i * 4} fill="#fbf6ea" />
          <circle cx={cx} cy={cy - 6} r={14} fill="url(#flame)" />
          <ellipse cx={cx} cy={cy - 5} rx={2.5} ry={5} fill="#ffd36b" />
        </g>
      );
    })}
    {/* mirror above the fireplace */}
    <Poly d={onSideWall(1.9, 3.9, 2.8, 5.0)} fill="#6d6688" stroke="#d6a43c" />
  </g>
);

const Bookshelf: React.FC = () => {
  const colors = ['#c0392b', '#2d6a8a', '#d9a441', '#6b4f8a', '#3c7d5a', '#e2d8c4'];
  const books: React.ReactNode[] = [];
  [0.9, 2.1, 3.3].forEach((z, row) => {
    for (let k = 0; k < 7; k++) {
      const y = 5.3 + k * 0.28;
      books.push(
        <Box key={`${row}-${k}`} x={0.1} y={y} z={z} w={0.45} d={0.22} h={0.75 + ((k + row) % 3) * 0.12}
          top="#e9e1cf" fx={colors[(k + row * 2) % 6]} fy="#2a1d16" />,
      );
    }
  });
  return (
    <g>
      <Box x={0} y={5.1} w={0.6} d={2.2} h={4.4} top="#5a3a24" fx="#4a2f1d" fy="#3a2416" />
      {books}
    </g>
  );
};

const Sofa: React.FC = () => (
  <g>
    <ellipse cx={p(5.2, 2.2)[0]} cy={p(5.2, 2.2)[1]} rx={150} ry={40} fill="#000" opacity={0.25} />
    <Box x={3.2} y={0.6} w={3.8} d={0.5} h={1.8} top="#3f6b5e" fx="#2f5248" fy="#355d52" />
    <Box x={3.2} y={1.1} w={3.8} d={1.3} h={0.9} top="#3f6b5e" fx="#2b4a41" fy="#2f5248" />
    <Box x={3.2} y={0.6} w={0.45} d={1.8} h={1.3} top="#48786a" fx="#335a4f" fy="#2b4a41" />
    <Box x={6.55} y={0.6} w={0.45} d={1.8} h={1.3} top="#48786a" fx="#335a4f" fy="#2b4a41" />
    <Box x={3.7} y={1.1} w={0.7} d={0.3} h={0.6} z={0.9} top="#f2b84b" fx="#d89a2e" fy="#e5a93a" />
    <Box x={6.0} y={1.1} w={0.5} d={0.3} h={0.6} z={0.9} top="#c4553f" fx="#a54433" fy="#b34b39" />
  </g>
);

// Flat 2D cat sticker sitting on the sofa, like the original.
const Cat: React.FC = () => {
  const [cx, cy] = p(5.3, 2.0, 0.9);
  return (
    <g transform={`translate(${cx - 70},${cy - 46})`}>
      <ellipse cx={80} cy={34} rx={56} ry={20} fill="#f0a04b" />
      <path d="M130 34 q22 4 16 22" stroke="#f0a04b" strokeWidth={10} fill="none" strokeLinecap="round" />
      {[62, 80, 98].map((x) => (
        <path key={x} d={`M${x} 16 l-4 18`} stroke="#c97a2c" strokeWidth={5} strokeLinecap="round" />
      ))}
      <circle cx={28} cy={30} r={24} fill="#f0a04b" />
      <path d="M10 14 l4 -18 l12 14 z" fill="#f0a04b" />
      <path d="M34 10 l14 -14 l4 18 z" fill="#f0a04b" />
      <circle cx={19} cy={30} r={6.5} fill="#fff8e6" />
      <circle cx={37} cy={30} r={6.5} fill="#fff8e6" />
      <circle cx={19} cy={31} r={3.5} fill="#1d1a24" />
      <circle cx={37} cy={31} r={3.5} fill="#1d1a24" />
      <path d="M25 40 q3 3 6 0" stroke="#7a3f1d" strokeWidth={2} fill="none" />
    </g>
  );
};

const Rug: React.FC = () => (
  <g>
    <Poly d={[[2.2, 3.0, 0], [7.8, 3.0, 0], [7.8, 6.8, 0], [2.2, 6.8, 0]]} fill="#1f2c57" />
    <Poly d={[[2.5, 3.3, 0], [7.5, 3.3, 0], [7.5, 6.5, 0], [2.5, 6.5, 0]]} fill="#b04236" />
    <Poly d={[[2.8, 3.6, 0], [7.2, 3.6, 0], [7.2, 6.2, 0], [2.8, 6.2, 0]]} fill="none" stroke="#e8c27a" />
    {[[3.2, 4.0], [6.8, 4.0], [3.2, 5.8], [6.8, 5.8], [5.0, 4.9]].map(([x, y]) => {
      const [cx, cy] = p(x, y);
      return <ellipse key={`${x}${y}`} cx={cx} cy={cy} rx={14} ry={8} fill="#1f2c57" />;
    })}
  </g>
);

const CoffeeTable: React.FC = () => {
  const [cx, cy] = p(5.0, 4.9, 1.0);
  return (
    <g>
      {[[3.9, 4.2], [5.9, 4.2], [3.9, 5.5], [5.9, 5.5]].map(([x, y]) => (
        <Box key={`${x}${y}`} x={x} y={y} w={0.15} d={0.15} h={0.85} top="#6b4428" fx="#5a3820" fy="#4a2e1a" />
      ))}
      <Box x={3.8} y={4.1} z={0.85} w={2.3} d={1.6} h={0.15} top="#8a5a34" fx="#6b4428" fy="#5a3820" />
      <circle cx={cx} cy={cy - 30} r={60} fill="url(#flame)" />
      <rect x={cx - 6} y={cy - 26} width={12} height={22} fill="#fbf6ea" />
      <ellipse cx={cx} cy={cy - 32} rx={3} ry={6} fill="#ffd36b" />
    </g>
  );
};

const FloorLamp: React.FC = () => {
  const [bx, by] = p(8.1, 1.0);
  const [tx, ty] = p(8.1, 1.0, 3.6);
  return (
    <g>
      <ellipse cx={bx} cy={by} rx={18} ry={7} fill="#5a3f2a" />
      <line x1={bx} y1={by} x2={tx} y2={ty} stroke="#6a4b30" strokeWidth={4} />
      <circle cx={tx} cy={ty + 10} r={140} fill="url(#lamp)" />
      <path d={`M${tx - 20} ${ty} L${tx + 20} ${ty} L${tx + 14} ${ty - 34} L${tx - 14} ${ty - 34} Z`} fill="#e8d9b8" />
    </g>
  );
};

const Plant: React.FC = () => {
  const [cx, cy] = p(1.0, 7.2, 0.9);
  return (
    <g>
      <Box x={0.6} y={6.8} w={0.8} d={0.8} h={0.9} top="#9aa0b5" fx="#7d8399" fy="#6a7086" />
      {[-40, -18, 0, 20, 42].map((a, i) => (
        <path key={a} d={`M${cx} ${cy} q${a * 0.6} -60 ${a * 1.1} -${100 + (i % 2) * 30}`} stroke="#2f6b3f" strokeWidth={14} fill="none" strokeLinecap="round" />
      ))}
    </g>
  );
};

const Hud: React.FC = () => {
  const bars = 16;
  const lit = 8;
  return (
    <div
      style={{
        position: 'absolute', left: 30, top: 130, width: 290, padding: '14px 16px',
        background: 'rgba(22,20,36,0.55)', backdropFilter: 'blur(6px)', borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'JetBrains Mono', color: '#fff',
      }}
    >
      <div style={{position: 'absolute', left: -8, top: -8, width: 18, height: 18, borderLeft: '3px solid #f5a623', borderTop: '3px solid #f5a623'}} />
      <div style={{position: 'absolute', right: -8, bottom: -8, width: 18, height: 18, borderRight: '3px solid #f5a623', borderBottom: '3px solid #f5a623'}} />
      <div style={{fontSize: 15, letterSpacing: 1}}>
        <span style={{color: '#f5a623', fontWeight: 700}}>DAY 1</span>
        <span style={{color: '#b9b6c8'}}> · SAT 17 OCT</span>
      </div>
      <div style={{fontSize: 44, fontWeight: 700, lineHeight: 1.1}}>
        10:29<span style={{fontSize: 18, color: '#b9b6c8', marginLeft: 8}}>PM</span>
      </div>
      <div style={{fontSize: 13, color: '#b9b6c8'}}>
        <span style={{color: '#f5a623'}}>●</span> 6TH FLOOR · PIGALLE
      </div>
      <div style={{height: 1, background: 'rgba(255,255,255,0.12)', margin: '10px 0'}} />
      <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
        <div>
          <span style={{color: '#ef4444', fontSize: 26}}>♥</span>
          <span style={{fontSize: 34, fontWeight: 700, marginLeft: 8}}>111</span>
          <span style={{fontSize: 12, color: '#b9b6c8', marginLeft: 4}}>BPM</span>
        </div>
        <span style={{color: '#f5a623', fontWeight: 700, fontSize: 17}}>TENSE</span>
      </div>
      <svg width={258} height={24} style={{display: 'block'}}>
        <path d="M0 16 H40 l4 -2 l3 4 l4 -16 l4 20 l3 -6 H110 l4 -2 l3 4 l4 -16 l4 20 l3 -6 H180 l4 -2 l3 4 l4 -16 l4 20 l3 -6 H258" stroke="#fff" strokeWidth={1.6} fill="none" />
      </svg>
      <div style={{display: 'flex', gap: 3, marginTop: 4}}>
        {Array.from({length: bars}).map((_, i) => (
          <div key={i} style={{flex: 1, height: 9, borderRadius: 1, background: i < 6 ? '#22c55e' : i < lit ? '#f59e0b' : 'rgba(255,255,255,0.12)'}} />
        ))}
      </div>
    </div>
  );
};

export const Scene: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 45% 40%, #2c2640 0%, #15121f 70%)'}}>
    <svg width={720} height={1280} viewBox="0 0 720 1280">
      <defs>
        <radialGradient id="flame">
          <stop offset="0" stopColor="#ffcf73" stopOpacity={0.75} />
          <stop offset="1" stopColor="#ff9d2e" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="lamp">
          <stop offset="0" stopColor="#ffe2a3" stopOpacity={0.55} />
          <stop offset="1" stopColor="#ffb04d" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="bulb">
          <stop offset="0" stopColor="#fff2b8" stopOpacity={0.9} />
          <stop offset="1" stopColor="#ffd36b" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="warm" cx="0.5" cy="0.55" r="0.5">
          <stop offset="0" stopColor="#ffb459" stopOpacity={0.28} />
          <stop offset="1" stopColor="#ffb459" stopOpacity={0} />
        </radialGradient>
      </defs>
      <Floor />
      <Walls />
      <MetroMap />
      <StringLights />
      <Fireplace />
      <Bookshelf />
      <Rug />
      <Sofa />
      <Cat />
      <CoffeeTable />
      <FloorLamp />
      <Plant />
      <ellipse cx={380} cy={720} rx={560} ry={460} fill="url(#warm)" opacity={0.7} />
    </svg>
    <Hud />
    <div
      style={{
        position: 'absolute', bottom: 130, width: '100%', textAlign: 'center',
        fontFamily: 'Montserrat', fontWeight: 800, fontSize: 46, color: '#fff',
        textShadow: '0 3px 10px rgba(0,0,0,0.8)',
      }}
    >
      THE <span style={{color: '#c7f13b'}}>COUCH</span>
    </div>
  </AbsoluteFill>
);
