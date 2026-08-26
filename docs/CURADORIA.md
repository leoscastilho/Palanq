# Curadoria — decisões, viés e o que não foi verificado

> A escolha de quais eixos existem e de qual trecho representa a posição de cada
> candidatura determina o resultado **antes de qualquer resposta do usuário**.
> Este documento existe para tornar essa escolha atacável. Se você discorda dela,
> discorda do instrumento inteiro — e deveria.

## 1. Fontes

| Arquivo | O que traz |
|---|---|
| `source/propostas.md` | o que cada candidatura **defende**, por eixo temático |
| `source/auxiliar.md`, Parte 1 | o que cada candidatura declara **combater** |
| `source/auxiliar.md`, Parte 2 | propostas exclusivas que diferenciam candidaturas de plataforma quase idêntica |

**Nenhum dos dois é transcrição literal de plano registrado.** Os dois são resumos
curatoriais escritos por terceiro. O §26 da especificação diz que paráfrase nunca
substitui citação; aqui a paráfrase é tudo o que existe. A consequência está
declarada em `corpus.curadoria.limitacoesConhecidas`, impressa em todo relatório e
exibida na tela de abertura: **nenhuma postura deste corpus tem citação verbatim
auditável.** Enquanto isso for verdade, `status` não pode ser `verified` — e o
validador recusa a promoção (trava de processo).

Os planos integrais estão em `candidatos[].planoUrl` e prevalecem sobre qualquer
resumo daqui. Eles aparecem na tela de resultado e no fim do relatório: a última
coisa que o instrumento faz é mandar o usuário ler o documento original.

### Inconsistência descartada

Os códigos entre colchetes de `source/auxiliar.md` são internamente contraditórios
(`C03` designa Romeu Zema **e** Augusto Cury; Lula aparece como `C12`; Hertz Dias
como `C06`). Foram descartados. Os IDs `C01`–`C12` deste corpus seguem estritamente
a ordem de `source/propostas.md`.

## 2. A decisão que mais afeta o resultado: quando registrar `"contra"`

`source/propostas.md`, sozinho, só diz o que cada candidatura **apoia**. Um corpus
construído só a partir dele teria `nContra = 0` em todos os eixos, `separacoes = 0`
em todos os eixos, e o motor **não faria pergunta nenhuma** (§19). O `auxiliar.md`
resolve isso ao registrar oposições declaradas.

A regra adotada:

> Uma postura `"contra"` só é registrada quando **o texto declara rejeição àquela
> política**. Quando a postura é inferida e não é literal, ela vai com o campo
> `interpretacao` preenchido, e a interface exibe a inferência ao lado da citação,
> em destaque, para que o usuário possa recusá-la.

**Silêncio nunca vira oposição.** Não citar vigilância eletrônica não faz ninguém
contrário a ela. Isso violaria o §18 e seria o viés invisível que o §26 manda evitar.

### As três inferências deste corpus

São as únicas posturas com `interpretacao` preenchida, e o validador as conta a cada
build. Em ordem de fragilidade crescente:

1. **C11 · `e_renda_sem_contrapartida` = favor.** O plano propõe "benefício de um
   salário mínimo para cidadãos sem colocação profissional" sem condicionalidade
   declarada. A inferência é que ausência de contrapartida no desenho equivale a ser
   favorável a benefício sem contrapartida. Razoável, não literal.
2. **C01 · `e_flexibilizacao_trabalhista` = favor.** O plano declara "contrariedade
   ativa à imposição de vínculos empregatícios rígidos" no trabalho por plataformas.
   Inferir apoio à flexibilização a partir de oposição à rigidez é uma dupla negação
   defensável, mas é inferência.
3. **C01 · `e_encarceramento_excecao` = favor.** *A mais frágil deste corpus.* A
   postura apoia-se no enunciado curatorial que rotula a proposta como
   "Infraestrutura Prisional de Padrão Salvadorenho". O texto da proposta em si
   descreve presídios federais de segurança máxima para lideranças de facções — não
   encarceramento em massa nem suspensão de garantias. Quem discordar desta
   inferência deve descartar o eixo inteiro; o outro lado dele (C07) é literal.

### Oposições que **não** foram registradas, e por quê

