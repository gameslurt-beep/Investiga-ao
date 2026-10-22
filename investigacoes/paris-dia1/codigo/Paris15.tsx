import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import '@fontsource/montserrat/800.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/permanent-marker/400.css';
import words from './words15.json';
import meta from './pmeta.json';

const FPS = 30;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lerp = (t: number, a: number[], b: number[], ease = Easing.inOut(Easing.cubic)) => interpolate(t, a, b, {...clamp, easing: ease});

// ---------------------------------------------------------------- puppet rig
type Pose = {lean: number; sF: number; eF: number; sB: number; eB: number; hF: number; kF: number; hB: number; kB: number; bob: number};
const STAND: Pose = {lean: 0, sF: 4, eF: -6, sB: -4, eB: -6, hF: 0, kF: 2, hB: 0, kB: 2, bob: 0};

const walkPose = (ph: number, amp = 1): Pose => {
  const s = Math.sin(ph);
  return {
    lean: 2 * amp,
    hF: -24 * s * amp, hB: 24 * s * amp,
    kF: (6 + 30 * Math.max(0, Math.cos(ph))) * amp, kB: (6 + 30 * Math.max(0, -Math.cos(ph))) * amp,
    sF: 20 * s * amp, sB: -20 * s * amp, eF: -18 * amp, eB: -18 * amp,
    bob: -5 * Math.abs(Math.cos(ph)) * amp,
  };
};
const runPose = (ph: number): Pose => {
  const s = Math.sin(ph);
  return {
    lean: 14,
    hF: -48 * s, hB: 48 * s,
    kF: 20 + 70 * Math.max(0, Math.cos(ph)), kB: 20 + 70 * Math.max(0, -Math.cos(ph)),
    sF: 55 * s, sB: -55 * s, eF: -85, eB: -85,
    bob: -14 * Math.abs(Math.cos(ph)),
  };
};
const mixPose = (a: Pose, b: Pose, t: number): Pose => {
  const o = {} as Pose;
  (Object.keys(a) as (keyof Pose)[]).forEach((k) => (o[k] = a[k] + (b[k] - a[k]) * t));
  return o;
};

const P = (rig: string, part: string) => staticFile(`p/${rig}_${part}.png`);
// pivot data measured from the cut-out parts
const PIV = {uarm: {cx: 32, r: 30, end: 185}, farm: {cx: 31, r: 30}, thigh: {cx: 58, r: 50, end: 236}, leg: {cx: 50, r: 38}};

const Limb: React.FC<{rig: string; upper: 'uarm' | 'thigh'; lower: 'farm' | 'leg'; a1: number; a2: number; dark?: boolean}> = ({rig, upper, lower, a1, a2, dark}) => {
  const u = PIV[upper];
  const l = PIV[lower];
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transform: `rotate(${a1}deg)`, transformOrigin: '0 0', filter: dark ? 'brightness(0.72)' : undefined}}>
      <Img src={P(rig, upper)} style={{position: 'absolute', left: -u.cx, top: -u.r}} />
      <div style={{position: 'absolute', left: 0, top: u.end, transform: `rotate(${a2}deg)`, transformOrigin: '0 0'}}>
        <Img src={P(rig, lower)} style={{position: 'absolute', left: -l.cx, top: -l.r}} />
      </div>
    </div>
  );
};

