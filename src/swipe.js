/**
 * Palanq — versão de cartões.
 *
 * Mesmo motor, mesmas perguntas, mesma ordem. O que muda é só a forma de
 * responder e o que a tela mostra: aqui não se explica por que a pergunta veio
 * agora, não se mostra quem está a favor ou contra, e o resultado é um gráfico
 * em vez de números.
 *
 * Arrastar: → concordo · ← discordo · ↑ inegociável (pergunta o lado) · ↓ não opinar.
 * Os quatro botões abaixo do cartão fazem o mesmo, e as setas do teclado também.
 */
const CHAVE_S = "palanq/cards/v1";
const appEl = document.getElementById("app");

const Z = {
  tela: "abertura",
  respostas: {},
  linhasVermelhas: [],
  pedindoLado: false,
  virado: false,
  // O usuário pediu para ir além da parada antecipada: daí em diante só encerra
  // quando as perguntas acabarem de verdade.
  continuar: false,
  // Fase extra: os temas que não separam candidaturas. Não entram no ranking
  // (§20 — incluí-los inverteria a ordem em favor de quem escreveu menos), mas
  // multiplicam o que dá para saber sobre cada plano.
  extra: false,
  aberto: null,   // candidatura expandida no resultado
  encerrado: false,   // o leitor pediu para ver o resultado antes da hora
  ordenar: "afinidade",   // afinidade | concordancia | discordancia
  margem: 0.05,
};

/**
 * Um matiz por tema, no círculo OKLCH (0 rosa · 30 vermelho · 60 laranja · 90 ouro ·
 * 145 verde · 200 ciano · 250 azul · 300 roxo · 330 magenta). Luminosidade e croma
 * ficam por conta do CSS, iguais para todos: em OKLCH isso quer dizer que as 21
 * cores pesam o mesmo na tela e o texto branco passa em todas — em HSL o amarelo
 * saía claro demais e o azul escuro demais com os mesmos números. Temas vizinhos no
 * assunto ficam vizinhos no círculo.
 */
const MATIZ = {
  economia: 245, tributacao: 235, fiscal: 225, orcamento: 215,
  trabalho: 55, previdencia: 70, social: 5, federativo: 258,
  saude: 175, ambiental: 150, agrario: 130, energia: 90,
  educacao: 300, tecnologia: 285, comunicacao: 320,
  seguranca: 30, justica: 268, politica: 275, estado: 252,
  externa: 262, transporte: 200,
};
const matizDe = (d) => MATIZ[d] ?? 250;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const cand_ = (id) => CORPUS.candidatos.find((c) => c.id === id);
const nomeC = (id) => { const c = cand_(id); return c ? c.nome : id; };
const siglaC = (id) => cand_(id)?.partido || "";
/** "A" · "A e B" · "A, B e C" — join(" e ") produzia "A e B e C". */
const lista = (xs) => xs.length < 2 ? (xs[0] ?? "")
  : `${xs.slice(0, -1).join(", ")} e ${xs[xs.length - 1]}`;

const olhar = () => analisar(CORPUS, Z.respostas, new Set(Z.linhasVermelhas), { margem: Z.margem });
const proxima = (a) => proximaPergunta(CORPUS, Z.respostas, a.estados,
  { linhasVermelhas: new Set(Z.linhasVermelhas), margem: Z.margem,
    complementar: Z.extra, pularPortoes: true });

/**
 * Fase 1 são os temas em disputa — os que decidem o ranking. Fase 4 são os que não
 * separam ninguém e só entram quando o usuário pede. Portões e contrastes (fases 2
 * e 3) não aparecem nesta versão.
 */
function pergunta(a) {
  const q = proxima(a);
  if (!q || q.tipo !== "eixo") return null;
  return q.fase === 1 || (Z.extra && q.fase === 4) ? q : null;
}
/**
 * Os cartões de trás são as perguntas que vêm DE FATO a seguir — o motor escolhe
 * por ganho, não pela ordem do corpus, então isto simula a resposta e pergunta ao
 * motor o que viria. Sem isto o cartão que subia era substituído por outro no
 * redesenho: o "pisca" relatado. Na hora de desenhar a resposta ainda não existe
 * e vale "não opinar"; um inegociável elimina candidaturas e muda a ordem, então
 * `voarCartao` refaz a pilha com a resposta real antes de o cartão sair.
 */
function seguintesDe(q, n = 2, valor = "indiferente", inegociavel = false) {
  const fila = [];
  const respostas = { ...Z.respostas, [q.id]: valor };
  const lv = new Set(Z.linhasVermelhas);
  if (inegociavel) lv.add(q.id);
  while (fila.length < n) {
    const a = analisar(CORPUS, respostas, lv, { margem: Z.margem });
    const p = proximaPergunta(CORPUS, respostas, a.estados,
      { linhasVermelhas: lv, margem: Z.margem, complementar: Z.extra, pularPortoes: true });
    if (!p || p.tipo !== "eixo" || !(p.fase === 1 || (Z.extra && p.fase === 4))) break;
    fila.push(CORPUS.eixos[p.id]);
    respostas[p.id] = "indiferente";
  }
  return fila;
}
/**
 * Pisos de produto para aceitar a parada antecipada. A garantia do motor é sobre
 * matemática — ninguém mais consegue ultrapassar quem lidera — e pode chegar com 5
 * respostas; encerrar ali é correto e ruim: o resultado fica apoiado em pouca coisa
 * e o gráfico sai quase todo hachurado. Por isso os pisos moram aqui e não em
 * `decisaoEstavel()`.
 *
 *   MINIMO        quantidade mínima de perguntas respondidas.
 *   MINIMO_TEMAS  quantidade mínima de temas distintos tocados, para o resultado não
 *                 sair de um punhado de perguntas todas do mesmo assunto.
 *
 * Os dois são limitados pelo que de fato existe: marcar um tema como inegociável
 * elimina candidaturas, e isso pode encolher o questionário para menos de dez
 * perguntas (§20). Sem esse teto, o app nunca chegaria ao resultado nesses casos.
 *
 * Medido na ordem atual, sem eliminações: o oitavo tema distinto aparece na nona
 * pergunta, então quem manda de fato é o piso de dez. `MINIMO_TEMAS` age como rede
 * de proteção — se o corpus mudar e a ordem passar a agrupar assuntos, ele segura.
 */
