/**
 * montarRelatorio() — texto puro, seções fixas, espelhando §27 etapa 7.
 *
 * Esta é a ÚNICA função do projeto com efeito de ambiente: o carimbo de tempo do
 * cabeçalho. Todo o resto vem da análise, que é pura. Passe `meta.geradoEm` para
 * tornar a saída determinística (é o que o executor de perfis faz).
 */
import { explicarMotivo, rotularResposta as rotulo } from "./motor.mjs";

const pct = (x) => (x === null || x === undefined ? "—" : x.toFixed(3));
const cob = (x) => (x === null || x === undefined ? "—" : x.toFixed(2));
const linha = (n = 78) => "─".repeat(n);

export function montarRelatorio(corpus, analise, rastro = [], meta = {}) {
  const L = [];
  const nome = (id) => {
    const c = corpus.candidatos.find((x) => x.id === id);
    return c ? `${c.nome}${c.partido ? ` (${c.partido})` : ""}` : id;
  };
  const eixoLabel = (id) => corpus.eixos[id]?.label ?? id;
  const geradoEm = meta.geradoEm ?? new Date().toLocaleString("pt-BR");
  const { estados, ranking: rk, classes, campo, contrastes: ctr, diagnostico } = analise;

  const e = corpus.escopo || {};
  L.push(`PALANQ · COMPARAÇÃO DE PROPOSTAS — ${e.eleicao ?? "?"}, ${e.cargo ?? "?"}, ${e.ambito ?? "?"}`);
  L.push(linha());
  L.push(`Gerado em: ${geradoEm}`);
  L.push(`Corpus: versão ${corpus.corpusVersion} · schema ${corpus.schemaVersion} · status ${corpus.status}`);
  L.push(`Curadoria: ${corpus.curadoria?.responsavel ?? "NÃO IDENTIFICADA"}` +
         (corpus.curadoria?.data ? ` · ${corpus.curadoria.data}` : "") +
         (corpus.curadoria?.revisadoPor ? ` · revisado por ${corpus.curadoria.revisadoPor}` : " · SEM REVISÃO INDEPENDENTE"));
  L.push(`Método de curadoria: ${corpus.curadoria?.metodo ?? "—"}`);
  L.push(`Critério de inclusão: ${corpus.curadoria?.criterioDeInclusao ?? "—"}`);
  if (meta.identificador) L.push(`Identificador da sessão: ${meta.identificador}`);
  L.push("");
  if (corpus.status !== "verified") { L.push(`[ATENÇÃO] ${corpus.aviso}`); L.push(""); }
  for (const lim of corpus.curadoria?.limitacoesConhecidas || []) L.push(`[LIMITAÇÃO] ${lim}`);
  if (corpus.curadoria?.limitacoesConhecidas?.length) L.push("");

  // ── RANKING ───────────────────────────────────────────────────────────────
  L.push("RANKING");
  L.push(linha());
  L.push("Afinidade mede alinhamento NOS PONTOS EM QUE OS CANDIDATOS DIVERGEM entre si —");
  L.push("não é percentual de concordância com o plano. Eixos em que o campo inteiro pensa");
  L.push("igual ficam fora da conta e aparecem em CONSENSO DO CAMPO.");
  L.push("Cobertura é a fração do que você respondeu sobre a qual o candidato se pronunciou.");
  L.push(`Margem de empate: ${rk.margem.toFixed(2)} (parâmetro; candidatos dentro dela são declarados empatados)`);
  L.push("");
  if (!rk.ordem.length) {
    L.push("  Nenhum candidato com afinidade calculável.");
    if (diagnostico?.semEixosDiscriminantes)
      L.push("  Motivo: não há eixo em que os candidatos ainda vivos divirjam entre si.");
    if (analise.todosEliminados) L.push("  Motivo: todas as candidaturas foram eliminadas. Ver ELIMINADOS e RANKING CONTRAFACTUAL.");
  }
  for (const [i, id] of rk.ordem.entries()) {
    const s = estados[id];
    const lider = rk.lideres.includes(id);
    const marca = lider ? (rk.empate ? " ⟨líder — empatado⟩" : " ⟨líder⟩") : "";
    L.push(`  ${String(i + 1).padStart(2)}. ${nome(id).padEnd(34)} afinidade ${pct(s.afinidade)}   cobertura ${cob(s.cobertura)}${marca}`);
  }
  if (rk.empate) {
    L.push("");
    L.push(`  EMPATE declarado entre: ${rk.lideres.map(nome).join(" · ")}`);
    L.push("  Não há ordem entre eles. A diferença está dentro da margem, e a margem existe");
    L.push("  porque os pesos dos eixos foram escolhidos à mão e não têm essa precisão.");
  }
  // §18, regra 3 — o líder com cobertura baixa precisa ser denunciado na mesma tela.
  const alertas = [];
  const PROXIMIDADE = 0.25;   // "logo atrás": 5× a margem padrão de empate
  for (const id of rk.lideres) {
    const s = estados[id];
    if (s.cobertura !== null && s.cobertura < 0.7)
      alertas.push(`${nome(id)} lidera com cobertura ${cob(s.cobertura)}: pronunciou-se sobre menos de 70% do peso que você respondeu.`);
    // "quem vem atrás" (§18, regra 3) é quem está logo atrás — não o campo inteiro.
    // Citar alguém com afinidade 0,21 como referência de cobertura é ruído.
    // Quem tem cobertura maior e está por perto: tanto quem vem logo atrás quanto
    // outro LÍDER empatado. Empatar com quem falou o dobro não é o mesmo empate.
    const perto = rk.ordem
      .filter((x) => x !== id)
      .filter((x) => estados[x].afinidade >= s.afinidade - PROXIMIDADE)
      .filter((x) => estados[x].cobertura !== null && s.cobertura !== null && estados[x].cobertura > s.cobertura + 0.15);
    if (perto.length) {
      const empatados = perto.filter((x) => rk.lideres.includes(x));
      const atras = perto.filter((x) => !rk.lideres.includes(x));
      if (empatados.length)
        alertas.push(`${nome(id)} está empatado com ${empatados.map(nome).join(", ")}, que se pronunciaram sobre bem mais do que você respondeu (cobertura ${empatados.map((x) => cob(estados[x].cobertura)).join(", ")} contra ${cob(s.cobertura)}). Empatar com quem falou o dobro não é o mesmo empate.`);
      if (atras.length)
        alertas.push(`${nome(id)} lidera com cobertura menor que ${atras.map(nome).join(", ")}, logo atrás — falou menos e por isso errou menos.`);
    }
  }
  if (alertas.length) {
    L.push("");
    L.push("  [SILÊNCIO — leia antes do ranking]");
    for (const a of alertas) L.push(`  · ${a}`);
  }
  if (rk.semSinal.length) {
    L.push("");
    L.push(`  Sem afinidade calculável (não declararam nada sobre o que você respondeu): ${rk.semSinal.map(nome).join(", ")}`);
    L.push("  Ausência de posição não é zero e não é concordância. Ficam fora da ordem.");
  }
  L.push("");

  // ── POR QUE / DIVERGÊNCIAS / SILÊNCIOS ────────────────────────────────────
  const comCitacao = (id, eixos) => eixos.map((ex) => {
    const c = corpus.candidatos.find((x) => x.id === id);
    const p = c.posicoes.find((q) => q.eixo === ex);
    const out = [`    · ${eixoLabel(ex)} [peso ${corpus.eixos[ex].peso}] — plano ${p.postura === "favor" ? "é favorável" : "é contrário"}`,
                 `      "${p.citacao.texto}"`,
                 `      ${p.citacao.fonte} · ${p.citacao.local}`];
    if (p.citacao.contexto) out.push(`      contexto: ${p.citacao.contexto}`);
    if (p.interpretacao) out.push(`      [INTERPRETAÇÃO DO CURADOR — a postura não é literal na citação] ${p.interpretacao}`);
    return out.join("\n");
  });

  for (const [titulo, chave, nota] of [
    ["POR QUE", "alinhados", "Eixos em que sua posição coincide com a posição declarada no plano."],
    ["DIVERGÊNCIAS", "divergentes", "Eixos em que sua posição contraria a posição declarada no plano."],
  ]) {
    L.push(titulo); L.push(linha()); L.push(nota); L.push("");
    for (const id of [...rk.ordem, ...rk.semSinal]) {
      const s = estados[id];
      if (!s[chave].length) continue;
      L.push(`  ${nome(id)}`);
      L.push(comCitacao(id, s[chave]).join("\n"));
      L.push("");
    }
  }

  L.push("SILÊNCIOS");
  L.push(linha());
  L.push("Eixos que você respondeu e sobre os quais o plano não diz nada. Não somam nem");
  L.push("subtraem — e é exatamente por isso que reduzem a cobertura. Listados nominalmente.");
  L.push("");
  for (const id of [...rk.ordem, ...rk.semSinal]) {
    const s = estados[id];
    if (!s.silencios.length) continue;
    const peso = s.silencios.reduce((n, ex) => n + corpus.eixos[ex].peso, 0);
    L.push(`  ${nome(id)} — ${s.silencios.length} eixo(s), peso ${peso}`);
    for (const ex of s.silencios) L.push(`    · ${eixoLabel(ex)} [peso ${corpus.eixos[ex].peso}]`);
  }
  L.push("");

  // ── ELIMINADOS ────────────────────────────────────────────────────────────
  const eliminados = corpus.candidatos.filter((c) => estados[c.id].estado === "eliminado");
  L.push("ELIMINADOS");
  L.push(linha());
  if (!eliminados.length) L.push("  Nenhum.");
  for (const c of eliminados) {
    const m = estados[c.id].motivo;
    L.push(`  ${nome(c.id)} — ${explicarMotivo(corpus, m)}`);
    if (m.tipo === "linha-vermelha") {
      L.push(`    ponto: ${eixoLabel(m.eixo)} [marcado por você como inegociável]`);
      L.push(`    "${m.citacao.texto}"`);
      L.push(`    ${m.citacao.fonte} · ${m.citacao.local}`);
      if (m.interpretacao) L.push(`    [INTERPRETAÇÃO DO CURADOR] ${m.interpretacao}`);
    }
  }
  if (analise.contrafactual) {
    L.push("");
    L.push("  RANKING CONTRAFACTUAL — a ordem que existiria sem nenhum ponto inegociável:");
    const cf = analise.contrafactual;
    if (!cf.ranking.ordem.length) L.push("    (nenhuma afinidade calculável)");
    for (const [i, id] of cf.ranking.ordem.entries())
      L.push(`    ${String(i + 1).padStart(2)}. ${nome(id).padEnd(34)} afinidade ${pct(cf.estados[id].afinidade)}   cobertura ${cob(cf.estados[id].cobertura)}`);
  }
  L.push("");

  // ── CONSENSO DO CAMPO ─────────────────────────────────────────────────────
  L.push("CONSENSO DO CAMPO");
  L.push(linha());
  L.push("Eixos que NÃO separam ninguém e por isso não entram no ranking — incluí-los");
  L.push("inverteria a ordem em favor de quem falou pouco (§20 da especificação).");
  L.push("");
  L.push(`  Unânimes (todos os vivos declaram a mesma coisa): ${classes.unanimes.length}`);
  for (const u of classes.unanimes)
    L.push(`    · ${eixoLabel(u.eixo)} — ${u.nFalam} candidatos, todos ${u.postura === "favor" ? "a favor" : "contrários"}`);
  L.push(`  Unilaterais (parte declara, ninguém se opõe): ${classes.unilaterais.length}`);
  for (const u of classes.unilaterais)
    L.push(`    · ${eixoLabel(u.eixo)} — ${u.nFalam} ${u.postura === "favor" ? "a favor" : "contrários"}, ${u.mudos} sem dizer nada`);
  if (classes.mudos.length) {
    L.push(`  Sem nenhuma menção: ${classes.mudos.length}`);
    for (const u of classes.mudos) L.push(`    · ${eixoLabel(u.eixo)}`);
  }
  L.push("");
  if (campo.respondidos) {
    L.push(`  AFINIDADE COM O CAMPO: ${pct(campo.afinidade)}   cobertura ${cob(campo.cobertura)}   (${campo.respondidos} de ${campo.total} eixos respondidos)`);
    L.push("  Métrica separada, que NÃO influencia o ranking. Responde outra pergunta:");
    L.push("  não \"quem é mais parecido comigo\", mas \"o quanto este campo eleitoral inteiro");
    L.push("  me representa\". Afinidade com o campo baixa significa que nenhum ranking entre");
    L.push("  estes candidatos conserta o problema.");
    const compTem = [...rk.ordem, ...rk.semSinal].filter((id) => estados[id].complementar.afinidade !== null);
    if (compTem.length) {
      L.push("");
      L.push("  Por candidato, nos eixos não discriminantes (também fora do ranking):");
      for (const id of compTem) {
        const cp = estados[id].complementar;
        L.push(`    ${nome(id).padEnd(34)} afinidade ${pct(cp.afinidade)}   cobertura ${cob(cp.cobertura)}`);
      }
      L.push("  É aqui que candidaturas empatadas nos eixos divisivos se separam.");
    }
  } else {
    L.push("  Nenhum eixo não discriminante foi respondido. A fase complementar é opcional.");
  }
  L.push("");

  // ── NÃO INVESTIGADO ───────────────────────────────────────────────────────
  L.push("NÃO INVESTIGADO");
  L.push(linha());
  L.push("Pares de candidatos vivos e próximos, e a única coisa que os separa — ainda sem");
  L.push("resposta sua. Esta seção é a defesa contra o fechamento prematuro: o instrumento");
  L.push("existe para dizer o que ficou de fora, não só o que fechou.");
  L.push("");
  if (!ctr.naoInvestigados.length) L.push("  Nenhum. Todos os contrastes ativos foram investigados.");
  for (const t of ctr.naoInvestigados) {
    const destaque = ctr.desempates?.some((d) => d.discriminador === t.discriminador && d.entre.join() === t.entre.join());
    L.push(`  ${t.entre.map(nome).join("  vs  ")}${destaque ? "   ⟨DESEMPATARIA A LIDERANÇA⟩" : ""}`);
    L.push(`    discriminador: ${eixoLabel(t.discriminador)} — ${t.motivo}`);
    if (t.nota) L.push(`    ${t.nota}`);
  }
  if (ctr.investigados.length) {
    L.push("");
    L.push("  Investigados:");
    for (const t of ctr.investigados)
      L.push(`    ${t.entre.map(nome).join(" vs ")} · ${eixoLabel(t.discriminador)} = "${rotulo(t.resposta)}" → inclina para ${t.inclina ? nome(t.inclina) : "nenhum lado"}`);
  }
  if (ctr.inativos.length) {
    L.push("");
    L.push(`  Inativos (um dos lados eliminado): ${ctr.inativos.map((t) => t.entre.map(nome).join(" vs ")).join(" · ")}`);
  }
  L.push("");

  // ── PORTÕES ───────────────────────────────────────────────────────────────
  L.push("PORTÕES");
  L.push(linha());
  for (const [id, g] of Object.entries(corpus.portoes || {})) {
    const r = analise.portoes[id];
    L.push(`  ${g.pergunta}`);
    L.push(`    resposta: ${r ? rotulo(r) : "[PENDENTE]"}   efeito: ${g.efeito}${g.efeito === "registro" ? " (apenas registro — não altera nenhum estado)" : ""}`);
  }
  L.push("");

  // ── SUAS RESPOSTAS ────────────────────────────────────────────────────────
  L.push("SUAS RESPOSTAS");
  L.push(linha());
  const lv = new Set(analise.linhasVermelhas);
  for (const [id, def] of Object.entries(corpus.eixos)) {
    const r = analise.respostas[id];
    if (r === undefined) continue;
    L.push(`  ${eixoLabel(id)} [peso ${def.peso}]${lv.has(id) ? " [INEGOCIÁVEL]" : ""}: ${rotulo(r)}`);
    if (def.explicacao) L.push(`    ${def.explicacao}`);
    if (def.formulacaoNeutra === false)
      L.push(`    [REDAÇÃO NÃO NEUTRA] ${def.notaRedacao}`);
  }
  const naoResp = Object.keys(corpus.eixos).filter((id) => analise.respostas[id] === undefined);
  if (naoResp.length) {
    L.push("");
    L.push(`  Não perguntados (${naoResp.length}): ${naoResp.map(eixoLabel).join(" · ")}`);
    L.push("  Não perguntado é diferente de ter escolhido não opinar. Nenhum dos dois pesou.");
  }
  L.push("");

  // ── RASTRO ────────────────────────────────────────────────────────────────
  L.push("RASTRO DA AVALIAÇÃO");
  L.push(linha());
  L.push("Cada resposta e o que ela mudou. É isto que permite auditar a conclusão depois.");
  L.push("");
  if (!rastro.length) L.push("  (vazio)");
  for (const [i, passo] of rastro.entries()) {
    const q = passo.pergunta;
    L.push(`  ${String(i + 1).padStart(2)}. [${q.tipo}${q.fase ? ` · fase ${q.fase}` : ""}] ${q.pergunta ?? eixoLabel(q.id)}`);
    L.push(`      resposta: ${rotulo(passo.resposta)}${passo.linhaVermelha ? " · marcado como inegociável" : ""}`);
    const tr = passo.transicoes;
    if (tr?.estados?.length)
      for (const e2 of tr.estados) L.push(`      ${nome(e2.id)}: ${e2.de} → ${e2.para}${e2.motivo ? ` (${explicarMotivo(corpus, e2.motivo)})` : ""}`);
    if (tr?.ranking?.mudou) L.push(`      ranking: ${tr.ranking.de.join(" > ") || "—"}  →  ${tr.ranking.para.join(" > ") || "—"}`);
    if (tr?.lideres?.mudou) L.push(`      líderes: ${tr.lideres.de.join(", ") || "—"}  →  ${tr.lideres.para.join(", ") || "—"}`);
    if (!tr?.estados?.length && !tr?.ranking?.mudou && !tr?.lideres?.mudou) L.push("      (nada mudou no ranking)");
  }
  L.push("");

  // ── PLANOS ────────────────────────────────────────────────────────────────
  L.push("PLANOS DE GOVERNO INTEGRAIS");
  L.push(linha());
  L.push("As citações deste relatório são resumos. Os documentos abaixo prevalecem sobre");
  L.push("qualquer coisa dita aqui. Leia o plano de quem você está considerando.");
  L.push("");
  for (const c of corpus.candidatos) L.push(`  ${nome(c.id).padEnd(34)} ${c.planoUrl ?? "—"}`);
  L.push("");

  L.push(linha());
  L.push("Este documento compara POSIÇÕES DECLARADAS EM DOCUMENTOS. NÃO RECOMENDA VOTO.");
  L.push("Ignora, por construção: histórico de mandato, capacidade de execução, coalizão,");
  L.push("financiamento de campanha e a distância conhecida entre plano de governo e governo.");
  L.push("A escolha dos eixos e das citações é o maior viés deste sistema, e ele é invisível");
  L.push("no resultado: quem decidiu quais eixos existem determinou o resultado antes da sua");
  L.push("primeira resposta.");
  return L.join("\n");
}
