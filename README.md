# Palanq

Percorre os **12 planos de governo registrados** da eleição presidencial de 2026 —
788 páginas — e indica quais candidaturas mais se alinham às posições que **você**
declara, sempre mostrando o que ficou sem investigar e sempre citando a fonte.

Duas telas sobre o mesmo motor e o mesmo corpus:

| | onde | o que é |
|---|---|---|
| **cartões** | `/` | o produto. Um tema por vez, deslizando; o cartão vira e explica a proposta em linguagem leiga; para assim que o resultado está decidido; resultado em gráfico |
| **motor** | `/motor` | o instrumento completo: por que cada pergunta veio, as citações, o relatório, a auditoria da curadoria |

As perguntas, a ordem e as fórmulas são as mesmas nas duas. O que muda é a forma de
responder e o quanto a tela explica.

**Não recomenda voto.** Compara posições declaradas em documentos e ignora, por
construção: histórico de mandato, capacidade de execução, coalizão, financiamento de
campanha e a distância conhecida entre plano de governo e governo.

Porte do motor de restrições descrito em [`MOTOR-E-PORT-POLITICO.md`](MOTOR-E-PORT-POLITICO.md),
originalmente escrito para outro domínio — o classificador iterativo de transtornos da
CID-11, em
[`leoscastilho/classificador-iterativo-transtornos-mentais`](https://github.com/leoscastilho/classificador-iterativo-transtornos-mentais).
Motor híbrido: **eliminação** para o que o usuário declara inegociável, **acumulação**
para o resto.

## Rodar

```bash
node tools/servir.mjs      # http://localhost:8731
```

Ou abra `index.html` (ou `motor/index.html`) com duplo clique — as duas páginas são
autocontidas e funcionam offline.

Sem `npm install`: **zero dependências**, Node 18+ apenas para os scripts.

```bash
npm run corpus             # regenera data/corpus.json e perfis/ a partir de source/
npm run validate           # 16 travas + travas de processo — bloqueia o build
npm test                   # 59 testes do motor + 7 perfis de referência
npm run perfis:cobertura   # o que nenhum perfil exercita
npm run perfis:mutacao     # o que pode ser apagado do corpus sem ninguém acusar
npm run build              # valida e escreve index.html e motor/index.html
```

`index.html` e `motor/index.html` são versionados e é o que o GitHub Pages serve. A
CI recusa o deploy se estiverem desatualizados em relação às fontes.

## Estrutura

```
source/propostas/  os 12 planos de governo registrados, em PDF — as fontes
source/*.md        resumos de terceiro, usados só para descobrir o que investigar
data/corpus.json   o corpus (gerado, versionado)
data/_paginas.json texto dos planos, página a página (gerado do PDF)
tools/extracao/    o pipeline de citação: quais trechos sustentam quais posturas
src/motor.mjs      o motor. PURO: sem Date, sem I/O, sem dependências
src/validar.mjs    validarCorpus() — as 16 travas do §24
src/relatorio.mjs  montarRelatorio() — única função com efeito de ambiente
src/perfis.mjs     executor de perfis: verificação, cobertura, mutação
src/ui.js          interface, sem framework
src/swipe.*        a tela de cartões
tools/build.mjs    empacota tudo nas duas páginas
docs/CURADORIA.md  as decisões de curadoria e o viés que elas embutem
```

## Como o motor decide

**Pergunta primeiro o que mais separa.** A ordem é dada por
`ganho = nFavor × nContra × peso`. Um eixo em que todas as candidaturas pensam igual
não separa ninguém e por isso não é perguntado, por mais central que seja.

**Discordar junto é concordar.** `discordo` + plano `contra` conta como alinhamento.
Só contar concordâncias positivas subestima quem se opõe às mesmas coisas que você.

**Silêncio não conta a favor.** Se o plano não fala do assunto, isso não vira
concordância — vira **cobertura** menor. Afinidade e cobertura nunca aparecem
separadas, porque afinidade sem cobertura mente: quem fala pouco erra pouco.

**Não opinar é resposta.** O ponto sai da conta em vez de virar meio-ponto para
alguém. O motor distingue internamente "não opinou" de "não foi perguntado", e as
duas coisas aparecem separadas no relatório.

**Eixo que não separa fica fora da conta.** Incluir um consenso do campo no ranking
inverte a ordem em favor de quem falou menos — é demonstrável e está no §20 da
especificação, com o contraexemplo virando teste literal. Esses eixos viram uma
métrica própria, `afinidade com o campo`, que responde outra pergunta: *o quanto este
campo eleitoral inteiro me representa*.

**Inegociável elimina, e nunca em silêncio.** Marcar um ponto como inegociável não é
dar peso alto a ele: quem pensa diferente sai da comparação, e sai com a frase do
plano que causou a eliminação. Se todas caírem, o instrumento mostra a ordem que
existiria sem os inegociáveis em vez de devolver conjunto vazio.

**A gente para quando já está decidido.** A cada resposta o motor calcula o intervalo
em que a afinidade de cada candidatura ainda pode terminar; quando nenhuma resposta
futura consegue mudar quem lidera, a tela de cartões vai ao resultado. A garantia
cobre quem lidera, não a ordem inteira — e o resultado diz isso.

A garantia sozinha pode chegar com 5 respostas, o que é correto e ruim: o resultado
fica apoiado em pouca coisa e o gráfico sai quase todo hachurado. Por isso a tela de
cartões só aceita a parada depois de **10 perguntas** e **8 temas distintos**
(`MINIMO` e `MINIMO_TEMAS` em `src/swipe.js`) — pisos de produto, não do motor.

Os dois são limitados pelo que existe: marcar um tema como inegociável elimina
candidaturas, e isso pode encolher o questionário para menos de dez perguntas. Medido
na ordem atual, o oitavo tema distinto aparece na nona pergunta, então quem manda de
fato é o piso de dez; o de temas é rede de proteção para o caso de o corpus mudar e a
ordem passar a agrupar assuntos.

**Dá para encerrar a qualquer momento.** Abaixo dos botões de resposta há um
"segure para encerrar agora" que leva ao resultado de onde estiver — nas perguntas
iniciais, nos temas restantes ou nos complementares. É apertar e segurar, não clicar:
um toque acidental jogaria fora o resto do questionário, e segurar pede confirmação
sem enfiar uma caixa de diálogo no meio do fluxo. Soltar antes do fim cancela, e a
barra volta a zero sem transição para o cancelamento ficar óbvio.

O resultado que sai daí diz que veio de uma parada antecipada e o que isso custa em
confiança — se a liderança já está fechada ou se a ordem ainda pode virar no topo. E
os mesmos botões de sempre continuam ali para retomar de onde parou; nada se perde.

**Depois da decisão, dá para continuar — sem mexer no ranking.** O resultado oferece
dois caminhos, nessa ordem. Primeiro os temas divisivos que sobraram ("responder os N
restantes"): esses ainda contam, e podem mudar a ordem. Depois deles, os **25 temas
unilaterais** — aqueles em que só um lado tem plano escrito. Eles ficam fora do
ranking por construção (§20: incluir tema não discriminante inverte a ordem em favor
de quem escreveu menos), e o motor só os entrega quando `complementar: true` é pedido
explicitamente.

O que eles servem é para a pergunta que o ranking não responde: *eu discordo de quem
eu pretendia votar?* Medido no corpus atual, respondê-los leva as posições avaliáveis
de **130 para 214 (+65%)**, e o ganho é maior justamente para quem hoje quase não dá
para avaliar — Grassi 3→11, Cury 5→13, Flávio 10→19. A barra de cada candidatura fica
igual; o que cresce é a lista de divergências que ela abre.

Essa lista abre numa folha sobreposta, não num acordeão dentro da linha do gráfico.
A citação é literal — logo, longa — e numa coluna de ~40 caracteres ela não era
legível. A folha cobre a tela, o resultado fica intacto atrás dela na mesma posição
de rolagem, e a volta é ✕, Esc, toque no fundo ou o botão no fim da lista.

Na prática isso exigiu `opts.pularPortoes` no motor: os portões (fase 3) vêm antes da
fase complementar, e a tela de cartões trata o conteúdo deles na abertura, não como
cartão. Sem a opção, um portão não respondido bloquearia a fase 4 para sempre.

**Cada tema explica a si mesmo.** Todo tema tem um texto curto em linguagem leiga —
o que a proposta quer dizer na prática, e uma frase para cada lado onde o desacordo é
real. É o que o cartão mostra ao virar. Como é prosa sem citação que a ancore, é o
conteúdo mais fácil de enviesar do projeto e o que mais precisa de revisão externa;
ver [`docs/CURADORIA.md`](docs/CURADORIA.md).

**Empate é resultado válido.** Candidaturas dentro da margem (padrão 0,05) aparecem
lado a lado, sem ordem entre elas. Os pesos foram escolhidos à mão e não têm precisão
para separar 0,84 de 0,81.

## Privacidade

Sem servidor, sem telemetria, sem requisição externa. A sessão fica em `localStorage`,
neste aparelho, com exportação e importação em JSON. As respostas do usuário são as
posições políticas dele: a única defesa que não depende de confiança é não ter para
onde mandá-las.

## Estado do corpus

`status: draft`. **Todas as 200 posturas são trechos literais dos planos de governo
registrados, com número de página**, e cada citação linka o PDF completo. 16 delas
(8%) carregam uma inferência do curador, declarada no corpus e exibida em destaque ao
lado do trecho.

O que ainda falta para `verified` é revisão por alguém que não montou o corpus: a
escolha de **quais eixos existem** e de **qual trecho** representa cada candidatura
continua sendo do curador, e nenhuma trava técnica protege contra isso. O validador
recusa a promoção enquanto `curadoria.revisadoPor` estiver vazio.

Leia [`docs/CURADORIA.md`](docs/CURADORIA.md) antes de confiar em qualquer resultado —
inclusive a lista das inferências mais frágeis e do que a mutação não cobre.

## Licença

[MIT](LICENSE). A licença cobre o código; os trechos citados em `data/corpus.json` são
reproduções de planos de governo registrados, que são documentos públicos, e os PDFs em
`source/propostas/` são dos respectivos autores. Ver o próprio arquivo de licença.

© 2026 Leo Castilho.