const MINIMO = 10;
const MINIMO_TEMAS = 8;
function acabou(a) {
  if (Z.encerrado) return true;
  if (!pergunta(a)) return true;                 // acabaram as perguntas
  if (Z.continuar || Z.extra) return false;      // o usuário pediu para responder o resto
  if (!a.decisao.estavel) return false;          // ainda dá para mudar quem lidera
  const div = a.classes.divisivos;
  const feitas = div.filter((d) => Z.respostas[d.eixo] !== undefined);
  const temaDe = (d) => CORPUS.eixos[d.eixo].dominio;
  const tocados = new Set(feitas.map(temaDe)).size;
  const existentes = new Set(div.map(temaDe)).size;
  return feitas.length >= Math.min(MINIMO, div.length) &&
         tocados >= Math.min(MINIMO_TEMAS, existentes);
}

/** As três leituras do mesmo gráfico. A primeira é o ranking; as outras são vistas. */
const ORDENS = [
  { id: "afinidade", rotulo: "Afinidade" },
  { id: "concordancia", rotulo: "Concordância" },
  { id: "discordancia", rotulo: "Discordância" },
];

function gravar() {
  try { localStorage.setItem(CHAVE_S, JSON.stringify({ v: 1, cv: CORPUS.corpusVersion, ...Z })); } catch {}
}
function recuperar() {
  try {
    const d = JSON.parse(localStorage.getItem(CHAVE_S) || "null");
    if (!d || d.cv !== CORPUS.corpusVersion) return false;
    Object.assign(Z, { tela: d.tela, respostas: d.respostas || {},
                       linhasVermelhas: d.linhasVermelhas || [],
                       continuar: !!d.continuar, extra: !!d.extra,
                       encerrado: !!d.encerrado,
                       ordenar: ORDENS.some((o) => o.id === d.ordenar) ? d.ordenar : "afinidade" });
    Z.pedindoLado = false;
    return Object.keys(Z.respostas).length > 0;
  } catch { return false; }
}
function recomecar() {
  Object.assign(Z, { tela: "abertura", respostas: {}, linhasVermelhas: [], pedindoLado: false,
                     virado: false, continuar: false, extra: false, aberto: null,
                     encerrado: false, ordenar: "afinidade" });
  try { localStorage.removeItem(CHAVE_S); } catch {}
  desenhar();
}

// ── ícones ───────────────────────────────────────────────────────────────────
const SVG = (d, extra = "") =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}${extra}</svg>`;
const ICONE = {
  // X — discordo
  nao: SVG('<path d="M18 6 6 18M6 6l12 12"/>'),
  // ✓ — concordo
  sim: SVG('<path d="M20 6 9 17l-5-5"/>'),
  // escudo com "!" — inegociável sem lado (só o arraste para cima usa)
  ine: SVG('<path d="M12 3 4 6v6c0 4.5 3.2 8.3 8 9 4.8-.7 8-4.5 8-9V6l-8-3Z"/><path d="M12 8.5v4"/><circle cx="12" cy="15.6" r=".9" fill="currentColor" stroke="none"/>'),
  // escudo com ✕ — discordo e é inegociável
  ineNao: SVG('<path d="M12 3 4 6v6c0 4.5 3.2 8.3 8 9 4.8-.7 8-4.5 8-9V6l-8-3Z"/><path d="M14.4 9.6 9.6 14.4M9.6 9.6l4.8 4.8"/>'),
  // escudo com ✓ — concordo e é inegociável
  ineSim: SVG('<path d="M12 3 4 6v6c0 4.5 3.2 8.3 8 9 4.8-.7 8-4.5 8-9V6l-8-3Z"/><path d="M15.3 10.1 11 14.4l-2.3-2.3"/>'),
  // seta para baixo — não opinar
  pular: SVG('<path d="M12 5v13M6 13l6 6 6-6"/>'),
  // setas em círculo — virar o cartão
  // ✕ — fechar o painel de uma candidatura
  fechar: SVG('<path d="M18 6 6 18M6 6l12 12"/>'),
  virar: SVG('<path d="M3 11a9 9 0 0 1 15-6.7L21 7"/><path d="M21 3v4h-4"/><path d="M21 13a9 9 0 0 1-15 6.7L3 17"/><path d="M3 21v-4h4"/>'),
  // › — abrir a folha de uma candidatura
  abrir: SVG('<path d="m9 6 6 6-6 6"/>'),
  // sol e lua — o botão de tema mostra o tema para o qual ele leva
  sol: SVG('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  lua: SVG('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>'),
};
/** A marca: dois cartões, o de trás inclinado — a pilha que a pessoa vai deslizar. */
const MARCA = `<svg viewBox="0 0 24 24" aria-hidden="true">
  <rect x="7.5" y="2.6" width="12" height="16" rx="3" fill="currentColor" opacity=".38"
        transform="rotate(14 13.5 10.6)"/>
  <rect x="4" y="5" width="12" height="16" rx="3" fill="currentColor"/>
  <path d="m7.4 13.2 1.9 1.9 3.6-3.8" fill="none" stroke="var(--marca-check, #fff)" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// ── tema claro / escuro ──────────────────────────────────────────────────────
// Claro por padrão. O botão liga o escuro e a escolha fica no aparelho; o script
// no <head> (build) aplica-a antes da primeira pintura para a página não piscar.
const CHAVE_T = "palanq/tema";
const temaAtual = () => document.documentElement.dataset.theme === "dark" ? "dark" : "light";
function alternarTema() {
  const escuro = temaAtual() !== "dark";
  if (escuro) document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;
  try { escuro ? localStorage.setItem(CHAVE_T, "dark") : localStorage.removeItem(CHAVE_T); } catch {}
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = escuro ? "#111418" : "#ffffff";
  const b = document.querySelector(".tema");
  if (b) { b.innerHTML = escuro ? ICONE.sol : ICONE.lua; b.setAttribute("aria-label", rotuloTema()); }
}
const rotuloTema = () => temaAtual() === "dark" ? "Mudar para o tema claro" : "Mudar para o tema escuro";
const botaoTema = () => `<button class="tema" data-ir="tema" type="button" aria-label="${rotuloTema()}">${
  temaAtual() === "dark" ? ICONE.sol : ICONE.lua}</button>`;
const marca = () => `<span class="marca">${MARCA}<span>Palanq</span></span>`;

// ── responder ────────────────────────────────────────────────────────────────
const LADO = { sim: [900, 0, 30], nao: [-900, 0, -30], ine: [0, -900, 0], pular: [0, 900, 0] };

