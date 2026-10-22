import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, random, delayRender, continueRender} from 'remotion';
import TLraw from './timeline.json';
import QMraw from './qmeta.json';

// ---------- dados ----------
type Tok = {t: string; s: number; e: number};
type Line = {id: string; s: number; e: number; toks: Tok[]};
const TLd: any = TLraw;
const QM: any = QMraw;
const L: Record<string, Line> = {};
TLd.lines.forEach((l: Line) => {
	L[l.id] = l;
});
export const TOTAL: number = TLd.total;
const T = (id: string) => L[id].s;
const E = (id: string) => L[id].e;
const Wd = (id: string, k: number) => L[id].toks[Math.min(k, L[id].toks.length - 1)];

// ---------- utilidades ----------
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (x: number) => {
	x = clamp(x);
	return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const kf = (t: number, k: number[][]) => {
	if (t <= k[0][0]) return k[0][1];
	for (let i = 0; i < k.length - 1; i++) {
		const a = k[i];
		const b = k[i + 1];
		if (t <= b[0]) return lerp(a[1], b[1], sm((t - a[0]) / (b[0] - a[0])));
	}
	return k[k.length - 1][1];
};
const nz = (t: number, s: number) => Math.sin(t * 1.7 + s) * 0.5 + Math.sin(t * 2.9 + s * 2.3) * 0.3 + Math.sin(t * 5.3 + s * 0.7) * 0.2;
const bump = (x: number, w: number) => (x < 0 || x > w ? 0 : Math.sin((Math.PI * x) / w));
const A = (n: string) => staticFile('a/' + n);
const Qs = (n: string) => staticFile('q/' + n + '.png');

// ---------- fontes ----------
const fontCss = `
@font-face{font-family:'MS';font-weight:500;src:url(${staticFile('fonts/montserrat-latin-500-normal.woff2')}) format('woff2');}
@font-face{font-family:'MS';font-weight:700;src:url(${staticFile('fonts/montserrat-latin-700-normal.woff2')}) format('woff2');}
@font-face{font-family:'MS';font-weight:900;src:url(${staticFile('fonts/montserrat-latin-900-normal.woff2')}) format('woff2');}
@font-face{font-family:'Hand';font-weight:700;src:url(${staticFile('fonts/caveat-latin-700-normal.woff2')}) format('woff2');}
@font-face{font-family:'Mono';src:url(${staticFile('fonts/share-tech-mono-latin-400-normal.woff2')}) format('woff2');}
`;
const Fonts: React.FC = () => {
	const [h] = React.useState(() => delayRender('fonts'));
	React.useEffect(() => {
		Promise.all(['500 20px MS', '700 20px MS', '900 20px MS', '700 20px Hand', '20px Mono'].map((f) => document.fonts.load(f)))
			.then(() => continueRender(h))
			.catch(() => continueRender(h));
	}, [h]);
	return <style>{fontCss}</style>;
};

// ---------- mundo (imagem 768x1376 com câmera) ----------
const IW = 768;
const IH = 1376;
const BASE = 1080 / 768;
type Cam = {x: number; y: number; z: number; r?: number};
const camT = (c: Cam) => {
	const S = BASE * c.z;
	const hw = 540 / S;
	const hh = 960 / S;
	const x = clamp(c.x, hw, IW - hw);
	const y = clamp(c.y, hh, IH - hh);
	return {S, tx: 540 - x * S, ty: 960 - y * S};
};
const w2s = (c: Cam, x: number, y: number) => {
	const k = camT(c);
	return [k.tx + x * k.S, k.ty + y * k.S];
};
const s2w = (c: Cam, x: number, y: number) => {
	const k = camT(c);
	return [(x - k.tx) / k.S, (y - k.ty) / k.S];
};
const World: React.FC<{cam: Cam; children?: React.ReactNode; filter?: string}> = ({cam, children, filter}) => {
	const k = camT(cam);
	return (
		<AbsoluteFill style={{overflow: 'hidden', filter}}>
			<AbsoluteFill style={{transform: `rotate(${cam.r || 0}deg) scale(${1 + Math.abs(cam.r || 0) * 0.02})`}}>
				<div style={{position: 'absolute', left: 0, top: 0, width: IW, height: IH, transformOrigin: '0 0', transform: `translate(${k.tx}px,${k.ty}px) scale(${k.S})`}}>
					{children}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

type Spot = {x: number; y: number; r: number; a: number};
const grad = (s: Spot) =>
	`radial-gradient(circle ${s.r}px at ${s.x}px ${s.y}px, rgba(0,0,0,${s.a}) 0%, rgba(0,0,0,${s.a * 0.92}) 28%, rgba(0,0,0,${s.a * 0.5}) 60%, rgba(0,0,0,0) 100%)`;
const FULL: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: IW, height: IH};

// cômodo escuro + versão iluminada revelada pela lanterna
const Room: React.FC<{d: string; l: string; spot: Spot; amb?: number; dark?: number; extra?: Spot[]}> = ({d, l, spot, amb = 0, dark = 0.5, extra = []}) => {
	const spots = [spot, ...extra].filter((s) => s.a > 0.01);
	const m = spots.map(grad).join(',');
	return (
		<>
			<Img src={A(d)} style={{...FULL, filter: `brightness(${dark}) saturate(0.8)`}} />
			{amb > 0 && <Img src={A(l)} style={{...FULL, opacity: amb}} />}
			{spots.length > 0 && <Img src={A(l)} style={{...FULL, WebkitMaskImage: m, maskImage: m}} />}
			{spots.map((s, i) => (
				<div
					key={i}
					style={{...FULL, mixBlendMode: 'screen', background: `radial-gradient(circle ${s.r * 0.6}px at ${s.x}px ${s.y}px, rgba(255,205,140,${0.2 * s.a}) 0%, rgba(255,180,100,0) 100%)`}}
				/>
			))}
		</>
	);
};

// feixe volumétrico
const Cone: React.FC<{sx: number; sy: number; spot: Spot; w?: number; id: string}> = ({sx, sy, spot, w = 0.8, id}) => {
	const dx = spot.x - sx;
	const dy = spot.y - sy;
	const len = Math.hypot(dx, dy) || 1;
	const px = -dy / len;
	const py = dx / len;
	const R = spot.r * w;
	const pts = `${sx},${sy} ${spot.x + px * R},${spot.y + py * R} ${spot.x - px * R},${spot.y - py * R}`;
	return (
		<svg width={IW} height={IH} style={{...FULL, mixBlendMode: 'screen', filter: 'blur(14px)', opacity: spot.a * 0.65}}>
			<defs>
				<linearGradient id={id} gradientUnits="userSpaceOnUse" x1={sx} y1={sy} x2={spot.x} y2={spot.y}>
					<stop offset="0" stopColor="rgb(255,220,170)" stopOpacity="0.34" />
					<stop offset="1" stopColor="rgb(255,200,140)" stopOpacity="0.05" />
				</linearGradient>
			</defs>
			<polygon points={pts} fill={`url(#${id})`} />
		</svg>
	);
};

// poeira no feixe
const Dust: React.FC<{t: number; spot: Spot; n?: number; seed?: string}> = ({t, spot, n = 46, seed = 'd'}) => {
	const ps: React.ReactNode[] = [];
	for (let i = 0; i < n; i++) {
		const bx = spot.x + (random(seed + 'x' + i) - 0.5) * spot.r * 2.2;
		const by = spot.y + (random(seed + 'y' + i) - 0.5) * spot.r * 2.2;
		const x = bx + Math.sin(t * 0.6 + i) * 14 + t * (random(seed + 'v' + i) - 0.5) * 10;
		const y = by + Math.cos(t * 0.45 + i * 1.3) * 16 - t * 3;
		const d = Math.hypot(x - spot.x, y - spot.y) / spot.r;
		const o = clamp(1 - d) * spot.a * (0.25 + 0.75 * random(seed + 'o' + i)) * (0.6 + 0.4 * Math.sin(t * 2 + i));
		if (o < 0.03) continue;
		const s = 0.8 + random(seed + 's' + i) * 2;
		ps.push(
			<div
				key={i}
				style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: `rgba(255,232,190,${o})`, boxShadow: `0 0 ${s * 3}px rgba(255,210,150,${o})`}}
			/>
		);
	}
	return <>{ps}</>;
};

