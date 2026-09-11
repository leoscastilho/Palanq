---
name: Palanq
description: Cartões que ocupam a tela, cinco botões redondos na borda, degradê coral→rosa — o cânone Tinder aplicado a um comparador de planos de governo.
colors:
  marca-coral: "#fd267a"
  marca-laranja: "#ff6036"
  botao-coral: "#e5125a"
  botao-laranja: "#d93a17"
  acento: "#e5125a"
  acento-escuro: "#fd267a"
  sim: "#0a7f4e"
  sim-vivo: "#0ea765"
  nao: "#e8163f"
  nao-vivo: "#f0284f"
  ine: "#0b62c8"
  ine-vivo: "#1786ff"
  pular: "#626c79"
  pular-vivo: "#7c8794"
  sobre: "#ffffff"
  fundo: "#ffffff"
  caixa: "#ffffff"
  realce: "#f2f4f6"
  linha: "#e4e7eb"
  texto: "#111418"
  texto-2: "#4a535f"
  texto-3: "#626c79"
  fundo-escuro: "#111418"
  caixa-escuro: "#1a1f27"
  realce-escuro: "#1f252e"
  linha-escuro: "#2a313b"
  texto-escuro: "#f3f5f7"
  texto-2-escuro: "#a9b1bc"
  texto-3-escuro: "#8e97a3"
  sim-escuro: "#3ee6a0"
  nao-escuro: "#ff5c74"
  ine-escuro: "#4d9eff"
  pular-escuro: "#8e97a3"
  sobre-escuro: "#111418"
  cartao-topo: "oklch(.55 .13 var(--h))"
  cartao-pe: "oklch(.40 .13 var(--h))"
  cartao-topo-escuro: "oklch(.50 .12 var(--h))"
  cartao-pe-escuro: "oklch(.34 .12 var(--h))"
typography:
  display:
    fontFamily: "Figtree, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(3rem, 12vw, 3.8rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 8vw, 2.4rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "1.85rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  question:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "clamp(1.22rem, 5vw, 1.45rem)"
    fontWeight: 500
    lineHeight: 1.32
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  mini:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.84rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.12em"
  stamp:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "clamp(2rem, 8vw, 2.5rem)"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "0.06em"
rounded:
  chip: "8px"
  toast: "14px"
  linha: "16px"
  escolha: "18px"
  aviso: "20px"
  cartao: "24px"
  pilula: "999px"
  circulo: "50%"
spacing:
  xs: "0.35rem"
  sm: "0.6rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2.5rem"
  card-x: "1.5rem"
  card-bottom: "3.4rem"
  barra-topo: "44px"
components:
  card-face:
    backgroundColor: "{colors.cartao-topo}"
    textColor: "{colors.sobre}"
    rounded: "{rounded.cartao}"
    padding: "1.5rem 1.5rem 3.4rem"
  action-button:
    backgroundColor: "{colors.caixa}"
    textColor: "{colors.nao-vivo}"
    rounded: "{rounded.circulo}"
    size: "clamp(62px, 17vw, 68px)"
  action-button-active:
    backgroundColor: "{colors.nao-vivo}"
    textColor: "{colors.sobre}"
    rounded: "{rounded.circulo}"
  button-primary:
    backgroundColor: "{colors.botao-coral}"
    textColor: "{colors.sobre}"
    rounded: "{rounded.pilula}"
    padding: "0.65rem 1.3rem"
    typography: "{typography.body}"
  button-outline:
    backgroundColor: "{colors.caixa}"
    textColor: "{colors.texto}"
    rounded: "{rounded.pilula}"
    padding: "0.65rem 1.3rem"
  button-start:
    backgroundColor: "{colors.sobre}"
    textColor: "{colors.botao-coral}"
    rounded: "{rounded.pilula}"
    padding: "1rem 2.6rem"
  button-glass:
    backgroundColor: "rgb(255 255 255 / .18)"
    textColor: "{colors.sobre}"
    rounded: "{rounded.pilula}"
    padding: "0.5rem 1.05rem"
  chip-dominio:
    backgroundColor: "rgb(0 0 0 / .26)"
    textColor: "{colors.sobre}"
    rounded: "{rounded.pilula}"
    padding: "0.32rem 0.7rem 0.32rem 0.55rem"
    typography: "{typography.label}"
  segmented-control:
    backgroundColor: "{colors.realce}"
    textColor: "{colors.texto-3}"
    rounded: "{rounded.pilula}"
    padding: "4px"
  ranking-row:
    backgroundColor: "{colors.fundo}"
    textColor: "{colors.texto}"
    rounded: "{rounded.linha}"
    padding: "0.55rem 0.5rem"
  sheet:
    backgroundColor: "{colors.fundo}"
    textColor: "{colors.texto}"
    rounded: "24px 24px 0 0"
    padding: "0.4rem 1.3rem 1.6rem"
  toast:
    backgroundColor: "{colors.texto}"
    textColor: "{colors.fundo}"
    rounded: "{rounded.toast}"
    padding: "0.75rem 1.15rem"
  aviso:
    backgroundColor: "{colors.realce}"
    textColor: "{colors.texto}"
    rounded: "{rounded.aviso}"
    padding: "1.1rem 1.2rem"
