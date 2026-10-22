import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {W, H, Vinheta, Casa, Carro, Sirene, Boneco, Legenda, Tag} from './kit';

const FPS = 30;
const s = (t: number) => Math.round(t * FPS);

const Zoom: React.FC<{children: React.ReactNode; de?: number; ate?: number; dur: number}> = ({children, de = 1, ate = 1.05, dur}) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [0, dur], [de, ate]);
  return <AbsoluteFill style={{transform: `scale(${k})`, transformOrigin: '50% 45%'}}>{children}</AbsoluteFill>;
};

const Ceu: React.FC<{a?: string; b?: string}> = ({a = '#d9a76d', b = '#e6be8a'}) => (
  <svg width={W} height={H} style={{position: 'absolute'}}>
    <defs>
      <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={a} />
        <stop offset="1" stopColor={b} />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill="url(#ceu)" />
  </svg>
);

// Cena A/C: sirene no poste, rua com casas
const RuaSirene: React.FC = () => (
  <>
    <Ceu />
    <svg width={W} height={H} style={{position: 'absolute'}}>
      <Casa x={-60} base={1490} w={260} h={330} telhado="#c49a78" parede="#dcc6a6" op={0.55} />
      <Casa x={250} base={1430} w={260} h={300} telhado="#c49a78" parede="#dcc6a6" op={0.55} />
      <Casa x={880} base={1440} w={260} h={330} telhado="#c49a78" parede="#dcc6a6" op={0.55} />
      <Casa x={-40} base={1490} w={400} h={360} telhado="#a7463a" parede="#e9d3ad" janela="#f0dd9a" />
      <Casa x={580} base={1490} w={470} h={400} telhado="#566f93" parede="#cfdad6" janela="#f0dd9a" />
      <rect x={0} y={1490} width={W} height={70} fill="#b9ad8e" />
      <rect x={0} y={1560} width={W} height={H - 1560} fill="#5a6357" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={100 + i * 230} y={1815} width={120} height={14} fill="#c9c6b8" opacity={0.8} />
      ))}
      <Sirene x={443} y={760} base={1490} />
    </svg>
  </>
);

const CORES = ['#3f72b0', '#e0dccd', '#6f9a4c', '#6a4f9a', '#d3392f', '#e09a2b', '#a63a3a'];
const Fila: React.FC<{y: number; off: number; seed: number}> = ({y, off, seed}) => (
  <>
    {[...Array(7)].map((_, i) => (
      <Carro key={i} x={off + i * 285} y={y} cor={CORES[(i * 3 + seed) % CORES.length]} s={1.35} />
    ))}
  </>
);

