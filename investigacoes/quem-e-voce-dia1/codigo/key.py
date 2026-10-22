import numpy as np, json
from PIL import Image, ImageDraw
from scipy import ndimage
S='src/'; O='rem/public/q/'
import os; os.makedirs(O,exist_ok=True)
def key(name):
    a=np.asarray(Image.open(S+name+'.jpg').convert('RGB')).astype(float)
    r,g,b=a[...,0],a[...,1],a[...,2]
    gd=g-np.maximum(r,b)
    alpha=np.clip(1-(gd-22)/55,0,1)
    g2=np.where(gd>0,np.maximum(r,b),g)
    return np.dstack([r,g2,b,alpha*255]).astype(np.uint8)
meta={}; sheet=[]
def pieces(name,minsize=600,merge=4):
    out=key(name); m=out[...,3]>128
    lab,k=ndimage.label(ndimage.binary_dilation(m,iterations=merge))
    res=[]
    for i,o in enumerate(ndimage.find_objects(lab)):
        mm=(lab[o]==i+1)&m[o]
        if mm.sum()<minsize: continue
        c=out[o].copy(); keep=ndimage.binary_dilation(mm,iterations=2)
        c[...,3]=np.where(keep,c[...,3],0)
        res.append((o,c))
    return res
def save(c,n,o=None):
    ys,xs=np.where(c[...,3]>60); y0,x0=ys.min(),xs.min(); c=c[y0:ys.max()+1,x0:xs.max()+1]
    Image.fromarray(c).save(O+n+'.png'); meta[n]={'w':int(c.shape[1]),'h':int(c.shape[0])}
    if o is not None: meta[n].update({'x':int(o[1].start+x0),'y':int(o[0].start+y0)})
    sheet.append(n)
def rowsort(res,rowh):
    return sorted(res,key=lambda t:(round(((t[0][0].start+t[0][0].stop)/2)/rowh), t[0][1].start))
for name,pref,rowh in [('hands8','h8_',250),('hands4','h4_',300),('poses','pose',300),('side','side',90),('back','back',90),('catparts','catp',150),('catposes','cat',250),('props','prop',200)]:
    for j,(o,c) in enumerate(rowsort(pieces(name),rowh)):
        save(c,f'{pref}{j}',o)
json.dump(meta,open('rem/src/qmeta.json','w'),indent=0)
W=150;ims=[]
for n in sheet:
    im=Image.open(O+n+'.png'); bg=Image.new('RGB',(W,W+14),(90,90,105)); im.thumbnail((W-4,W-4)); bg.paste(im,((W-im.size[0])//2,14),im); ImageDraw.Draw(bg).text((3,1),f"{n} {meta[n]['w']}x{meta[n]['h']}",fill='white'); ims.append(bg)
cols=10; s=Image.new('RGB',(W*cols,(W+14)*((len(ims)+cols-1)//cols)),(30,30,30))
for i,im in enumerate(ims): s.paste(im,((i%cols)*W,(i//cols)*(W+14)))
s.save('q_sheet.jpg',quality=85); print(len(sheet))