// ---------- camadas de tela ----------
const Grain: React.FC<{f: number; o?: number}> = ({f, o = 0.13}) => {
	const ox = Math.floor(random('gx' + f) * 60);
	const oy = Math.floor(random('gy' + f) * 60);
	return (
		<AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
			<Img src={A(`grain${f % 6}.png`)} style={{position: 'absolute', left: -ox, top: -oy, width: 1140, height: 1980, mixBlendMode: 'overlay', opacity: o}} />
		</AbsoluteFill>
	);
};
const Vig: React.FC<{o?: number}> = ({o = 0.85}) => (
	<AbsoluteFill style={{background: `radial-gradient(ellipse 78% 62% at 50% 47%, rgba(0,0,0,0) 42%, rgba(0,0,0,${o}) 100%)`}} />
);
const Black: React.FC<{o: number}> = ({o}) => (o > 0 ? <AbsoluteFill style={{background: '#000', opacity: o}} /> : null);

// ---------- boneco articulado (costas) ----------
const Part: React.FC<{n: string; at: number[]; pv: number[]; rot?: number; sx?: number; sy?: number; under?: React.ReactNode; over?: React.ReactNode}> = ({
	n,
	at,
	pv,
	rot = 0,
	sx = 1,
	sy = 1,
	under,
	over,
}) => {
	const m = QM[n];
	return (
		<div
			style={{position: 'absolute', left: at[0] - pv[0], top: at[1] - pv[1], width: m.w, height: m.h, transformOrigin: `${pv[0]}px ${pv[1]}px`, transform: `rotate(${rot}deg) scale(${sx},${sy})`}}
		>
			{under}
			<Img src={Qs(n)} style={{position: 'absolute', left: 0, top: 0, width: m.w, height: m.h}} />
			{over}
		</div>
	);
};
type PoseB = {bob: number; hipR: number; hipX: number; torR: number; hoodR: number; lTh: number; rTh: number; lLift: number; rLift: number; lArm: number; lFore: number; rArm: number; rFore?: number; crouch: number};
const walkPose = (t: number, amp = 1, period = 1.15): PoseB => {
	const ph = (t * Math.PI * 2) / period;
	const s = Math.sin(ph);
	return {
		bob: -8 * Math.abs(Math.cos(ph)) * amp,
		hipR: 2.4 * s * amp,
		hipX: 5 * s * amp,
		torR: -1.6 * s * amp,
		hoodR: 1.2 * Math.sin(ph + 0.6) * amp,
		lTh: 3 * s * amp,
		rTh: -3 * s * amp,
		lLift: Math.max(0, s) * amp,
		rLift: Math.max(0, -s) * amp,
		lArm: -5 * s * amp,
		lFore: -4 * s * amp,
		rArm: 4 * s * amp,
		rFore: 3 * s * amp,
		crouch: 0,
	};
};
const idlePose = (t: number, crouch = 0): PoseB => ({
	bob: Math.sin(t * 2.2) * 2,
	hipR: 0,
	hipX: 0,
	torR: Math.sin(t * 1.3) * 0.6,
	hoodR: Math.sin(t * 1.1) * 0.8,
	lTh: 0,
	rTh: 0,
	lLift: 0,
	rLift: 0,
	lArm: Math.sin(t * 1.7) * 1.5 - crouch * 20,
	lFore: -crouch * 22,
	rArm: Math.sin(t * 1.5 + 1) * 1.2 + crouch * 18,
	rFore: crouch * 22,
	crouch,
});
// braços por baixo do tronco (o ombro do colete cobre a junta); antebraço e canela entram por baixo da peça de cima, com sobra, para não abrir fresta no cotovelo e no joelho
const BackPuppet: React.FC<{p: PoseB}> = ({p}) => {
	const c = p.crouch;
	const thSY = 1 - 0.62 * c;
	const aSY = 1 - 0.28 * c;
	const leg = (th: number, lift: number) => (
		<Part
			n="back10"
			at={[0, 0]}
			pv={[55, 14]}
			rot={14.3 + th}
			sy={thSY}
			under={<Part n="back11" at={[118, 254]} pv={[39, 14]} rot={-14.3 - th} sy={((1 - 0.17 * lift) * (1 - 0.45 * c)) / thSY} />}
		/>
	);
	return (
		<div style={{position: 'absolute', left: p.hipX, top: p.bob + c * 420, transform: `rotate(${p.hipR}deg)`}}>
			<div style={{position: 'absolute', left: -58, top: 70, width: 116, height: 150 - 90 * c, borderRadius: 40, background: '#1c2329'}} />
			<div style={{position: 'absolute', left: -48 - 14 * c, top: 106}}>{leg(p.lTh - 8 * c, p.lLift)}</div>
			<div style={{position: 'absolute', left: 50 + 14 * c, top: 106, transform: 'scaleX(-1)'}}>{leg(p.rTh - 8 * c, p.rLift)}</div>
			<Part n="back8" at={[0, 0]} pv={[101, 12]} sx={1 + 0.06 * c} />
			<Part
				n="back3"
				at={[0, 10]}
				pv={[136, 424]}
				rot={p.torR}
				sy={1 - 0.14 * c}
				under={
					<>
						<Part n="back2" at={[134, 26]} pv={[54, 54]} />
						<Part n="back5" at={[258, 100]} pv={[51, 16]} rot={-15 + p.rArm} sy={aSY} under={<Part n="back7" at={[36, 166]} pv={[39, 16]} rot={39 + (p.rFore ?? 0)} sy={1 - 0.1 * c} />} />
						<Part n="back4" at={[12, 100]} pv={[100, 18]} rot={-9 + p.lArm} sy={aSY} under={<Part n="back6" at={[45, 182]} pv={[37, 16]} rot={33 + p.lFore} sy={1 - 0.1 * c} />} />
					</>
				}
				over={<Part n="back0" at={[134, 52 + 26 * c]} pv={[80, 214]} rot={p.hoodR} sy={1 / (1 - 0.14 * c)} />}
			/>
		</div>
	);
};
const Pup: React.FC<{x: number; feet: number; s: number; p: PoseB; light?: number}> = ({x, feet, s, p, light = 0.55}) => (
	<div style={{position: 'absolute', left: x, top: feet - 625 * s, transform: `scale(${s})`, transformOrigin: '0 0', filter: `brightness(${light}) contrast(1.08) drop-shadow(0 0 8px rgba(255,180,110,0.25))`}}>
		<div style={{position: 'absolute', left: -170, top: 600, width: 340, height: 60, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 70%)'}} />
		<BackPuppet p={p} />
	</div>
);

// ---------- celular / câmera de segurança / notificação ----------
const CamIcon: React.FC<{s?: number}> = ({s = 56}) => (
	<svg width={s} height={s} viewBox="0 0 24 24">
		<path d="M4 7h10a2 2 0 0 1 2 2v1.6l4-2.6v8l-4-2.6V15a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" fill="#fff" />
	</svg>
);
const Notif: React.FC<{y: number; o: number; dx?: number; time?: string; w?: number}> = ({y, o, dx = 0, time = 'agora', w = 1000}) => (
	<div
		style={{
			position: 'absolute',
			left: (1080 - w) / 2 + dx,
			top: y,
			width: w,
			height: 170,
			borderRadius: 40,
			background: 'rgba(30,30,36,0.88)',
			opacity: o,
			boxShadow: '0 24px 70px rgba(0,0,0,.7), inset 0 0 0 1px rgba(255,255,255,0.08)',
			display: 'flex',
			alignItems: 'center',
			padding: '0 34px',
			boxSizing: 'border-box',
			fontFamily: 'MS',
		}}
	>
		<div style={{width: 100, height: 100, borderRadius: 26, background: 'linear-gradient(160deg,#ff5a5a,#a80f18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
			<CamIcon />
		</div>
		<div style={{marginLeft: 28, flex: 1, color: '#fff'}}>
			<div style={{fontWeight: 900, fontSize: 40, letterSpacing: 1}}>CAM 2 · CORREDOR</div>
			<div style={{fontWeight: 500, fontSize: 36, opacity: 0.85, marginTop: 6}}>
				<span style={{color: '#ff6b6b', fontWeight: 700}}>●</span> Movimento detectado
			</div>
		</div>
		<div style={{color: 'rgba(255,255,255,.6)', fontSize: 32, fontWeight: 500, alignSelf: 'flex-start', marginTop: 36}}>{time}</div>
	</div>
);

const clockStr = (base: number, t: number) => {
	const s = Math.floor(base + t);
	const hh = 23;
	const mm = Math.floor(s / 60) % 60;
	const ss = s % 60;
	return `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};
// tela de câmera de segurança em 1080x1920
const Cctv: React.FC<{src: string; t: number; f: number; zoom?: number; fx?: number; fy?: number; glitch?: number; blur?: number; label?: string; big?: boolean; noise?: number; pad?: number; padY?: number; topY?: number}> = ({
	src,
	t,
	f,
	zoom = 1.02,
	fx = 384,
	fy = 688,
	glitch = 0,
	blur = 0,
	label = 'CAM 2 · CORREDOR',
	big = false,
	noise = 0.3,
	pad = 54,
	padY = 70,
	topY,
}) => {
	const k = camT({x: fx, y: fy, z: zoom});
	const roll = (t * 90) % 1920;
	const img = (dx: number, extra?: React.CSSProperties, key?: string) => (
		<div
			key={key}
			style={{
				position: 'absolute',
				left: 0,
				top: 0,
				width: IW,
				height: IH,
				transformOrigin: '0 0',
				transform: `translate(${k.tx + dx}px,${k.ty}px) scale(${k.S})`,
				filter: `contrast(1.15) brightness(1.08) blur(${blur}px)`,
				...extra,
			}}
		>
			<Img src={A(src)} style={{width: IW, height: IH}} />
		</div>
	);
	const slices: React.ReactNode[] = [];
	if (glitch > 0.02) {
		for (let i = 0; i < 7; i++) {
			const y0 = random(`gy${f}-${i}`) * 1800;
			const hgt = 20 + random(`gh${f}-${i}`) * 140;
			const dx = (random(`gd${f}-${i}`) - 0.5) * 160 * glitch;
			slices.push(
				<div key={'s' + i} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, clipPath: `inset(${y0}px 0 ${Math.max(0, 1920 - y0 - hgt)}px 0)`}}>
					{img(dx)}
				</div>
			);
		}
	}
	const ts = big ? 1 : 2.4;
	return (
		<AbsoluteFill style={{background: '#010a03', overflow: 'hidden'}}>
			{img(0)}
			{glitch > 0.02 && img(14 * glitch, {mixBlendMode: 'screen', opacity: 0.55, filter: 'sepia(1) saturate(6) hue-rotate(-50deg) brightness(.7)'}, 'r')}
			{glitch > 0.02 && img(-14 * glitch, {mixBlendMode: 'screen', opacity: 0.45, filter: 'sepia(1) saturate(6) hue-rotate(140deg) brightness(.7)'}, 'c')}
			{slices}
			<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)'}} />
			<div style={{position: 'absolute', left: 0, top: roll - 120, width: 1080, height: 120, background: 'linear-gradient(180deg, rgba(150,255,170,0) 0%, rgba(150,255,170,0.07) 50%, rgba(150,255,170,0) 100%)'}} />
			<Grain f={f} o={noise} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 58% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)'}} />
			<div style={{position: 'absolute', left: pad, top: topY ?? padY, fontFamily: 'Mono', fontSize: 44 * ts, color: 'rgba(200,255,210,0.92)', letterSpacing: 2, textShadow: '0 0 10px rgba(120,255,150,.6)'}}>
				<span style={{color: '#ff3b3b', opacity: Math.floor(t * 2) % 2 ? 1 : 0.25}}>●</span> {big ? 'REC' : 'CAM 2'}
			</div>
			{big && <div style={{position: 'absolute', right: pad, top: padY, fontFamily: 'Mono', fontSize: 40 * ts, color: 'rgba(200,255,210,0.92)', letterSpacing: 2}}>{label}</div>}
			<div style={{position: 'absolute', right: pad, bottom: padY + 10, fontFamily: 'Mono', fontSize: 46 * ts, color: 'rgba(200,255,210,0.92)', letterSpacing: 3}}>{clockStr(41 * 60 + 2, t - 3)}</div>
		</AbsoluteFill>
	);
};
const Hud: React.FC<{src: string; t: number; f: number; app: number; alert?: number}> = ({src, t, f, app, alert = 0}) => {
	const sc = 0.255;
	if (app <= 0.01) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: 34,
				top: 70,
				width: 1080 * sc,
				height: 1920 * sc,
				borderRadius: 20,
				overflow: 'hidden',
				opacity: app,
				transform: `scale(${0.85 + 0.15 * app})`,
				transformOrigin: '0 0',
				boxShadow: `0 0 0 3px rgba(${alert > 0.05 ? '255,70,70' : '120,255,170'},${0.5 + 0.5 * alert}), 0 0 ${30 + 60 * alert}px rgba(${alert > 0.05 ? '255,60,60' : '80,255,140'},${0.25 + 0.5 * alert}), 0 14px 40px rgba(0,0,0,.7)`,
			}}
		>
			<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${sc})`, transformOrigin: '0 0'}}>
				<Cctv src={src} t={t} f={f} noise={0.35} />
			</div>
		</div>
	);
};
// mão com o celular virado para nós (h8_1), com a tela composta
const SCR = {cx: 131, cy: 113, w: 102, h: 217, ang: -9.8};
const Phone: React.FC<{cx: number; cy: number; s: number; rot?: number; children?: React.ReactNode; light?: number; glow?: string}> = ({cx, cy, s, rot = 0, children, light = 0.75, glow = 'rgba(150,255,190,0.16)'}) => {
	const m = QM.h8_1;
	const sw = SCR.w * s * 1.15;
	const sh = SCR.h * s * 1.1;
	return (
		<div style={{position: 'absolute', left: cx - SCR.cx * s, top: cy - SCR.cy * s, width: m.w * s, height: m.h * s, transformOrigin: `${SCR.cx * s}px ${SCR.cy * s}px`, transform: `rotate(${rot}deg)`}}>
			<Img src={Qs('h8_1')} style={{position: 'absolute', left: 0, top: 0, width: m.w * s, height: m.h * s, filter: `brightness(${light})`}} />
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					width: m.w * s,
					height: m.h * s,
					WebkitMaskImage: `url(${Qs('h8_1_scr')})`,
					maskImage: `url(${Qs('h8_1_scr')})`,
					WebkitMaskSize: '100% 100%',
					maskSize: '100% 100%',
				}}
			>
				<div style={{position: 'absolute', left: SCR.cx * s - sw / 2, top: SCR.cy * s - sh / 2, width: sw, height: sh, transform: `rotate(${SCR.ang}deg)`, overflow: 'hidden', background: '#000'}}>
					<div style={{position: 'absolute', left: (sw - (sh * 1080) / 1920) / 2, top: 0, width: 1080, height: 1920, transform: `scale(${sh / 1920})`, transformOrigin: '0 0'}}>{children}</div>
				</div>
			</div>
			<div style={{position: 'absolute', left: SCR.cx * s - 260, top: SCR.cy * s - 360, width: 520, height: 720, borderRadius: '50%', background: `radial-gradient(ellipse at center, ${glow} 0%, rgba(0,0,0,0) 70%)`, mixBlendMode: 'screen'}} />
		</div>
	);
};
// ponto da imagem do celular (h8_1) levado para a tela, com a mesma rotação do Phone
const phonePt = (cx: number, cy: number, s: number, rot: number, px: number, py: number) => {
	const a = (rot * Math.PI) / 180;
	const dx = (px - SCR.cx) * s;
	const dy = (py - SCR.cy) * s;
	return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
};
// tela do app de lanterna (1080x1920)
const TorchUI: React.FC<{on: number}> = ({on}) => (
	<AbsoluteFill style={{background: '#050608'}}>
		<div
			style={{
				position: 'absolute',
				left: 540 - 200,
				top: 960 - 200,
				width: 400,
				height: 400,
				borderRadius: '50%',
				background: on > 0.5 ? 'radial-gradient(circle, #ffffff 0%, #ececec 62%, #cfcfcf 100%)' : '#24262b',
				boxShadow: on > 0.5 ? '0 0 140px rgba(255,255,255,0.5)' : 'none',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<svg width={190} height={190} viewBox="0 0 24 24">
				<path d="M7.5 2h9v4l-2.5 4v11a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V10L7.5 6z" fill={on > 0.5 ? '#1b1b1d' : '#7d818b'} />
			</svg>
		</div>
	</AbsoluteFill>
);

// ---------- textos de cena ----------
const Rule: React.FC<{n: number; txt: string; t0: number; t: number; y: number; out: number}> = ({n, txt, t0, t, y, out}) => {
	const o = sm((t - t0) / 0.25) * (1 - sm((t - out) / 0.3));
	if (o <= 0) return null;
	return (
		<div style={{position: 'absolute', left: 70 + lerp(-50, 0, sm((t - t0) / 0.25)), top: y, opacity: o, display: 'flex', alignItems: 'center', fontFamily: 'MS'}}>
			<div
				style={{width: 78, height: 78, borderRadius: 39, border: '5px solid #ffb24a', color: '#ffb24a', fontWeight: 900, fontSize: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(255,170,70,.45)', background: 'rgba(0,0,0,.35)'}}
			>
				{n}
			</div>
			<div style={{marginLeft: 24, color: '#fff', fontWeight: 900, fontSize: 50, letterSpacing: 1, textShadow: '0 4px 22px rgba(0,0,0,1), 0 0 4px rgba(0,0,0,.9)'}}>{txt}</div>
		</div>
	);
};
const NAMES = ['Ana', 'Lucas', 'Júlia', 'Pedro', 'Maria', 'Rafael', 'Bia', 'João', 'Camila', 'Diego', 'Larissa', 'Gabriel', 'Sofia', 'Mateus', 'Helena', 'Bruno', 'Laura', 'Thiago'];

// ---------- cenas ----------
const B = {
	s1: T('n1') - 0.25,
	s2: T('n4') + 0.25,
	s3: T('n6') - 0.3,
	s4: T('n10') - 0.35,
	s5: T('n13') - 0.35,
	s6: T('n15') - 0.3,
	s7: T('n17') - 0.45,
	s8: T('n20') - 0.35,
	s9: T('n22') - 0.3,
	s10: T('n25') - 0.3,
	s11: E('n28') + 0.55,
	s12: T('n30') - 0.35,
	s13: T('n34') - 0.3,
	s14: E('n36') + 0.4,
};

// 0. gancho: tela preta + notificação
const S0 = (t: number) => {
	const nt = Wd('w0', 2).e + 0.1;
	const a = sm((t - nt) / 0.35);
	const vib = t > nt && t < nt + 1.05 ? Math.sin(t * 95) * 7 * (1 - (t - nt) / 1.05) : 0;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<AbsoluteFill style={{background: `radial-gradient(circle 760px at 50% 46%, rgba(40,60,95,${0.12 + 0.05 * Math.sin(t * 2)}) 0%, rgba(0,0,0,0) 100%)`}} />
			{t > nt - 0.05 && <Notif y={lerp(-220, 92, a)} o={a} dx={vib} time="23:41" />}
		</AbsoluteFill>
	);
};

// 1. entrada
const S1 = (t: number, f: number) => {
	const t0 = B.s1;
	const t1 = B.s2;
	const tk = T('n2') - 0.1;
	if (t < tk) {
		const m = QM.h8_3;
		const s = 3.0;
		const turn = sm((t - T('n1') - 1.6) / 0.7);
		const st = sm((t - T('n1')) / 0.4) * (1 - sm((t - tk + 0.5) / 0.4));
		return (
			<AbsoluteFill style={{background: '#000'}}>
				<World cam={{x: 262, y: 690, z: kf(t, [[t0, 2.5], [tk, 2.75]])}} filter="blur(4px) brightness(.42)">
					<Img src={A('ent_d.jpg')} style={FULL} />
				</World>
				<Img src={Qs('h8_3')} style={{position: 'absolute', left: 540 - (m.w * s) / 2 + 20, top: 1000 - (m.h * s) / 2, width: m.w * s, height: m.h * s, transformOrigin: '30% 40%', transform: `rotate(${-turn * 8}deg)`, filter: 'brightness(.55)'}} />
				<AbsoluteFill style={{mixBlendMode: 'screen', background: 'radial-gradient(circle 600px at 75% 15%, rgba(120,150,220,0.12) 0%, rgba(0,0,0,0) 100%)'}} />
				<Vig />
				{st > 0 && (
					<div style={{position: 'absolute', top: 250, width: 1080, textAlign: 'center', fontFamily: 'Mono', fontSize: 120, letterSpacing: 14, color: `rgba(235,240,255,${0.9 * st})`, textShadow: '0 0 30px rgba(120,160,255,.35)'}}>
						23:40
					</div>
				)}
			</AbsoluteFill>
		);
	}
	const tc = T('n3') + 0.35;
	const on = t < tc ? 0 : t < tc + 0.07 ? 0.7 : t < tc + 0.12 ? 0.2 : 1;
	const cam: Cam = {x: 280 + nz(t, 1) * 4, y: 720 + nz(t, 2) * 4, z: lerp(1.15, 1.36, sm((t - tk) / (t1 - tk))), r: nz(t * 0.7, 3) * 0.25};
	const sp: Spot = {x: kf(t, [[tc, 360], [tc + 1.3, 270], [t1, 250]]) + nz(t, 4) * 9, y: kf(t, [[tc, 1000], [tc + 1.3, 720], [t1, 700]]) + nz(t, 5) * 8, r: 300, a: on};
	const hIn = sm((t - (tc - 0.55)) / 0.45);
	const tv = T('n4') + 0.1;
	const vib = t > tv && t < tv + 1.05 ? Math.sin(t * 95) * 9 * (1 - (t - tv) / 1.05) : 0;
	const pc = {x: 650 + nz(t, 6) * 6 + vib, y: lerp(2350, 1640, hIn) + nz(t, 7) * 6, s: 2.3, r: -8 + nz(t, 8) * 2 + vib * 0.25};
	const lens = phonePt(pc.x, pc.y, pc.s, pc.r, 118, 2);
	const src = s2w(cam, lens[0], lens[1]);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<World cam={cam}>
				<Room d="ent_d.jpg" l="ent_l.jpg" spot={sp} dark={0.42} />
				{on > 0 && <Cone sx={src[0]} sy={src[1]} spot={sp} id="c1" />}
				{on > 0 && <Dust t={t} spot={sp} seed="e" />}
			</World>
			{hIn > 0 && (
				<Phone cx={pc.x} cy={pc.y} s={pc.s} rot={pc.r} light={0.5} glow={`rgba(255,250,235,${0.04 + 0.08 * on})`}>
					<TorchUI on={on} />
				</Phone>
			)}
			{on > 0 && hIn > 0 && (
				<div style={{position: 'absolute', left: lens[0] - 150, top: lens[1] - 150, width: 300, height: 300, borderRadius: '50%', opacity: on, mixBlendMode: 'screen', background: 'radial-gradient(circle, rgba(255,245,225,0.5) 0%, rgba(255,220,170,0.16) 35%, rgba(0,0,0,0) 70%)'}} />
			)}
			<Vig />
		</AbsoluteFill>
	);
};

// 2. celular vibra
const S2 = (t: number, f: number) => {
	const t0 = B.s2;
	const t1 = B.s3;
	const tv = T('n4') + 0.1;
	// o celular sobe da posição em que estava na cena 1 (mesmo plano), e o fundo perde o foco
	const up = sm((t - t0) / 0.55);
	const vib = t > tv && t < tv + 1.05 ? Math.sin(t * 95) * 9 * (1 - (t - tv) / 1.05) : 0;
	const push = sm((t - T('n5')) / 1.6);
	const s = lerp(2.3, 3.7, up) + 0.9 * push;
	const to = Wd('n4', 3).s;
	const app = sm((t - to) / 0.25);
	const cam: Cam = {x: lerp(280, 270, up), y: lerp(720, 900, up), z: lerp(1.36, 1.3, up)};
	const sp: Spot = {x: lerp(250, 300, up) + nz(t, 9) * 10, y: lerp(700, 1150, up), r: lerp(300, 260, up), a: lerp(1, 0.75, up)};
	const pc = {x: lerp(650, 560, up) + vib, y: lerp(1640, 940, up) - push * 60, r: lerp(-8, -3, up) + vib * 0.25 + nz(t, 10)};
	const lens = phonePt(pc.x, pc.y, s, pc.r, 118, 2);
	const src = s2w(cam, lens[0], lens[1]);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<World cam={cam} filter={`blur(${4 * up}px) brightness(${lerp(1, 0.75, up)})`}>
				<Room d="ent_d.jpg" l="ent_l.jpg" spot={sp} dark={lerp(0.42, 0.35, up)} />
				{up < 1 && <Cone sx={src[0]} sy={src[1]} spot={{...sp, a: 1 - up}} id="c2" />}
			</World>
			<Phone cx={pc.x} cy={pc.y} s={s} rot={pc.r} light={lerp(0.5, 0.75, up)} glow={app > 0.5 ? 'rgba(150,255,190,0.16)' : 'rgba(255,250,235,0.12)'}>
				{app < 1 && <TorchUI on={1} />}
				{app > 0 && (
					<AbsoluteFill style={{opacity: app}}>
						<Cctv src="cctv_far.jpg" t={t} f={f} noise={0.35} pad={150} padY={170} />
					</AbsoluteFill>
				)}
				<Notif y={lerp(-200, 235, sm((t - tv) / 0.3))} o={sm((t - tv) / 0.3) * (1 - sm((t - to - 0.1) / 0.25))} w={820} />
			</Phone>
			<Vig o={lerp(0.85, 0.75, up)} />
		</AbsoluteFill>
	);
};

// 3. corredor: boneco andando + regras
const S3 = (t: number, f: number) => {
	const t0 = B.s3;
	const t1 = B.s4;
	const u = clamp((t - t0) / (t1 - t0));
	const cam: Cam = {x: 395 + nz(t, 11) * 3, y: 790 + nz(t, 12) * 3, z: lerp(1.12, 1.3, u), r: nz(t, 13) * 0.2};
	const s = lerp(0.8, 0.4, u);
	const feet = lerp(2040, 1450, u);
	const px = lerp(575, 540, u);
	const sp: Spot = {x: lerp(390, 385, u) + nz(t, 14) * 14, y: lerp(1040, 700, u) + nz(t, 15) * 10, r: lerp(300, 200, u), a: 1};
	const chest = s2w(cam, px + 60 * s, feet - 900 * s);
	const out = t1 - 0.25;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<World cam={cam}>
				<Room d="cor_d.jpg" l="cor_l.jpg" spot={sp} dark={0.42} />
				<Cone sx={chest[0]} sy={chest[1]} spot={sp} id="c3" w={0.9} />
				<Dust t={t} spot={sp} seed="c" />
			</World>
			<Pup x={px} feet={feet} s={s} p={walkPose(t)} />
			<Vig />
			<Rule n={1} txt="NÃO FAÇA BARULHO" t0={T('n7') - 0.05} t={t} y={640} out={out} />
			<Rule n={2} txt="NÃO ENCOSTE NAS PAREDES" t0={T('n8') - 0.05} t={t} y={750} out={out} />
			<Rule n={3} txt="NÃO TOQUE EM NADA" t0={T('n9') - 0.05} t={t} y={860} out={out} />
		</AbsoluteFill>
	);
};

