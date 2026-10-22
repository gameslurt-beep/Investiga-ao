# Quem é você (Dia 1) — código e assets da montagem

Cópia de trabalho de `/home/user/qv` (o container é apagado; esta pasta fica).
Para remontar: copiar esta pasta para `/home/user/qv`, depois `cd rem && npm i`.
Python precisa de `numpy scipy pillow edge-tts`.

## Peças
- `lines.py`: falas do roteiro v2 (`/mnt/project-files/roteiros/quem-e-voce-v2.md`), id `w0`, `n1`…`n36`.
- `gen_tts.py` + `tts.py`: voz PROVISÓRIA (edge-tts, pt-BR-AntonioNeural / FranciscaNeural) só para marcar o tempo.
  No proxy, o certificado é resolvido trocando `certifi.where` por `/root/.ccr/ca-bundle.crt`.
- `timeline.py`: lê `audio/*.json` (tempo de cada palavra) e grava `rem/src/timeline.json`. Todo corte e efeito do vídeo é calculado a partir dele.
- `key.py`: recorta (chroma verde) as partes do boneco, gato, mãos e objetos para `rem/public/q/` + `rem/src/qmeta.json`.
- `detab.py`: tira as abas redondas de encaixe das partes do boneco de costas (lê `q_orig/`, grava em `rem/public/q/`). Rodar depois do `key.py`.
- `mix.py`: efeitos sonoros e drone. `python3 mix.py sfx out/sfx.wav` (sem voz) ou `python3 mix.py guia out/guia.wav` (com voz provisória).
- `rem/src/Video.tsx`: todas as cenas (S0–S14), lanterna, CCTV, boneco de costas, gato, casa em corte, cartela final.
- `rem/stills.mjs`: renderiza quadros soltos para revisão (`node stills.mjs 12.5,30.2`).

## Render
```
cd rem && npx remotion render src/index.ts QV ../out/video_mudo.mp4 \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell \
  --concurrency=4 --codec=h264 --crf=19 --muted
ffmpeg -i out/video_mudo.mp4 -i out/sfx.wav -c:v copy -c:a aac -b:a 192k -shortest out/final.mp4
```

## Quando chegar a narração do Lucas
1. Cortar a gravação por fala (ou alinhar palavra a palavra com Whisper, `word_timestamps`) e gerar um `audio/<id>.json` por fala no mesmo formato dos atuais.
2. `python3 timeline.py` para refazer o `timeline.json` (os cortes seguem a voz dele sozinhos).
3. Incluir as legendas (palavras já estão no `timeline.json`) e renderizar de novo.
