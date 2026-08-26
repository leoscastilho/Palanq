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
  margem: 0.05,
};

/**
 * Um matiz por tema. Saturação e luminosidade ficam por conta do CSS, iguais para
 * todos, para que as 21 cores pareçam uma família e não um arco-íris. Temas
 * vizinhos no assunto ficam vizinhos no círculo cromático.
 */
const MATIZ = {
  economia: 208, tributacao: 196, fiscal: 188, orcamento: 182,
  trabalho: 28, previdencia: 40, social: 344, federativo: 222,
  saude: 166, ambiental: 132, agrario: 104, energia: 52,
  educacao: 272, tecnologia: 254, comunicacao: 292,
  seguranca: 12, justica: 238, politica: 246, estado: 216,
  externa: 228, transporte: 176,
};
const matizDe = (d) => MATIZ[d] ?? 215;

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
  { linhasVermelhas: new Set(Z.linhasVermelhas), margem: Z.margem });

/** Só os temas em disputa entram nesta versão: nada de portões nem de fase extra. */
function pergunta(a) {
  const q = proxima(a);
  return q && q.tipo === "eixo" && q.fase === 1 ? q : null;
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
  if (!pergunta(a)) return true;                 // acabaram as perguntas
  if (!a.decisao.estavel) return false;          // ainda dá para mudar quem lidera
  const div = a.classes.divisivos;
  const feitas = div.filter((d) => Z.respostas[d.eixo] !== undefined);
  const temaDe = (d) => CORPUS.eixos[d.eixo].dominio;
  const tocados = new Set(feitas.map(temaDe)).size;
  const existentes = new Set(div.map(temaDe)).size;
  return feitas.length >= Math.min(MINIMO, div.length) &&
         tocados >= Math.min(MINIMO_TEMAS, existentes);
}

function gravar() {
  try { localStorage.setItem(CHAVE_S, JSON.stringify({ v: 1, cv: CORPUS.corpusVersion, ...Z })); } catch {}
}
function recuperar() {
  try {
    const d = JSON.parse(localStorage.getItem(CHAVE_S) || "null");
    if (!d || d.cv !== CORPUS.corpusVersion) return false;
    Object.assign(Z, { tela: d.tela, respostas: d.respostas || {}, linhasVermelhas: d.linhasVermelhas || [] });
    Z.pedindoLado = false;
    return Object.keys(Z.respostas).length > 0;
  } catch { return false; }
}
function recomecar() {
  Object.assign(Z, { tela: "abertura", respostas: {}, linhasVermelhas: [], pedindoLado: false });
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
  // escudo com "!" — inegociável
  ine: SVG('<path d="M12 3 4 6v6c0 4.5 3.2 8.3 8 9 4.8-.7 8-4.5 8-9V6l-8-3Z"/><path d="M12 8.5v4"/><circle cx="12" cy="15.6" r=".9" fill="currentColor" stroke="none"/>'),
  // seta para baixo — não opinar
  pular: SVG('<path d="M12 5v13M6 13l6 6 6-6"/>'),
  // setas em círculo — virar o cartão
  virar: SVG('<path d="M3 11a9 9 0 0 1 15-6.7L21 7"/><path d="M21 3v4h-4"/><path d="M21 13a9 9 0 0 1-15 6.7L3 17"/><path d="M3 21v-4h4"/>'),
};

// ── responder ────────────────────────────────────────────────────────────────
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

