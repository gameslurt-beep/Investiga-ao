import json, html
T = json.load(open('br50.json'))

CANAIS = [
 ("Capital Financeiro", "Geografia e geopolítica com satélite. Um lugar destacado em cor forte, nomes escritos no mapa, quase sem frase."),
 ("Professor HOC", "Geopolítica com apresentador. Rosto do professor + líderes ou cenário de guerra, quase sem texto."),
 ("Geo History", "Mapa político chapado, ano no topo, nome do assunto em letra grande. O formato é a promessa: 'entenda num mapa'."),
 ("Globalizando Conhecimento", "História de países e estados. Satélite, a forma do lugar preenchida, vizinhos rotulados."),
 ("EconoSimples", "Satélite com um país aceso e uma frase curta que cria conflito ou dá um número."),
 ("geo ilustrada", "Aula para o ENEM, desenho à mão. É o contraponto da amostra: título e miniatura repetem de propósito."),
 ("Mundo Entrópico", "Copia a fórmula do Capital Financeiro (estado aceso, seta, pergunta curta) e estoura sendo pequeno."),
 ("Entre os Mapas", "Documentário de paisagem. Foto aérea surpreendente + o nome do estado em letra enorme."),
 ("O Mapa Não Mente", "O mais parecido com o nosso visual: mapa escuro, estado aceso em laranja, provocação curta com ponto de interrogação."),
 ("Video Mapas", "História alternativa com countryballs. Brasil maior ou menor, dois lados em guerra."),
]

