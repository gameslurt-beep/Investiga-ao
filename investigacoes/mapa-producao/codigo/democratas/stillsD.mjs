import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
const ts=process.argv.slice(2).map(Number);
const serveUrl=await bundle({entryPoint:'src/index.ts'});
const comp=await selectComposition({serveUrl,id:'DemC'});
for(const t of ts){await renderStill({serveUrl,composition:comp,frame:Math.round(t*30),output:`/tmp/claude-0/dem/s_${t}.jpg`,scale:0.4,imageFormat:'jpeg'});console.log('ok',t)}