// 4. sala: o gato
const S4 = (t: number, f: number) => {
	const t0 = B.s4;
	const t1 = B.s5;
	const th = T('n11') - 0.2;
	const tr = E('n12') + 0.05;
	const shake = t > th && t < th + 0.6 ? (1 - (t - th) / 0.6) * 12 : 0;
	const cam: Cam = {
		x: kf(t, [[t0, 470], [th, 380], [t1, 330]]) + Math.sin(t * 61) * shake * 0.5,
		y: 880 + Math.cos(t * 53) * shake * 0.5,
		z: kf(t, [[t0, 1.2], [th, 1.28], [th + 0.15, 1.38], [t1, 1.44]]),
		r: nz(t, 16) * 0.25 + Math.sin(t * 47) * shake * 0.05,
	};
	const catX = 265;
	const catY = 1030;
	const sp: Spot = {
		x: kf(t, [[t0, 610], [th - 0.5, 470], [th - 0.1, catX], [tr, catX + 10], [tr + 0.45, 90]]) + nz(t, 17) * 8,
		y: kf(t, [[t0, 700], [th - 0.5, 860], [th - 0.1, catY - 70], [tr + 0.45, catY - 80]]) + nz(t, 18) * 6,
		r: kf(t, [[t0, 270], [th - 0.1, 210]]),
		a: 1,
	};
	const camSrc = s2w(cam, 900, 1900);
	let cat: React.ReactNode = null;
	if (t < th - 0.08) {
		const o = sm((t - T('n10') - 0.5) / 0.5);
		const m = QM.cat2;
		const sc = 0.4;
		cat = <Img src={Qs('cat2')} style={{position: 'absolute', left: catX - (m.w * sc) / 2, top: catY - m.h * sc, width: m.w * sc, height: m.h * sc, opacity: o, filter: 'brightness(0.8)'}} />;
	} else if (t < tr) {
		const m = QM.cat0;
		const sc = 0.46 * (1 + 0.1 * bump(t - th + 0.08, 0.3));
		const tr2 = 1 + 0.03 * Math.sin(t * 42);
		cat = (
			<Img
				src={Qs('cat0')}
				style={{position: 'absolute', left: catX - (m.w * sc) / 2, top: catY - m.h * sc * tr2, width: m.w * sc, height: m.h * sc * tr2, filter: 'brightness(0.95) contrast(1.05)'}}
			/>
		);
	} else {
		const m = QM.cat3;
		const sc = 0.46;
		const x = lerp(catX, -260, clamp((t - tr) / 0.5));
		cat = (
			<Img
				src={Qs('cat3')}
				style={{position: 'absolute', left: x - (m.w * sc) / 2, top: catY - m.h * sc - 10 + Math.abs(Math.sin(t * 24)) * -10, width: m.w * sc, height: m.h * sc, transform: 'scaleX(-1)', filter: 'brightness(0.9)'}}
			/>
		);
	}
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<World cam={cam}>
				<Room d="liv_d.jpg" l="liv_l.jpg" spot={sp} dark={0.42} />
				<div style={{position: 'absolute', left: catX - 110, top: catY - 22, width: 220, height: 40, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,0,0,.6), rgba(0,0,0,0) 70%)'}} />
				{cat}
				<Cone sx={camSrc[0]} sy={camSrc[1]} spot={sp} id="c4" />
				<Dust t={t} spot={sp} seed="l" />
			</World>
			<Vig />
		</AbsoluteFill>
	);
};

