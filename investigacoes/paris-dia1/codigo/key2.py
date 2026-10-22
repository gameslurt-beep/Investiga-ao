import numpy as np, json, sys
from PIL import Image, ImageDraw
from scipy import ndimage
S='src3/'; O='rem/public/q/'
import os; os.makedirs(O,exist_ok=True)
def key(name):
    a=np.asarray(Image.open(S+name+'.jpg').convert('RGB')).astype(float)
    r,g,b=a[...,0],a[...,1],a[...,2]
    gd=g-np.maximum(r,b)
    alpha=np.clip(1-(gd-25)/60,0,1)
    g2=np.where(gd>0,np.maximum(r,b),g)
    return np.dstack([r,g2,b,alpha*255]).astype(np.uint8)
meta={}
def pieces(name,minsize=800,merge=6):
    out=key(name); m=out[...,3]>128
    lab,k=ndimage.label(ndimage.binary_dilation(m,iterations=merge))
    res=[]
    for i,o in enumerate(ndimage.find_objects(lab)):
        mm=(lab[o]==i+1)&m[o]
        if mm.sum()<minsize: continue
        c=out[o].copy(); c[...,3]=np.where(mm|ndimage.binary_dilation(mm,iterations=1),c[...,3],0)
        res.append((o,c))
    return res
sheet=[]
def save(c,n):
    ys,xs=np.where(c[...,3]>100); c=c[ys.min():ys.max()+1,xs.min():xs.max()+1]
    Image.fromarray(c).save(O+n+'.png'); meta[n]={'w':int(c.shape[1]),'h':int(c.shape[0])}; sheet.append(n)
def rowsort(res,rowh=120):
    return sorted(res,key=lambda t:(round(((t[0][0].start+t[0][0].stop)/2)/rowh), t[0][1].start))
for name,pref,rowh in [('poses','pose',200),('cat1','cat',200),('cat2','catb',200),('tiny','tiny',100),('props','prop',200)]:
    for j,(o,c) in enumerate(rowsort(pieces(name),rowh)):
        save(c,f'{pref}{j}')
for name in ['lean','hand','backhead']:
    save(key(name),name)
json.dump(meta,open('rem/src/qmeta.json','w'),indent=0)
# labelled contact sheet
W=160;ims=[]
for n in sheet:
    im=Image.open(O+n+'.png'); bg=Image.new('RGB',(W,W+16),(60,60,70)); im.thumbnail((W,W)); bg.paste(im,((W-im.size[0])//2,16),im); ImageDraw.Draw(bg).text((3,2),n,fill='white'); ims.append(bg)
cols=10; s=Image.new('RGB',(W*cols,(W+16)*((len(ims)+cols-1)//cols)))
for i,im in enumerate(ims): s.paste(im,((i%cols)*W,(i//cols)*(W+16)))
s.save('q_sheet.jpg'); print(len(sheet))
save(key('arm'),'arm')
bk=key('backs')
for j,(x0,x1) in enumerate([(0,208),(208,393),(393,573),(573,768)]):
    c=bk[:,x0:x1].copy(); save(c,f'back{j}')
json.dump(meta,open('rem/src/qmeta.json','w'),indent=0)
print({k:meta[k] for k in meta if k.startswith(('arm','back'))})
save(key('wardrobe'),'wardrobe')
pk=key('person2')
save(pk[:, :400].copy(),'pback'); save(pk[:, 400:].copy(),'pprofile')
for j,(o,c) in enumerate(rowsort(pieces('crowd45',merge=2),150)):
    save(c,f'c45_{j}')
json.dump(meta,open('rem/src/qmeta.json','w'),indent=0)
print(len([k for k in meta if k.startswith('c45')]), meta['wardrobe'], meta['pback'], meta['pprofile'])
