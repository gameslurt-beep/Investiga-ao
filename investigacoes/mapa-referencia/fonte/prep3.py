import json, math, sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageEnhance
S='/tmp/claude-0/-home-user-Investiga-ao/98ff23f5-d99d-5549-9dc3-0af9e9a0570c/scratchpad'
OUT='/home/user/abertura/sp3d/public/mapa3'
geo=json.load(open(S+'/v30/sp3d/public/geo.json'))
K,LON0,LAT0=geo['tex']['k'],geo['tex']['lon0'],geo['tex']['lat0']
z,x0,y0=map(int,open(S+'/pr/br.jpg.txt').read().split())
src=Image.open(S+'/pr/br.jpg').convert('RGB')
W,H=src.size
def px(lon,lat):
    n=2**z; x=(lon+180)/360*n; l=math.radians(lat)
    y=(1-math.log(math.tan(l)+1/math.cos(l))/math.pi)/2*n
    return ((x-x0)*256,(y-y0)*256)
def grade(im,dark):
    im=ImageEnhance.Color(im).enhance(1.25-0.9*dark)
    if not dark: im=ImageEnhance.Brightness(im).enhance(1.12)
    im=ImageEnhance.Contrast(im).enhance(1.15)
    r,g,b=im.split()
    sea=ImageChops.subtract(b,r).point(lambda v:min(255,v*4)).filter(ImageFilter.GaussianBlur(3))
    im=Image.composite(Image.new('RGB',im.size,(6,9,16)),im,sea.point(lambda v:int(v*0.85)))
    if dark: im=Image.blend(im,Image.new('RGB',im.size,(4,6,12)),0.72*dark)
    return im
#grade(src,0).save(OUT+'/nat.jpg',quality=90)
#grade(src,0.8).save(OUT+'/dark.jpg',quality=90)
def dp(pts,eps):
    if len(pts)<3: return pts
    a,b=pts[0],pts[-1]; dx,dy=b[0]-a[0],b[1]-a[1]; L=math.hypot(dx,dy) or 1e-9
    i,dm=0,0
    for j in range(1,len(pts)-1):
        d=abs(dy*(pts[j][0]-a[0])-dx*(pts[j][1]-a[1]))/L
        if d>dm: i,dm=j,d
    if dm>eps: return dp(pts[:i+1],eps)[:-1]+dp(pts[i:],eps)
    return [a,b]
states={}
for s in geo['states']:
    rings=[]
    for poly in s['polys']:
        r=[px(p[0]/K+LON0,p[1]+LAT0) for p in poly[0]]
        h=len(r)//2
        r=dp(r[:h+1],0.8)[:-1]+dp(r[h:],0.8)
        if len(r)>=3: rings.append([[round(x,1),round(y,1)] for x,y in r])
    states[s['sigla']]=rings
for sig in ['SP','PI','MT','RS']:
    m=Image.new('L',(W//2,H//2),0); d=ImageDraw.Draw(m)
    for r in states[sig]: d.polygon([(x/2,y/2) for x,y in r],fill=255)
    m=m.filter(ImageFilter.GaussianBlur(2))
    rgba=Image.new('RGBA',m.size,(255,255,255,0)); rgba.putalpha(m)
    rgba.save(OUT+f'/mask_{sig}.png')
CAP={'Manaus':(-60.02,-3.1),'Belém':(-48.5,-1.45),'São Luís':(-44.3,-2.53),'Fortaleza':(-38.54,-3.72),'Teresina':(-42.8,-5.09),'Natal':(-35.2,-5.79),'João Pessoa':(-34.86,-7.12),'Recife':(-34.88,-8.05),'Maceió':(-35.73,-9.65),'Aracaju':(-37.07,-10.91),'Salvador':(-38.5,-12.97),'Palmas':(-48.33,-10.18),'Porto Velho':(-63.9,-8.76),'Rio Branco':(-67.81,-9.97),'Boa Vista':(-60.67,2.82),'Macapá':(-51.07,0.03),'Cuiabá':(-56.1,-15.6),'Campo Grande':(-54.62,-20.47),'Goiânia':(-49.25,-16.68),'Belo Horizonte':(-43.94,-19.92),'Vitória':(-40.31,-20.32),'Rio de Janeiro':(-43.2,-22.9),'Curitiba':(-49.27,-25.43),'Florianópolis':(-48.55,-27.6),'Porto Alegre':(-51.23,-30.03),'São Paulo':(-46.63,-23.55),'Brasília':(-47.88,-15.79)}
cap={k:[round(c,1) for c in px(*v)] for k,v in CAP.items()}
json.dump({'size':[W,H],'states':states,'cap':cap},open(OUT+'/geo3.json','w'),ensure_ascii=False)
print(sum(len(r) for v in states.values() for r in v), cap['São Paulo'], cap['Brasília'], W,H)
