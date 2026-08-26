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

## 4. Pesos

Escala escolhida pelo curador, **ausente dos planos**:

| peso | significado |
|---|---|
| 3 | eixo estruturante — reorganiza um setor inteiro ou a matriz do Estado |
| 2 | política setorial relevante, de efeito amplo mas delimitado |
| 1 | mecanismo institucional específico |

`node src/perfis.mjs mutacao`, medido: dobrar o peso muda algum desfecho em **22 dos
48 eixos** — exatamente os 22 divisivos. Os 26 restantes são decorativos para o
ranking. **O ranking inteiro depende de 22 números escolhidos à mão.**

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
