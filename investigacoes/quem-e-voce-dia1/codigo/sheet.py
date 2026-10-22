import sys,glob,os
from PIL import Image, ImageDraw
names=sys.argv[2].split(',') if len(sys.argv)>2 else [x.split(':')[0] for x in open('frames.txt').read().split()]
W,H=270,480; cols=8
s=Image.new('RGB',(cols*W,((len(names)+cols-1)//cols)*(H+18)),(40,40,40)); d=ImageDraw.Draw(s)
for i,n in enumerate(names):
    im=Image.open(f'stills/{n}.jpg').resize((W,H)); x=(i%cols)*W; y=(i//cols)*(H+18)
    s.paste(im,(x,y+18)); d.text((x+4,y+3),n,fill='white')
s.save(sys.argv[1],quality=85); print(s.size)