---

# Design System: Palanq

> Escrito a partir do artefato construído (`src/swipe.css`, `src/swipe.js`, `src/fonte.css`, `src/rodape.css`, `tools/build.mjs`), não do plano. Os tokens do frontmatter são normativos; a prosa explica onde e por quê. Os títulos de seção ficam em inglês porque ferramentas que leem DESIGN.md dependem deles; o resto é pt-BR, como o repositório.

## Overview

**Creative North Star: "O Cânone Tinder, executado a sério"**

Responder é deslizar. O cartão é o objeto inteiro — a cor do tema ocupa o cartão como uma foto ocuparia, o nome do tema é o "nome" e a pergunta é a "bio" — e os cinco botões redondos flutuam sobre a borda de baixo, invadindo o cartão pela metade do maior. Tudo o que não é o cartão (barra do topo, legenda, "segure para encerrar", resultado) é discreto e neutro para que a cor do tema seja a única coisa colorida em cena. A direção foi fixada pelo autor: Tinder como referência principal, Bumble como segunda, sem ironia e sem "inspirado em"; o padrão de acabamento daqueles produtos é a régua.

Por fora é rápido e lúdico; por dentro a conta é rigorosa, e a interface mostra o custo antes de qualquer ação irreversível. Isso aparece como duas famílias de cor para cada resposta (uma para texto miúdo, outra para ícone e carimbo), como o apertar-e-segurar nos inegociáveis, e como o silêncio hachurado na barra do resultado. Nada é caixa de alerta; o título faz o trabalho do aviso. O mundo rejeita explicitamente o questionário editorial de papel creme, filetes finos e caixas de aviso que o `/motor` ainda usa.

Claro é o padrão; o escuro é escolha da pessoa (botão na barra, lembrado no aparelho) e tem a mesma cena e os mesmos pesos, com luminosidades recalibradas — nunca uma inversão automática.

**Key Characteristics:**
- Fundo branco puro ou quase preto; a única cor fora do cartão é o degradê da marca (logotipo, progresso, botão principal, anel do líder).
- Cartão = degradê vertical OKLCH por matiz do tema, texto branco, raio de 24px, sombra macia deslocada.
- Cinco botões redondos brancos com ícone colorido que se enche da cor ao apertar; os dois escudos (inegociáveis) exigem segurar.
- Carimbos rotacionados em caixa alta que aparecem ao arrastar (CONCORDO/DISCORDO ao estilo LIKE/NOPE).
- Figtree variável (300–900) embutida em base64; zero requisição de rede.
- Movimento com ease-out exponencial em 280–360ms; `prefers-reduced-motion` honrado em toda transição de posição.

## Colors

Uma paleta de dois estratos: um ground neutro e silencioso (branco/quase preto com três cinzas de texto) e, sobre ele, cor viva e funcional — a marca para identidade e progresso, o matiz do tema para o cartão, verde/vermelho/azul/cinza para as quatro respostas.

### Primary
- **Coral de marca** (`marca-coral`) → **Laranja de marca** (`marca-laranja`): o degradê coral→rosa/laranja (`linear-gradient(90deg, …)` no logotipo e na barra de progresso; `160deg` na tela de abertura; `150deg` no anel da 1ª posição do ranking). É a identidade, não ênfase: aparece no nome, no progresso, no anel do líder e na abertura inteira. Escolhido por não ser cor de partido nenhum.
- **Coral de botão** (`botao-coral`) → **Laranja de botão** (`botao-laranja`): a mesma dupla, mais funda, usada onde há texto branco em cima (`.btn`, cor do texto do botão "Começar"). Existe porque a versão viva não aguenta 4.5:1 com branco.
- **Acento** (`acento`, claro / `acento-escuro`, escuro): links "ver plano", rótulo "líder", título do aviso `afinar`. No claro é o coral de botão (fundo); no escuro volta a ser o coral vivo, que sobre `#111418` passa de 5:1.

