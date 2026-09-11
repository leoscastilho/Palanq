# Product

<!-- impeccable:product-schema 1 -->

<!-- Rascunho escrito pelo Claude a partir do README, de docs/CURADORIA.md e das
     decisões confirmadas na sessão de 2026-09-11 (redesenho no estilo Tinder).
     Revise; `/impeccable init` refaz a entrevista se algo aqui estiver errado. -->

## Platform

web

## Users

Eleitores brasileiros, no celular, na eleição presidencial de 2026. Chegam por link
compartilhado (WhatsApp, Telegram, redes) e querem, em poucos minutos, saber quais
candidaturas mais se alinham ao que **eles** pensam — sem ler 788 páginas de planos.
Segunda audiência: jornalistas, professores e curiosos que abrem `/motor` para
conferir as fórmulas, as citações e a curadoria.

## Product Purpose

Palanq compara as posições que a pessoa declara com as posições **escritas** nos 12
planos de governo registrados, sempre citando página e trecho, e sempre mostrando o
que ficou sem investigar. Sucesso é a pessoa sair sabendo (1) quem mais combina com
ela *no papel*, (2) o quanto isso está apoiado em texto real versus silêncio, e (3)
onde ela discorda de quem pretendia apoiar. **Não recomenda voto.**

## Positioning

O único comparador que trata silêncio como cobertura (não como concordância), que
deixa a pessoa marcar temas como inegociáveis com eliminação explícita e citada, e
que para de perguntar quando a liderança já está matematicamente decidida. Cada
frase mostrada é um trecho literal de um documento público, com link para o PDF.

## Operating Context

Sessão curta, de pé ou no sofá, uma mão, luz ambiente qualquer — daí o tema escuro
opcional, à escolha da pessoa. Duas telas sobre o mesmo motor: `/` (cartões, o produto)
e `/motor` (instrumento completo). Corpus em `data/corpus.json`, gerado das fontes em
`source/`; build em `tools/build.mjs` gera as duas páginas autocontidas.

## Capabilities and Constraints

- Um tema por cartão; respostas: concordo, discordo, não opinar, e os dois
  inegociáveis (segurar para confirmar). Cartão vira para explicar em linguagem leiga.
- Para automaticamente quando a liderança está decidida (piso de 10 perguntas e 8
  temas); "segure para encerrar" a qualquer momento; resultado permite continuar.
- Resultado: ranking por afinidade com barras concordância/divergência/silêncio
  hachurado; folha por candidatura com as citações.
- **Zero requisição de rede**: página única, CSP `default-src 'none'`, sem CDN, fonte
  embutida em base64. As respostas são as posições políticas da pessoa e ficam só
  no `localStorage` do aparelho.
- Sem framework, sem dependências; Node 18+ só para os scripts.
- Copy em pt-BR; terminologia fixa: afinidade, cobertura, inegociável, "não opinar".
- Corpus em `status: draft` até revisão externa.

## Brand Commitments

- Nome: **Palanq**. Slogan: "No papel, qual candidato combina com você?".
- Referência visual vinculada pelo autor (2026-09-11): a linguagem do **Tinder**
  (e Bumble como segunda referência) — cartões que ocupam a tela, botões redondos
  sobre a borda do cartão, carimbos ao arrastar, degradê coral→rosa como cor de
  marca (#fd267a → #ff6036), fundo branco / quase preto. Verde e vermelho seguem
  reservados a concordo/discordo.
- Tipografia: Figtree (OFL), embutida — nada externo.
- Ícone: `icones/logo.png` (dois cartões e um ✓ sobre coral `#ea4d66`); derivados em `icones/`, manifesto em `manifest.webmanifest`.
- Tema claro por padrão; escuro por alternância manual, lembrada no aparelho.
- Politicamente neutro na aparência: a cor de marca não é a de nenhum partido.

## Evidence on Hand

- 12 planos de governo registrados em PDF (`source/propostas/`), 214 posturas
  literais com página em `data/corpus.json`; explicações leigas por tema no corpus.
- Nenhum depoimento, imprensa ou métrica de uso — não inventar.
- Sem fotos das candidaturas; a identidade visual de cada tema é a cor, não imagem.

## Product Principles

1. Silêncio nunca vira concordância: afinidade e cobertura aparecem juntas.
2. Toda afirmação sobre um plano é uma citação com página; nada é parafraseado.
3. A interface explica o custo antes da ação irreversível (inegociável elimina).
4. Rápido e lúdico por fora, rigoroso por dentro — o jogo não afrouxa a conta.
5. Privacidade por construção: não há para onde mandar as respostas.

## Accessibility & Inclusion

Teclado completo (setas, Espaço/Enter, Esc), foco visível, `prefers-reduced-motion`
respeitado, contraste ≥ 4.5:1 em texto corrido nos dois temas, alvos de toque ≥ 44px.
