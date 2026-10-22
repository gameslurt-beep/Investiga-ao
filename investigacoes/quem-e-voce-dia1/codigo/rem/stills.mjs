import path from 'path';
import fs from 'fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const list = fs.readFileSync(process.env.FRAMES || '../frames.txt', 'utf8').trim().split(/\s+/).map((x) => x.split(':'));
const only = process.argv[2] ? process.argv[2].split(',') : null;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const composition = await selectComposition({serveUrl, id: 'QV', browserExecutable});
for (const [name, frame] of list) {
	if (only && !only.includes(name)) continue;
	const t = Date.now();
	await renderStill({composition, serveUrl, output: `${process.env.OUT || '../stills'}/${name}.jpg`, frame: Number(frame), imageFormat: 'jpeg', jpegQuality: 82, browserExecutable, scale: Number(process.env.SCALE || 0.5)});
	console.log(name, frame, Date.now() - t, 'ms');
}
