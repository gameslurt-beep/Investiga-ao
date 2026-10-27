import json, math, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageChops
F='/mnt/project-files/sao-paulo-30dias/mapa-novo/projeto/fonte'
OUT=sys.argv[1]
geo=json.load(open(F+'/geo.json'))
K,LON0,LAT0=geo['tex']['k'],geo['tex']['lon0'],geo['tex']['lat0']
z,x0,y0=map(int,open(F+'/br.jpg.txt').read().split())
src=Image.open(F+'/br.jpg').convert('RGB')
def px(lon,lat):
    n=2**z; x=(lon+180)/360*n; l=math.radians(lat)
    y=(1-math.log(math.tan(l)+1/math.cos(l))/math.pi)/2*n
    return ((x-x0)*256,(y-y0)*256)
# Lula share (%) por UF, 2º turno 2026 (Bloomberg Línea / TSE)
L={'AC':33.43,'AP':52.88,'AM':54.02,'PA':55.02,'RO':30.39,'RR':27.54,'TO':48.63,'AL':60.77,'BA':71.31,'CE':68.93,'MA':69.54,'PB':67.46,'PE':69.2,'PI':75.88,'RN':65.72,'SE':69.53,'DF':45.72,'GO':40.34,'MT':33.94,'MS':40.4,'ES':43.63,'MG':50.43,'RJ':46.9,'SP':46.15,'PR':37.42,'RS':42.16,'SC':30.58}
# enquadramento 9:16
W,H=1080,1920
lonA,lonB,latA,latB=-74.5,-33.5,6.5,-34.5
(ax,ay),(bx,by)=px(lonA,latA),px(lonB,latB)
s=W*0.98/(bx-ax); cy=(ay+by)/2; ch=H/s; cx=(ax+bx)/2
top=max(0,cy-ch/2+60/s)
box=(cx-W/s/2,top,cx+W/s/2,top+ch)
base=src.crop(tuple(int(v) for v in box)).resize((W,H),Image.LANCZOS)
def T(p): return ((p[0]-box[0])*s,(p[1]-box[1])*s)
# grade: mar escuro, terra levemente dessaturada
im=ImageEnhance.Color(base).enhance(0.85); im=ImageEnhance.Contrast(im).enhance(1.1)
r,g,b=im.split()
sea=ImageChops.subtract(b,r).point(lambda v:min(255,v*4)).filter(ImageFilter.GaussianBlur(3))
im=Image.composite(Image.new('RGB',im.size,(5,10,20)),im,sea.point(lambda v:int(v*0.8)))
# rótulos de estado
lab=np.zeros((H,W),np.int16); polys={}
for i,st in enumerate(geo['states']):
    m=Image.new('L',(W,H),0); d=ImageDraw.Draw(m); rings=[]
    for poly in st['polys']:
        rr=[T(px(p[0]/K+LON0,p[1]+LAT0)) for p in poly[0]]
        d.polygon(rr,fill=255); rings.append(rr)
    polys[st['sigla']]=rings
    lab[np.array(m)>127]=i+1
sig=[st['sigla'] for st in geo['states']]
br=lab>0
basef=np.asarray(im).astype(np.float32)/255
# fora do Brasil: escurece um pouco
dim=np.where(br[...,None],1.0,0.55)
basef=basef*dim
RED=np.array([0.86,0.12,0.16]); BLUE=np.array([0.16,0.36,0.92])
col=np.zeros((H,W,3),np.float32); strength=np.zeros((H,W),np.float32)
for i,sg in enumerate(sig):
    m=lab==i+1; v=L[sg]; win=RED if v>50 else BLUE
    marg=abs(v-50)/26  # 0..~1
    col[m]=win; strength[m]=min(1,0.35+marg)
# divisas
lines=Image.new('L',(W,H),0); d=ImageDraw.Draw(lines)
for rings in polys.values():
    for rr in rings: d.line(rr+[rr[0]],fill=255,width=2,joint='curve')
ln=np.asarray(lines).astype(np.float32)/255
lnglow=np.asarray(lines.filter(ImageFilter.GaussianBlur(6))).astype(np.float32)/255
outer=Image.fromarray((br*255).astype(np.uint8)).filter(ImageFilter.FIND_EDGES).filter(ImageFilter.MaxFilter(3))
og=np.asarray(outer.filter(ImageFilter.GaussianBlur(10))).astype(np.float32)/255
# centro do pulso: Brasília
bx_,by_=T(px(-47.88,-15.79))
yy,xx=np.mgrid[0:H,0:W]; dist=np.hypot(xx-bx_,yy-by_)/900
# distância dentro de cada estado até a borda (para brilho de borda interno)
fps=30; N=int(sys.argv[2]) if len(sys.argv)>2 else 180
def beat(t):  # batida dupla tum-tum a cada 1.6 s
    ph=t%1.6
    return math.exp(-((ph-0.05)/0.07)**2)+0.6*math.exp(-((ph-0.32)/0.08)**2)
p=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(fps),'-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','17','-preset','medium',OUT],stdin=subprocess.PIPE)
for f in range(N):
    t=f/fps
    # onda que sai de Brasília: atraso pela distância
    tt=t-dist*0.55
    ph=np.mod(tt,1.6)
    b=np.exp(-((ph-0.05)/0.07)**2)+0.6*np.exp(-((ph-0.32)/0.08)**2)
    a=(0.62+0.18*strength)*br + 0.16*b*br*strength
    a=a[...,None]
    out=basef*(1-a)+col*a*(0.9+0.35*b[...,None])
    # brilho de borda
    out+= (ln[...,None]*0.75 + lnglow[...,None]*(0.25+0.35*b[...,None]))*br[...,None]
    out+= og[...,None]*np.array([0.9,0.95,1.0])*(0.35+0.25*b[...,None])
    out=np.clip(out,0,1)
    p.stdin.write((out*255).astype(np.uint8).tobytes())
    if f==0: Image.fromarray((out*255).astype(np.uint8)).save(OUT.replace('.mp4','.png'))
p.stdin.close(); p.wait()
