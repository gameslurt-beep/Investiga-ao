import sys,glob,numpy as np
from PIL import Image, ImageFilter
src,out,name=sys.argv[1],sys.argv[2],sys.argv[3]
a=np.array(Image.open(src).convert('RGB')).astype(float)
h,w,_=a.shape
bg=np.median(np.concatenate([a[:40,:].reshape(-1,3),a[-40:,:].reshape(-1,3),a[:,:40].reshape(-1,3),a[:,-40:].reshape(-1,3)]),0)
# distância de cor + saturação (peças coloridas) — fundo é cinza neutro
d=np.sqrt(((a-bg)**2).sum(2))
sat=a.max(2)-a.min(2)
m=np.clip((d-14)/22,0,1)
m=np.maximum(m,np.clip((sat-18)/20,0,1))
M=Image.fromarray((m*255).astype('uint8')).filter(ImageFilter.MedianFilter(5))
# preenche buracos internos: fecha
M=M.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
im=Image.open(src).convert('RGBA'); im.putalpha(M)
bb=M.point(lambda v:255 if v>40 else 0).getbbox()
im=im.crop(bb)
# quadrado com a base embaixo
S=max(im.size)+20; c=Image.new('RGBA',(S,S),(0,0,0,0)); c.paste(im,((S-im.size[0])//2,S-im.size[1]-10)); c=c.resize((400,400),Image.LANCZOS)
c.save(f'{out}/{name}.png'); print(name,bg.round(),bb)
