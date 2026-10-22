# Análise: vídeo dos US$ 20 milhões

Vídeo vertical 720x1280, 84 s, formato "história interativa em 2ª pessoa" com final de votação para a Parte 2.

## Resumo em uma linha

Você acha US$ 20 milhões em duas malas na beira da estrada, leva para casa, descobre um celular dentro de uma mala com mensagens de um desconhecido mandando devolver uma até meia-noite, o celular morre, e o público vota: DEVOLVER ou FICAR.

## Como o vídeo é feito (técnica)

- **Imagens estáticas, não vídeo de verdade.** São cerca de 15 ilustrações no mesmo estilo cartoon (personagem de boné preto, moletom cinza, tênis brancos, rosto simples). Cada uma fica 2 a 5 s na tela com zoom lento ou leve movimento. Isso combina com a regra de gerar imagens primeiro (grátis).
- **Personagem consistente.** O mesmo boneco aparece em todos os cenários, então foi feito a partir de uma imagem de referência.
- **Três ambientes só:** estrada no pôr do sol, sala de estar com luz de abajur à noite, e closes em primeira pessoa (mãos, celular, mesa).
- **Narração TTS** em inglês, voz masculina calma, frases curtas.
- **Legenda palavra por palavra** no centro inferior, fonte grossa branca com contorno.
- **Cards de interface** (fundo preto, borda verde, texto branco) que reforçam números e mensagens: "YOU JUST FOUND $20,000,000" com contador subindo, "200,000 BILLS", "≈ 200 KG", lista "1. Quit your job / 2. Pay off debts", mensagens do "UNKNOWN SENDER", bateria 1% → 0%, relógio 11:47 P.M. e "13 MINUTES", botões RETURN / KEEP.
- **Um frame de transição em negativo** (raio X) quando ele acha o celular escondido, para marcar a virada.

## Por que viraliza (estrutura)

1. **Gancho nos 2 primeiros segundos:** "You just found $20 million" com o número subindo na tela.
2. **Segunda pessoa ("você"):** o espectador vira o protagonista.
3. **Detalhes "realistas" que dão credibilidade:** 200 mil notas, 400 libras de peso. O público adora esse tipo de cálculo.
4. **Fantasia rápida** (largar o emprego, pagar dívidas, comprar casa para os pais) e logo depois a **virada** (o celular escondido).
5. **Tensão crescente:** mensagens, ligação ignorada, prazo de meia-noite, 13 minutos, bateria morrendo.
6. **Final aberto com votação:** "Comment RETURN or KEEP, your vote decides part 2". Isso gera comentários em massa (o algoritmo ama) e garante uma série.

## Roteiro transcrito com cenas

| Tempo | Narração | Imagem / card |
| --- | --- | --- |
| 0:00 | You just found $20 million. Not in your account. | Personagem agachado abrindo mala cheia de dinheiro na estrada ao pôr do sol. Card contador até $20,000,000 |
| 0:04 | In two suitcases, beside a car nobody's coming back for. | Mesma cena, duas malas, carro escuro ao lado |
| 0:08 | You open one. It's packed with $100 bills. They look real. | Close: ele segura um maço de notas |
| 0:13 | There's nobody around, so you take both. | Plano aberto: ele em pé, malas no chão, estrada vazia |
| 0:16 | One problem: $20 million in cash weighs over 400 pounds. | Ele arrastando a mala com esforço. Cards "200,000 BILLS" e "≈ 200 KG / 441 LB" |
| 0:20 | You drag the bags to your car, then finally make it home. | Ele colocando a mala no porta-malas, farol passando ao fundo |
| 0:24 | Lock the door, close the curtains. | Em casa, trancando a porta, malas no chão |
| 0:26 | $20 million. You could quit tomorrow. Pay off everything. Buy your parents a house. | Sentado no sofá olhando as malas abertas. Card com lista 1, 2, 3 sendo digitada |
| 0:32 | But then you find something hidden inside one of the bags. A phone. | Frame em negativo, depois close POV da mão achando um celular entre as notas |
| 0:37 | One unread message. "Did you get both cases?" | POV: mãos segurando o celular. Card "UNKNOWN SENDER", bateria 1% |
| 0:40 | Before you can answer, another message arrives. "Good." | Ele no sofá olhando o celular, depois card "Good." |
| 0:44 | You look toward the window. Nothing. | Ele espiando pela cortina |
| 0:46 | Then the phone rings. You don't answer. | Close de cima: celular na mesa, card "INCOMING CALL" |
| 0:51 | A final message. "Keep one. Bring the other back." An address appears. Then a deadline. Midnight. | POV de cima: pés no sofá, duas malas no tapete. Cards com mensagem e "18 MERCER ROAD" |
| 0:58 | You check the time. 11:47. | Card "11:47 P.M. / 13 MINUTES LEFT TO DECIDE" |
| 1:01 | The phone dies. | Celular na mesa, card "1% → 0% CONNECTION LOST" |
| 1:03 | Whoever sent those messages already knows you have the money. | Ele em pé na sala escura, olhando para a porta |
| 1:07 | So what do you think he should do? Return one suitcase and walk away with $10 million? Or keep both and risk everything? | Close no rosto preocupado. Botões RETURN e KEEP |
| 1:15 | What would you choose? Comment RETURN or KEEP. Your vote decides what happens in part two. | Mesmo close, card "COMMENT RETURN OR KEEP / YOUR VOTE DECIDES PART 2" |

## Como recriar (fórmula)

1. Gerar 1 personagem de referência no estilo cartoon.
2. Gerar 3 ambientes vazios (estrada no pôr do sol, sala à noite, mesa vista de cima).
3. Gerar cerca de 15 cenas: personagem no ambiente, usando as referências.
4. Narração TTS + legenda palavra por palavra + cards verdes por cima (isso dá para montar com ffmpeg aqui).
5. Final com votação e Parte 2.

## Ideias para campanhas de marketing

- **Dilema de marca:** "Você ganhou um ano de \[produto\] grátis, mas tem uma condição..." com votação nos comentários.
- **Série com o mesmo mascote:** o personagem vira o rosto da marca e cada parte é decidida pelo público.
- **Cálculo curioso:** usar o truque dos números ("20 milhões pesam 200 kg") com dados do produto, tipo "quantos litros de refrigerante cabem num carro".
