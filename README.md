# Índice das investigações (atualizado em 22/10/2026)

Ponto de partida para qualquer sessão nova. Código, roteiros e prompts estão em `investigacoes/` (mesma estrutura da pasta do projeto). As notas da memória do projeto estão em `notas/`. O texto completo dos documentos de análise está em `documentos/`. Vídeos e imagens ficam só na pasta do projeto no Claude.

## 0. COMECE AQUI (atualizado em 26/10/2026)
### Vídeo da eleição 2026: "Os que mudaram de lado" (em debate)
- Tudo o que foi debatido (ideia escolhida, estrutura de 8 partes, "mapa de vento", regras de neutralidade, dados necessários, ideias de reserva): `investigacoes/eleicao-2026/DEBATE-ideia.md`
- Nota da memória: `notas/video-eleicao-2026.md`
- Só produzir depois do resultado OFICIAL do TSE. Fase atual = debate, nada de código ou prompt sem o Luke pedir.

### Referência do mapa (identidade do canal, trabalhada no projeto anterior)
- Identidade e decisões do mapa (satélite EOX, destaque holofote + véu + contorno, janelinha de vídeo, referências Bloomberg/Johnny Harris/RealLifeLore): `notas/identidade-mapa.md`
- Ideias de mapa para testar e referências de canais: `investigacoes/mapa-referencia/IDEIAS-para-testar.md`
- Resumo da thread do mapa e plano: `investigacoes/mapa-referencia/RESUMO-thread-mapa.md`, `PLANO-videos-por-dia.md`
- Código da cena-teste no mapa (Remotion): `investigacoes/mapa-referencia/codigo/Dia3.tsx`, `Dia3Mix.tsx`, `destaques-render.py`; preparo de máscaras e divisas: `investigacoes/mapa-referencia/fonte/` (como montar: `LEIA-projeto.md`)
- Prancha de destaques: https://claude.ai/artifact/WNrcCVtdk5eVEyvT5dHsdk
- Vídeos, imagens de satélite e o projeto Remotion completo (sp3d-mapa.tar.gz) ficam só na pasta do projeto: `sao-paulo-30dias/mapa-novo/` e `sao-paulo-30dias/bibliotecas/`.
- Atenção: o mapa é referência de TÉCNICA. O Luke pediu para esquecer o tema "SP país / 30 dias" no vídeo da eleição.

## Foco do projeto
Investigar vídeos virais pela ótica da percepção e da conexão do público (narrativa, referências, o "você", o gancho). Não é sobre marca.

## 1. Formato do molho / refrigerante atravessando o card
- O que é: teste do formato em que a comida atravessa um card falso do Instagram. Funciona pela surpresa (começa parecendo dois posts separados).
- Arquivos: `molho-teste/`, `refri-teste/` (teste_final.mp4, make_card.py, compor.py).

## 2. Vídeo dos 20 milhões nas duas malas (parte 2)
- Escolha moral em "você", final "comente DEVOLVER ou FICAR".
- Análise: https://claude.ai/artifact/TnLaCZxkK44mEvSwTuGtJE
- Roteiro traduzido quadro a quadro: `roteiro-20-milhoes/roteiro.html` (https://claude.ai/artifact/5dWyhy6r99S2cHJwMvyMpM)

## 3. Paris, Dia 1 (parte 3)
- Protesto que vira zumbi, gato Croissant, monitor cardíaco, final em escolha.
- Análise: https://claude.ai/artifact/QFGuDrAmRzTCyzfj3s5wu7
- Reescrita em primeira pessoa (exagerou na identificação, parada): https://claude.ai/artifact/RSRrK5SKP8Do1hNL991nqg
- Recriação em código (Remotion) e prompts do Flow: `paris-dia1/` (video_todo/nossa_versao_v3_portugues.mp4, codigo/, flow_prompts_*.md)

## 4. Molde de 9 batidas dos vídeos de sobrevivência (parte 4)
- Paris + Apocalipse Nuclear (Rafa) + Andar 14 (Bruno).
- Documento: https://claude.ai/artifact/BuqGVNdwrY4qAS1FrH7ZJx
- Recriação de 10 s do nuclear: `nuclear-10s/`
- Bonecos de bibliotecas prontas (Open Peeps, Big Heads, DiceBear): `bonecos-bibliotecas/`

## 5. Por trás dos roteiros: raízes e psicologia das 9 batidas
- O "você" (RPG, livro-jogo, estudos de Brunyé e Kaufman e Libby), o alerta com hora (Guerra dos Mundos, Local 58), as regras com números (CDC 2011, Guia de Zumbis), o final (Salve o Gato, Hitchcock, conto "Knock" de 1948, folhetim).
- Tabela das 9 batidas: origem, por que prende, como dar mais força.
- Documento: https://claude.ai/artifact/M5JTSRFoYGA6n8WvSkGJxL (6 fontes conferidas na web; o resto ainda é de memória)

## Regras de trabalho do Lucas
- Não começar nada sem ele dizer "pode fazer". Pergunta ou pensamento em voz alta não é pedido.
- Prompts do Flow: em inglês, para o agente do Flow, em um único bloco (só separar imagens de vídeos).
- Para visual, usar bibliotecas prontas, não desenhar do zero.
- Quando ele der um prazo (horário de Brasília, UTC-3), usar o tempo todo.
