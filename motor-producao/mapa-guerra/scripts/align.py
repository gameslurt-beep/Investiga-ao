import json,re,sys,difflib,unicodedata
W=sys.argv[1]
txt=open('/mnt/project-files/guerra-continentes/roteiro-reallifelore.md').read().split('\n',3)[3]
sw=txt.split()
ww=json.load(open(W+'/audio/words.json'))
n=lambda s: unicodedata.normalize('NFKD',re.sub(r'[^\wÀ-ú]','',s.lower())).encode('ascii','ignore').decode()
a=[n(x) for x in sw]; b=[n(x[0]) for x in ww]
sm=difflib.SequenceMatcher(None,a,b,autojunk=False)
T=[None]*len(sw)
for tag,i1,i2,j1,j2 in sm.get_opcodes():
    if tag=='equal' or (i2-i1==j2-j1):
        for k in range(i2-i1): T[i1+k]=(ww[j1+k][1],ww[j1+k][2])
    else:
        s=ww[j1][1] if j1<len(ww) else ww[-1][2]; e=ww[j2-1][2] if j2>j1 else s
        for k in range(i2-i1): T[i1+k]=(s+(e-s)*k/(i2-i1), s+(e-s)*(k+1)/(i2-i1))
out=[dict(w=w,s=round(t[0],2),e=round(t[1],2)) for w,t in zip(sw,T)]
json.dump(out,open(W+'/sp3d/public/g/words.json','w'),ensure_ascii=False)
for o in out: print(o['s'],o['w'],end=' | ')
