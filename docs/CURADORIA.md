# Curadoria — decisões, viés e o que não foi verificado

> A escolha de quais eixos existem e de qual trecho representa a posição de cada
> candidatura determina o resultado **antes de qualquer resposta do usuário**.
> Este documento existe para tornar essa escolha atacável. Se você discorda dela,
> discorda do instrumento inteiro — e deveria.

## 1. Fontes

**Toda postura deste corpus é um trecho literal de um plano de governo registrado,
com número de página.** Os 12 PDFs estão em `source/propostas/` — 788 páginas ao
todo — e cada citação exibida na interface linka o documento completo.

| Arquivo | Papel |
|---|---|
| `source/propostas/*.pdf` | **as fontes.** Os planos registrados, na íntegra |
| `source/propostas.md` | resumo curatorial de terceiro. Usado só para **descobrir** quais temas investigar |
| `source/auxiliar.md` | idem, para as oposições declaradas |

Os dois arquivos `.md` **não sustentam nenhuma postura**. Onde o plano original não
disse o que o resumo afirmava, a postura foi removida — ver §2.

### Inconsistências descartadas

Os códigos entre colchetes de `source/auxiliar.md` são internamente contraditórios
(`C03` designa Romeu Zema **e** Augusto Cury; Lula aparece como `C12`). Foram
descartados. Os IDs `C01`–`C12` seguem a ordem de `source/propostas.md`.

### Reprodutibilidade

```bash
python3 -m venv .venv && .venv/bin/pip install pypdf
.venv/bin/python tools/extracao/indexar-pdfs.py   # PDFs → data/_paginas.json
npm run citacoes                                  # → data/_posturas.*.json
npm run corpus                                    # → data/corpus.json
```

`tools/extracao/eixos-*.json` declara, para cada par (eixo, candidatura), o padrão
que localiza o trecho. O extrator escolhe a melhor frase e grava página + texto.
As saídas são versionadas, então o build em Node continua com **zero dependências**;
o `pypdf` só é necessário para regerar a indexação.

## 2. O que mudou ao confrontar os resumos com os planos originais

Três posturas que o resumo afirmava **não se sustentaram** e foram removidas ou
reclassificadas:

- **Renan Missão em "privatizações".** O resumo o colocava a favor. O plano dele
  critica explicitamente a fórmula de *"bastava privatizar tudo, retirar o Estado de
  todas as áreas"* (p. 5) como simplismo da nova direita. Ele **usa** PPPs como
  instrumento de governança (p. 36), mas não defende privatização como programa. O
  eixo foi **partido em dois** — `e_privatizacao_estatais` e `e_ppp_servicos_publicos`
  — e ele só aparece no segundo.
- **"Encarceramento de exceção".** A postura mais frágil do corpus anterior era uma
  inferência sobre Flávio Bolsonaro a partir de um rótulo curatorial. Nos planos
  originais o eixo tem lados literais e mais nítidos: **Renan Missão** propõe
  *"superpresídios de segurança máxima em regiões remotas, no modelo do CECOT
  salvadorenho"* (p. 13), e **Wilson Grassi** separa explicitamente a engenharia
  prisional, que quer importar, da suspensão de garantias, que recusa: *"Não pode ir
  a suspensão de garantias individuais"* (p. 24), citando CIDH e Anistia
  Internacional. A inferência sobre Flávio foi descartada.
- **"Ensino integral"** era atribuído a quatro candidaturas; nos planos, seis
  declaram apoio. Passou a não discriminante.

## 3. Quando registrar `"contra"`

> Uma postura `"contra"` só é registrada quando **o plano declara rejeição àquela
> política por escrito**. Quando o sentido não é literal no trecho, a inferência vai
> no campo `interpretacao`, e a interface a exibe ao lado da citação, em destaque,
> para que o usuário possa recusá-la.

**Silêncio nunca vira oposição.** Não citar reconhecimento facial não faz ninguém
contrário a ele. Isso violaria o §18 e é o viés invisível que o §26 manda evitar.

### As 16 interpretações declaradas

São 16 de 200 posturas (8%). O validador as conta a cada build e o teste falha se a
proporção passar de 10%. As mais frágeis, em ordem:

