/**
 * Motor de alinhamento entre posições do usuário e posições declaradas em planos
 * de governo. Híbrido: ELIMINAÇÃO para o inegociável, ACUMULAÇÃO para o resto.
 *
 * Porte de `engine.js` do classificador clínico. Ver MOTOR-E-PORT-POLITICO.md.
 *
 * CONTRATO — nenhuma função deste arquivo pode quebrar isto:
 *   1. Pureza. Sem Date, sem Math.random, sem I/O, sem dependências. Todo estado
 *      é derivado de (corpus, respostas, linhasVermelhas) e recalculado do zero.
 *   2. Sem vencedor único imposto. `lideres` pode ter mais de um elemento.
 *   3. Ignorância ≠ negação. "ns" mantém a pendência e não move o score.
 *   4. Não perguntado ≠ inconclusivo ≠ indiferente. Três ausências distintas,
 *      preservadas até o relatório.
 *   5. Toda eliminação tem motivo estruturado, com a citação que a causou.
 *   6. Contraste nunca elimina. É sinal.
 *   7. Silêncio nunca soma nem subtrai; reduz `cobertura`.
 *   8. Eixo não discriminante (unânime ou unilateral) fica FORA de afinidade e
 *      cobertura, mesmo que respondido — ver §20 da especificação.
 *   9. Determinismo. Empates resolvidos lexicograficamente.
 *  10. Terminação. Toda pergunta devolvida consome uma variável não respondida.
 */

export const RESPOSTAS_VALIDAS = ["concordo", "discordo", "indiferente", "ns"];

/**
 * Como cada valor é escrito para o usuário. O motor guarda "indiferente" e "ns"
 * separados porque a distinção é do contrato (invariante 4); a tela mostra os dois
 * como escolhas de não opinar, e o relatório preserva a diferença.
 */
export const ROTULO_RESPOSTA = {
  concordo: "concordo", discordo: "discordo",
  indiferente: "não opinou", ns: "não soube", sim: "sim", nao: "não",
};
export const rotularResposta = (v) => ROTULO_RESPOSTA[v] ?? v;
export const MARGEM_PADRAO = 0.05;

const asSet = (x) => (x instanceof Set ? x : new Set(x || []));
const pesoDe = (corpus, eixo) => corpus.eixos[eixo]?.peso ?? 1;

/** Postura declarada por `cand` no `eixo`, ou null. */
export function postura(cand, eixo) {
  return cand.posicoes.find((p) => p.eixo === eixo) || null;
}

/**
 * Lógica de quatro valores, análoga a `testar()` do motor clínico.
 * Devolve: true alinhado · false divergente · null neutralizado (indiferente)
 *          · undefined sem sinal (não perguntado, "ns", ou candidato mudo).
 */
