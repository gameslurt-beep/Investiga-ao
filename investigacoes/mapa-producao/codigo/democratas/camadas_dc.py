import json,sys
sys.argv=['x']
src=open('/tmp/claude-0/dem/tiles_b.py').read().split('meta={}')[0]
exec(src)
mm=json.load(open('/tmp/claude-0/dem/sp3d/public/meta.json'))
for name,z,a,b,c,d in [('LW8',8,-79.6,40.6,-74.6,37.4),('LW10',10,-77.7,39.3,-76.4,38.6),('LW13',13,-77.14,38.95,-76.93,38.85)]:
    m=layer(name,z,a,b,c,d); print(name,m); mm[name]=m
    import shutil; shutil.copy(f'/home/user/w/tiles/{name}.jpg',f'/tmp/claude-0/dem/sp3d/public/{name}.jpg')
json.dump(mm,open('/tmp/claude-0/dem/sp3d/public/meta.json','w'))
