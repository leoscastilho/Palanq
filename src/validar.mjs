/**
 * validarCorpus() — as 16 travas do §24, mais as travas de processo.
 * Bloqueia o build. Corpus inconsistente não é publicável.
 *
 * Inversão de licença em relação ao motor clínico: lá o validador PROÍBE
 * transcrição de prosa da fonte; aqui a citação literal é o produto, e o
 * validador rejeita postura SEM citação.
 */

export function validarCorpus(c) {
  const erros = [];
  const avisos = [];
  const E = (m) => erros.push(m);
  const W = (m) => avisos.push(m);

  if (!c || typeof c !== "object") return { erros: ["corpus vazio ou inválido"], avisos, metricas: {} };
  const eixos = new Set(Object.keys(c.eixos || {}));
  const ids = new Set((c.candidatos || []).map((x) => x.id));
  const vistos = new Set();
  const usados = new Set();
  let nPosturas = 0, nInterpretacoes = 0, nSemCitacaoLiteral = 0;
  const porCandidato = {};

  for (const cand of c.candidatos || []) {
    // 3 — id de candidato duplicado
    if (vistos.has(cand.id)) E(`id de candidato duplicado: ${cand.id}`);
    vistos.add(cand.id);
    const eixosDoCand = new Set();
    porCandidato[cand.id] = 0;

    for (const p of cand.posicoes || []) {
      nPosturas++; porCandidato[cand.id]++;
      usados.add(p.eixo);
      // 1 — eixo inexistente
      if (!eixos.has(p.eixo)) E(`${cand.id}: eixo inexistente "${p.eixo}"`);
      // 2 — postura fora de {favor, contra}
      if (!["favor", "contra"].includes(p.postura))
        E(`${cand.id}/${p.eixo}: postura inválida "${p.postura}"`);
      // 4 — postura duplicada
      if (eixosDoCand.has(p.eixo)) E(`${cand.id}: postura duplicada no eixo "${p.eixo}"`);
      eixosDoCand.add(p.eixo);
      // 5 — postura sem citação (INVERSO da trava clínica)
      if (!p.citacao?.texto?.trim()) E(`${cand.id}/${p.eixo}: postura sem citação — proibido`);
      // 6 — citação sem fonte E local
      if (!p.citacao?.fonte || !p.citacao?.local)
        E(`${cand.id}/${p.eixo}: citação sem fonte e/ou localizador — não é auditável`);
      if (!p.citacao?.contexto)
        W(`${cand.id}/${p.eixo}: citação sem contexto — citação fora de contexto fica indetectável (§26)`);
      if (p.interpretacao) nInterpretacoes++;
      if (String(p.citacao?.fonte || "").includes("resumo curatorial")) nSemCitacaoLiteral++;
    }
  }

  // 7 — eixo declarado que nenhum candidato menciona
  for (const e of eixos) if (!usados.has(e)) E(`eixo "${e}" não é declarado por nenhum candidato`);

  for (const [id, def] of Object.entries(c.eixos || {})) {
    if (!def.pergunta?.trim()) E(`eixo "${id}": sem pergunta`);
    if (!def.label?.trim()) E(`eixo "${id}": sem label`);
    if (!Number.isInteger(def.peso) || def.peso < 1 || def.peso > 3)
      E(`eixo "${id}": peso "${def.peso}" fora da faixa documentada 1–3`);
    if (def.formulacaoNeutra === false && !def.notaRedacao)
      E(`eixo "${id}": formulacaoNeutra=false exige notaRedacao explicando por quê`);
  }

  for (const [id, g] of Object.entries(c.portoes || {})) {
    if (!g.pergunta?.trim()) E(`portão "${id}": sem pergunta`);
    if (!["invalida-todos-se-nao", "registro"].includes(g.efeito))
      E(`portão "${id}": efeito desconhecido "${g.efeito}"`);
  }

  const dup = new Set();
  for (const t of c.contrastes || []) {
    const rot = (t.entre || []).join("~") || "?";
    // 8 — entre.length !== 2
    if (t.entre?.length !== 2) E(`contraste ${rot}: "entre" precisa de exatamente 2 ids`);
    // 9 — id inexistente
    for (const id of t.entre || []) if (!ids.has(id)) E(`contraste ${rot}: id inexistente "${id}"`);
    // 11 — reflexivo. Guardado por length===2 para não gerar o falso positivo do B13.
    if (t.entre?.length === 2 && t.entre[0] === t.entre[1]) E(`contraste reflexivo em ${t.entre[0]}`);
    // 10 — discriminador inexistente
    if (!eixos.has(t.discriminador)) E(`contraste ${rot}: discriminador inexistente "${t.discriminador}"`);
    // 12 — duplicado
    const k = [...(t.entre || [])].sort().join("~");
    if (dup.has(k)) E(`contraste duplicado entre ${k}`);
    dup.add(k);

    const post = [];
    for (const id of t.entre || []) {
      const cand = (c.candidatos || []).find((x) => x.id === id);
      const pp = cand && (cand.posicoes || []).find((p) => p.eixo === t.discriminador);
      // 15 — lado do contraste sem postura no discriminador
      if (cand && !pp) E(`contraste ${rot}: ${id} não tem postura em "${t.discriminador}" — discriminaria contra o silêncio`);
      if (pp) post.push(pp.postura);
    }
    // 16 — ambos os lados com a mesma postura
    if (post.length === 2 && post[0] === post[1])
      E(`contraste ${rot}: ambos os lados são "${post[0]}" em "${t.discriminador}" — não discrimina`);

    for (const [r, alvo] of Object.entries(t.inclina || {})) {
      // 13 — chave de inclina fora de {concordo, discordo}
      if (!["concordo", "discordo"].includes(r)) E(`contraste ${rot}: resposta inválida em "inclina": "${r}"`);
      // 14 — inclina apontando para fora do par
      if (!(t.entre || []).includes(alvo)) E(`contraste ${rot}: "inclina" aponta para fora do par ("${alvo}")`);
    }
  }

  // ── Travas de processo ────────────────────────────────────────────────────
  if (c.status === "verified") {
    if (!c.curadoria?.responsavel) E(`status "verified" sem curadoria.responsavel`);
    if (!c.curadoria?.revisadoPor) E(`status "verified" sem curadoria.revisadoPor`);
    if (nSemCitacaoLiteral > 0)
      E(`status "verified" com ${nSemCitacaoLiteral} posturas cuja fonte é resumo curatorial, não citação literal`);
  }
  if (!c.curadoria?.metodo) E("curadoria.metodo é obrigatório — é impresso em todo relatório (§26)");
  if (!c.curadoria?.criterioDeInclusao) E("curadoria.criterioDeInclusao é obrigatório (§26)");
  if (!c.aviso) E("corpus sem aviso — o aviso é impresso sempre que status !== verified");

  // Desequilíbrio de curadoria (§24, trava recomendada): um candidato com muito
  // menos citações que a média é punido por um silêncio que pode ser da curadoria.
  const contagens = Object.values(porCandidato);
  if (contagens.length > 1) {
    const media = contagens.reduce((a, b) => a + b, 0) / contagens.length;
    const desvio = Math.sqrt(contagens.reduce((a, b) => a + (b - media) ** 2, 0) / contagens.length);
    for (const [id, n] of Object.entries(porCandidato)) {
      if (desvio > 0 && Math.abs(n - media) > 1.5 * desvio)
        W(`curadoria desequilibrada: ${id} tem ${n} citações contra média ${media.toFixed(1)} (desvio ${desvio.toFixed(1)})`);
    }
  }

  return {
    erros, avisos,
    metricas: {
      candidatos: ids.size, eixos: eixos.size, posturas: nPosturas,
      interpretacoes: nInterpretacoes, semCitacaoLiteral: nSemCitacaoLiteral,
      contrastes: (c.contrastes || []).length, portoes: Object.keys(c.portoes || {}).length,
      citacoesPorCandidato: porCandidato,
    },
  };
}