### Secondary (respostas)
Cada resposta tem duas cores. **"Texto"** aguenta letra miúda sobre o fundo da página (≥4.5:1); **"vivo"** é para ícone, carimbo e barra, que são grandes (≥3:1). No tema escuro as duas colapsam num único valor, porque um verde/vermelho/azul claro sobre quase preto passa nos dois usos.
- **Concordo** (`sim` / `sim-vivo`; escuro `sim-escuro`): verde. Botão da direita, carimbo esquerdo, segmento de acordo nas barras, pílula "Concordo!" do overlay.
- **Discordo** (`nao` / `nao-vivo`; escuro `nao-escuro`): vermelho. Botão da esquerda, carimbo direito, segmento de divergência, rótulos "fora"/"eliminada", título de nota `perigo`, carga do "segure para encerrar".
- **Inegociável** (`ine` / `ine-vivo`; escuro `ine-escuro`): azul. Título do overlay, negrito da legenda, carimbo central, anel de foco global. Os botões de escudo NÃO usam azul: usam a cor da direção (verde ou vermelho), porque a direção é o que a pessoa escolhe primeiro; a forma de escudo é o que diz "elimina".
- **Não opinar** (`pular` / `pular-vivo`; escuro `pular-escuro`): cinza. Botão do meio e carimbo inferior (branco sobre o cartão).
- **Sobre** (`sobre` / `sobre-escuro`): a cor do texto e do ícone em cima de um preenchimento vivo. Branco no claro, quase preto no escuro — porque no escuro as cores vivas são claras.

### Tertiary (cartão)
- **Topo do cartão** (`cartao-topo`) e **Pé do cartão** (`cartao-pe`): `oklch(L C h)` com `L .55 → .40` e `C .13` no claro, `L .50 → .34` e `C .12` no escuro (`cartao-topo-escuro`, `cartao-pe-escuro`). Só o matiz `--h` varia, vindo da tabela `MATIZ` em `swipe.js` (economia 245, tributação 235, fiscal 225, orçamento 215, trabalho 55, previdência 70, social 5, federativo 258, saúde 175, ambiental 150, agrário 130, energia 90, educação 300, tecnologia 285, comunicação 320, segurança 30, justiça 268, política 275, estado 252, externa 262, transporte 200; padrão 250). Rede sem `oklch`: `hsl(var(--h) 55% 42%)`. Por cima, uma luz `radial-gradient(120% 55% at 12% 0%, rgb(255 255 255 / .17), transparent 62%)` e, no pé, um véu `linear-gradient(to bottom, transparent, rgb(0 0 0 / .22))` a partir de 38% da altura.

### Neutral
- **Fundo** (`fundo` / `fundo-escuro`): a página e a folha da candidatura. Branco puro; quase preto azulado.
- **Caixa** (`caixa` / `caixa-escuro`): superfície de botão redondo, overlay do inegociável, marca deslizante do seletor de ordenação, botões de contorno. Igual ao fundo no claro, um degrau acima no escuro.
- **Realce** (`realce` / `realce-escuro`): trilho de progresso, fundo do botão de tema, círculo de posição, fundo das barras, hover de linhas, caixa `aviso`.
- **Linha** (`linha` / `linha-escuro`): divisores de raia e item, borda de botões de contorno, puxador da folha, hachura do silêncio.
- **Texto** (`texto`, `texto-2`, `texto-3` e variantes escuras): título/corpo; secundário (`.mini`, citações); terciário (rótulos dos botões, "faltam N", contagens, fontes). No claro, medidos sobre branco: 7.80:1 e 5.33:1.

### Named Rules
**A Regra do Matiz Só.** Entre cartões varia apenas o matiz OKLCH; luminosidade e croma são fixos por tema claro/escuro. Assim os 21 temas pesam o mesmo na tela e o texto branco passa em todos — em HSL, amarelo saía claro demais e azul escuro demais com os mesmos números. Temas vizinhos no assunto ficam vizinhos no círculo.

**A Regra Texto vs Vivo.** Toda cor de resposta tem um par: a "texto" para letra miúda sobre o fundo (≥4.5:1) e a "viva" para ícone, carimbo e barra (≥3:1). Nunca use a viva em texto corrido no tema claro; nunca use a texto num ícone que precisa gritar.

**A Regra da Marca Funda.** O degradê vivo (`marca-*`) é decoração e identidade; onde houver texto branco em cima, use a dupla funda (`botao-*`). Pisos medidos: corpo ≥4.5:1, ícones e texto grande ≥3:1.

## Typography

