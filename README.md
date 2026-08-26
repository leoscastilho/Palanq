# Match Presidenciáveis

Instrumento que percorre as posições declaradas em planos de governo e indica quais
candidaturas mais se alinham às posições que **você** declara — sempre mostrando o que
ficou sem investigar e sempre citando a fonte.

**Não recomenda voto.** Compara posições declaradas em documentos e ignora, por
construção: histórico de mandato, capacidade de execução, coalizão, financiamento de
campanha e a distância conhecida entre plano de governo e governo.

Porte do motor de restrições descrito em [`MOTOR-E-PORT-POLITICO.md`](MOTOR-E-PORT-POLITICO.md).
Motor híbrido: **eliminação** para o que o usuário declara inegociável, **acumulação**
para o resto.

## Rodar

```bash
node tools/servir.mjs      # http://localhost:8731
```

Ou abra `index.html` com duplo clique — ele é autocontido e funciona offline.

Sem `npm install`: **zero dependências**, Node 18+ apenas para os scripts.

```bash
npm run corpus             # regenera data/corpus.json e perfis/ a partir de source/
npm run validate           # 16 travas + travas de processo — bloqueia o build
npm test                   # 59 testes do motor + 7 perfis de referência
npm run perfis:cobertura   # o que nenhum perfil exercita
npm run perfis:mutacao     # o que pode ser apagado do corpus sem ninguém acusar
npm run build              # valida e escreve index.html (arquivo único)
```

`index.html` é versionado e é o que o GitHub Pages serve. A CI recusa o deploy se ele
estiver desatualizado em relação às fontes.

## Estrutura

```
source/            propostas.md e auxiliar.md — as fontes, intocadas
data/corpus.json   o corpus (gerado por tools/gerar-corpus.mjs, versionado)
src/motor.mjs      o motor. PURO: sem Date, sem I/O, sem dependências
src/validar.mjs    validarCorpus() — as 16 travas do §24
src/relatorio.mjs  montarRelatorio() — única função com efeito de ambiente
src/perfis.mjs     executor de perfis: verificação, cobertura, mutação
src/ui.js          interface, sem framework
tools/build.mjs    empacota tudo em index.html
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

**Ignorância, indiferença e ausência são três coisas.** `não sei`, `indiferente` e
`não perguntado` são registrados separadamente e nenhum deles pesa.

**Eixo que não separa fica fora da conta.** Incluir um consenso do campo no ranking
inverte a ordem em favor de quem falou menos — é demonstrável e está no §20 da
especificação, com o contraexemplo virando teste literal. Esses eixos viram uma
métrica própria, `afinidade com o campo`, que responde outra pergunta: *o quanto este
campo eleitoral inteiro me representa*.

**Linha vermelha elimina, e nunca em silêncio.** Cada eliminação sai com a citação que
a causou. Se todas caírem, o instrumento mostra o ranking que existiria sem as linhas
vermelhas em vez de devolver conjunto vazio.

**Empate é resultado válido.** Candidaturas dentro da margem (padrão 0,05) aparecem
lado a lado, sem ordem entre elas. Os pesos foram escolhidos à mão e não têm precisão
para separar 0,84 de 0,81.

## Privacidade

Sem servidor, sem telemetria, sem requisição externa. A sessão fica em `localStorage`,
neste aparelho, com exportação e importação em JSON. As respostas do usuário são as
posições políticas dele: a única defesa que não depende de confiança é não ter para
onde mandá-las.

## Estado do corpus

`status: draft`. As citações são **resumos curatoriais** de `source/`, não trechos
literais de planos registrados — a limitação está impressa em toda tela e em todo
relatório, e o validador impede promover o corpus a `verified` enquanto for verdade.
Leia [`docs/CURADORIA.md`](docs/CURADORIA.md) antes de confiar em qualquer resultado.
