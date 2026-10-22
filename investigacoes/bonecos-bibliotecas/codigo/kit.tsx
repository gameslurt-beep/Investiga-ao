// "Caixa de peças": tudo é forma básica (círculo, retângulo, traço).
import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import '@fontsource/oswald/600.css';

export const W = 1080, H = 1920;

// Luz no centro + bordas escuras (o "ar de cinema")
export const Vinheta: React.FC = () => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
    <defs>
      <radialGradient id="luz" cx="50%" cy="28%" r="45%">
        <stop offset="0" stopColor="#fff6e0" stopOpacity={0.28} />
        <stop offset="1" stopColor="#fff6e0" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="vin" cx="50%" cy="45%" r="75%">
        <stop offset="0.55" stopColor="#000" stopOpacity={0} />
        <stop offset="1" stopColor="#2a1a08" stopOpacity={0.45} />
      </radialGradient>
    </defs>
    <ellipse cx={540} cy={560} rx={430} ry={900} fill="url(#luz)" />
    <rect width={W} height={H} fill="url(#vin)" />
  </svg>
);

export const Casa: React.FC<{x: number; base: number; w: number; h: number; telhado: string; parede: string; janela?: string; porta?: string; op?: number}> = ({x, base, w, h, telhado, parede, janela = '#c9d1d6', porta = '#6b4a34', op = 1}) => {
  const top = base - h;
  const roofH = w * 0.42;
  return (
    <g opacity={op}>
      <rect x={x} y={top} width={w} height={h} fill={parede} />
      <polygon points={`${x - w * 0.06},${top} ${x + w / 2},${top - roofH} ${x + w * 1.06},${top}`} fill={telhado} />
      <rect x={x + w * 0.16} y={top + h * 0.22} width={w * 0.2} height={w * 0.2} fill={janela} />
      <rect x={x + w * 0.6} y={top + h * 0.22} width={w * 0.2} height={w * 0.2} fill={janela} />
      <rect x={x + w * 0.4} y={base - h * 0.42} width={w * 0.17} height={h * 0.42} fill={porta} />
    </g>
  );
};