// x,y = feet on the ground
const Puppet: React.FC<{rig: 'hero' | 'prot'; x: number; y: number; s: number; pose: Pose; flip?: boolean}> = ({rig, x, y, s, pose, flip}) => {
  const t = (meta as any)[rig].torso;
  const legLen = PIV.thigh.end + 268; // hip to sole
  const sh = [t.shoulder[0] - t.hip[0], t.shoulder[1] - t.hip[1]];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `scale(${flip ? -s : s},${s})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: 0, top: -legLen + pose.bob}}>
        <Limb rig={rig} upper="thigh" lower="leg" a1={pose.hB} a2={pose.kB} dark />
        <div style={{position: 'absolute', left: 0, top: 0, transform: `rotate(${pose.lean}deg)`, transformOrigin: '0 0'}}>
          <div style={{position: 'absolute', left: sh[0], top: sh[1]}}>
            <Limb rig={rig} upper="uarm" lower="farm" a1={pose.sB} a2={pose.eB} dark />
          </div>
          <Img src={P(rig, 'torso')} style={{position: 'absolute', left: -t.hip[0], top: -t.hip[1]}} />
        </div>
        <Limb rig={rig} upper="thigh" lower="leg" a1={pose.hF} a2={pose.kF} />
        <div style={{position: 'absolute', left: 0, top: 0, transform: `rotate(${pose.lean}deg)`, transformOrigin: '0 0'}}>
          <div style={{position: 'absolute', left: sh[0], top: sh[1]}}>
            <Limb rig={rig} upper="uarm" lower="farm" a1={pose.sF} a2={pose.eF} />
          </div>
        </div>
      </div>
    </div>
  );
};

// a whole-body cut-out (crowd, police) standing on x,y, swaying a little
const Figure: React.FC<{src: string; x: number; y: number; h: number; sway: number; dark?: number; flip?: boolean; children?: React.ReactNode}> = ({src, x, y, h, sway, dark = 1, flip, children}) => {
  const m = (meta as any)[src];
  const s = h / m.h;
  return (
    <div style={{position: 'absolute', left: x - (m.w * s) / 2, top: y - h, width: m.w * s, height: h, transform: `rotate(${sway}deg) scaleX(${flip ? -1 : 1})`, transformOrigin: '50% 100%', filter: `brightness(${dark})`}}>
      <Img src={staticFile(`p/${src}.png`)} style={{width: '100%', height: '100%'}} />
      {children}
    </div>
  );
};

// ---------------------------------------------------------------- background with camera
const Bg: React.FC<{src: string; z: number; tx: number; ty: number; tint?: string}> = ({src, z, tx, ty, tint}) => (
  <AbsoluteFill style={{overflow: 'hidden'}}>
    <Img src={staticFile(src)} style={{position: 'absolute', left: tx, top: ty, width: 720 * z, height: 1290 * z}} />
    {tint && <AbsoluteFill style={{background: tint}} />}
  </AbsoluteFill>
);

const Sign: React.FC<{x: number; y: number; text: string; rot: number}> = ({x, y, text, rot}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg)`, transformOrigin: '50% 100%'}}>
    <div style={{position: 'absolute', left: 52, top: 60, width: 6, height: 120, background: '#3a2a22'}} />
    <div style={{position: 'relative', width: 110, padding: '8px 6px', background: '#e9d9b8', color: '#2b2230', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 17, lineHeight: 1.05, textAlign: 'center', boxShadow: '0 3px 0 #b9a582'}}>
      {text}
    </div>
  </div>
);

