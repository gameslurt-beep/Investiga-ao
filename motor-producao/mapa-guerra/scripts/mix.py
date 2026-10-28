import subprocess, numpy as np, sys, os
SR=48000; W=sys.argv[1]; LIB=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','sfx')
import glob,os
IDX={os.path.basename(p)[:-4]:p for p in glob.glob(LIB+'/*/*.mp3')}
def load(path, rate=1.0, ss=None, t=None):
    af=f'asetrate={int(SR*rate)},aresample={SR}' if rate!=1.0 else 'anull'
    cmd=['ffmpeg','-v','error']+(['-ss',str(ss)] if ss is not None else [])+(['-t',str(t)] if t else [])+['-i',path,'-af',af,'-ac','2','-ar',str(SR),'-f','f32le','-']
    return np.frombuffer(subprocess.run(cmd,capture_output=True).stdout,np.float32).reshape(-1,2).copy()
L=int(55.6*SR); sfx=np.zeros((L,2),np.float32)
cache={}
def put(t,name,g,align='start',maxd=None,rate=1.0,fade=0.3):
    k=(name,rate)
    if k not in cache: cache[k]=load(IDX[name],rate)
    a=cache[k].copy()
    if maxd:
        n=int(maxd*SR); a=a[:n]; fn=min(len(a),int(fade*SR)); a[-fn:]*=np.linspace(1,0,fn)[:,None]
    off=int(np.argmax(np.abs(a).max(1))) if align=='peak' else 0
    s=int(t*SR)-off
    if s<0: a=a[-s:]; s=0
    e=min(L,s+len(a)); sfx[s:e]+=a[:e-s]*g
# abertura
put(0.05,'impacto-cinema-grande',0.5,'peak',3.0,fade=1.5)
for i,t0 in enumerate([0.55,0.85,1.15,1.45,1.75,2.05]): put(t0+0.05,'pop-longo',0.35,rate=0.9+i*0.06)
# placar e América do Sul
put(6.0,'whoosh-curto',0.3)
for i in range(6): put(6.15+i*0.08,'clique-selecao',0.18,rate=1+i*0.05,maxd=0.4)
put(8.2,'buzzer-errado-grave',0.28,maxd=1.0)
put(10.9,'whoosh-flecha',0.4); put(12.6,'whoosh-flecha',0.4,rate=0.9)
put(12.7,'whoosh-vento',0.3,maxd=1.6,fade=0.6)
# peças pousando
for t0 in [6.3,14.1,14.2,21.35,22.4,28.0,40.2,40.3,46.2,47.4,48.6,48.7]: put(t0,'pop-seco',0.5,rate=0.8)
# Oceania e Ásia
put(14.6,'whoosh-transicao-rapida',0.35,'peak',1.5); put(15.1,'pop-bolha',0.3)
put(18.2,'suspense-crescendo',0.3,maxd=3.0,fade=1.0)
put(21.35,'grave-curto',0.45); put(22.4,'grave-curto',0.45)
# volta ao mundo e mergulho na África
put(24.1,'whoosh-cinema-rapido',0.45,'peak'); put(26.3,'whoosh-transicao-rapida',0.4,'peak',1.5)
put(27.95,'grave-curto',0.4); put(28.9,'buzzer-errado-grave',0.22,maxd=0.8)
put(30.65,'tique-taque',0.35,maxd=1.4,rate=1.4,fade=0.3)
put(31.95,'pop-click-forte',0.35)
for i in range(7): put(33.1+i*0.18,'brilho-fada',0.18,rate=1+i*0.05,maxd=0.8)
# Gibraltar
put(35.4,'whoosh-aspirador-zoom',0.45,'peak')
for i in range(4): put(36.0+i*0.15,'clique-selecao',0.3,rate=1+i*0.08,maxd=0.3)
put(36.62,'pop-click-forte',0.4)
# Europa vence
put(38.6,'whoosh-curto',0.35); put(38.95,'whoosh-vento',0.28,maxd=1.4,fade=0.5)
put(40.05,'metal-caindo',0.5); put(40.05,'soco-forte',0.4,'peak')
put(41.5,'whoosh-cinema-rapido',0.3,'peak')
for t0 in [41.35,41.6,41.85]: put(t0,'pop-eletrico',0.35,maxd=0.8)
put(43.2,'riser-trailer',0.4); put(44.55,'batida-terror',0.5,'peak',2.5,fade=1.0)
# Ásia vence
put(45.7,'whoosh-giratorio',0.3,maxd=1.4); put(46.1,'whoosh-vento',0.3,maxd=1.4,fade=0.5)
put(48.25,'batida-coracao',0.6,'peak',2.5,fade=1.0)
put(50.0,'whoosh-ar',0.3,'peak',2.0)
put(53.05,'impacto-cinema-grande',0.55,'peak',2.5,fade=1.5)
# música: começo do arquivo + final do arquivo
A=load(W+'/audio/musica.mp3',ss=3.0,t=43.5); B=load(W+'/audio/musica.mp3',ss=160.2,t=14.4)
mus=np.zeros((L,2),np.float32)
xa=int(42.2*SR); xf=int(1.2*SR)
mus[:min(L,len(A))]+=A[:L]
ramp=np.linspace(1,0,xf)[:,None]
mus[xa:xa+xf]*=ramp; mus[xa+xf:]*=0
nb=min(len(B),L-xa); Bc=B[:nb].copy(); Bc[:xf]*=1-ramp[:min(xf,nb)]; mus[xa:xa+nb]+=Bc
fo=int(1.0*SR); mus[-fo:]*=np.linspace(1,0,fo)[:,None]
nar=load(W+'/audio/narr.wav')
n=np.zeros((L,2),np.float32); n[:min(L,len(nar))]=nar[:L]
# ducking da música pela narração
env=np.abs(n).max(1); k=int(0.25*SR)
env=np.convolve(env,np.ones(k)/k,'same'); duck=np.where(env>0.02,0.55,1.0)
duck=np.convolve(duck,np.ones(k)/k,'same')[:,None]
mix=n*1.0+mus*0.22*duck+sfx*0.8
np.clip(mix,-1,1).astype(np.float32).tofile(W+'/audio/mix.f32')
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i',W+'/audio/mix.f32','-af','loudnorm=I=-14:TP=-1.5:LRA=11','-ar','48000',W+'/audio/mix.wav'])
print('ok')
