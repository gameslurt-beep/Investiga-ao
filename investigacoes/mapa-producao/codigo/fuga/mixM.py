import subprocess, numpy as np
SR=48000; L=int(88.4*SR)
def load(f):
    raw=subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw,np.float32).reshape(-1,2).copy()
C={}
def g(n):
    if n not in C: C[n]=load(n if '/' in n else f'sfx/{n}.mp3')
    return C[n]
def rms(a): return float(np.sqrt((a**2).mean()+1e-12))
out=np.zeros((L,2),np.float32)
def put(t,n,gain,maxd=None,fade=0.25,peak=False,buf=None):
    a=g(n).copy()
    if maxd:
        a=a[:int(maxd*SR)]; fn=min(len(a),int(fade*SR)); a[-fn:]*=np.linspace(1,0,fn)[:,None]
    off=int(np.argmax(np.abs(a).max(1))) if peak else 0
    s=int(t*SR)-off
    if s<0: a=a[-s:]; s=0
    B=out if buf is None else buf
    e=min(L,s+len(a)); B[s:e]+=a[:e-s]*gain
K='soco-forte'; TQ='tique-taque'
# abertura
put(0.0,'whoosh-impacto-grave',0.55,peak=False); put(0.2,'impacto-cinema-grande',0.5,maxd=3,fade=1.5,peak=True)
put(0.6,'whoosh-vento',0.22,maxd=6,fade=2)   # motor/estrada distante
put(10.3,'pop-seco',0.35); put(15.1,'aviao',0.25,maxd=3.5,fade=1.5)
# rebobinar
put(19.4,'riser-drama',0.3,maxd=1.8,fade=0.4)
for i in range(10): put(19.6+i*0.35,TQ,0.25,maxd=0.2,fade=0.05)
put(23.4,'whoosh-cinema-rapido',0.45)
put(24.7,'pop-seco',0.4); put(28.75,K,0.5,peak=True); put(28.8,'grave-curto',0.4,peak=True)
# janelinha: corte seco
put(30.45,'glitch-estatica',0.25,maxd=0.35,fade=0.1); put(37.35,'whoosh-curto',0.35)
# segunda à noite
put(37.7,'aviao',0.4,maxd=3.0,fade=1.0); put(41.0,'aviao',0.35,maxd=3.6,fade=1.2); put(44.6,K,0.3,peak=True)
put(45.4,'radar',0.25); put(47.7,'pop-seco',0.45)
# duas da manhã: motor desliga + silêncio
put(48.9,TQ,0.35,maxd=1.0,fade=0.2); put(49.6,'grave-curto',0.45,peak=True)
put(52.4,'whoosh-ar',0.3); put(52.6,'batida-coracao',0.25,maxd=3,fade=0.8)
# prazo vence
put(56.2,TQ,0.35,maxd=1.4,fade=0.2); put(57.75,K,0.6,peak=True); put(57.75,'grave-curto',0.55,peak=True)
put(59.4,'radar2',0.25)
# tempo acelerando
for i,tt in enumerate(np.linspace(60.4,63.2,16)): put(tt,TQ,0.2+0.02*i,maxd=0.15,fade=0.04)
put(60.9,'riser-drama',0.35,maxd=2.6,fade=0.4)
# ponte: só a van e a junta
put(63.7,'whoosh-vento',0.35,maxd=2.4,fade=0.8)
put(64.75,K,0.28,peak=True); put(64.95,K,0.22,peak=True)
put(65.85,'camera-clique-forte',0.5)  # carimbo
# decolagem
put(66.4,'aviao',0.65,maxd=3.6,fade=1.5); put(67.8,'whoosh-impacto-grave',0.4)
for tt in [70.48,71.44,72.39,73.13]: put(tt-0.1,'whoosh-curto',0.3); put(tt,'pop-seco',0.35)
put(74.1,'radar2',0.25); put(75.1,'aviao',0.4,maxd=2.6,fade=1.0); put(77.4,K,0.35,peak=True)
# 2022
put(78.5,'whoosh-cinema-rapido',0.35); put(82.4,'whoosh-curto',0.3)
put(84.13,'impacto-cinema-grande',0.6,maxd=2.5,fade=1.2,peak=True)
put(84.9,'batida-coracao',0.4,maxd=1.4,fade=0.3); put(86.6,'whoosh-impacto-grave',0.35)
sfx=out
# narração + janelinha
nar=load('../fm/narr_f.wav'); jan=load('../fm/jan.mp4')
N=np.zeros((L,2),np.float32)
INS=30.2; JA=30.55
a=int(INS*SR); N[:a]+=nar[:a]
rest=nar[a:]; s=int((INS+7.0)*SR); e=min(L,s+len(rest)); N[s:e]+=rest[:e-s]
J=np.zeros((L,2),np.float32); s=int(JA*SR); e=min(L,s+len(jan)); J[s:e]=jan[:e-s]
r=rms(N[N.any(1)]); J*= r/rms(J[J.any(1)])*1.05
# música com respiros
m=load('/mnt/project-files/flavio-fuga/v2/audio/musica-trace-evidence.mp3')
mus=np.zeros((L,2),np.float32); n=min(L,len(m)); mus[:n]=m[:n]
T=np.arange(L)/SR
env=np.interp(T,[0,30.2,30.5,37.3,38.2,48.9,49.3,51.5,52.4,63.5,63.8,66.2,66.6,85.5,88.4],
              [1,1,0.0,0.0,1,1,0.12,0.12,1,1,0.05,0.05,1.25,1.1,0.0])
mus*=env[:,None].astype(np.float32)
sfx_env=np.interp(T,[0,30.4,30.5,37.3,37.4,88.4],[1,1,0,0,1,1]).astype(np.float32)
sfx*=sfx_env[:,None]
mus*=(r*0.17)/rms(mus[:int(30*SR)])
mix=N+J+mus+sfx*(r/0.12)*0.45
mix/=max(1.0,np.abs(mix).max()/0.97)
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','-','-af','loudnorm=I=-14:TP=-1.0:LRA=11','-ar','48000','sp3d/public/m/mix.wav'],input=mix.astype(np.float32).tobytes())
print('ok')