/**
 * Manda o cartão embora na direção da resposta e só então troca de pergunta.
 * Os botões precisam disto tanto quanto o arraste: sem a saída, o cartão apenas
 * sumia e a troca não se lia como consequência do que a pessoa acabou de tocar.
 * `dx`/`dy` carregam o deslocamento do gesto quando a origem é o arraste — é o que
 * dá ao cartão a inclinação de quem foi empurrado, e não a de quem foi teleportado.
 */
function voarCartao(dir, aoFim, dx = 0, dy = 0, resposta = null) {
  const el = document.getElementById("topo");
  if (!el || el.dataset.voando) { aoFim(); return; }
  el.dataset.voando = "1";   // dois toques rápidos não podem responder duas vezes
  // Um inegociável elimina candidaturas e muda quem vem a seguir: a pilha de trás
  // foi desenhada supondo "não opinar", então refaz-se aqui com a resposta real.
  if (resposta?.inegociavel) {
    const q = pergunta(olhar());
    if (q) {
      const atual = document.querySelector(".cartao.fundo");
      const novos = seguintesDe(q, 2, resposta.valor, true);
      if ((atual?.querySelector("h2")?.textContent ?? "") !== (novos[0]?.label ?? "")) {
        for (const f of document.querySelectorAll(".cartao.fundo, .cartao.fundo2")) f.remove();
        el.insertAdjacentHTML("beforebegin", fundoHTML(novos));
        void el.offsetWidth;   // o novo de trás tem de ser registrado em escala .95 para subir animado
      }
    }
  }
  const carimbo = el.querySelector(".c-" + dir);
  if (carimbo) carimbo.style.opacity = "1";
  const [x, y, giro] = LADO[dir];
  const toque = !dx && !dy;   // botão ou teclado: o cartão parte do zero, sem o impulso do gesto
  el.classList.add("voando", toque ? "toque" : "gesto");
  // Uma transição só anima se o navegador tiver registrado o valor inicial num
  // recálculo anterior. Vindo do arraste ele existe (o `pointermove` já escreveu
  // transform); vindo de um clique, não — e o cartão saltava direto para fora da
  // tela, que era exatamente o "ele só some" relatado.
  void el.offsetWidth;
  el.style.transform = `translate(${x || dx}px, ${y || dy}px) rotate(${dx ? dx / 12 : giro}deg)`;
  el.style.opacity = "0";
  // O de trás sobe para o lugar enquanto o da frente sai: quando a tela redesenha,
  // ele já está onde o novo cartão da frente vai ficar, e a troca não dá salto.
  const fundo = document.querySelector(".cartao.fundo");
  if (fundo) { fundo.classList.add("sobe"); if (toque) fundo.classList.add("lento"); }
  setTimeout(aoFim, toque ? 600 : 440);
}

/** Direção da saída a partir da resposta. Inegociável sai por cima, como o gesto. */
const direcaoDe = (valor, inegociavel) =>
  inegociavel ? "ine"
  : valor === "concordo" ? "sim"
  : valor === "discordo" ? "nao" : "pular";

function responderCartao(valor, inegociavel = false) {
  const a = olhar();
  const q = pergunta(a);
  if (!q) return;
  Z.respostas = { ...Z.respostas, [q.id]: valor };
  const lv = new Set(Z.linhasVermelhas);
  if (inegociavel) lv.add(q.id); else lv.delete(q.id);
  Z.linhasVermelhas = [...lv];
  Z.pedindoLado = false;
  Z.virado = false;
  if (acabou(olhar())) Z.tela = "resultado";
  gravar();
  desenhar();
}

// ── cartão ───────────────────────────────────────────────────────────────────
const frenteCartao = (e) => `
    <div class="face frente" data-dominio="${esc(e.dominio || "")}">
      <div class="dominio"><i></i>${esc(e.dominio || "")}</div>
      <h2>${esc(e.label)}</h2>
      <div class="pergunta">${esc(e.pergunta)}</div>
      ${e.formulacaoNeutra === false
        ? '<div class="nota">Não foi possível escrever esta pergunta sem carga. Leia com isso em mente.</div>'
        : ""}
      <button class="virar" data-ir="virar">${ICONE.virar} Me explique melhor</button>
    </div>`;
const versoCartao = (e) => `
    <div class="face verso">
      <h2 class="rotulo">O que isso quer dizer</h2>
      <div class="explicacao">${esc(e.explicacao || "")}</div>
      <button class="virar" data-ir="virar">${ICONE.virar} Voltar à pergunta</button>
    </div>`;
// Os de trás mostram a frente inteira, botão incluído: se faltasse algo, o texto
// subiria para ocupar o espaço quando o cartão chegasse à frente — um pisca.
const corpo = (e, principal) => `<div class="giro${principal && Z.virado ? " virado" : ""}">${frenteCartao(e)}${principal ? versoCartao(e) : ""}</div>`;
const tema = (e) => `style="--h:${matizDe(e.dominio)}"`;
/** Os cartões de trás, do mais fundo para o mais próximo (ordem de pintura). */
const fundoHTML = (seguintes) => seguintes
  .map((e, i) => `<article class="cartao fundo${i ? "2" : ""}" ${tema(e)} aria-hidden="true">${corpo(e, false)}</article>`)
  .reverse().join("");

// ── telas ────────────────────────────────────────────────────────────────────
function telaAbertura() {
  const retomar = Object.keys(Z.respostas).length > 0;
  return `<div class="abertura-in">
    <h1 class="marca">${MARCA}<span>Palanq</span></h1>
    <p class="slogan">No papel, qual candidato combina com você?</p>
    <p class="meta">${CORPUS.escopo.eleicao} · ${CORPUS.escopo.cargo}</p>
    <div class="nota">
      <h3>Essa não é uma recomendação de voto</h3>
      <p class="mini" style="margin:0">Comparamos o que você responde com o que está escrito nos planos
      de governo registrados. Não entra aqui nada sobre histórico, capacidade de executar, coalizão ou
      financiamento de campanha.</p>
    </div>
    <button class="comecar" data-ir="cartoes">${retomar ? "Continuar" : "Começar"}</button>
    ${retomar ? '<button class="recomecar" data-ir="recomecar">Recomeçar do zero</button>' : ""}
  </div>`;
}

