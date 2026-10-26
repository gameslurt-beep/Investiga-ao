import React from 'react';
import {AbsoluteFill, Easing, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {CAP, Dia3, P, camera, centroid, useFonts} from './Dia3';

// Dia 3 com cenas de banco intercaladas: o mapa explica, a cena mostra o lugar.
// Passagem = mergulho: o mapa aproxima no ponto e a cena entra se afastando.
const W = 1920, H = 1080, O = 14; // O = quadros de sobreposição na passagem
const INK = '#f4efe6', OR = '#ff8a3d';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = (f: number, r: number[], out: number[], e = Easing.bezier(0.45, 0, 0.2, 1)) => interpolate(f, r, out, {...clamp, easing: e});

type MapSeg = {kind: 'map'; a: number; b: number; focus?: () => [number, number]};
type Clip = {kind: 'clip'; src: string; len: number; kicker: string; title: string};
type Item = MapSeg | Clip;

const ITEMS: Item[] = [
  {kind: 'map', a: 0, b: 150, focus: () => CAP['Brasília']},
  {kind: 'clip', src: 'bsb', len: 60, kicker: 'DISTRITO FEDERAL', title: 'Brasília'},
  {kind: 'map', a: 150, b: 480, focus: () => CAP['São Paulo']},
  {kind: 'clip', src: 'sp', len: 75, kicker: 'SÃO PAULO', title: 'Dinheiro em casa'},
  {kind: 'map', a: 480, b: 580, focus: () => centroid('PI')},
  {kind: 'clip', src: 'hosp', len: 75, kicker: 'PIAUÍ', title: 'Hospital'},
  {kind: 'map', a: 580, b: 650, focus: () => centroid('MT')},
  {kind: 'clip', src: 'mt', len: 75, kicker: 'MATO GROSSO', title: 'Rodovia federal'},
  {kind: 'map', a: 650, b: 710, focus: () => centroid('RS')},
  {kind: 'clip', src: 'rs', len: 75, kicker: 'RIO GRANDE DO SUL', title: 'Universidade federal'},
  {kind: 'map', a: 710, b: 900},
];
const lenOf = (it: Item) => (it.kind === 'map' ? it.b - it.a : it.len);
const STARTS = ITEMS.reduce<number[]>((acc, it, i) => [...acc, i === 0 ? 0 : acc[i - 1] + lenOf(ITEMS[i - 1])], []);
export const DIA3MIX_LEN = STARTS[STARTS.length - 1] + lenOf(ITEMS[ITEMS.length - 1]);

// trecho do mapa: segue o tempo do Dia3 a partir de "a"; no fim, mergulha no ponto
const MapPart: React.FC<{seg: MapSeg; len: number; first: boolean; last: boolean}> = ({seg, len, first, last}) => {
  const f = useCurrentFrame();
  const inA = first ? 1 : io(f, [0, O], [0, 1]);
  const inS = first ? 1 : io(f, [0, O + 6], [1.25, 1]);
  const out = last ? 0 : io(f, [len, len + O], [0, 1], Easing.in(Easing.cubic));
  const pt = seg.focus ? P(camera(seg.a + Math.min(f, len)), seg.focus()) : [W / 2, H / 2];
  return (
    <AbsoluteFill style={{opacity: inA, transformOrigin: `${pt[0]}px ${pt[1]}px`, transform: `scale(${inS * (1 + 1.8 * out)})`,
      filter: out > 0 ? `blur(${out * 6}px)` : undefined}}>
      <Sequence from={-seg.a}><Dia3 /></Sequence>
    </AbsoluteFill>
  );
};

// cena de banco: entra se afastando, deriva devagar, etiqueta de lugar no canto
const ClipPart: React.FC<{clip: Clip}> = ({clip}) => {
  const f = useCurrentFrame();
  const inA = io(f, [0, O], [0, 1]);
  const s = io(f, [0, O + 8], [1.18, 1.04]) * interpolate(f, [0, clip.len + O], [1, 1.05]);
  const tag = io(f, [O - 2, O + 12], [0, 1]) * (1 - io(f, [clip.len - 4, clip.len + 6], [0, 1]));
  const lineW = io(f, [O, O + 18], [0, 1]);
  return (
    <AbsoluteFill style={{opacity: inA, background: '#04060c', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${s})`}}>
        <OffthreadVideo src={staticFile(`banco/${clip.src}.mp4`)} muted style={{width: W, height: H, objectFit: 'cover'}} />
      </AbsoluteFill>
      {/* mesma luz do mapa: noite azulada, vinheta forte */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,8,20,.35) 0%, rgba(4,8,20,0) 35%, rgba(4,6,12,.55) 100%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,.6) 100%)'}} />
      <div style={{position: 'absolute', left: 72, bottom: 78, fontFamily: 'Poppins', color: INK, opacity: tag, textShadow: '0 2px 18px rgba(0,0,0,.85)'}}>
        <div style={{width: 64 * lineW, height: 3, background: OR, marginBottom: 14}} />
        <div style={{fontSize: 22, fontWeight: 600, letterSpacing: 3, color: '#c3c8d4'}}>{clip.kicker}</div>
        <div style={{fontSize: 58, fontWeight: 700, lineHeight: 1.1}}>{clip.title}</div>
        <div style={{fontSize: 15, color: '#8d93a1', letterSpacing: 1.5, marginTop: 8}}>IMAGEM ILUSTRATIVA</div>
      </div>
    </AbsoluteFill>
  );
};

export const Dia3Mix: React.FC = () => {
  useFonts();
  return (
  <AbsoluteFill style={{background: '#04060c'}}>
    {ITEMS.map((it, i) => {
      const last = i === ITEMS.length - 1;
      const len = lenOf(it);
      return (
        <Sequence key={i} from={STARTS[i]} durationInFrames={len + (last ? 0 : O)}>
          {it.kind === 'map' ? <MapPart seg={it} len={len} first={i === 0} last={last} /> : <ClipPart clip={it} />}
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
};
