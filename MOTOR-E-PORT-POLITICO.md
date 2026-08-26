# Motor de restrições — especificação completa e port para propostas de governo

> ## ⚙︎ De onde vem este motor
>
> O motor descrito na Parte I **não foi escrito para política**. Ele existe em
> [`leoscastilho/classificador-iterativo-transtornos-mentais`](https://github.com/leoscastilho/classificador-iterativo-transtornos-mentais),
> um projeto do mesmo autor, para uma finalidade completamente diferente: percorrer
> os critérios diagnósticos da CID-11 Capítulo 06 eliminando transtornos a cada
> resposta, sem nunca eleger um vencedor único e sempre nomeando o que ficou por
> verificar.
>
> Este documento é o **port** daquele motor para um segundo domínio. A Parte I
> especifica o original linha a linha; a Parte II especifica o que muda para
> comparar planos de governo. O resultado desse port está implementado em
> [`leoscastilho/Palanq`](https://github.com/leoscastilho/Palanq).
>
> Vale dizer por que o port faz sentido, porque não é óbvio: o valor do motor nunca
> esteve no domínio clínico. Está na **seleção gulosa da próxima pergunta**, que faz
> a entrevista encurtar sozinha, e na **camada de fronteiras**, que existe para
> impedir o instrumento de fechar antes da hora. As duas coisas valem igual para
> transtorno e para candidatura — e os compromissos que sustentam a primeira versão
> (ignorância não é negação, lacuna é resultado de primeira classe, toda eliminação
> tem motivo rastreável) são exatamente os que um comparador eleitoral precisa ter
> para não mentir.

---

> **Para quem pega este documento sem contexto.**
> A Parte I especifica, linha a linha, o motor que hoje roda em `src/engine.js` do
> repositório `classificador-iterativo-transtornos-mentais`. A Parte II especifica como
> reaproveitá-lo para um instrumento diferente: percorrer citações de planos de governo e
> apontar qual candidato mais se alinha às posições declaradas pelo usuário.
>
> Leia a Parte I inteira antes de tocar na Parte II. O valor do motor não está no domínio
> clínico — está na **seleção gulosa da próxima pergunta** e na **camada de fronteiras**, e
> as duas só fazem sentido depois de entender por que foram escritas assim.
>
> Todos os números citados neste documento foram medidos executando o código, não estimados.
> Data da medição: 26/08/2026, commit `cdb72b2`.

---

## Sumário

**Parte I — O motor atual**
1. [Ideia central](#1-ideia-central)
2. [Modelo de dados](#2-modelo-de-dados)
3. [Os quatro estados](#3-os-quatro-estados)
4. [`avaliar()` — avaliação de estado](#4-avaliar--avaliação-de-estado)
5. [`diferenciais()` — camada de fronteiras](#5-diferenciais--camada-de-fronteiras)
6. [`proximaPergunta()` — seleção gulosa](#6-proximapergunta--seleção-gulosa)
7. [Rastro, motivos e relatório](#7-rastro-motivos-e-relatório)
8. [`validarBase()` — as 14 travas](#8-validarbase--as-14-travas)
9. [Camada de verificação](#9-camada-de-verificação)
10. [Build e distribuição](#10-build-e-distribuição)
11. [Invariantes — o contrato do motor](#11-invariantes--o-contrato-do-motor)
12. [Bugs e limitações conhecidas](#12-bugs-e-limitações-conhecidas)

**Parte II — Port para propostas de governo**
13. [Mapeamento de conceitos](#13-mapeamento-de-conceitos)
14. [Por que híbrido](#14-por-que-híbrido)
15. [Modelo de dados novo](#15-modelo-de-dados-novo)
16. [A inversão: o "paciente" é o usuário](#16-a-inversão-o-paciente-é-o-usuário)
17. [`avaliar()` novo — score, afinidade, cobertura](#17-avaliar-novo--score-afinidade-cobertura)
18. [Silêncio: a métrica que impede o falso vencedor](#18-silêncio-a-métrica-que-impede-o-falso-vencedor)
19. [`proximaPergunta()` novo — ganho de discriminação](#19-proximapergunta-novo--ganho-de-discriminação)
20. [Consenso: o tratamento das citações compartilhadas](#20-consenso-o-tratamento-das-citações-compartilhadas)
21. [Contrastes, linhas vermelhas e portões](#21-contrastes-linhas-vermelhas-e-portões)
22. [Ranking, margem e empate](#22-ranking-margem-e-empate)
23. [Exemplo trabalhado, com saída real](#23-exemplo-trabalhado-com-saída-real)
24. [`validarCorpus()`](#24-validarcorpus)
25. [Verificação no novo domínio](#25-verificação-no-novo-domínio)
26. [Ética do instrumento](#26-ética-do-instrumento)
27. [Plano de migração](#27-plano-de-migração)
28. [Checklist de aceitação](#28-checklist-de-aceitação)
29. [Apêndice A — protótipo validado](#apêndice-a--protótipo-validado)
30. [Apêndice B — glossário](#apêndice-b--glossário)

---

# PARTE I — O MOTOR ATUAL

## 1. Ideia central

O motor não classifica. Ele **elimina**.

Parte de um conjunto de entidades candidatas — no domínio clínico, 13 transtornos da CID-11
Capítulo 06 — todas simultaneamente em aberto. Cada resposta do usuário é uma restrição que
poda o espaço. Uma entidade sai do jogo quando um requisito seu é violado; nunca "ganha
pontos". No fim, sobram as entidades cujos requisitos foram integralmente satisfeitos —
podendo ser zero, uma ou várias.

Três decisões de projeto seguram tudo:

**Não existe vencedor único.** Comorbidade é o caso comum, não a exceção. O motor devolve
todos os satisfeitos. A tentação de eleger um vencedor é o erro que o teste
`comorbidade: depressivo e ansioso coexistem` existe para impedir.

**A pergunta seguinte é escolhida pelo poder de poda.** A cada passo, o motor escolhe o
requisito que aparece em mais entidades ainda vivas. Isso reduz a árvore rápido: com todas as
respostas negativas, o motor encerra em **6 perguntas** de 36 possíveis. Com todas positivas,
em 25.

**Ignorância é um estado de primeira classe.** `"ns"` (não sei) não é `false`. Mantém a
entidade viva e nomeia a pendência no relatório. Um instrumento que trata ausência de
informação como negação produz certeza falsa — que é exatamente o dano que ele deveria evitar.

O núcleo é **puro e síncrono**: sem estado interno, sem I/O, sem dependências, sem conhecimento
de React ou DOM. `avaliar(base, respostas)` sempre devolve a mesma coisa para as mesmas
entradas. Toda a interface é derivada; nada é acumulado incrementalmente. Isso é o que torna o
port viável.

Uma ressalva de precisão: `montarRelatorio()` é exportado do mesmo `engine.js` e chama
`new Date().toLocaleString("pt-BR")` para carimbar o cabeçalho. A pureza vale para `avaliar()`,
`diferenciais()`, `proximaPergunta()`, `transicoes()` e `validarBase()` — o gerador de relatório
é a única função com efeito de ambiente, e é onde o carimbo de tempo pertence.

---

## 2. Modelo de dados

Arquivo único: `data/criteria.cap06.json`. Estado atual medido: **32 features, 4 portões,
13 entidades, 7 fronteiras, 47 predicados**.

### 2.1 Cabeçalho

```json
{
  "schemaVersion": "1.0.0",
  "criteriaVersion": "0.1.0-PLACEHOLDER",
  "chapter": "06",
  "language": "pt-BR",
  "status": "draft",
  "warning": "LÓGICA FICTÍCIA. ...",
  "sources": { "mms": {...}, "cddr": {...} }
}
```

| Campo | Papel |
|---|---|
| `schemaVersion` | versão do formato. Muda quando o motor muda. |
| `criteriaVersion` | versão do **conteúdo**. Aparece no cabeçalho de todo relatório exportado — um registro precisa dizer sob qual base foi produzido. |
| `status` | `draft` \| `verified`. `validate.mjs` falha o build se `verified` convive com entidades em rascunho. |
| `warning` | impresso no relatório sempre que `status !== "verified"`. |
| `sources` | proveniência por fonte, incluindo a nota de licença que proíbe transcrição de prosa. |

### 2.2 `features` — o vocabulário

Dicionário global de perguntas booleanas. **É o artefato mais importante da base.**

```json
"f_humor": {
  "label": "Humor deprimido",
  "question": "Humor deprimido presente na maior parte do dia, quase todos os dias?",
  "domain": "humor",
  "type": "bool"
}
```

Regra não-negociável, documentada em `docs/AUTORIA.md`: **uma feature compartilhada por duas
entidades precisa significar exatamente a mesma coisa nas duas.** Se `f_hiper` quer dizer uma
coisa em 6B40 e outra em 6B00, o motor produz descartes errados sem falhar em nenhum teste.
Features quase-duplicadas destroem o poder de poda: `f_maniaco` cobre 6 entidades de uma vez;
duas variantes cobririam 3 cada.

`domain` hoje é só metadado — nada no motor o lê. É um gancho para agrupamento futuro.

### 2.3 `gates` — portões universais

```json
"g_prejuizo": {
  "question": "Há sofrimento significativo ou prejuízo em áreas importantes...?",
  "note": "Fronteira com a normalidade. Sem isso, nenhuma entidade se sustenta.",
  "onYes": null, "onNo": "invalida-todos"
}
```

Quatro declarados. **Só `g_prejuizo` tem efeito no motor** — os outros três
(`g_substancia`, `g_medica`, `g_cultural`) são perguntados, aparecem no relatório, e não
alteram estado nenhum. Os campos `onYes: "redirecionar:6C4x.7"` e `"revisar"` são declarativos
e **não estão implementados**. Ver §12.

### 2.4 `disorders` — as entidades

```json
{
  "code": "6A70",
  "name": "Transtorno depressivo, episódio único",
  "grouping": "6A7",
  "provenance": { "source": "...", "cddrSection": null, "status": "draft",
                  "operationalizedBy": null, "reviewedBy": null, "reviewedOn": null, "notes": "..." },
  "essential":  [ { "feature": "f_humor", "op": "sim", "ref": null, "operationalization": null } ],
  "exclusions": [ { "feature": "f_maniaco", "op": "sim", "ref": null, "note": "Presença de mania desloca para 6A60." } ],
  "blockedBy": [], "blocks": []
}
```

| Campo | Semântica |
|---|---|
| `essential[]` | conjunção. **Todos** precisam ser atendidos. Um violado → `descartado`. |
| `exclusions[]` | disjunção negativa. **Qualquer um** verdadeiro → `descartado`. |
| `op` | `"sim"` (feature precisa estar presente) \| `"nao"` (precisa estar ausente). |
| `blockedBy[]` | esta entidade cede precedência às listadas, se elas estiverem satisfeitas. |
| `blocks[]` | **declarado e nunca lido pelo motor.** Redundante com `blockedBy` do outro lado. Ver §12. |
| `operationalization` | onde se registra a decisão autoral quando a fonte é vaga ("vários sintomas" → booleano). Cada campo preenchido é uma responsabilidade que precisa aparecer na documentação distribuída. |
| `ref` | seção da fonte. **Nunca a prosa** — mas isto é convenção, não trava: `validarBase()` só inspeciona `provenance` no nível da entidade, e só as chaves `sourceText`/`verbatim`/`textoOriginal`. Prosa transcrita dentro de `ref` ou de um predicado passa sem erro. Ver §12. |

Estado real da base:

```
6A70 ess[f_humor=sim, f_anedonia=sim, f_dur2sem=sim, f_acessorios=sim, f_epprevio=nao]  exc[f_maniaco, f_hipomaniaco]
6A71 ess[f_humor, f_anedonia, f_dur2sem, f_acessorios, f_epprevio=sim]                   exc[f_maniaco, f_hipomaniaco]
6A72 ess[f_humor, f_dur2anos]                                                            exc[f_maniaco]
6A73 ess[f_humor, f_preoc]                    exc[f_maniaco]   blockedBy[6A70,6A71,6B00]
6A60 ess[f_maniaco]
6A61 ess[f_hipomaniaco, f_humor, f_maniaco=nao]
6B00 ess[f_preoc, f_multidom, f_ansmeses]
6B01 ess[f_panico, f_inesperado]
6B02 ess[f_agora, f_ansmeses]
6B04 ess[f_social, f_ansmeses]
6B40 ess[f_trauma, f_reviv, f_evit, f_hiper]                    blockedBy[6B41]
6B41 ess[+f_prolong, f_desreg, f_autoconc, f_relacional]        blocks[6B40]
6B43 ess[f_estressor, f_preocest]             blockedBy[6A70,6A71,6B00,6B40,6B41]
```

Repare no padrão: `6A73` (misto) e `6B43` (ajustamento) são **categorias residuais** — têm
poucos requisitos, fecham fácil, e existem para o caso em que nada mais fecha. É `blockedBy`
que impede que sejam eleitas quando uma entidade específica se sustenta.

### 2.5 `boundaries` — as fronteiras

```json
{
  "between": ["6A70", "6B43"],
  "discriminator": "f_prop_estressor",
  "leans": { "sim": "6B43", "nao": "6A70" },
  "ref": null,
  "note": "Sintomas proporcionais e limitados ao estressor apontam para ajustamento.",
  "status": "draft"
}
```

Sete pares. Cada um liga **duas** entidades por **uma** feature discriminadora. `leans` diz
para que lado cada resposta inclina.

**Fronteira nunca descarta.** É sinal, não estado. A justificativa está em `docs/AUTORIA.md`:
o CDDR trata fronteiras como orientação de julgamento clínico; transformá-las em regra dura
seria afirmar mais do que a fonte autoriza. O produto disso é a seção **"não investigado"** do
relatório — a defesa contra viés de automação. Sem ela, o instrumento confirma mais do que
questiona.

---

## 3. Os quatro estados

```
aberto      nenhum requisito violado, mas há requisitos não verificados
satisfeito  todos os requisitos verificados e atendidos
descartado  um requisito foi violado, uma exclusão disparou, ou o portão derrubou
precedencia satisfeito, porém cede lugar a outra entidade satisfeita
```

Transições possíveis:

```
                    ┌──────────────► descartado  (requisito violado ou exclusão disparada;
                    │                             terminal dentro de uma passada)
  aberto ───────────┤
                    │
                    └──► satisfeito ──► precedencia
                              │              │
                              └──────────────┴──► descartado  (portão g_prejuizo = "nao")
```

O portão derruba **tanto `satisfeito` quanto `precedencia`** — a condição no código é
`estado === "satisfeito" || estado === "precedencia"`.

`descartado` é terminal dentro de uma passada de `avaliar()`, mas o motor é puro: mudar uma
resposta e reavaliar pode ressuscitar qualquer entidade. Não há acumulação — o estado é sempre
recalculado do zero a partir de `respostas`. Essa propriedade é o que torna trivial implementar
"voltar e alterar uma resposta" (hoje ausente na UI, item 5 do backlog de `AUTORIA.md`).

---

## 4. `avaliar()` — avaliação de estado

Assinatura: `avaliar(base, respostas) → { [code]: { estado, motivo, pendentes, inconclusivos } }`

### 4.1 `testar()` — lógica de quatro valores

```js
function testar(pred, respostas) {
  const v = respostas[pred.feature];
  if (v === undefined) return undefined;   // não perguntado
  if (v === "ns")       return null;       // inconclusivo
  return pred.op === "sim" ? v === "sim" : v === "nao";
}
```

| resposta \ op | `op: "sim"` | `op: "nao"` |
|---|---|---|
| `"sim"` | `true` atendido | `false` violado |
| `"nao"` | `false` violado | `true` atendido |
| `"ns"` | `null` inconclusivo | `null` inconclusivo |
| ausente | `undefined` pendente | `undefined` pendente |

**Quatro valores, não três.** A distinção entre `undefined` (ninguém perguntou) e `null` (foi
perguntado, o usuário não sabe) é o que permite ao relatório dizer *"falta verificar X"* versus
*"X ficou inconclusivo"*. Colapsar os dois destrói a seção "em aberto".

Cuidado com exclusão de `op: "nao"`: ela dispara quando `testar()` devolve `true`, ou seja,
quando a resposta é `"nao"`. Uma exclusão negativa é uma dupla negação — "descarte esta entidade
se a feature estiver ausente". Nenhuma existe na base hoje; se for escrever uma, escreva o teste
junto.

### 4.2 Ordem de avaliação

```
para cada entidade:
  1. percorre essential[]
       undefined → acumula em pendentes
       null      → acumula em inconclusivos
       false     → estado = descartado, motivo = {tipo:"requisito"}, BREAK
  2. se não descartada, percorre exclusions[]
       true      → estado = descartado, motivo = {tipo:"exclusao"}, BREAK
  3. se aberto e pendentes e inconclusivos vazios → satisfeito
─────────────────────────────────────────────────────────────────────
  4. passada de precedência (sobre o conjunto de satisfeitos, calculado ANTES)
  5. portão g_prejuizo = "nao" → tudo que fechou vira descartado
```

O `break` do passo 1 é deliberado: só o **primeiro** requisito violado vira motivo. O relatório
diz *por que* a entidade caiu, não a lista completa de tudo que ela não atende. Efeito colateral:
`pendentes` e `inconclusivos` ficam truncados quando a entidade é descartada. Isso não importa
para uma entidade morta, mas importa se algum consumidor futuro ler esses campos de entidades
descartadas — não leia.

### 4.3 Precedência: uma passada, não transitiva

```js
const satisfeitos = new Set(/* estado === "satisfeito", calculado ANTES do laço */);
for (const d of base.disorders) {
  if (!satisfeitos.has(d.code)) continue;
  const por = (d.blockedBy || []).find((c) => satisfeitos.has(c));
  if (por) out[d.code] = { ...out[d.code], estado: "precedencia", motivo: { tipo: "precedencia", por } };
}
```

O conjunto `satisfeitos` é congelado antes do laço. Consequência real, medida:

```
respostas: TEPT complexo completo + estressor de ajustamento
6B41 → satisfeito
6B40 → precedencia  (por 6B41)
6B43 → precedencia  (por 6B40)   ← 6B40 já não é "satisfeito", mas cedeu depois
```

`6B43` cede a `6B40`, que por sua vez já cedeu a `6B41`. Isso é **intencional e correto** neste
domínio: o ajustamento perde para o TEPT independentemente de qual TEPT venceu. Mas é uma
propriedade frágil — se alguém trocar a passada única por um ponto fixo, `6B43` voltaria a
`satisfeito` e o teste `ajustamento cede a qualquer entidade específica satisfeita` quebraria.
Documentado aqui porque não está documentado no código.

`validarBase()` rejeita ciclos de comprimento 2 (`A blockedBy B` e `B blockedBy A`). **Não
detecta ciclos de comprimento ≥3.** Com a passada única eles não travariam o motor, mas
produziriam resultado dependente da ordem do arquivo.

### 4.4 O portão

```js
if (respostas.g_prejuizo === "nao") {
  // tudo que estava satisfeito ou precedencia vira descartado, motivo {tipo:"portao"}
}
```

Hard-coded pelo nome `g_prejuizo`. O campo `onNo: "invalida-todos"` do JSON **não é lido** — o
motor não interpreta a declaração. Se o port precisar de mais de um portão desse tipo, generalize
lendo `efeito` do JSON (o protótipo da Parte II já faz isso).

---

## 5. `diferenciais()` — camada de fronteiras

Assinatura: `diferenciais(base, respostas, estados) → { naoInvestigados[], investigados[] }`

```js
for (const b of base.boundaries) {
  const [a, z] = b.between;
  if (!vivo(a) || !vivo(z)) continue;             // par morto some sozinho
  const v = respostas[b.discriminator];
  if (v === undefined)  naoInvestigados.push({...b, motivo: "não perguntado"});
  else if (v === "ns")  naoInvestigados.push({...b, motivo: "resposta inconclusiva"});
  else                  investigados.push({...b, resposta: v, inclina: b.leans?.[v] || null});
}
```

Quatro regras, todas testadas:

1. **Relevante só com os dois lados vivos.** `vivo` = `estado !== "descartado"` — inclui
   `satisfeito` e `precedencia`, não só `aberto`. Um par cujo lado caiu desaparece da lista
   sem intervenção.
2. **Nunca altera estado.** Teste `fronteira NUNCA descarta — só sinaliza`: responder um
   discriminador não pode matar nenhuma das duas pontas.
3. **`"ns"` mantém o diferencial aberto**, com motivo distinto de "não perguntado". Um
   diferencial que o clínico tentou investigar e não conseguiu é informação diferente de um que
   ninguém tocou.
4. **Perguntadas depois dos requisitos e antes dos portões.** Só faz sentido discriminar entre
   quem sobrou.

A vinheta V003 existe inteiramente para fixar isso: o ponto dela *não é o código que fecha*, é
o que fica em aberto. Se `6B43` fechar sem sinalizar o diferencial com `6B40`, o instrumento
induziu fechamento prematuro — e a vinheta falha.

---

## 6. `proximaPergunta()` — seleção gulosa

Assinatura: `proximaPergunta(base, respostas, estados) → pergunta | null`

Três fases, estritamente ordenadas.

### Fase 1 — requisitos, por alcance

```js
const vivos = base.disorders.filter((d) => estados[d.code].estado === "aberto");
// conta, para cada feature ainda não respondida, quantas entidades ABERTAS a usam
// (essential + exclusions contam igual)
const melhor = Object.entries(score).sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0]))[0];
```

Só **`aberto`** entra no pool — nem `satisfeito`, nem `precedencia`, nem `descartado`. Uma
entidade que já fechou não gera mais perguntas. Desempate: ordem lexicográfica do id da feature
(determinístico, e é o que torna os testes estáveis).

Medido: a primeira pergunta é sempre `f_maniaco`, com alcance **6** (6A70, 6A71, 6A72, 6A73,
6A60, 6A61). Uma resposta `"sim"` **descarta cinco entidades e satisfaz uma**: 6A70, 6A71, 6A72
e 6A73 caem por exclusão, e 6A61 cai por requisito — seu `essential` inclui `f_maniaco` com
`op: "nao"`. É um bom exemplo de por que os dois mecanismos precisam ser contados juntos.

A pergunta devolvida carrega `alcance: { n, codigos }` — a UI mostra
*"Discrimina 6 candidatos: 6A70, 6A71, ..."*. Isso é o que faz o instrumento parecer
justificado em vez de arbitrário.

### Fase 2 — discriminadores de fronteira

Só quando não sobrou nenhum requisito perguntável. Pega o primeiro par não investigado **na
ordem do arquivo** — limitação conhecida, deveria priorizar o par com mais candidatos vivos
(item 5 da lista de pendências de `AUTORIA.md`).

### Fase 3 — portões

```js
const houveDesfecho = Object.values(estados).some((s) => ["satisfeito","precedencia"].includes(s.estado));
if (houveDesfecho) { /* primeiro portão não respondido, na ordem do objeto */ }
```

Portões só entram **se alguma entidade fechou**. Perguntar sobre prejuízo funcional quando nada
fechou seria ruído. Ver §12 para o bug que isso gera.

### Terminação

Garantida: toda pergunta devolvida tem `respostas[id] === undefined`, e a UI sempre grava a
resposta antes de pedir a próxima. O pool de features não respondidas decresce estritamente.
O teste `motor sempre termina` roda 200 sequências pseudoaleatórias com teto de 60 passos.

Medições em `data/criteria.cap06.json` (36 perguntáveis: 32 features + 4 portões):

| Estratégia de resposta | Perguntas até encerrar |
|---|---|
| tudo `"nao"` | **6** |
| tudo `"sim"` | **25** |

A assimetria é o motor funcionando: negativas podam, positivas abrem ramos.

---

## 7. Rastro, motivos e relatório

**`transicoes(anterior, atual)`** — diff de estados entre duas avaliações. Devolve
`{ code, de, para, motivo }[]`. A UI usa para o pisca-pisca; o relatório usa para o rastro.

**`explicarMotivo(base, motivo)`** — traduz o objeto de motivo em uma linha em português.
Quatro casos: `precedencia`, `exclusao`, `portao` (texto hard-coded para prejuízo funcional),
e o default `requisito`.

**`montarRelatorio(base, respostas, estados, rastro, meta)`** — texto puro, seções fixas:

```
AVALIAÇÃO ESTRUTURADA — CID-11, CAPÍTULO 06
Gerado em / Base de critérios (versão + schema + status) / Identificador / Avaliador
[ATENÇÃO: warning, se status !== verified]
REQUISITOS COMPLETOS
AFASTADOS POR PRECEDÊNCIA          (omitida se vazia)
EM ABERTO                          (com "falta verificar: ..." por entidade)
DESCARTADOS                        (com o motivo)
DIFERENCIAIS NÃO INVESTIGADOS      ← a seção que justifica o instrumento
DIFERENCIAIS INVESTIGADOS          (omitida se vazia)
PORTÕES UNIVERSAIS                 (com [PENDENTE] quando não respondido)
RASTRO DA AVALIAÇÃO                (pergunta, resposta, transições causadas)
Este documento ... Não constitui diagnóstico.
```

Duas decisões que o port deve preservar: **a versão da base aparece no cabeçalho** (um registro
precisa dizer sob qual base foi produzido) e **o rastro registra as transições causadas por cada
resposta**, não só as respostas. O rastro é o que permite auditar a conclusão depois.

---

## 8. `validarBase()` — as 14 travas

Roda em três lugares: `npm run validate` (bloqueia o build), `engine.test.mjs`, e o executor de
vinhetas.

| # | Erro detectado | Por quê |
|---|---|---|
| 1 | feature inexistente em `essential`/`exclusions` | typo silencioso → predicado que nunca é testado |
| 2 | `op` fora de `{sim, nao}` | `testar()` cairia no ramo `"nao"` por default |
| 3 | `blockedBy`/`blocks` apontando para código inexistente | precedência que nunca dispara |
| 4 | entidade sem `essential` | jamais seria descartada — fecha sempre |
| 5 | `provenance.sourceText` / `verbatim` / `textoOriginal` | **trava de licença**: proíbe transcrição de prosa da fonte |
| 6 | fronteira com `between.length !== 2` | modelo é estritamente binário |
| 7 | fronteira com código inexistente | — |
| 8 | fronteira com discriminador inexistente | — |
| 9 | `leans` com chave fora de `{sim, nao, ns}` | — |
| 10 | `leans` apontando para fora do par | inclinar para um terceiro é incoerente |
| 11 | fronteira reflexiva (`A vs A`) | usa `between?.[0] === between?.[1]`, então dispara também com `between` ausente ou vazio (`undefined === undefined`), empilhando um falso positivo sobre a trava 6 |
| 12 | fronteira duplicada (mesmo par) | — |
| 13 | feature órfã (declarada, não usada) | vocabulário sujo. **É erro bloqueante**, não aviso: `validarBase()` não tem canal de aviso e `validate.mjs` sai com código 1. Só `engine.test.mjs` e o executor de vinhetas a rebaixam a aviso, filtrando pela substring `"não é usada"`. |
| 14 | ciclo de precedência de comprimento 2 | ver §4.3 para o que **não** é detectado |

`validate.mjs` acrescenta duas travas de processo: reporta quantas entidades estão em rascunho, e
**falha o build se `status: "verified"` convive com entidades não verificadas**.

---

## 9. Camada de verificação

Três níveis, com propósitos distintos. O port precisa dos três.

### 9.1 Testes unitários — `src/engine.test.mjs`

**18 testes, 0 falhas.** Sem framework: um helper `t(nome, fn)` e um `eq()`. Categorias:

- validação da base (1)
- comportamento do motor (7): estado inicial, poda em massa, `"ns"`, comorbidade, precedência,
  categoria residual, portão
- seleção de perguntas (4): maior alcance, exclusão de nós mortos, condição de disparo dos
  portões (`portões só entram após haver desfecho` — quem afirma a *ordem* entre fronteira e
  portão é o quinto teste de fronteiras), terminação
- fronteiras (5): relevância, não-descarte, transição investigado/não investigado, `"ns"`, ordem
- relatório (1): presença das seções e da versão

**Eles testam se o motor executa a lógica declarada.** Não testam se a lógica declarada é a certa.

### 9.2 Vinhetas — `vignettes/*.json` + `src/vignettes.mjs`

**5 vinhetas, 0 falhas, 12 avisos de autoria.**

Anatomia (ver `vignettes/_SCHEMA.json`):

```json
{
  "id": "V000",
  "titulo": "...",
  "autoria": { "redigidaPor": null, "independenteDaBase": false, "fonte": "caso composto", ... },
  "narrativa": "prosa clínica escrita ANTES do mapeamento — é a fonte de verdade",
  "respostas": { "f_humor": "sim", ... },
  "esperado": {
    "deveFechar": [], "naoPodeFechar": [], "deveDescartar": [],
    "devePrecedencia": [], "deveSinalizar": [["6B40","6B43"]], "semAssercao": []
  },
  "justificativa": "por que esse desfecho, em termos clínicos — não em termos do motor"
}
```

*(Esqueleto genérico, não uma vinheta real. O `deveSinalizar` preenchido acima vem de V003, a
única das cinco que usa o campo.)*

`semAssercao` é a invenção mais útil do formato: **entidades deliberadamente não avaliadas por
esta vinheta**. O auditor emite aviso para toda entidade que a vinheta nem afirma nem declara
omitir — porque silêncio parece cobertura.

As cinco vinhetas foram escolhidas por consequência, não por tipicidade:

| id | o que fixa |
|---|---|
| V001 | caso típico — linha de base |
| V002 | **comorbidade**: impede que o motor volte a eleger vencedor único |
| V003 | **lacuna**: o desfecho correto é sinalizar o não investigado, não fechar |
| V004 | **precedência**: 6B41 ⊃ 6B40, ambos fecham, nada na estrutura força a direção |
| V005 | **falso negativo de maior consequência**: bipolar tratado como unipolar |

### 9.3 Meta-testes: cobertura e mutação

Ambos medem o *conjunto de vinhetas*, não o conteúdo clínico. Por isso podem ser automatizados
sem circularidade.

**`npm run vignettes:cobertura`** — estado real:

```
13 entidades · 7 sem vinheta que as faça fechar
7 fronteiras · 6 sem vinheta: 6A70~6B43, 6A70~6B00, 6B00~6B01, 6B02~6B04, 6A71~6A72, 6A60~6A61
```

**`npm run vignettes:mutacao`** — remove um predicado por vez e verifica se alguma vinheta acusa:

```
14/47 predicados cobertos · 33 sobreviventes
```

Cada sobrevivente é um requisito que pode ser **apagado da base sem que nada falhe** — um
critério que o projeto hoje não verifica de forma alguma. É a lista de tarefas priorizada,
gerada por máquina.

### 9.4 Por que gerar vinhetas automaticamente não funciona

Reproduzido de `docs/AUTORIA.md` porque o port vai enfrentar exatamente a mesma tentação:

- **É circular, e a circularidade é fatal.** Um gerador deriva as respostas dos mesmos critérios
  que a vinheta deveria testar. A asserção vira "o motor concorda com a base" — verdadeiro por
  construção. Pior que ausência de teste, porque parece cobertura.
- **Um LLM escrevendo vinhetas é a mesma circularidade com etapas a mais.** Erros de
  interpretação correlacionam com os de quem transcreveu — mesma fonte, mesmas ambiguidades.
  Independência estatística é o requisito, e ela não sobrevive a duas leituras da mesma fonte.
- **Geradores amostram o típico; o valor está no atípico.** Os casos que quebram uma base são os
  limítrofes e os com informação faltando.

**Uso legítimo de automação:** apontar *onde* falta vinheta (cobertura e mutação já fazem) e
revisar vinheta escrita por humano em busca de inconsistência interna. Nunca produzir o par
narrativa+respostas.

---

## 10. Build e distribuição

```bash
npm install
npm test                      # engine.test.mjs && vignettes.mjs
npm run validate              # validarBase + travas de processo
npm run vignettes:cobertura
npm run vignettes:mutacao
npm run dev
npm run build                 # validate && vite build → dist/index.html autocontido
```

`vite-plugin-singlefile` + `assetsInlineLimit: 100000000` produzem **um `.html` único**, que
funciona offline por duplo clique. Esse é o argumento de privacidade inteiro: sem servidor, sem
telemetria, sem requisição externa, nenhum dado sai da máquina.

CI (`.github/workflows/pages.yml`): `npm ci` → `test` → `validate` → `cobertura` → `mutacao` →
`build` → Pages. Cobertura e mutação rodam mas **não falham o build** (são relatórios). Base
inválida bloqueia o deploy.

Restrição de arquitetura que vale registrar: a ICD-11 API exige OAuth2 `client_credentials` e
não pode ser chamada do navegador. Logo a extração é **obrigatoriamente build-time**
(`tools/fetch-icd11.mjs`) e o produto publicado consome só JSON estático. A mesma restrição que
impede a chamada é a que garante que nenhum dado do usuário trafega.

---

## 11. Invariantes — o contrato do motor

Se o port quebrar qualquer um destes, deixou de ser este motor. Traduza cada um para o domínio
novo antes de escrever código.

1. **Pureza do núcleo.** `avaliar(base, respostas)` é função. Sem estado, sem I/O, sem `Date`,
   sem aleatoriedade, sem dependências. Todo estado derivado de `respostas`, sempre recalculado.
   A única exceção tolerada é o carimbo de tempo dentro do gerador de relatório.
2. **Sem vencedor único imposto.** Múltiplos desfechos simultâneos são resultado válido.
3. **Ignorância ≠ negação.** Quatro valores, não três. `"ns"` mantém vivo e é reportado.
4. **Não perguntado ≠ inconclusivo.** Distinção preservada até o relatório.
5. **Toda eliminação tem motivo estruturado**, não uma string. `{tipo, ...}` legível por máquina.
6. **A camada de orientação nunca elimina.** Fronteiras produzem sinal. É a defesa contra
   fechamento prematuro.
7. **Lacuna é saída de primeira classe.** "Não investigado" ocupa seção própria no relatório.
8. **Determinismo.** Empates resolvidos lexicograficamente. Mesma entrada, mesma pergunta.
9. **Terminação.** Toda pergunta consome uma variável não respondida.
10. **A base é dado, não código.** Trocar o JSON troca o domínio sem tocar no motor.
11. **Proveniência obrigatória.** Toda afirmação da base aponta para fonte e seção.
12. **Versão no relatório.** Todo output cita a versão da base que o produziu.
13. **A validação bloqueia o build.** Base inconsistente não é publicável.
14. **Vinheta é escrita por humano.** Automação aponta lacunas; não preenche.

---

## 12. Bugs e limitações conhecidas

Verificados executando o código. O port herda todos se copiar sem ler.

**B1 — Portão que derruba tudo impede os portões seguintes.** Reprodução (é preciso **esgotar a
fase 1** antes de o portão aparecer — portões são fase 3):

```js
// responde "sim" a tudo até o motor oferecer o primeiro portão,
// e "nao" quando ele oferecer g_prejuizo
let r = {}, s = avaliar(base, r), q;
while ((q = proximaPergunta(base, r, s))) {
  r = { ...r, [q.id]: q.id === "g_prejuizo" ? "nao" : "sim" };
  s = avaliar(base, r);
}
// encerra em 22 perguntas; g_substancia, g_medica e g_cultural nunca foram oferecidos
```

Ao responder `g_prejuizo: "nao"`, tudo que havia fechado vira `descartado`, `houveDesfecho` passa
a ser `false`, e `g_substancia`, `g_medica` e `g_cultural` **nunca são perguntados**. O relatório
sai com três portões `[PENDENTE]` que o motor não tinha como perguntar.

Correção: separar "houve desfecho alguma vez" de "há desfecho agora", ou tratar os portões como
uma fase própria disparada uma única vez.

**B2 — Três dos quatro portões não fazem nada.** `onYes: "redirecionar:6C4x.7"` e `"revisar"` são
strings declarativas que nenhum código lê. Um usuário que responde "sim, é efeito de substância"
vê a resposta registrada no relatório e **nenhuma mudança de estado**. Ou implemente, ou
documente na UI que são apenas registro.

**B3 — `blocks[]` é escrito e nunca lido.** `6B41.blocks = ["6B40"]` só funciona porque
`6B40.blockedBy = ["6B41"]` existe em paralelo. `validarBase()` valida as referências de
`blocks` mas o motor as ignora. Risco: alguém escreve só `blocks` e a precedência silenciosamente
não acontece. Correção: remover o campo, ou derivar `blockedBy` de `blocks` na carga.

**B4 — Precedência não transitiva.** Ver §4.3. Correto hoje, frágil. Escreva o teste antes de
mexer.

**B5 — Ciclos de precedência ≥3 não detectados.** `validarBase()` só olha pares.

**B6 — Fronteiras perguntadas na ordem do arquivo.** Deveriam priorizar o par com mais
candidatos vivos.

**B7 — `pendentes`/`inconclusivos` truncados em entidades descartadas.** Efeito do `break`.
Não leia esses campos de entidades mortas.

**B8 — Portões hard-coded, de dois jeitos diferentes.** Em `avaliar()`, o nome está fixo:
`respostas.g_prejuizo === "nao"`. O campo `onNo: "invalida-todos"` do JSON não é lido.

Em `explicarMotivo()` é pior: não há verificação de nome nenhuma. O `case "portao"` devolve uma
**string fixa**, ignorando `m.feature`:

```js
explicarMotivo(base, { tipo: "portao", feature: "g_substancia" })
// → "portão não atendido · prejuízo funcional ausente"
```

Ou seja, qualquer portão que venha a derrubar entidades será explicado com a mensagem do
prejuízo funcional. Corrija os dois ao portar: leia `efeito` do JSON em `avaliar()`, e monte o
texto a partir de `base.gates[m.feature]` em `explicarMotivo()`.

**B9 — `domain` e `type` das features não são usados** por nada. Ganchos vazios.

**B10 — Sem persistência.** Recarregar a página perde a avaliação. `localStorage` com
export/import é o item 4 do backlog. Para o port, isto vira requisito, não melhoria: uma sessão
de comparação de propostas é longa.

**B11 — Sem modo de revisão.** Não há como voltar e alterar uma resposta. O motor suporta
trivialmente (é puro); falta só UI e a decisão de como registrar a alteração no rastro sem
sobrescrever o original.

**B12 — A trava de licença tem escopo estreito demais.** `validarBase()` só procura
`sourceText`/`verbatim`/`textoOriginal` **em `d.provenance`**. Verificado: prosa transcrita
dentro de `ref`, de `operationalization`, de `note`, ou em um `sourceText` colocado dentro de um
predicado em vez da entidade, passa sem erro nenhum. A trava protege contra descuido, não contra
o caminho mais provável — quem transcreve critério tende a fazê-lo junto do predicado.
Correção: varrer recursivamente a entidade inteira em busca das chaves proibidas, e adicionar um
limite de comprimento para campos livres.

**B13 — Trava de fronteira reflexiva com falso positivo.** `b.between?.[0] === b.between?.[1]`
é verdadeiro quando `between` está ausente ou vazio, porque `undefined === undefined`. Uma
fronteira malformada gera dois erros — o correto (trava 6) e um `fronteira reflexiva em
undefined`. Inofensivo, mas confunde quem lê a saída do validador.

---

# PARTE II — PORT PARA PROPOSTAS DE GOVERNO

> **Objetivo do instrumento.** Percorrer citações de planos de governo — algumas compartilhadas
> entre candidatos, outras exclusivas de um — e indicar quais candidatos mais se alinham às
> posições que o usuário declara. Com o mesmo compromisso do original: nunca fechar antes da
> hora, sempre mostrar o que ficou sem investigar, sempre citar a fonte.

## 13. Mapeamento de conceitos

| Motor clínico | Motor de propostas | Muda? |
|---|---|---|
| `disorders[]` — transtornos | `candidatos[]` — candidaturas | nome |
| `features{}` — sintomas | `eixos{}` — posições de política pública | nome + ganha `peso` |
| resposta do usuário = fato sobre o paciente | resposta do usuário = **posição do próprio usuário** | **inversão semântica, §16** |
| `essential[]` — requisitos da entidade | `posicoes[]` — postura do candidato, com citação | **estrutura nova** |
| `exclusions[]` | `linhasVermelhas` (do lado do usuário) | **muda de lado** |
| `blockedBy[]` — precedência | — | **descartado** |
| `boundaries[]` — fronteiras | `contrastes[]` — pares próximos e o que os separa | igual |
| `gates{}` — portões universais | `portoes{}` — elegibilidade | igual |
| estado ∈ {aberto, satisfeito, descartado, precedencia} | `estado ∈ {vivo, eliminado}` + `afinidade` contínua | **híbrido** |
| alcance = nº de entidades vivas que usam a feature | ganho = `nFavor × nContra × peso` | **fórmula nova, §19** |
| `provenance` — seção da fonte, nunca a prosa | `citacao` — **a prosa é obrigatória**, com fonte e localizador | **inverte** |
| vinhetas clínicas | perfis de referência | igual em espírito |

Reaproveitados **quase literalmente**: `transicoes()`, a arquitetura de três fases de
`proximaPergunta()`, `diferenciais()` inteiro (renomeado), a estrutura de `montarRelatorio()`,
o esqueleto de `validarBase()`, o executor de vinhetas com seus três modos, o build singlefile
e o workflow de CI.

Reescritos: `avaliar()` (acumula em vez de só eliminar) e o critério de seleção de pergunta.

Descartado: precedência. Não existe "candidato que cede lugar a outro".

## 14. Por que híbrido

Três modelos eram possíveis. O escolhido é o terceiro.

**Eliminação pura** (espelho do original): um desacordo elimina o candidato. Com 8 eixos e 3
candidatos, mede-se: **todos são eliminados em poucas perguntas**. Ninguém concorda com um plano
inteiro. O instrumento devolveria conjunto vazio quase sempre.

**Pontuação pura**: todo eixo soma ou subtrai; saída é um ranking. Simples e robusto — mas perde
as duas coisas que dão valor a este motor: não há como declarar uma discordância inegociável, e
some a camada de "não investigado" que impede o fechamento prematuro.

**Híbrido**: eliminação para o que é inegociável, acumulação para o resto.

- **Linha vermelha** — o usuário marca um eixo como inegociável. Candidato que diverge nele é
  `eliminado`, com motivo estruturado. É o análogo direto de `exclusions[]`, movido para o lado
  do usuário porque a inegociabilidade é dele, não do candidato.
- **Portão** — condição que invalida todos (não disputa neste município). Análogo de
  `g_prejuizo`.
- **Acumulação** — o resto vira `score`, normalizado em `afinidade ∈ [0,1]`.
- **Contraste** — pares de candidatos próximos com um eixo que os separa e que o usuário ainda
  não respondeu. Nunca elimina. É a seção "não investigado", que aqui significa: *"você está
  inclinado a A sobre B e nunca respondeu a única coisa que os separa."*

## 15. Modelo de dados novo

`data/corpus.json`. Formato completo, com os campos que o validador exige:

```json
{
  "schemaVersion": "1.0.0",
  "corpusVersion": "0.1.0-EXEMPLO",
  "escopo": { "eleicao": "…", "cargo": "…", "municipio": "…", "turno": 1 },
  "status": "draft",
  "aviso": "…",
  "curadoria": {
    "responsavel": null,
    "data": null,
    "metodo": "como as citações foram selecionadas — ver §26",
    "criterioDeInclusao": "por que estes eixos e não outros",
    "revisadoPor": null
  },

  "eixos": {
    "e_iptu_progressivo": {
      "label": "IPTU progressivo",
      "pergunta": "Você concorda com IPTU progressivo sobre imóveis ociosos?",
      "dominio": "tributacao",
      "peso": 3,
      "formulacaoNeutra": true
    }
  },

  "portoes": {
    "p_elegivel": {
      "pergunta": "O candidato disputa a eleição no seu município?",
      "efeito": "invalida-todos-se-nao"
    }
  },

  "candidatos": [
    {
      "id": "C1",
      "nome": "…",
      "partido": "…",
      "posicoes": [
        {
          "eixo": "e_iptu_progressivo",
          "postura": "favor",
          "citacao": {
            "texto": "Instituiremos alíquota progressiva de IPTU para imóveis ociosos.",
            "fonte": "plano-de-governo-C1.pdf",
            "local": "p. 12",
            "url": null,
            "contexto": "seção 'Política Urbana', parágrafo de abertura",
            "recuperadoEm": null
          },
          "interpretacao": null
        }
      ]
    }
  ],

  "contrastes": [
    {
      "entre": ["C1", "C3"],
      "discriminador": "e_camera_corporal",
      "inclina": { "concordo": "C1", "discordo": "C3" },
      "nota": "Único eixo de segurança em que se separam."
    }
  ]
}
```

Campos que merecem justificativa:

| Campo | Por quê |
|---|---|
| `eixos[].peso` | nem toda posição vale o mesmo. Entra na fórmula de score **e** na de ganho de discriminação. Faixa sugerida 1–3; documente a escala. |
| `eixos[].formulacaoNeutra` | marcador de revisão: a pergunta induz a resposta? É a mesma responsabilidade que `operationalization` tem no motor clínico. |
| `posicoes[].postura` | `"favor"` \| `"contra"`. **Ausência é significado**, não terceiro valor — §18. |
| `citacao.texto` | **obrigatório e literal.** Ver `interpretacao` abaixo. |
| `citacao.local` | página/seção. Obrigatório: sem localizador, a citação não é auditável. |
| `citacao.contexto` | onde a frase estava. Existe para que o leitor detecte citação fora de contexto. |
| `posicoes[].interpretacao` | **onde vive a decisão autoral.** Quando a citação não é literal quanto à postura ("vamos estudar modelos de concessão" → `favor`?), a inferência é registrada aqui, explícita e atacável. Campo preenchido = responsabilidade de quem curou. Análogo exato de `operationalization`. |
| `curadoria` | quem escolheu as citações. §26. |

**Inversão de licença.** No motor clínico, `validarBase()` **proíbe** transcrição de prosa —
o CDDR é publicação com copyright. Aqui é o oposto: planos de governo registrados são
documentos públicos, e **a citação literal é o produto**. O validador inverte a trava: rejeita
postura *sem* citação. Mas isso não é liberdade total — ver §26.

## 16. A inversão: o "paciente" é o usuário

A mudança conceitual mais fácil de errar.

No motor clínico, `respostas[f_humor] = "sim"` significa *"o paciente tem humor deprimido"*, e
cada transtorno declara predicados sobre essa mesma variável. As entidades e as respostas falam
do mesmo objeto.

Aqui, `respostas[e_iptu_progressivo] = "concordo"` significa *"**eu**, usuário, sou a favor"*.
Mas `candidatos[].posicoes[]` fala do **candidato**. São dois objetos distintos, e o motor
compara um com o outro.

Consequência prática: existem quatro combinações, não duas.

| usuário | candidato | resultado |
|---|---|---|
| `concordo` | `favor` | **alinhado** `+peso` |
| `discordo` | `contra` | **alinhado** `+peso` — concordar em rejeitar é concordar |
| `concordo` | `contra` | divergente `−peso` |
| `discordo` | `favor` | divergente `−peso` |
| qualquer | *silêncio* | nem um nem outro → §18 |

O caso `discordo/contra` é o que um port apressado erra: só contar concordâncias positivas
subestima candidatos que se opõem às mesmas coisas que o usuário.

Vocabulário de respostas: `"concordo"` | `"discordo"` | `"indiferente"` | `"ns"`.

- `"indiferente"` é **novo**, e não existe no motor clínico: o usuário não tem posição e não
  quer que o eixo pese. Neutraliza o eixo — peso 0 — e o remove do denominador.
- `"ns"` mantém o significado original: mantém a pendência viva e é reportado.

Os dois são diferentes e a distinção precisa chegar ao relatório, exatamente como
`undefined`/`null` no original.

## 17. `avaliar()` novo — score, afinidade, cobertura

```
para cada candidato:
  score = 0 ; pesoDeclarado = 0 ; pesoRespondido = 0 ; pesoSilencioso = 0
  para cada eixo com resposta do usuário:
      "ns"          → inconclusivos += eixo ; continua
      "indiferente" → continua (peso 0, fora de tudo)
      pesoRespondido += peso
      se candidato não tem postura no eixo:
          silencios += eixo ; pesoSilencioso += peso ; continua
      pesoDeclarado += peso
      alinha = (concordo & favor) ou (discordo & contra)
      score += alinha ? +peso : −peso
      se NÃO alinha e eixo ∈ linhasVermelhas → estado = eliminado, motivo {tipo:"linha-vermelha", eixo}

  afinidade = pesoDeclarado ? (score + pesoDeclarado) / (2 × pesoDeclarado) : null
  cobertura = pesoRespondido ? pesoDeclarado / pesoRespondido : null

portões: efeito "invalida-todos-se-nao" e resposta "nao" → todos eliminados
```

**`afinidade ∈ [0,1]`** — normalização de `score ∈ [−pesoDeclarado, +pesoDeclarado]`. 1,0 =
concorda com tudo que o candidato declarou entre o que o usuário respondeu. `null` quando o
candidato não declarou nada sobre nada que o usuário respondeu — **`null` não é zero** e não
pode virar zero no ranking.

**`cobertura ∈ [0,1]`** — fração do peso respondido pelo usuário sobre a qual o candidato de
fato se pronunciou. É a métrica que o motor clínico não precisava ter e que aqui é
indispensável.

Ambas obrigatórias no relatório, **sempre juntas**. Ver §18.

> **Correção obrigatória sobre o protótipo.** O pseudocódigo acima — e o código do Apêndice A —
> percorrem *todos* os eixos respondidos. Está incompleto: eixos **unânimes** precisam ficar fora
> de `score`, `pesoDeclarado` e `pesoRespondido`, porque incluí-los pode **inverter o ranking**.
> A demonstração numérica está em §20. Na implementação final, calcule o conjunto de eixos
> unânimes antes do laço, pule-os, e acumule-os à parte em `afinidadeComOCampo`.

## 18. Silêncio: a métrica que impede o falso vencedor

Um candidato que fala pouco e acerta tudo que fala tem afinidade 1,0. Um que fala de tudo e
acerta 85% tem 0,85. Reportar só a afinidade elege o primeiro — e o primeiro pode não ter dito
nada sobre o que mais importa ao usuário.

Este é o análogo direto de `EM ABERTO — requisitos ainda não verificados` no relatório clínico, e
tem o mesmo propósito: **impedir que ausência de informação seja lida como concordância.**

Regras:

1. Silêncio **nunca** soma nem subtrai. Não é meio-ponto, não é neutro-positivo.
2. `afinidade` e `cobertura` aparecem sempre lado a lado, na mesma linha, no relatório e na UI.
3. O ranking usa `afinidade`, mas o relatório deve **destacar** quando o líder tem cobertura
   menor que um limiar (sugestão: 0,7) ou menor que a de quem vem atrás.
4. Os eixos silenciados de cada candidato são listados nominalmente — não só contados.

Formulação para o relatório: *"C1 lidera com afinidade 1,00, mas não se pronunciou sobre
adensamento vertical, que você marcou com peso 2."*

## 19. `proximaPergunta()` novo — ganho de discriminação

Aqui está a mudança de fórmula mais importante do port, e ela **inverte** o critério original.

No motor clínico, a melhor pergunta é a de **maior alcance**: a feature usada por mais entidades
vivas, porque cada resposta pode podar muitas de uma vez. Aqui, alcance máximo é inútil: um eixo
em que **todos** os candidatos têm a mesma postura não separa ninguém, por mais central que seja.

O critério novo é **separação**:

```js
nFavor  = candidatos vivos com postura "favor"  no eixo
nContra = candidatos vivos com postura "contra" no eixo
separacoes = nFavor × nContra        // pares de candidatos que esta pergunta separa
ganho      = separacoes × peso
```

`nFavor × nContra` é o número de pares que a resposta distingue — máximo quando o campo está
dividido ao meio, zero quando é unânime ou quando só um lado falou. Multiplicar pelo peso faz
o motor perguntar primeiro o que é divisivo **e** importante.

Fases, na mesma arquitetura do original:

1. **Eixos com `ganho > 0`**, decrescente. Desempate: `peso`, depois id lexicográfico.
   Eixos com `separacoes = 0` **nunca entram nesta fase** — §20.
2. **Discriminadores de contraste** ainda não respondidos, entre pares ambos vivos.
3. **Portões**, só se já existe ranking.
4. `null` — encerrado.

Ordem medida no corpus de exemplo (§23), com 3 candidatos e 8 eixos:

```
 1. [eixo] e_iptu_progressivo      separa 2×1  ganho=6
 2. [eixo] e_privatiza_saneamento  separa 1×2  ganho=6
 3. [eixo] e_camera_corporal       separa 2×1  ganho=4
 4. [eixo] e_corredor_onibus       separa 1×1  ganho=2
 5. [eixo] e_zoneamento_vertical   separa 1×1  ganho=2
 6. [portao] p_elegivel
encerrado após 6 perguntas
```

Três eixos nunca foram perguntados. Não é bug — é §20.

**Terminação** vale pelo mesmo argumento do original: toda pergunta consome uma variável não
respondida. Fuzz de 500 sequências pseudoaleatórias sobre `{concordo, discordo, indiferente, ns}`:
termina em 100% dos casos, máximo de 6 perguntas.

## 20. Consenso: o tratamento das citações compartilhadas

Este é exatamente o caso que motivou o instrumento: **citações compartilhadas entre candidatos
versus exclusivas de um.** O motor as trata em três categorias, e a distinção é estrutural, não
cosmética.

| categoria | condição | tratamento |
|---|---|---|
| **divisivo** | `nFavor > 0` e `nContra > 0` | perguntado, na ordem do ganho. É o que produz ranking. |
| **unânime** | todos os vivos falaram, todos com a mesma postura | **não perguntado.** Relatado em "consenso do campo". |
| **unilateral** | só uma parte falou, sem oposição declarada | **não perguntado.** Relatado com a contagem de mudos. |

Medido no corpus de exemplo:

```
unânimes:     e_creche_integral (favor), e_transparencia_orcamento (favor)
unilaterais:  e_concurso_saude (favor, 1 mudo)
```

Por que **não perguntar** o unânime: a resposta não carrega nenhuma informação sobre preferência
*relativa*. Todos tomam a mesma postura, então nenhuma resposta possível favorece um candidato
sobre outro naquele eixo. Perguntar gastaria atenção do usuário sem produzir sinal.

**Mas atenção: incluir o unânime no cálculo pode reordenar o ranking.** Isto foi verificado, e é
consequência da normalização, não da lógica. Se `f` é a afinidade e `P` o peso declarado, incluir
um eixo unânime de peso `w` em que o usuário concorda dá:

```
f' = (P·f + w) / (P + w)          — média ponderada entre f e 1
```

O puxão em direção a 1 é **inversamente proporcional a `P`**. Um candidato que falou pouco é
puxado muito mais forte do que um que falou muito, e a ordem inverte. Contraexemplo mínimo,
executado:

```
A: 40 de peso declarado, afinidade 0.550, cobertura 0.80
B: 10 de peso declarado, afinidade 0.500, cobertura 0.20
                                                        → ranking A > B

acrescenta u1 (peso 3, ambos "favor", usuário concorda):
A: 43 de peso declarado, afinidade 0.581
B: 13 de peso declarado, afinidade 0.615
                                                        → ranking B > A   ← inverteu
```

O candidato que quase não falou ganhou a liderança por concordar com uma unanimidade. Isso é um
artefato da métrica, não um fato político — e é exatamente o falso vencedor que §18 existe para
evitar.

Portanto a regra é mais forte do que "não perguntar": **eixos unânimes não entram em `afinidade`
nem em `cobertura`, mesmo que respondidos por outra via.** Se a fase 4 abaixo for implementada, as
respostas dela vão para uma métrica separada e nunca para o ranking.

Por que **relatar mesmo assim**: são as duas afirmações mais úteis que o instrumento pode fazer
fora do ranking.

- *"Todos os candidatos vivos prometem creche integral. Sua posição sobre isso não separa
  ninguém — mas o campo inteiro está comprometido com ela."*
- *"Apenas C1 e C3 se pronunciaram sobre concurso na saúde. C2 não disse nada."*

O unilateral é especialmente valioso: é onde o silêncio de um candidato aparece como fato
positivo sobre o campo, não como ausência de dado.

**Consequência para a leitura do número.** Como eixos unânimes ficam fora, `afinidade` é uma
medida de **preferência relativa entre os candidatos**, não de "% de concordância com o plano".
Um usuário que concorda com 90% do que C1 escreveu pode ver afinidade 0,55, porque os 35% de
consenso do campo não entraram na conta. O relatório precisa nomear a métrica de forma que isso
fique óbvio — *"alinhamento nos pontos em que os candidatos divergem"*, não *"compatibilidade"*.

**Fase 4 opcional de encerramento.** Depois de esgotadas as três fases, ofereça os eixos unânimes
e unilaterais, explicitamente marcados como *não discriminantes*, e compute-os em métrica
separada — `afinidadeComOCampo` — que **nunca** entra no ranking, pelo motivo demonstrado acima.
São duas perguntas diferentes e merecem dois números diferentes: *"quem é mais parecido comigo"* e
*"o quanto este campo eleitoral inteiro me representa"*. A segunda é frequentemente a mais
informativa: um usuário cuja `afinidadeComOCampo` é baixa está diante de um campo que não o
representa, e nenhum ranking entre os candidatos conserta isso.

Eixos **unilaterais** são um caso intermediário: quem falou pode ser comparado a quem se calou,
mas essa comparação é entre uma posição e um silêncio. Mantenha-os fora do ranking pelo mesmo
motivo, e reporte-os como fato sobre o campo (§18, regra 4).

## 21. Contrastes, linhas vermelhas e portões

### Contrastes

Porte direto de `boundaries[]`, com as mesmas quatro regras (§5): relevante só com os dois lados
vivos, nunca elimina, `"ns"` mantém aberto, perguntado depois dos eixos e antes dos portões.
Uma quinta condição de resposta aparece aqui: `"indiferente"` também mantém o contraste em
aberto, com motivo próprio.

Duas travas novas no validador, ambas específicas do domínio:

- **Ambos os lados precisam ter postura no discriminador.** Um contraste em que um candidato é
  mudo não discrimina nada — discrimina contra o silêncio.
- **Os dois lados não podem ter a mesma postura.** Se ambos são `favor`, o par não se separa ali.

As duas travas foram testadas contra um corpus deliberadamente defeituoso e disparam corretamente.

O sentido do contraste aqui é mais direto que no domínio clínico: *"C1 e C3 estão empatados na
sua avaliação; câmera corporal é a única coisa que os separa e você ainda não respondeu."* É a
pergunta que o instrumento existe para fazer.

### Linhas vermelhas

Conjunto de ids de eixo, mantido do lado do **usuário**, não do corpus. Divergência em um eixo
marcado → `eliminado`, motivo `{tipo:"linha-vermelha", eixo}`.

Decisões de UI que a especificação exige:

1. Marcar linha vermelha deve ser **explícito e reversível**, e a UI deve deixar claro que é
   eliminatório — não um peso alto.
2. O relatório lista **quem foi eliminado por qual linha**, com a citação que causou a
   eliminação. Um candidato eliminado nunca some em silêncio.
3. Se **todos** forem eliminados, o instrumento diz isso e mostra o ranking que existiria sem as
   linhas vermelhas. Devolver conjunto vazio sem explicação é o pior resultado possível.

### Portões

`efeito: "invalida-todos-se-nao"` lido **do JSON**, corrigindo B8. Elegibilidade é o caso óbvio.
Preserve a regra: portão só é perguntado quando já existe ranking — e corrija **B1** de saída
(não deixe um portão que elimina todos impedir os portões seguintes).

## 22. Ranking, margem e empate

```js
ordem   = vivos com afinidade != null, decrescente por afinidade, desempate lexicográfico
lideres = todos a até `margem` do topo          // margem sugerida: 0.05
empate  = lideres.length > 1
```

O invariante nº 2 do motor original — **sem vencedor único imposto** — sobrevive aqui como a
margem. Afinidade é quantidade contínua construída sobre pesos que alguém escolheu à mão;
tratar 0,84 e 0,81 como ordem estrita é dar às escolhas de curadoria uma precisão que elas não
têm.

Medido, com apenas 3 dos 8 eixos respondidos:

```
C1: afinidade 1.000  C2: 0.333  C3: 1.000
ranking: C1 > C3 > C2   líderes: [C1, C3]   empate: true
```

O instrumento diz *"empatados"* em vez de escolher pela ordem alfabética. Com todos os eixos
respondidos, o empate se resolve sozinho. Regras derivadas:

1. Enquanto `empate`, a UI mostra os líderes **lado a lado**, sem ordem visual entre eles.
2. Havendo empate e contraste não investigado entre dois líderes, essa é a próxima pergunta mais
   valiosa do instrumento — destaque-a.
3. `margem` é parâmetro visível, com valor default documentado. Não esconda.

## 23. Exemplo trabalhado, com saída real

Corpus fictício: 3 candidatos, 8 eixos, 1 portão, 3 contrastes, 21 posturas com citação.
Nomes e citações são inventados. O protótipo do Apêndice A produziu tudo abaixo.

**Perfil respondido** — concorda com IPTU progressivo, creche integral, corredores de ônibus,
câmera corporal, adensamento, concurso na saúde, orçamento aberto; discorda de concessão do
saneamento.

**Perguntas feitas:** 6 (5 eixos + 1 portão), de 9 possíveis. Três eixos foram pulados por serem
consenso ou unilaterais.

**Estados finais:**

```
C1  estado=vivo  score=10  afinidade=1.000  cobertura=0.833
    alinhados   = iptu, corredor, camera, saneamento
    divergentes = —
    silêncios   = zoneamento_vertical

C2  estado=vivo  score=−4  afinidade=0.333  cobertura=1.000
    alinhados   = camera, zoneamento
    divergentes = iptu, corredor, saneamento
    silêncios   = —

C3  estado=vivo  score=2   afinidade=0.600  cobertura=0.833
    alinhados   = iptu, saneamento
    divergentes = camera, zoneamento
    silêncios   = corredor_onibus

ranking: C1 > C3 > C2      líderes: [C1]      empate: false
unânimes:    creche_integral (favor), transparencia_orcamento (favor)
unilaterais: concurso_saude (favor, 1 mudo)
contrastes investigados: C1~C3→C1, C1~C2→C1, C2~C3→C2
contrastes não investigados: —
```

Repare que **C1 lidera com cobertura 0,833**: não se pronunciou sobre adensamento vertical. O
relatório precisa dizer isso na mesma linha do resultado, por §18.

**Mesmo corpus, linha vermelha em saneamento:**

```
C1: vivo
C2: eliminado {tipo:"linha-vermelha", eixo:"e_privatiza_saneamento"}
C3: vivo
ranking: C1 > C3
```

**Três perfis de referência, para calibrar:**

```
P1 estatista:  C1=1.000  C2=0.500  C3=0.765  → C1 > C3 > C2   líderes [C1]
P2 liberal:    C1=0.353  C2=1.000  C3=0.235  → C2 > C1 > C3   líderes [C2]
P3 fronteira:  C1=0.750  C2=0.000  C3=1.000  → C3 > C1 > C2   líderes [C3]
```

Três perfis distintos produzem três vencedores distintos. É a checagem mínima de que os pesos e
as posturas não estão degenerados — um corpus em que todo perfil elege o mesmo candidato está
mal construído ou mal curado.

## 24. `validarCorpus()`

Substitui `validarBase()`. Bloqueia o build, igual ao original.

| # | Erro | Análogo clínico |
|---|---|---|
| 1 | eixo inexistente em `posicoes[]` | trava 1 |
| 2 | `postura` fora de `{favor, contra}` | trava 2 |
| 3 | id de candidato duplicado | — (novo) |
| 4 | postura duplicada — mesmo candidato, mesmo eixo | — (novo) |
| 5 | **postura sem `citacao.texto`** | **inverso da trava 5** |
| 6 | citação sem `fonte` **e** `local` | — (novo, auditabilidade) |
| 7 | eixo declarado que nenhum candidato menciona | trava 13 |
| 8 | contraste com `entre.length !== 2` | trava 6 |
| 9 | contraste com id inexistente | trava 7 |
| 10 | contraste com discriminador inexistente | trava 8 |
| 11 | contraste reflexivo | trava 11 |
| 12 | contraste duplicado | trava 12 |
| 13 | `inclina` com chave fora de `{concordo, discordo}` | trava 9 |
| 14 | `inclina` apontando para fora do par | trava 10 |
| 15 | **lado do contraste sem postura no discriminador** | — (novo, §21) |
| 16 | **ambos os lados com a mesma postura no discriminador** | — (novo, §21) |

Travas de processo, herdadas de `validate.mjs`:

- falhar se `status: "verified"` com posturas de curadoria não revisada;
- reportar quantas posturas têm `interpretacao` preenchida — é a superfície de responsabilidade
  autoral, e ela precisa ser visível a cada build.

Trava adicional recomendada: **contagem de citações por candidato**. Se um candidato tem 3
citações e outro tem 20, a curadoria está desequilibrada e o instrumento vai punir o primeiro
por silêncio que talvez seja da curadoria, não do plano. Emita aviso acima de um desvio.

## 25. Verificação no novo domínio

Os três níveis do original portam. O terceiro precisa de um critério diferente, e isso foi
medido.

### 25.1 Testes unitários

Traduza os 18 e acrescente os do domínio novo. Mínimo obrigatório:

- as quatro combinações usuário×candidato de §16, com ênfase em `discordo/contra` = alinhado;
- `"indiferente"` neutraliza sem contar no denominador;
- `"ns"` mantém a pendência e não altera score;
- silêncio não soma nem subtrai, e reduz `cobertura`;
- `afinidade = null` quando nada foi declarado, e `null` não entra no ranking como 0;
- eixo unânime nunca é perguntado, e aparece em `consensos.unanimes`;
- **eixo unânime respondido por outra via não altera `afinidade` nem `cobertura`** — use o
  contraexemplo de §20 como caso de teste literal: `A(P=40, f=0.550)` e `B(P=10, f=0.500)` com um
  unânime de peso 3 devem continuar em `A > B`;
- eixo unilateral nunca é perguntado, e aparece com a contagem de mudos;
- linha vermelha elimina, e a eliminação sobrevive a respostas posteriores;
- portão que invalida todos não impede os portões seguintes (**regressão de B1**);
- contraste nunca elimina;
- terminação sob fuzz.

### 25.2 Perfis de referência (ex-vinhetas)

Mesma anatomia, mesma disciplina, mesma advertência de circularidade de §9.4 — que aqui é **mais
grave**, não menos: um perfil escrito por quem curou as citações mede se a curadoria é
internamente consistente, não se ela é justa.

```json
{
  "id": "P003",
  "titulo": "Eleitor de fronteira entre C1 e C3",
  "autoria": { "redigidoPor": null, "independenteDoCorpus": false, "data": null },
  "descricao": "Prosa: quem é este eleitor, escrita ANTES de mapear as respostas.",
  "respostas": { "e_iptu_progressivo": "concordo", "...": "..." },
  "linhasVermelhas": [],
  "esperado": {
    "deveLiderar": ["C3"],
    "naoPodeLiderar": ["C2"],
    "deveEliminar": [],
    "deveEmpatar": [],
    "deveSinalizar": [["C1","C3"]],
    "semAssercao": []
  },
  "justificativa": "Por que este eleitor deveria preferir C3 — em termos políticos, não do motor."
}
```

`deveSinalizar` e `semAssercao` sobrevivem com a mesma função. Priorize, como o original, os
casos de consequência: o perfil de fronteira entre dois líderes, o perfil que dispara linha
vermelha, o perfil com muitos `"ns"` em que o desfecho correto é **empate declarado**, e o perfil
para o qual o líder tem cobertura baixa.

### 25.3 Mutação — o critério precisa mudar

Rodado no corpus de exemplo, removendo uma postura por vez:

```
1 perfil,  critério "a ordem do ranking mudou":       0/21 cobertos, 21 sobreviventes
3 perfis,  critério "ordem OU conjunto de líderes":   2/21 cobertos, 19 sobreviventes
```

Números ruins, e a explicação é estrutural: **no motor clínico o estado é discreto**, então
remover um requisito quase sempre muda `descartado` para `aberto` e alguma vinheta acusa. Aqui a
saída é **contínua**: remover uma postura muda a afinidade em alguns centésimos e a ordem do
ranking costuma sobreviver.

Consequências para o port, todas obrigatórias:

1. **O critério de detecção não pode ser só a ordem final.** Use a tupla
   `(ordem, conjunto de líderes, afinidade arredondada em 2 casas, cobertura)`. Uma postura
   removida sempre muda pelo menos os números do candidato afetado — o que se está medindo é se
   **algum perfil declarado percebe**.
2. **Perfis precisam ser adversariais, não representativos.** O valor está nos perfis de
   fronteira, onde dois candidatos ficam dentro da margem. Perfis confortáveis, em que um
   candidato domina, não detectam nada — foi exatamente o resultado com 1 perfil.
3. **Rode a mutação também sobre os pesos**, não só sobre as posturas: se dobrar o peso de um
   eixo não muda nenhum desfecho, aquele peso é decorativo; se muda todos, o instrumento está
   pendurado numa única escolha de curadoria e isso precisa aparecer no relatório.

### 25.4 Cobertura

Porte os três relatórios: candidatos que nenhum perfil coloca na liderança, contrastes que nenhum
perfil sinaliza, e — **novo** — eixos que nenhum perfil responde. Um eixo que nenhum perfil de
referência exercita é um eixo que ninguém verificou.

## 26. Ética do instrumento

O motor clínico carrega a frase *"Não constitui diagnóstico. A decisão diagnóstica é do
profissional responsável."* Ela não é adorno jurídico: é o enquadramento que torna o instrumento
honesto. O port precisa da sua própria, e ela é mais difícil de acertar.

**O instrumento não recomenda voto.** Ele compara posições declaradas pelo usuário com posições
declaradas em documentos. Isso ignora, por construção: histórico de mandato, capacidade de
execução, coalizão, quem financia, e a distância conhecida entre plano de governo e governo.
Diga isso no produto, não em rodapé — na mesma tela do resultado.

**A seleção das citações é o maior viés do sistema, e é invisível.** Quem escolhe quais eixos
existem e qual trecho representa a posição de cada candidato determina o resultado antes de
qualquer resposta do usuário. É o análogo exato de `operationalization` no motor clínico, com
uma diferença desconfortável: lá o viés é técnico, aqui ele é partidário e o curador pode não
perceber que o tem. Mitigações estruturais, todas já no schema:

- `curadoria.metodo` e `curadoria.criterioDeInclusao` preenchidos e **impressos no relatório**;
- `citacao.contexto` obrigatório, para que citação fora de contexto seja detectável por quem lê;
- `interpretacao` obrigatória sempre que a postura não é literal na citação;
- aviso de build quando as contagens de citação por candidato estão desequilibradas (§24);
- `eixos[].formulacaoNeutra` como marcador de revisão de redação — "você concorda com IPTU
  progressivo sobre imóveis ociosos?" e "você concorda em aumentar impostos sobre proprietários?"
  descrevem a mesma política e colhem respostas diferentes.

**Paráfrase nunca substitui citação.** Se a postura não estiver literal no documento, o campo
`texto` carrega o trecho real e `interpretacao` carrega a inferência, separadamente. Colapsar os
dois é como transcrever prosa da fonte no motor clínico — o validador existe justamente para
tornar isso impossível por acidente.

**Fontes.** Planos de governo registrados são públicos e citáveis com atribuição. Registre em
`citacao.fonte`/`url`/`recuperadoEm` de onde veio e quando — documentos são substituídos, e um
relatório exportado precisa dizer sob qual versão do corpus foi produzido, exatamente como
`criteriaVersion` faz hoje.

**Privacidade.** Preserve a arquitetura: build singlefile, zero requisição externa, nada sai do
navegador. As respostas do usuário são as posições políticas dele. É informação mais sensível
que a maioria dos dados que um site coleta, e a única defesa que não depende de confiança é não
ter servidor.

## 27. Plano de migração

Faça em repositório novo. O corpus clínico e o político não coabitam, e o histórico do original
tem valor próprio.

**Etapa 1 — esqueleto.** Copie `package.json`, `vite.config.js`, `index.html`,
`.github/workflows/pages.yml` e a estrutura de pastas. Nada a mudar além de nomes.

**Etapa 2 — corpus.** Escreva `data/corpus.json` com **3 candidatos e 6–8 eixos reais**, não
mais. O erro caro aqui é curar 40 eixos antes de saber se as fórmulas se comportam. O corpus do
Apêndice A serve como fixture de desenvolvimento — troque-o depois, não antes.

**Etapa 3 — motor.** Comece pelo protótipo do Apêndice A, que já está validado, e acrescente na
ordem: correção de B1, fase 4 de encerramento (§20), `afinidadeComOCampo`.

**Etapa 4 — validador.** As 16 travas de §24, mais as de processo. Ligue no `npm run build`
desde o primeiro dia — a trava só serve se nunca puder ser adiada.

**Etapa 5 — testes.** A lista de §25.1. Escreva o de regressão de B1 **antes** de corrigir B1.

**Etapa 6 — perfis.** Três, sendo um de fronteira. Depois rode mutação e deixe que ela diga
quais faltam.

**Etapa 7 — relatório.** Estrutura sugerida, espelhando a original:

```
COMPARAÇÃO DE PROPOSTAS — <eleição>, <cargo>, <município>
Gerado em / Corpus versão + status / Curadoria: responsável e método
[AVISO se status != verified]

RANKING            afinidade + cobertura na MESMA linha; líderes juntos se houver empate
POR QUE            por candidato: eixos alinhados, com a citação literal
DIVERGÊNCIAS       por candidato: eixos divergentes, com a citação literal
SILÊNCIOS          por candidato: eixos que ele não abordou, nominalmente          ← §18
ELIMINADOS         quem, por qual linha vermelha, com a citação que causou
CONSENSO DO CAMPO  eixos unânimes e unilaterais                                    ← §20
NÃO INVESTIGADO    contrastes entre candidatos vivos sem resposta                  ← §21
PORTÕES
RASTRO             pergunta, resposta, o que mudou no ranking
Este documento compara posições declaradas. Não recomenda voto.                    ← §26
```

**Etapa 8 — UI.** Adapte `App.jsx`; a estrutura de três painéis (pergunta / estado dos
candidatos / rastro) serve sem mudanças estruturais. Acrescente: o controle de linha vermelha,
a exibição conjunta de afinidade+cobertura, e a citação visível ao lado de cada alinhamento —
o usuário precisa poder discordar da curadoria enquanto usa o instrumento.

**Etapa 9 — persistência.** Aqui é requisito, não melhoria (B10). `localStorage` com
export/import JSON, sem servidor.

## 28. Checklist de aceitação

O port está pronto quando todas passarem:

- [ ] `avaliar()` é pura: sem `Date`, sem `Math.random`, sem I/O, sem dependências
- [ ] `discordo` + `contra` conta como alinhamento
- [ ] `indiferente` e `ns` são distinguíveis no relatório
- [ ] silêncio não soma nem subtrai, e reduz `cobertura`
- [ ] `afinidade` e `cobertura` nunca aparecem separadas
- [ ] `afinidade = null` não vira 0 no ranking
- [ ] eixo unânime nunca é perguntado, e aparece no relatório
- [ ] eixo unânime não entra em `afinidade` nem em `cobertura` (contraexemplo de §20 passa)
- [ ] `afinidadeComOCampo` é métrica separada e não influencia o ranking
- [ ] eixo unilateral nunca é perguntado, e aparece com a contagem de mudos
- [ ] contraste nunca elimina candidato
- [ ] contraste com lado mudo, ou com posturas iguais, é rejeitado no build
- [ ] linha vermelha elimina com motivo estruturado e citação
- [ ] eliminação de todos mostra o ranking contrafactual, não conjunto vazio
- [ ] portão que invalida todos não bloqueia os portões seguintes (B1)
- [ ] margem de empate é parâmetro visível; líderes empatados aparecem lado a lado
- [ ] postura sem citação literal falha o build
- [ ] citação sem fonte e localizador falha o build
- [ ] `interpretacao` é contada e reportada a cada build
- [ ] `corpusVersion` e `curadoria` aparecem no cabeçalho de todo relatório
- [ ] rastro registra as mudanças de ranking causadas por cada resposta
- [ ] o motor termina sob fuzz de 500 sequências
- [ ] mutação roda com critério `(ordem, líderes, afinidade, cobertura)` e ≥1 perfil de fronteira
- [ ] o build produz `.html` único, sem requisição externa
- [ ] a tela de resultado diz que o instrumento não recomenda voto

---

## Apêndice A — protótipo validado

Este é o código que produziu **todos** os números da Parte II. Roda em Node 18+, sem
dependências. **Não é a implementação final.** Faltam, em ordem de gravidade:

1. **exclusão dos eixos unânimes de `avaliar()`** — hoje, se um eixo unânime for respondido por
   qualquer via, ele entra em `score`/`pesoDeclarado` e pode inverter o ranking (§20). No fluxo
   normal isso não acontece porque `proximaPergunta()` nunca os oferece, mas a função `avaliar()`
   está exposta e um perfil de referência pode respondê-los diretamente;
2. correção de **B1** (portão que elimina todos bloqueia os portões seguintes — herdado);
3. fase 4 de encerramento e `afinidadeComOCampo` (§20);
4. `montarRelatorio()` (§27, etapa 7).

Com essas ressalvas, é o ponto de partida de menor risco: passa nas 16 travas do validador e no
fuzz de 500 sequências.

### `motor.mjs`

```js
/** Protótipo do motor de alinhamento — híbrido: eliminação + acumulação. */

export function validarCorpus(c) {
  const erros = [];
  const eixos = new Set(Object.keys(c.eixos));
  const ids = new Set(c.candidatos.map((x) => x.id));
  const vistos = new Set();
  for (const cand of c.candidatos) {
    if (vistos.has(cand.id)) erros.push(`id duplicado: ${cand.id}`);
    vistos.add(cand.id);
    const eixosDoCand = new Set();
    for (const p of cand.posicoes) {
      if (!eixos.has(p.eixo)) erros.push(`${cand.id}: eixo inexistente "${p.eixo}"`);
      if (!["favor", "contra"].includes(p.postura)) erros.push(`${cand.id}/${p.eixo}: postura inválida "${p.postura}"`);
      if (eixosDoCand.has(p.eixo)) erros.push(`${cand.id}: postura duplicada no eixo "${p.eixo}"`);
      eixosDoCand.add(p.eixo);
      if (!p.citacao?.texto) erros.push(`${cand.id}/${p.eixo}: postura sem citação — proibido`);
      if (!p.citacao?.fonte || !p.citacao?.local) erros.push(`${cand.id}/${p.eixo}: citação sem fonte+local`);
    }
  }
  const usados = new Set(c.candidatos.flatMap((x) => x.posicoes.map((p) => p.eixo)));
  for (const e of eixos) if (!usados.has(e)) erros.push(`eixo "${e}" não é declarado por nenhum candidato`);
  const dup = new Set();
  for (const t of c.contrastes || []) {
    if (t.entre?.length !== 2) erros.push("contraste malformado: entre precisa de 2 ids");
    for (const id of t.entre || []) if (!ids.has(id)) erros.push(`contraste ${t.entre}: id inexistente "${id}"`);
    if (t.entre?.[0] === t.entre?.[1]) erros.push(`contraste reflexivo em ${t.entre?.[0]}`);
    if (!eixos.has(t.discriminador)) erros.push(`contraste ${t.entre}: discriminador inexistente`);
    const k = [...(t.entre || [])].sort().join("~");
    if (dup.has(k)) erros.push(`contraste duplicado entre ${k}`);
    dup.add(k);
    const post = [];
    for (const id of t.entre || []) {
      const cand = c.candidatos.find((x) => x.id === id);
      const pp = cand && cand.posicoes.find((p) => p.eixo === t.discriminador);
      if (cand && !pp) erros.push(`contraste ${t.entre.join("~")}: ${id} não tem postura em "${t.discriminador}" — não pode discriminar`);
      if (pp) post.push(pp.postura);
    }
    if (post.length === 2 && post[0] === post[1])
      erros.push(`contraste ${t.entre.join("~")}: ambos os lados são "${post[0]}" em "${t.discriminador}" — não discrimina`);
    for (const [r, alvo] of Object.entries(t.inclina || {})) {
      if (!["concordo", "discordo"].includes(r)) erros.push(`contraste ${t.entre}: resposta inválida "${r}"`);
      if (!(t.entre || []).includes(alvo)) erros.push(`contraste ${t.entre}: inclina aponta para fora do par`);
    }
  }
  return erros;
}

const postura = (cand, eixo) => cand.posicoes.find((p) => p.eixo === eixo) || null;

export function avaliar(c, respostas, linhasVermelhas = new Set()) {
  const out = {};
  for (const cand of c.candidatos) {
    let estado = "vivo", motivo = null;
    let score = 0, pesoDeclarado = 0, pesoSilencioso = 0, pesoRespondido = 0;
    const alinhados = [], divergentes = [], silencios = [], inconclusivos = [];

    for (const [eixo, def] of Object.entries(c.eixos)) {
      const r = respostas[eixo];
      if (r === undefined) continue;
      if (r === "ns") { inconclusivos.push(eixo); continue; }
      if (r === "indiferente") continue;
      const peso = def.peso ?? 1;
      pesoRespondido += peso;
      const p = postura(cand, eixo);
      if (!p) { silencios.push(eixo); pesoSilencioso += peso; continue; }
      const alinha = (r === "concordo" && p.postura === "favor") || (r === "discordo" && p.postura === "contra");
      pesoDeclarado += peso;
      if (alinha) { score += peso; alinhados.push(eixo); }
      else {
        score -= peso; divergentes.push(eixo);
        if (linhasVermelhas.has(eixo) && estado === "vivo") { estado = "eliminado"; motivo = { tipo: "linha-vermelha", eixo }; }
      }
    }

    const afinidade = pesoDeclarado ? (score + pesoDeclarado) / (2 * pesoDeclarado) : null;
    const cobertura = pesoRespondido ? pesoDeclarado / pesoRespondido : null;
    out[cand.id] = { estado, motivo, score, afinidade, cobertura, pesoDeclarado, pesoSilencioso,
                     alinhados, divergentes, silencios, inconclusivos };
  }
  for (const [k, g] of Object.entries(c.portoes || {})) {
    if (g.efeito === "invalida-todos-se-nao" && respostas[k] === "nao")
      for (const id of Object.keys(out)) out[id] = { ...out[id], estado: "eliminado", motivo: { tipo: "portao", portao: k } };
  }
  return out;
}

export function ranking(c, estados, margem = 0.05) {
  const vivos = c.candidatos.filter((x) => estados[x.id].estado === "vivo" && estados[x.id].afinidade !== null);
  const ord = [...vivos].sort((a, b) => estados[b.id].afinidade - estados[a.id].afinidade || a.id.localeCompare(b.id));
  if (!ord.length) return { ordem: [], lideres: [], empate: false };
  const topo = estados[ord[0].id].afinidade;
  const lideres = ord.filter((x) => topo - estados[x.id].afinidade <= margem).map((x) => x.id);
  return { ordem: ord.map((x) => x.id), lideres, empate: lideres.length > 1 };
}

export function consensos(c, estados) {
  const vivos = c.candidatos.filter((x) => estados[x.id].estado === "vivo");
  const unanimes = [], unilaterais = [];
  for (const eixo of Object.keys(c.eixos)) {
    const falam = vivos.map((x) => postura(x, eixo)).filter(Boolean);
    if (!falam.length) continue;
    const posturas = new Set(falam.map((p) => p.postura));
    if (posturas.size > 1) continue;
    if (falam.length === vivos.length) unanimes.push({ eixo, postura: [...posturas][0], n: falam.length });
    else unilaterais.push({ eixo, postura: [...posturas][0], n: falam.length, mudos: vivos.length - falam.length });
  }
  return { unanimes, unilaterais };
}

export function contrastesAbertos(c, respostas, estados) {
  const vivo = (id) => estados[id] && estados[id].estado === "vivo";
  const naoInvestigados = [], investigados = [];
  for (const t of c.contrastes || []) {
    const [a, z] = t.entre;
    if (!vivo(a) || !vivo(z)) continue;
    const v = respostas[t.discriminador];
    if (v === undefined) naoInvestigados.push({ ...t, motivo: "não perguntado" });
    else if (v === "ns") naoInvestigados.push({ ...t, motivo: "resposta inconclusiva" });
    else if (v === "indiferente") naoInvestigados.push({ ...t, motivo: "declarado indiferente" });
    else investigados.push({ ...t, resposta: v, inclina: t.inclina?.[v] || null });
  }
  return { naoInvestigados, investigados };
}

export function proximaPergunta(c, respostas, estados) {
  const vivos = c.candidatos.filter((x) => estados[x.id].estado === "vivo");
  const cands = [];
  for (const [eixo, def] of Object.entries(c.eixos)) {
    if (respostas[eixo] !== undefined) continue;
    const falam = vivos.map((x) => postura(x, eixo)).filter(Boolean);
    const nF = falam.filter((p) => p.postura === "favor").length;
    const nC = falam.filter((p) => p.postura === "contra").length;
    const separacoes = nF * nC;
    if (!separacoes) continue;
    cands.push({ eixo, def, separacoes, peso: def.peso ?? 1, nF, nC, ganho: separacoes * (def.peso ?? 1) });
  }
  cands.sort((a, b) => b.ganho - a.ganho || b.peso - a.peso || a.eixo.localeCompare(b.eixo));
  if (cands.length) {
    const m = cands[0];
    return { tipo: "eixo", id: m.eixo, ...m.def, separa: { favor: m.nF, contra: m.nC, ganho: m.ganho } };
  }
  const { naoInvestigados } = contrastesAbertos(c, respostas, estados);
  const p = naoInvestigados.find((t) => respostas[t.discriminador] === undefined);
  if (p) return { tipo: "contraste", id: p.discriminador, ...c.eixos[p.discriminador], entre: p.entre, nota: p.nota || null };
  const houveRanking = ranking(c, estados).ordem.length > 0;
  if (houveRanking) {
    const g = Object.keys(c.portoes || {}).find((k) => respostas[k] === undefined);
    if (g) return { tipo: "portao", id: g, ...c.portoes[g] };
  }
  return null;
}
```

### `corpus.json` de exemplo (resumido)

Três candidatos fictícios, 8 eixos, 21 posturas. Estrutura completa em §15. Distribuição das
posturas, que é o que importa para reproduzir os números:

```
eixo                       peso   C1       C2       C3
e_iptu_progressivo          3     favor    contra   favor
e_creche_integral           3     favor    favor    favor     ← unânime
e_corredor_onibus           2     favor    contra   —
e_camera_corporal           2     favor    favor    contra
e_privatiza_saneamento      3     contra   favor    contra
e_transparencia_orcamento   1     favor    favor    favor     ← unânime
e_zoneamento_vertical       2     —        favor    contra
e_concurso_saude            3     favor    —        favor     ← unilateral

contrastes: C1~C3 por e_camera_corporal · C1~C2 por e_privatiza_saneamento · C2~C3 por e_zoneamento_vertical
portão:     p_elegivel, efeito invalida-todos-se-nao
```

---

## Apêndice B — glossário

| Termo (código) | Domínio clínico | Domínio político |
|---|---|---|
| `base` / `corpus` | base de critérios | corpus de citações |
| `disorders` / `candidatos` | transtorno da CID-11 | candidatura |
| `features` / `eixos` | sintoma ou característica | posição de política pública |
| `essential` | requisito obrigatório (conjunção) | — (vira `posicoes` do candidato) |
| `exclusions` / `linhasVermelhas` | achado que descarta a entidade | posição inegociável do usuário |
| `gates` / `portoes` | condição universal (prejuízo funcional) | elegibilidade |
| `boundaries` / `contrastes` | par de entidades + discriminador | par de candidatos + eixo que os separa |
| `leans` / `inclina` | para que lado a resposta aponta | idem |
| `blockedBy` | precedência entre entidades | — (descartado) |
| `aberto` | requisitos ainda não verificados | — |
| `satisfeito` | todos os requisitos atendidos | — |
| `descartado` / `eliminado` | requisito violado | linha vermelha ou portão |
| `precedencia` | satisfeito, cede a outro | — |
| `vivo` | — | não eliminado |
| `alcance` / `ganho` | nº de entidades vivas que usam a feature | `nFavor × nContra × peso` |
| `"ns"` | não sei / não avaliado | idem |
| `"indiferente"` | — | usuário sem posição; neutraliza o eixo |
| `pendentes` / `silencios` | requisitos não perguntados | eixos sobre os quais o candidato não falou |
| `operationalization` / `interpretacao` | decisão autoral sobre quantificador vago | inferência de postura não literal na citação |
| `provenance` / `citacao` | seção da fonte, **nunca** a prosa | a prosa é obrigatória, com fonte e localizador |
| vinheta / perfil de referência | caso clínico com desfecho esperado | eleitor sintético com ranking esperado |

---

*Documento gerado a partir da leitura completa de `src/engine.js`, `src/vignettes.mjs`,
`src/validate.mjs`, `src/App.jsx`, `data/criteria.cap06.json`, `docs/AUTORIA.md` e das cinco
vinhetas, no commit `cdb72b2`. Todos os números foram medidos executando o código; o protótipo
da Parte II foi executado e validado antes de ser documentado.*
