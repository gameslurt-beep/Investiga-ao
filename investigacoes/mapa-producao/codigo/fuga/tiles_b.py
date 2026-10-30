import math, os, sys, json, concurrent.futures as cf, urllib.request, io
from PIL import Image, ImageEnhance, ImageChops, ImageFilter
import numpy as np
S2='https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg'
BM='https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png'
C='/home/user/w/tiles/cache'; os.makedirs(C,exist_ok=True)
def tx(lon,z): return (lon+180)/360*2**z
def ty(lat,z):
    l=math.radians(lat); return (1-math.log(math.tan(l)+1/math.cos(l))/math.pi)/2*2**z
def get(url,z,x,y):
    f=f'{C}/{"bm" if "gibs" in url else "s2"}_{z}_{x}_{y}'
    if not os.path.exists(f):
        for i in range(4):
            try:
                d=urllib.request.urlopen(url.format(z=z,x=x,y=y),timeout=30).read(); open(f,'wb').write(d); break
            except Exception as e: err=e
    return Image.open(f).convert('RGB')
def mosaic(url,z,x0,x1,y0,y1):
    im=Image.new('RGB',((x1-x0+1)*256,(y1-y0+1)*256))
    jobs={}
    with cf.ThreadPoolExecutor(16) as ex:
        for x in range(x0,x1+1):
            for y in range(y0,y1+1): jobs[(x,y)]=ex.submit(get,url,z,x,y)
    for (x,y),j in jobs.items(): im.paste(j.result(),((x-x0)*256,(y-y0)*256))
    return im
def layer(name,z,lonA,latA,lonB,latB,bmz=None,LI=0.0):
    x0,x1=int(tx(lonA,z)),int(tx(lonB,z)); y0,y1=int(ty(latA,z)),int(ty(latB,z))
    s2=mosaic(S2,z,x0,x1,y0,y1)
    bz=min(z,8) if bmz is None else bmz; k=2**(z-bz)
    bx0,by0=x0//k,y0//k; bx1,by1=x1//k,y1//k
    bm=mosaic(BM,bz,bx0,bx1,by0,by1)
    bm=bm.resize((bm.width*k,bm.height*k),Image.BICUBIC).crop(((x0-bx0*k)*256,(y0-by0*k)*256,(x0-bx0*k)*256+s2.width,(y0-by0*k)*256+s2.height))
    a=np.asarray(s2).astype(np.float32)/255; b=np.asarray(bm).astype(np.float32)/255
    # sea mask from s2 (blue dominance)
    sea=np.clip((a[...,2]-a[...,0])*4,0,1)
    sea=np.asarray(Image.fromarray((sea*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32)/255
    lum=a.mean(-1,keepdims=True)
    land=np.clip((a*0.5+lum*0.12)*1.75-0.03,0,1)            # muted land
    land=land*np.array([0.62,0.72,0.95])  # moonlight blue
    out=land*(1-sea[...,None]*0.85)+np.array([0.015,0.03,0.06])*sea[...,None]*0.85
    lights=np.clip((b.max(-1,keepdims=True)-0.12)*1.6,0,1)
    out=out+lights*np.array([1.0,0.78,0.45])*LI
    out=np.clip(out,0,1)
    Image.fromarray((out*255).astype(np.uint8)).save(f'/home/user/w/tiles/{name}.jpg',quality=88)
    return dict(z=z,x0=x0,y0=y0,w=s2.width,h=s2.height)
meta={}
m=layer('LB',10,-48.15,-15.62,-47.62,-15.98)
print(m)
import shutil; shutil.copy('/home/user/w/tiles/LB.jpg','sp3d/public/LB.jpg')
mm=json.load(open('sp3d/public/meta.json')); mm['LB']=m; json.dump(mm,open('sp3d/public/meta.json','w'))
