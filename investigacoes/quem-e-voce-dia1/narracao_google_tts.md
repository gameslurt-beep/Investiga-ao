# Quem é você (Dia 1): narração para o Google TTS

São duas gerações separadas, uma para o narrador e outra para a mulher. A narração tem cerca de 80 s; depois os cortes do vídeo são ajustados à voz gerada.

## 1. Narrador

Onde: Google AI Studio, em Generate speech, com uma voz só. Sugestão de voz: Algenib (grave e rouca) ou Charon.

Instrução de estilo:

```
Read in Brazilian Portuguese as a calm, low, tense suspense narrator speaking directly to the listener ("você"). Slow pace, close to the microphone, almost a whisper at times, never theatrical. Short pause after each sentence and a longer pause at each blank line.
```

Texto:

```
Vinte e três e quarenta. A porta está destrancada.
Exatamente como deveria estar.
Você não acende a luz.

O celular vibra. Câmera dois, corredor.
Tem mais alguém aqui dentro.

Você sabe o que fazer.
Não faça barulho.
Não encoste nas paredes.
Não toque em nada que não precise.

O gato aparece no fim da sala.
Ele arrepia e chia para você.
Até ele está com medo.

Na geladeira, fotos de família.
Você não olha. Não agora.

Você precisa achar a caixa azul.
Antes que ele te encontre.

Na câmera, o vulto para.
Vira devagar para a lente.
Está escuro demais para ver o rosto.

Quarto. Escrivaninha. Última gaveta.
A caixa azul.

Aí você ouve.
Uma respiração.
Vem do armário.

O celular vibra de novo. Câmera dois.
Você abre o vídeo.
A pessoa do corredor olha para cima.
É você.

Você abre a caixa.
Dentro, uma chave. E a foto de uma criança, nesta mesma sala.
Atrás da foto, escrito à mão...
o seu nome.

Sirenes ao longe.
Então... você abre o armário?
Ou vai embora com a caixa?
```

## 2. Mulher

Sugestão de voz: Achernar (suave) ou Kore. Gere 2 ou 3 versões e mande a melhor, ou todas.

Instrução de estilo:

```
Whisper in Brazilian Portuguese. A terrified woman hiding inside a closet, speaking very quietly and fast to an emergency operator on the phone, breathless, voice trembling.
```

Texto:

```
Por favor, venham rápido. Ele está dentro da minha casa.
```

Ela entra duas vezes no vídeo, no começo (tela preta) e no eco logo depois de "É você", com o mesmo áudio. Se o sussurro não ficar bom, ele é feito na mixagem.

## Se usar o Cloud Text-to-Speech em vez do AI Studio

Cole os mesmos textos, sem a instrução de estilo. Vozes: pt-BR-Neural2-B para o narrador e pt-BR-Neural2-C para a mulher, com velocidade 0,9.

## Depois

Mandar os dois áudios (wav ou mp3). A narração é cortada por frase, os cortes do vídeo seguem a voz, entram as legendas e o vídeo é renderizado de novo.