// 5. geladeira
const S5 = (t: number, f: number) => {
	const t0 = B.s5;
	const t1 = B.s6;
	const ta = T('n13');
	const tb = T('n14');
	const cam: Cam = {x: kf(t, [[t0, 440], [t1, 400]]), y: kf(t, [[t0, 650], [t1, 710]]), z: kf(t, [[t0, 1.45], [t1, 1.62]]), r: nz(t, 19) * 0.25};
	const sp: Spot = {
		x: kf(t, [[t0, 330], [ta + 0.15, 340], [ta + 1.5, 500], [tb - 0.05, 470], [tb + 0.4, 250]]) + nz(t, 20) * 8,
		y: kf(t, [[t0, 640], [ta + 1.5, 610], [tb - 0.05, 640], [tb + 0.4, 900]]) + nz(t, 21) * 6,
		r: 175,
		a: 1,
	};
	const src = s2w(cam, 930, 1950);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<World cam={cam}>
				<Room d="kit_d.jpg" l="kit_l.jpg" spot={sp} dark={0.4} />
				<Cone sx={src[0]} sy={src[1]} spot={sp} id="c5" />
				<Dust t={t} spot={sp} seed="k" />
			</World>
			<Vig />
		</AbsoluteFill>
	);
};

// 6. gavetas: agachado de costas + close da gaveta
const S6 = (t: number, f: number) => {
	const t0 = B.s6;
	const t1 = B.s7;
	const tb = T('n16') - 0.05;
	if (t < tb) {
		const cam: Cam = {x: 300 + nz(t, 22) * 3, y: 860, z: 1.45, r: nz(t, 23) * 0.2};
		const c = sm((t - t0 - 0.15) / 0.75);
		const sp: Spot = {x: 255 + nz(t, 24) * 10, y: 880 + nz(t, 25) * 8, r: 210, a: 1};
		const occ = 'polygon(0px 984px, 100px 995px, 200px 1008px, 300px 1022px, 400px 1036px, 500px 1052px, 560px 1066px, 598px 1080px, 598px 1376px, 0px 1376px)';
		const ps = 0.36;
		return (
			<AbsoluteFill style={{background: '#000'}}>
				<World cam={cam}>
					<Room d="kit_d.jpg" l="kit_l.jpg" spot={sp} dark={0.38} />
					<div style={{position: 'absolute', left: 262, top: 1010 - 625 * ps, transform: `scale(${ps})`, transformOrigin: '0 0', filter: 'brightness(0.55) contrast(1.08) drop-shadow(0 0 6px rgba(255,190,120,0.35))'}}>
						<BackPuppet p={idlePose(t, c)} />
					</div>
					<div style={{...FULL, clipPath: occ}}>
						<Room d="kit_d.jpg" l="kit_l.jpg" spot={sp} dark={0.38} />
					</div>
					<Dust t={t} spot={sp} seed="g" />
				</World>
				<Vig />
			</AbsoluteFill>
		);
	}
	const tp = T('n16') + 0.1;
	const pull = sm((t - tp) / 0.35);
	const m = QM.h8_4;
	const s = 2.5 * (1 + 0.06 * pull);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<World cam={{x: 255, y: 900, z: 3.2}} filter="blur(7px) brightness(.45)">
				<Img src={A('kit_d.jpg')} style={FULL} />
			</World>
			<Img src={Qs('h8_4')} style={{position: 'absolute', left: 540 - (m.w * s) / 2, top: 980 - (m.h * s) / 2 + pull * 40, width: m.w * s, height: m.h * s, filter: 'brightness(.8)'}} />
			<AbsoluteFill style={{mixBlendMode: 'screen', background: 'radial-gradient(circle 520px at 52% 50%, rgba(255,200,130,0.28) 0%, rgba(0,0,0,0) 100%)'}} />
			<AbsoluteFill style={{mixBlendMode: 'multiply', background: 'radial-gradient(circle 700px at 52% 50%, rgba(255,255,255,1) 30%, rgba(30,30,40,1) 100%)'}} />
			<Vig />
		</AbsoluteFill>
	);
};

