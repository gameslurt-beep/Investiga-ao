import json,sys,shutil
sys.argv=['x']
src=open('/tmp/claude-0/dem/tiles_b.py').read().split('meta={}')[0]
exec(src)
mm=json.load(open('/tmp/claude-0/dem/sp3d/public/meta.json'))
m=layer('L3',3,-170,70,30,-66); print(m); mm['L3']=m
shutil.copy('/home/user/w/tiles/L3.jpg','/tmp/claude-0/dem/sp3d/public/L3.jpg')
json.dump(mm,open('/tmp/claude-0/dem/sp3d/public/meta.json','w'))
