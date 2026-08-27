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

  // A palavra "inegociável" não diz o que o botão faz; o número de candidaturas que
  // sairiam diz. Fase 1 separa os dois lados; na fase 4 só um lado tem plano escrito,
  // então um dos lados não derruba ninguém.
  const elimina = q.fase === 4
    ? (q.campo.postura === "favor"
        ? { concordo: 0, discordo: q.campo.nFalam }
        : { concordo: q.campo.nFalam, discordo: 0 })
    : { concordo: q.separa.contra, discordo: q.separa.favor };
  const derruba = (n) => n === 0 ? "não elimina ninguém"
    : `elimina ${n} candidatura${n > 1 ? "s" : ""}`;
  const custo = (n, lado) => n === 0
    ? `Não elimina ninguém: nenhum plano se posiciona ${lado}`
    : `Elimina ${n} candidatura${n > 1 ? "s" : ""} que ${n > 1 ? "estão" : "está"} ${lado}`;

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
        <h3>Inegociável elimina candidatos</h3>
        <p class="mini" style="margin:0">Nos outros temas sua resposta soma ou tira pontos. Aqui não:
        quem estiver do lado oposto <b>sai da comparação inteira</b>, por mais que combine com você
        em todo o resto. De que lado?</p>
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
      ><i class="carga" aria-hidden="true"></i>${ICONE.ineNao}</button>
      <span>Não, inegociável</span></div>
    <div class="acao"><button class="b-pular" data-resp="indiferente" aria-label="Não opinar">${ICONE.pular}</button>
      <span>Não opinar</span></div>
    <div class="acao"><button class="b-ine-sim" data-segurar="concordo"
      aria-label="Segure para marcar: concordo, e é inegociável — elimina quem for contra"
      ><i class="carga" aria-hidden="true"></i>${ICONE.ineSim}</button>
      <span>Sim, inegociável</span></div>
    <div class="acao"><button class="b-sim" data-resp="concordo" aria-label="Concordo">${ICONE.sim}</button>
      <span>Concordo</span></div>
  </div>
  ${Z.linhasVermelhas.length ? "" : `<p class="legenda-ine"><b>Inegociável descarta quem pensa
    diferente.</b><br>Neste tema, “não” ${derruba(elimina.discordo)}; “sim” ${
    derruba(elimina.concordo)}.</p>`}

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

  const raia = (id) => {
    const s = est[id];
    const morto = s.estado === "eliminado";
    const lider = a.ranking.lideres.includes(id);
    const A = peso(s.alinhados), D = peso(s.divergentes), S = peso(s.silencios);
    const p = (x) => (x / totalPeso) * 100;
    const nDiv = s.divergentes.length + s.complementar.divergentes.length;
    const nAli = s.alinhados.length + s.complementar.alinhados.length;
    return `<div class="raia ${lider ? "topo" : ""} ${morto ? "morta" : ""}">
      <button class="quem" data-ir="abrir" data-quem="${id}" aria-haspopup="dialog">
        ${Z.ordenar === "afinidade"
          ? `<span class="pos">${morto ? "×" : posicao[id] ? posicao[id] + "º" : "—"}</span>`
          : `<span class="pos">${morto ? "×" : "·"}</span>`}
        <b>${esc(nomeC(id))}</b>${siglaC(id) ? `<em>${esc(siglaC(id))}</em>` : ""}
        ${lider ? '<em style="color:var(--acento)">mais alinhado</em>' : ""}
        ${morto ? '<em style="color:var(--nao)">fora — inegociável</em>' : ""}
        <span class="conta ${Z.ordenar === "concordancia" ? "acordo" : ""}">${
          Z.ordenar === "concordancia"
            ? (nAli ? `${nAli} concordância${nAli > 1 ? "s" : ""}` : "")
            : (nDiv ? `${nDiv} divergência${nDiv > 1 ? "s" : ""}` : "")}</span>
        <span class="seta" aria-hidden="true">›</span>
      </button>
      <div class="barra" role="img" aria-label="${A ? "concorda em parte" : ""}">
        <i class="a" style="width:${p(A)}%"></i><i class="d" style="width:${p(D)}%"></i><i class="s" style="width:${p(S)}%"></i>
      </div></div>`;
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
  <div class="barra-topo"><span class="marca">Palanq</span></div>
  <h1 style="font-size:1.35rem">Seu resultado</h1>

  <div class="ordenar" role="group" aria-label="Ordenar candidaturas por">
    <i class="marca-ordem" style="left:${(iOrdem * 100) / ORDENS.length}%;width:${100 / ORDENS.length}%"></i>
    ${ORDENS.map((o) => `<button data-ir="ordenar" data-por="${o.id}"
      aria-pressed="${Z.ordenar === o.id}">${o.rotulo}</button>`).join("")}
  </div>

  ${Z.encerrado ? `<div class="aviso" style="border-left-color:var(--pular)">
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
    <p class="mini" style="margin:0 0 .7rem">${Z.encerrado
      ? "Você pediu para ver o resultado agora."
      : "Paramos porque quem está no topo já não muda."} ${
      faltam === 1 ? "Um tema continua" : `${faltam} temas continuam`} sem resposta, e a ordem de quem vem
    depois ainda vai mudar${caladosNoTopo.length ? " — inclusive o tanto de hachurado no topo" : ""}.</p>
    <button data-ir="continuar" style="border:1px solid var(--acento);border-radius:999px;padding:.5rem 1.1rem;background:var(--caixa)">${
      faltam === 1 ? "Responder o último" : `Responder os ${faltam} restantes`}</button>
  </div>` : ""}

  ${extraFaltam && !faltam ? `<div class="aviso" style="border-left-color:var(--pular);background:var(--realce)">
    <h3 style="color:var(--fg)">Conhecer melhor cada candidatura</h3>
    <p class="mini" style="margin:0 0 .7rem">Há ${extraFaltam} tema(s) em que as candidaturas não
    divergem entre si — por isso não entram no ranking: responder não mexe nas barras acima. Mas é onde
    você pode descobrir que discorda de quem pretende apoiar: responder todos multiplica por
    ${(214 / 130).toFixed(1)} o que dá para saber sobre cada plano. A exceção é o escudo: marcar um tema
    como inegociável elimina quem pensa diferente em qualquer fase, e isso muda, sim, o resultado.</p>
    <button data-ir="extra" style="border:1px solid var(--linha);border-radius:999px;padding:.5rem 1.1rem;background:var(--caixa)">Responder esses ${extraFaltam} temas</button>
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
  fecharPainel();
  appEl.innerHTML = Z.tela === "abertura" ? telaAbertura()
                  : Z.tela === "resultado" ? telaResultado()
                  : telaCartoes();
  appEl.classList.toggle("abertura", Z.tela === "abertura");
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


// ── encerrar antes da hora ───────────────────────────────────────────────────
// Apertar e segurar, não clicar. Um toque acidental jogaria fora o resto do
// questionário, e desfazer isso custa caro; segurar pede confirmação sem meter uma
// caixa de diálogo no meio do fluxo. O tempo é a própria confirmação, e a barra que
// enche dá ao gesto um ponto de desistência visível.
const SEGURAR = 900;        // encerrar o questionário
const SEGURAR_INE = 800;    // marcar um tema como inegociável

/**
 * Apertar e segurar. Soltar antes do fim cancela, e a barra volta a zero sem
 * transição — o corte seco é o que faz o cancelamento parecer cancelamento.
 * Serve às três ações caras da tela: encerrar, e os dois inegociáveis.
 */
function ligarSegurar(el, ms, aoCompletar) {
  let t = null;
  const parar = () => { clearTimeout(t); t = null; el.classList.remove("carregando"); };
  const comecar = () => {
    if (t) return;
    el.classList.add("carregando");
    t = setTimeout(() => { parar(); aoCompletar(); }, ms);
  };
  el.addEventListener("pointerdown", (ev) => { ev.preventDefault(); comecar(); });
  for (const nome of ["pointerup", "pointerleave", "pointercancel"]) el.addEventListener(nome, parar);
  // Teclado: segurar Espaço/Enter dispara keydown repetido; `comecar` ignora repetição.
  el.addEventListener("keydown", (ev) => {
    if (ev.key === " " || ev.key === "Enter") { ev.preventDefault(); comecar(); }
  });
  el.addEventListener("keyup", parar);
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
  if (fim) ligarSegurar(fim, SEGURAR, encerrarAgora);
  for (const el of document.querySelectorAll("[data-segurar]")) {
    const lado = el.dataset.segurar;
    ligarSegurar(el, SEGURAR_INE, () => responderCartao(lado, true));
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
        <span class="pos">${morto ? "×" : pos[id] ? pos[id] + "º" : "—"}</span>
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
  if (b.dataset.resp) return responderCartao(b.dataset.resp, b.dataset.ine === "1");
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
  }
});
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && !painelEl.hidden) { ev.preventDefault(); return fecharPainel(); }
  if (!painelEl.hidden) return;
  if (Z.tela !== "cartoes" || Z.pedindoLado) return;
  if (ev.target?.closest?.("#encerrar, [data-segurar]")) return;
  const m = { ArrowRight: "concordo", ArrowLeft: "discordo", ArrowDown: "indiferente" };
  if (ev.key === "ArrowUp") { ev.preventDefault(); Z.pedindoLado = true; desenhar(); return; }
  if (ev.key === " " || ev.key === "Enter") { ev.preventDefault(); virarCartao(); return; }
  if (m[ev.key]) { ev.preventDefault(); responderCartao(m[ev.key]); }
});

if (recuperar() && Z.tela !== "abertura") { /* retoma onde parou */ }
desenhar();
