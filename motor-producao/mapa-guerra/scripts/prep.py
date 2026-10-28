import json, math, sys, os, subprocess
from PIL import Image, ImageEnhance, ImageChops, ImageFilter
W=sys.argv[1]; OUT=W+'/sp3d/public/g'
N=4096
def px(lon,lat):
    lat=max(-85,min(85,lat)); l=math.radians(lat)
    return ((lon+180)/360*N, (1-math.log(math.tan(l)+1/math.cos(l))/math.pi)/2*N)
Y0=int(px(0,78)[1]); Y1=int(px(0,-58)[1])
# mapa vivo: mar turquesa, terra mais clara e saturada
im=Image.open(W+'/fonte/mundo4.jpg').convert('RGB').crop((0,Y0,N,Y1))
from PIL import ImageDraw
ne0=json.load(open(W+'/fonte/ne50.geojson'))
lm=Image.new('L',im.size,0); dd=ImageDraw.Draw(lm)
for f in ne0['features']:
    g=f['geometry']; polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
    for poly in polys:
        pts=[px(q[0],q[1]) for q in poly[0]]
        if max(x for x,_ in pts)-min(x for x,_ in pts)>N*0.5: continue
        dd.polygon([(x,y-Y0) for x,y in pts],fill=255)
r,g,b=im.split()
seaPix=ImageChops.subtract(b,r).point(lambda v:255 if v>8 else 0)
sea=ImageChops.multiply(lm.point(lambda v:255-v), seaPix).filter(ImageFilter.GaussianBlur(1.5))
sea=ImageChops.lighter(sea, lm.point(lambda v:255-v).filter(ImageFilter.MinFilter(9)).filter(ImageFilter.GaussianBlur(3)))
land=ImageEnhance.Brightness(ImageEnhance.Color(im).enhance(1.35)).enhance(1.35)
land=ImageEnhance.Contrast(land).enhance(1.08)
# mar: gradiente turquesa preservando relevo do fundo
seaimg=ImageEnhance.Brightness(im).enhance(2.2)
tint=Image.new('RGB',im.size,(26,140,190))
seaimg=Image.blend(seaimg,tint,0.62)
out=Image.composite(seaimg,land,sea)
out.save(OUT+'/mundo.jpg',quality=90)
out.resize((1024,int(1024*out.size[1]/N))).save(W+'/fonte/mundo_vivo_prev.jpg')
ne=json.load(open(W+'/fonte/ne50.geojson'))
CONT={'Asia':'AS','Europe':'EU','Africa':'AF','North America':'NA','South America':'SA','Oceania':'OC'}
def contOf(f, lon, lat):
    p=f['properties']; c=p['CONTINENT']; iso=p['ISO_A2_EH'] if p.get('ISO_A2_EH','-99')!='-99' else p['ISO_A2']
    if iso=='RU': return 'AS'
    k=CONT.get(c)
    if k=='EU' and lon<-30: return 'SA' if lat<15 else 'NA'
    if k=='EU' and lon>100: return 'OC'
    return k
def simp(pts,tol=0.8):
    o=[pts[0]]
    for p in pts[1:]:
        if math.hypot(p[0]-o[-1][0],p[1]-o[-1][1])>=tol: o.append(p)
    return o
countries=[]
for f in ne['features']:
    p=f['properties']; iso=(p['ISO_A2_EH'] if p.get('ISO_A2_EH','-99')!='-99' else p['ISO_A2']).lower()
    g=f['geometry']; polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
    parts={}
    for poly in polys:
        ring=poly[0]; lon=sum(q[0] for q in ring)/len(ring); lat=sum(q[1] for q in ring)/len(ring)
        k=contOf(f,lon,lat)
        if not k: continue
        pts=[px(q[0],q[1]) for q in ring]
        pts=[(x,y-Y0) for x,y in pts]
        # anti-meridiano (Rússia/Fiji): descarta polígonos que cruzam
        if max(x for x,_ in pts)-min(x for x,_ in pts)>N*0.5: continue
        pts=simp(pts)
        if len(pts)<3: continue
        a=0
        for i in range(len(pts)): a+=pts[i-1][0]*pts[i][1]-pts[i][0]*pts[i-1][1]
        if abs(a)/2<6: continue
        parts.setdefault(k,[]).append('M'+'L'.join(f'{x:.1f},{y:.1f}' for x,y in pts)+'Z')
    for k,ds in parts.items():
        countries.append(dict(iso=iso,name=p['NAME'],c=k,d=''.join(ds)))
json.dump(dict(W=N,H=Y1-Y0,Y0=Y0,countries=countries),open(OUT+'/world.json','w'))
from collections import Counter
print(Counter(c['c'] for c in countries)); print('H',Y1-Y0, 'size', os.path.getsize(OUT+'/world.json'))
asia=sorted(set(c['iso'] for c in countries if c['c']=='AS'))
open(W+'/fonte/asia.txt','w').write(' '.join(asia)); print(asia)
