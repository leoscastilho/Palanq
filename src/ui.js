/**
 * Interface. Sem framework e sem dependências: o produto é um .html único que
 * funciona por duplo clique, offline, sem requisição externa. Nada do que o
 * usuário responde sai do navegador — as respostas dele são as posições
 * políticas dele, e a única defesa que não depende de confiança é não ter servidor.
 *
 * Todo o estado da tela é derivado de `S.respostas` + `S.linhasVermelhas` por
 * `analisar()`, que é pura. Nada é acumulado — é o que torna trivial voltar e
 * alterar uma resposta (B11).
 */
const CHAVE = "match-presidenciaveis/v1";
const app = document.getElementById("app");

const S = {
  tela: "abertura",
  respostas: {},
  linhasVermelhas: [],
  rastro: [],
  complementar: false,
  margem: 0.05,
  editando: null,
};

// ── util ────────────────────────────────────────────────────────────────────
const h = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const f3 = (x) => (x === null || x === undefined ? "—" : x.toFixed(3));
const f2 = (x) => (x === null || x === undefined ? "—" : x.toFixed(2));
const cand = (id) => CORPUS.candidatos.find((c) => c.id === id);
const nomeDe = (id) => { const c = cand(id); return c ? c.nome + (c.partido ? ` (${c.partido})` : "") : id; };
const eixoDe = (id) => CORPUS.eixos[id]?.label ?? id;
const posturaDe = (id, eixo) => cand(id)?.posicoes.find((p) => p.eixo === eixo) || null;

function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify({ v: 1, corpusVersion: CORPUS.corpusVersion, ...S })); }
  catch { /* modo privado, cota cheia: a sessão continua, só não persiste */ }
}
function carregar() {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (d.corpusVersion !== CORPUS.corpusVersion) return false;
    Object.assign(S, { tela: d.tela, respostas: d.respostas || {}, linhasVermelhas: d.linhasVermelhas || [],
                       rastro: d.rastro || [], complementar: !!d.complementar, margem: d.margem ?? 0.05 });
    return Object.keys(S.respostas).length > 0;
  } catch { return false; }
}
const analise = () => analisar(CORPUS, S.respostas, new Set(S.linhasVermelhas), { margem: S.margem });
const pergunta = (a) => proximaPergunta(CORPUS, S.respostas, a.estados,
  { complementar: S.complementar, linhasVermelhas: new Set(S.linhasVermelhas), margem: S.margem });