A = [
# Capital Financeiro
("Uma potência (China), um verbo de escala (revolucionar) e o nosso continente como alvo.",
 "A bandeira da China pintada sobre o Brasil, com uma ferrovia cortando os estados e as siglas AC, RO, MT, GO, MG escritas no caminho.",
 "O título fala em revolução; a imagem mostra o Brasil tomado de vermelho. Quem assiste procura a sigla do próprio estado dentro do plano chinês. É esperança e ameaça ao mesmo tempo, e nos dois casos é sobre ele."),
("O Brasil inteiro como autor de algo grande, com o 'finalmente' que fala com uma frustração antiga.",
 "Nenhuma frase. O Brasil verde, os estados da rota em amarelo com as siglas (PA, TO, GO, SP, PR, SC) e a ferrovia descendo.",
 "O título dá o orgulho; a miniatura deixa cada um achar o seu estado na linha. O pertencimento vem pela sigla, sem precisar escrever nada."),
("'Brasileiros' põe o espectador na frase; litoral de SP é um lugar que milhões já visitaram.",
 "SP em satélite, só a faixa do litoral em vermelho, seta e a pergunta 'Por que é “Vazio?”'.",
 "O título diz o lugar; a miniatura aponta o pedaço exato e põe 'vazio' entre aspas. Contradiz o que o paulista vê no verão (praia lotada), então ele clica para conferir ou discordar."),
("Juízo forte ('o pior erro da história') com o Brasil do lado vencedor.",
 "Só nomes: o Paraguai em laranja, espremido entre o Brasil verde e a Argentina azul.",
 "O título dá o veredito; o mapa mostra o tamanho. O Paraguai pequeno ao lado do Brasil gigante explica sem palavras quem venceu. Troféu para compartilhar."),
("Decisão surpreendente: abandonar território foi bom.",
 "China vermelha, Mongólia em amarelo encaixada no desenho, Rússia azul em cima. Só nomes.",
 "O título afirma o paradoxo; o mapa mostra o 'buraco' amarelo dentro da China. O olho pergunta por que aquele pedaço não é chinês."),
# HOC
("A hipótese clássica 'E se', com o maior vilão da história.",
 "O professor em primeiro plano; atrás, a Europa em chamas com o símbolo nazista sobre o mapa. Sem texto.",
 "O título faz a pergunta; a miniatura já mostra o mundo alternativo pegando fogo. O rosto do professor dá a autoridade de quem vai explicar."),
("Notícia do momento com virada ('vira o jogo') e ameaça a um poderoso.",
 "Duelo: Putin de um lado, Zelensky do outro, separados por uma rachadura, drones no céu.",
 "O título conta a virada; a miniatura monta o confronto. Dois lados frente a frente, cada um com a sua cor."),
("Alarme sobre o próprio país: 'a ameaça que ninguém quer enxergar'.",
 "Cara de arquivo secreto: mapa do Brasil num monitor e 'TERRORISMO NO BRASIL' em letra grande, vermelho no 'Brasil'.",
 "Aqui a miniatura repete o tema, porque o tema é o ímã (medo sobre o nosso lugar). O título acrescenta o que falta: ninguém está vendo."),
("Nome famoso + promessa grande ('pode mudar o mundo').",
 "Musk e o professor lado a lado, satélites ao fundo. Sem texto.",
 "O nome está no título e o rosto famoso na imagem. A miniatura não precisa explicar: quem reconhece o Musk já quer saber o que ele fez."),
("Pergunta de confronto: 'Ela vai enfrentar a Rússia?'.",
 "Bandeira da Alemanha à esquerda, da Rússia à direita, os dois líderes e tanques no meio.",
 "O título pergunta; a miniatura monta a guerra que ainda não aconteceu. Duelo em cores opostas."),
# Geo History
("Assunto do momento + a promessa do canal: 'explicado num mapa'.",
 "O próprio mapa: cores chapadas por país, o ano '2023' no topo, rostos dos líderes nas capitais e 'THE RUSSO-UKRAINIAN WAR'.",
 "A miniatura mostra o formato: quem clica já sabe que vai entender a guerra pelo mapa. Repete o nome porque a guerra era a maior notícia do mundo."),
("Só o nome do evento.",
 "'WORLD WAR I', 'December 1916' no topo, as alianças coloridas e a legenda.",
 "O tema é enorme e o ano no topo promete o mapa andando no tempo. Repetir funciona porque o assunto atrai sozinho."),
("Conflito explicado num mapa.",
 "Mapa de 1948 com a legenda de territórios (Israel, Líbano, Síria, Egito...).",
 "A legenda colorida promete o que todo mundo quer e não tem: entender quem é quem. O título e a miniatura dizem a mesma coisa, mas o assunto é o ímã."),
("'A história completa da Alemanha num mapa, de 600 a.C. a 1990.'",
 "Um momento confuso (1849): Prússia, Áustria, Confederação Germânica, sinais de proibido sobre as cidades.",
 "O título promete tudo em um vídeo; a miniatura mostra a bagunça que o vídeo vai organizar."),
("O petróleo contado num mapa.",
 "A palavra 'PETROLEUM' pingando óleo sobre o mapa-múndi, com o gráfico do preço do barril ao lado.",
 "A palavra vira imagem: o óleo escorrendo faz o tema parecer vivo e o gráfico promete dados."),
# Globalizando
("'Uma das cidades mais antigas do mundo': superlativo que contrasta com a guerra de hoje.",
 "Satélite real, a Faixa de Gaza fininha em verde, Israel e Egito rotulados em vermelho, 'A HISTÓRIA DA FAIXA DE GAZA'.",
 "A miniatura localiza (o lugar é minúsculo entre dois vizinhos) e o título acrescenta a surpresa (é antiquíssima). Pegou o noticiário na hora certa."),
("'Origem e formação da maior potência europeia.'",
 "O contorno da Alemanha preenchido com a bandeira sobre o satélite e 'A HISTÓRIA DA PODEROSA ALEMANHA'.",
 "A miniatura põe o adjetivo 'poderosa', que dá o juízo; a bandeira dentro da forma faz o país ser reconhecido em um segundo."),
("'Suméria: a primeira grande civilização da humanidade.'",
 "Uma cidade antiga ilustrada e a frase 'O INÍCIO DA HISTÓRIA'.",
 "Ótimo exemplo de completar: a miniatura não usa 'Suméria' (nome que pouca gente conhece) e troca por uma ideia enorme, 'o início da história'. O título dá o nome."),
("'De capitania rica a estado pobre': a virada fica no título.",
 "O Maranhão verde no satélite com a bandeira do estado fincada e 'HISTÓRIA DO MARANHÃO'.",
 "A miniatura chama o maranhense pela forma e pela bandeira do estado; o título conta a queda. Estado brasileiro nomeado, pertencimento direto."),
("'O lar de algumas das cidades mais antigas do mundo.'",
 "Satélite do Oriente Médio, o Líbano em verde com uma seta, Síria, Israel, Jordânia e Egito rotulados.",
 "A miniatura localiza um país pequeno pelos vizinhos famosos; o título dá o superlativo."),
# EconoSimples
("Neutro: 'História da Itália, documentário histórico'.",
 "O mapa da Itália com o norte verde marcado 'Rico' e o sul laranja marcado 'Pobre?', com setas.",
 "O título não tem conflito nenhum; a miniatura cria o conflito (rico contra pobre dentro do mesmo país). É a miniatura que vende o vídeo."),
("'Como é o país mais estranho do mundo?'",
 "O Turcomenistão vermelho, brilhando, com uma caveira dentro e 'MAIS ESTRANHO DO MUNDO'.",
 "Um país que ninguém conhece vendido pelo superlativo. A caveira acrescenta perigo, que o título não diz."),
("'Como a Linha do Equador foi criada?'",
 "O mapa-múndi com a linha brilhando e 'POR QUE FOI CRIADA?'.",
 "Algo que todo mundo aprendeu na escola, com uma pergunta que ninguém fez. A contradição é com o óbvio: a linha parece natural, mas alguém a criou."),
("'Quem são os vizinhos da China?'",
 "A China vermelha no satélite com a frase incompleta 'AO LADO DA:' e 'CHINA'.",
 "A frase da miniatura fica pela metade de propósito; o título pergunta. A curiosidade é completar a lista."),
("'Por que o litoral da Colômbia está vazio?'",
 "A Colômbia verde, o litoral em vermelho com seta, 'LITORAL DA COLÔMBIA ESTÁ VAZIO' e '2% VIVE AQUI'.",
 "O título pergunta; a miniatura dá o número que choca (2%). O dado fica na imagem. É a mesma fórmula do 'vazio' do Capital Financeiro."),
# geo ilustrada
("Título de busca escolar: 'Continente Americano: aspectos físicos, naturais e humanos'.",
 "Desenho à mão: Estátua da Liberdade, Cristo, o mapa e a lista de tópicos.",
 "Título e miniatura repetem a matéria de propósito: o público chega procurando a aula para a prova. Funciona pela busca, não pela curiosidade."),
("'Os elementos e fatores climáticos.'",
 "Três painéis desenhados (sol, água, árvore) e o nome da matéria numa nuvem.",
 "Mesma lógica: a miniatura é a capa da aula. Repetir aqui ajuda quem está buscando."),
("'Os agentes internos e externos do relevo.'",
 "Desenho dividido: externos (chuva, sol) contra internos (camadas da Terra), com setas.",
 "Até na aula aparece o duelo: dois lados lado a lado."),
("'Bacias hidrográficas do Brasil: definição e características.'",
 "'O que são?' e 'As bacias brasileiras' com setas, como um índice.",
 "A miniatura é um sumário: mostra o que a aula responde."),
("'Nova Ordem Mundial: resumo ilustrado.'",
 "A águia dos EUA contra o dragão chinês sobre o globo.",
 "Repete o tema, mas o desenho cria o duelo de potências."),
# Mundo Entrópico
("'Por que o litoral do Piauí é tão esquecido?': estado nomeado e uma pequena injustiça.",
 "O Piauí verde com 'PI', uma lupa sobre o litoral mostrando uma praia bonita, seta e 'POR QUE “NINGUÉM” VAI LÁ?'.",
 "A lupa mostra uma praia linda e a frase diz que ninguém vai: contradição dentro da própria miniatura. O título acrescenta 'esquecido', que o piauiense quer contestar."),
("'Por que existem duas Guianas? (E o Brasil ficou com uma)'",
 "As duas Guianas em vermelho, com setas e 'POR QUE?'.",
 "A miniatura mostra a estranheza visual (dois pedaços iguais lado a lado); o título guarda o gancho de pertencimento entre parênteses: o Brasil está na história."),
("'Por que quase ninguém mora no Uruguai?'",
 "O Uruguai vermelho entre Brasil e Argentina, seta e 'UM PAÍS VAZIO'.",
 "O vizinho que todo brasileiro conhece + a palavra 'vazio'. A miniatura afirma, o título pergunta."),
("'Por que Recife tem tantos ataques de tubarão?'",
 "Sem mapa: foto aérea de uma praia lotada com sombras de tubarões na água e 'A PRAIA PROIBIDA'.",
 "A miniatura não diz Recife, mostra o perigo; o título dá o lugar. Medo + lugar conhecido."),
("'Por que tão poucos brasileiros vivem no litoral do Paraná?'",
 "O Paraná verde, o litoral em vermelho, seta e 'POR QUE É “VAZIO?”'.",
 "É a cópia exata do vídeo do litoral de SP do Capital Financeiro, e funcionou de novo (1,3 milhão num canal de 62 mil). Prova de que a fórmula é transferível."),
# Entre os Mapas
("'Você NÃO vai acreditar que isso fica em Minas Gerais.'",
 "Foto aérea de montanhas de pedra e 'MINAS GERAIS' em letra enorme.",
 "A miniatura junta o nome do estado com uma paisagem que ninguém associa a ele; o título promete a surpresa. O mineiro compartilha com orgulho ('olha o que nós temos')."),
("'Os cenários mais surreais já criados pela natureza.'",
 "Uma ruína sobre uma mesa de pedra no meio da floresta e 'MARAVILHAS DO PLANETA', com selo 4K.",
 "Beleza pura e superlativo. O selo 4K promete qualidade de documentário."),
("'Os lugares mais surreais do Rio de Janeiro que vão te deixar sem palavras.'",
 "Os picos da serra com nuvens e 'RIO DE JANEIRO'.",
 "Um Rio que não é praia nem cidade: a imagem contradiz o clichê, o título promete o choque."),
("'Mato Grosso: muito além do Pantanal.'",
 "Cachoeiras num cânion e 'MARAVILHAS DO MATO GROSSO'.",
 "O título nega o clichê ('além do Pantanal') e a imagem prova com uma paisagem inesperada."),
("'Você não vai acreditar que isso fica no Rio Grande do Sul.'",
 "Cachoeira com arco-íris e 'RIO GRANDE DO SUL'.",
 "Mesma fórmula do vídeo de Minas: nome do estado + imagem surpreendente + 'você não vai acreditar'."),
# O Mapa Não Mente
("'Por que NENHUM outro estado é como Minas Gerais': orgulho de identidade.",
 "Mapa escuro, Minas aceso em laranja, a palavra 'NORDESTE' acima, foto de chão seco com '44,8°C' e 'MINAS É NORDESTE?'.",
 "O melhor par da amostra. O título dá o orgulho; a miniatura provoca com uma pergunta que todo mineiro quer responder ('não é!') e o resto do Brasil quer discutir. Os dois lados comentam, como no 'E a sua virou?'."),
("'Por que NENHUM outro estado é como a Bahia.'",
 "A Bahia em relevo dividida em duas cores (verde no litoral, laranja no sertão) com linha brilhante e 'DUAS BAHIAS'.",
 "O título diz que a Bahia é única; a miniatura revela o segredo: são duas. Duelo dentro do próprio estado."),
("'Por que NENHUM outro estado é como o Maranhão.'",
 "O Maranhão aceso entre Pará e Piauí, uma linha tracejada, e 'MARANHÃO É NORTE?'.",
 "A mesma provocação de região do vídeo de Minas. Pergunta de identidade que o maranhense responde no comentário."),
("'Por que NENHUM outro estado é como o Acre.'",
 "Só o contorno do Acre brilhando no escuro e 'NUNCA DEVERIA SER NOSSO'.",
 "Provocação forte: o acreano quer defender o estado, o resto do Brasil quer saber por quê. Lembra a piada de que 'o Acre não existe'."),
("'O Brasil quase virou vários países: o mapa de como seria.'",
 "O Brasil dividido em blocos coloridos e 'BRASIL DIVIDIDO?'.",
 "O título já dá a resposta (quase virou); a miniatura mostra o mapa partido e pergunta. É o tema mais próximo do nosso vídeo de SP."),
# Video Mapas
("'E se a história acontecesse perfeita para o Brasil?'",
 "Um Brasil gigante com legendas ('escravidão abolida', 'acesso ao Pacífico', 'monarquia') e o countryball do Império.",
 "O título faz a hipótese; a miniatura mostra o Brasil maior e melhor. Orgulho em forma de desejo."),
("'A Guerra dos Farrapos.'",
 "O countryball do Rio Grande do Sul contra o do Império, com rifles cruzados, sobre o mapa.",
 "Repete o nome, mas a imagem cria o duelo. Assunto de identidade gaúcha."),
("'E se a história fosse perfeita para a Alemanha?'",
 "Mapa escuro com um soldado e 'HISTÓRIA PERFEITA'.",
 "A mesma fórmula do vídeo do Brasil, com outro país: rendeu 3,6x contra 12,3x. Sem o 'nós', a fórmula perde força."),
("'Guerra civil alternativa no Brasil.'",
 "O Brasil dividido em vermelho, countryballs de partidos contra o Brasil e rostos de políticos.",
 "Polarização em forma de guerra: dois lados, cores opostas."),
("'E se a história do Brasil fosse a pior possível?'",
 "'BOSTIL' em letra grande com o countryball do Brasil sob armas.",
 "A versão negativa do mesmo canal: 2,6x contra 12,3x da versão positiva. A mesma ideia rende cinco vezes menos quando o Brasil perde."),
]
assert len(A) == 50

