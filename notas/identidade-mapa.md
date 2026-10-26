---
name: identidade-mapa
description: Identidade do canal = o MAPA; Luke quer ser "o especialista do mapa" (2026-10-24)
metadata:
  type: project
---
2026-10-24 23:02 (Luke): a identidade do canal deve estar no MAPA. Objetivo: "virar o especialista do mapa". Base escolhida em debate: satélite natural (estilo Johnny Harris, mar quase preto) com linhas de fluxo finas e brilhantes; destaque de região SEM recorte (contorno aceso, véu de cor, resto escurece); transição natural para versão escura (mesma imagem, só tratamento). Recorte/bloco 3D só em momento forte, se usar.
**Why:** a prévia do "30 dias" ficou amadora; o mapa é o ponto central e deve ser reconhecível em todos os vídeos.
**How to apply:** tratar o mapa como produto reutilizável (mapa mestre + elementos fixos de assinatura), não como cenário de um vídeo só. Ver [[roteiro-sp-30-dias]], [[tecnica-remotion-3d]].
2026-10-24 23:05 (Luke): mapa mestre = mapa ANIMADO reaproveitável para qualquer lugar (SP, Minas, Austrália, cidades). Proposta: planeta inteiro (satélite NASA + fronteiras mundo/estados/cidades). Limite: zoom em cidade exige imagem de alta resolução por área (checar licença comercial). Teste deve ter voo do Brasil + mergulho numa cidade. Luke quer TESTAR antes de fixar a identidade.
2026-10-24 23:10: exemplo de mergulho em Santos (exemplo-mergulho-santos.jpg em sao-paulo-30dias/bibliotecas). Nuvem acessa: EOX Sentinel-2 cloudless (tiles.maps.eox.at; 2016=CC-BY, 2018+ = NC, confirmar), Esri World Imagery (server.arcgisonline.com; licença p/ vídeo duvidosa), NASA GIBS (gibs.earthdata.nasa.gov, livre, só serve de longe). Mapbox satélite = opção comercial com crédito.
2026-10-24 23:35: prancha de destaques (7 imagens paradas, satélite EOX Sentinel-2 cloudless 2016 CC-BY + contorno geo.json): https://claude.ai/artifact/WNrcCVtdk5eVEyvT5dHsdk. Script: sao-paulo-30dias/bibliotecas/destaques-render.py. Levou ~15 min (Luke reclamou da estimativa de 15-20 min para prancha; eu disse 8-10 e passou um pouco por ajustes de enquadramento).
2026-10-24 23:30 (Luke): escolheu "os três juntos" (holofote + véu leve + contorno aceso) como destaque padrão.
2026-10-24 23:40: primeira cena no mapa novo = Dia 3 (imposto), 30 s, Remotion 2D (câmera CSS sobre mosaico EOX z6, linhas SVG cometa, máscaras PNG por estado). Código: sao-paulo-30dias/mapa-novo/Dia3.tsx; vídeo dia3.mp4. Tempos MEDIDOS: código ~4 min + render 1m47 na nuvem (peças já reaproveitáveis: holofote+véu+contorno, leque, etiqueta). Preparo de máscaras: script prep3.py (scratchpad; regerar com outras siglas).
2026-10-24 23:48 (Luke riu: "Era 40 minutos foi 6"). Estimei 40 min, levou ~6 min + ~5 min de preparo antes. Luke corrigiu (23:49): preparo não se repete, então próxima cena parecida = ~6-7 min (código + render). Não arredondar para cima sem motivo.
2026-10-25 00:45 (Luke, debate): quer BOA DISTRIBUIÇÃO mapa x imagem (nem só mapa, nem corte a cada item). Adorou a "fotinha do lado" (janelinha de foto/vídeo dentro do mapa ao lado da etiqueta do estado) para PI, Brasília, RS e outros momentos. Ainda sem decisão formal.
2026-10-25 00:55 (Luke): nosso vídeo = mapa PROTAGONISTA com muitos números/fluxos (estilo jornalístico de dados), diferente do Johnny Harris (mapa coadjuvante). Referências: Bloomberg Originals, WSJ, Economist, FT, Wendover, PolyMatter. Ver IDEIAS-para-testar.md.
2026-10-25 01:00 (Luke): RealLifeLore = referência de mapa como FOCO TOTAL (relevo + cor chapada por país, setas, caixas pretas; corta para foto de arquivo). Em IDEIAS-para-testar.md.
