import numpy as np, json, wave, sys
VOICE = len(sys.argv)>1 and sys.argv[1]=='guia'
OUT = sys.argv[2] if len(sys.argv)>2 else 'final.wav'
from scipy import signal
SR=48000
T=json.load(open('rem/src/timeline.json')); total=T['total']; N=int(total*SR)+SR
mix=np.zeros((N,2))
rng=np.random.default_rng(7)
def rd(p):
    w=wave.open(p); a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(float)/32768; return a
def add(x,t,gain=1.0,pan=0.0):
    i=int(t*SR); x=np.asarray(x)
    if x.ndim==1: x=np.stack([x*(1-max(pan,0)),x*(1+min(pan,0))],1)
    j=min(N,i+len(x)); 
    if j>i: mix[i:j]+=x[:j-i]*gain
def bp(x,lo,hi,o=4): return signal.sosfilt(signal.butter(o,[lo,hi],'band',fs=SR,output='sos'),x)
def lp(x,f,o=4): return signal.sosfilt(signal.butter(o,f,'low',fs=SR,output='sos'),x)
def hp(x,f,o=4): return signal.sosfilt(signal.butter(o,f,'high',fs=SR,output='sos'),x)
def env(n,a,r): 
    e=np.ones(n); ka=int(a*SR); kr=int(r*SR)
    if ka: e[:ka]=np.linspace(0,1,ka)
    if kr: e[-kr:]*=np.linspace(1,0,kr)
    return e
def reverb(x,decay=1.2,mixw=0.3):
    n=int(decay*SR); ir=rng.standard_normal(n)*np.exp(-np.linspace(0,7,n)); ir=lp(ir,5000)
    w=signal.fftconvolve(x,ir)[:len(x)+n]; w/=np.max(np.abs(w))+1e-9
    y=np.zeros(len(w)); y[:len(x)]+=x; return y*(1-mixw)+w*mixw*np.max(np.abs(x))
# whisper: random-phase STFT of the female TTS
def whisper(x):
    f,t,Z=signal.stft(x,SR,nperseg=1024)
    mag=np.abs(Z); ph=np.exp(1j*rng.uniform(0,2*np.pi,Z.shape))
    _,y=signal.istft(mag*ph,SR,nperseg=1024)
    y=hp(y,250); y=bp(y,250,9000,2)
    y=0.75*y/np.max(np.abs(y))+0.25*x/np.max(np.abs(x))*0.6
    return y/np.max(np.abs(y))
L={o['id']:o for o in T['lines']}
for o in (T['lines'] if VOICE else []):
    x=rd(f"audio/{o['clip']}.wav")
    if o['clip']=='w0':
        w=whisper(x)
        if o['id']=='w0e': w=reverb(w,1.6,0.35); add(w,o['at'],0.62,0.15)
        else: add(reverb(w,0.8,0.15),o['at'],0.7)
    else:
        add(x/np.max(np.abs(x))*0.9,o['at'],0.95)
def W(lid,k): return L[lid]['toks'][k]
# ---- sfx makers
def buzz(d=0.42):
    n=int(d*SR); t=np.arange(n)/SR; s=signal.square(2*np.pi*165*t)*0.5+np.sin(2*np.pi*330*t)*0.3
    am=(np.sin(2*np.pi*28*t)>-0.2)*1.0; return lp(s*am,1800)*env(n,0.01,0.05)*0.5
def vib(t0): add(buzz(),t0,0.55); add(buzz(),t0+0.55,0.55)
def click():
    n=int(0.04*SR); x=rng.standard_normal(n)*np.exp(-np.linspace(0,30,n)); return hp(x,1500)*0.8
def step():
    n=int(0.18*SR); x=rng.standard_normal(n)*np.exp(-np.linspace(0,18,n)); return lp(x,350)*1.2
def tick():
    n=int(0.09*SR); t=np.arange(n)/SR; return np.sin(2*np.pi*1650*t)*np.exp(-t*60)*0.35
def hiss(d=1.1):
    n=int(d*SR); x=bp(rng.standard_normal(n),1800,9000); t=np.arange(n)/SR
    e=np.minimum(1,t/0.04)*np.exp(-np.maximum(0,t-0.5)*3.2)
    g=np.sin(2*np.pi*95*t)*bp(rng.standard_normal(n),80,400)*0.6
    return (x*0.7+g*0.5)*e
def growl(d=1.4):
    n=int(d*SR); t=np.arange(n)/SR; x=bp(rng.standard_normal(n),70,320)*(0.6+0.4*np.sin(2*np.pi*22*t)); return x*env(n,0.3,0.4)*1.4
def scurry(d=0.6):
    out=np.zeros(int(d*SR))
    for k in range(7):
        s=step()*0.5; i=int(k*d/7*SR); out[i:i+len(s)]+=s[:len(out)-i]
    return hp(out,200)
def drawer(d=0.55):
    n=int(d*SR); t=np.arange(n)/SR; x=bp(rng.standard_normal(n),180,2600)*(0.6+0.4*np.sin(2*np.pi*31*t)); return x*env(n,0.03,0.12)*0.6
def glitch(d=0.35):
    n=int(d*SR); x=np.zeros(n); i=0
    while i<n:
        L_=int(rng.uniform(0.01,0.05)*SR); f=rng.uniform(200,3000); tt=np.arange(L_)/SR
        seg=signal.square(2*np.pi*f*tt)*0.3 if rng.random()<0.5 else rng.standard_normal(L_)*0.35
        x[i:i+L_]=seg[:n-i]; i+=L_+int(rng.uniform(0,0.02)*SR)
    return x