function telaCartoes() {
  const a = olhar();
  const q = pergunta(a);
  if (!q) { Z.tela = "resultado"; return telaResultado(); }

  const divisivos = a.classes.divisivos;
  const feitas = divisivos.filter((d) => Z.respostas[d.eixo] !== undefined).length;
  const faltam = divisivos.length - feitas;
  // Eliminar candidaturas encurta o questionário (§20), então o total muda no meio
  // do caminho. Mostrar quantas faltam em vez de "x de y" evita que isso pareça bug.
  const pct = Math.round((feitas / Math.max(feitas + faltam, 1)) * 100);
  const seguintes = seguintesDe(q);   // os dois que vêm a seguir, na ordem do motor

  // A palavra "inegociável" não diz o que o botão faz; o número de candidaturas que
  // sairiam diz. Fase 1 separa os dois lados; na fase 4 só um lado tem plano escrito,
  // então um dos lados não derruba ninguém.
  const elimina = q.fase === 4
    ? (q.campo.postura === "favor"
        ? { concordo: 0, discordo: q.campo.nFalam }
        : { concordo: q.campo.nFalam, discordo: 0 })
    : { concordo: q.separa.contra, discordo: q.separa.favor };
  const custo = (n, lado) => n === 0
    ? `Não elimina ninguém: nenhum plano se posiciona ${lado}`
    : `Elimina ${n} candidatura${n > 1 ? "s" : ""} que ${n > 1 ? "estão" : "está"} ${lado}`;

  return `
  <div class="barra-topo">
    ${marca()}
    <div class="progresso" aria-hidden="true"><i style="--p:${pct / 100}"></i></div>
    <span class="mini">${faltam ? `faltam ${faltam}` : "última"}</span>
    ${botaoTema()}
  </div>

  <div class="pilha">
    ${fundoHTML(seguintes)}
    <article class="cartao" id="topo" tabindex="0" aria-live="polite" ${tema(q)}
             aria-label="${esc(e_label(q))}">
      <span class="carimbo c-sim">Concordo</span>
      <span class="carimbo c-nao">Discordo</span>
      <span class="carimbo c-ine">Inegociável</span>
      <span class="carimbo c-pular">Não opinar</span>
      <i class="carga-cartao" aria-hidden="true"><b></b></i>
      ${corpo(q, true)}
      ${Z.pedindoLado ? `<div class="overlay">
        <div class="dominio"><i></i>${esc(q.dominio || "")}</div>
        <h2>${esc(q.label)}</h2>
        <div class="pergunta">${esc(q.pergunta)}</div>
        <h3>Inegociável: de que lado?</h3>
        <div class="escolhas">
          <button class="b-sim" data-resp="concordo" data-ine="1">
            <span class="rot">${ICONE.sim}Concordo!</span>
            <small>${custo(elimina.concordo, "contra")}</small></button>
          <button class="b-nao" data-resp="discordo" data-ine="1">
            <span class="rot">${ICONE.nao}Discordo!</span>
            <small>${custo(elimina.discordo, "a favor")}</small></button>
        </div>
        <button class="voltar" data-ir="cancelar-lado">voltar</button>
      </div>` : ""}
    </article>
  </div>

  <div class="acoes">
    <div class="acao"><button class="b-nao" data-resp="discordo" aria-label="Discordo">${ICONE.nao}</button>
      <span>Discordo</span></div>
    <div class="acao"><button class="b-ine-nao" data-segurar="discordo"
      aria-label="Segure para marcar: discordo, e é inegociável — elimina quem for a favor"
      >${ICONE.ineNao}</button>
      <span>Não, inegociável</span></div>
    <div class="acao"><button class="b-pular" data-resp="indiferente" aria-label="Não opinar">${ICONE.pular}</button>
      <span>Não opinar</span></div>
    <div class="acao"><button class="b-ine-sim" data-segurar="concordo"
      aria-label="Segure para marcar: concordo, e é inegociável — elimina quem for contra"
      >${ICONE.ineSim}</button>
      <span>Sim, inegociável</span></div>
    <div class="acao"><button class="b-sim" data-resp="concordo" aria-label="Concordo">${ICONE.sim}</button>
      <span>Concordo</span></div>
  </div>
  ${Z.linhasVermelhas.length ? "" : `<p class="legenda-ine"><b>Inegociável descarta quem pensa
    diferente.</b></p>`}

  <button class="encerrar" id="encerrar" type="button">
    <i class="carga" aria-hidden="true"></i>
    <span>Segure para encerrar agora</span>
  </button>`;
}
const e_label = (q) => `${q.label}. ${q.pergunta}`;

