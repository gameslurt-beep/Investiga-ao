import sys; sys.path.insert(0,'/home/user/qv')
import certifi; certifi.where=lambda:'/root/.ccr/ca-bundle.crt'
import asyncio, json, edge_tts
from lines import L
V={'A':('pt-BR-AntonioNeural','+5%','-3Hz'),'F':('pt-BR-FranciscaNeural','-12%','+0Hz')}
async def one(i,v,t):
    voice,rate,pitch=V[v]
    for attempt in range(4):
        try:
            c=edge_tts.Communicate(t,voice,rate=rate,pitch=pitch,boundary="WordBoundary"); words=[]; data=b''
            async for ch in c.stream():
                if ch['type']=='audio': data+=ch['data']
                elif ch['type']=='WordBoundary': words.append({'w':ch['text'],'s':ch['offset']/1e7,'d':ch['duration']/1e7})
            open(f'{i}.mp3','wb').write(data); json.dump(words,open(f'{i}.json','w'),ensure_ascii=False); return
        except Exception as e:
            print('retry',i,e); await asyncio.sleep(2)
async def main():
    sem=asyncio.Semaphore(6)
    async def lim(*a):
        async with sem: await one(*a)
    await asyncio.gather(*[lim(i,v,t) for i,v,t,_ in L])
asyncio.run(main())