**Display Font:** Figtree (variável 300–900, subconjunto latino, embutida em `fonte.css` como `data:font/woff2;base64`, OFL 1.1; fallback `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`)
**Body Font:** Figtree (a mesma)
**Label/Mono Font:** `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` — declarado (`--mono`), não usado na tela de cartões

**Character:** Uma só família, geométrica e amigável, trabalhada pelo peso: títulos em 800 com tracking negativo apertado, perguntas em 500 folgadas, rótulos em 800 caixa alta com tracking largo. Numerais tabulares no body inteiro (`font-variant-numeric: tabular-nums`) para o "faltam N" e as contagens não dançarem.

### Hierarchy
- **Display** (800, `clamp(3rem, 12vw, 3.8rem)`, line-height 1, tracking −.045em): o nome "Palanq" na abertura, em branco sobre o degradê.
- **Headline** (800, `clamp(1.9rem, 8vw, 2.4rem)`, 1.02, −.03em): o nome do tema no cartão (`h2` da face), alinhado à esquerda no pé.
- **Title** (800, 1.85rem, 1.15, −.02em): "Seu resultado" e afins; `h3` de nota/aviso em 1.05–1.1rem; título do overlay em `clamp(1.5rem, 6.5vw, 1.9rem)` na cor `ine`.
- **Question** (500, `clamp(1.22rem, 5vw, 1.45rem)`, 1.32, `text-wrap: pretty`): a pergunta do cartão, branco a 96%. A explicação do verso usa `clamp(1.08rem, 4.4vw, 1.2rem)` em 500 / 1.45.
- **Body** (400, 16px, 1.5): corpo da página; citações do painel em .92rem / 1.6.
- **Mini** (400, .84rem, 1.45, `texto-2`): notas, legendas. Na barra do topo fica 600 e `texto-3`.
- **Label** (800, .72rem, tracking .12em, CAIXA ALTA): pílula do tema no cartão e títulos pegajosos dos grupos do painel (.74rem, .1em). Rótulos dos botões de ação: 700, `clamp(.58rem, 1.8vw, .66rem)`, .05em, caixa alta, `texto-3`.
- **Stamp** (900, `clamp(2rem, 8vw, 2.5rem)`, 1.05, .06em, CAIXA ALTA, borda 4px `currentColor`, raio 8px): os carimbos; os centrais (inegociável, não opinar) em `clamp(1.6rem, 6.5vw, 2rem)`.
- **Capa** (900, `clamp(5.4rem, 24vw, 7.2rem)`, .85, −.05em, caixa alta, branco a 10%): o nome do tema repetido tom sobre tom, sangrando pela borda direita do cartão como a tipografia de uma capa.

### Named Rules
**A Regra do Peso, Não da Fonte.** Hierarquia vem de peso (500 / 600 / 700 / 800 / 900) e tracking, nunca de uma segunda família. Títulos apertam (−.02 a −.045em); rótulos em caixa alta abrem (.05 a .12em).

**A Regra dos Títulos Equilibrados.** `h1–h3` levam `text-wrap: balance`; a pergunta leva `text-wrap: pretty`. Viúvas no cartão são defeito.

## Layout

Uma coluna só, centrada, com `padding: .75rem 1rem 1rem`. A tela de cartões tem `max-width: 480px` mesmo no desktop — a largura de um telefone, porque o cartão é um objeto que se segura com a mão, não uma página. Resultado e abertura vão a `600px` e `30rem` respectivamente; a folha da candidatura a `min(46rem, 100%)`.

**Primeira dobra no celular:** barra do topo de `44px` mínimo (logotipo 1.2rem com o ícone de 22px, progresso de 5px que estica com `scaleX(--p)`, "faltam N", botão de tema 36px); a pilha de cartões ocupa o resto (`flex: 1 1 auto; min-height: 380px; max-height: 600px`) e a tela toda tem `min-height: 100dvh`; a fileira de ações sobe `calc(var(--d-max) / -2)` e invade o cartão pela metade do maior botão; abaixo, a legenda do inegociável (`max-width: 30rem`, .76rem) e o "segure para encerrar".

**Fileira de ações:** cinco colunas com `gap: clamp(6px, 2.4vw, 22px)`. Diâmetros por posição: extremos `clamp(62px, 17vw, 68px)`; escudos `clamp(52px, 14.5vw, 56px)` com `margin-top: 6px`; centro `clamp(44px, 12.5vw, 48px)` com `margin-top: 10px` — os botões descem em curva para o meio como no Tinder. O rótulo transborda da coluna (`width: clamp(60px, 17vw, 84px)`) para que "INEGOCIÁVEL" não dite a largura.