| Par tentador | Por que ficou de fora |
|---|---|
| Simplificação fiscal × justiça fiscal progressiva | São ortogonais. Simplificar obrigações não diz nada sobre progressividade. Registrar oposição aqui seria projeção partidária. |
| Vigilância tecnológica × desmilitarização | "Policiamento pautado estritamente em garantias fundamentais" sugere tensão com vigilância de massa, mas não a rejeita. Vigilância fica unilateral, com 4 mudos. |
| Isolamento de lideranças × desmilitarização | Paradigmas diferentes, não negações. Foram mantidos como dois eixos unilaterais separados. |
| Ensino disciplinar × estatização do ensino | Tratam de coisas distintas (disciplina × acesso). A oposição real ao ensino cívico-militar está declarada em `auxiliar.md` e foi essa que entrou. |

`e_privatizacoes` e `e_reestatizacao` **não** foram registrados como um eixo
bidirecional único por acaso: a "Reestatização e Gestão da Dívida" é eixo próprio
(unilateral), e a oposição a privatizações vem da rejeição explícita a "convênios com
OSs, fundações de direito privado e privatização de hospitais, escolas, transportes e
saneamento". Registrar os dois como espelhos um do outro seria contar a mesma
informação duas vezes no score.

## 3. Pesos

Escala, escolhida pelo curador e **não presente nas fontes**:

| peso | significado |
|---|---|
| 3 | eixo estruturante — reorganiza um setor inteiro ou a matriz do Estado |
| 2 | política setorial relevante, de efeito amplo mas delimitado |
| 1 | mecanismo institucional específico |

`node src/perfis.mjs mutacao` mede de quais pesos o resultado depende. Medição atual:
dobrar o peso muda algum desfecho em **7 de 55 eixos** — exatamente os 7 divisivos.
Os outros 48 são decorativos para o ranking (só afetam a afinidade com o campo).
Isso quer dizer que **o ranking inteiro depende de 7 números escolhidos à mão**, e o
relatório precisa continuar dizendo isso.

## 4. Redação das perguntas

`eixos[].formulacaoNeutra` é autoavaliação do curador e marcador de revisão, não
garantia. "Você concorda com IPTU progressivo sobre imóveis ociosos?" e "você concorda
em aumentar impostos sobre proprietários?" descrevem a mesma política e colhem
respostas diferentes.

Um eixo está marcado `formulacaoNeutra: false`, com `notaRedacao` obrigatória
(o validador exige): **`e_encarceramento_excecao`**. Não foi possível descrever o
mecanismo sem já qualificá-lo. O relatório e a interface sinalizam isso sempre que
o eixo é respondido.

## 5. Desequilíbrio de citações

O validador emite aviso quando a contagem de citações de uma candidatura se afasta
mais de 1,5 desvio da média. Estado atual: **Clariana Barão (C08) tem 6 citações
contra média 13,0.** Ela vai ser penalizada por silêncio que pode ser da curadoria e
não do plano — a fonte lhe dá menos linhas que às outras. A cobertura exibe isso, mas
não conserta.

## 6. O que este corpus não verifica

Rode os relatórios; eles são gerados por máquina e priorizados:

```bash
node src/perfis.mjs cobertura
node src/perfis.mjs mutacao
```

Estado atual, medido:

- **116 de 156 posturas sobrevivem à mutação** — podem ser apagadas do corpus sem que
  nenhum perfil de referência acuse. Todas são de eixos não discriminantes, que os
  perfis não exercitam.
- **2 de 4 contrastes** não são sinalizados por nenhum perfil (`C01~C05`, `C03~C10`).
- **48 de 55 eixos** não são respondidos por nenhum perfil.

Cada linha acima é tarefa de curadoria, não defeito do motor.

## 7. A regra que a automação não pode quebrar

Perfis de referência são escritos por **humano**, e os sete daqui **não são
independentes do corpus** — foram redigidos por quem montou os eixos. Eles medem se a
curadoria é internamente consistente; **não medem se ela é justa.** O executor emite
esse aviso a cada execução, por perfil, e não há como desligá-lo.

Um perfil gerado a partir do corpus deriva as respostas dos mesmos critérios que
deveria testar: a asserção vira "o motor concorda com o corpus", verdadeira por
construção. Isso é pior que ausência de teste, porque **parece cobertura**.

Uso legítimo de automação: apontar *onde* falta perfil. Nunca escrever o par
descrição + respostas.