function telaResultado() {
  const a = olhar();
  const est = a.estados;
  // Todas as barras têm o mesmo comprimento: o peso que você respondeu. O que muda
  // é a divisão entre concordância, divergência e silêncio — e o silêncio aparece.
  const totalPeso = Math.max(...CORPUS.candidatos.map((c) => est[c.id].pesoRespondido), 1);
  const peso = (ids) => ids.reduce((n, e) => n + CORPUS.eixos[e].peso, 0);

  // O ranking é por afinidade — as outras duas ordens são VISÕES do mesmo gráfico,
  // não rankings alternativos, e por isso não recebem numeração. Ordenar por
  // concordância premiaria quem escreveu mais; por discordância, um "1º lugar"
  // significaria o oposto de vencer. A ordinal fica só onde ela quer dizer algo.
  const vivos = [...a.ranking.ordem, ...a.ranking.semSinal];
  const chave = {
    afinidade: (id) => est[id].afinidade ?? -1,
    concordancia: (id) => peso(est[id].alinhados),
    discordancia: (id) => peso(est[id].divergentes),
  }[Z.ordenar] || ((id) => est[id].afinidade ?? -1);
  // Ordena pelo PESO (é o que a barra desenha) e desempata pela CONTAGEM (é o que o
  // rótulo diz). Medido em 6.000 listas simuladas: zero inversões estritas entre os
  // dois, e as 82 aparentes eram empates de peso — que este desempate resolve. Sem
  // ele, a lista mostraria "5 concordâncias" acima de "6".
  const contagem = {
    concordancia: (id) => est[id].alinhados.length + est[id].complementar.alinhados.length,
    discordancia: (id) => est[id].divergentes.length + est[id].complementar.divergentes.length,
  }[Z.ordenar] || (() => 0);
  const emOrdem = Z.ordenar === "afinidade" ? vivos : [...vivos].sort(
    (x, y) => chave(y) - chave(x) || contagem(y) - contagem(x) ||
              (est[y].afinidade ?? -1) - (est[x].afinidade ?? -1) || x.localeCompare(y));
  const ordem = [...emOrdem,
                 ...CORPUS.candidatos.filter((c) => est[c.id].estado === "eliminado").map((c) => c.id)];

  // Posição explícita, com o MESMO número para quem empata. Sem isto o leitor lê o
  // comprimento do verde como se fosse a ordem — e ele não é: a barra mostra
  // verde/total, enquanto o ranking compara verde com vermelho e ignora o hachurado.
  // Duas candidaturas podem ter a mesma afinidade com barras bem diferentes.
  const posicao = posicoes(a);

  const raia = (id, i) => {
    const s = est[id];
    const morto = s.estado === "eliminado";
    const lider = a.ranking.lideres.includes(id);
    const A = peso(s.alinhados), D = peso(s.divergentes), S = peso(s.silencios);
    const p = (x) => (x / totalPeso) * 100;
    const nDiv = s.divergentes.length + s.complementar.divergentes.length;
    const nAli = s.alinhados.length + s.complementar.alinhados.length;
    return `<div class="raia ${lider ? "topo" : ""} ${morto ? "morta" : ""}" style="--i:${i}">
      <button class="quem" data-ir="abrir" data-quem="${id}" aria-haspopup="dialog">
        ${Z.ordenar === "afinidade"
          ? `<span class="pos">${morto ? "×" : posicao[id] ? posicao[id] + "º" : "—"}</span>`
          : `<span class="pos">${morto ? "×" : "·"}</span>`}
        <span class="nome"><b>${esc(nomeC(id))}</b>${siglaC(id) ? `<em>${esc(siglaC(id))}</em>` : ""}
        ${lider ? '<em class="lider">mais alinhado</em>' : ""}
        ${morto ? '<em class="fora">fora — inegociável</em>' : ""}</span>
        <span class="conta ${Z.ordenar === "concordancia" ? "acordo" : ""}">${
          Z.ordenar === "concordancia"
            ? (nAli ? `${nAli} concordância${nAli > 1 ? "s" : ""}` : "")
            : (nDiv ? `${nDiv} divergência${nDiv > 1 ? "s" : ""}` : "")}</span>
        <span class="seta" aria-hidden="true">${ICONE.abrir}</span>
        <span class="barra" role="img" aria-label="${A ? "concorda em parte" : ""}">
          <i class="a" style="width:${p(A)}%"></i><i class="d" style="width:${p(D)}%"></i><i class="s" style="width:${p(S)}%"></i>
        </span>
      </button></div>`;
  };

  const lideres = a.ranking.lideres;
  const pesoDe = (ids) => ids.reduce((n, e) => n + CORPUS.eixos[e].peso, 0);
  // Líderes empatados cujas barras ficam bem diferentes — o caso que faz o leitor
  // achar que o ranking está errado.
  const desigual = Z.ordenar === "afinidade" && lideres.length > 1 &&
    Math.max(...lideres.map((x) => est[x].cobertura ?? 0)) -
    Math.min(...lideres.map((x) => est[x].cobertura ?? 0)) > 0.25 ? lideres : [];
  // Um líder que "venceu" mais por silêncio do que por concordância. É o desfecho
  // que o gráfico já denuncia; o título não pode dizer outra coisa.
  const calado = (id) => pesoDe(est[id].silencios) > pesoDe(est[id].alinhados);
  const caladosNoTopo = lideres.filter(calado);
  const respondidas = Object.keys(Z.respostas).length;
  const faltam = a.classes.divisivos.filter((d) => Z.respostas[d.eixo] === undefined).length;
  const extraFaltam = [...a.classes.unilaterais, ...a.classes.unanimes]
    .filter((u) => Z.respostas[u.eixo] === undefined).length;

  const iOrdem = Math.max(0, ORDENS.findIndex((o) => o.id === Z.ordenar));
  return `
  <div class="barra-topo">${marca()}<span style="flex:1"></span>${botaoTema()}</div>
  <h1>Seu resultado</h1>

  <div class="ordenar" role="group" aria-label="Ordenar candidaturas por">
    <i class="marca-ordem" style="left:${(iOrdem * 100) / ORDENS.length}%;width:${100 / ORDENS.length}%"></i>
    ${ORDENS.map((o) => `<button data-ir="ordenar" data-por="${o.id}"
      aria-pressed="${Z.ordenar === o.id}">${o.rotulo}</button>`).join("")}
  </div>

  ${Z.encerrado ? `<div class="nota">
    <h3>Você encerrou antes do fim</h3>
    <p class="mini" style="margin:0">${a.decisao.estavel
      ? `Com as ${respondidas} respostas que você deu, ninguém de fora chega ao topo. ${lideres.length > 1
          ? "Mas o empate lá em cima ainda se desfaz se você continuar."
          : "O resto da ordem, porém, ainda muda."}`
      : `São ${respondidas} resposta${respondidas > 1 ? "s" : ""}, e isso ainda não basta para fechar
         a comparação: a ordem pode mudar, <b>inclusive no topo</b>.`}
    Nada se perdeu — dá para continuar de onde parou.</p>
  </div>` : ""}

  <p class="mini" style="text-align:center">Toque em uma candidatura para abrir onde vocês concordam e divergem.</p>
  <div class="chave">
    <span><i style="background:var(--sim)"></i>vocês concordam</span>
    <span><i style="background:var(--nao)"></i>vocês divergem</span>
    <span><i class="s"></i>o plano não fala disso</span>
  </div>
  <div class="grafico">${ordem.map(raia).join("")}</div>

  <p class="mini" style="margin-top:1.2rem">Todas as barras têm o mesmo tamanho: o que muda é quanto
  de cada cor. Muito hachurado quer dizer que aquele plano <b>não trata</b> dos temas que você respondeu —
  e não que ele concorde com você.</p>
  ${desigual.length > 1 ? `<p class="mini"><b>Por que ${lista(desigual.map((x) => esc(nomeC(x))))}
  empatam, se as barras são tão diferentes?</b> A posição compara o verde com o vermelho e ignora o
  hachurado: ${desigual.length > 2 ? "nenhum deles diverge" : "nenhum dos dois diverge"} de você naquilo que
  declarou. O que muda é o tamanho do plano — quem escreveu sobre mais temas tem menos hachurado.</p>` : ""}
  ${faltam ? `<div class="aviso afinar">
    <h3>Ainda dá para afinar</h3>
    <p class="mini" style="margin:0 0 .7rem">${Z.encerrado
      ? "Você pediu para ver o resultado agora."
      : "Paramos porque quem está no topo já não muda."} ${
      faltam === 1 ? "Um tema continua" : `${faltam} temas continuam`} sem resposta, e a ordem de quem vem
    depois ainda vai mudar${caladosNoTopo.length ? " — inclusive o tanto de hachurado no topo" : ""}.</p>
    <button class="btn" data-ir="continuar">${
      faltam === 1 ? "Responder o último" : `Responder os ${faltam} restantes`}</button>
  </div>` : ""}

  ${extraFaltam && !faltam ? `<div class="aviso">
    <h3>Conhecer melhor cada candidatura</h3>
    <p class="mini" style="margin:0 0 .7rem">Há ${extraFaltam} tema(s) em que as candidaturas não
    divergem entre si — por isso não entram no ranking: responder não mexe nas barras acima. Mas é onde
    você pode descobrir que discorda de quem pretende apoiar: responder todos multiplica por
    ${(214 / 130).toFixed(1)} o que dá para saber sobre cada plano. A exceção é o escudo: marcar um tema
    como inegociável elimina quem pensa diferente em qualquer fase, e isso muda, sim, o resultado.</p>
    <button class="btn contorno" data-ir="extra">Responder esses ${extraFaltam} temas</button>
  </div>` : ""}

  <div class="nota perigo" style="margin-top:1.2rem">
    <h3>Isto não é uma recomendação de voto</h3>
    <p class="mini" style="margin:0">É a comparação entre o que você respondeu e o que está escrito nos
    planos. Leia os documentos antes de decidir.</p>
  </div>

  <h3 class="secao">Planos de governo</h3>
  <div class="planos">${CORPUS.candidatos.map((c) => `<a href="${esc(c.planoUrl)}" target="_blank"
     rel="noopener noreferrer"><span>${esc(c.nome)}${c.partido ? ` (${esc(c.partido)})` : ""}</span>
     <span>ler →</span></a>`).join("")}</div>

  <div class="acoes-final">
    <button data-ir="recomecar">Recomeçar</button>
    <a href="motor/">Ver a versão completa</a>
  </div>`;
}