**Ritmo:** `.35rem` entre botão e rótulo; `.6rem` entre escolhas; `1rem` entre blocos; `1.5rem` de respiro interno do cartão (`1.5rem 1.5rem 3.4rem`, o pé maior para os botões que invadem); `2.5rem` antes do rodapé. Os cartões de trás: `scale(.95) translateY(12px)` e `scale(.90) translateY(24px)`.

**Breakpoints:** `min-width: 720px` — a folha da candidatura deixa de ser um sheet colado ao pé e vira caixa centrada com raio 24px em toda a volta; `max-width: 640px` — o rodapé recolhe os itens extras atrás de um botão de 22px. `hover: hover` protege os estados de hover dos botões redondos contra o toque.

**Rodapé** (`rodape.css`, compartilhado com `/motor`): usa cores próprias em vez das variáveis da folha para ficar igual nos dois layouts; `max-width: 1000px`, `.76rem`, borda superior `rgba(0,0,0,.1)` e fundo `rgba(0,0,0,.02)` (no escuro `rgba(255,255,255,.1)` / `.03`).

## Elevation & Depth

Híbrido: superfícies neutras são planas e se separam por tom (`fundo` → `caixa` → `realce` → `linha`), e apenas os objetos que "flutuam" fisicamente carregam sombra macia e deslocada para baixo — o cartão, os cinco botões redondos, o botão de começar, o toast, a folha. Sem sombras duras, sem offsets sólidos, sem bordas para simular profundidade. A profundidade da pilha vem de escala, deslocamento e `filter: brightness(.94 / .86)` nos cartões de trás, que perdem a sombra (`0 6px 18px rgb(0 0 0 / .10)` no segundo, nenhuma no terceiro).

### Shadow Vocabulary
- **Cartão** (`--sombra`: `0 14px 36px rgb(17 20 24 / .14), 0 2px 6px rgb(17 20 24 / .06)`; escuro `0 16px 40px rgb(0 0 0 / .5), 0 2px 6px rgb(0 0 0 / .3`): a face do cartão da frente e o overlay do inegociável.
- **Botão** (`--sombra-botao`: `0 4px 12px rgb(17 20 24 / .10), 0 1px 2px rgb(17 20 24 / .06)`; escuro `0 4px 14px rgb(0 0 0 / .45), 0 1px 2px rgb(0 0 0 / .3)`): os cinco botões redondos e a marca deslizante do seletor de ordenação.
- **Botão principal** (`0 6px 16px color-mix(in srgb, var(--botao1) 30%, transparent)`; hover 38% e `0 8px 20px`): `.btn` — sombra tingida da própria cor.
- **Começar** (`0 8px 24px rgb(0 0 0 / .22), 0 1px 3px rgb(0 0 0 / .18)`; hover `0 12px 30px … .26`): o botão branco na abertura.
- **Toast** (`0 10px 30px rgb(0 0 0 / .25)`) e **Folha** (`0 -10px 40px rgb(0 0 0 / .25)` colada ao pé; `0 20px 60px rgb(0 0 0 / .3)` centrada): elementos fixos sobre a página. Escurecedor da folha: `rgb(17 20 24 / .5)`.
- **Carimbo** (`filter: drop-shadow(0 2px 8px rgb(0 0 0 / .4))`): para continuar legível quando a cor do carimbo coincide com a do cartão.

### Named Rules
**A Regra de Quem Flutua.** Só recebe sombra o que a pessoa poderia levantar da mesa: cartão, botões redondos, botão de começar, toast, folha. Superfícies de página (aviso, seletor, raias, grupos do painel) separam-se por tom, nunca por sombra.

**A Regra do Véu.** Texto pequeno sobre cor (pé do cartão, pé da abertura) ganha contraste com um véu preto a 22% por baixo, não trocando a cor do texto.

## Shapes

Tudo é arredondado, em três famílias: **círculo** (`50%`) para o que se aperta com o dedo ou marca posição — botões de ação, botão de tema, círculo de posição no ranking, botão fechar; **pílula** (`999px`) para tudo que é botão de texto, chip, trilho ou barra — `.btn`, "Começar", "virar", pílula do tema, seletor de ordenação, barras de progresso e de afinidade, rótulo "fora"; e **cantos grandes** para superfícies — `24px` no cartão, no overlay e na folha (só no topo quando colada ao pé), `20px` na caixa de aviso, `18px` nas escolhas do overlay, `16px` na raia em hover, `14px` no toast, `8px` no carimbo e nos links de plano, `4px` nos quadradinhos da legenda.