// 7. câmera em tela cheia
const S7 = (t: number, f: number) => {
	const t0 = B.s7;
	const t1 = B.s8;
	const ts = T('n18') + 0.3;
	if (t < ts) {
		const g = clamp(1 - (t - t0) / 0.4) + bump(t - (ts - 0.15), 0.15);
		return <Cctv src="cctv_far.jpg" t={t} f={f} zoom={kf(t, [[t0, 1.05], [ts, 1.32]])} fx={420} fy={650} glitch={g} big />;
	}
	const g = clamp(1 - (t - ts) / 0.3);
	return <Cctv src="cctv_mid.jpg" t={t} f={f} zoom={kf(t, [[ts, 1.12], [t1, 1.85]])} fx={384} fy={kf(t, [[ts, 650], [t1, 430]])} glitch={g} big noise={0.38} />;
};

// 8. quarto: escrivaninha, gaveta, caixa azul
const S8 = (t: number, f: number) => {
	const t0 = B.s8;
	const tb = T('n21') - 0.1;
	const w0 = Wd('n20', 0);
	const w1 = Wd('n20', 1);
	const w2 = Wd('n20', 2);
	if (t < tb) {
		const cam: Cam = {x: kf(t, [[t0, 340], [tb, 240]]), y: kf(t, [[t0, 880], [tb, 860]]), z: kf(t, [[t0, 1.15], [tb, 1.45]]), r: nz(t, 26) * 0.25};
		const sp: Spot = {
			x: kf(t, [[t0, 420], [w0.e, 330], [w1.s, 250], [w1.e, 250], [w2.s, 150], [tb, 145]]) + nz(t, 27) * 8,
			y: kf(t, [[t0, 1050], [w0.e, 1000], [w1.s, 800], [w1.e, 810], [w2.s, 880], [tb, 885]]) + nz(t, 28) * 6,
			r: kf(t, [[t0, 300], [w1.s, 220], [w2.s, 150]]),
			a: 1,
		};
		const src = s2w(cam, 900, 1950);
		return (
			<AbsoluteFill style={{background: '#000'}}>
				<World cam={cam}>
					<Room d="bed_d.jpg" l="bed_l.jpg" spot={sp} dark={0.4} />
					<Cone sx={src[0]} sy={src[1]} spot={sp} id="c8" />
					<Dust t={t} spot={sp} seed="b" />
				</World>
				<Vig />
			</AbsoluteFill>
		);
	}
	const m = QM.prop0;
	const s = 2.1 * (1 + 0.05 * sm((t - tb) / 1.5));
	const sp: Spot = {x: 384 + nz(t, 29) * 6, y: 688, r: 260, a: 1};
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<World cam={{x: 150, y: 870, z: 3}} filter="blur(8px) brightness(.35)">
				<Img src={A('bed_d.jpg')} style={FULL} />
			</World>
			<div style={{position: 'absolute', left: 540 - m.w * s * 0.62, top: 1000 + m.h * s * 0.32, width: m.w * s * 1.24, height: 90, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,0,0,.85) 0%, rgba(0,0,0,0) 70%)'}} />
			<Img src={Qs('prop0')} style={{position: 'absolute', left: 540 - (m.w * s) / 2, top: 1000 - (m.h * s) / 2, width: m.w * s, height: m.h * s, filter: 'brightness(.85)'}} />
			<AbsoluteFill style={{mixBlendMode: 'multiply', background: 'radial-gradient(circle 620px at 50% 52%, rgba(255,255,255,1) 35%, rgba(25,25,35,1) 100%)'}} />
			<AbsoluteFill style={{mixBlendMode: 'screen', background: 'radial-gradient(circle 420px at 50% 50%, rgba(255,200,130,0.2) 0%, rgba(0,0,0,0) 100%)'}} />
			<World cam={{x: 384, y: 688, z: 1}}>
				<Dust t={t} spot={sp} seed="x" n={60} />
			</World>
			<Vig />
		</AbsoluteFill>
	);
};

