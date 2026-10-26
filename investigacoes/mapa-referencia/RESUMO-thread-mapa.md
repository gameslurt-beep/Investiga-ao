# Resumo para continuar: mapa novo + mistura com Veo/banco de imagens (2026-10-24)

## Decidido
- Visual antigo do "30 dias" DESCARTADO. Roteiro v8 e narração continuam (roteiros/sao-paulo-pais/roteiro-A-30-dias-v8.md).
- Identidade do canal = o MAPA ("especialista do mapa"). Satélite natural (EOX Sentinel-2 cloudless 2016, CC BY 4.0, crédito na descrição), mar quase preto, estilo Johnny Harris, linhas finas brilhantes em leque.
- Destaque de região: "os três juntos" = holofote (resto escurece) + véu laranja leve + contorno aceso. Sem recorte.
- Versão escura do mesmo mapa para momentos tensos, transição suave.
- Mergulho em cidade (Porto de Santos) ADIADO.

## Feito
- Cena Dia 3 (imposto), 30 s, 1080p: `dia3.mp4` e código `Dia3.tsx` nesta pasta.
  - SP acende → linhas SP→Brasília → leque Brasília→todas as capitais → etiqueta "R$ 830 bilhões" (fonte Receita/cálculo Gazeta do Povo) → meia-volta (linhas recolhem, SP brilha) → PI/MT/RS acendem com etiquetas e as linhas até eles somem → mapa escurece, os 3 ficam vermelhos.
  - Tempo medido: ~4 min de código + 1 min 47 s de render na nuvem. Próxima cena parecida: ~6-7 min.
  - Marcador "DIA 3 · IMPOSTO" foi acréscimo meu; Luke ainda não disse se fica.
- Projeto Remotion: /home/user/abertura/sp3d (container, efêmero) — composição Dia3 no Root.tsx; assets em public/mapa3 (nat.jpg, dark.jpg, máscaras PNG de SP/PI/MT/RS, geo3.json com divisas e capitais em pixels do mosaico). Fonte do mosaico: tiles EOX z6 (tile 15/28 origem), Web Mercator.
- Pranchas: destaques https://claude.ai/artifact/WNrcCVtdk5eVEyvT5dHsdk ; referências de mapa https://claude.ai/artifact/U6d15SB1LEWPa1k5H5JPcC

## Em debate (sem decisão final)
- Mistura mapa + cenas: o mapa explica, a cena mostra o lugar/pessoa (~60% mapa / 40% cena). Passagem por mergulho (zoom no estado → cena aérea descendo), mesma paleta (noite azulada, luz laranja, mar preto), etiquetas Poppins sobre a cena.
- Estilo das cenas: cinematográfico realista (combina com satélite, cara de documentário) x estilizado massinha/low-poly (mais autoral, risco de choque com o mapa). PROVISÓRIO: realista. Luke quer TESTAR antes. Proposta: gerar a cena do hospital do Piauí nos dois estilos e encaixar no Dia 3.
- Imagens do Flow da rodada 1 (massinha) seriam refeitas se for realista.
- Banco de imagens reais em vez de Veo para o que existe de verdade: Pexels/Pixabay (grátis, sem crédito, pouco Brasil), Agência Brasil/EBC (CC BY, confirmar), Wikimedia Commons; pagos Storyblocks/Artgrid/Envato. Veo só para o que é hipotético (fronteira de SP, passaporte, aduana). Ainda não testado se a nuvem baixa desses sites. Grade da paleta aplicado no código.
- Depois: outras possibilidades além do leque (água, energia).