Bordas são raras e finas: `1.5px` em `color-mix(in srgb, var(--cor) 26%, var(--linha))` nos botões redondos (uma insinuação da cor do ícone), `1.5px var(--linha)` nos botões de contorno, `1px rgb(255 255 255 / .38)` no botão de vidro sobre o cartão, `1px var(--linha)` à esquerda das citações. Divisores são `1px var(--linha)`. O silêncio nas barras é hachura `repeating-linear-gradient(-45deg, var(--linha) 0 3px, transparent 3px 7px)`.

O ícone da marca (`MARCA`) é a forma-assinatura: dois cartões de `rx: 3` em `currentColor`, o de trás a 38% e rodado 14°, um check branco (ou `--marca-check`) no da frente — a pilha que a pessoa vai deslizar. Ícones são traço `stroke-width: 2.2`, cantos e pontas redondos, 24×24, todos inline em `ICONE` (X, ✓, escudo com ! / ✕ / ✓, seta para baixo, setas em círculo, ›, sol, lua). Nada de fonte de ícones nem imagem.

## Components

### Cartão (`.cartao` › `.giro` › `.face.frente` / `.face.verso`)
O objeto do produto. Camada externa recebe o arraste (`perspective: 1400px`, `touch-action: none`); a interna vira (`transform-style: preserve-3d`, `.giro.virado { rotateY(180deg) }` em `.6s cubic-bezier(.3,.7,.2,1)`).
- **Forma:** raio 24px, `inset: 0` na pilha, padding `1.5rem 1.5rem 3.4rem`.
- **Cor:** degradê OKLCH pelo matiz `--h` (ver Colors), luz no canto superior esquerdo, véu no pé; texto `#fff`.
- **Conteúdo da frente:** pílula do tema com ponto de 7px (`.dominio`), o nome do tema em capa tom sobre tom (`::before`), `h2`, `.pergunta`, nota opcional (.76rem, branco 82%), botão de vidro "Me explique melhor".
- **Verso:** rótulo, explicação centrada verticalmente com rolagem fina (`scrollbar-color: rgb(255 255 255 / .4) transparent`), botão de vidro "Voltar à pergunta".
- **Pilha:** `.fundo` em `scale(.95) translateY(12px)` e `.fundo2` em `scale(.90) translateY(24px)`, sem eventos, escurecidos por `brightness`. `.fundo.sobe` volta a `transform: none`.
- **Arraste:** `translate(dx, dy) rotate(dx/18deg)` seguindo o dedo; limiar de decisão `95px`; o de trás segue sem transição (`scale(.95 + .05p) translateY(12(1−p))`). Solto antes do limiar: volta em `transform .2s ease`.
- **Voo:** `.voando { transition: transform .32s cubic-bezier(.2,.7,.3,1), opacity .32s ease-out }`; destino por resposta: concordo `translate(900px, 0) rotate(30deg)`, discordo `(-900px, 0) rotate(-30deg)`, inegociável `(0, -900px)`, não opinar `(0, 900px)`; vindo do arraste, `rotate(dx/12deg)`. Troca de pergunta 300ms depois. Botões e arraste repetem o mesmo voo.
- **Carga do inegociável** (`.carga-cartao b`): o cartão inteiro se enche de baixo para cima em `.8s linear` com degradê `color-mix(… 70%) → 15%` da cor da direção; com movimento reduzido, `steps(6)`.
- **Foco:** `outline: 2px solid var(--ine-vivo); outline-offset: 4px` só em `:focus-visible` (o foco por código não desenha anel).

### Carimbos (`.carimbo.c-sim / .c-nao / .c-ine / .c-pular`)
Uppercase 900 com borda de 4px na cor viva, opacidade proporcional ao arraste (`transition: opacity .1s`), `z-index: 4`. Concordo à esquerda rodado −14°, discordo à direita +14°, inegociável centrado a 42% rodado −6°, não opinar branco no pé (30%). Sombra `drop-shadow` para não sumir num cartão da mesma cor.

### Botões de ação (`.acoes .acao button`)
Cinco círculos brancos (`caixa`) com ícone colorido a 46% do diâmetro (escudos 50%) e borda `1.5px` tingida a 26% da cor. Ordem: Discordo (vermelho) · Inegociável-discordo (escudo ✕, vermelho) · Não opinar (cinza, seta) · Inegociável-concordo (escudo ✓, verde) · Concordo (verde).
- **Hover** (só `hover: hover`): enche da cor, ícone em `sobre`, `scale(1.06)`.
- **Active / carregando:** enche da cor, `scale(.9)`. Transição `transform .14s cubic-bezier(.2,.8,.2,1)`, cor/fundo/borda `.14s ease`.
- **Escudos:** apertar-e-segurar 800ms (`SEGURAR_INE`); quem se enche é o cartão, não o botão, porque o dedo cobre o círculo.
- **Rótulo:** abaixo, .58–.66rem 700 caixa alta `texto-3`.

