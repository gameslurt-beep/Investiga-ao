# HANDOFF: short da carta do Flávio + formatos de notícia sem rosto (29/10/2026)

Leia isto antes de continuar em outra sessão ou repositório. Tudo o que foi debatido com o Luke na thread de 29/10.

## 1. Decisões gerais (vale para o canal)
- Notícia é contada **SEM ROSTO**, misturando imagens, gráficos, mapas, documentos, fotos e vídeos reais (com crédito), Flow e motion design.
- **Nem toda notícia cabe no mapa.** O mapa funcionou porque casou com histórias de lugar e movimento. Escolher o palco por "onde mora a história": lugar → mapa; número → gráfico/escala; frase/papel → documento; gente/ação → vídeo real ou Flow; dia a dia → objeto comum. Um palco é o principal e os outros entram por transição contínua (como no "SP país").
- **Usar o que já funciona no mercado**, sem inventar demais e sem ficar viciado em um formato só.
- **Flow faz o que o código não faz.** O código serve só para texto, números, holofote e cursor. Não é para produzir tudo em código, porque demora mais. O objetivo não é código.
- Não usar reconstrução 3D só por usar. Telejornal tradicional e tutoriais não servem de referência.
- Referências de formato (canais grandes, sem rosto ou quase): TLDR News, VisualPolitik, Caspian Report, RealLifeLore, NowThis/AJ+ (texto na tela), Bloomberg Originals, Johnny Harris/Vox (mapa + documento).
- HyperFrames (HeyGen) x Remotion: mesmo princípio (Chrome + FFmpeg). Decisão: não migrar, porque o gargalo do render na nuvem seria o mesmo.

## 2. O short: carta do Flávio Bolsonaro (28/10/2026)
**Fatos (com fonte na tela):**
- 1ª versão, publicada por Paulo Figueiredo: "como o verdadeiro presidente eleito do Brasil"; brasão de 1889, "Estados Unidos do Brazil".
- Em **menos de 1 hora** saiu a 2ª versão, no perfil do Flávio: "como o líder do Brasil"; "eu sou o líder"; brasão oficial. A acusação de fraude continuou. (ND+, O Tempo)
- Trechos da carta (SBT News): "Não fugi do Brasil, eu saí pelo Brasil"; "Não existe nenhum mandado de prisão contra mim, porque eu não cometi nenhum crime"; "Eis o roteiro da perseguição: apreensão de passaporte, tornozeleira eletrônica, censura, prisão domiciliar"; "Vi estarrecido uma fraude eleitoral se concretizar diante dos meus olhos"; "liderarei a oposição daqui. Direi o que vocês, aí, não podem dizer"; "trouxe minha família para os Estados Unidos". Ele agradece a Trump e Milei e se compara a exilados (Rui Barbosa, De Gaulle, Guaidó, María Corina).
- Argumentos dele: Lula ganhou mais de 10 milhões de votos entre os turnos; o STF estendeu o horário de votação; pede a cassação da chapa Lula/Alckmin. A carta não traz prova.
- TSE: Lula reeleito com 64,2 milhões de votos. PL reconheceu o resultado em 26/10 (Jovem Pan).
- Reações: Rogério Marinho, "problema na confecção da carta" (Jovem Pan); Tarcísio pediu respeito ao resultado (GPS Brasília); Valdemar Costa Neto (presidente do PL), em 29/10, na porta da casa do Jair: "Não gostei, não gostei" (Metrópoles).
- Colunas: a Casa Branca teria dito que se declarar presidente é "inviável"; deputados argentinos cobram explicações do Milei.

**Direção do Luke:**
- Gancho = a autodeclaração ("Eu sou o verdadeiro presidente eleito do Brasil"), seguida já da **correção que ele mesmo fez**. Usar a frase literal.
- Foco nas **polêmicas e contradições** e no que gera debate, com **neutralidade**: mostrar também o lado de quem apoia o Flávio.
- Descartados: jogo dos 7 erros / troca de palavras como centro (não é a notícia), paralelo com Guaidó (não importa) e mapa (é uma carta).
- Roteiro atual: `roteiro-v2.md` (escalada: palavra → lugar → motivo → eleição inteira → o próprio lado racha; fecho "Pros apoiadores, é exílio. Pros críticos, é fuga. E pra você?"). Ainda em debate, sem aprovação final.

**Design aprovado em princípio: MESA DE INVESTIGAÇÃO**
- Carta real no centro, numa mesa escura; a câmera desliza pelo papel e o holofote acende só a linha da vez.
- A cada degrau da escalada cai um objeto novo na mesa (foto do Flávio nos EUA, recorte do TSE, fotos/aspas de Marinho, Tarcísio e Valdemar). A mesa começa vazia e termina lotada.
- Neutralidade nas cores: argumento dele aceso em âmbar na carta; fato de fora em recorte branco com fonte. Sem vermelho/verde.
- Gancho: cursor apaga "verdadeiro presidente eleito" e digita "líder do Brasil", com relógio parando em menos de 1 h.
- Fecho: a câmera abre na mesa cheia, tudo apaga e só "líder do Brasil" fica aceso.
- Divisão: **Flow** = a mesa e o clima (luz, poeira, sombra, objetos caindo, câmera passando); **real** = print da carta, fotos e vídeos com crédito; **código** = só texto/aspas legíveis, holofote, cursor e relógio por cima.

## 3. Pendências
- Prints das 2 versões da carta, em boa resolução.
- Fotos/vídeos com crédito: Flávio nos EUA, Valdemar (Metrópoles), Marinho, Tarcísio.
- Luke gera no Flow manualmente. Prompts em 1 bloco, em inglês, sem texto na imagem (abaixo).
- Narração no Google TTS, com texto limpo e perguntas com entonação de pergunta.

## 4. Prompts do Flow (rascunho, 1 bloco)
```
Generate these images/videos in order, vertical 9:16, cinematic, dark investigative mood, NO text, NO letters, NO logos anywhere.
01 Empty dark wooden investigation desk seen from above at a slight angle, single warm desk lamp pool of light in the center, rest in deep shadow, faint dust in the light beam.
02 Same desk (use 01 as reference), a blank sheet of paper lying in the lamp light at the center, slow camera glide across the paper surface, shadows moving softly.
03 Same desk, a blank photo print drops and lands next to the paper, slight bounce, dust lifts in the light.
04 Same desk, a blank newspaper clipping slides into frame and stops beside the paper.
05 Same desk, now crowded: paper in the center surrounded by blank photos and clippings, camera slowly pulls up and back to reveal the whole desk, lamp flickers once.
06 Extreme close-up of an ink pen tip resting on blank paper under warm lamp light, shallow depth of field.
```
Nos quadros em branco entram depois a carta, as fotos e os recortes reais, por cima, em código.

## 5. Motor (resposta ao Luke, 29/10)
Mesmo motor (Remotion + mix/SFX + render na nuvem). O mapa sai e o fundo vira o vídeo do Flow. Reaproveita: holofote (destaque do mapa) na linha da carta, relógio/contador da Virada, etiquetas/janelinhas como aspas e recortes, narração/SFX/mix. Novo: só o cursor apagando/digitando e a câmera andando pela carta. Cuidado: a carta real é posta e movida em CÓDIGO sobre a mesa do Flow. Não deixar a câmera do Flow andar sobre a carta, senão o texto precisaria de rastreamento.
