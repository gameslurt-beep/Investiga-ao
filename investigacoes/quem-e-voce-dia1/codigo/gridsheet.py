import sys
from PIL import Image, ImageDraw
names=sys.argv[2:]; out=sys.argv[1]
ims=[Image.open(f'rem/public/q/{n}.png') for n in names]
pad=30; H=max(i.height for i in ims)+pad+10; W=sum(i.width+pad for i in ims)+pad
s=Image.new('RGB',(W,H),(205,205,195)); d=ImageDraw.Draw(s); x=pad
for n,im in zip(names,ims):
    y=pad
    for gx in range(0,im.width+1,20):
        d.line([(x+gx,y),(x+gx,y+im.height)],fill=(170,170,160) if gx%100 else (230,120,120))
    for gy in range(0,im.height+1,20):
        d.line([(x,y+gy),(x+im.width,y+gy)],fill=(170,170,160) if gy%100 else (230,120,120))
    s.paste(im,(x,y),im)
    for gy in range(0,im.height+1,20):
        d.line([(x,y+gy),(x+im.width,y+gy)],fill=(150,150,140) if gy%100 else (230,90,90),width=1)
    for gx in range(0,im.width+1,20):
        d.line([(x+gx,y),(x+gx,y+im.height)],fill=(150,150,140) if gx%100 else (230,90,90),width=1)
    d.text((x,4),n,fill='black'); x+=im.width+pad
s.save(out,quality=88); print(s.size)
