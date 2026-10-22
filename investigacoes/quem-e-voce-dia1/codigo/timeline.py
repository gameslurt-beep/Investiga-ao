import json, sys
sys.path.insert(0,'/home/user/qv')
from lines import L
D={i:(v,t,disp) for i,v,t,disp in L}
seq=[('w0',0.3),('n1',1.0),('n2',0.2),('n3',0.35),('n4',0.7),('n5',0.25),('n6',0.75),('n7',0.3),('n8',0.3),('n9',0.3),
('n10',0.65),('n11',0.45),('n12',0.3),('n13',0.6),('n14',0.3),('n15',0.5),('n16',0.25),('n17',0.6),('n18',0.3),('n19',0.3),
('n20',0.7),('n21',0.35),('n22',0.75),('n23',0.6),('n24',0.5),('n25',0.8),('n26',0.3),('n27',0.3),('n28',0.75),('w0',1.3),
('n30',0.8),('n31',0.3),('n32',0.4),('n33',0.3),('n34',0.8),('n35',0.6),('n36',0.4)]
GS=0.78
t=0.0; out=[]; prev_end=0.0; k=0
for idx,(lid,gap) in enumerate(seq):
    w=json.load(open(f'audio/{lid}.json'))
    first=w[0]['s']; start=(prev_end+gap*GS) if idx else gap
    clip_at=start-first
    words=[{'w':x['w'],'s':round(clip_at+x['s'],3),'e':round(clip_at+x['s']+x['d'],3)} for x in w]
    # display tokens
    disp=D[lid][2]
    toks=[]
    if disp:
        wi=0
        for tok in disp.split():
            n=1
            if '|' in tok: tok,n=tok.split('|'); n=int(n)
            toks.append({'t':tok,'s':words[wi]['s'],'e':words[wi+n-1]['e']}); wi+=n
    else:
        # use original text tokens (keep punctuation) aligned 1:1 with boundaries
        txt=D[lid][1].split()
        if len(txt)!=len(words):
            print('MISMATCH',lid,len(txt),len(words),[x['w'] for x in words]); txt=[x['w'] for x in words]
        toks=[{'t':a,'s':b['s'],'e':b['e']} for a,b in zip(txt,words)]
    uid=lid if lid not in [o['id'] for o in out] else lid+'e'
    out.append({'id':uid,'clip':lid,'at':round(clip_at,3),'s':words[0]['s'],'e':words[-1]['e'],'toks':toks,'voice':D[lid][0]})
    prev_end=words[-1]['e']
total=prev_end+3.8
json.dump({'lines':out,'total':round(total,2)},open('rem/src/timeline.json','w'),ensure_ascii=False,indent=0)
print('total',round(total,2)); print(' '.join(f"{o['id']}@{o['s']:.1f}" for o in out))
