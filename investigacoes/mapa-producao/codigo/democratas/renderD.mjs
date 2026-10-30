import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
const t0=Date.now();
const scale=Number(process.argv[2]||0.5), out=process.argv[3]||'out/demc-previa.mp4';
const serveUrl=await bundle({entryPoint:'src/index.ts'});
const composition=await selectComposition({serveUrl,id:'DemC'});
await renderMedia({serveUrl,composition,codec:'h264',crf:scale<1?24:16,scale,outputLocation:out,concurrency:4,
  onProgress:({progress})=>{const p=Math.round(progress*100); if(p%10===0) console.log(p+'% '+Math.round((Date.now()-t0)/1000)+'s');}});
console.log('FIM '+Math.round((Date.now()-t0)/1000)+'s');