1. **`e_tributar_altas_rendas` — quatro candidaturas de direita marcadas `contra`.**
   Nenhuma menciona imposto sobre grandes fortunas. A postura vem do compromisso
   declarado de reduzir ou não aumentar a carga tributária total, que é incompatível
   com criar um novo tributo sobre patrimônio. **É a inferência mais carregada do
   corpus** — quem discorda dela deve descartar o eixo, que hoje tem o segundo maior
   ganho de discriminação.
2. **`e_mineracao_terras_indigenas` — três candidaturas `contra`.** Inferido da
   exigência de retirada de garimpeiros e de proteção integral dos territórios.
3. **`e_licenciamento_simplificado/C07`.** O plano de Grassi está **dos dois lados**:
   defende licenciamento com prazo definido (p. 47) e licenciamento pleno com
   garantia financeira prévia para mineração (p. 48). O corpus registrou o lado mais
   restritivo, e isso está declarado.
4. **`e_reducao_jornada/C01`.** O plano não rejeita reduzir jornada; rejeita que se
   reduza por lei em vez de por negociação. A postura `contra` refere-se à redução
   **legal**.

### Oposições que **não** foram registradas

| Par tentador | Por que ficou de fora |
|---|---|
| Simplificação fiscal × tributação progressiva | Ortogonais. Simplificar obrigação não diz nada sobre progressividade. |
| Reconhecimento facial × desmilitarização | Nenhum plano da esquerda rejeita vigilância eletrônica por escrito. Vigilância ficou unilateral, com 7 mudos. |
| Aborto — direita `contra` | Só o plano de Flávio Bolsonaro cita *"a vida desde a concepção"* entre seus valores. Os demais silenciam, e silêncio não é oposição. O eixo tem 1×1. |

## 3-A. As explicações em linguagem leiga

Cada um dos 48 temas tem um texto curto (295 caracteres em média) que explica o que a
proposta quer dizer na prática. É o que aparece no verso do cartão, no motor e no
relatório.

**É o texto mais fácil de enviesar do projeto inteiro** — mais que a escolha das
citações, porque aqui não existe trecho de plano para servir de âncora: é prosa
autoral do começo ao fim, e nenhuma trava técnica pode verificá-la.

A disciplina adotada:

- descrever o **mecanismo concreto** — o que muda na vida de quem lê, não a
  categoria abstrata;
- onde o desacordo é real, dar **uma frase a cada lado**, na mesma extensão, na forma
  "quem defende diz… quem é contra diz…";
- onde o tema tem **pouca controvérsia**, dizer isso, em vez de fabricar uma polêmica
  para parecer equilibrado — é o caso de simplificação tributária, prontuário
  eletrônico e isolamento de lideranças;
- separar o que está em disputa do que não está. O exemplo mais importante é o de
  suspensão de garantias: a explicação diz explicitamente que **não** se trata de
  construir presídio de segurança máxima, "o que quase todos defendem", mas de
  afrouxar as regras do processo. Sem essa frase, o leitor responderia a outra
  pergunta.

O validador exige que exista explicação em todo tema e recusa texto acima de 520
caracteres, que não caberia no verso do cartão. Nenhuma das duas travas diz nada
sobre o conteúdo ser justo.

**Este é o item que mais precisa de revisão de terceiros**, e ele não a teve.

## 4. Pesos

Escala escolhida pelo curador, **ausente dos planos**:

| peso | significado |
|---|---|
| 3 | eixo estruturante — reorganiza um setor inteiro ou a matriz do Estado |
| 2 | política setorial relevante, de efeito amplo mas delimitado |
| 1 | mecanismo institucional específico |

`node src/perfis.mjs mutacao`, medido: dobrar o peso muda algum desfecho em **22 dos
48 eixos**. Os 26 restantes são decorativos para o ranking. **O ranking inteiro
depende de 22 números escolhidos à mão.**

Os 22 críticos são um subconjunto dos 23 divisivos: `e_maioridade_penal` — o eixo que
só virou divisivo na varredura de oposições — é divisivo mas decorativo, porque
nenhum dos sete perfis de teste chega a percebê-lo. Isso mede a cobertura dos perfis,
não a irrelevância do eixo.