def fmt(n):
    if n >= 1_000_000: return f"{n/1_000_000:.1f}".replace('.', ',').replace(',0', '') + " mi"
    return f"{round(n/1000)} mil"

LICOES = [
 ("O título dá o orgulho; a miniatura, a provocação",
  "O melhor par da amostra: o título diz 'Por que nenhum outro estado é como Minas Gerais' e a miniatura pergunta 'MINAS É NORDESTE?'. Um afaga, o outro cutuca. O mineiro clica para defender o estado, o resto do Brasil para discutir.", [40, 42]),
 ("Mapa escuro ou satélite, um lugar aceso e os vizinhos com nome",
  "Capital Financeiro, Globalizando, EconoSimples, Mundo Entrópico e O Mapa Não Mente usam a mesma gramática: o assunto em cor forte e o resto apagado. O olho acha o lugar em um segundo, e os nomes dos vizinhos dizem onde fica.", [3, 15]),
 ("A miniatura traz o número ou o conflito que falta no título",
  "'História da Itália' é um título sem graça; a miniatura cria o conflito 'Rico / Pobre?'. 'Por que o litoral da Colômbia está vazio?' ganha o número '2% vive aqui' na imagem. 'Por que nenhum outro estado é como a Bahia' ganha 'DUAS BAHIAS'.", [20, 24]),
 ("Pergunta de 2 a 4 palavras, com ponto de interrogação",
  "'Por que é “vazio?”', 'Minas é Nordeste?', 'Maranhão é Norte?', 'Brasil dividido?', 'Por que “ninguém” vai lá?'. Curta, sobre um lugar que a pessoa conhece, e com uma resposta que ela acha que sabe.", [34, 44]),
 ("A fórmula vale mais que o tamanho do canal",
  "O Mundo Entrópico (62 mil inscritos) copiou o 'por que é vazio' do Capital Financeiro e fez 1,3 milhão. O Mapa Não Mente (24 mil) fez 573 mil com 'nenhum outro estado é como a Bahia'. Os dois canais pequenos têm as maiores notas da amostra.", [2, 34]),
 ("O Brasil que ganha rende mais que o Brasil que perde",
  "No Video Mapas, 'E se a história fosse perfeita para o Brasil?' fez 12,3x; 'E se a história do Brasil fosse a pior possível?' fez 2,6x. A mesma ideia com outro país (Alemanha) fez 3,6x. Sem o 'nós', e sem o lado vencedor, a fórmula perde força.", [45, 49]),
]