// 9. o armário respira
const breath = (t: number) => Math.pow(clamp(Math.sin(((t - T('n22') - 0.2) * 2 * Math.PI) / 1.9)), 1.5);
const S9 = (t: number, f: number) => {
	const t0 = B.s9;
	const tc = T('n23') - 0.15;
	if (t < tc) {
		const cam: Cam = {x: kf(t, [[t0, 300], [tc, 600]]), y: 770, z: kf(t, [[t0, 1.25], [tc, 1.45]]), r: nz(t, 30) * 0.3};
		const sp: Spot = {x: kf(t, [[t0, 250], [tc, 615]]) + nz(t, 31) * 8, y: kf(t, [[t0, 860], [tc, 720]]), r: 230, a: 0.9};
		const src = s2w(cam, 880, 1950);
		return (
			<AbsoluteFill style={{background: '#000'}}>
				<World cam={cam}>
					<Room d="bed_d.jpg" l="bed_l.jpg" spot={sp} dark={0.38} />
					<Cone sx={src[0]} sy={src[1]} spot={sp} id="c9" />
				</World>
				<Vig />
			</AbsoluteFill>
		);
	}
	const b = breath(t);
	const z = kf(t, [[tc, 1.0], [B.s10, 1.16]]);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<World cam={{x: 384, y: 690, z, r: nz(t, 32) * 0.2}}>
				<Img src={A('ward_gap.jpg')} style={{...FULL, filter: 'brightness(.85)'}} />
				<div style={{position: 'absolute', left: 330, top: 0, width: 110, height: IH, mixBlendMode: 'screen', opacity: 0.25 + 0.55 * b, background: 'radial-gradient(ellipse 50% 45% at 50% 50%, rgba(190,215,255,0.65) 0%, rgba(0,0,0,0) 100%)'}} />
			</World>
			<AbsoluteFill style={{mixBlendMode: 'screen', background: 'radial-gradient(circle 700px at 85% 95%, rgba(255,190,120,0.12) 0%, rgba(0,0,0,0) 100%)'}} />
			<Vig o={0.9} />
		</AbsoluteFill>
	);
};