export function confrontar(resposta, postura) {
  if (resposta === undefined || resposta === "ns") return undefined;
  if (resposta === "indiferente") return null;
  if (!postura) return undefined;
  return (
    (resposta === "concordo" && postura.postura === "favor") ||
    (resposta === "discordo" && postura.postura === "contra")
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Eliminações — passada independente da classificação dos eixos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Linhas vermelhas e portões. Roda ANTES de qualquer cálculo de score, porque
 * a eliminação não depende de quais eixos são discriminantes: se o usuário
 * declarou um eixo inegociável, divergir nele elimina — inclusive num eixo
 * unânime, caso em que o campo inteiro cai e §21 manda mostrar o contrafactual.
 *
 * "ns" e "indiferente" NUNCA eliminam: ignorância e indiferença não são divergência.
 */
export function eliminacoes(corpus, respostas, linhasVermelhas = new Set()) {
  const lv = asSet(linhasVermelhas);
  const out = {};
  for (const cand of corpus.candidatos) {
    let motivo = null;
    for (const eixo of Object.keys(corpus.eixos)) {
      if (!lv.has(eixo)) continue;
      const p = postura(cand, eixo);
      if (confrontar(respostas[eixo], p) !== false) continue;
      motivo = { tipo: "linha-vermelha", eixo, postura: p.postura, citacao: p.citacao, interpretacao: p.interpretacao };
      break; // só a PRIMEIRA linha violada vira motivo — o relatório diz por que caiu
    }
    out[cand.id] = motivo;
  }
  for (const [id, portao] of Object.entries(corpus.portoes || {})) {
    if (portao.efeito !== "invalida-todos-se-nao") continue;
    if (respostas[id] !== "nao") continue;
    for (const cand of corpus.candidatos) {
      out[cand.id] = out[cand.id] || { tipo: "portao", portao: id, pergunta: portao.pergunta };
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Classificação dos eixos — §20
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reparte os eixos em quatro categorias, sobre o conjunto de candidatos `vivos`:
 *   divisivo    — há favor E contra. É o único que entra no ranking.
 *   unanime     — todos os vivos falaram, todos na mesma direção.
 *   unilateral  — só parte falou, sem oposição declarada.
 *   mudo        — nenhum vivo falou.
 * Incluir unânime ou unilateral no ranking INVERTE a ordem (§20). Fora.
 */
export function classificarEixos(corpus, vivos) {
  const divisivos = [], unanimes = [], unilaterais = [], mudos = [];
  for (const eixo of Object.keys(corpus.eixos)) {
    const falam = vivos.map((c) => postura(c, eixo)).filter(Boolean);
    const nFavor = falam.filter((p) => p.postura === "favor").length;
    const nContra = falam.filter((p) => p.postura === "contra").length;
    const info = { eixo, nFavor, nContra, nFalam: falam.length, mudos: vivos.length - falam.length,
                   peso: pesoDe(corpus, eixo), separacoes: nFavor * nContra };
    if (nFavor > 0 && nContra > 0) divisivos.push({ ...info, categoria: "divisivo" });
    else if (falam.length === 0) mudos.push({ ...info, categoria: "mudo", postura: null });
    else if (falam.length === vivos.length) unanimes.push({ ...info, categoria: "unanime", postura: falam[0].postura });
    else unilaterais.push({ ...info, categoria: "unilateral", postura: falam[0].postura });
  }
  return { divisivos, unanimes, unilaterais, mudos };
}

const setDe = (lista) => new Set(lista.map((x) => x.eixo));

// ─────────────────────────────────────────────────────────────────────────────
// avaliar() — score, afinidade, cobertura
// ─────────────────────────────────────────────────────────────────────────────

/**
 * avaliar(corpus, respostas, linhasVermelhas) → { [id]: estado do candidato }
 *
 * `opts.discriminantes` permite injetar o conjunto de eixos que entra no ranking
 * (usado pelo motor para congelá-lo a partir dos vivos). Sem ele, é derivado
 * dos candidatos não eliminados.
 */
export function avaliar(corpus, respostas, linhasVermelhas = new Set(), opts = {}) {
  const mortos = eliminacoes(corpus, respostas, linhasVermelhas);
  const vivos = corpus.candidatos.filter((c) => !mortos[c.id]);
  const classes = opts.classes || classificarEixos(corpus, vivos.length ? vivos : corpus.candidatos);
  const discriminantes = opts.discriminantes || setDe(classes.divisivos);

  const out = {};
  for (const cand of corpus.candidatos) {
    const acc = {
      rank: { score: 0, pesoDeclarado: 0, pesoRespondido: 0, pesoSilencioso: 0,
              alinhados: [], divergentes: [], silencios: [] },
      comp: { score: 0, pesoDeclarado: 0, pesoRespondido: 0, pesoSilencioso: 0,
              alinhados: [], divergentes: [], silencios: [] },
    };
    const inconclusivos = [], indiferentes = [];

    for (const eixo of Object.keys(corpus.eixos)) {
      const r = respostas[eixo];
      if (r === undefined) continue;
      const p = postura(cand, eixo);
      if (r === "ns") { if (p) inconclusivos.push(eixo); continue; }
      if (r === "indiferente") { if (p) indiferentes.push(eixo); continue; }
      const bucket = discriminantes.has(eixo) ? acc.rank : acc.comp;
      const peso = pesoDe(corpus, eixo);
      bucket.pesoRespondido += peso;
      if (!p) { bucket.silencios.push(eixo); bucket.pesoSilencioso += peso; continue; }
      bucket.pesoDeclarado += peso;
      if (confrontar(r, p)) { bucket.score += peso; bucket.alinhados.push(eixo); }
      else { bucket.score -= peso; bucket.divergentes.push(eixo); }
    }

    const norm = (b) => (b.pesoDeclarado ? (b.score + b.pesoDeclarado) / (2 * b.pesoDeclarado) : null);
    const cob = (b) => (b.pesoRespondido ? b.pesoDeclarado / b.pesoRespondido : null);

    out[cand.id] = {
      id: cand.id,
      estado: mortos[cand.id] ? "eliminado" : "vivo",
      motivo: mortos[cand.id] || null,
      score: acc.rank.score,
      afinidade: norm(acc.rank),
      cobertura: cob(acc.rank),
      pesoDeclarado: acc.rank.pesoDeclarado,
      pesoRespondido: acc.rank.pesoRespondido,
      pesoSilencioso: acc.rank.pesoSilencioso,
      alinhados: acc.rank.alinhados,
      divergentes: acc.rank.divergentes,
      silencios: acc.rank.silencios,
      inconclusivos,
      indiferentes,
      // Métricas dos eixos NÃO discriminantes. Nunca entram no ranking (§20);
      // existem para separar candidaturas que empatam nos eixos divisivos.
      complementar: {
        score: acc.comp.score,
        afinidade: norm(acc.comp),
        cobertura: cob(acc.comp),
        pesoDeclarado: acc.comp.pesoDeclarado,
        pesoRespondido: acc.comp.pesoRespondido,
        alinhados: acc.comp.alinhados,
        divergentes: acc.comp.divergentes,
        silencios: acc.comp.silencios,
      },
    };
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ranking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Afinidade `null` (o candidato não declarou nada sobre nada que foi respondido)
 * NÃO vira 0 — fica fora da ordem, listado à parte em `semSinal`.
 */
export function ranking(corpus, estados, margem = MARGEM_PADRAO) {
  const vivos = corpus.candidatos.filter((c) => estados[c.id]?.estado === "vivo");
  const comSinal = vivos.filter((c) => estados[c.id].afinidade !== null);
  const semSinal = vivos.filter((c) => estados[c.id].afinidade === null).map((c) => c.id);
  const ord = [...comSinal].sort(
    (a, b) => estados[b.id].afinidade - estados[a.id].afinidade || a.id.localeCompare(b.id)
  );
  if (!ord.length) return { ordem: [], lideres: [], empate: false, semSinal, margem };
  const topo = estados[ord[0].id].afinidade;
  const lideres = ord.filter((c) => topo - estados[c.id].afinidade <= margem).map((c) => c.id);
  return { ordem: ord.map((c) => c.id), lideres, empate: lideres.length > 1, semSinal, margem };
}

// ─────────────────────────────────────────────────────────────────────────────
// Consenso do campo — §20
// ─────────────────────────────────────────────────────────────────────────────

/**
 * afinidadeComOCampo: o quanto o campo eleitoral INTEIRO representa o usuário,
 * medido nos eixos NÃO discriminantes — unânimes e unilaterais (§20). São eixos
 * em que o campo fala com uma voz só, então a resposta do usuário não favorece
 * ninguém: é informação sobre o campo, não sobre a disputa. Nunca entra no ranking.
 *
 * `cobertura` aqui é o peso ponderado pela fração de candidatos vivos que de fato
 * declararam a posição: 1,00 num eixo unânime, menor num unilateral. Sem ela, um
 * campo em que uma única candidatura fala pareceria um campo comprometido.
 */
export function afinidadeComOCampo(corpus, respostas, classes) {
  let score = 0, peso = 0, pesoPonderado = 0, pesoTotal = 0;
  const eixos = [];
  for (const u of [...classes.unanimes, ...classes.unilaterais]) {
    const r = respostas[u.eixo];
    if (r === undefined || r === "ns" || r === "indiferente") continue;
    const alinha = (r === "concordo" && u.postura === "favor") || (r === "discordo" && u.postura === "contra");
    const w = u.peso;
    const fracao = u.nFalam / (u.nFalam + u.mudos);
    peso += w;
    pesoPonderado += w * fracao;
    pesoTotal += w;
    score += alinha ? w : -w;
    eixos.push({ eixo: u.eixo, categoria: u.categoria, postura: u.postura, resposta: r,
                 alinha, peso: w, nFalam: u.nFalam, mudos: u.mudos });
  }
  return {
    afinidade: peso ? (score + peso) / (2 * peso) : null,
    cobertura: pesoTotal ? pesoPonderado / pesoTotal : null,
    score, pesoDeclarado: peso, eixos,
    respondidos: eixos.length,
    total: classes.unanimes.length + classes.unilaterais.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Parada antecipada — quando a disputa já está decidida
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Intervalo em que a afinidade de cada candidatura ainda pode terminar, dadas as
 * respostas que faltam.
 *
 * A conta sai de uma identidade da §17: com `P` = peso declarado e `a` = peso
 * alinhado, `afinidade = (score + P) / (2P)` e `score = a − d`, logo
 *
 *     afinidade = a / P
 *
 * Então, se `R` é o peso ainda não respondido dos temas em que ESTA candidatura
 * declara posição, o piso é responder tudo contra ela (`a / (P+R)`) e o teto é
 * responder tudo a favor (`(a+R) / (P+R)`). Exato, não estimativa.
 *
 * RESSALVA: os limites valem para respostas comuns. Marcar um tema como
 * inegociável elimina candidaturas, e eliminar candidaturas pode tirar um tema da
 * conta (§20) — o que move os limites. Por isso `decisaoEstavel()` só é consultada
 * para PARAR de perguntar, nunca para impedir o usuário de continuar.
 */
export function limitesAfinidade(corpus, respostas, estados, classes) {
  const pendentes = classes.divisivos.filter((d) => respostas[d.eixo] === undefined);
  const out = {};
  for (const cand of corpus.candidatos) {
    const s = estados[cand.id];
    const P = s.pesoDeclarado;
    const alinhado = (P + s.score) / 2;
    const R = pendentes.reduce((n, d) => n + (postura(cand, d.eixo) ? d.peso : 0), 0);
    const total = P + R;
    out[cand.id] = total
      ? { min: alinhado / total, max: (alinhado + R) / total, emJogo: R, decidido: P }
      : { min: null, max: null, emJogo: 0, decidido: 0 };
  }
  return out;
}

/**
 * A decisão está estável quando nenhuma resposta futura consegue mudar QUEM
 * lidera. Uma candidatura ainda pode liderar se o teto dela alcança o maior piso
 * do campo, descontada a margem de empate; quando esse conjunto coincide com os
 * líderes de agora, perguntar mais não muda o desfecho.
 */
export function decisaoEstavel(corpus, respostas, estados, opts = {}) {
  const margem = opts.margem ?? MARGEM_PADRAO;
  const vivos = corpus.candidatos.filter((c) => estados[c.id]?.estado === "vivo");
  const classes = opts.classes || classificarEixos(corpus, vivos.length ? vivos : corpus.candidatos);
  const lim = limitesAfinidade(corpus, respostas, estados, classes);
  const comSinal = vivos.filter((c) => lim[c.id].min !== null);
  const lideres = ranking(corpus, estados, margem).lideres;

  if (!comSinal.length) {
    const restam = classes.divisivos.filter((d) => respostas[d.eixo] === undefined).length;
    return { estavel: restam === 0, possiveis: [], lideres, emDisputa: 0, restam };
  }
  const maiorPiso = Math.max(...comSinal.map((c) => lim[c.id].min));
  const possiveis = comSinal
    .filter((c) => lim[c.id].max >= maiorPiso - margem)
    .map((c) => c.id)
    .sort();
  const restam = classes.divisivos.filter((d) => respostas[d.eixo] === undefined).length;
  const igual = possiveis.length === lideres.length &&
    [...lideres].sort().every((x, i) => x === possiveis[i]);
  return { estavel: restam === 0 || igual, possiveis, lideres, limites: lim,
           emDisputa: possiveis.length, restam };
}

// ─────────────────────────────────────────────────────────────────────────────
// Contrastes — porte direto de diferenciais(). NUNCA elimina.
// ─────────────────────────────────────────────────────────────────────────────

export function contrastes(corpus, respostas, estados) {
  const vivo = (id) => estados[id]?.estado === "vivo";
  const naoInvestigados = [], investigados = [], inativos = [];
  for (const t of corpus.contrastes || []) {
    const [a, z] = t.entre;
    if (!vivo(a) || !vivo(z)) { inativos.push({ ...t, motivo: "um dos lados foi eliminado" }); continue; }
    const v = respostas[t.discriminador];
    if (v === undefined) naoInvestigados.push({ ...t, motivo: "não perguntado" });
    else if (v === "ns") naoInvestigados.push({ ...t, motivo: "resposta inconclusiva" });
    else if (v === "indiferente") naoInvestigados.push({ ...t, motivo: "declarado indiferente" });
    else investigados.push({ ...t, resposta: v, inclina: t.inclina?.[v] || null });
  }
  return { naoInvestigados, investigados, inativos };
}

// ─────────────────────────────────────────────────────────────────────────────
// proximaPergunta() — quatro fases, estritamente ordenadas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fase 1 — eixos divisivos, por ganho = nFavor × nContra × peso (§19).
 *          Alcance máximo é inútil aqui: um eixo unânime não separa ninguém.
 * Fase 2 — discriminadores de contraste entre dois lados vivos. Prioriza pares
 *          em que AMBOS estão na liderança: é a pergunta mais valiosa que o
 *          instrumento pode fazer (§22, regra 2).
 * Fase 3 — portões. Só entram quando já existe ranking — mas o ranking usado é
 *          o CONTRAFACTUAL SEM PORTÕES (correção do B1): um portão que elimina
 *          todos não pode impedir que os portões seguintes sejam perguntados.
 * Fase 4 — opcional (opts.complementar). Eixos não discriminantes, marcados
 *          como tal. Alimentam `afinidadeComOCampo` e a afinidade complementar;
 *          nunca o ranking.
 */
export function proximaPergunta(corpus, respostas, estados, opts = {}) {
  const margem = opts.margem ?? MARGEM_PADRAO;
  const vivos = corpus.candidatos.filter((c) => estados[c.id]?.estado === "vivo");
  const base = vivos.length ? vivos : corpus.candidatos;
  const classes = opts.classes || classificarEixos(corpus, base);

  // Fase 1 — eixos divisivos
  const cands = classes.divisivos
    .filter((d) => respostas[d.eixo] === undefined && d.separacoes > 0)
    .map((d) => ({ ...d, ganho: d.separacoes * d.peso }))
    .sort((a, b) => b.ganho - a.ganho || b.peso - a.peso || a.eixo.localeCompare(b.eixo));
  if (cands.length) {
    const m = cands[0];
    // §22, regra 2: se este eixo é o discriminador de um contraste entre dois
    // líderes empatados, é a pergunta mais valiosa do instrumento. A ORDEM segue
    // o ganho (§19); o que muda é o destaque.
    const lideres = new Set(ranking(corpus, estados, margem).lideres);
    const par = (corpus.contrastes || []).find(
      (t) => t.discriminador === m.eixo && t.entre.every((id) => lideres.has(id))
    );
    return {
      tipo: "eixo", fase: 1, id: m.eixo, ...corpus.eixos[m.eixo],
      naoDiscriminante: false,
      separa: { favor: m.nFavor, contra: m.nContra, mudos: m.mudos, separacoes: m.separacoes, ganho: m.ganho },
      entreLideres: Boolean(par), desempata: par ? par.entre : null,
    };
  }

  // Fase 2 — contrastes.
  // NOTA MEDIDA: com as travas 15 e 16 do §24 em vigor, todo discriminador de
  // contraste tem posturas opostas declaradas pelos dois lados do par; se ambos
  // estão vivos, o eixo é divisivo por construção e a fase 1 já o consumiu. Esta
  // fase portanto NÃO dispara neste corpus — o valor dos contrastes está no
  // relatório ("não investigado" quando a resposta foi "ns" ou "indiferente") e no
  // destaque de desempate da fase 1. O código fica porque a arquitetura de fases
  // é do contrato do motor e um corpus com contraste em eixo não divisivo
  // (por exemplo, com as travas relaxadas) voltaria a alcançá-la.
  const { naoInvestigados } = contrastes(corpus, respostas, estados);
  const abertos = naoInvestigados.filter((t) => respostas[t.discriminador] === undefined);
  if (abertos.length) {
    const lideres = new Set(ranking(corpus, estados, margem).lideres);
    const entreLideres = abertos.find((t) => t.entre.every((id) => lideres.has(id)));
    const t = entreLideres || abertos[0];
    return {
      tipo: "contraste", fase: 2, id: t.discriminador, ...corpus.eixos[t.discriminador],
      naoDiscriminante: !setDe(classes.divisivos).has(t.discriminador),
      entre: t.entre, nota: t.nota || null, inclina: t.inclina || null,
      entreLideres: Boolean(entreLideres),
    };
  }

  // Fase 3 — portões. Gatilho lido do estado SEM portões (correção do B1).
  const semPortoes = { ...respostas };
  for (const g of Object.keys(corpus.portoes || {})) delete semPortoes[g];
  const estadosSemPortoes = avaliar(corpus, semPortoes, opts.linhasVermelhas || new Set(), { classes });
  if (ranking(corpus, estadosSemPortoes, margem).ordem.length > 0) {
    const g = Object.keys(corpus.portoes || {}).find((k) => respostas[k] === undefined);
    if (g) return { tipo: "portao", fase: 3, id: g, ...corpus.portoes[g], naoDiscriminante: false };
  }

  // Fase 4 — encerramento complementar, opcional
  if (opts.complementar) {
    const comp = [...classes.unanimes, ...classes.unilaterais]
      .filter((c) => respostas[c.eixo] === undefined)
      .sort((a, b) => b.peso - a.peso || a.eixo.localeCompare(b.eixo));
    if (comp.length) {
      const m = comp[0];
      return {
        tipo: "eixo", fase: 4, id: m.eixo, ...corpus.eixos[m.eixo],
        naoDiscriminante: true, categoria: m.categoria,
        campo: { postura: m.postura, nFalam: m.nFalam, mudos: m.mudos },
        restantes: comp.length,
      };
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// analisar() — o orquestrador que a UI e o relatório consomem
// ─────────────────────────────────────────────────────────────────────────────

export function analisar(corpus, respostas, linhasVermelhas = new Set(), opts = {}) {
  const margem = opts.margem ?? MARGEM_PADRAO;
  const mortos = eliminacoes(corpus, respostas, linhasVermelhas);
  const vivos = corpus.candidatos.filter((c) => !mortos[c.id]);
  const classes = classificarEixos(corpus, vivos.length ? vivos : corpus.candidatos);
  const estados = avaliar(corpus, respostas, linhasVermelhas, { classes });
  const rk = ranking(corpus, estados, margem);

  // §21, regra 3: se TODOS caíram, mostrar o ranking que existiria sem as linhas
  // vermelhas. Devolver conjunto vazio sem explicação é o pior resultado possível.
  const houveEliminacao = Object.values(estados).some((e) => e.estado === "eliminado");
  let contrafactual = null;
  if (houveEliminacao) {
    // Sem linhas vermelhas o conjunto de vivos é outro, e com ele muda a
    // classificação dos eixos: reclassificar é parte do "ranking que existiria".
    const estadosCf = avaliar(corpus, respostas, new Set());
    contrafactual = {
      estados: estadosCf,
      ranking: ranking(corpus, estadosCf, margem),
      classes: classificarEixos(corpus, corpus.candidatos),
    };
  }

  // Efeito colateral do §20 que precisa ser dito em voz alta: eliminar candidatos
  // pode deixar um eixo antes divisivo com um lado só, tirando-o do ranking. Se
  // isso zerar o conjunto discriminante, a afinidade some — e sem explicação isso
  // parece defeito.
  const respondeuAlgo = Object.keys(corpus.eixos).some((e) => {
    const r = respostas[e];
    return r !== undefined && r !== "ns" && r !== "indiferente";
  });
  const diagnostico = {
    semEixosDiscriminantes: classes.divisivos.length === 0,
    rankingVazioComRespostas: respondeuAlgo && rk.ordem.length === 0 && vivos.length > 0,
    reclassificados: houveEliminacao
      ? classificarEixos(corpus, corpus.candidatos).divisivos
          .filter((d) => !classes.divisivos.some((x) => x.eixo === d.eixo))
          .map((d) => d.eixo)
      : [],
  };

  // §22, regra 2: contrastes ainda abertos entre dois líderes empatados.
  const lideres = new Set(rk.lideres);
  const ctr = contrastes(corpus, respostas, estados);
  const desempates = ctr.naoInvestigados.filter((t) => t.entre.every((id) => lideres.has(id)));

  return {
    respostas, linhasVermelhas: [...asSet(linhasVermelhas)], margem,
    estados, ranking: rk, classes, diagnostico,
    decisao: decisaoEstavel(corpus, respostas, estados, { margem, classes }),
    contrastes: { ...ctr, desempates },
    campo: afinidadeComOCampo(corpus, respostas, classes),
    portoes: Object.fromEntries(
      Object.keys(corpus.portoes || {}).map((k) => [k, respostas[k] ?? null])
    ),
    contrafactual,
    todosEliminados: vivos.length === 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rastro
// ─────────────────────────────────────────────────────────────────────────────

/** Diff entre duas análises: o que a última resposta mudou. */
export function transicoes(anterior, atual) {
  const estados = [];
  for (const id of Object.keys(atual.estados)) {
    const de = anterior?.estados?.[id]?.estado ?? null;
    const para = atual.estados[id].estado;
    if (de !== para) estados.push({ id, de, para, motivo: atual.estados[id].motivo });
  }
  const ordemDe = anterior?.ranking?.ordem ?? [];
  const ordemPara = atual.ranking.ordem;
  const lideresDe = anterior?.ranking?.lideres ?? [];
  const lideresPara = atual.ranking.lideres;
  const igual = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  return {
    estados,
    ranking: { de: ordemDe, para: ordemPara, mudou: !igual(ordemDe, ordemPara) },
    lideres: { de: lideresDe, para: lideresPara, mudou: !igual(lideresDe, lideresPara) },
  };
}

export function explicarMotivo(corpus, motivo) {
  if (!motivo) return null;
  if (motivo.tipo === "linha-vermelha") {
    const e = corpus.eixos[motivo.eixo];
    const dir = motivo.postura === "favor" ? "é favorável" : "é contrário";
    return `ponto inegociável · ${e?.label ?? motivo.eixo} — o plano ${dir} a essa posição`;
  }
  if (motivo.tipo === "portao") {
    // B8 corrigido: o texto vem do portão que disparou, não de uma string fixa.
    const g = corpus.portoes?.[motivo.portao];
    return `portão não atendido · ${g?.nota ?? g?.pergunta ?? motivo.portao}`;
  }
  return `eliminado · ${motivo.tipo}`;
}