def card(i):
    t = T[i]; a = A[i]
    return f'''<article class="par" id="v{i}">
  <a class="thumb" href="https://youtu.be/{t['id']}" target="_blank" rel="noopener"><img src="img/{t['id']}.jpg" alt="Miniatura: {html.escape(t['title'])}" loading="lazy" width="640" height="360"></a>
  <div class="txt">
    <div class="meta"><span class="nota">{str(t['ratio']).replace('.', ',')}x</span><span>{fmt(t['views'])} views</span></div>
    <h4>{html.escape(t['title'])}</h4>
    <dl>
      <div><dt>Título</dt><dd>{html.escape(a[0])}</dd></div>
      <div><dt>Miniatura</dt><dd>{html.escape(a[1])}</dd></div>
      <div class="juntos"><dt>Juntos</dt><dd>{html.escape(a[2])}</dd></div>
    </dl>
  </div>
</article>'''

def mini(i):
    t = T[i]
    return f'<figure><img src="img/{t["id"]}.jpg" alt="" loading="lazy" width="640" height="360"><figcaption>{html.escape(t["canal"])} · {str(t["ratio"]).replace(".", ",")}x<br><b>{html.escape(t["title"])}</b></figcaption></figure>'

licoes = "\n".join(f'''<section class="licao"><h3>{html.escape(h)}</h3><p>{html.escape(p)}</p><div class="duas">{mini(ex[0])}{mini(ex[1])}</div></section>''' for h, p, ex in LICOES)

canais = []
for c in range(10):
    t0 = T[c*5]
    nome, desc = CANAIS[c]
    canais.append(f'''<section class="canal" id="canal{c}">
  <header><h3>{html.escape(nome)}</h3><span class="subs">{fmt(t0['subs'])} inscritos</span></header>
  <p class="estilo">{html.escape(desc)}</p>
  {''.join(card(c*5+k) for k in range(5))}
</section>''')

indice = " · ".join(f'<a href="#canal{c}">{html.escape(CANAIS[c][0])}</a>' for c in range(10))

page = open('molde.html').read().replace('%%LICOES%%', licoes).replace('%%CANAIS%%', "\n".join(canais)).replace('%%INDICE%%', indice)
open('pagina/index.html', 'w').write(page)
print(len(page))
