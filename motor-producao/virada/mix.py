import subprocess, numpy as np, json, sys
SR=48000
def load(i, rate=1.0):
    af=f'asetrate={int(SR*rate)},aresample={SR}' if rate!=1.0 else 'anull'
    raw=subprocess.run(['ffmpeg','-v','error','-i',f'{i}.mp3','-af',af,'-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw,np.float32).reshape(-1,2).copy()
cache={}
def get(i,rate=1.0):
    k=(i,rate)
    if k not in cache: cache[k]=load(i,rate)
    return cache[k]
def peak(a):
    env=np.abs(a).max(1); return int(np.argmax(env))
L=int(71.6*SR); out=np.zeros((L,2),np.float32)
def put(t,i,g,align='start',maxd=None,rate=1.0,fade=0.3):
    a=get(i,rate).copy()
    if maxd: 
        n=int(maxd*SR); a=a[:n]; fn=min(len(a),int(fade*SR)); a[-fn:]*=np.linspace(1,0,fn)[:,None]
    off=peak(a) if align=='peak' else 0
    s=int(t*SR)-off
    if s<0: a=a[-s:]; s=0
    e=min(L,s+len(a)); out[s:e]+=a[:e-s]*g
# 1-2 entradas
put(0.0,788,0.55,'peak',2.5); put(4.36,788,0.55,'peak',2.5)
# 3 pintura (ordem do código: norte->sul com sorteio; aqui espaçado igual)
for k in range(27): put(8.7+k/27*2.4+0.15,3000,0.10+0.04*(k%3),rate=0.9+0.2*((k*7)%5)/5)
# 4 barra e placar
put(9.05,2364,0.35); put(10.76,1109,0.4)
# 5 régua
for i in range(7): put(15.8+i*0.3+0.1,1109,0.35,rate=1+i*0.04)
put(17.95,2354,0.35)
# 6 apoios
for i in range(3): put(19.2+i*0.25,3005,0.5); put(20.6+i*0.1,1490,0.3,'peak',1.2)
# 7 três semanas
put(21.75,490,0.9); put(22.45,490,0.9); put(22.72,490,0.55); put(23.4,490,0.6)
put(22.0,1063,0.3,maxd=1.7)
# 8 votos aparecendo
put(23.8,2589,0.3,maxd=3.0,fade=1.0)
# 9 escada RJ/MG/SP
for t0,g,imp in [(26.0,0.45,2902),(29.0,0.55,2902),(31.5,0.7,2908)]:
    put(t0-0.3,1492,0.35,'peak'); put(t0+0.6,imp,g,'peak',2.0,fade=0.8)
# 10 todos os estados
put(34.4,2633,0.35)
# 11 10 milhões
put(37.2,1063,0.35,maxd=1.3); put(38.5,2900,0.55,'peak',2.5,fade=1.0)
# 12 mergulho em Minas
put(40.0,1486,0.4,'peak',3.0,fade=1.0)
# 13 Minas virando + VIROU
put(44.1,2826,0.25,maxd=1.8,fade=0.6); put(46.0,2182,0.8,'peak'); put(46.0,788,0.35,'peak',1.5)
# câmera NE e volta
put(47.9,1490,0.3,'peak'); put(50.6,1490,0.3,'peak')
# 14 nordeste 9/9
for i in range(9): put(48.3+i*0.17,2568,0.45,rate=1+i*0.07)
# 15 checks
for t0 in [50.75,53.05,54.5]: put(t0+0.05,2150,0.6,'peak')
put(53.4,1490,0.2,'peak'); put(54.9,1490,0.2,'peak')
# 16 e perdeu
put(58.1,498,0.9,'peak',3.0,fade=1.2)
# 17 placar final
put(59.7,1063,0.28,maxd=1.4); put(62.1,1063,0.28,maxd=1.4)
# 18 régua final + impacto
for i in range(8): put(66.0+i*0.06+0.1,1109,0.25,rate=1+i*0.04)
put(68.95,2900,0.65,'peak',3.0,fade=1.2)
m=np.abs(out).max(); print('peak',m)
if m>0.95: out*=0.95/m
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','-','-c:a','pcm_s16le','/home/user/w/sp3d/public/v/sfx.wav'],input=out.tobytes())
