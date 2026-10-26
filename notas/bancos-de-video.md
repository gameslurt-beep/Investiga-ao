---
name: bancos-de-video
description: Bibliotecas de vídeo/imagem real para cenas do canal e o que a nuvem consegue baixar (testado 2026-10-25)
metadata:
  type: reference
---
2026-10-25 (Luke quer cenas reais de banco além do Veo; debate em andamento):
- Nuvem BAIXA: Pexels e Pixabay (site 403, mas CDN videos.pexels.com / cdn.pixabay.com = 200; API precisa chave grátis), Mixkit, Coverr, Wikimedia Commons (API ok, ~1.500 vídeos "São Paulo", licença por arquivo), Internet Archive, NASA (images.nasa.gov, svs.gsfc.nasa.gov), Flickr, Agência Brasil, Storyblocks (site abre).
- Nuvem BLOQUEADA (403): Artlist/Artgrid, Envato Elements, Pond5, Shutterstock, Videvo -> Luke baixa no PC/celular e põe na pasta.
- Regra: banco para o que é real, Veo para o hipotético; grade da paleta no código unifica. Nunca usar vídeo de YouTube/canais sem licença.
Ver [[identidade-mapa]], [[roteiro-sp-30-dias]].
2026-10-25 00:06 (Luke): TUDO tem que ser baixado por mim (Claude); ele não baixa vídeo. E só GRÁTIS (produção acelerada). Pagos descartados. Pedi chaves grátis em Network secrets: PEXELS_API_KEY, PIXABAY_API_KEY (valem em sessão nova). Sem chave: Mixkit, Coverr, Wikimedia, Archive, NASA.
2026-10-25 00:12: chave Pixabay recebida (colada no chat da thread "Definir mapa e estilo"; NÃO gravar aqui). Testado: API ok, "sao paulo" = 54 vídeos (SP noite, prefeitura, avião pousando, aéreo), download 1080p em <1 s. Busca com várias palavras traz resultado fraco (casa só uma palavra); usar 1-2 termos. Pexels: Luke não conseguiu a chave ainda (Pexels tem mais Brasil). Guardar a chave em arquivo do projeto foi BLOQUEADO pelo sistema (mesmo com autorização do Luke). Único caminho: Luke cola em Project settings > Cloud environment > Network secrets (PIXABAY_API_KEY).
2026-10-25 00:20: teste Dia 3 baixado em sao-paulo-30dias/banco/dia3/ (11 clipes Pixabay + creditos.csv + _prancha.jpg). Bons: SP aéreo Banespa (25911), hemodiálise (136458), UTI neonatal (66598), colheitadeiras (274450), soja drone (274073). Fracos: universidade, Brasília (nada), estrada BR. Wikimedia API deu 429 (rate limit) pela nuvem.
2026-10-25 00:25: Luke cobrou busca estreita ("cenas tão comuns"). Lição: buscar AMPLO (sinônimos, termos genéricos) antes de mandar pro Flow. Resultado: universidade ok (159027/159028), estrada = 206883 (Argentina, plana) + colheitadeiras; Brasília reconhecível só pelo Flow (prédio de governo genérico = Europa). Pixabay pende para Europa; filtrar cerca viva/placas em inglês.
2026-10-25 00:37: teste Dia 3 + banco PRONTO: mapa-novo/dia3-mix.mp4 (42 s), código Dia3Mix.tsx (lista ITEMS: trechos do mapa + clipes; passagem = zoom no ponto + dissolve). Clipes cortados e com grade via ffmpeg em public/banco/. Tempo MEDIDO: ~5 min código + 3 min 18 s render. Projeto atualizado no tar.gz. Passagem ainda parece mais dissolve que mergulho.
2026-10-25 00:40 (Luke): cortar para vídeo a CADA estado destacado = exagerado. Proposta minha (em debate): mapa carrega a lógica; vídeo em tela cheia no máximo 1 por bloco (momento de peso, ex.: hospital no "buraco"); janelinha de foto dentro do mapa ao lado da etiqueta. Julgar ritmo só com som (narração).
2026-10-25 01:20: proposta de vídeos por dia (8 tela cheia + ~16 janelas, ids Pixabay) em sao-paulo-30dias/mapa-novo/PLANO-videos-por-dia.md (em debate).
2026-10-25 01:22: fontes extras testadas: Coverr busca ok (coverr.co/s?q=), Mixkit só por categoria, Agência Brasil fotos (CC BY, Brasil real: canavial/pátio/torres), Flickr API ok (precisa chave grátis), Wikimedia p/ 1932. Pexels: API bloqueada para o Luke no momento (não insistir); usar Pixabay, Coverr, Mixkit e Flow.
2026-10-25 01:27: faltantes em banco/faltantes/ (torres 28351 mixkit + 23470, despedida 42237, celular 4915, alfândega 35890). Coverr fraco. Flow: canavial, laranjal, pátio de carros. 1932: 260 fotos Wikimedia (Museu Paulista), sem filme.
