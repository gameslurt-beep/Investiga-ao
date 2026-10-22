import sys, certifi
certifi.where = lambda: '/root/.ccr/ca-bundle.crt'
import asyncio, edge_tts, json
async def go(voice, text, out, rate="+0%", pitch="+0Hz"):
    c = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    words=[]
    with open(out,'wb') as f:
        async for ch in c.stream():
            if ch['type']=='audio': f.write(ch['data'])
            elif ch['type']=='WordBoundary': words.append({'w':ch['text'],'s':ch['offset']/1e7,'d':ch['duration']/1e7})
    json.dump(words, open(out+'.json','w'), ensure_ascii=False)
    return words
if __name__=='__main__':
    print(asyncio.run(go(sys.argv[1], sys.argv[2], sys.argv[3], *(sys.argv[4:]))))