const Banner: React.FC<{x: number; y: number; sway: number}> = ({x, y, sway}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${sway}deg)`, transformOrigin: '50% 100%'}}>
    <div style={{position: 'absolute', left: 6, top: 70, width: 6, height: 170, background: '#2a1d18'}} />
    <div style={{position: 'absolute', left: 300, top: -10, width: 6, height: 250, background: '#2a1d18'}} />
    <div style={{position: 'relative', width: 310, height: 100, background: 'linear-gradient(90deg,#efe7da,#e2d8c8 50%,#efe7da)', textAlign: 'center', boxShadow: '0 4px 0 rgba(0,0,0,0.25)'}}>
      <div style={{fontFamily: 'Permanent Marker', color: '#c8262b', fontSize: 46, paddingTop: 6, lineHeight: 1}}>THE MARCH</div>
      <div style={{fontFamily: 'JetBrains Mono', color: '#3a3040', fontSize: 13, marginTop: 6, letterSpacing: 1}}>PARIS · 17.10</div>
    </div>
  </div>
);

// soft smoke puff
const Smoke: React.FC<{x: number; y: number; r: number; o: number}> = ({x, y, r, o}) => (
  <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: 'radial-gradient(circle, rgba(235,232,240,0.95) 0%, rgba(220,216,228,0.6) 45%, rgba(220,216,228,0) 70%)', opacity: o, filter: 'blur(2px)'}} />
);

// ---------------------------------------------------------------- HUD
const BPM_KEYS: [number, number][] = [[5, 104], [7, 111], [9, 114], [10.5, 132], [11.5, 148], [13, 158], [14, 168], [15.3, 168]];
const bpmAt = (t: number) => interpolate(t, BPM_KEYS.map((k) => k[0]), BPM_KEYS.map((k) => k[1]), clamp);

const ecgPath = (t: number, bpm: number) => {
  const W = 256;
  const period = 60 * (78 / bpm);
  const scroll = t * 90;
  let d = 'M0 15';
  for (let x = 0; x <= W; x += 2) {
    const ph = ((x + scroll) % period) / period;
    let y = 15;
    if (ph > 0.42 && ph < 0.46) y = 13;
    else if (ph >= 0.5 && ph < 0.53) y = 1;
    else if (ph >= 0.53 && ph < 0.56) y = 20;
    d += ` L${x} ${y}`;
  }
  return d;
};

const Hud: React.FC<{t: number; clock: string; place: string}> = ({t, clock, place}) => {
  const bpm = Math.round(bpmAt(t));
  const panic = bpm >= 140;
  const lit = Math.round((bpm / 180) * 16);
  const o = lerp(t, [5, 5.35], [0, 1]);
  const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * (bpm / 60))), 8);
  return (
    <div style={{position: 'absolute', left: 30, top: 130, width: 288, padding: '14px 16px 12px', background: 'rgba(24,21,38,0.58)', backdropFilter: 'blur(7px)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'JetBrains Mono', color: '#fff', opacity: o, transform: `translateY(${(1 - o) * -10}px)`}}>
      <div style={{position: 'absolute', left: -6, top: -6, width: 18, height: 18, borderLeft: '3px solid #f5a623', borderTop: '3px solid #f5a623'}} />
      <div style={{position: 'absolute', right: -6, bottom: -6, width: 18, height: 18, borderRight: '3px solid #f5a623', borderBottom: '3px solid #f5a623'}} />
      <div style={{fontSize: 15}}>
        <span style={{color: '#f5a623', fontWeight: 700}}>DAY 1</span>
        <span style={{color: '#b9b6c8', fontSize: 13}}> · SAT 17 OCT</span>
      </div>
      <div style={{fontSize: 44, fontWeight: 700, lineHeight: 1.1}}>
        {clock}<span style={{fontSize: 18, color: '#b9b6c8', marginLeft: 8}}>PM</span>
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
        <span style={{color: panic ? '#ef4444' : '#f5a623', fontWeight: 700, fontSize: 17}}>{panic ? 'PANIC' : 'TENSE'}</span>
      </div>
      <svg width={256} height={22} style={{display: 'block', marginTop: -6}}>
        <path d={ecgPath(t, bpm)} stroke={panic ? '#ffb4b4' : '#fff'} strokeWidth={1.5} fill="none" />
      </svg>
      <div style={{display: 'flex', gap: 3, marginTop: 4}}>
        {Array.from({length: 16}).map((_, i) => (
          <div key={i} style={{flex: 1, height: 9, borderRadius: 1, background: i >= lit ? 'rgba(255,255,255,0.12)' : i < 6 ? '#22c55e' : i < 10 ? '#f59e0b' : '#ef4444'}} />
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- captions (word by word, pages of up to 3 words)
type W = [string, number, number];
const PAGES: W[][] = (() => {
  const out: W[][] = [];
  let cur: W[] = [];
  (words as W[]).forEach((w) => {
    if (w[1] > 15.2) return;
    cur.push(w);
    if (cur.length === 3 || /[.,]$/.test(w[0])) {
      out.push(cur);
      cur = [];
    }
  });
  if (cur.length) out.push(cur);
  return out;
})();

const Captions: React.FC<{t: number}> = ({t}) => {
  const page = [...PAGES].reverse().find((p) => p[0][1] <= t + 0.02);
  if (!page) return null;
  const last = page[page.length - 1];
  if (t > last[2] + 0.5) return null;
  const pop = lerp(t, [page[0][1], page[0][1] + 0.12], [0.85, 1], Easing.out(Easing.back(2)));
  return (
    <div style={{position: 'absolute', top: 800, width: '100%', textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 46, color: '#fff', textShadow: '0 3px 10px rgba(0,0,0,0.85)', transform: `scale(${pop})`, padding: '0 30px', boxSizing: 'border-box'}}>
      {page.filter((w) => w[1] <= t + 0.02).map((w, i) => {
        const active = t >= w[1] && t < w[2] + 0.05;
        return (
          <span key={i} style={{color: active ? '#c7f13b' : '#fff', marginRight: 14}}>
            {w[0].replace(/[,.]$/, '').toUpperCase()}
          </span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- shots
const CROWD = Array.from({length: 14}).map((_, i) => ({src: `crowd${i % 4}`, x: -20 + i * 52 + (i % 3) * 9, row: i % 2, ph: i * 1.7}));

const ShotMarch: React.FC<{t: number}> = ({t}) => {
  const walking = lerp(t, [4.3, 4.9], [1, 0]);
  const march = interpolate(t, [0, 4.6], [0, 26], clamp);
  const z = interpolate(t, [0, 5], [1.4, 1.46], clamp);
  const flare = 0.75 + 0.25 * Math.sin(t * 13) * Math.sin(t * 7.3);
  return (
    <AbsoluteFill>
      <Bg src="bg1.jpg" z={z} tx={-144 - (z - 1.4) * 360} ty={-440 - (z - 1.4) * 900} />
      {/* back rows of the crowd */}
      {CROWD.map((c, i) => (
        <Figure key={i} src={c.src} x={c.x + march} y={c.row ? 1050 : 1010} h={c.row ? 230 : 200} dark={c.row ? 0.62 : 0.45}
          sway={walking * 2.2 * Math.sin(t * 6 + c.ph)} />
      ))}
      <Sign x={60 + march} y={770} text="ON LÂCHE RIEN" rot={walking * 3 * Math.sin(t * 5)} />
      <Sign x={420 + march} y={790} text="ON EST LÀ" rot={walking * 3 * Math.sin(t * 5 + 2)} />
      <Banner x={20 + march} y={640} sway={walking * 1.5 * Math.sin(t * 4)} />
      {/* police line on the right */}
      {[560, 625, 690].map((x, i) => (
        <Figure key={x} src="police" x={x} y={1150 + i * 6} h={370} dark={0.8} sway={0.6 * Math.sin(t * 2 + i)} />
      ))}
      {/* red flare glow */}
      <AbsoluteFill style={{background: `radial-gradient(circle at 18% 88%, rgba(255,60,40,${0.45 * flare}) 0%, rgba(255,60,40,0) 45%)`, mixBlendMode: 'screen'}} />
      {/* foreground marchers */}
      <Puppet rig="prot" x={120 + march * 1.4} y={1240} s={0.42} pose={mixPose(STAND, walkPose(t * 7.5 + 1), walking)} />
      <Puppet rig="hero" x={330 + march * 1.4} y={1200} s={0.37} pose={mixPose(STAND, walkPose(t * 7.5), walking)} />
    </AbsoluteFill>
  );
};

const ShotGas: React.FC<{t: number}> = ({t}) => {
  const z = interpolate(t, [5, 14], [1.6, 1.7], clamp);
  // canister 1 flies into the crowd, canister 2 lands at your feet
  const c1 = interpolate(t, [6.3, 7.2], [0, 1], clamp);
  const c2 = interpolate(t, [9.9, 10.6], [0, 1], clamp);
  const arc = (k: number, x0: number, y0: number, x1: number, y1: number, hgt: number) => [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * hgt];
  const [ax, ay] = arc(c1, 600, 880, 160, 1020, 260);
  const [bx, by] = arc(c2, 600, 880, 360, 1210, 220);
  const cough = t > 8.75 && t < 9.5 ? Math.abs(Math.sin((t - 8.75) * 18)) : 0;
  const rub = lerp(t, [11.7, 12.0], [0, 1]) * (1 - lerp(t, [12.5, 12.7], [0, 1]));
  const flee = lerp(t, [12.7, 13.0], [0, 1]);
  const heroX = 300 - interpolate(t, [12.8, 14], [0, 420], {...clamp, easing: Easing.in(Easing.quad)});
  let pose = mixPose(STAND, {...STAND, lean: 22, sF: -30, eF: -40, bob: 6}, cough);
  pose = mixPose(pose, {...STAND, lean: 10, sF: -140, eF: -95, sB: -120, eB: -100}, rub);
  pose = mixPose(pose, runPose(t * 14), flee);
  const fog = lerp(t, [10.6, 13.8], [0, 1], Easing.out(Easing.quad));
  return (
    <AbsoluteFill>
      <Bg src="bg1.jpg" z={z} tx={-216 - (z - 1.6) * 360} ty={-560 - (z - 1.6) * 900} tint="rgba(40,36,90,0.35)" />
      {CROWD.slice(0, 9).map((c, i) => (
        <Figure key={i} src={c.src} x={c.x * 0.8 - 10} y={c.row ? 1070 : 1030} h={c.row ? 260 : 230} dark={c.row ? 0.5 : 0.38} sway={0} />
      ))}
      {[470, 545, 620, 695].map((x, i) => (
        <Figure key={x} src="police" x={x} y={1170 + (i % 2) * 8} h={420} dark={0.85} sway={0.5 * Math.sin(t * 2 + i)}>
          <div style={{position: 'absolute', left: '6%', top: '38%', width: '30%', textAlign: 'center', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 11, color: 'rgba(255,255,255,0.85)'}}>POLICE</div>
        </Figure>
      ))}
      {/* canisters with smoke trails */}
      {c1 > 0 && c1 < 1 && <div style={{position: 'absolute', left: ax - 6, top: ay - 6, width: 12, height: 12, borderRadius: 3, background: '#3a3a44'}} />}
      {c2 > 0 && <div style={{position: 'absolute', left: bx - 6, top: by - 6, width: 12, height: 12, borderRadius: 3, background: '#3a3a44'}} />}
      {Array.from({length: 10}).map((_, i) => {
        const k = c1 - i * 0.06;
        if (k <= 0 || c1 >= 1) return null;
        const [sx, sy] = arc(k, 600, 880, 160, 1020, 260);
        return <Smoke key={`a${i}`} x={sx} y={sy} r={8 + i * 2} o={0.5 - i * 0.04} />;
      })}
      {Array.from({length: 10}).map((_, i) => {
        const k = c2 - i * 0.06;
        if (k <= 0 || c2 >= 1) return null;
        const [sx, sy] = arc(k, 600, 880, 360, 1210, 220);
        return <Smoke key={`b${i}`} x={sx} y={sy} r={8 + i * 2} o={0.5 - i * 0.04} />;
      })}
      {/* smoke clouds where they landed */}
      {c1 >= 1 && Array.from({length: 6}).map((_, i) => {
        const age = t - 7.2;
        return <Smoke key={`p${i}`} x={160 + (i - 2.5) * 40 + age * 8 * (i - 2.5)} y={1000 - age * 18 - (i % 3) * 25} r={40 + age * 22} o={Math.max(0, 0.75 - age * 0.06)} />;
      })}
      <Puppet rig="hero" x={heroX} y={1210} s={0.4} pose={pose} />
      {c2 >= 1 && Array.from({length: 8}).map((_, i) => {
        const age = t - 10.6;
        return <Smoke key={`q${i}`} x={360 + (i - 3.5) * 50 + age * 14 * (i - 3.5)} y={1200 - age * 30 - (i % 3) * 30} r={50 + age * 45} o={Math.min(0.9, 0.4 + age * 0.2)} />;
      })}
      <AbsoluteFill style={{background: `linear-gradient(to top, rgba(230,228,238,${0.85 * fog}) 0%, rgba(230,228,238,${0.5 * fog}) 45%, rgba(230,228,238,0) 75%)`}} />
    </AbsoluteFill>
  );
};

const ShotRun: React.FC<{t: number}> = ({t}) => {
  const k = t - 13.9;
  return (
    <AbsoluteFill>
      <Bg src="bg2.jpg" z={1.4} tx={-144 - k * 30} ty={-470} />
      {Array.from({length: 7}).map((_, i) => {
        const y = 560 + i * 85;
        const x = ((i * 173 - k * 900) % 900 + 900) % 900 - 100;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 120, height: 2, background: 'rgba(255,255,255,0.35)'}} />;
      })}
      <Puppet rig="hero" x={140 + k * 230} y={1180} s={0.4} pose={runPose(t * 14)} />
    </AbsoluteFill>
  );
};

export const Paris15: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const darkCut = interpolate(t, [4.9, 5.0, 5.001, 5.12], [0, 1, 1, 0], clamp);
  const white = interpolate(t, [13.55, 13.9, 13.901, 14.25], [0, 1, 1, 0], clamp);
  const clock = t < 7.5 ? '10:12' : t < 13.9 ? '10:13' : '10:20';
  const place = t < 13.9 ? 'BD DE CLICHY' : 'RUE LEPIC';
  return (
    <AbsoluteFill style={{background: '#120e17'}}>
      {t < 5 && <ShotMarch t={t} />}
      {t >= 5 && t < 13.9 && <ShotGas t={t} />}
      {t >= 13.9 && <ShotRun t={t} />}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(8,6,12,0.6) 100%)'}} />
      <AbsoluteFill style={{background: '#0c0a10', opacity: darkCut}} />
      <AbsoluteFill style={{background: '#f2f0f6', opacity: white}} />
      <Hud t={t} clock={clock} place={place} />
      <Captions t={t} />
      <Audio src={staticFile('audio15.m4a')} />
    </AbsoluteFill>
  );
};
