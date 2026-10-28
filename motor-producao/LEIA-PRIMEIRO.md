# Motor de produção: leia antes de estimar tempo

Este pacote é o "motor" que já usamos para fazer os vídeos do canal. **Não comece do zero.** Use este código como base e troque só o que muda de um vídeo para outro: o tema, os dados, a narração e as peças.

Junto vai o arquivo `CONTEXTO-PROJETO.md`, que explica o canal, o formato e como o Luke trabalha.

---

## 1. Tempo real medido (não é estimativa)

Tempos dos vídeos que já fizemos, com Claude escrevendo o código na nuvem (4 núcleos de CPU e sem GPU):

| Vídeo | Duração | Montagem/código | Render final | Total |
|---|---|---|---|---|
| "A virada" v1 (mapa do Brasil pintado, placar, fotos) | 71 s | ~17 min | 5 min | **22 min** |
| "A virada" v2 (+23 SFX e troca de foto) | 71 s | ~3 min | 5 min | **8,5 min** |
| "E se os continentes entrassem em guerra?" (mapa-múndi com bandeiras, 15 peças, placar, som) | 55 s | ~45 min, em paralelo com o Luke gerando no Flow | prévia 4 min + final 20 min | **~1h10** do OK até o mp4 |
| Fuga do Flávio v1 (mapa, rota, 6 vídeos dentro) | 90 s | ~35 min | 35 min (lento, ver item 4) | ~1h10 |
| Corte de fala política (só vídeo + legenda) | 18 s | ~5 min | 1 min | ~6 min |
| Recriar 10 s da "Virada" do zero com outro modelo, só olhando o vídeo | 10 s | 21 min | incluso | 21 min |

**Ou seja, um short de mapa de 55 a 90 s leva entre 20 min e 1h30, e não 8 horas.**

---

## 2. Por que uma estimativa de 8 horas está errada

Uma estimativa de 8 horas conta como se fosse uma pessoa fazendo do zero:
- escrever o motor de mapa;
- achar e tratar o satélite;
- fazer as máscaras de país e estado;
- desenhar a animação quadro a quadro;
- editar o som numa linha do tempo.

Nada disso precisa ser feito de novo:

1. **O motor já existe.** Câmera com zoom, borrão de movimento e inclinação, mapa pintado com bandeira ou cor, setas, etiquetas, placar no topo, legendas palavra por palavra, peças que pulam no mapa e régua de distância: tudo isso já está pronto em `mapa-guerra/src/Guerra.tsx` e no projeto da Virada.
2. **O preparo já foi feito.** O satélite do mundo tratado, os países com contorno, as bandeiras e as máscaras do Brasil por estado já estão em `public/`. Também há scripts para gerar outros.
3. **O código é escrito em minutos.** Um vídeo novo é, na prática, uma lista de momentos (tempo, câmera, o que acende, qual peça entra) em cima do motor.
4. **A narração define os tempos sozinha.** O `align.py` lê o áudio e devolve o tempo de cada palavra, então não há edição manual de linha do tempo.
5. **O som é um script.** O `mix.py` posiciona cada SFX no segundo certo e mistura narração, música e efeitos.
6. **O trabalho do Luke corre em paralelo.** Enquanto ele gera narração, peças e música no Flow e no Google TTS, o código já vai sendo montado.
7. **O único gargalo real é o render na CPU:** cerca de 20 min para 55 s em 1080p, ou 4 min para a prévia em 540p.

---

## 3. Como fazer um vídeo novo rápido (passo a passo)

1. **Roteiro:** cada frase é um gesto no mapa. Debata e espere a aprovação do Luke.
2. **Prompts primeiro:** narração (Google TTS), peças/cenas (Flow) e música, tudo num bloco só. Ele gera enquanto você monta.
3. **Copie o motor** (`mapa-guerra/` ou `virada/`) e troque só:
   - a câmera (lista `K` de quadros-chave: tempo, centro e zoom);
   - quem acende e quando (`LIGHT`, cores e bandeiras em `TEAM`);
   - as peças (`PECAS`: imagem, caminho em longitude/latitude, tempo de entrada e de saída);
   - os textos (etiquetas, placar, número grande);
   - o rodapé de fontes.
4. **Narração chegou:** rode `scripts/align.py` (gera `public/g/words.json`). As legendas e os tempos saem daí.
5. **Peças do Flow chegaram:** rode `scripts/recorta.py imagem.jpg public/g/pecas nome`. Ele recorta o fundo cinza e deixa o PNG pronto.
6. **Som:** ajuste os momentos em `scripts/mix.py`, que gera `public/g/mix.wav`. Os SFX estão em `sfx/`, com índice em `sfx/INDICE.md`.
7. **Confira quadros parados** com `npx remotion still ... --frame=N --scale=0.4`. Vários quadros lado a lado numa imagem só é mais rápido que assistir.
8. **Prévia 540p** com `npm run previa` (~4 min) e envie ao Luke.
9. **Render final só depois do OK** dele, com `npm run render` (~20 min para 55 s).

---

## 4. O que deixa o render lento (evite)

- CSS `filter: blur()` ou `drop-shadow()` aplicado em SVG grande a cada quadro. O render da Fuga ficou 4 vezes mais lento por isso. Use brilho como PNG pronto.
- Fronteiras com milhares de pontos redesenhadas a cada quadro. Prefira desenhar uma vez no JPG do satélite.
- Vários vídeos (`OffthreadVideo`) ao mesmo tempo. Corte e reduza os clipes antes com ffmpeg.
- `@remotion/google-fonts` trava o render na nuvem. Use as fontes locais em `public/fonts` (Poppins).
- Não renderize o 1080p para conferir. Use quadros parados e a prévia em 540p.

---

## 5. O que tem no pacote

```
mapa-guerra/          projeto Remotion completo do short "guerra dos continentes"
  src/Guerra.tsx      o motor (câmera, mapa, bandeiras, peças, setas, placar, legendas)
  public/g/           mundo.jpg (satélite tratado), world.json (países), fl/ (bandeiras SVG),
                      pecas/ (peças recortadas), words.json, mix.wav, narr.wav, gib.jpg (zoom Gibraltar)
  public/fonts/       Poppins
  scripts/prep.py     trata o satélite e gera world.json a partir de fonte/ (Natural Earth)
  scripts/align.py    narração -> tempo de cada palavra (faster-whisper)
  scripts/recorta.py  recorta peça do Flow com fundo cinza
  scripts/mix.py      narração + música + SFX -> mix.wav (ajuste o caminho LIB para a pasta sfx/)
  fonte/              satélite bruto (EOX Sentinel-2 2016, CC-BY) e países (Natural Earth)
virada/               projeto da "A virada" (Brasil por estado, placar cabo de guerra, fotos),
                      com prep.py e mix.py
sfx/                  biblioteca de 120 SFX (Mixkit, uso livre) em 17 pastas + INDICE.md
```

Para rodar: `npm install`, depois `npm run studio` para ver, ou os comandos de render acima. O `align.py` precisa de `pip install faster-whisper` e de ffmpeg instalado.

**Armadilhas já resolvidas:**
- Países que cruzam a linha de 180° (Rússia, EUA, Nova Zelândia) recebem uma área do tamanho do mundo inteiro. A bandeira estica e o país fica sem pintar. A correção está em `world.json`.
- Recolorir o mar pode pintar a vegetação de azul. Use a máscara de terra do Natural Earth.
- No faster-whisper, decodifique antes com ffmpeg para float32 de 16 kHz, porque o `av.open` falha.