// ── telas ────────────────────────────────────────────────────────────────────
function telaAbertura() {
  const retomar = Object.keys(Z.respostas).length > 0;
  return `<div class="abertura tela" style="padding:0">
    <h1>Palanq</h1>
    <p class="slogan">No papel, qual candidato combina com você?</p>
    <p class="mini">${CORPUS.escopo.eleicao} · ${CORPUS.escopo.cargo}</p>
    <div class="aviso" style="text-align:left;margin-top:1.4rem">
      <h3>Isto não recomenda voto</h3>
      <p class="mini" style="margin:0">Comparamos o que você responde com o que está escrito nos planos
      de governo registrados. Não entra aqui nada sobre histórico, capacidade de executar, coalizão ou
      financiamento de campanha.</p>
    </div>
    <button class="comecar" data-ir="cartoes">${retomar ? "Continuar" : "Começar"}</button>
    ${retomar ? '<button class="mini" data-ir="recomecar" style="margin-top:.8rem;text-decoration:underline">Recomeçar do zero</button>' : ""}
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
  // dois cartões atrás, só para dar volume à pilha
  const seguintes = divisivos
    .filter((d) => Z.respostas[d.eixo] === undefined && d.eixo !== q.id)
    .slice(0, 2)
    .map((d) => CORPUS.eixos[d.eixo]);

  const frente = (e, comBotao) => `
    <div class="face frente">
      <div class="dominio"><i></i>${esc(e.dominio || "")}</div>
      <h2>${esc(e.label)}</h2>
      <div class="pergunta">${esc(e.pergunta)}</div>
      ${e.formulacaoNeutra === false
        ? '<div class="nota">Não foi possível escrever esta pergunta sem carga. Leia com isso em mente.</div>'
        : ""}
      ${comBotao ? `<button class="virar" data-ir="virar">${ICONE.virar} Me explique melhor</button>` : ""}
    </div>`;
  const verso = (e) => `
    <div class="face verso">
      <div class="rotulo">o que isso quer dizer</div>
      <div class="explicacao">${esc(e.explicacao || "")}</div>
      <button class="virar" data-ir="virar">${ICONE.virar} Voltar à pergunta</button>
    </div>`;
  const corpo = (e, comBotao) => `<div class="giro${comBotao && Z.virado ? " virado" : ""}">${frente(e, comBotao)}${comBotao ? verso(e) : ""}</div>`;
  const tema = (e) => `style="--h:${matizDe(e.dominio)}"`;

  return `
  <div class="barra-topo">
    <span class="marca">Palanq</span>
    <div class="progresso" aria-hidden="true"><i style="width:${pct}%"></i></div>
    <span class="mini">${faltam ? `faltam ${faltam}` : "última"}</span>
  </div>

  <div class="pilha">
    ${seguintes.map((e, i) => `<article class="cartao fundo${i ? "2" : ""}" ${tema(e)} aria-hidden="true">${corpo(e, false)}</article>`).reverse().join("")}
    <article class="cartao" id="topo" tabindex="0" aria-live="polite" ${tema(q)}
             aria-label="${esc(e_label(q))}">
      <span class="carimbo c-sim">Concordo</span>
      <span class="carimbo c-nao">Discordo</span>
      <span class="carimbo c-ine">Inegociável</span>
      <span class="carimbo c-pular">Não opinar</span>
      ${corpo(q, true)}
      ${Z.pedindoLado ? `<div class="overlay">
        <h3>Inegociável de que lado?</h3>
        <p class="mini" style="margin:0">Quem pensar diferente sai da comparação, por mais que combine
        com você no resto.</p>
        <div class="escolhas">
          <button data-resp="concordo" data-ine="1">Concordo — e é inegociável
            <small>Some quem for contra</small></button>
          <button data-resp="discordo" data-ine="1">Discordo — e é inegociável
            <small>Some quem for a favor</small></button>
        </div>
        <button class="voltar" data-ir="cancelar-lado">voltar</button>
      </div>` : ""}
    </article>
  </div>

  <div class="acoes">
    <div class="acao"><button class="b-nao" data-resp="discordo" aria-label="Discordo">${ICONE.nao}</button>
      <span>Discordo</span></div>
    <div class="acao"><button class="b-pular" data-resp="indiferente" aria-label="Não opinar">${ICONE.pular}</button>
      <span>Não opinar</span></div>
    <div class="acao"><button class="b-ine" data-ir="pedir-lado" aria-label="Inegociável">${ICONE.ine}</button>
      <span>Inegociável</span></div>
    <div class="acao"><button class="b-sim" data-resp="concordo" aria-label="Concordo">${ICONE.sim}</button>
      <span>Concordo</span></div>
  </div>`;
}
const e_label = (q) => `${q.label}. ${q.pergunta}`;

function telaResultado() {
  const a = olhar();
  const est = a.estados;
  // Todas as barras têm o mesmo comprimento: o peso que você respondeu. O que muda
  // é a divisão entre concordância, divergência e silêncio — e o silêncio aparece.
  const totalPeso = Math.max(...CORPUS.candidatos.map((c) => est[c.id].pesoRespondido), 1);
  const peso = (ids) => ids.reduce((n, e) => n + CORPUS.eixos[e].peso, 0);

  const ordem = [...a.ranking.ordem, ...a.ranking.semSinal,
                 ...CORPUS.candidatos.filter((c) => est[c.id].estado === "eliminado").map((c) => c.id)];

  // Posição explícita, com o MESMO número para quem empata. Sem isto o leitor lê o
  // comprimento do verde como se fosse a ordem — e ele não é: a barra mostra
  // verde/total, enquanto o ranking compara verde com vermelho e ignora o hachurado.
  // Duas candidaturas podem ter a mesma afinidade com barras bem diferentes.
  const posicao = {};
  let n = 0, anterior = null;
  for (const id of a.ranking.ordem) {
    const f = est[id].afinidade;
    if (anterior === null || Math.abs(f - anterior) > 1e-9) { n++; anterior = f; }
    posicao[id] = n;
  }

  const raia = (id) => {
    const s = est[id];
    const morto = s.estado === "eliminado";
    const lider = a.ranking.lideres.includes(id);
    const A = peso(s.alinhados), D = peso(s.divergentes), S = peso(s.silencios);
    const p = (x) => (x / totalPeso) * 100;
    return `<div class="raia ${lider ? "topo" : ""} ${morto ? "morta" : ""}">
      <div class="quem"><span class="pos">${morto ? "×" : posicao[id] ? posicao[id] + "º" : "—"}</span>
        <b>${esc(nomeC(id))}</b>${siglaC(id) ? `<em>${esc(siglaC(id))}</em>` : ""}
        ${lider ? '<em style="color:var(--acento)">mais alinhado</em>' : ""}
        ${morto ? '<em style="color:var(--nao)">fora — inegociável</em>' : ""}</div>
      <div class="barra" role="img" aria-label="${A ? "concorda em parte" : ""}">
        <i class="a" style="width:${p(A)}%"></i><i class="d" style="width:${p(D)}%"></i><i class="s" style="width:${p(S)}%"></i>
      </div></div>`;
  };

  const lideres = a.ranking.lideres;
  const pesoDe = (ids) => ids.reduce((n, e) => n + CORPUS.eixos[e].peso, 0);
  // Líderes empatados cujas barras ficam bem diferentes — o caso que faz o leitor
  // achar que o ranking está errado.
  const desigual = lideres.length > 1 &&
    Math.max(...lideres.map((x) => est[x].cobertura ?? 0)) -
    Math.min(...lideres.map((x) => est[x].cobertura ?? 0)) > 0.25 ? lideres : [];
  // Um líder que "venceu" mais por silêncio do que por concordância. É o desfecho
  // que o gráfico já denuncia; o título não pode dizer outra coisa.
  const calado = (id) => pesoDe(est[id].silencios) > pesoDe(est[id].alinhados);
  const caladosNoTopo = lideres.filter(calado);
  const faltam = a.classes.divisivos.filter((d) => Z.respostas[d.eixo] === undefined).length;

  const titulo = !lideres.length
    ? "Nenhuma candidatura sobrou"
    : caladosNoTopo.length === lideres.length
    ? "Nenhum candidatoestá alinhado com suas opiniões"
    : lideres.length === 1
    ? `${nomeC(lideres[0])} está mais alinhado com suas opiniões`
    : `Empate entre ${lideres.length}`;

  const subtitulo = !lideres.length
    ? ""
    : caladosNoTopo.length === lideres.length
    ? `<p class="mini">${lista(lideres.map((x) => esc(nomeC(x))))} ${lideres.length > 1 ? "aparecem" : "aparece"}
       no topo por <b>não ter dito nada</b> sobre a maior parte do que você respondeu — e não por concordar
       com você. Repare no tanto de hachurado ${lideres.length > 1 ? "nas barras" : "na barra"} logo abaixo.</p>`
    : caladosNoTopo.length
    ? `<p class="mini">${lista(caladosNoTopo.map((x) => esc(nomeC(x))))}
       ${caladosNoTopo.length > 1 ? "empatam" : "empata"} no topo mais por silêncio do que por concordância:
       o plano ${caladosNoTopo.length > 1 ? "deles" : "dele"} não trata da maior parte do que você respondeu.</p>`
    : lideres.length > 1
    ? `<p class="mini">${lista(lideres.map((x) => esc(nomeC(x))))} — a diferença entre elas é pequena
       demais para desempatar.</p>`
    : "";

  return `
  <div class="barra-topo"><span class="marca">Palanq</span></div>
  <h1 style="font-size:1.6rem">${esc(titulo)}</h1>
  ${subtitulo}

  <div class="chave">
    <span><i style="background:var(--sim)"></i>vocês concordam</span>
    <span><i style="background:var(--nao)"></i>vocês divergem</span>
    <span><i class="s" style="background:var(--linha)"></i>o plano não fala disso</span>
  </div>
  <div class="grafico">${ordem.map(raia).join("")}</div>

  <p class="mini" style="margin-top:1.2rem">Todas as barras têm o mesmo tamanho: o que muda é quanto
  de cada cor. Muito hachurado quer dizer que aquele plano <b>não trata</b> dos temas que você respondeu —
  e não que ele concorde com você.</p>
  ${desigual.length > 1 ? `<p class="mini"><b>Por que ${lista(desigual.map((x) => esc(nomeC(x))))}
  empatam, se as barras são tão diferentes?</b> A posição compara o verde com o vermelho e ignora o
  hachurado: ${desigual.length > 2 ? "nenhum deles diverge" : "nenhum dos dois diverge"} de você naquilo que
  declarou. O que muda é o tamanho do plano — quem escreveu sobre mais temas tem menos hachurado.</p>` : ""}
  ${faltam ? `<div class="aviso" style="border-left-color:var(--acento);background:var(--realce)">
    <h3 style="color:var(--acento)">Ainda dá para afinar</h3>
    <p class="mini" style="margin:0 0 .7rem">Paramos porque quem está no topo já não muda. Mas
    ${faltam === 1 ? "um tema continua" : `${faltam} temas continuam`} sem resposta, e a ordem de quem vem
    depois ainda vai mudar${caladosNoTopo.length ? " — inclusive o tanto de hachurado no topo" : ""}.</p>
    <button data-ir="cartoes" style="border:1px solid var(--acento);border-radius:999px;padding:.5rem 1.1rem;background:var(--caixa)">${
      faltam === 1 ? "Responder o último" : `Responder os ${faltam} restantes`}</button>
  </div>` : ""}

  <div class="aviso" style="margin-top:1.2rem">
    <h3>Isto não é uma recomendação de voto</h3>
    <p class="mini" style="margin:0">É a comparação entre o que você respondeu e o que está escrito nos
    planos. Leia os documentos antes de decidir.</p>
  </div>

  <h3 style="width:100%">Planos de governo</h3>
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
  appEl.innerHTML = Z.tela === "abertura" ? telaAbertura()
                  : Z.tela === "resultado" ? telaResultado()
                  : telaCartoes();
  appEl.classList.toggle("abertura", Z.tela === "abertura");
  if (Z.tela === "cartoes") ligarArraste();
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
  let x0 = 0, y0 = 0, arrastando = false, pid = null;

  const pinta = (dx, dy) => {
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const v = { sim: 0, nao: 0, ine: 0, pular: 0 };
    if (horizontal) v[dx > 0 ? "sim" : "nao"] = Math.min(1, Math.abs(dx) / LIMIAR);
    else v[dy < 0 ? "ine" : "pular"] = Math.min(1, Math.abs(dy) / LIMIAR);
    for (const k in carimbos) if (carimbos[k]) carimbos[k].style.opacity = v[k];
  };
  const solta = (dx, dy) => {
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
    // sai voando na direção do gesto
    el.style.transition = "transform .28s ease-out, opacity .28s ease-out";
    el.style.transform = `translate(${horizontal ? Math.sign(dx) * 900 : dx}px, ${horizontal ? dy : Math.sign(dy) * 900}px) rotate(${dx / 12}deg)`;
    el.style.opacity = "0";
    const valor = dir === "sim" ? "concordo" : dir === "nao" ? "discordo" : "indiferente";
    setTimeout(() => responderCartao(valor), 180);
  };

  el.addEventListener("pointerdown", (ev) => {
    if (ev.button !== undefined && ev.button !== 0) return;
    // Não capturar o ponteiro quando o gesto começa num botão de dentro do cartão:
    // com a captura ativa o navegador dispara o `click` no elemento que capturou, e
    // não no botão, o que engolia o "Me explique melhor".
    if (ev.target.closest("button")) return;
    arrastando = true; pid = ev.pointerId; x0 = ev.clientX; y0 = ev.clientY;
    el.setPointerCapture(pid); el.style.transition = "";
  });
  el.addEventListener("pointermove", (ev) => {
    if (!arrastando || ev.pointerId !== pid) return;
    const dx = ev.clientX - x0, dy = ev.clientY - y0;
    el.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx / 20}deg)`;
    pinta(dx, dy);
  });
  const fim = (ev) => {
    if (!arrastando || ev.pointerId !== pid) return;
    arrastando = false;
    solta(ev.clientX - x0, ev.clientY - y0);
  };
  el.addEventListener("pointerup", fim);
  el.addEventListener("pointercancel", () => {
    arrastando = false; el.style.transition = "transform .2s ease"; el.style.transform = ""; pinta(0, 0);
  });
  el.focus({ preventScroll: true });
}

// ── eventos ──────────────────────────────────────────────────────────────────
appEl.addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-resp], [data-ir]");
  if (!b) return;
  if (b.dataset.resp) return responderCartao(b.dataset.resp, b.dataset.ine === "1");
  switch (b.dataset.ir) {
    case "cartoes": Z.tela = "cartoes"; gravar(); desenhar(); break;
    case "recomecar": recomecar(); break;
    case "pedir-lado": Z.pedindoLado = true; desenhar(); break;
    case "cancelar-lado": Z.pedindoLado = false; desenhar(); break;
    case "virar": virarCartao(); break;
  }
});
document.addEventListener("keydown", (ev) => {
  if (Z.tela !== "cartoes" || Z.pedindoLado) return;
  const m = { ArrowRight: "concordo", ArrowLeft: "discordo", ArrowDown: "indiferente" };
  if (ev.key === "ArrowUp") { ev.preventDefault(); Z.pedindoLado = true; desenhar(); return; }
  if (ev.key === " " || ev.key === "Enter") { ev.preventDefault(); virarCartao(); return; }
  if (m[ev.key]) { ev.preventDefault(); responderCartao(m[ev.key]); }
});

if (recuperar() && Z.tela !== "abertura") { /* retoma onde parou */ }
desenhar();
