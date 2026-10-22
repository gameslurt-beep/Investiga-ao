import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';
import '@fontsource/montserrat/800.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/permanent-marker/400.css';
import words from './words_pt.json';
import qm from './qmeta.json';
import {ShotMarch, ShotGas, ShotRun, ecgPath, Banner, Sign} from './Paris15';

const FPS = 30;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lerp = (t: number, a: number[], b: number[], ease = Easing.inOut(Easing.cubic)) => interpolate(t, a, b, {...clamp, easing: ease});
const MARKER = 'Permanent Marker';
const WARDROBE_READY = true;

// ---------------------------------------------------------------- world camera (children in source-image pixels, 768x1376)
const World: React.FC<{src: string; cx: number; cy: number; z: number; filter?: string; shake?: number; noImg?: boolean; children?: React.ReactNode}> = ({src, cx, cy, z, filter, shake = 0, noImg, children}) => {
  const f = useCurrentFrame();
  const sx = shake * Math.sin(f * 2.1) * 9;
  const sy = shake * Math.cos(f * 2.7) * 7;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: noImg ? undefined : '#120e17'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 768, height: 1376, transformOrigin: '0 0', transform: `translate(${360 + sx}px,${640 + sy}px) scale(${z}) translate(${-cx}px,${-cy}px)`, filter}}>
        {!noImg && <Img src={staticFile(src)} style={{position: 'absolute', left: 0, top: 0, width: 768, height: 1376}} />}
        {children}
      </div>
    </AbsoluteFill>
  );
};

// a keyed cut-out, feet (bottom centre) at x,y
const Q: React.FC<{n: string; x: number; y: number; h?: number; w?: number; flip?: boolean; rot?: number; o?: number; sq?: number; filter?: string; origin?: string}> = ({n, x, y, h, w, flip, rot = 0, o = 1, sq = 1, filter, origin = '50% 100%'}) => {
  const m = (qm as any)[n];
  const s = h ? h / m.h : (w as number) / m.w;
  const W = m.w * s;
  const H = m.h * s;
  return (
    <Img src={staticFile(`q/${n}.png`)} style={{position: 'absolute', left: x - W / 2, top: y - H, width: W, height: H, opacity: o, filter, transformOrigin: origin, transform: `rotate(${rot}deg) scale(${flip ? -1 / sq : 1 / sq}, ${sq})`}} />
  );
};

const Glow: React.FC<{x: number; y: number; r: number; c: string; o?: number; blend?: any}> = ({x, y, r, c, o = 1, blend = 'screen'}) => (
  <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: `radial-gradient(circle, ${c} 0%, rgba(0,0,0,0) 70%)`, opacity: o, mixBlendMode: blend}} />
);

// handwriting reveal: text uncovered left to right between t0 and t1
const Hand: React.FC<{t: number; t0: number; t1: number; x: number; y: number; size: number; color?: string; rot?: number; children: React.ReactNode}> = ({t, t0, t1, x, y, size, color = '#1d1a2a', rot = 0, children}) => {
  if (t < t0) return null;
  const p = lerp(t, [t0, t1], [0, 1], Easing.linear);
  return (
    <div style={{position: 'absolute', left: x, top: y, fontFamily: MARKER, fontSize: size, color, whiteSpace: 'nowrap', lineHeight: 1, transform: `rotate(${rot}deg)`, clipPath: `inset(-20% ${(1 - p) * 100}% -20% 0)`}}>
      {children}
    </div>
  );
};

// stroke drawn over time (svg path with pathLength=1)
const Stroke: React.FC<{t: number; t0: number; t1: number; d: string; c?: string; w?: number}> = ({t, t0, t1, d, c = '#1d1a2a', w = 4}) => {
  if (t < t0) return null;
  const p = lerp(t, [t0, t1], [0, 1], Easing.inOut(Easing.quad));
  return <path d={d} pathLength={1} stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - p} />;
};

// ---------------------------------------------------------------- HUD (whole video)
const BPM: [number, number][] = [[5, 104], [7, 111], [9, 114], [10.5, 132], [11.5, 148], [13, 158], [14, 168], [15.6, 160], [16, 150], [18.5, 111], [20.5, 110], [21, 112], [23, 127], [25, 138], [26.5, 133], [28, 133], [29, 139], [30.5, 135], [31.5, 126], [33, 124], [35.5, 107], [37.6, 105], [38, 103], [39, 96], [40.5, 94], [41.5, 94], [42.7, 91], [44.5, 84], [47, 78], [50, 64], [51.5, 63], [51.7, 96], [52, 128], [53, 120], [54.5, 119], [55.5, 129], [57.5, 148], [59.5, 155], [61.5, 146], [65.5, 138], [68, 132], [71.5, 130], [72.5, 148], [73.5, 163], [75, 152], [76, 153], [77.5, 164], [80, 169], [83, 172], [87, 172]];
const bpmAt = (t: number) => interpolate(t, BPM.map((k) => k[0]), BPM.map((k) => k[1]), clamp);
const CLOCK: [number, string][] = [[0, '10:12'], [7.5, '10:13'], [13.9, '10:20'], [14.6, '10:23'], [15.2, '10:26'], [15.5, '10:28'], [18.2, '10:29'], [20.3, '10:30'], [22.5, '10:31'], [24.5, '10:32'], [27, '10:33'], [29.9, '10:34'], [32.6, '10:37'], [34.8, '10:42'], [36.4, '11:00'], [37.03, '11:02'], [38, '11:03'], [38.6, '11:05'], [40.13, '11:08'], [41, '11:09'], [42.1, '11:11'], [43.9, '11:14'], [45.2, '11:15'], [46.03, '11:58'], [74.57, '11:59']];
const clockAt = (t: number) => [...CLOCK].reverse().find((c) => c[0] <= t)![1];
const clock24 = (c: string) => `${Number(c.split(':')[0]) + 12}:${c.split(':')[1]}`;
const STATE_PT: Record<string, string> = {CALM: 'CALMO', TENSE: 'TENSO', PANIC: 'PÂNICO'};