// 10. a virada
const S10 = (t: number, f: number) => {
	const t0 = B.s10;
	const tv = T('n26') + 0.15;
	const tf = E('n27') - 0.25;
	const te = T('n28') - 0.03;
	const tEnd = B.s11;
	if (t < tv + 0.5) {
		const up = sm((t - t0) / 0.45);
		const vt = T('n25') - 0.25;
		const vib = t > vt && t < vt + 1.05 ? Math.sin(t * 95) * 9 * (1 - (t - vt) / 1.05) : 0;
		const zi = sm((t - tv) / 0.5);
		const s = lerp(3.7, 16, zi * zi);
		return (
			<AbsoluteFill style={{background: '#000'}}>
				<World cam={{x: 384, y: 690, z: 1.25}} filter="blur(5px) brightness(.4)">
					<Img src={A('ward_gap.jpg')} style={FULL} />
				</World>
				<Phone cx={560 + vib} cy={lerp(2700, 940, up) + zi * 20} s={s} rot={-3 + vib * 0.25}>
					<Cctv src="cctv_mid.jpg" t={t} f={f} noise={0.35} pad={150} padY={170} topY={440} />
					<Notif y={lerp(-200, 235, sm((t - vt) / 0.3))} o={sm((t - vt) / 0.3) * (1 - zi)} w={820} />
				</Phone>
				<Vig o={0.7} />
			</AbsoluteFill>
		);
	}
	if (t < tf) {
		return <Cctv src="cctv_mid.jpg" t={t} f={f} zoom={kf(t, [[tv + 0.5, 1.15], [tf, 1.6]])} fx={384} fy={kf(t, [[tv + 0.5, 600], [tf, 420]])} big noise={0.38} />;
	}
	const g = clamp(1 - (t - tf) / 0.35) + (t > te ? clamp(1 - (t - te) / 0.3) * 1.2 : 0);
	const z = kf(t, [[tf, 1.05], [te, 1.22], [te + 0.08, 1.45], [tEnd, 1.55]]);
	const flash = t > te && t < te + 0.07 ? 0.85 : 0;
	const fade = sm((t - (E('n28') + 0.25)) / 0.25);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Cctv src="cctv_face.jpg" t={t} f={f} zoom={z} fx={386} fy={640} glitch={g} big blur={2.1} noise={0.5} />
			{flash > 0 && <AbsoluteFill style={{background: '#fff', opacity: flash}} />}
			<Black o={fade} />
		</AbsoluteFill>
	);
};

// 11. o eco: a mulher e a casa inteira
const S11 = (t: number, f: number) => {
	const t0 = B.s11;
	const tw = Wd('w0e', 2).e + 0.02;
	if (t < t0 + 0.3) return <AbsoluteFill style={{background: '#000'}} />;
	if (t < tw) {
		const o = sm((t - t0 - 0.3) / 0.35);
		const fl = 0.75 + 0.25 * nz(t * 3, 33);
		return (
			<AbsoluteFill style={{background: '#000'}}>
				<World cam={{x: 390, y: 760, z: kf(t, [[t0, 1.08], [tw, 1.22]]), r: nz(t, 34) * 0.3}}>
					<Img src={A('woman.jpg')} style={{...FULL, opacity: o, filter: `brightness(${0.75 + 0.15 * fl})`}} />
					<div style={{position: 'absolute', left: 300, top: 640, width: 300, height: 300, mixBlendMode: 'screen', opacity: o * 0.35 * fl, background: 'radial-gradient(circle, rgba(190,215,255,0.8) 0%, rgba(0,0,0,0) 70%)'}} />
				</World>
				<Vig o={0.9} />
			</AbsoluteFill>
		);
	}
	const u = sm((t - tw) / 1.7);
	const cam: Cam = {x: lerp(470, 384, u), y: lerp(285, 690, u), z: lerp(3.4, 1.0, u)};
	const amber: Spot = {x: 418 + nz(t, 35) * 4, y: 300 + nz(t, 36) * 3, r: 78, a: 1};
	const cold: Spot = {x: 533, y: 318, r: 44, a: 0.6 + 0.2 * nz(t * 2, 37)};
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<World cam={cam}>
				<Img src={A('house_l.jpg')} style={{...FULL, filter: 'brightness(.25) saturate(.55) hue-rotate(15deg)'}} />
				<Img src={A('house_l.jpg')} style={{...FULL, WebkitMaskImage: `${grad(amber)},${grad(cold)}`, maskImage: `${grad(amber)},${grad(cold)}`}} />
				<div style={{...FULL, mixBlendMode: 'screen', background: `radial-gradient(circle 60px at ${cold.x}px ${cold.y}px, rgba(170,200,255,${0.55 * cold.a}) 0%, rgba(0,0,0,0) 100%)`}} />
				<div style={{...FULL, mixBlendMode: 'screen', background: `radial-gradient(circle 70px at ${amber.x}px ${amber.y}px, rgba(255,190,110,0.35) 0%, rgba(0,0,0,0) 100%)`}} />
			</World>
			<Vig o={0.6} />
		</AbsoluteFill>
	);
};

// 12. a caixa, a foto e o nome
const S12 = (t: number, f: number) => {
	const t0 = B.s12;
	const to = T('n30') + 0.55;
	const tp = Wd('n31', 5).s;
	const tm = Wd('n31', 9).s;
	const tf = Wd('n32', 2).e + 0.05;
	const tn = T('n33');
	const opened = t > to;
	const rise = sm((t - tp) / 0.7);
	const bm = opened ? QM.prop1 : QM.prop0;
	const bs = 1.9 * (1 + 0.06 * bump(t - to, 0.25));
	const flip = clamp((t - tf) / 0.4);
	const fx = Math.cos(Math.PI * flip);
	const back = fx < 0;
	const pm = back ? QM.prop3 : QM.prop2;
	const ps = lerp(0.7, 2.2, rise);
	const py = lerp(1150, 900, rise);
	const mem = bump(t - tm, 1.1);
	const dt = t - tn;
	const idx = dt < 1.4 ? Math.floor(dt * 11) : 15 + Math.floor((dt - 1.4) * 2.5);
	const nm = NAMES[((idx % NAMES.length) + NAMES.length) % NAMES.length];
	const sp: Spot = {x: 384, y: 660, r: 300, a: 1};
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<World cam={{x: 150, y: 870, z: 3}} filter="blur(9px) brightness(.3)">
				<Img src={A('bed_d.jpg')} style={FULL} />
			</World>
			<Img
				src={Qs(opened ? 'prop1' : 'prop0')}
				style={{position: 'absolute', left: 540 - (bm.w * bs) / 2, top: 1180 - (bm.h * bs) / 2 + rise * 260, width: bm.w * bs, height: bm.h * bs, filter: `brightness(${0.85 - 0.4 * rise})`}}
			/>
			{rise > 0.01 && (
				<div style={{position: 'absolute', left: 540 - (pm.w * ps) / 2, top: py - (pm.h * ps) / 2, width: pm.w * ps, height: pm.h * ps, transform: `rotate(${lerp(-6, -2, rise)}deg) scaleX(${Math.abs(fx) < 0.02 ? 0.02 : Math.abs(fx)})`}}>
					<Img src={Qs(back ? 'prop3' : 'prop2')} style={{width: '100%', height: '100%', filter: 'brightness(.9)'}} />
					{back && dt > 0 && (
						<div
							style={{
								position: 'absolute',
								left: 0,
								top: 0,
								width: '100%',
								height: '100%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontFamily: 'Hand',
								fontWeight: 700,
								fontSize: 170 * (ps / 2.2),
								color: 'rgba(38,26,18,0.88)',
								transform: 'rotate(-4deg)',
								opacity: sm(dt / 0.15),
								filter: dt < 1.4 ? 'blur(0.6px)' : 'blur(1.4px)',
							}}
						>
							{nm}
						</div>
					)}
				</div>
			)}
			{mem > 0 && <Img src={A('liv_l.jpg')} style={{position: 'absolute', left: 0, top: -7, width: 1080, height: 1935, opacity: mem * 0.85, filter: 'sepia(.85) brightness(.75) blur(1px)'}} />}
			<AbsoluteFill style={{mixBlendMode: 'multiply', background: 'radial-gradient(circle 680px at 50% 50%, rgba(255,255,255,1) 35%, rgba(25,25,35,1) 100%)'}} />
			<AbsoluteFill style={{mixBlendMode: 'screen', background: 'radial-gradient(circle 460px at 50% 48%, rgba(255,200,130,0.18) 0%, rgba(0,0,0,0) 100%)'}} />
			<World cam={{x: 384, y: 688, z: 1}}>
				<Dust t={t} spot={sp} seed="p" n={50} />
			</World>
			<Vig />
		</AbsoluteFill>
	);
};

