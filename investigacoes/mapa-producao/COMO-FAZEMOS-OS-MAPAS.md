# Como fazemos os vídeos de mapa (Virada, Fuga do Flávio, Guerra dos continentes)

Atualizado em 30/10/2026. Para qualquer sessão nova que vá produzir um short no mapa. Leia junto com `contexto/CONTEXTO-PROJETO.md` (quem é o Luke, métricas, o que funcionou) e `contexto/LEIA-PRIMEIRO.md` (tempos reais).

**Modelo:** todos os vídeos de mapa foram feitos e devem abrir em **Sonnet 5.5** (pedido do Luke, 30/10).

Vídeos de referência já feitos:

| Vídeo | Duração | O que é | Código |
|---|---|---|---|
| **Virou** (211 cidades) | 27 s | contador 10→211, mergulho no satélite por cidade, carimbo VIROU | feito em sessão fora do projeto, **código não foi salvo** |
| **A virada** (viral) | 71 s | Brasil pintado por estado, cabo de guerra no topo, pulso saindo de Brasília | `investigacoes/eleicao-2026/virada/` (Virada.tsx, prep.py, mapa.py, mix.py) |
| **Fuga do Flávio v2** (voz Mustard) | 88 s | rota no satélite inclinado, 2 relógios no topo, janelinha com vídeo real | `codigo/fuga/` |
| **Guerra dos continentes** | 55 s | mundo, países pintados com bandeira, peças, placar | `codigo/guerra/` |

---

## 1. O formato (a ideia, não regra fixa)

- O **mapa é o ator principal e o pano de fundo ao mesmo tempo**. Nunca sai de cena. Desde o 1º quadro o espectador entende que a história é contada NO mapa.
- **Cada frase da narração é um gesto no mapa** (acende, pinta, voa, desenha rota, carimba). Frase que não vira gesto sai do roteiro.
- **Nada tampa o mapa.** Foto/cartão em cima do mapa foi o erro da Fuga v1. Janelinhas pequenas e presas ao lugar por um fio fino; centro livre.
- **Motion no topo** complementa: placar/cabo de guerra (Virada), dois relógios (Fuga), contadores.
- **Short = mapa vivo e colorido.** Escuro só em momentos pontuais (escuro afasta no short). A Fuga usou satélite "luar" azul-escuro porque é noite/tensão; a Virada usou satélite natural com mar escurecido.
- **Câmera nunca para**: zoom com ease, leve inclinação, mergulho de escala (país → cidade).
- Janelinha com áudio real: tudo para e a janelinha fala. Sem áudio: muda, com narração por cima.
- Gancho: assunto dito nos 2 primeiros segundos, falando com "você" quando couber. Fim com pergunta ao espectador gera mais comentário (Virou).
- Fonte de cada dado no rodapé ("Fonte: TSE", "FONTE: INFOBAE"). Fato atribuído basta.

## 2. Pilha técnica

- **Remotion 4 + React** (9:16, 1080x1920, 30 fps). Tudo em código, uma composição por vídeo.
- **Python** para preparar imagens/máscaras (Pillow, numpy), alinhar a narração (faster-whisper) e mixar o som (numpy + ffmpeg).
- **Fonte**: Poppins local em `public/fonts` (P-Regular/SemiBold/Bold/ExtraBold). Fuga também usa uma mono para relógios/etiquetas. **Nunca** `@remotion/google-fonts`: trava o render na nuvem. Carregar com `FontFace` + `delayRender/continueRender` (padrão no topo de cada .tsx).
- **Satélite**: EOX Sentinel-2 cloudless 2016 (CC-BY), baixado da nuvem em `tiles.maps.eox.at` (WMTS z/x/y). Noite/luzes: NASA GIBS Black Marble (livre). Esri e Mapbox: evitar/licença duvidosa.
- **Fronteiras/países**: Natural Earth (`ne50.geojson`); estados do Brasil via `geo.json` do projeto (`sao-paulo-30dias/mapa-novo/projeto/fonte/`).

## 3. Como o mapa é construído (três variações)

### 3a. Mapa "mosaico fixo + câmera CSS" (A virada, Guerra)
1. `prep.py` monta um mosaico grande do satélite (Virada: z6, 3840x3584 px; Guerra: mundo tratado) e converte lon/lat para pixel do mosaico pela fórmula de Web Mercator: `x=(lon+180)/360*2^z`, `y=(1-ln(tan(lat)+sec(lat))/π)/2*2^z`, vezes 256.
2. Tratamento de cor: dessaturar ~0,85, contraste 1,1, mar escurecido/azulado por máscara "azul menos vermelho" (não escurecer tudo, senão a vegetação fica azul; para o mundo usar a máscara de terra do Natural Earth).
3. Cada estado/país vira (a) polígonos em pixels no `geo.json`, (b) um PNG de máscara recortado na bbox (`m_SP.png`). No React, o preenchimento é `<div>` colorido com `maskImage` = esse PNG.
4. A **câmera** é só uma lista de quadros-chave `K = [[tempo, {cx, cy, s}], ...]`; entre dois quadros: ease cúbico, zoom em escala logarítmica (movimento natural). O mosaico inteiro recebe `translate(W/2 - cx*s, H/2 - cy*s) scale(s)`.
5. **Pintura que se espalha**: `clipPath: circle(r at centro)` crescendo de 0 até a diagonal da bbox em ~0,7 s, a partir do centro do estado (ou da capital, como BH na virada de Minas).
6. **Pulso** ("coração do mapa"): batida dupla `beat(t)` a cada 1,6 s, com atraso proporcional à distância de Brasília, mais forte onde a vitória foi maior. Pinta de branco com opacidade pequena sobre a cor.
7. **Destaque** de um estado: contorno aceso (`#ffe27a`) + brilho + véu branco por 1,4 s (`flash`). Padrão do canal: holofote + véu leve + contorno aceso, tudo junto.
8. Zoom profundo: segunda imagem em alta resolução (Sudeste z8) com `maskImage: radial-gradient` para a borda suave, que entra por `opacity` conforme `s` sobe.