const Hud: React.FC<{t: number}> = ({t}) => {
  const bpm = Math.round(bpmAt(t));
  const state = bpm >= 138 ? 'PANIC' : bpm >= 100 ? 'TENSE' : 'CALM';
  const col = state === 'PANIC' ? '#ef4444' : state === 'TENSE' ? '#f5a623' : '#22c55e';
  const lit = Math.round((bpm / 180) * 16);
  const o = lerp(t, [5, 5.35], [0, 1]) * (1 - lerp(t, [84.0, 84.5], [0, 1]));
  const grey = t > 53.47 && t < 56.5;
  const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * (bpm / 60))), 8);
  const place = t < 13.9 ? 'BULEVAR DE CLICHY' : t < 14.6 ? 'RUA LEPIC' : '6º ANDAR · PIGALLE';
  return (
    <div style={{position: 'absolute', left: 30, top: 130, width: 288, padding: '14px 16px 12px', background: 'rgba(24,21,38,0.58)', backdropFilter: 'blur(7px)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'JetBrains Mono', color: '#fff', opacity: o * (grey ? 0.55 : 1), filter: grey ? 'grayscale(1)' : undefined}}>
      <div style={{position: 'absolute', left: -6, top: -6, width: 18, height: 18, borderLeft: '3px solid #f5a623', borderTop: '3px solid #f5a623'}} />
      <div style={{position: 'absolute', right: -6, bottom: -6, width: 18, height: 18, borderRight: '3px solid #f5a623', borderBottom: '3px solid #f5a623'}} />
      <div style={{fontSize: 15}}>
        <span style={{color: '#f5a623', fontWeight: 700}}>DIA 1</span>
        <span style={{color: '#b9b6c8', fontSize: 13}}> · SÁB 17 OUT</span>
      </div>
      <div style={{fontSize: 44, fontWeight: 700, lineHeight: 1.1}}>
        {clock24(clockAt(t))}
      </div>
      <div style={{fontSize: 13, color: '#c9c6d6'}}>
        <svg width={10} height={13} style={{marginRight: 4, verticalAlign: -1}}><path d="M5 0 a5 5 0 0 1 5 5 c0 3.5 -5 8 -5 8 s-5 -4.5 -5 -8 a5 5 0 0 1 5 -5z" fill="#f5a623" /></svg>{place}
      </div>
      <div style={{height: 1, background: 'rgba(255,255,255,0.12)', margin: '10px 0 8px'}} />
      <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
        <div>
          <span style={{color: '#ef4444', fontSize: 28, display: 'inline-block', transform: `scale(${1 + beat * 0.18})`}}>♥</span>
          <span style={{fontSize: 34, fontWeight: 700, marginLeft: 8}}>{bpm}</span>
          <span style={{fontSize: 12, color: '#b9b6c8', marginLeft: 4}}>BPM</span>
        </div>
        <span style={{color: col, fontWeight: 700, fontSize: 17}}>{STATE_PT[state]}</span>
      </div>
      <svg width={256} height={22} style={{display: 'block', marginTop: -6}}>
        <path d={ecgPath(t, bpm)} stroke={state === 'PANIC' ? '#ffb4b4' : '#fff'} strokeWidth={1.5} fill="none" />
      </svg>
      <div style={{display: 'flex', gap: 3, marginTop: 4}}>
        {Array.from({length: 16}).map((_, i) => (
          <div key={i} style={{flex: 1, height: 9, borderRadius: 1, background: i >= lit ? 'rgba(255,255,255,0.12)' : i < 6 ? '#22c55e' : i < 10 ? '#f59e0b' : '#ef4444'}} />
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- captions
type W = [string, number, number];
const PAGES: W[][] = (() => {
  const out: W[][] = [];
  let cur: W[] = [];
  (words as W[]).forEach((w) => {
    cur.push(w);
    if (cur.length === 3 || /[.,?]$/.test(w[0])) {
      out.push(cur);
      cur = [];
    }
  });
  if (cur.length) out.push(cur);
  return out;
})();

const Captions: React.FC<{t: number}> = ({t}) => {
  if (t > 79.4) return null; // the question is hand-written on screen instead
  const page = [...PAGES].reverse().find((p) => p[0][1] <= t + 0.02);
  if (!page) return null;
  const last = page[page.length - 1];
  if (t > last[2] + 0.5) return null;
  const top = t < 14.6 || (t > 21.93 && t < 27) ? 800 : 1090;
  const pop = lerp(t, [page[0][1], page[0][1] + 0.12], [0.85, 1], Easing.out(Easing.back(2)));
  return (
    <div style={{position: 'absolute', top, width: '100%', textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 46, color: '#fff', textShadow: '0 3px 10px rgba(0,0,0,0.85)', transform: `scale(${pop})`, padding: '0 30px', boxSizing: 'border-box'}}>
      {page.filter((w) => w[1] <= t + 0.02).map((w, i) => {
        const active = t >= w[1] && t < w[2] + 0.05;
        return (
          <span key={i} style={{color: active ? '#c7f13b' : '#fff', marginRight: 14}}>
            {w[0].replace(/[,.?]$/, '').toUpperCase()}
          </span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- 14.6–15.5 typing the door code (image 33 + arm 34)
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', '0', 'B'];
const keyPos = (i: number): [number, number] => [300 + (i % 3) * 84, 528 + Math.floor(i / 3) * 85];
const CODE: [number, number][] = [[14.72, 3], [14.92, 6], [15.1, 0], [15.3, 11]]; // 4, 7, 1, B
const ShotKeypad: React.FC<{t: number}> = ({t}) => {
  // fingertip travels between keys and dips on each press
  let fx = 560;
  let fy = 980;
  let press = 0;
  CODE.forEach(([pt, k], j) => {
    const [kx, ky] = keyPos(k);
    const prev = j === 0 ? [560, 980] : keyPos(CODE[j - 1][1]);
    const a = lerp(t, [pt - 0.16, pt - 0.02], [0, 1]);
    if (t >= pt - 0.16) {
      fx = prev[0] + (kx - prev[0]) * a;
      fy = prev[1] + (ky - prev[1]) * a;
    }
    if (Math.abs(t - pt) < 0.06) press = 1 - Math.abs(t - pt) / 0.06;
  });
  const lit = (i: number) => CODE.some(([pt, k]) => k === i && t >= pt - 0.02 && t < pt + 0.14);
  const done = t > 15.38;
  const led = done ? '#22c55e' : CODE.some(([pt]) => t >= pt && t < pt + 0.08) ? '#ef4444' : '#5a2020';
  const m = (qm as any).finger;
  const s = 0.62;
  return (
    <World src="keypad.jpg" cx={384} cy={700} z={0.96 + (t - 14.6) * 0.06}>
      {KEYS.map((k, i) => {
        const [x, y] = keyPos(i);
        const on = lit(i);
        return (
          <div key={k} style={{position: 'absolute', left: x - 30, top: y - 30, width: 60, height: 60, borderRadius: 6, background: on ? '#f5c542' : 'transparent', boxShadow: on ? '0 0 24px 6px rgba(245,197,66,0.7)' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 28, color: on ? '#2a2230' : 'rgba(235,232,240,0.85)'}}>
            {k}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 374, top: 855, width: 20, height: 20, borderRadius: '50%', background: led, boxShadow: led !== '#5a2020' ? `0 0 16px 5px ${led}` : undefined}} />
      {/* the arm: fingertip of finger.png sits at about (22,14) */}
      <Img src={staticFile('q/finger.png')} style={{position: 'absolute', left: fx - 22 * s, top: fy - 14 * s + press * 6, width: m.w * s * (1 - press * 0.03), height: m.h * s}} />
    </World>
  );
};

// ---------------------------------------------------------------- apartment (isometric, image 09)
const HERO_H = 168;
const APT_LOOK = 'brightness(0.8) saturate(0.88) hue-rotate(-6deg)';
const Apt: React.FC<{cx: number; cy: number; z: number; filter?: string; shake?: number; img?: string; children?: React.ReactNode}> = ({img = 'apt.jpg', filter = APT_LOOK, children, ...p}) => (
  <World src={img} filter={filter} {...p}>
    <Glow x={700} y={640} r={160} c="rgba(255,190,110,0.3)" />
    {children}
    {/* night tint over room and characters alike */}
    <div style={{position: 'absolute', left: 0, top: 0, width: 768, height: 1376, background: 'rgba(40,30,95,0.22)', mixBlendMode: 'multiply'}} />
  </World>
);

// an actor moving through pose keys: walks take steps, pose changes cross-fade with a small settle
type K = {t: number; n: string; x: number; y: number; h: number; flip?: boolean; walk?: boolean};
const Actor: React.FC<{t: number; keys: K[]}> = ({t, keys}) => {
  let i = 0;
  for (let j = 0; j < keys.length; j++) if (keys[j].t <= t) i = j;
  const a = keys[i];
  const b = keys[i + 1];
  let x = a.x;
  let y = a.y;
  let bob = 0;
  let rot = 0;
  if (a.walk && b) {
    const p = Math.min(1, (t - a.t) / (b.t - a.t));
    const steps = Math.max(2, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 22));
    const s = p * steps;
    const f = s - Math.floor(s);
    const q = (Math.floor(s) + Easing.inOut(Easing.sin)(f)) / steps; // move in steps
    x = a.x + (b.x - a.x) * q;
    y = a.y + (b.y - a.y) * q;
    bob = -Math.sin(f * Math.PI) * 5;
    rot = (Math.floor(s) % 2 ? 1 : -1) * 2;
  }
  const blend = b && !a.walk ? lerp(t, [b.t - 0.12, b.t], [0, 1], Easing.linear) : 0;
  const settle = 1 - lerp(t, [a.t, a.t + 0.18], [0.04, 0], Easing.out(Easing.quad));
  return (
    <>
      <Q n={a.n} x={x} y={y + bob} h={a.h} flip={a.flip} rot={rot} o={1 - blend} sq={i > 0 ? settle : 1} />
      {blend > 0 && <Q n={b.n} x={b.x} y={b.y} h={b.h} flip={b.flip} o={blend} />}
    </>
  );
};
// sofa seat and the cat's spot
const CAT_SPOT = [505, 800];

// 15.5–20.3 lock the door, pan to the cat on the couch
const ShotLock: React.FC<{t: number}> = ({t}) => {
  const k = lerp(t, [16.9, 18.2], [0, 1]);
  const turn = t > 16.3 && t < 16.8 ? Math.sin((t - 16.3) * 25) * 2 : 0;
  return (
    <Apt cx={300 + k * 130} cy={690 + k * 30} z={1.28 + (t - 15.5) * 0.01}>
      <Actor t={t} keys={[
        {t: 0, n: 'pose0', x: 185, y: 850, h: HERO_H, flip: true},
        {t: 16.9, n: 'pose1', x: 190, y: 852, h: HERO_H, walk: true},
        {t: 18.6, n: 'pose0', x: 300, y: 892, h: HERO_H},
      ]} />
      <Q n="cat0" x={CAT_SPOT[0]} y={CAT_SPOT[1]} w={74} rot={Math.sin(t * 3) * 0.6} />
      {t > 16.3 && t < 16.7 && <Glow x={150} y={700} r={22} c="rgba(255,240,200,0.9)" />}
      <div style={{position: 'absolute', left: 0, top: 0, opacity: 0, transform: `rotate(${turn}deg)`}} />
    </Apt>
  );
};

// 20.3–21.93 car alarm outside, red light in the window
const ShotAlarm: React.FC<{t: number}> = ({t}) => {
  const flash = t > 20.6 ? (Math.sin(t * 14) > 0 ? 1 : 0.25) : 0;
  return (
    <Apt cx={440} cy={690} z={1.2 + (t - 20.3) * 0.02}>
      <Glow x={620} y={600} r={130} c={`rgba(255,40,30,${0.7 * flash})`} />
      <Glow x={560} y={830} r={200} c={`rgba(255,60,40,${0.3 * flash})`} />
      <Actor t={t} keys={[
        {t: 0, n: 'pose1', x: 300, y: 892, h: HERO_H, walk: true},
        {t: 21.5, n: 'pose0', x: 360, y: 915, h: HERO_H},
      ]} />
      <Q n="catb1" x={CAT_SPOT[0]} y={CAT_SPOT[1]} h={50} />
    </Apt>
  );
};

// ---------------------------------------------------------------- 21.93–27 from the balcony: the march, the bus alarm, everyone turns toward it
const BUS = [560, 860];
// the street runs from lower-left to upper-right; walkers advance along it
const ST_DIR = [0.84, -0.54];
const C45 = Array.from({length: 170}).map((_, i) => {
  const r = (n: number) => {
    const s = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  // spread over the road band: u along the street, v across it
  return {n: `c45_${i % 21}`, u: r(1) * 1100 - 250, v: r(2), sp: 18 + r(3) * 10, d: r(4), ph: r(5) * 6};
});
const ShotStreet: React.FC<{t: number}> = ({t}) => {
  const stop = lerp(t, [25.5, 25.9], [0, 1]);
  const walkT = Math.min(t, 25.7) - 21.93;
  const flash = Math.sin(t * 14) > 0 ? 1 : 0.2;
  const people = C45.map((p, i) => {
    const u = ((p.u + walkT * p.sp) % 1100 + 1100) % 1100 - 250;
    // road band: across-street offset grows toward the camera
    const bx = 40 + u * ST_DIR[0];
    const by = 880 + u * ST_DIR[1];
    const x = bx + p.v * 230 * 0.54;
    const y = by + p.v * 230 * 0.84 - 120 + Math.sin(t * 8 + p.ph) * 1.2 * (1 - stop);
    return {...p, x, y};
  }).filter((p) => p.y > 520 && p.y < 900 && p.x > -40 && p.x < 800).sort((a, b) => a.y - b.y);
  return (
    <World src="street45.jpg" cx={384} cy={690} z={0.95 + (t - 21.93) * 0.01}>
      {/* the bus alarm */}
      <Glow x={BUS[0]} y={BUS[1]} r={150} c={`rgba(255,60,40,${0.55 * flash})`} />
      {[[-40, 0], [20, 30]].map(([dx, dy], i) => <Glow key={i} x={BUS[0] + dx} y={BUS[1] + dy} r={18} c={`rgba(255,190,60,${flash})`} />)}
      {/* red flares in the march */}
      {[[200, 700], [420, 600]].map(([x, y], i) => <Glow key={i} x={x} y={y} r={70} c={`rgba(255,50,40,${0.55 + 0.2 * Math.sin(t * 11 + i)})`} />)}
      {people.map((p, i) => {
        const h = 44 + (p.y - 470) * 0.07;
        const face = p.x < BUS[0];
        const turn = lerp(t, [25.66 + p.d * 0.5, 25.9 + p.d * 0.5], [0, 1], Easing.linear);
        // walking they face along the street (right); after the alarm they face the bus
        const flip = turn > 0.5 ? !face : false;
        return <Q key={i} n={p.n} x={p.x} y={p.y} h={h} flip={flip} rot={(1 - stop) * Math.sin(t * 8 + p.ph) * 3} filter="brightness(0.82)" />;
      })}
    </World>
  );
};

// ---------------------------------------------------------------- 27–29.43 one of them, from behind… then the head turns
const ShotBackHead: React.FC<{t: number}> = ({t}) => {
  const k = t - 27;
  const turned = t >= 28.86;
  const pop = lerp(t, [28.86, 29.05], [0.94, 1], Easing.out(Easing.back(2)));
  const red = 'brightness(0.32) sepia(1) saturate(5) hue-rotate(-38deg)';
  const pm = (qm as any).pprofile;
  const ps = 820 / pm.h;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#140b14'}}>
      <Img src={staticFile('bg1.jpg')} style={{position: 'absolute', left: -200, top: -520, width: 1080, height: 1935, filter: 'brightness(0.35) saturate(0.6) blur(2px)'}} />
      <AbsoluteFill style={{transform: `scale(${1 + k * 0.03})`, transformOrigin: '50% 60%'}}>
        {[-40, 90, 210, 330, 460, 590, 700].map((x, i) => (
          <Q key={i} n={`back${i % 4}`} x={x} y={1240 + (i % 2) * 40} h={620 + (i % 3) * 40} filter={red} rot={Math.sin(t * 2 + i) * 0.8} />
        ))}
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 70%, rgba(180,30,40,0.25), rgba(0,0,0,0) 60%)'}} />
        {!turned ? (
          <Q n="pback" x={360} y={1980} h={1700} />
        ) : (
          <div style={{position: 'absolute', left: 360 - (pm.w * ps) / 2, top: 1280 - 820, width: pm.w * ps, height: 820, transform: `scale(${pop})`, transformOrigin: '50% 100%'}}>
            <Img src={staticFile('q/pprofile.png')} style={{width: '100%', height: '100%'}} />
            {/* the eye that should not be there */}
            <div style={{position: 'absolute', left: 78 * ps, top: 150 * ps, width: 22, height: 22, borderRadius: '50%', background: '#b6ff4a', boxShadow: '0 0 20px 8px rgba(170,255,60,0.8)'}} />
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- notebook (close-ups, images 26/27)
const ShotNotebookClosed: React.FC<{t: number}> = ({t}) => {
  const k = lerp(t, [29.43, 32.6], [0, 1], Easing.inOut(Easing.quad));
  return (
    <World src="nb_closed2.jpg" cx={384} cy={700} z={0.95 + k * 0.12}>
      <div style={{position: 'absolute', left: 222, top: 425, width: 320, textAlign: 'center', fontFamily: MARKER, fontSize: 50, lineHeight: 1, color: '#1d1a2a', transform: 'rotate(-4deg)'}}>
        SÓ POR<br />GARANTIA
      </div>
    </World>
  );
};

// the open page: content is drawn in the old page's 372x490 space and mapped onto the right page of image 26
const PG = {x: 200, y: 380, s: 1.42};
const Page: React.FC<{t: number; children: React.ReactNode; flip?: number}> = ({t, children, flip = -1}) => {
  const ft = flip > 0 ? lerp(t, [flip, flip + 0.25], [0, 1]) : 0;
  return (
    <World src="nb_open2.jpg" cx={400} cy={660} z={0.98 + (t % 10) * 0.004}>
      <div style={{position: 'absolute', left: PG.x, top: PG.y, transform: `scale(${PG.s})`, transformOrigin: '0 0'}}>
        <div style={{position: 'absolute', left: -75, top: -410, width: 768, height: 1376}}>{children}</div>
      </div>
      {ft > 0 && ft < 1 && <div style={{position: 'absolute', left: 215, top: 275, width: 485, height: 765, background: '#f3e6c6', transformOrigin: '0 50%', transform: `scaleX(${1 - ft})`, boxShadow: '4px 0 10px rgba(0,0,0,0.3)'}} />}
    </World>
  );
};

const PageSilence: React.FC<{t: number}> = ({t}) => {
  const showBar = t < 36.45;
  return (
    <Page t={t} flip={36.4}>
      {showBar ? (
        <>
          <Hand t={t} t0={34.35} t1={34.9} x={108} y={440} size={40}>1. SILÊNCIO</Hand>
          <svg width={768} height={1376} style={{position: 'absolute', left: 0, top: 0}}>
            <Stroke t={t} t0={34.8} t1={35.05} d="M110 492 L330 488" c="#d0303a" w={3} />
            <Stroke t={t} t0={34.9} t1={35.4} d="M130 520 L200 520 L200 830 L130 830 Z" w={4} />
            {[572, 624, 676, 728, 780].map((y, i) => (
              <Stroke key={y} t={t} t0={35.0 + i * 0.06} t1={35.12 + i * 0.06} d={`M130 ${y} L200 ${y}`} w={3} />
            ))}
            <Stroke t={t} t0={35.2} t1={35.45} d="M142 532 L188 532 L188 560 L142 560 Z" c="#d0303a" w={3} />
            {[34, 56, 78].map((r, i) => (
              <Stroke key={r} t={t} t0={35.5 + i * 0.12} t1={35.7 + i * 0.12} d={`M${205 + r * 0.5} ${546 - r} A ${r} ${r} 0 0 1 ${205 + r * 0.5} ${546 + r}`} w={3} />
            ))}
            {[300, 345, 390].map((x, i) => (
              <Stroke key={x} t={t} t0={36.0 + i * 0.08} t1={36.15 + i * 0.08} d={`M${x - 16} 812 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0`} w={3} />
            ))}
          </svg>
          <Hand t={t} t0={35.3} t1={35.4} x={146} y={538} size={14} color="#d0303a">VOCÊ</Hand>
          <Hand t={t} t0={35.8} t1={36.0} x={222} y={680} size={18}>6 ANDARES ABAIXO...</Hand>
          <Hand t={t} t0={36.0} t1={36.25} x={232} y={704} size={20} color="#d0303a">AINDA ALTO.</Hand>
          <svg width={768} height={1376} style={{position: 'absolute', left: 0, top: 0}}><Stroke t={t} t0={35.75} t1={35.95} d="M215 690 C190 680 200 640 210 600 M203 612 L210 598 L220 610" w={3} /></svg>
          {[300, 345, 390].map((x, i) => (
            <Hand key={x} t={t} t0={36.1 + i * 0.05} t1={36.15 + i * 0.05} x={x - 5} y={765} size={22} color="#d0303a">!</Hand>
          ))}
        </>
      ) : (
        <>
          <Hand t={t} t0={36.6} t1={36.95} x={108} y={444} size={27}>2. BLOQUEAR A PORTA</Hand>
          <svg width={768} height={1376} style={{position: 'absolute', left: 0, top: 0}}>
            <Stroke t={t} t0={36.75} t1={37.0} d="M150 540 L230 540 L230 700 L150 700 Z M215 620 L220 620" w={4} />
            <Stroke t={t} t0={36.85} t1={37.03} d="M250 530 L310 530 L310 710 L250 710 Z" w={4} />
          </svg>
        </>
      )}
    </Page>
  );
};

const PageThree: React.FC<{t: number}> = ({t}) => (
  <Page t={t}>
    <Hand t={t} t0={40.3} t1={40.5} x={108} y={440} size={40}>3.</Hand>
  </Page>
);

const ZIG = 'M150 540 L300 600 L150 660 L300 720 L150 780 L300 840';
const PageShoes: React.FC<{t: number}> = ({t}) => {
  const dot = lerp(t, [44.4, 45.9], [0, 1], Easing.linear);
  // point along the zigzag
  const pts = [[150, 540], [300, 600], [150, 660], [300, 720], [150, 780], [300, 840]];
  const seg = Math.min(4.999, dot * 5);
  const i = Math.floor(seg);
  const f = seg - i;
  const dx = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f;
  const dy = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f;
  return (
    <Page t={t}>
      <Hand t={t} t0={40.3} t1={40.4} x={108} y={440} size={40}>3.</Hand>
      <Hand t={t} t0={43.35} t1={43.9} x={160} y={440} size={40}>TÊNIS NO PÉ</Hand>
      <svg width={768} height={1376} style={{position: 'absolute', left: 0, top: 0}}>
        <Stroke t={t} t0={43.8} t1={44.0} d="M110 492 L350 488" c="#d0303a" w={3} />
        <Stroke t={t} t0={43.9} t1={44.5} d={ZIG} w={4} />
        <Stroke t={t} t0={44.9} t1={45.3} d="M330 690 L400 690 L408 770 L322 770 Z M345 690 C345 660 385 660 385 690 M345 712 L388 712 L388 748 L345 748 Z" w={3} />
        <Stroke t={t} t0={45.6} t1={45.8} d="M332 840 L410 830" c="#d0303a" w={4} />
      </svg>
      {t > 44.4 && <div style={{position: 'absolute', left: dx - 9, top: dy - 9, width: 18, height: 18, borderRadius: '50%', background: '#d0303a'}} />}
      <Hand t={t} t0={44.5} t1={44.8} x={300} y={520} size={20} color="#d0303a">ELES:</Hand>
      <Hand t={t} t0={44.7} t1={45.0} x={300} y={548} size={30} color="#d0303a">30 SEG</Hand>
      <Hand t={t} t0={45.2} t1={45.5} x={318} y={790} size={16}>ARRUMAR:</Hand>
      <Hand t={t} t0={45.4} t1={45.6} x={330} y={812} size={24}>5 MIN</Hand>
    </Page>
  );
};

// ---------------------------------------------------------------- iso cutaways
// 32.6–34.3 TV off, unplug the intercom
const ShotUnplug: React.FC<{t: number}> = ({t}) => {
  const tvOn = t < 32.75;
  const icon = lerp(t, [33.3, 33.5], [0, 1], Easing.out(Easing.back(2)));
  return (
    <Apt cx={300} cy={720} z={1.35}>
      {tvOn && <Glow x={250} y={880} r={80} c="rgba(140,190,255,0.7)" />}
      <Q n="prop1" x={168} y={705} h={50} />
      <Actor t={t} keys={[
        {t: 0, n: 'pose0', x: 300, y: 900, h: HERO_H, flip: true},
        {t: 32.9, n: 'pose1', x: 300, y: 900, h: HERO_H, flip: true, walk: true},
        {t: 33.4, n: 'pose0', x: 225, y: 862, h: HERO_H, flip: true},
      ]} />
      <div style={{position: 'absolute', left: 152, top: 618, width: 32, height: 32, borderRadius: '50%', border: '4px solid #ef4444', background: 'rgba(255,255,255,0.9)', transform: `scale(${icon})`}}>
        <div style={{position: 'absolute', left: 12, top: -2, width: 4, height: 32, background: '#ef4444', transform: 'rotate(45deg)'}} />
      </div>
    </Apt>
  );
};

// 37.03–38.23 barricade: push the wardrobe against the door (needs Flow image 31/32; falls back to the chair)
const HAS_WARDROBE = WARDROBE_READY;
const ShotBarricade: React.FC<{t: number}> = ({t}) => {
  const k = lerp(t, [37.15, 38.0], [0, 1], Easing.inOut(Easing.quad));
  if (HAS_WARDROBE) {
    // wardrobe slides along the left wall from its spot to cover the door
    const wx = 232 - k * 110;
    const wy = 765 + k * 55;
    return (
      <Apt cx={300} cy={720} z={1.35} img="apt_nowardrobe.jpg">
        <Q n="prop1" x={168} y={705} h={50} />
        <Q n="wardrobe" x={wx} y={wy} h={262} />
        <Q n="pose2" x={wx + 95} y={wy + 15} h={HERO_H * 0.85} flip />
      </Apt>
    );
  }
  const cx = 320 - k * 120;
  const cy = 905 - k * 45;
  return (
    <Apt cx={300} cy={720} z={1.35}>
      <Q n="prop1" x={168} y={705} h={50} />
      <Q n="prop3" x={cx} y={cy} w={95} />
      <Q n="pose2" x={cx + 85} y={cy + 35} h={HERO_H * 0.85} flip />
    </Apt>
  );
};
const Barricaded: React.FC = () => (HAS_WARDROBE ? <Q n="wardrobe" x={122} y={820} h={262} /> : <Q n="prop3" x={200} y={860} w={95} />);
const aptImg = () => (HAS_WARDROBE ? 'apt_nowardrobe.jpg' : 'apt.jpg');

// 42.1–43.27 bag by the door
const ShotBag: React.FC<{t: number}> = ({t}) => {
  const k = lerp(t, [42.2, 42.7], [0, 1], Easing.out(Easing.quad));
  return (
    <Apt cx={300} cy={730} z={1.35} img={aptImg()}>
      <Q n="prop1" x={168} y={705} h={50} />
      <Barricaded />
      <Q n="prop0" x={245} y={885 - (1 - k) * 26} h={42} />
      <Q n="pose4" x={292} y={912} h={HERO_H * 0.66} flip />
    </Apt>
  );
};

// 46.03–53.47 walk to the couch, finally sit down… then the thud
const ShotSit: React.FC<{t: number}> = ({t}) => {
  const thud = t > 51.53 ? Math.max(0, 1 - (t - 51.53) * 2.2) : 0;
  const alert = t > 51.9;
  const ring = t - 51.53;
  return (
    <Apt cx={430} cy={720} z={1.26 + (t - 46.03) * 0.01} shake={thud} img={aptImg()}>
      <Barricaded />
      <Actor t={t} keys={[
        {t: 0, n: 'pose1', x: 300, y: 905, h: HERO_H, walk: true},
        {t: 48.3, n: 'pose0', x: 410, y: 870, h: HERO_H},
        {t: 49.25, n: 'pose7', x: 440, y: 832, h: 138},
      ]} />
      {alert ? <Q n="catb1" x={CAT_SPOT[0]} y={CAT_SPOT[1]} h={50} /> : <Q n="catb0" x={CAT_SPOT[0]} y={CAT_SPOT[1]} w={58} sq={1 + Math.sin(t * 2) * 0.02} />}
      {ring > 0 && ring < 1.5 && [0, 0.25, 0.5].map((d) => {
        const r = Math.max(0, ring - d) * 110;
        return <div key={d} style={{position: 'absolute', left: 600 - r, top: 560 - r * 1.3, width: r * 2, height: r * 2.6, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.55)', opacity: Math.max(0, 1 - ring / 1.5)}} />;
      })}
    </Apt>
  );
};

// 56.5–60.73 the cat bolts: off the couch, across the floor, up and out of the window
const catPath = (p: number): [number, number] => {
  if (p < 0.45) {
    const k = p / 0.45;
    return [CAT_SPOT[0] + k * 80, CAT_SPOT[1] + k * 95 - Math.sin(k * Math.PI) * 25];
  }
  const k = (p - 0.45) / 0.55;
  return [585 + k * 40, 895 - k * 210 - Math.sin(k * Math.PI) * 50];
};
const ShotBolt: React.FC<{t: number}> = ({t}) => {
  const run = lerp(t, [57.55, 59.35], [0, 1], Easing.linear);
  const [cx, cy] = catPath(run);
  const out = t > 59.35;
  const stretch = 1 + 0.08 * Math.sin(t * 30);
  return (
    <Apt cx={450} cy={720} z={1.2} img={aptImg()}>
      <Barricaded />
      {t < 57.55 ? <Q n="catb2" x={CAT_SPOT[0]} y={CAT_SPOT[1]} h={50} /> : !out && <Q n="catb3" x={cx} y={cy} h={46} flip sq={stretch} />}
      <Actor t={t} keys={[
        {t: 0, n: 'pose7', x: 440, y: 832, h: 138},
        {t: 57.7, n: 'pose6', x: 450, y: 880, h: 118},
        {t: 58.2, n: 'pose8', x: 520, y: 925, h: 100},
      ]} />
    </Apt>
  );
};

// 74.57–78.83 darkness, phone flashlight from the hand toward the door
const ShotDark: React.FC<{t: number}> = ({t}) => {
  const sweep = Math.sin((t - 74.57) * 0.9) * 12;
  const hx = 300;
  const hy = 880;
  const h = HERO_H;
  const s = h / (qm as any).pose9.h;
  const W = (qm as any).pose9.w * s;
  // phone in pose9.png at (108,135); mirrored because he faces the door on the left
  const px = hx + W / 2 - 108 * s;
  const py = hy - h + 135 * s;
  // the phone's flashlight lights a patch of floor in front of the door
  const tx = 190 + sweep;
  const ty = 850;
  const cam = {cx: 300, cy: 720, z: 1.25};
  return (
    <AbsoluteFill>
      <Apt {...cam} img={aptImg()} filter="brightness(0.2) saturate(0.5) hue-rotate(-15deg)">
        <Barricaded />
        <Q n="pose9" x={hx} y={hy} h={h} flip />
      </Apt>
      <AbsoluteFill style={{mixBlendMode: 'screen'}}>
        <World src="" {...cam} noImg>
          <svg width={768} height={1376} style={{position: 'absolute', left: 0, top: 0}}>
            <defs>
              <linearGradient id="beam" x1={px} y1={py} x2={tx} y2={ty} gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="rgba(235,242,255,0.75)" />
                <stop offset="1" stopColor="rgba(235,242,255,0.08)" />
              </linearGradient>
            </defs>
            <polygon points={`${px},${py} ${tx - 50},${ty - 18} ${tx + 45},${ty + 22}`} fill="url(#beam)" />
          </svg>
          <div style={{position: 'absolute', left: tx - 55, top: ty - 24, width: 110, height: 48, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(235,242,255,0.75) 0%, rgba(235,242,255,0.25) 55%, rgba(0,0,0,0) 72%)'}} />
          <Glow x={px} y={py} r={16} c="rgba(255,255,255,1)" />
          {/* the phone itself */}
          <div style={{position: 'absolute', left: px - 4, top: py - 7, width: 8, height: 14, borderRadius: 2, background: '#e9f0ff', transform: 'rotate(-20deg)'}} />
        </World>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 38.23–40.13 the door downstairs
const ShotLobby: React.FC<{t: number}> = ({t}) => {
  const fl = 0.75 + 0.25 * Math.sin(t * 9) * Math.sin(t * 4.3);
  return (
    <World src="lobby.jpg" cx={430} cy={700} z={0.98 + (t - 38.23) * 0.05}>
      <Glow x={520} y={820} r={170} c={`rgba(255,200,120,${0.35 * fl})`} />
    </World>
  );
};

// 40.9–42.1 sleeves down
const ShotSleeves: React.FC<{t: number}> = ({t}) => {
  const k = lerp(t, [40.9, 41.2], [0, 1], Easing.out(Easing.cubic));
  const tug = t > 41.24 && t < 41.6 ? Math.sin(((t - 41.24) / 0.36) * Math.PI) : 0;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(160deg,#5a3f3a,#2e2230 70%)', overflow: 'hidden'}}>
      <Q n="arm" x={330 - (1 - k) * 300 - tug * 18} y={820 + tug * 6} w={900} rot={-tug * 2} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 53.47–56.5 grey flashback: the neighbour at the march
const ShotFlashback: React.FC<{t: number}> = ({t}) => {
  const k = t - 53.47;
  const ring = lerp(t, [54.2, 54.9], [0, 1], Easing.inOut(Easing.quad));
  const flick = 0.9 + 0.1 * Math.sin(t * 47);
  return (
    <AbsoluteFill style={{filter: `grayscale(1) brightness(${0.75 * flick}) contrast(1.15)`, overflow: 'hidden'}}>
      <Img src={staticFile('bg1.jpg')} style={{position: 'absolute', left: -200 - k * 10, top: -480, width: 1008, height: 1806}} />
      <Banner x={30 + k * 8} y={640} sway={Math.sin(t * 4) * 1.5} />
      <Sign x={170 + k * 8} y={880} text="ON LÂCHE RIEN" rot={Math.sin(t * 5) * 3} />
      {[30, 160, 280, 420].map((x, i) => (
        <Img key={x} src={staticFile(`p/crowd${[0, 1, 3, 0][i]}.png`)} style={{position: 'absolute', left: x + k * 14, top: 870 + (i % 2) * 30, height: 420, filter: 'brightness(0.7)'}} />
      ))}
    </AbsoluteFill>
  );
};
// the neighbour keeps her colour inside the grey memory
const FlashbackWoman: React.FC<{t: number}> = ({t}) => {
  if (t < 53.47 || t >= 56.5) return null;
  const k = t - 53.47;
  return <Img src={staticFile('p/crowd2.png')} style={{position: 'absolute', left: 400 + k * 6, top: 860, height: 470, filter: 'saturate(1.1) brightness(0.95)'}} />;
};
const FlashbackMarks: React.FC<{t: number}> = ({t}) => {
  if (t < 54.1 || t > 56.5) return null;
  const k = t - 53.47;
  return (
    <AbsoluteFill>
      <svg width={720} height={1280} style={{position: 'absolute', left: k * 6, top: 0}}>
        <Stroke t={t} t0={54.1} t1={54.7} d="M500 880 C610 870 620 1060 590 1200 C570 1330 410 1330 395 1180 C380 1040 410 900 530 875" c="#e0262e" w={5} />
      </svg>
      <Hand t={t} t0={54.6} t1={55.0} x={360 + k * 6} y={790} size={40} color="#e0262e" rot={-6}>SRA. ROUX</Hand>
      <Hand t={t} t0={54.9} t1={55.2} x={390 + k * 6} y={838} size={24} color="#e0262e" rot={-6}>6º ANDAR</Hand>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- facade (image 17B)
const Facade: React.FC<{t: number; cx: number; cy: number; z: number; dark?: number; children?: React.ReactNode; front?: React.ReactNode}> = ({cx, cy, z, dark = 0, children, front}) => (
  <World src={dark > 0.5 ? 'facade_dark.jpg' : 'facade.jpg'} cx={cx} cy={cy} z={z}>
    {children}
    <Img src={staticFile('q/rail.png')} style={{position: 'absolute', left: 40, top: 735}} />
    <Img src={staticFile('q/rail2.png')} style={{position: 'absolute', left: 420, top: 735}} />
    {front}
  </World>
);

// 60.73–64.77 the cat on the ledge
const ShotLedge: React.FC<{t: number}> = ({t}) => {
  const k = lerp(t, [60.8, 64.0], [0, 1], Easing.linear);
  const x = 300 + k * 230;
  const step = Math.abs(Math.sin(t * 6)) * 2;
  return (
    <Facade t={t} cx={330 + k * 110} cy={820} z={1.2}>
      {t < 64.0 && <Q n="cat3" x={x} y={928 - step} h={46} sq={1 + step * 0.01} />}
    </Facade>
  );
};

// 64.77–74.57 you lean out, then the power goes out
const ShotLean: React.FC<{t: number}> = ({t}) => {
  const reach = Math.sin((t - 64.77) * 1.4) * 1.5;
  const flick = t > 71.9 && t < 72.27 ? (Math.sin(t * 90) > 0 ? 0.8 : 0) : 0;
  const dark = t >= 72.27 ? 1 : flick;
  const push = lerp(t, [68.8, 70.5], [0, 1]);
  return (
    <Facade t={t} cx={330 + push * 40} cy={770} z={1.3 + push * 0.1 + (t - 64.77) * 0.004} dark={dark}>
      <Q n="lean" x={230} y={905} h={300} rot={reach} filter={dark > 0.5 ? 'brightness(0.3) saturate(0.6)' : undefined} />
    </Facade>
  );
};

// ---------------------------------------------------------------- 78.83–86.6 hand on the knob, the question, the end card
const ShotKnob: React.FC<{t: number}> = ({t}) => {
  const k = lerp(t, [79.0, 79.8], [0, 1], Easing.out(Easing.cubic));
  const twist = lerp(t, [82.5, 83.2], [0, 1]) * -6;
  const z = 1.0 + (t - 78.83) * 0.015;
  const m = (qm as any).hand;
  const s = 0.75;
  // the grip of hand_noknob.png (where its own knob was) is about (235,195); door knob at (428,658)
  const hx = 428 - 235 * s + (1 - k) * 260;
  const hy = 658 - 195 * s + (1 - k) * 420;
  return (
    <World src="door.jpg" cx={420} cy={660} z={z}>
      <Img src={staticFile('q/hand_noknob.png')} style={{position: 'absolute', left: hx, top: hy, width: m.w * s, height: m.h * s, transformOrigin: `${235 * s}px ${195 * s}px`, transform: `rotate(${twist}deg)`}} />
    </World>
  );
};

const Question: React.FC<{t: number}> = ({t}) => {
  if (t < 79.5) return null;
  const ws: [string, number][] = [['VOCÊ', 79.56], ['VAI', 79.9], ['BUSCAR', 80.1], ['ELE?', 80.42]];
  const o = 1 - lerp(t, [84.0, 84.4], [0, 1]);
  return (
    <div style={{position: 'absolute', top: 400, width: '100%', textAlign: 'center', fontFamily: MARKER, fontSize: 64, lineHeight: 1.05, color: '#fff', transform: 'rotate(-4deg)', textShadow: '0 4px 14px rgba(0,0,0,0.7)', opacity: o}}>
      {ws.slice(0, 2).map(([w, s]) => <span key={w} style={{opacity: t >= s ? 1 : 0, marginRight: 18}}>{w}</span>)}
      <br />
      {ws.slice(2).map(([w, s]) => <span key={w} style={{opacity: t >= s ? 1 : 0, marginRight: 18}}>{w}</span>)}
    </div>
  );
};

const EndCard: React.FC<{t: number}> = ({t}) => {
  if (t < 83.9) return null;
  const o = lerp(t, [83.9, 84.5], [0, 0.88]);
  const b1 = lerp(t, [85.1, 85.4], [0, 1], Easing.out(Easing.back(1.8)));
  const b2 = lerp(t, [85.4, 85.7], [0, 1], Easing.out(Easing.back(1.8)));
  const Btn: React.FC<{n: string; label: string; k: number; y: number; rot: number}> = ({n, label, k, y, rot}) => (
    <div style={{position: 'absolute', left: 80, top: y, width: 560, height: 112, background: '#f4f1ea', borderRadius: 10, boxShadow: '0 6px 0 rgba(0,0,0,0.35)', transform: `rotate(${rot}deg) scale(${k})`, opacity: k > 0 ? 1 : 0, display: 'flex', alignItems: 'center', fontFamily: MARKER, fontSize: 44, color: '#1d1a2a'}}>
      <div style={{width: 62, height: 62, borderRadius: '50%', border: '4px solid #d0303a', margin: '0 20px 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36}}>{n}</div>
      {label}
    </div>
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: '#0c0a10', opacity: o}} />
      <AbsoluteFill style={{opacity: lerp(t, [84.1, 84.6], [0, 1])}}>
        <div style={{position: 'absolute', top: 280, width: '100%', textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 170, color: '#fff', letterSpacing: -3}}>DIA 1</div>
        <div style={{position: 'absolute', top: 500, width: '100%', textAlign: 'center', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 25, color: '#f5a623', letterSpacing: 1}}>A HISTÓRIA CONTINUA AMANHÃ</div>
        <div style={{position: 'absolute', top: 545, width: '100%', textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 36, color: '#fff'}}>SIGA PARA VER O DIA 2</div>
      </AbsoluteFill>
      <Btn n="1" label="EU VOU BUSCAR" k={b1} y={660} rot={-2} />
      <Btn n="2" label="EU FICO EM CASA" k={b2} y={810} rot={-1} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- timeline
const SHOTS: [number, React.FC<{t: number}>][] = [
  [0, ShotMarch], [5, ShotGas], [13.9, ShotRun], [14.6, ShotKeypad], [15.5, ShotLock], [20.3, ShotAlarm], [21.93, ShotStreet], [27.0, ShotBackHead],
  [29.43, ShotNotebookClosed], [32.6, ShotUnplug], [34.3, PageSilence], [37.03, ShotBarricade], [38.23, ShotLobby], [40.13, PageThree],
  [40.9, ShotSleeves], [42.1, ShotBag], [43.27, PageShoes], [46.03, ShotSit], [53.47, ShotFlashback], [56.5, ShotBolt],
  [60.73, ShotLedge], [64.77, ShotLean], [74.57, ShotDark], [78.83, ShotKnob],
];

export const ParisFull: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const Shot = [...SHOTS].reverse().find((s) => s[0] <= t)![1];
  const darkCut = interpolate(t, [4.9, 5.0, 5.001, 5.12], [0, 1, 1, 0], clamp);
  const white = interpolate(t, [13.55, 13.9, 13.901, 14.25], [0, 1, 1, 0], clamp);
  const fbIn = interpolate(t, [53.3, 53.47, 53.471, 53.7], [0, 1, 1, 0], clamp) + interpolate(t, [56.35, 56.5, 56.501, 56.7], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{background: '#120e17'}}>
      <Shot t={t} />
      <FlashbackWoman t={t} />
      <FlashbackMarks t={t} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(8,6,12,0.6) 100%)'}} />
      <AbsoluteFill style={{background: '#0c0a10', opacity: darkCut}} />
      <AbsoluteFill style={{background: '#f2f0f6', opacity: white + fbIn * 0.8}} />
      <Question t={t} />
      <EndCard t={t} />
      <Hud t={t} />
      <Captions t={t} />
      <Audio src={staticFile('audio_full.m4a')} />
    </AbsoluteFill>
  );
};