export const Carro: React.FC<{x: number; y: number; cor: string; s?: number}> = ({x, y, cor, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={30} y={-78} width={120} height={50} rx={14} fill={cor} />
    <rect x={44} y={-68} width={40} height={28} rx={5} fill="#dfe7ee" />
    <rect x={92} y={-68} width={40} height={28} rx={5} fill="#dfe7ee" />
    <rect x={0} y={-40} width={190} height={52} rx={16} fill={cor} />
    <circle cx={6} cy={-22} r={7} fill="#e04a3a" />
    <circle cx={40} cy={14} r={21} fill="#141414" />
    <circle cx={150} cy={14} r={21} fill="#141414" />
  </g>
);

export const Sirene: React.FC<{x: number; y: number; base: number}> = ({x, y, base}) => {
  const f = useCurrentFrame();
  const ondas = [0, 1, 2];
  return (
    <g>
      <rect x={x - 7} y={y} width={14} height={base - y} fill="#4f5860" />
      <polygon points={`${x - 30},${y - 30} ${x - 120},${y - 60} ${x - 120},${y + 30}`} fill="#7d8b99" />
      <polygon points={`${x + 30},${y - 30} ${x + 120},${y - 60} ${x + 120},${y + 30}`} fill="#7d8b99" />
      <rect x={x - 60} y={y - 42} width={120} height={58} rx={12} fill="#66717c" />
      {ondas.map((i) => {
        const o = interpolate((f + i * 6) % 18, [0, 9, 18], [0.25, 1, 0.25]);
        const r = 150 + i * 42;
        return (
          <g key={i} opacity={o * (1 - i * 0.25)} stroke="#c8392b" strokeWidth={7} fill="none" strokeLinecap="round">
            <path d={`M ${x - r} ${y - 75} Q ${x - r - 30} ${y - 15} ${x - r} ${y + 45}`} />
            <path d={`M ${x + r} ${y - 75} Q ${x + r + 30} ${y - 15} ${x + r} ${y + 45}`} />
          </g>
        );
      })}
    </g>
  );
};

// Boneco: cabeça círculo, cabelo com pontas, olhos de ponto, membros de traço grosso
export const Boneco: React.FC<{x: number; y: number; s?: number; bravo?: number; casaco?: string}> = ({x, y, s = 1, bravo = 0, casaco = '#56693f'}) => {
  const f = useCurrentFrame();
  const pisca = f % 75 > 71 ? 0.15 : 1;
  const sob = 8 + bravo * 14; // inclinação das sobrancelhas
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {/* pernas */}
      <g stroke="#2f4366" strokeWidth={26} strokeLinecap="round">
        <line x1={-18} y1={300} x2={-20} y2={560} />
        <line x1={18} y1={300} x2={20} y2={560} />
      </g>
      {/* braços */}
      <g stroke={casaco} strokeWidth={24} strokeLinecap="round">
        <line x1={-62} y1={150} x2={-82} y2={330} />
        <line x1={62} y1={150} x2={82} y2={330} />
      </g>
      <circle cx={-84} cy={342} r={15} fill="#f2d4b0" />
      <circle cx={84} cy={342} r={15} fill="#f2d4b0" />
      {/* tronco */}
      <rect x={-70} y={120} width={140} height={210} rx={34} fill={casaco} />
      <polygon points="-30,120 30,120 0,165" fill="#d9cdb2" />
      <rect x={-6} y={165} width={12} height={160} fill="#46582f" opacity={0.6} />
      {/* pescoço + cabeça */}
      <rect x={-18} y={88} width={36} height={40} fill="#e9c9a2" />
      <circle cx={0} cy={20} r={92} fill="#f2d4b0" />
      {/* cabelo */}
      <g fill="#6a4426">
        <polygon points="-30,-80 -55,-150 0,-92" />
        <polygon points="5,-88 30,-160 45,-80" />
        <polygon points="40,-78 95,-130 75,-50" />
        <polygon points="-70,-55 -120,-90 -88,-20" />
        <circle cx={-55} cy={-50} r={52} />
        <circle cx={5} cy={-72} r={58} />
        <circle cx={62} cy={-46} r={48} />
        <circle cx={-92} cy={10} r={34} />
        <circle cx={92} cy={2} r={30} />
      </g>
      <path d="M -60 -88 Q 0 -120 50 -92" stroke="#835a37" strokeWidth={9} fill="none" strokeLinecap="round" />
      {/* rosto */}
      <g stroke="#2a1d14" strokeWidth={9} strokeLinecap="round">
        <line x1={-52} y1={-4 - sob * 0.2} x2={-18} y2={-4 + sob * 0.6} />
        <line x1={52} y1={-4 - sob * 0.2} x2={18} y2={-4 + sob * 0.6} />
        <line x1={-14} y1={62} x2={14} y2={62} />
      </g>
      <ellipse cx={-32} cy={24} rx={10} ry={11 * pisca} fill="#1c1410" />
      <ellipse cx={32} cy={24} rx={10} ry={11 * pisca} fill="#1c1410" />
    </g>
  );
};

// Legenda: Oswald maiúscula, caixa escura, palavra-chave colorida
export const Legenda: React.FC<{txt: string; y?: number}> = ({txt, y = 1296}) => {
  const linhas = txt.split('\n');
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y - 58, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0}}>
      {linhas.map((l, i) => (
        <div key={i} style={{background: 'rgba(28,28,26,0.88)', borderRadius: 12, padding: '4px 22px 8px', fontFamily: 'Oswald', fontWeight: 600, fontSize: 74, letterSpacing: 1, color: '#fff', lineHeight: 1.12, marginTop: i ? -14 : 0, textShadow: '0 3px 6px rgba(0,0,0,0.4)'}}>
          {l.split(' ').map((w, j) => {
            const m = w.match(/^\[(r|y)\](.*)$/);
            const cor = m ? (m[1] === 'r' ? '#e8483a' : '#f2b233') : '#fff';
            return <span key={j} style={{color: cor}}>{(j ? ' ' : '') + (m ? m[2] : w)}</span>;
          })}
        </div>
      ))}
    </div>
  );
};

export const Tag: React.FC<{txt: string; y: number; cor?: string; aparece: number}> = ({txt, y, cor = '#e4a52e', aparece}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [aparece, aparece + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', opacity: o, transform: `translateY(${(1 - o) * 12}px)`}}>
      <div style={{background: cor, borderRadius: 8, padding: '2px 18px 4px', fontFamily: 'Oswald', fontWeight: 600, fontSize: 44, color: '#fff', boxShadow: '0 5px 0 rgba(120,70,10,0.5)'}}>{txt}</div>
    </div>
  );
};