### 3b. Mapa em camadas de zoom + palco inclinado (Fuga)
- Camadas pré-renderizadas de satélite `L5, L7, L10, LB, L13` (zoom 5 a 13) com `meta.json` (z, x0, y0, w, h). `tiles_b.py` gera cada uma (mosaico EOX + luzes noturnas do Black Marble, tom "luar", mar quase preto).
- A câmera é `{x, y, z, tilt}` em coordenadas de mundo (256 px = mundo inteiro em z0). `KEYS` com tempo e câmera; helpers `fit(a, b, pad, tilt)` (enquadra dois pontos lon/lat) e `at(ponto, z, tilt, dy)`.
- Cada camada cruza para a de maior zoom por `opacity` entre `L.z-1.6` e `L.z-0.8`; mais de 5 níveis de diferença não renderiza.
- **Inclinação 3D**: o palco inteiro (mapa + rotas + etiquetas) fica num `<div>` com `perspective:1500` e `rotateX(tilt)`; o palco é maior que a tela (`PAD=700`) para a borda não aparecer. Etiquetas (`Tag`) usam contra-rotação `rotateX(-tilt)` para ficarem de pé; elementos de tela fixa (caixinha do jato, janelinha) usam a função `scr()` que reproduz a mesma perspectiva para achar a posição na tela.
- **Rotas**: `smooth()` (Catmull-Rom) em pontos lon/lat projetados; `Route` desenha só a fração `p` do caminho a velocidade constante (comprimento acumulado), com brilho feito de dois traços largos e transparentes (sem blur), ícone (avião/van) girando na ponta, selo circular (`Badge`) com o rosto do personagem. Tracejado = não confirmado.
- Relógio da história `STORY`: lista [tempo do vídeo, minutos desde segunda 00:00]; o tempo do filme acelera, para ou volta (rebobinar) conforme a narração. Dois relógios no topo (prazo que vence, avião esperando).

### 3c. Mundo com bandeiras (Guerra)
- Países/continentes pintados com **a bandeira** (SVG em `public/g/fl/`) via padrão + máscara; "Spread" para a cor se espalhar.
- **Peças** (imagens do Flow sobre fundo cinza, recortadas por `recorta.py`) caminham entre pontos lon/lat (`PECAS`: imagem, caminho, entrada, saída, tamanho). Setas se desenham (`Arrow`), placar de ogivas, número grande, legendas palavra por palavra.
- **Armadilha do antimeridiano**: Rússia, EUA e Nova Zelândia cruzam 180° e vêm com área de mundo inteiro no Natural Earth; a bandeira estica e o país fica sem pintar. Corrigir a área à mão em `world.json`.

## 4. Pipeline de um short novo (ordem de trabalho)

1. **Debater tema e ângulo, conferir fatos com fonte.** Política atual, com "você", pessoa conhecida e dado real (é o que viralizou). Contar pela ótica de quem ganhou.
2. **Roteiro** (voz: Mustard para história real dramática; RealLifeLore para "e se" e curiosidade). Cada fala = gesto no mapa. Só avançar com o OK do Luke. Short: 55 s a 1:30.
3. **Mandar num bloco só**: texto do Google TTS (homem/mulher separados, instrução de estilo em inglês, texto em português sem rótulos), prompts do Flow (inglês, numerados, sem texto na imagem) e pedido de música. Luke gera manualmente enquanto você monta.
4. **Montar a base** copiando o motor: câmera (`K`/`KEYS`), quem acende (`LIGHT`), peças, textos, rodapé de fontes.
5. **Lista de SFX por momento** para aprovação ANTES de montar; SFX fazem parte da v1, sempre. Biblioteca: `contexto/motor-2-sfx.zip` (120 efeitos, índice em `sfx/INDICE.md`).
6. **Narração chegou**: decodificar com ffmpeg para float32 16 kHz e rodar `align.py` (faster-whisper) → `words.json` (tempo de cada palavra). Os tempos de cena seguem a voz. Se a narração for acelerada (Fuga: 1,08x), todos os tempos do código são do mix final. Corrigir palavras mal reconhecidas num dicionário (`FIXW`: "vã"→"van", "Fós"→"Foz").
7. **Mix de áudio** (`mix.py`/`mixM.py`): cada SFX posicionado no segundo certo (`put(t, nome, ganho, peak=True)` alinha o pico do som ao instante), música com envelope (abaixa quando há fala, some durante a janelinha), narração ~-17 LUFS, total normalizado em -14 LUFS (`loudnorm`).
8. **Conferir quadros parados**, nunca assistir ao render: `stills.mjs` renderiza vários tempos em 0,33x; juntar numa prancha. Olhar o quadro antes de apontar problema visual.
9. **Prévia 540p** (`npm run previa`, ~4 min) enviada ao Luke no celular.
10. **Render final 1080x1920 só depois do OK**: `npm run render` (~20 min para 55 s; Fuga: `renderM.mjs`, 4 núcleos, h264 crf 18).
11. Entregar mp4 (e, se pedir, título com hashtags numa linha). **Miniatura nunca em código**: mandar prompt para Flow/ChatGPT; ela mostra um pedaço da história que se completa com o título.

