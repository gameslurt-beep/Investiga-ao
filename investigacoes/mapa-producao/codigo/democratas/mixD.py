import subprocess, numpy as np
SR=48000; L=int(44.6*SR)
import glob,os
D='/tmp/claude-0/sfxz/sfx/'
PATH={os.path.basename(p)[:-4]:p for p in glob.glob(D+'*/*.mp3')}
def load(f):
    raw=subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw,np.float32).reshape(-1,2).copy()
C={}
def g(n):
    if n not in C: C[n]=load(PATH[n])
    return C[n]
out=np.zeros((L,2),np.float32)
def put(t,n,gain,maxd=None,fade=0.25,peak=False,rate=1.0):
    a=g(n).copy()
    if rate!=1.0:
        idx=(np.arange(int(len(a)/rate))*rate).astype(int); a=a[idx[idx<len(a)]]
    if maxd:
        a=a[:int(maxd*SR)]; fn=min(len(a),int(fade*SR)); a[-fn:]*=np.linspace(1,0,fn)[:,None]
    off=int(np.argmax(np.abs(a).max(1))) if peak else 0
    s=int(t*SR)-off
    if s<0: a=a[-s:]; s=0
    e=min(L,s+len(a)); out[s:e]+=a[:e-s]*gain
TQ='tique-taque'; K='soco-forte'
put(0.05,'whoosh-impacto-grave',0.5); put(0.2,'impacto-cinema-grande',0.45,maxd=3,fade=1.5,peak=True)
put(1.7,'pop-seco',0.4); put(3.25,'whoosh-curto',0.4)
for i in range(8): put(4.4+i*0.25,'pop-seco',0.2,rate=1+i*0.05)
put(7.3,'whoosh-cinema-rapido',0.4); put(7.5,'whoosh-vento',0.3,maxd=3.2,fade=1.2)
put(11.2,'whoosh-curto',0.4); put(12.2,K,0.5,peak=True); put(12.2,'grave-curto',0.35,peak=True)
put(15.4,'camera-clique-forte',0.55)
for i in range(11): put(17.95+i*0.22,TQ,0.25,maxd=0.2,fade=0.05)
put(17.9,'whoosh-curto',0.35)
for i in range(25): put(21.35+i*0.105,'pop-seco',0.12+0.01*i,rate=0.9+i*0.02)
put(23.9,K,0.5,peak=True)
put(24.2,'whoosh-curto',0.4); put(24.35,K,0.45,peak=True)
for t0 in (27.86,29.76,31.83): put(t0-0.15,'whoosh-curto',0.3); put(t0,'pop-seco',0.4)
for i,tt in enumerate(np.linspace(34.7,37.6,14)): put(tt,TQ,0.2+0.02*i,maxd=0.15,fade=0.04)
put(34.58,'riser-drama',0.3,maxd=2.8,fade=0.4)
put(36.1,'camera-clique-forte',0.55); put(36.1,K,0.5,peak=True)
put(37.9,'suspense-grave-misterio',0.35,maxd=5.0,fade=1.5); put(38.5,'impacto-cinema-grande',0.5,maxd=3,fade=1.5,peak=True)
nar=load('/tmp/claude-0/dem/sp3d/public/narr.wav')
N=np.zeros((L,2),np.float32); n=min(L,len(nar)); N[:n]=nar[:n]
r=lambda a: float(np.sqrt((a[a.any(1)]**2).mean()+1e-12))
mix=N+out*(r(N)/0.12)*0.4
mix/=max(1.0,np.abs(mix).max()/0.97)
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','-','-af','loudnorm=I=-14:TP=-1.0:LRA=11','-ar','48000','/tmp/claude-0/dem/mix.wav'],input=mix.astype(np.float32).tobytes())
print('ok')
