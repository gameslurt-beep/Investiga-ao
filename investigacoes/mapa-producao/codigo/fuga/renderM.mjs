import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
const t0=Date.now();
const serveUrl=await bundle({entryPoint:'src/index.ts'});
const composition=await selectComposition({serveUrl,id:'FugaM'});
await renderMedia({serveUrl,composition,codec:'h264',crf:18,outputLocation:'out/fugam-v1.mp4',concurrency:4,
  onProgress:({progress})=>{const p=Math.round(progress*100); if(p%10===0) console.log(p+'% '+Math.round((Date.now()-t0)/1000)+'s');}});
console.log('FIM '+Math.round((Date.now()-t0)/1000)+'s');