// luz de sirene
const Siren: React.FC<{t: number; o: number}> = ({t, o}) => {
	const red = Math.max(0, Math.sin(t * 7));
	const blue = Math.max(0, Math.sin(t * 7 + Math.PI));
	return (
		<>
			<AbsoluteFill style={{mixBlendMode: 'screen', opacity: o * red, background: `radial-gradient(ellipse 60% 45% at ${30 + 25 * Math.sin(t * 2.1)}% 35%, rgba(255,40,40,0.55) 0%, rgba(0,0,0,0) 100%)`}} />
			<AbsoluteFill style={{mixBlendMode: 'screen', opacity: o * blue, background: `radial-gradient(ellipse 60% 45% at ${70 - 25 * Math.sin(t * 2.1)}% 30%, rgba(50,100,255,0.6) 0%, rgba(0,0,0,0) 100%)`}} />
		</>
	);
};

// 13. a decisão
const S13 = (t: number, f: number) => {
	const t0 = B.s13;
	const ta = T('n35') - 0.15;
	const tb = T('n36') - 0.1;
	const so = sm((t - t0 - 0.3) / 1.2);
	if (t < ta) {
		const sp: Spot = {x: 160 + nz(t, 38) * 6, y: 880, r: 150, a: 0.85};
		return (
			<AbsoluteFill style={{background: '#000'}}>
				<World cam={{x: 384, y: 760, z: kf(t, [[t0, 1.12], [ta, 1.22]]), r: nz(t, 39) * 0.2}}>
					<Room d="bed_d.jpg" l="bed_l.jpg" spot={sp} dark={0.4} />
				</World>
				<Siren t={t} o={so} />
				<Vig />
			</AbsoluteFill>
		);
	}
	if (t < tb) {
		const u = sm((t - ta) / 1.3);
		const m = QM.h8_0;
		const s = 2.4;
		return (
			<AbsoluteFill style={{background: '#000'}}>
				<World cam={{x: 384, y: 690, z: kf(t, [[ta, 1.1], [tb, 1.22]])}}>
					<Img src={A('ward_gap.jpg')} style={{...FULL, filter: 'brightness(.75)'}} />
				</World>
				<Img src={Qs('h8_0')} style={{position: 'absolute', left: lerp(880, 560, u) + nz(t, 40) * 6, top: lerp(1750, 1120, u) + nz(t, 41) * 6, width: m.w * s, height: m.h * s, transform: `rotate(${lerp(-25, -12, u)}deg)`, filter: 'brightness(.72)'}} />
				<AbsoluteFill style={{mixBlendMode: 'screen', background: `radial-gradient(circle 520px at ${lerp(80, 58, u)}% ${lerp(92, 66, u)}%, rgba(255,190,120,0.16) 0%, rgba(0,0,0,0) 100%)`}} />
				<Siren t={t} o={0.6} />
				<Vig />
			</AbsoluteFill>
		);
	}
	const m = QM.h8_3;
	const s = 3.0;
	const turn = sm((t - tb - 0.4) / 0.6);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<World cam={{x: 262, y: 700, z: 2.6}} filter="blur(4px) brightness(.4)">
				<Img src={A('ent_d.jpg')} style={FULL} />
			</World>
			<Img src={Qs('h8_3')} style={{position: 'absolute', left: 540 - (m.w * s) / 2, top: 980 - (m.h * s) / 2, width: m.w * s, height: m.h * s, transform: `rotate(${-turn * 7}deg)`, filter: 'brightness(.6)'}} />
			<Siren t={t} o={0.55} />
			<Vig />
		</AbsoluteFill>
	);
};

// 14. cartão final
const S14 = (t: number, f: number) => {
	const t0 = B.s14;
	const a = sm((t - t0) / 0.5);
	const b1 = sm((t - t0 - 0.35) / 0.35);
	const b2 = sm((t - t0 - 0.55) / 0.35);
	const c = sm((t - t0 - 0.85) / 0.4);
	const btn = (o: number, n: string, txt: string, col: string, y: number) => (
		<div
			style={{
				position: 'absolute',
				left: 130,
				top: y + (1 - o) * 30,
				width: 820,
				height: 112,
				borderRadius: 56,
				border: `5px solid ${col}`,
				background: 'rgba(0,0,0,.45)',
				opacity: o,
				display: 'flex',
				alignItems: 'center',
				fontFamily: 'MS',
				fontWeight: 900,
				fontSize: 44,
				color: '#fff',
				letterSpacing: 1,
				boxShadow: `0 0 30px ${col}55`,
			}}
		>
			<div style={{width: 112, textAlign: 'center', color: col, fontSize: 54}}>{n}</div>
			<div>{txt}</div>
		</div>
	);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<World cam={{x: 384, y: 690, z: 1.1}} filter="blur(10px) brightness(.28)">
				<Img src={A('ward_gap.jpg')} style={FULL} />
			</World>
			<Siren t={t} o={0.35} />
			<div style={{position: 'absolute', top: 560, width: 1080, textAlign: 'center', fontFamily: 'MS', fontWeight: 900, fontSize: 200, letterSpacing: 22, color: '#fff', opacity: a, transform: `scale(${lerp(1.08, 1, a)})`, textShadow: '0 0 40px rgba(0,0,0,.8)'}}>
				DIA 1
			</div>
			<div style={{position: 'absolute', left: 390, top: 820, width: 300 * a, height: 6, borderRadius: 3, background: '#ffb24a'}} />
			{btn(b1, '1', 'ABRIR O ARMÁRIO', '#ffb24a', 930)}
			{btn(b2, '2', 'IR EMBORA COM A CAIXA', '#ffffff', 1080)}
			<div style={{position: 'absolute', top: 1260, width: 1080, textAlign: 'center', fontFamily: 'MS', fontWeight: 700, fontSize: 46, color: 'rgba(255,255,255,.85)', opacity: c}}>Comente 1 ou 2</div>
			<div style={{position: 'absolute', top: 1340, width: 1080, textAlign: 'center', fontFamily: 'MS', fontWeight: 700, fontSize: 38, color: '#ffb24a', opacity: c}}>Siga para ver o Dia 2 →</div>
			<Vig o={0.7} />
		</AbsoluteFill>
	);
};

const SCENES: [number, (t: number, f: number) => React.ReactNode][] = [
	[0, S0],
	[B.s1, S1],
	[B.s2, S2],
	[B.s3, S3],
	[B.s4, S4],
	[B.s5, S5],
	[B.s6, S6],
	[B.s7, S7],
	[B.s8, S8],
	[B.s9, S9],
	[B.s10, S10],
	[B.s11, S11],
	[B.s12, S12],
	[B.s13, S13],
	[B.s14, S14],
];

export const Video: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / 30;
	let k = 0;
	for (let i = 0; i < SCENES.length; i++) if (t >= SCENES[i][0]) k = i;
	const scene = SCENES[k][1](t, f);
	const hudOn = (t >= B.s3 && t < B.s7) || (t >= B.s8 && t < B.s10);
	const app = t < B.s7 ? sm((t - B.s3) / 0.35) : sm((t - B.s8) / 0.35);
	const feed = t < B.s4 ? 'cctv_far.jpg' : 'cctv_empty.jpg';
	const alert = bump(t - T('n16'), 0.9);
	const cctvScene = k === 7 || (k === 10 && t > T('n26') + 0.65);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Fonts />
			{scene}
			{hudOn && <Hud src={feed} t={t} f={f} app={app} alert={alert} />}
			{!cctvScene && <Grain f={f} o={0.12} />}
		</AbsoluteFill>
	);
};