## 5. Redação das perguntas

`eixos[].formulacaoNeutra` é autoavaliação, não garantia. Três eixos estão marcados
`false`, com `notaRedacao` obrigatória (o validador exige) e sinalização na interface
e no relatório sempre que respondidos:

- **`e_encarceramento_excecao`** — "suspensão de garantias" e "regime de exceção" são
  os termos das próprias candidaturas dos dois lados, e ambos carregam juízo.
- **`e_aborto`** — a formulação move a resposta mais do que em qualquer outro eixo. A
  redação adotada usa os termos do lado favorável.
- **`e_liberdade_irrestrita_redes`** — "censura" e "moderação" descrevem o mesmo ato
  com sinais opostos, e cada lado usa uma das duas palavras.

### Por que as perguntas deixaram de começar com "Você concorda que..."

As 48 perguntas nasceram assim e foram reescritas como proposição direta ("A
maioridade penal deve ser reduzida?") depois de um leitor apontar o óbvio: os botões
já dizem *Discordo* e *Concordo*, então o prefixo repete o que a interface faz.

O custo era maior que a repetição. Em toda pergunta cuja proposição já é negativa —
*fim* da reeleição, *sem* contrapartida, plataformas *proibidas* de moderar — discordar
exigia montar uma dupla negação de cabeça. "Você concorda com o fim do financiamento
público?" respondido com "Discordo" tem duas negações encadeadas para o leitor
desembaraçar; "O financiamento público de partidos e campanhas deve acabar?" tem uma.

Nenhuma direção foi invertida na reescrita: concordar continua significando alinhar-se
com quem o corpus marca como `favor`. Um teste no validador recusa qualquer pergunta
de eixo que volte a começar por "Você" ou que não termine em "?". Os dois portões
seguem em segunda pessoa por serem legítimos: perguntam sobre quem responde ("Você
está apto a votar?"), não sobre uma política.

## 5-A. O silêncio que é meu, não do plano

A cobertura exibida ao lado da afinidade mistura duas coisas que o usuário não
distingue: o plano não se posiciona, ou **a extração não achou**. A segunda existia,
foi medida e foi corrigida numa segunda passada.

### O que a segunda passada mudou

A primeira extração foi guiada por **busca de frase**. Programas escritos como lista
de reivindicações casam com padrão de busca quase sempre; planos discursivos enterram
a posição em prosa, com vocabulário próprio, e escapam. O viés não é ideológico: é de
**gênero de texto**.

Onze posturas foram acrescentadas em duas rodadas. Teto de cobertura nos 22 eixos
divisivos:

| candidatura | antes | depois |
|---|---|---|
| **Luiz Inácio Lula da Silva** | 7/22 · 31% | **12/22 · 55%** |
| Hertz Dias (PSTU) | 14/22 · 68% | 16/22 · 77% |
| Edmilson Costa (PCB) | 17/22 · 77% | 18/22 · 82% |
| Rui Costa Pimenta (PCO) | 13/22 · 60% | 14/22 · 65% |
| Flávio Bolsonaro | 8/22 · 39% | 9/22 · 44% |
| Renan Santos | 8/22 · 39% | 9/22 · 44% |
| demais | — | sem mudança |

O caso mais claro estava na página 10 do plano de Lula — *"Trabalhamos em conjunto com
o Congresso Nacional para a aprovação do arcabouço fiscal"* — e na 16: *"avançar ainda
mais na regulação democrática das redes sociais"*. Duas posições declaradas por escrito
que o corpus não registrava.

### O que NÃO foi acrescentado, e por quê

Registrar as recusas importa tanto quanto registrar as inclusões:

- **Wilson Grassi, tributar altas rendas.** O plano eleva a isenção do IRPF a cinco
  salários mínimos *e* ajusta as alíquotas superiores — mas para reduzir a carga
  total. Ele é favorável a tributar mais o topo e contrário a elevar a carga, e a
  pergunta deste eixo funde as duas coisas. Classificá-lo em qualquer lado seria
  mentir. **É um defeito da redação do eixo, não do plano.**
- **Flávio Bolsonaro e Renan Santos, BRICS.** Ambos propõem uma diplomacia menos
  ideológica e mais próxima do Ocidente, mas nenhum propõe sair do bloco — ficam
  entre os dois polos do eixo.
- **Flávio Bolsonaro, liberdade nas redes.** A seção "Tesouraço na Censura" trata de
  o *governo* criminalizar a crítica, não de plataformas removerem conteúdo. É outro
  mecanismo.
- **Três posturas foram acrescentadas e depois retiradas** por serem inferência
  fraca demais: concessões de Lula (o trecho registra o que foi feito, não um
  compromisso), devido processo de Caiado (princípio geral de introdução, não
  política penal) e responsabilidade fiscal de Cury (ensaio sobre valores, não
  compromisso de regra). A retirada foi disparada pela própria trava: com elas, a
  proporção de interpretações passava de 10% das posturas, e o teste falhava. Baixar
  a trava seria mais fácil do que rever as posturas — e teria sido a decisão errada.

### Um segundo ponto cego: só busquei o lado positivo

Os 26 eixos que não separavam ninguém tinham **todos** a mesma postura: `favor`.
Nenhum tinha um `contra` declarado. Isso não é coincidência do campo eleitoral — é
sintoma do método. A extração buscou sempre o enunciado da proposta ("ampliar as
escolas cívico-militares"), nunca a oposição a ela ("contra a redução da maioridade
penal"). Um plano que rejeita algo por escrito ficava invisível.

A busca pelo lado contrário virou **redução da maioridade penal** de unilateral em
divisivo, com três oposições literais: *"Não à redução da maioridade penal"* (UP),
*"Contra a redução da maioridade penal"* (PCB e PSTU). O corpus passou de 22 para
**23 eixos divisivos**.

Nos demais, a oposição não existe no texto. Ninguém escreve contra tarifa zero, contra
simplificação tributária ou contra prontuário eletrônico — são consensos reais, e é
por isso que ficam fora do ranking. Duas oposições foram encontradas mas **não
incluídas** por serem inferência, e o teto de 10% já estar em 9,8%: o controle de
armas de Lula, incompatível com ampliar o porte rural, e a troca de cotas por bolsas
de mérito de Renan Santos. Ficam registradas aqui como dívida.

### O que continua faltando

Cobertura baixa nem sempre é falha de extração. **Augusto Cury (21%), Wilson Grassi
(15%) e Clariana Barão (10%) foram varridos e realmente não se posicionam** na maior
parte dos eixos divisivos. Grassi chega a declarar a omissão: *"Este plano não traz
doutrina de política externa, e a omissão é deliberada"* (p. 51).

Restam **88 lacunas** na varredura automática. Todos os 22 eixos divisivos foram
percorridos ao menos uma vez com padrão de precisão média sobre cada candidatura
calada; o que sobrou é, em larga maioria, falso positivo do padrão largo — ele casa
com "suspeito" quando se busca "suspensão", com "operadora de turismo" quando se
busca "operadora de plano de saúde". Ainda assim, ninguém leu as 88 uma a uma.
Enquanto for assim, **a cobertura é um piso, não uma medida.**

Silêncios confirmados como reais nesta rodada, e não como falha de extração:
autonomia do Banco Central (nenhuma das seis candidaturas caladas se posiciona),
estabilidade no emprego (nenhuma das cinco), planos de saúde (nenhuma das cinco) e
BRICS — onde nenhuma das três candidaturas anticapitalistas sequer menciona o bloco,
apesar de todas serem anti-imperialistas. Anti-imperialismo não é posição sobre o
BRICS, e tratá-lo como tal seria fabricar postura.

### A ferramenta

```bash
npm run lacunas
```

Cruza cada candidatura calada com um padrão de ASSUNTO — deliberadamente largo, em
`tools/extracao/topicos-divisivos.json` — e aponta a página a ler. Um acerto ali não
é uma postura: é um lugar para um humano ir verificar. O padrão precisa ser diferente
do que localiza a postura; reusar aquele repetiria exatamente o mesmo ponto cego que
criou o problema. A primeira tentativa cometeu esse erro e achou 6 lacunas em vez de 99.

### Os 25 eixos unilaterais não são lixo — são o outro produto

Fora do ranking não quer dizer fora do aplicativo. Os 25 eixos em que só um lado tem
plano escrito ficam fora do cálculo por §20, mas a partir de agora podem ser
respondidos depois da decisão, numa fase complementar marcada como *não conta no
ranking*.

A razão é que eles respondem uma pergunta diferente da que o ranking responde. O
ranking diz de quem você está mais perto. A fase complementar diz onde você discorda
de alguém — inclusive de quem você já pretendia votar. Medido: as posições avaliáveis
vão de 130 para 214 (+65%), e quem mais ganha é quem hoje quase não dá para avaliar
(Grassi 3→11, Cury 5→13, Flávio 10→19).

O risco editorial é o oposto do de sempre: aqui o aplicativo mostra concordância e
discordância que ele próprio declara não valerem para a comparação. Se o rótulo *não
conta no ranking* sumir da tela, a promessa de §20 quebra no lugar onde o usuário
olha, mesmo que o cálculo continue certo.

### A normalização que estragava a citação literal

O pior defeito encontrado até agora não veio da extração do PDF: veio de `limpar()`,
em `tools/gerar-corpus.mjs`. A função tinha duas regex para remontar ligaduras que a
extração parte ("T oda" → "Toda"), e as duas eram largas demais para o português:

- `/\b([A-ZÀ-Ý])\s([a-zà-ÿ]{2,})/` colava qualquer maiúscula solta. Mas **O, A, E, É
  e À são palavras**: "O governo" virou `Ogoverno`, "A carga" virou `Acarga`, "E
  vamos" virou `Evamos`. 38 ocorrências.
- `/\b([A-ZÀ-Ý]{2,})\s([A-ZÀ-Ý]{1,2})\b/` colava caixa-alta com palavra curta:
  "CORTAR OS" virou `CORTAROS`, "SUFOCAM O" virou `SUFOCAMO`, "BRASIL ÀS" virou
  `BRASILÀS`, "DEMOCRACIAS E" virou `DEMOCRACIASE`. 45 ocorrências, das quais **uma**
  era reparo legítimo — e mesmo essa a regra fazia errado ("SEGURANÇA PÚ BLICA"
  virava `SEGURANÇAPÚ BLICA`).

**52 das 214 citações estavam alteradas.** Num aplicativo cuja promessa é reproduzir
o texto do plano para o leitor conferir, isso é o defeito mais grave possível: não
enviesa a comparação, enviesa a prova.

O conserto tem duas partes. A capitular solta agora só é remontada quando a letra
**nunca é palavra sozinha** (`[B-DF-HJ-NP-TV-Z]`). As palavras que a extração partiu
de fato viraram lista explícita e conferida uma a uma — 11 casos, de `AL TERNATIVA` a
`segur ança` — porque só um humano sabe se "CL T" é "CLT" ou duas siglas.

Quatro dessas 11 eu só encontrei porque estavam na tela na hora em que olhei. Isso
não é método, é sorte, e o corpus tem 214 citações. A varredura que as achou virou
checagem do validador: uma palavra está partida quando **as duas metades quase não
existem soltas** nas ~1.000 páginas dos planos (≤4 ocorrências cada) e a junção é
comum (≥15, e mais que o triplo de qualquer metade). O sinal é forte o bastante para
ser erro, não aviso — `públ`+`ica` aparecem 1× cada, `pública` 342×. Caso novo
derruba o build até alguém conferir no plano e acrescentar a linha em `PARTIDAS`.

A trava contra a reincidência é uma propriedade estática: a regex é testada contra
"O governo", "A carga", "E vamos", "CORTAR OS", "SUFOCAM O", "BRASIL ÀS" e a geração
falha se ela casar. A primeira trava que escrevi contava substituições usando a
própria regex — alargar a regra alargava a contagem junto, e ela não disparava. Uma
trava que se mede com o mesmo instrumento que deveria vigiar não vigia nada.

Restam dois artefatos conhecidos, de outra natureza: títulos correntes do PDF que
entram no meio da frase ("...criar seus filhos em SEGURANÇA PÚBLICA E DESMILITARIZAÇÃO
DAS POLÍCIAS paz..."). O texto está fiel; o que falta é separar o título do corpo.

### O inegociável não se explica sozinho

Um leitor relatou não entender o que o escudo faz. A palavra "inegociável" é clara em
português; o que não é claro é o que ela aciona aqui — e o rótulo do botão não tinha
como dizer, porque a consequência depende do lado que a pessoa ainda não escolheu.

Três mudanças, nenhuma no motor:

1. **O número no lugar da palavra.** Cada opção do overlay mostra quantas candidaturas
   sairiam: *"Elimina 7 candidaturas que estão a favor"*. É a diferença entre uma
   definição e uma consequência. Na fase complementar um dos lados não derruba
   ninguém, e a frase diz isso em vez de mostrar um zero.
2. **Uma legenda enquanto ninguém usou.** Some assim que a pessoa marca o primeiro
   inegociável — quem nunca usou é exatamente quem precisa dela.
3. **O título passou a nomear o mecanismo**, não a pedir um lado: "Inegociável elimina
   — não desconta". A pergunta "de que lado?" virou a última frase, depois da
   explicação, e não a primeira.

Testar isso revelou uma contradição minha na fase complementar: o convite diz que
aqueles temas "não mudam o resultado acima", mas o escudo elimina em qualquer fase.
Eliminação e pontuação são mecanismos separados — um veto continua sendo um veto num
tema que não discrimina — então o texto é que estava errado, e passou a abrir a
exceção. A alternativa seria esconder o escudo ali, mas isso tiraria da pessoa um veto
legítimo para poupar uma frase de explicação.

## 6. Desequilíbrio de curadoria

O validador avisa quando a contagem de citações se afasta 1,5 desvio da média (16,7).
Estado atual:

- **Clariana Barão: 7 citações.** O plano tem 15 páginas e é um arcabouço genérico —
  cada seção repete *"Transformar o eixo em uma agenda executável"* e lista tópicos,
  não posições. Ela aparece com afinidade alta e **cobertura 0,10**, e é o caso que a
  métrica de cobertura existe para tornar impossível de ler errado.
- **Edmilson Costa: 26 citações.** Programa curto e extremamente denso em posições
  declaradas.

Nos dois casos a diferença é do documento, não da curadoria — mas o instrumento não
tem como provar isso, e por isso o aviso permanece.

## 7. O que este corpus não verifica

```bash
node src/perfis.mjs cobertura
node src/perfis.mjs mutacao
```

Estado atual, medido:

- **87 de 200 posturas sobrevivem à mutação** (56% cobertas, contra 26% na versão
  0.1.0). As sobreviventes são quase todas de eixos não discriminantes, que os
  perfis não exercitam.
- **3 de 6 contrastes** não são sinalizados por nenhum perfil.
- **2 candidaturas** — Caiado e Grassi — nenhum perfil coloca na liderança.
- **26 de 48 eixos** nenhum perfil responde.

Cada linha acima é tarefa de curadoria, não defeito do motor.

## 8. A regra que a automação não pode quebrar

A extração de citações é automatizada; a **decisão de qual postura existe** não é.
Cada par (eixo, candidatura) foi lido antes de entrar no `eixos-*.json`.

Perfis de referência são escritos por **humano**, e os sete daqui **não são
independentes do corpus**. Medem se a curadoria é internamente consistente; **não
medem se ela é justa.** O executor emite esse aviso a cada execução, por perfil, e não
há como desligá-lo.

Um perfil gerado a partir do corpus deriva as respostas dos mesmos critérios que
deveria testar: a asserção vira "o motor concorda com o corpus", verdadeira por
construção. Isso é pior que ausência de teste, porque **parece cobertura**.

Uso legítimo de automação: apontar *onde* falta perfil, e localizar o trecho de um
plano depois que um humano decidiu que a postura existe. Nunca escrever o par
descrição + respostas.