### Botão principal (`.btn`) e contorno (`.btn.contorno`)
Pílula 800 em .92rem, `padding: .65rem 1.3rem`, texto branco sobre `linear-gradient(135deg, var(--botao1), var(--botao2))`, sombra tingida. Hover `translateY(-1px)` + sombra maior; active `scale(.97)`; `.15s cubic-bezier(.2,.8,.2,1)`. Contorno: `caixa` + `1.5px var(--linha)`, texto `texto`, hover `realce`. Os links/botões do pé do resultado (`.acoes-final`) e "Voltar ao resultado" seguem o contorno em .9rem 700. Botão **Começar** da abertura: branco, texto `botao-coral`, 1.1rem 800, `padding: 1rem 2.6rem`.

### Botão de vidro (`.virar`)
Sobre o cartão: `rgb(255 255 255 / .18)` com borda `1px rgb(255 255 255 / .38)`, pílula, .86rem 700 branco, ícone 15px; hover 28%, active `scale(.96)`.

### Pílula do tema (`.dominio`)
Chip escuro translúcido (`rgb(0 0 0 / .26)`) com ponto branco de 7px, Label caixa alta .72rem/.12em, no topo esquerdo do cartão. É o "nome" do perfil, não um kicker: mostra o domínio do corpus.

### Botão de tema (`.tema`)
Círculo 36px em `realce` com sol/lua 18px em `texto-2`; hover `linha`/`texto`; active `scale(.92)`. Mostra o tema para o qual leva. Persistência: `localStorage["palanq/tema"]` = `"dark" | "light"`; escolher o que o sistema já mostra apaga a chave (sem terceiro estado "auto"). O `<head>` gerado por `build.mjs` aplica `data-theme` antes da primeira pintura.

### Progresso (`.progresso i`)
Trilho 5px `realce`, pílula; preenchimento em degradê de marca que cresce com `transform: scaleX(var(--p))` em `.4s cubic-bezier(.2,.8,.2,1)`.

### Segure para encerrar (`.encerrar`)
Pílula fantasma .8rem 600 `texto-3`; ao segurar (900ms, `SEGURAR`), `.carga` enche `scaleX(0→1)` em `.9s linear` com `nao-vivo` a 24%; soltar antes zera sem transição. Movimento reduzido: `steps(6)`.

### Overlay do inegociável (`.overlay` › `.escolhas button.b-sim / .b-nao`)
Cobre o cartão com `caixa` e a mesma sombra; aqui a cor do tema sai de cena e fala a consequência. Título em `ine`; duas pílulas cheias de raio 18px na cor **texto** da resposta com rótulo 1.05rem 800 + ícone 19px e `small` .8rem 600 a 90% explicando quantas candidaturas elimina; hover `brightness(1.06)`, active `scale(.98)`. Link "voltar" sublinhado `texto-2`.

### Toast (`.dica`)
Fixo a 46% da altura (longe do polegar), `texto` sobre `fundo` invertidos, raio 14px, .88rem 600, `max-width: 18rem`; entra com opacidade + `scale(.96→1)` em `.16s`.

### Seletor de ordenação (`.ordenar`)
Trilho pílula em `realce` com `padding: 4px` e três botões .82rem 600 `texto-3`; a marca deslizante (`.marca-ordem`, `caixa` + `--sombra-botao`) move-se em `left .26s cubic-bezier(.2,.8,.2,1)` — a MESMA lista sendo reordenada. Ativo: `aria-pressed="true"`, 800, `texto`.

### Raia do ranking (`.raia` › `.quem`)
Grade `auto 1fr auto auto`: círculo de posição 42px (`realce`/`texto-2`; 1ª posição em degradê de marca com texto branco), nome 800 com sigla .78rem `texto-3` (líder em `acento`, eliminada em `nao`), contagem .78rem 700 (`nao`, ou `sim` quando `.acordo`), seta › 18px. Barra de 10px: acordo `sim-vivo`, divergência `nao-vivo`, silêncio hachurado. Linha eliminada: opacidade .55 e nome riscado. Divisor `1px var(--linha)`; hover `realce` com raio 16px e seta `translateX(2px)`. Entrada: `subir` (.45s, `translateY(10px)`), escalonada `--i × 45ms`.