// ── ações ───────────────────────────────────────────────────────────────────
function responder(q, valor, linhaVermelha) {
  const antes = analise();
  const anterior = S.respostas[q.id];
  S.respostas = { ...S.respostas, [q.id]: valor };
  const lv = new Set(S.linhasVermelhas);
  if (linhaVermelha) lv.add(q.id); else lv.delete(q.id);
  S.linhasVermelhas = [...lv];
  const depois = analise();
  // Rastro é append-only: revisar não sobrescreve o registro original (B11).
  S.rastro.push({
    pergunta: { id: q.id, tipo: q.tipo, fase: q.fase, pergunta: q.pergunta, label: q.label },
    resposta: valor, linhaVermelha: !!linhaVermelha,
    revisaoDe: anterior !== undefined ? anterior : null,
    transicoes: transicoes(antes, depois),
  });
  S.editando = null;
  if (!pergunta(depois)) S.tela = "resultado";
  salvar(); render();
}
function editar(eixoId) { S.editando = eixoId; S.tela = "entrevista"; render(); }
function reiniciar() {
  if (!confirm("Isto apaga todas as suas respostas e o rastro. Continuar?")) return;
  Object.assign(S, { tela: "abertura", respostas: {}, linhasVermelhas: [], rastro: [], complementar: false, editando: null });
  try { localStorage.removeItem(CHAVE); } catch {}
  render();
}
function baixar(nome, texto, tipo = "text/plain") {
  const url = URL.createObjectURL(new Blob([texto], { type: `${tipo};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url; a.download = nome; document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}
function exportarSessao() {
  baixar("sessao-match-presidenciaveis.json",
    JSON.stringify({ v: 1, corpusVersion: CORPUS.corpusVersion, respostas: S.respostas,
                     linhasVermelhas: S.linhasVermelhas, rastro: S.rastro, margem: S.margem }, null, 2),
    "application/json");
}
function importarSessao(arquivo) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const d = JSON.parse(fr.result);
      if (d.corpusVersion !== CORPUS.corpusVersion &&
          !confirm(`Esta sessão foi gravada com o corpus ${d.corpusVersion}; o atual é ${CORPUS.corpusVersion}. Importar mesmo assim?`)) return;
      Object.assign(S, { respostas: d.respostas || {}, linhasVermelhas: d.linhasVermelhas || [],
                         rastro: d.rastro || [], margem: d.margem ?? 0.05, editando: null });
      S.tela = pergunta(analise()) ? "entrevista" : "resultado";
      salvar(); render();
    } catch (e) { alert("Arquivo de sessão inválido: " + e.message); }
  };
  fr.readAsText(arquivo);
}
function exportarRelatorio() {
  baixar("comparacao-de-propostas.txt", montarRelatorio(CORPUS, analise(), S.rastro, {}));
}

// ── componentes ─────────────────────────────────────────────────────────────
function citacaoHTML(p) {
  return `<div class="cit${p.interpretacao ? " inferida" : ""}">
    ${h(p.citacao.texto)}
    <span class="fonte">${h(p.citacao.fonte)} · ${h(p.citacao.local)}${p.citacao.contexto ? ` · ${h(p.citacao.contexto)}` : ""}</span>
    ${p.interpretacao ? `<div class="interp"><b>Interpretação do curador — a postura não está literal nesta citação:</b> ${h(p.interpretacao)}</div>` : ""}
  </div>`;
}

function tabelaRanking(a, compacta) {
  const linhas = [];
  const push = (id, i) => {
    const s = a.estados[id];
    const lider = a.ranking.lideres.includes(id);
    const morto = s.estado === "eliminado";
    const cobBaixa = s.cobertura !== null && s.cobertura < 0.7;
    linhas.push(`<tr class="${lider ? "lider" : ""} ${morto ? "morto" : ""}">
      <td class="n">${i ?? ""}</td>
      <td>${h(nomeDe(id))}${lider && a.ranking.empate ? ' <span class="selo">empatado</span>' : ""}
        ${morto ? `<div class="mini perigo-cor">${h(explicarMotivo(CORPUS, s.motivo))}</div>` : ""}
        ${!compacta && s.afinidade !== null ? `<div class="barra"><i style="width:${(s.afinidade * 100).toFixed(0)}%"></i></div>` : ""}</td>
      <td class="n">${f3(s.afinidade)}</td>
      <td class="n ${cobBaixa ? "cob-baixa" : ""}">${f2(s.cobertura)}</td>
    </tr>`);
  };
  a.ranking.ordem.forEach((id, i) => push(id, i + 1));
  a.ranking.semSinal.forEach((id) => push(id, "—"));
  CORPUS.candidatos.filter((c) => a.estados[c.id].estado === "eliminado").forEach((c) => push(c.id, "×"));
  return `<table class="rank"><thead><tr><th></th><th>Candidatura</th><th>Afinidade</th><th>Cobertura</th></tr></thead>
    <tbody>${linhas.join("")}</tbody></table>`;
}

const PROXIMIDADE = 0.25;   // "logo atrás": 5× a margem padrão de empate
function alertasSilencio(a) {
  const out = [];
  for (const id of a.ranking.lideres) {
    const s = a.estados[id];
    if (s.cobertura !== null && s.cobertura < 0.7)
      out.push(`<b>${h(nomeDe(id))}</b> lidera com cobertura ${f2(s.cobertura)}: pronunciou-se sobre menos de 70% do peso do que você respondeu.`);
    // "quem vem atrás" é quem está logo atrás — citar alguém com afinidade 0,21
    // como referência de cobertura seria ruído, não informação.
    // Cobertura maior por perto — inclusive de outro líder empatado.
    const perto = a.ranking.ordem.filter((x) => x !== id &&
      a.estados[x].afinidade >= s.afinidade - PROXIMIDADE &&
      a.estados[x].cobertura !== null && s.cobertura !== null && a.estados[x].cobertura > s.cobertura + 0.15);
    const empatados = perto.filter((x) => a.ranking.lideres.includes(x));
    const atras = perto.filter((x) => !a.ranking.lideres.includes(x));
    if (empatados.length)
      out.push(`<b>${h(nomeDe(id))}</b> está empatado com ${empatados.map((x) => h(nomeDe(x))).join(", ")}, que se pronunciaram sobre bem mais do que você respondeu (cobertura ${empatados.map((x) => f2(a.estados[x].cobertura)).join(", ")} contra ${f2(s.cobertura)}). Empatar com quem falou o dobro não é o mesmo empate.`);
    if (atras.length)
      out.push(`<b>${h(nomeDe(id))}</b> lidera com cobertura menor que ${atras.map((x) => h(nomeDe(x))).join(", ")}, logo atrás — falou menos e por isso errou menos.`);
  }
  if (!out.length) return "";
  return `<div class="aviso"><h3>Silêncio — leia antes do ranking</h3>
    <p class="mini">Ausência de posição nunca soma nem subtrai. É por isso que reduz a cobertura, e é por isso que quem fala pouco sobe fácil.</p>
    <ul class="mini">${out.map((x) => `<li>${x}</li>`).join("")}</ul></div>`;
}

// ── telas ───────────────────────────────────────────────────────────────────
function telaAbertura() {
  const cls = classificarEixos(CORPUS, CORPUS.candidatos);
  const temSessao = Object.keys(S.respostas).length > 0;
  return `
  <h1>Onde as candidaturas realmente divergem</h1>
  <p>Este instrumento percorre as posições declaradas nos planos de governo de
     ${CORPUS.candidatos.length} candidaturas e pergunta a <b>sua</b> posição sobre os
     ${cls.divisivos.length} pontos em que elas divergem entre si. No fim, mostra quem está mais
     alinhado a você — <b>e o que ficou sem resposta</b>, que costuma importar mais.</p>

  <div class="aviso perigo">
    <h3>O que este instrumento não é</h3>
    <p>Ele <b>não recomenda voto</b>. Compara posições declaradas em documentos e ignora, por
       construção: histórico de mandato, capacidade de execução, coalizão, quem financia a campanha
       e a distância conhecida entre plano de governo e governo.</p>
    <p>A escolha de quais eixos existem e de qual trecho representa cada candidatura é o maior viés
       deste sistema, e ele é invisível no resultado. Cada citação aparece na tela com a fonte, para
       que você possa discordar da curadoria enquanto usa o instrumento.</p>
  </div>

  <div class="aviso"><h3>Estado do corpus</h3>
    <p class="mini">${h(CORPUS.aviso)}</p>
    <ul class="mini">${(CORPUS.curadoria.limitacoesConhecidas || []).map((x) => `<li>${h(x)}</li>`).join("")}</ul>
  </div>

  <div class="cartao">
    <h2>Como funciona</h2>
    <div class="eixo-linha"><b>Perguntas em ordem de poder de separação.</b> O motor pergunta primeiro
      o eixo que divide o campo ao meio e tem mais peso, não o mais importante em abstrato. Um ponto em que
      todos concordam não separa ninguém e por isso não é perguntado.</div>
    <div class="eixo-linha"><b>Discordar junto conta como concordar.</b> Se você é contra algo e o plano
      também é, isso é alinhamento.</div>
    <div class="eixo-linha"><b>Não sei ≠ indiferente ≠ não perguntado.</b> Os três são registrados
      separadamente e nenhum deles pesa no resultado.</div>
    <div class="eixo-linha"><b>Silêncio não conta a favor.</b> Se o plano não fala de um assunto, isso não
      vira concordância — vira <i>cobertura</i> menor, exibida sempre ao lado da afinidade.</div>
    <div class="eixo-linha"><b>Linha vermelha elimina.</b> Você pode marcar um ponto como inegociável;
      quem divergir dele sai da comparação, com a citação que causou a eliminação.</div>
    <div class="eixo-linha"><b>Nada sai do seu navegador.</b> Não há servidor, não há telemetria, não há
      requisição externa. A sessão fica salva só neste aparelho.</div>
  </div>

  <div class="acoes">
    <button class="primario" data-acao="comecar">${temSessao ? "Continuar de onde parei" : "Começar"}</button>
    ${temSessao ? '<button data-acao="reiniciar">Recomeçar do zero</button>' : ""}
    <button data-acao="importar">Importar sessão</button>
    <input type="file" id="arq" accept="application/json" class="oculto">
  </div>
  <p class="mini">Corpus ${h(CORPUS.corpusVersion)} · ${CORPUS.candidatos.length} candidaturas ·
     ${Object.keys(CORPUS.eixos).length} eixos (${cls.divisivos.length} divisivos, ${cls.unanimes.length} unânimes,
     ${cls.unilaterais.length} unilaterais) · margem de empate ${S.margem.toFixed(2)}</p>`;
}

function telaEntrevista() {
  const a = analise();
  const q = S.editando
    ? { tipo: "eixo", id: S.editando, ...CORPUS.eixos[S.editando], revisao: true }
    : pergunta(a);
  if (!q) { S.tela = "resultado"; return telaResultado(); }

  const respondidas = Object.keys(S.respostas).length;
  const divisivosAbertos = a.classes.divisivos.filter((d) => S.respostas[d.eixo] === undefined).length;
  const jaLV = S.linhasVermelhas.includes(q.id);

  let porque = "";
  if (q.tipo === "eixo" && q.fase === 1) {
    const favor = CORPUS.candidatos.filter((c) => a.estados[c.id].estado === "vivo" && posturaDe(c.id, q.id)?.postura === "favor");
    const contra = CORPUS.candidatos.filter((c) => a.estados[c.id].estado === "vivo" && posturaDe(c.id, q.id)?.postura === "contra");
    porque = `<div class="porque">
      Perguntado agora porque separa <b>${q.separa.favor} × ${q.separa.contra}</b> candidaturas
      (${q.separa.separacoes} pares) com peso ${q.peso} — ganho ${q.separa.ganho}, o maior ainda em aberto.
      ${q.separa.mudos ? `${q.separa.mudos} candidatura(s) não dizem nada sobre isto.` : ""}
      <br><b class="ok-cor">A favor:</b> ${favor.map((c) => h(c.nome)).join(", ") || "—"}
      <br><b class="perigo-cor">Contra:</b> ${contra.map((c) => h(c.nome)).join(", ") || "—"}
      ${q.entreLideres ? `<br><span class="selo destaque">desempata a liderança</span> É a única coisa que separa
        ${q.desempata.map((x) => h(nomeDe(x))).join(" e ")}, hoje empatados.` : ""}
    </div>`;
  } else if (q.tipo === "eixo" && q.fase === 4) {
    porque = `<div class="porque"><span class="selo comp">não separa ninguém</span>
      ${q.categoria === "unanime"
        ? `Todas as candidaturas vivas declaram a mesma posição aqui.`
        : `${q.campo.nFalam} candidatura(s) se pronunciam, ${q.campo.mudos} não dizem nada — e nenhuma se opõe.`}
      Responder <b>não altera o ranking</b> (incluir isto inverteria a ordem em favor de quem falou pouco).
      Vai para uma métrica separada: o quanto este campo eleitoral inteiro representa você.
      Faltam ${q.restantes} perguntas desta fase; você pode parar quando quiser.</div>`;
  } else if (q.tipo === "portao") {
    porque = `<div class="porque"><span class="selo">portão</span> ${h(q.nota || "")}</div>`;
  } else if (q.revisao) {
    porque = `<div class="porque">Você está <b>revisando</b> uma resposta já dada
      (${h(S.respostas[q.id])}). O registro original fica no rastro; a alteração é anexada, não sobrescrita.</div>`;
  }

  const podeLV = q.tipo === "eixo";
  return `
  <div class="painel">
    <div>
      <div class="cartao">
        <span class="selo">${q.tipo === "portao" ? "Portão" : `Eixo · ${h(q.dominio || "")}`}</span>
        ${q.fase === 4 ? '<span class="selo comp">fase complementar</span>' : ""}
        <div class="pergunta">${h(q.pergunta)}</div>
        ${q.formulacaoNeutra === false ? `<div class="aviso"><h3>Redação não neutra</h3><p class="mini">${h(q.notaRedacao)}</p></div>` : ""}
        ${porque}
        <div class="respostas" data-q="${h(q.id)}">
          ${q.tipo === "portao"
            ? `<button data-v="sim"><b>Sim</b></button><button data-v="nao"><b>Não</b></button>`
            : `<button data-v="concordo"><b>Concordo</b><i>Sou a favor desta política</i></button>
               <button data-v="discordo"><b>Discordo</b><i>Sou contra esta política</i></button>
               <button data-v="indiferente"><b>Indiferente</b><i>Não quero que este ponto pese</i></button>
               <button data-v="ns"><b>Não sei</b><i>Não tenho posição formada; fica registrado como pendência</i></button>`}
        </div>
        ${podeLV ? `<div class="lv ${jaLV ? "ativa" : ""}">
          <label><input type="checkbox" id="lv" ${jaLV ? "checked" : ""}>
            <span><b>Isto é inegociável para mim.</b> Não é "peso alto": qualquer candidatura que
            divirja aqui é <b>eliminada</b> da comparação, por mais que concorde com você no resto.
            Reversível a qualquer momento.</span></label>
        </div>` : ""}
        ${S.editando ? '<div class="acoes"><button data-acao="cancelar-edicao">Cancelar revisão</button></div>' : ""}
      </div>

      ${a.diagnostico.rankingVazioComRespostas ? `<div class="aviso"><h3>O ranking está vazio — e isso tem explicação</h3>
        <p class="mini">${a.diagnostico.semEixosDiscriminantes
          ? "Não sobrou nenhum eixo em que as candidaturas ainda vivas divirjam entre si."
          : "Nenhuma candidatura viva declarou posição sobre o que você respondeu."}
        ${a.diagnostico.reclassificados.length ? `Depois das eliminações, ${a.diagnostico.reclassificados.map((e) => h(eixoDe(e))).join(", ")}
          passaram a ter um lado só e saíram da conta.` : ""}</p></div>` : ""}

      <div class="cartao">
        <h2>Rastro</h2>
        <p class="mini">${respondidas} resposta(s). Clique para revisar — o registro original é preservado.</p>
        <ul class="rastro">${S.rastro.map((p, i) => `<li>
          <b class="mini">${i + 1}</b>
          <span>${h(p.pergunta.label || p.pergunta.pergunta)}${p.revisaoDe ? ' <span class="selo">revisão</span>' : ""}
            ${p.transicoes.ranking.mudou ? `<div class="mini">liderança: ${(p.transicoes.lideres.para.map(nomeDe).join(", ")) || "—"}</div>` : ""}
            ${p.transicoes.estados.length ? `<div class="mini perigo-cor">${p.transicoes.estados.map((e) => `${h(nomeDe(e.id))}: ${e.de}→${e.para}`).join(" · ")}</div>` : ""}
          </span>
          <span class="r">${h(p.resposta)}</span>
          ${p.pergunta.tipo === "eixo" ? `<button class="fantasma" data-editar="${h(p.pergunta.id)}">revisar</button>` : ""}
        </li>`).join("") || '<li class="mini">Nada respondido ainda.</li>'}</ul>
      </div>
    </div>

    <div>
      <div class="cartao">
        <h2>Estado das candidaturas</h2>
        <p class="mini">Afinidade e cobertura andam sempre juntas. Afinidade sem cobertura mente.</p>
        ${tabelaRanking(a, true)}
        <p class="mini" style="margin-top:.6rem">${divisivosAbertos} eixo(s) divisivo(s) ainda em aberto.
        Margem de empate ${S.margem.toFixed(2)}.</p>
      </div>
      ${S.linhasVermelhas.length ? `<div class="cartao">
        <h2 class="perigo-cor">Linhas vermelhas</h2>
        ${S.linhasVermelhas.map((e) => `<div class="eixo-linha"><b>${h(eixoDe(e))}</b>
          <button class="fantasma" data-remover-lv="${h(e)}">remover</button></div>`).join("")}
      </div>` : ""}
      <div class="cartao">
        <h2>Sessão</h2>
        <div class="acoes">
          <button data-acao="resultado">Ver resultado agora</button>
          <button data-acao="exportar-sessao">Exportar</button>
          <button data-acao="reiniciar">Recomeçar</button>
        </div>
        <p class="mini">Salvo neste aparelho, em <code>localStorage</code>. Nada é enviado a lugar nenhum.</p>
      </div>
    </div>
  </div>`;
}

function blocoEixos(a, id, chave, titulo) {
  const s = a.estados[id];
  if (!s[chave].length) return "";
  return `<details><summary>${titulo} (${s[chave].length})</summary><div class="corpo">
    ${s[chave].map((e) => {
      const p = posturaDe(id, e);
      return `<div class="eixo-linha"><b>${h(eixoDe(e))}</b>
        <span class="tag">peso ${CORPUS.eixos[e].peso} · o plano é ${p.postura === "favor" ? "favorável" : "contrário"} · você respondeu "${h(a.respostas[e])}"</span>
        ${citacaoHTML(p)}</div>`;
    }).join("")}</div></details>`;
}

function telaResultado() {
  const a = analise();
  const q = pergunta(a);
  const compPend = [...a.classes.unanimes, ...a.classes.unilaterais].filter((c) => S.respostas[c.eixo] === undefined).length;

  return `
  <h1>Resultado</h1>
  <div class="aviso perigo"><h3>Isto não é uma recomendação de voto</h3>
    <p>O que segue é uma comparação entre as posições que você declarou e as posições declaradas em
       documentos de campanha. Não considera histórico, execução, coalizão nem financiamento. Leia os
       planos completos — os links estão no fim desta página.</p></div>

  ${a.todosEliminados ? `<div class="aviso perigo"><h3>Todas as candidaturas foram eliminadas</h3>
    <p>Suas linhas vermelhas eliminaram o campo inteiro. Isso é um resultado, não um erro — e abaixo
       está a ordem que existiria sem elas, para que você possa decidir se a linha vermelha
       continua valendo a pena.</p></div>` : ""}

  ${a.ranking.lideres.length ? `
    <h2>${a.ranking.empate ? `Empate declarado entre ${a.ranking.lideres.length} candidaturas` : "Mais alinhado a você"}</h2>
    ${a.ranking.empate ? `<p class="mini">Não há ordem entre elas: a diferença está dentro da margem de
      ${S.margem.toFixed(2)}. A margem existe porque os pesos dos eixos foram escolhidos à mão e não têm
      precisão para separar 0,84 de 0,81.</p>` : ""}
    <div class="lideres">${a.ranking.lideres.map((id) => `<div class="lider-cartao">
      <h3>${h(nomeDe(id))}</h3>
      <div class="metrica">
        <div><b>${f3(a.estados[id].afinidade)}</b><small>afinidade</small></div>
        <div><b class="${a.estados[id].cobertura < 0.7 ? "cob-baixa" : ""}">${f2(a.estados[id].cobertura)}</b><small>cobertura</small></div>
      </div>
      <p class="mini">${a.estados[id].alinhados.length} alinhamentos · ${a.estados[id].divergentes.length} divergências ·
         ${a.estados[id].silencios.length} silêncios</p>
      ${cand(id).planoUrl ? `<p class="mini"><a href="${h(cand(id).planoUrl)}" target="_blank" rel="noopener noreferrer">Ler o plano de governo integral →</a></p>` : ""}
    </div>`).join("")}</div>` : ""}

  ${alertasSilencio(a)}

  ${a.diagnostico.reclassificados.length || a.diagnostico.rankingVazioComRespostas ? `<div class="aviso">
    <h3>O que as eliminações fizeram com a conta</h3>
    ${a.diagnostico.reclassificados.length ? `<p class="mini">Depois de eliminar candidaturas,
      ${a.diagnostico.reclassificados.length} eixo(s) ficaram com um lado só e deixaram de separar quem
      sobrou — saíram do ranking e foram para o consenso do campo:
      <b>${a.diagnostico.reclassificados.map((e) => h(eixoDe(e))).join(", ")}</b>.
      É por isso que as afinidades mudaram de escala: o ranking passou a se apoiar em menos eixos.</p>` : ""}
    ${a.diagnostico.rankingVazioComRespostas ? `<p class="mini">Não sobrou nenhum eixo em que as candidaturas
      vivas divirjam entre si, então não há afinidade a calcular. Remova uma linha vermelha para ver a
      comparação completa.</p>` : ""}
  </div>` : ""}

  <div class="cartao">
    <h2>Ranking completo</h2>
    <p class="mini"><b>Afinidade</b> mede alinhamento <b>nos pontos em que as candidaturas divergem entre si</b> —
      não é percentual de concordância com o plano. Um eleitor que concorda com 90% de um plano pode ver
      afinidade 0,55, porque tudo em que o campo pensa igual fica fora da conta.
      <b>Cobertura</b> é a fração do que você respondeu sobre a qual aquela candidatura se pronunciou.</p>
    ${tabelaRanking(a, false)}
    ${a.ranking.semSinal.length ? `<p class="mini">Sem afinidade calculável (não declararam nada sobre o que você
      respondeu): ${a.ranking.semSinal.map((x) => h(nomeDe(x))).join(", ")}. Ausência de posição não é zero
      e não é concordância; ficam fora da ordem.</p>` : ""}
  </div>

  <h2>Por candidatura</h2>
  <p class="mini">Cada alinhamento e cada divergência vem com a citação que o sustenta. Discorde da curadoria
     se ela estiver errada — é para isso que a fonte está aqui.</p>
  ${[...a.ranking.ordem, ...a.ranking.semSinal].map((id) => `<details><summary>${h(nomeDe(id))} —
     afinidade ${f3(a.estados[id].afinidade)} · cobertura ${f2(a.estados[id].cobertura)}</summary>
     <div class="corpo">
       ${blocoEixos(a, id, "alinhados", "Por que se alinha")}
       ${blocoEixos(a, id, "divergentes", "Divergências")}
       ${a.estados[id].silencios.length ? `<details><summary>Silêncios (${a.estados[id].silencios.length})</summary>
         <div class="corpo"><p class="mini">Eixos que você respondeu e sobre os quais este plano não diz nada.
         Não somam nem subtraem — e é por isso que reduzem a cobertura.</p>
         ${a.estados[id].silencios.map((e) => `<div class="eixo-linha"><b>${h(eixoDe(e))}</b>
           <span class="tag">peso ${CORPUS.eixos[e].peso}</span></div>`).join("")}</div></details>` : ""}
       ${a.estados[id].inconclusivos.length ? `<p class="mini">Você respondeu "não sei" em
         ${a.estados[id].inconclusivos.length} eixo(s) em que este plano declara posição:
         ${a.estados[id].inconclusivos.map((e) => h(eixoDe(e))).join(", ")}.</p>` : ""}
       ${a.estados[id].indiferentes.length ? `<p class="mini">Você marcou como indiferente
         ${a.estados[id].indiferentes.length} eixo(s) em que este plano declara posição:
         ${a.estados[id].indiferentes.map((e) => h(eixoDe(e))).join(", ")}.</p>` : ""}
     </div></details>`).join("")}

  ${Object.values(a.estados).some((s) => s.estado === "eliminado") ? `
    <h2 class="perigo-cor">Eliminadas</h2>
    <p class="mini">Nenhuma candidatura some em silêncio: cada eliminação vem com a citação que a causou.</p>
    ${CORPUS.candidatos.filter((c) => a.estados[c.id].estado === "eliminado").map((c) => {
      const m = a.estados[c.id].motivo;
      return `<div class="cartao"><h3>${h(nomeDe(c.id))}</h3>
        <p class="mini">${h(explicarMotivo(CORPUS, m))}</p>
        ${m.tipo === "linha-vermelha" ? `<p class="mini">Eixo marcado por você como inegociável:
          <b>${h(eixoDe(m.eixo))}</b></p>${citacaoHTML({ citacao: m.citacao, interpretacao: m.interpretacao })}` : ""}</div>`;
    }).join("")}
    ${a.contrafactual ? `<details><summary>Ranking contrafactual — a ordem que existiria sem nenhuma linha vermelha</summary>
      <div class="corpo"><table class="rank"><tbody>${a.contrafactual.ranking.ordem.map((id, i) =>
        `<tr><td class="n">${i + 1}</td><td>${h(nomeDe(id))}</td>
         <td class="n">${f3(a.contrafactual.estados[id].afinidade)}</td>
         <td class="n">${f2(a.contrafactual.estados[id].cobertura)}</td></tr>`).join("") ||
        '<tr><td class="mini">nenhuma afinidade calculável</td></tr>'}</tbody></table></div></details>` : ""}` : ""}

  <h2>Consenso do campo</h2>
  <p class="mini">Eixos que <b>não separam ninguém</b> e por isso não entram no ranking. Ficam de fora porque
     incluí-los inverteria a ordem em favor de quem falou pouco — mas são, muitas vezes, as afirmações mais
     úteis que este instrumento consegue fazer.</p>
  ${a.campo.respondidos ? `<div class="cartao">
    <div class="metrica">
      <div><b>${f3(a.campo.afinidade)}</b><small>afinidade com o campo</small></div>
      <div><b>${f2(a.campo.cobertura)}</b><small>cobertura</small></div>
    </div>
    <p class="mini">Outra pergunta, outro número: não "quem é mais parecido comigo", mas "o quanto este campo
       eleitoral inteiro me representa". ${a.campo.respondidos} de ${a.campo.total} eixos respondidos.
       Afinidade com o campo baixa significa que nenhum ranking entre estas candidaturas conserta o problema.</p>
    ${[...a.ranking.ordem].filter((id) => a.estados[id].complementar.afinidade !== null).length ? `
      <p class="mini"><b>Por candidatura, fora do ranking</b> — é aqui que candidaturas empatadas nos eixos
      divisivos se separam:</p>
      <table class="rank"><tbody>${a.ranking.ordem.filter((id) => a.estados[id].complementar.afinidade !== null)
        .map((id) => `<tr><td>${h(nomeDe(id))}</td>
          <td class="n">${f3(a.estados[id].complementar.afinidade)}</td>
          <td class="n">${f2(a.estados[id].complementar.cobertura)}</td></tr>`).join("")}</tbody></table>` : ""}
  </div>` : `<div class="aviso"><h3>Fase complementar não respondida</h3>
    <p class="mini">Há ${compPend} eixo(s) em que o campo fala com uma voz só ou em que ninguém se opõe.
    Eles não afetam o ranking, mas respondem uma pergunta diferente — e são o que separa candidaturas
    que hoje estão empatadas.</p>
    <button class="primario" data-acao="complementar">Responder a fase complementar (${compPend} perguntas)</button></div>`}

  <details><summary>Unânimes (${a.classes.unanimes.length}) e unilaterais (${a.classes.unilaterais.length})</summary>
    <div class="corpo">
      ${a.classes.unanimes.map((u) => `<div class="eixo-linha"><b>${h(eixoDe(u.eixo))}</b>
        <span class="tag">todas as ${u.nFalam} candidaturas vivas são ${u.postura === "favor" ? "a favor" : "contrárias"}</span></div>`).join("")}
      ${a.classes.unilaterais.map((u) => `<div class="eixo-linha"><b>${h(eixoDe(u.eixo))}</b>
        <span class="tag">${u.nFalam} ${u.postura === "favor" ? "a favor" : "contrárias"}, ${u.mudos} não dizem nada — e ninguém se opõe</span></div>`).join("")}
    </div></details>

  <h2>Não investigado</h2>
  <p class="mini">Pares de candidaturas próximas e a única coisa que as separa, ainda sem resposta sua.
     Esta seção é a defesa contra o fechamento prematuro: o instrumento existe tanto para dizer o que ficou
     de fora quanto para dizer o que fechou.</p>
  ${a.contrastes.naoInvestigados.length ? a.contrastes.naoInvestigados.map((t) => {
    const desempata = a.contrastes.desempates.some((d) => d.entre.join() === t.entre.join());
    return `<div class="cartao"><h3>${t.entre.map((x) => h(nomeDe(x))).join("  vs  ")}
      ${desempata ? '<span class="selo destaque">desempataria a liderança</span>' : ""}</h3>
      <p class="mini"><b>${h(eixoDe(t.discriminador))}</b> — ${h(t.motivo)}</p>
      ${t.nota ? `<p class="mini">${h(t.nota)}</p>` : ""}
      <button data-editar="${h(t.discriminador)}">Responder este eixo</button></div>`;
  }).join("") : '<p class="mini">Nenhum. Todos os contrastes ativos foram investigados.</p>'}
  ${a.contrastes.investigados.length ? `<details><summary>Investigados (${a.contrastes.investigados.length})</summary>
    <div class="corpo">${a.contrastes.investigados.map((t) => `<div class="eixo-linha">
      ${t.entre.map((x) => h(nomeDe(x))).join(" vs ")} — <b>${h(eixoDe(t.discriminador))}</b> =
      "${h(t.resposta)}" → inclina para <b>${t.inclina ? h(nomeDe(t.inclina)) : "nenhum lado"}</b></div>`).join("")}</div></details>` : ""}

  <h2>Planos de governo integrais</h2>
  <p class="mini">As citações deste instrumento são resumos. Os documentos abaixo prevalecem sobre qualquer
     coisa dita aqui — se você chegou a uma conclusão, o passo seguinte é ler o plano inteiro.</p>
  <table class="planos"><tbody>${CORPUS.candidatos.map((c) => `<tr>
    <td>${h(c.nome)}${c.partido ? ` <span class="tag">${h(c.partido)}</span>` : ""}</td>
    <td>${c.planoUrl ? `<a href="${h(c.planoUrl)}" target="_blank" rel="noopener noreferrer">${h(c.planoUrl)}</a>` : "—"}</td>
  </tr>`).join("")}</tbody></table>

  <div class="acoes">
    ${q ? '<button class="primario" data-acao="continuar">Continuar respondendo</button>' : ""}
    <button data-acao="relatorio">Baixar relatório completo (.txt)</button>
    <button data-acao="exportar-sessao">Exportar sessão (.json)</button>
    <button data-acao="ver-relatorio">Ver relatório na tela</button>
    <button data-acao="reiniciar">Recomeçar</button>
  </div>
  <pre class="relatorio oculto" id="rel"></pre>

  <div class="aviso"><h3>Curadoria</h3>
    <p class="mini"><b>Método:</b> ${h(CORPUS.curadoria.metodo)}</p>
    <p class="mini"><b>Critério de inclusão:</b> ${h(CORPUS.curadoria.criterioDeInclusao)}</p>
    <p class="mini"><b>Responsável:</b> ${h(CORPUS.curadoria.responsavel || "não identificado")} ·
       <b>Revisão independente:</b> ${h(CORPUS.curadoria.revisadoPor || "nenhuma")}</p>
    <ul class="mini">${(CORPUS.curadoria.limitacoesConhecidas || []).map((x) => `<li>${h(x)}</li>`).join("")}</ul>
  </div>`;
}

// ── render + eventos ────────────────────────────────────────────────────────
function render() {
  document.getElementById("topo-escopo").textContent =
    `${CORPUS.escopo.eleicao} · ${CORPUS.escopo.cargo}`;
  document.getElementById("topo-versao").textContent =
    `corpus ${CORPUS.corpusVersion} · ${CORPUS.status}`;
  app.innerHTML = S.tela === "abertura" ? telaAbertura()
                : S.tela === "resultado" ? telaResultado()
                : telaEntrevista();
  window.scrollTo({ top: 0 });
}

app.addEventListener("click", (ev) => {
  const alvo = ev.target.closest("[data-acao], [data-v], [data-editar], [data-remover-lv]");
  if (!alvo) return;
  if (alvo.dataset.v !== undefined) {
    const q = S.editando
      ? { tipo: "eixo", id: S.editando, ...CORPUS.eixos[S.editando] }
      : pergunta(analise());
    if (q) responder(q, alvo.dataset.v, document.getElementById("lv")?.checked);
    return;
  }
  if (alvo.dataset.editar) return editar(alvo.dataset.editar);
  if (alvo.dataset.removerLv) {
    S.linhasVermelhas = S.linhasVermelhas.filter((x) => x !== alvo.dataset.removerLv);
    salvar(); render(); return;
  }
  switch (alvo.dataset.acao) {
    case "comecar": case "continuar": S.tela = "entrevista"; salvar(); render(); break;
    case "resultado": S.tela = "resultado"; salvar(); render(); break;
    case "cancelar-edicao": S.editando = null; render(); break;
    case "complementar": S.complementar = true; S.tela = "entrevista"; salvar(); render(); break;
    case "reiniciar": reiniciar(); break;
    case "exportar-sessao": exportarSessao(); break;
    case "relatorio": exportarRelatorio(); break;
    case "ver-relatorio": {
      const el = document.getElementById("rel");
      el.textContent = montarRelatorio(CORPUS, analise(), S.rastro, {});
      el.classList.toggle("oculto");
      break;
    }
    case "importar": {
      const inp = document.getElementById("arq");
      inp.onchange = () => inp.files[0] && importarSessao(inp.files[0]);
      inp.click(); break;
    }
  }
});

if (carregar()) S.tela = S.tela === "abertura" ? "abertura" : S.tela;
render();
