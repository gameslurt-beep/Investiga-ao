import numpy as np, json
from faster_whisper import WhisperModel
a=np.fromfile('/tmp/claude-0/dem/narr16.raw',dtype=np.float32)
m=WhisperModel('small',device='cpu',compute_type='int8')
seg,_=m.transcribe(a,language='pt',word_timestamps=True)
out=[]
for s in seg:
    for w in s.words: out.append([w.word.strip(),round(w.start,2),round(w.end,2)])
json.dump(out,open('/tmp/claude-0/dem/words_raw.json','w'),ensure_ascii=False)
print(' | '.join(f'{s}:{w}' for w,s,e in out))