## 5. Tempos reais medidos (nuvem, 4 núcleos, sem GPU)

| Vídeo | Código | Render | Total |
|---|---|---|---|
| A virada v1 | ~17 min | 5 min | 22 min |
| A virada v2 (+23 SFX, troca de foto) | ~3 min | 5 min | 8,5 min |
| Guerra dos continentes (55 s) | ~45 min (em paralelo ao Luke) | prévia 4 + final 20 min | ~1h10 |
| Fuga v1 (90 s) | ~35 min | 35 min (lento) | ~1h10 |

Um short de mapa leva de 20 min a 1h30, não 8 horas. O preparo (satélite, máscaras) não se repete: a próxima cena parecida custa minutos.

## 6. O que deixa o render lento (evite)

- CSS `filter: blur()` / `drop-shadow()` em SVG grande a cada quadro (a Fuga ficou 4x mais lenta). Brilho = traço largo e transparente por baixo, ou PNG pronto.
- Fronteiras com milhares de pontos redesenhadas por quadro: assar no JPG.
- Vários `OffthreadVideo` ao mesmo tempo: cortar e reduzir os clipes com ffmpeg antes.
- Renderizar 1080p para "conferir": use stills e prévia 540p.

## 7. Armadilhas já resolvidas

- Fonte do Google trava o render (usar fontes locais).
- Países no antimeridiano (ver 3c). Mar recolorido pinta vegetação de azul (usar máscara de terra).
- `av.open` do faster-whisper falha em alguns arquivos: decodificar antes com ffmpeg.
- Legenda nunca sobre o rosto; conferir posição do rosto.
- Vídeos do YouTube: yt-dlp costuma ser bloqueado na nuvem; usar bancos grátis (Pixabay, Coverr, Mixkit, Wikimedia, Agência Brasil, NASA, Internet Archive) e **baixar você mesmo**. Cena = vídeo, nunca foto parada por falta de vídeo.
- Janelinha de vídeo real: cortar o trecho com ffmpeg (`jan.mp4`), muda no vídeo (`muted`) e o áudio entra pelo mix, nivelado pela narração.

## 8. Peças reutilizáveis (nomes no código)

`io/ramp` (interpolação com ease), `pop` (entrada com overshoot), `fade` (entra e sai), `beat` (pulso duplo), `Txt`/`Chip`/`Stamp` (texto, etiqueta, carimbo), `Badge` (selo circular com rosto), `Tag` (etiqueta presa ao lugar), `Ping` (círculo pulsante), `Route` (rota que se desenha), `FlightBox` (caixinha tipo Flightradar), `TopBar` (placar/relógios), `Caption` (legenda palavra por palavra em caixa alta, contorno preto), `Source` (rodapé com fonte), `BigCounter` (número que sobe).

## 9. Onde está cada coisa

- Esta pasta: `investigacoes/mapa-producao/codigo/fuga|guerra`. Virada: `investigacoes/eleicao-2026/virada/`.
- Projetos completos e vídeos (só na pasta do projeto no Claude): `eleicao-2026/producao/virada-projeto.tar.gz`, `flavio-fuga/v2/fugam-projeto.tar.gz`, `contexto/motor-1-mapa-guerra.zip`, `motor-2-sfx.zip`, `motor-3-virada.zip`, `motor-producao.zip`; mp4s: `211-viraram-v1.mp4`, `eleicao-2026/producao/virada-v2.mp4`, `flavio-fuga/v2/fuga-v2-mapa.mp4`, `guerra-continentes/guerra-continentes-1080p.mp4`.
- Mapa-base do Brasil (satélite, geo.json, máscaras): `sao-paulo-30dias/mapa-novo/projeto/fonte/`.
- Identidade e ideias de mapa: `notas/identidade-mapa.md`, `investigacoes/mapa-referencia/IDEIAS-para-testar.md`.
- Debate do formato na Fuga (3 vozes): `flavio-fuga/v2/mapa-3-versoes.md`.