### Folha da candidatura (`.painel-fundo` › `.painel`)
Sheet fixo ao pé (raio `24px 24px 0 0`, puxador 40×4px `linha`, `max-height: min(92dvh, 100%)`) que sobe `translateY(24px→0)` em `.28s cubic-bezier(.2,.8,.2,1)` enquanto o escurecedor a 50% surge em `.2s`; em ≥720px vira caixa centrada. Cabeçalho pegajoso com posição, nome 1.2rem 800, barra de 10px e contagem. Corpo com grupos tingidos a 5% (`d` vermelho / `a` verde) e títulos pegajosos em Label .74rem/.1em sobre fundo opaco a 11% da cor; itens separados por `1px` tingido a 15%; citação .92rem/1.6 `texto-2` com filete esquerdo `linha`; fonte .74rem `texto-3`; link "ver plano" em `acento`. Fechar: círculo 2.3rem `realce`.

### Aviso (`.aviso`, `.aviso.afinar`) e nota (`.nota`, `.nota.perigo`)
Aviso: superfície `realce` com raio 20px, `padding: 1.1rem 1.2rem`, um `.btn` dentro; variante `afinar` tingida a 9% do coral com título em `acento`. Nota: texto solto sem caixa — o título faz o trabalho; `perigo` só muda o `h3` para `nao`.

### Abertura (`.tela.abertura`)
Tela inteira no degradê de marca (`160deg`), véu preto a 22% no pé, coluna `max-width: 30rem` centrada: nome em Display branco com o ícone (check em coral via `--marca-check`), slogan `clamp(1.3rem, 5.4vw, 1.55rem)` 700 `max-width: 20ch`, meta .9rem a 92%, botão Começar branco, link "recomeçar" sublinhado a 90%. Foco visível em branco.

## Do's and Don'ts

### Do:
- **Do** deixar a cor do tema ocupar o cartão inteiro e manter tudo ao redor neutro; a única outra cor na tela é o degradê da marca.
- **Do** variar apenas `--h` entre cartões; L e C vêm dos tokens (`.55/.40/.13` claro, `.50/.34/.12` escuro).
- **Do** usar a cor "texto" para letra miúda e a "viva" para ícone, carimbo e barra; sobre preenchimento vivo, texto e ícone em `sobre`.
- **Do** repetir o mesmo voo (`.32s cubic-bezier(.2,.7,.3,1)`, ±900px, ±30°) para botão e arraste; a troca de pergunta é consequência visível do gesto.
- **Do** honrar `prefers-reduced-motion`: transições de posição desligadas, cargas em `steps(6)`, raias sem animação.
- **Do** manter alvos de toque ≥44px (menor botão redondo 44px, botão de tema 36px na barra de 44px), foco `2px solid var(--ine-vivo)` com `outline-offset`, e o tema escuro como recalibração de luminosidade, não inversão.
- **Do** manter zero requisição de rede: CSP `default-src 'none'; img-src data:; font-src data:`, fonte em base64, ícones inline.

### Don't:
- **Don't** trocar Figtree por outra família nem carregar nada externo; hierarquia é por peso e tracking.
- **Don't** pintar os escudos de azul: o azul (`ine`) é para o título do overlay, a legenda e o carimbo; os botões seguem a cor da direção.
- **Don't** pôr sombra em superfície de página (aviso, seletor, raia, grupo) nem usar sombra dura/deslocada sólida; profundidade em superfície é por tom.
- **Don't** usar o degradê vivo (`marca-*`) como fundo de texto branco; use `botao-*`.
- **Don't** reintroduzir o questionário de papel do `/motor` (fundo creme, filetes, caixas de aviso, cor de link azul) na tela de cartões.
- **Don't** transformar a barra de silêncio em cinza chapado: o silêncio é hachura, e é o argumento do produto.

---

### Superfície secundária: `/motor` (`src/estilo.css`)

Ainda não trazida para este mundo. Compartilha apenas Figtree embutida, o mecanismo de tema (`:root[data-theme="dark"]` por escolha manual (claro é o padrão), chave `palanq/tema`) e o rodapé. Seus tokens são de outro mundo — ground creme `#fbfaf8`, texto quente `#1a1a19`, acento azul `#1f4f7a`, `--ok/--alerta/--perigo` com `--perigo-bg`, títulos em 650 — e não devem migrar para a tela de cartões nem servir de referência para superfícies novas. Quando o `/motor` for redesenhado, este arquivo é a régua.