/** Vira sem redesenhar: assim a transição 3D acontece de verdade. */
function virarCartao() {
  Z.virado = !Z.virado;
  const g = document.querySelector("#topo .giro");
  if (g) g.classList.toggle("virado", Z.virado);
  else desenhar();
}

// ── render ───────────────────────────────────────────────────────────────────
function desenhar() {
  fecharPainel();
  appEl.innerHTML = Z.tela === "abertura" ? telaAbertura()
                  : Z.tela === "resultado" ? telaResultado()
                  : telaCartoes();
  appEl.classList.toggle("abertura", Z.tela === "abertura");
  appEl.dataset.tela = Z.tela;
  if (Z.tela === "cartoes") { ligarArraste(); ligarSeguradores(); }
  window.scrollTo({ top: 0 });
}

// ── arraste ──────────────────────────────────────────────────────────────────
const LIMIAR = 95;          // px até valer como decisão
function ligarArraste() {
  const el = document.getElementById("topo");
  if (!el || Z.pedindoLado) return;
  const carimbos = {
    sim: el.querySelector(".c-sim"), nao: el.querySelector(".c-nao"),
    ine: el.querySelector(".c-ine"), pular: el.querySelector(".c-pular"),
  };
  const fundo = document.querySelector(".cartao.fundo");
  let x0 = 0, y0 = 0, arrastando = false, pid = null;

  const pinta = (dx, dy) => {
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const v = { sim: 0, nao: 0, ine: 0, pular: 0 };
    const p = Math.min(1, (horizontal ? Math.abs(dx) : Math.abs(dy)) / LIMIAR);
    if (horizontal) v[dx > 0 ? "sim" : "nao"] = p;
    else v[dy < 0 ? "ine" : "pular"] = p;
    for (const k in carimbos) if (carimbos[k]) carimbos[k].style.opacity = v[k];
    // o de trás cresce junto com o gesto — o que vem depois já se anuncia
    if (fundo) fundo.style.transform = p ? `scale(${.95 + .05 * p}) translateY(${12 * (1 - p)}px)` : "";
  };
  const solta = (dx, dy) => {
    if (fundo) fundo.style.transition = "";   // soltou: o de trás volta a subir com curva
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const d = horizontal ? Math.abs(dx) : Math.abs(dy);
    if (d < LIMIAR) {                       // volta para o lugar
      el.style.transition = "transform .2s ease";
      el.style.transform = "";
      pinta(0, 0);
      setTimeout(() => (el.style.transition = ""), 220);
      return;
    }
    const dir = horizontal ? (dx > 0 ? "sim" : "nao") : dy < 0 ? "ine" : "pular";
    if (dir === "ine") { Z.pedindoLado = true; el.style.transform = ""; pinta(0, 0); desenhar(); return; }
    const valor = dir === "sim" ? "concordo" : dir === "nao" ? "discordo" : "indiferente";
    voarCartao(dir, () => responderCartao(valor), horizontal ? dx : 0, dy);
  };

  el.addEventListener("pointerdown", (ev) => {
    if (ev.button !== undefined && ev.button !== 0) return;
    // Não capturar o ponteiro quando o gesto começa num botão de dentro do cartão:
    // com a captura ativa o navegador dispara o `click` no elemento que capturou, e
    // não no botão, o que engolia o "Me explique melhor".
    if (ev.target.closest("button")) return;
    arrastando = true; pid = ev.pointerId; x0 = ev.clientX; y0 = ev.clientY;
    el.setPointerCapture(pid); el.style.transition = "";
    if (fundo) fundo.style.transition = "none";   // durante o gesto, o de trás segue o dedo sem atraso
  });
  el.addEventListener("pointermove", (ev) => {
    if (!arrastando || ev.pointerId !== pid) return;
    const dx = ev.clientX - x0, dy = ev.clientY - y0;
    el.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx / 18}deg)`;
    pinta(dx, dy);
  });
  const fim = (ev) => {
    if (!arrastando || ev.pointerId !== pid) return;
    arrastando = false;
    solta(ev.clientX - x0, ev.clientY - y0);
  };
  el.addEventListener("pointerup", fim);
  el.addEventListener("pointercancel", () => {
    arrastando = false; el.style.transition = "transform .2s ease"; el.style.transform = "";
    if (fundo) fundo.style.transition = "";
    pinta(0, 0);
  });
  el.focus({ preventScroll: true });
}


// ── encerrar antes da hora ───────────────────────────────────────────────────
// Apertar e segurar, não clicar. Um toque acidental jogaria fora o resto do
// questionário, e desfazer isso custa caro; segurar pede confirmação sem meter uma
// caixa de diálogo no meio do fluxo. O tempo é a própria confirmação, e a barra que
// enche dá ao gesto um ponto de desistência visível.
const SEGURAR = 900;        // encerrar o questionário
const SEGURAR_INE = 800;    // marcar um tema como inegociável

/** Abaixo disto, soltar conta como toque — não como desistência de um gesto começado. */
const TOQUE = 350;

let dicaEl = null, dicaT = null;
/** Recado passageiro. O dedo cobre o botão, então o que ele indica precisa aparecer longe dele. */
function dizer(texto) {
  if (!dicaEl) {
    dicaEl = document.createElement("div");
    dicaEl.className = "dica";
    dicaEl.setAttribute("role", "status");
    document.body.appendChild(dicaEl);
  }
  dicaEl.textContent = texto;
  dicaEl.classList.add("visivel");
  clearTimeout(dicaT);
  dicaT = setTimeout(() => dicaEl.classList.remove("visivel"), 2200);
}

/**
 * Apertar e segurar. Soltar antes do fim cancela, e o preenchimento volta a zero sem
 * transição — o corte seco é o que faz o cancelamento parecer cancelamento.
 * Serve às três ações caras da tela: encerrar, e os dois inegociáveis.
 *
 * `opts.aoComecar`/`aoParar` existem porque nos inegociáveis quem se enche é o CARTÃO,
 * não o botão: o dedo cobre um botão de 56px inteiro e o progresso ficava invisível.
 * `opts.aoToque` cobre o outro lado do mesmo problema — quem só toca não vê nada
 * acontecer e conclui que o botão está quebrado.
 */
function ligarSegurar(el, ms, aoCompletar, opts = {}) {
  let t = null, inicio = 0;
  const parar = () => {
    clearTimeout(t); t = null;
    el.classList.remove("carregando");
    opts.aoParar?.();
  };
  const comecar = () => {
    if (t) return;
    inicio = performance.now();
    el.classList.add("carregando");
    opts.aoComecar?.();
    t = setTimeout(() => { parar(); aoCompletar(); }, ms);
  };
  const soltar = () => {
    const curto = t !== null && performance.now() - inicio < TOQUE;
    parar();
    if (curto) opts.aoToque?.();
  };
  el.addEventListener("pointerdown", (ev) => { ev.preventDefault(); comecar(); });
  for (const nome of ["pointerup", "pointerleave", "pointercancel"]) el.addEventListener(nome, soltar);
  // Teclado: segurar Espaço/Enter dispara keydown repetido; `comecar` ignora repetição.
  el.addEventListener("keydown", (ev) => {
    if (ev.key === " " || ev.key === "Enter") { ev.preventDefault(); comecar(); }
  });
  el.addEventListener("keyup", soltar);
  el.addEventListener("blur", parar);
}

function encerrarAgora() {
  Z.encerrado = true;
  Z.continuar = false;
  Z.extra = false;
  Z.tela = "resultado";
  gravar();
  desenhar();
}

function ligarSeguradores() {
  const fim = document.getElementById("encerrar");
  if (fim) ligarSegurar(fim, SEGURAR, encerrarAgora,
    { aoToque: () => dizer("Segure o botão até o fim para encerrar") });
  const cartao = document.getElementById("topo");
  for (const el of document.querySelectorAll("[data-segurar]")) {
    const lado = el.dataset.segurar;
    const marca = lado === "concordo" ? "carregando-sim" : "carregando-nao";
    ligarSegurar(el, SEGURAR_INE, () => voarCartao("ine", () => responderCartao(lado, true), 0, 0,
                                                   { valor: lado, inegociavel: true }), {
      aoComecar: () => cartao?.classList.add(marca),
      aoParar: () => cartao?.classList.remove(marca),
      aoToque: () => dizer("Segure para marcar como inegociável"),
    });
  }
}

// ── painel de uma candidatura ────────────────────────────────────────────────
// Antes isto era um acordeão dentro da linha do gráfico. Numa linha de ~40 caracteres
// as citações literais — que são longas por serem literais — ficavam ilegíveis. Virou
// uma folha sobreposta: o resultado continua atrás, intacto, e a volta é um gesto só.

/** Mesmo número para quem empata — a barra mede verde/total, o ranking mede verde×vermelho. */
function posicoes(a) {
  const pos = {};
  let n = 0, anterior = null;
  for (const id of a.ranking.ordem) {
    const f = a.estados[id].afinidade;
    if (anterior === null || Math.abs(f - anterior) > 1e-9) { n++; anterior = f; }
    pos[id] = n;
  }
  return pos;
}

const posturaDe = (id, e) => cand_(id)?.posicoes.find((p) => p.eixo === e) || null;

/** Lista de temas com a frase do plano — é aqui que "onde eu discordo dele" aparece. */
function itensPainel(est, id, chave, extra) {
  const s = est[id];
  const lista = extra ? s.complementar[chave] : s[chave];
  if (!lista.length) return "";
  return lista.map((e) => {
    const p = posturaDe(id, e);
    return `<article class="item">
      <b>${esc(CORPUS.eixos[e].label)}</b>${extra ? '<em class="fora">não conta no ranking</em>' : ""}
      <blockquote class="cit">“${esc(p.citacao.texto)}”
        <span class="fonte">${esc(p.citacao.local)}</span></blockquote></article>`;
  }).join("");
}

function conteudoPainel(id) {
  const a = olhar();
  const est = a.estados, s = est[id];
  const pos = posicoes(a);
  const morto = s.estado === "eliminado";
  const nDiv = s.divergentes.length + s.complementar.divergentes.length;
  const nAli = s.alinhados.length + s.complementar.alinhados.length;
  const nSil = s.silencios.length;

  const totalPeso = Math.max(...CORPUS.candidatos.map((c) => est[c.id].pesoRespondido), 1);
  const w = (ids) => (ids.reduce((n, e) => n + CORPUS.eixos[e].peso, 0) / totalPeso) * 100;

  // Agrupado em <section> para o título poder grudar no topo enquanto rola: com as
  // duas listas seguidas, a meio caminho não dava para saber qual delas se está lendo.
  const secao = (chave, titulo, classe) =>
    (s[chave].length || s.complementar[chave].length)
      ? `<section class="grupo ${classe}"><h3>${titulo}</h3>${
          itensPainel(est, id, chave)}${itensPainel(est, id, chave, true)}</section>`
      : "";

  const nada = !nDiv && !nAli;
  const contagem = [nDiv ? `${nDiv} divergência${nDiv > 1 ? "s" : ""}` : "",
                    nAli ? `${nAli} concordância${nAli > 1 ? "s" : ""}` : "",
                    nSil ? `${nSil} sem posição no plano` : ""].filter(Boolean).join(" · ");

  return `<div class="painel" role="dialog" aria-modal="true" aria-labelledby="painel-nome">
    <header>
      <div class="cab">
        <span class="pos${a.ranking.lideres.includes(id) ? " topo" : ""}">${morto ? "×" : pos[id] ? pos[id] + "º" : "—"}</span>
        <div class="nome"><b id="painel-nome">${esc(nomeC(id))}</b>${
          siglaC(id) ? `<em>${esc(siglaC(id))}</em>` : ""}${
          morto ? '<em class="morto">fora — inegociável</em>' : ""}</div>
        <button class="fechar" data-fechar aria-label="Voltar ao resultado">${ICONE.fechar}</button>
      </div>
      <div class="barra" role="img" aria-label="${esc(contagem)}">
        <i class="a" style="width:${w(s.alinhados)}%"></i><i class="d" style="width:${w(s.divergentes)}%"></i><i class="s" style="width:${w(s.silencios)}%"></i>
      </div>
      <p class="contagem">${esc(contagem)}</p>
    </header>
    <div class="corpo">
      ${nada ? `<p class="mini">Este plano não trata de nada do que você respondeu.</p>` : ""}
      ${secao("divergentes", "Vocês divergem", "d")}
      ${secao("alinhados", "Vocês concordam", "a")}
      ${cand_(id).planoUrl ? `<a class="plano" href="${esc(cand_(id).planoUrl)}" target="_blank"
        rel="noopener noreferrer">Ler o plano completo de ${esc(nomeC(id))} →</a>` : ""}
      <button class="voltar" data-fechar>Voltar ao resultado</button>
    </div>
  </div>`;
}

const painelEl = document.createElement("div");
painelEl.className = "painel-fundo";
painelEl.hidden = true;
document.body.appendChild(painelEl);

let focoAnterior = null;

function abrirPainel(id) {
  focoAnterior = document.activeElement;
  Z.aberto = id;
  painelEl.innerHTML = conteudoPainel(id);
  painelEl.hidden = false;
  // Trava a rolagem de trás sem perder a posição: ao fechar, o resultado está
  // exatamente onde estava.
  document.body.classList.add("travado");
  appEl.inert = true;   // sem isto o Tab passeia pelo resultado atrás da folha
  requestAnimationFrame(() => {
    painelEl.classList.add("visivel");
    painelEl.querySelector(".fechar")?.focus({ preventScroll: true });
  });
}

function fecharPainel() {
  if (painelEl.hidden) return;
  Z.aberto = null;
  painelEl.classList.remove("visivel");
  document.body.classList.remove("travado");
  appEl.inert = false;
  painelEl.hidden = true;
  painelEl.innerHTML = "";
  focoAnterior?.focus?.({ preventScroll: true });
  focoAnterior = null;
}

painelEl.addEventListener("click", (ev) => {
  // Fecha no ✕, no botão de voltar e no fundo — nunca num clique dentro da folha.
  if (ev.target.closest("[data-fechar]") || ev.target === painelEl) fecharPainel();
});

// ── eventos ──────────────────────────────────────────────────────────────────
appEl.addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-resp], [data-ir]");
  if (!b) return;
  if (b.dataset.resp) {
    const ine = b.dataset.ine === "1";
    return voarCartao(direcaoDe(b.dataset.resp, ine),
                      () => responderCartao(b.dataset.resp, ine), 0, 0,
                      { valor: b.dataset.resp, inegociavel: ine });
  }
  switch (b.dataset.ir) {
    case "cartoes": Z.encerrado = false; Z.tela = "cartoes"; gravar(); desenhar(); break;
    case "continuar": Z.continuar = true; Z.encerrado = false; Z.tela = "cartoes"; gravar(); desenhar(); break;
    case "extra": Z.extra = true; Z.encerrado = false; Z.tela = "cartoes"; gravar(); desenhar(); break;
    case "abrir": abrirPainel(b.dataset.quem); break;
    case "ordenar": Z.ordenar = b.dataset.por; gravar(); desenhar(); break;
    case "recomecar": recomecar(); break;
    case "pedir-lado": Z.pedindoLado = true; desenhar(); break;
    case "cancelar-lado": Z.pedindoLado = false; desenhar(); break;
    case "virar": virarCartao(); break;
    case "tema": alternarTema(); break;
  }
});
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && !painelEl.hidden) { ev.preventDefault(); return fecharPainel(); }
  if (!painelEl.hidden) return;
  if (Z.tela !== "cartoes" || Z.pedindoLado) return;
  if (ev.target?.closest?.("#encerrar, [data-segurar]")) return;
  // Enter/Espaço num botão com foco é o clique daquele botão — não a virada do cartão.
  if ((ev.key === " " || ev.key === "Enter") && ev.target?.closest?.("button")) return;
  const m = { ArrowRight: "concordo", ArrowLeft: "discordo", ArrowDown: "indiferente" };
  if (ev.key === "ArrowUp") { ev.preventDefault(); Z.pedindoLado = true; desenhar(); return; }
  if (ev.key === " " || ev.key === "Enter") { ev.preventDefault(); virarCartao(); return; }
  if (m[ev.key]) {
    ev.preventDefault();
    voarCartao(direcaoDe(m[ev.key], false), () => responderCartao(m[ev.key]));
  }
});

// Safari ignora `user-scalable=no` e só em parte o `touch-action`: a pinça e o
// zoom por toque duplo são barrados aqui também. Sem isto o segundo dedo no meio
// de um arraste ampliava a página em vez de mover o cartão.
document.addEventListener("gesturestart", (ev) => ev.preventDefault());
document.addEventListener("touchmove", (ev) => {
  if (ev.touches.length > 1 || (ev.scale !== undefined && ev.scale !== 1)) ev.preventDefault();
}, { passive: false });
let ultimoToque = 0;
document.addEventListener("touchend", (ev) => {
  const agora = Date.now();
  if (agora - ultimoToque < 300 && !ev.target.closest("button, a, input, select")) ev.preventDefault();
  ultimoToque = agora;
}, { passive: false });

if (recuperar() && Z.tela !== "abertura") { /* retoma onde parou */ }
desenhar();
