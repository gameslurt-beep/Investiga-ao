import json, math, os
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageChops
F='/mnt/project-files/sao-paulo-30dias/mapa-novo/projeto/fonte'; OUT='/home/user/w/sp3d/public/v'
geo=json.load(open(F+'/geo.json'))
K,LON0,LAT0=geo['tex']['k'],geo['tex']['lon0'],geo['tex']['lat0']
def px(lon,lat,z=6,x0=15,y0=28):
    n=2**z; x=(lon+180)/360*n; l=math.radians(lat)
    y=(1-math.log(math.tan(l)+1/math.cos(l))/math.pi)/2*n
    return ((x-x0)*256,(y-y0)*256)
def grade(im,blur):
    im=ImageEnhance.Color(im).enhance(0.85); im=ImageEnhance.Contrast(im).enhance(1.1)
    im=ImageEnhance.Brightness(im).enhance(1.25)
    r,g,b=im.split()
    sea=ImageChops.subtract(b,r).point(lambda v:min(255,v*4)).filter(ImageFilter.GaussianBlur(blur))
    return Image.composite(Image.new('RGB',im.size,(20,90,150)),im,sea.point(lambda v:int(v*0.55)))
grade(Image.open(F+'/br.jpg').convert('RGB'),3).save(OUT+'/br.jpg',quality=88)
grade(Image.open(F+'/se.jpg').convert('RGB'),8).save(OUT+'/se.jpg',quality=86)
W,H=3840,3584
st={}; cent={}
for s in geo['states']:
    rings=[[px(p[0]/K+LON0,p[1]+LAT0) for p in poly[0]] for poly in s['polys']]
    sg=s['sigla']; st[sg]=[[[round(x,1),round(y,1)] for x,y in r] for r in rings]
    m=Image.new('L',(W//2,H//2),0); d=ImageDraw.Draw(m)
    for r in rings: d.polygon([(x/2,y/2) for x,y in r],fill=255)
    bb=m.getbbox(); m=m.filter(ImageFilter.GaussianBlur(0.7))
    crop=m.crop(bb); rgba=Image.new('RGBA',crop.size,(255,255,255,0)); rgba.putalpha(crop)
    rgba.save(f'{OUT}/m_{sg}.png'); 
    big=max(rings,key=len); cx=sum(p[0] for p in big)/len(big); cy=sum(p[1] for p in big)/len(big)
    cent[sg]=dict(bb=[bb[0]*2,bb[1]*2,bb[2]*2,bb[3]*2],c=[round(cx,1),round(cy,1)])
# Brasil inteiro (para escurecer fora / brilho de borda)
m=Image.new('L',(W//2,H//2),0); d=ImageDraw.Draw(m)
for rs in st.values():
    for r in rs: d.polygon([(x/2,y/2) for x,y in r],fill=255)
bb=m.getbbox(); crop=m.crop(bb); rgba=Image.new('RGBA',crop.size,(255,255,255,0)); rgba.putalpha(crop); rgba.save(OUT+'/m_BR.png')
cent['BR']=dict(bb=[bb[0]*2,bb[1]*2,bb[2]*2,bb[3]*2])
CAP={'BSB':(-47.88,-15.79),'RJ':(-43.2,-22.9),'BH':(-43.94,-19.92),'SP':(-46.63,-23.55)}
se0=px(*[0,0]) # dummy
json.dump({'st':st,'info':cent,'cap':{k:px(*v) for k,v in CAP.items()},
  'se':[(87*256/4-15*256),(138*256/4-28*256),3840/4,2816/4]},open(OUT+'/geo.json','w'))
print('ok', cent['MG'], cent['BR'])