// Cena B/D: engarrafamento + X que se desenha
const Engarrafamento: React.FC<{x?: boolean}> = ({x}) => {
  const f = useCurrentFrame();
  const d = interpolate(f, [s(0.4), s(0.75)], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const d2 = interpolate(f, [s(0.6), s(0.95)], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <>
      <Ceu />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        {[-40, 180, 430, 690, 920].map((cx, i) => (
          <Casa key={i} x={cx} base={1080} w={230} h={190 + (i % 2) * 40} telhado="#b98564" parede="#dcbf95" janela="#e6d3b0" op={0.85} />
        ))}
        <rect x={0} y={1080} width={W} height={H - 1080} fill="#585f55" />
        <Fila y={1150} off={-120} seed={0} />
        <Fila y={1395} off={-40} seed={2} />
        <Fila y={1680} off={-150} seed={4} />
        {x && (
          <g stroke="#cf3a2e" strokeWidth={26} strokeLinecap="round" fill="none">
            <path d="M 400 830 L 690 1080" pathLength={1} strokeDasharray={1} strokeDashoffset={d} />
            <path d="M 690 830 L 400 1080" pathLength={1} strokeDasharray={1} strokeDashoffset={d2} />
          </g>
        )}
      </svg>
    </>
  );
};

// Cena E: Rafa na sala
const Sala: React.FC = () => {
  const f = useCurrentFrame();
  const bravo = interpolate(f, [s(1.6), s(2.0)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <rect width={W} height={1058} fill="#e6d4b4" />
        <rect y={1046} width={W} height={18} fill="#efe2c8" />
        <rect y={1064} width={W} height={540} fill="#c8b28c" />
        <rect y={1600} width={W} height={H - 1600} fill="#62432c" />
        {[...Array(6)].map((_, i) => (
          <rect key={i} y={1640 + i * 50} width={W} height={4} fill="#55392400" />
        ))}
        {/* janela com a rua lá fora */}
        <rect x={228} y={312} width={636} height={532} fill="#f3ead8" />
        <rect x={250} y={334} width={592} height={488} fill="#d9a76d" />
        <Casa x={250} base={760} w={240} h={260} telhado="#a7463a" parede="#e9d3ad" janela="#c9d1d6" />
        <Casa x={560} base={760} w={260} h={250} telhado="#566f93" parede="#cfdad6" janela="#f0dd9a" />
        <rect x={250} y={700} width={592} height={60} fill="#8b9377" />
        <rect x={250} y={760} width={592} height={62} fill="#5f6a5c" />
        <rect x={536} y={334} width={20} height={488} fill="#f3ead8" />
        <rect x={210} y={832} width={672} height={22} fill="#efe4cf" />
        {/* sofá */}
        <rect x={640} y={1395} width={480} height={120} rx={30} fill="#8a6352" />
        <rect x={610} y={1480} width={500} height={120} rx={26} fill="#7a5545" />
        <Boneco x={360} y={930} s={1.25} bravo={bravo} />
      </svg>
    </>
  );
};

const Timer: React.FC = () => {
  const f = useCurrentFrame();
  const seg = Math.max(0, Math.round(900 - f * 1.9));
  const mm = String(Math.floor(seg / 60)).padStart(2, '0');
  const ss = String(seg % 60).padStart(2, '0');
  const o = interpolate(f, [s(0.75), s(0.95)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 1130 - 600, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o}}>
      <div style={{background: '#1e1d1b', borderRadius: 14, padding: '6px 26px 10px', border: '3px solid #e4a52e', color: '#fff', fontFamily: 'Oswald', fontWeight: 600, textAlign: 'center', boxShadow: '0 6px 0 rgba(0,0,0,0.3)'}}>
        <div style={{fontSize: 76, lineHeight: 1}}>⏱ {mm}:{ss}</div>
        <div style={{fontSize: 20, color: '#e4a52e', letterSpacing: 2}}>ATÉ O IMPACTO</div>
      </div>
    </div>
  );
};

const LEG: [number, number, string][] = [
  [0.0, 0.62, 'SE A SIRENE DE'],
  [0.62, 1.92, 'ATAQUE [r]NUCLEAR TOCAR'],
  [1.92, 3.26, 'NÃO PEGUE O [r]CARRO'],
  [3.26, 3.98, 'VOCÊ TEM UNS [y]QUINZE'],
  [3.98, 4.76, '[y]MINUTOS'],
  [4.76, 5.52, 'E ELES VALEM MAIS'],
  [5.52, 6.9, 'DO QUE QUALQUER\nESTRADA'],
  [6.9, 7.68, 'MAS SÓ SE VOCÊ'],
  [7.68, 9.08, 'SOUBER EXATAMENTE PRA'],
  [9.08, 10.0, 'ONDE CORRER'],
];

const CENAS: [number, number, React.ReactNode][] = [
  [0, 2.0, <RuaSirene />],
  [2.0, 3.2, <Engarrafamento x />],
  [3.2, 4.4, <><RuaSirene /><Timer /></>],
  [4.4, 6.9, <><Engarrafamento /><Tag txt="15 MIN > QUALQUER ESTRADA" y={1130 - 600} aparece={s(1.1)} /></>],
  [6.9, 10.0, <Sala />],
];

export const Cena: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Audio src={staticFile('voz.m4a')} />
    {CENAS.map(([a, b, el], i) => (
      <Sequence key={i} from={s(a)} durationInFrames={s(b) - s(a)}>
        <Zoom dur={s(b) - s(a)}>{el}</Zoom>
      </Sequence>
    ))}
    <Vinheta />
    {LEG.map(([a, b, t], i) => (
      <Sequence key={i} from={s(a)} durationInFrames={s(b) - s(a)}>
        <Legenda txt={t} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