def breath(d):
    n=int(d*SR); t=np.arange(n)/SR; x=bp(rng.standard_normal(n),350,2200)
    e=np.clip(np.sin(2*np.pi*t/1.9),0,1)**1.6*(0.7+0.3*np.clip(np.sin(2*np.pi*t/1.9+3.1),0,1))
    return x*e*np.minimum(1,t/1.0)*0.55
def riser(d):
    n=int(d*SR); t=np.arange(n)/SR; x=rng.standard_normal(n); out=np.zeros(n); 
    for k in range(8):
        a=k*n//8; b=(k+1)*n//8; fc=300*(2**(k*0.55)); out[a:b]=bp(x,fc,min(fc*2.5,16000),2)[a:b]
    return out*(t/d)**2*0.8
def boom():
    n=int(2.4*SR); t=np.arange(n)/SR; f=55*np.exp(-t*0.6)+30
    s=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*1.4); s+=lp(rng.standard_normal(n),900)*np.exp(-t*9)*0.7
    return s*1.1
def creak(d=0.8):
    n=int(d*SR); t=np.arange(n)/SR; f=420+120*np.sin(2*np.pi*1.3*t)
    s=signal.sawtooth(2*np.pi*np.cumsum(f)/SR)*(0.5+0.5*(np.sin(2*np.pi*38*t)>0.3)); return bp(s,500,3500)*env(n,0.05,0.2)*0.25
def whoosh(d=0.5):
    n=int(d*SR); x=bp(rng.standard_normal(n),600,5000); t=np.arange(n)/SR; return x*np.sin(np.pi*t/d)**2*0.45
def scribble(d=1.4):
    n=int(d*SR); x=bp(rng.standard_normal(n),2500,9000); t=np.arange(n)/SR
    e=(np.sin(2*np.pi*7*t)>0)*0.6+0.4; return x*e*env(n,0.05,0.3)*0.25
def siren(d):
    n=int(d*SR); t=np.arange(n)/SR; f=850+330*np.sin(2*np.pi*t/2.6)
    s=np.sin(2*np.pi*np.cumsum(f)/SR)+0.4*np.sin(2*np.pi*2*np.cumsum(f)/SR)
    s=lp(s,1600); return reverb(s,1.4,0.6)[:n]*np.minimum(1,t/2.0)*0.22
# ---- drone bed
t=np.arange(N)/SR
def ramp(points):
    xs=[p[0] for p in points]; ys=[p[1] for p in points]; return np.interp(t,xs,ys)
inten=ramp([(0,0.35),(5,0.25),(L['n5']['s'],0.45),(L['n10']['s'],0.5),(L['n17']['s'],0.65),(L['n22']['s'],0.7),(L['n27']['s'],1.0),(L['n28']['s'],1.0),(L['n28']['s']+0.01,0.0),(L['w0e']['s'],0.25),(L['n34']['s'],0.45),(total,0.3)])
dr=(np.sin(2*np.pi*48*t)+0.6*np.sin(2*np.pi*72.3*t+1)+0.3*np.sin(2*np.pi*96.7*t))*(0.6+0.4*np.sin(2*np.pi*t/7))
room=lp(rng.standard_normal(N),500)*0.5
bed=(lp(dr,300)*0.22+room*0.25)*inten
mix[:,0]+=bed; mix[:,1]+=np.roll(bed,240)
# ---- place sfx
wtok=L['w0']['toks']; vib(wtok[2]['e']+0.12)              # notification buzz in hook
add(click(),L['n3']['s']+0.35,0.7)                         # flashlight on
vib(L['n4']['s']+0.1)
for k in range(10): add(step(),L['n6']['s']+k*0.62,0.32,(-0.2 if k%2 else 0.2))
for lid in ['n7','n8','n9']: add(tick(),L[lid]['s']-0.05,0.5)
add(growl(),L['n10']['s']+0.8,0.5)
add(hiss(),L['n11']['s']-0.15,0.75)
add(scurry(),L['n12']['e']+0.05,0.6)
add(drawer(),L['n15']['s']+0.3,0.7,-0.2); add(drawer(),L['n16']['s']+0.1,0.7,0.2)
add(glitch(0.4),L['n17']['s']-0.35,0.45); add(glitch(0.3),L['n18']['s']+0.4,0.4)
add(drawer(0.5),L['n20']['toks'][2]['s'],0.5)
add(breath(L['n25']['s']-L['n22']['s']+0.5),L['n22']['s']+0.2,0.55,0.25)
vib(L['n25']['s']-0.25)
add(glitch(0.25),L['n26']['e']+0.1,0.4)
add(riser(L['n28']['s']-L['n27']['s']),L['n27']['s'],0.55)
add(glitch(0.5),L['n27']['e']-0.2,0.5)
add(boom(),L['n28']['s']-0.02,0.9)
add(creak(),L['n30']['s']+0.5,0.6)
add(whoosh(),L['n32']['toks'][3]['e']+0.15,0.6)
add(scribble(),L['n33']['s'],0.6)
add(siren(total-L['n34']['s']+0.3),L['n34']['s']-0.3,1.0,0.3)
add(boom()*0.5,L['n36']['e']+0.45,0.5)
# ---- master
mix=mix[:int(total*SR)]
peak=np.max(np.abs(mix)); mix=np.tanh(mix/peak*1.15)*0.89
w=wave.open(OUT,'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((mix*32767).astype(np.int16).tobytes()); w.close()
print('ok',total,round(peak,2))
