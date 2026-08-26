/**
 * Executor de perfis de referência — três modos, como o executor de vinhetas do
 * motor clínico.
 *
 *   node src/perfis.mjs              verifica os perfis contra o corpus
 *   node src/perfis.mjs cobertura    o que nenhum perfil exercita
 *   node src/perfis.mjs mutacao      remove postura/dobra peso e vê se algum perfil acusa
 *
 * Aviso que precisa ser repetido a cada execução: automação aponta ONDE falta
 * perfil; não escreve perfil. Um perfil gerado a partir do corpus mede se o motor
 * concorda com o corpus — verdadeiro por construção, e pior que ausência de teste
 * porque parece cobertura (§9.4).
 */
import { readFileSync, readdirSync } from "node:fs";
import { analisar, classificarEixos } from "./motor.mjs";
import { validarCorpus } from "./validar.mjs";

const raiz = new URL("../", import.meta.url);
export function carregarCorpus() { return JSON.parse(readFileSync(new URL("data/corpus.json", raiz), "utf8")); }
export function carregarPerfis() {
  return readdirSync(new URL("perfis/", raiz)).filter((f) => f.endsWith(".json")).sort()
    .map((f) => JSON.parse(readFileSync(new URL(`perfis/${f}`, raiz), "utf8")));
}

const r2 = (x) => (x === null || x === undefined ? null : Number(x.toFixed(2)));
const par = (a) => [...a].sort().join("~");

/** Assinatura do desfecho — o critério de detecção de mutação do §25.3.
 *  Só a ORDEM não basta: a saída aqui é contínua e a ordem sobrevive a quase tudo. */
export function assinatura(analise) {
  return JSON.stringify({
    ordem: analise.ranking.ordem,
    lideres: analise.ranking.lideres,
    afinidades: Object.fromEntries(Object.entries(analise.estados).map(([k, v]) => [k, r2(v.afinidade)])),
    coberturas: Object.fromEntries(Object.entries(analise.estados).map(([k, v]) => [k, r2(v.cobertura)])),
    eliminados: Object.values(analise.estados).filter((v) => v.estado === "eliminado").map((v) => v.id),
  });
}

export function rodarPerfil(corpus, perfil) {
  const a = analisar(corpus, perfil.respostas, new Set(perfil.linhasVermelhas || []));
  const falhas = [], avisos = [];
  const esp = perfil.esperado || {};
  const lideres = new Set(a.ranking.lideres);
  const eliminados = new Set(Object.values(a.estados).filter((s) => s.estado === "eliminado").map((s) => s.id));
  const sinalizados = new Set(a.contrastes.naoInvestigados.map((t) => par(t.entre)));

  for (const id of esp.deveLiderar || [])
    if (!lideres.has(id)) falhas.push(`${id} deveria liderar; líderes = [${a.ranking.lideres}]`);
  for (const id of esp.naoPodeLiderar || [])
    if (lideres.has(id)) falhas.push(`${id} NÃO podia liderar, mas lidera`);
  for (const id of esp.deveEliminar || [])
    if (!eliminados.has(id)) falhas.push(`${id} deveria ser eliminado`);
  if ((esp.deveEmpatar || []).length) {
    const esperado = [...esp.deveEmpatar].sort().join(",");
    const obtido = [...a.ranking.lideres].sort().join(",");
    if (esperado !== obtido) falhas.push(`empate esperado [${esperado}], obtido [${obtido}]`);
    if (!a.ranking.empate) falhas.push("empate esperado, mas ranking.empate = false");
  }
  for (const p of esp.deveSinalizar || [])
    if (!sinalizados.has(par(p))) falhas.push(`contraste ${par(p)} deveria estar não investigado`);

  // "silêncio parece cobertura": todo candidato que o perfil nem afirma nem
  // declara omitir gera aviso.
  const afirmados = new Set([...(esp.deveLiderar || []), ...(esp.naoPodeLiderar || []),
                             ...(esp.deveEliminar || []), ...(esp.deveEmpatar || []),
                             ...(esp.semAssercao || [])]);
  for (const c of corpus.candidatos)
    if (!afirmados.has(c.id)) avisos.push(`${perfil.id}: ${c.id} sem asserção e sem declaração de omissão`);
  if (perfil.autoria?.independenteDoCorpus !== true)
    avisos.push(`${perfil.id}: autoria NÃO independente do corpus — mede consistência interna, não justiça (§25.2)`);

  return { analise: a, falhas, avisos, assinatura: assinatura(a) };
}

// ── modo 1: verificação ──────────────────────────────────────────────────────
function modoVerificar(corpus, perfis) {
  const { erros } = validarCorpus(corpus);
  if (erros.length) { console.error("corpus inválido — rode tools/validate.mjs"); process.exit(1); }
  let falhas = 0, avisos = 0;
  for (const p of perfis) {
    const r = rodarPerfil(corpus, p);
    const marca = r.falhas.length ? "FALHA" : "ok   ";
    console.log(`  ${marca} ${p.id} — ${p.titulo}`);
    for (const f of r.falhas) console.log(`         · ${f}`);
    falhas += r.falhas.length; avisos += r.avisos.length;
    for (const a of r.avisos) if (process.env.VERBOSE) console.log(`         aviso: ${a}`);
  }
  console.log(`\n${perfis.length} perfis · ${falhas} falhas · ${avisos} avisos de autoria` +
              (process.env.VERBOSE ? "" : " (VERBOSE=1 para vê-los)"));
  return falhas;
}

// ── modo 2: cobertura ────────────────────────────────────────────────────────
function modoCobertura(corpus, perfis) {
  const lideres = new Set(), eliminados = new Set(), sinalizados = new Set(), respondidos = new Set();
  for (const p of perfis) {
    const a = analisar(corpus, p.respostas, new Set(p.linhasVermelhas || []));
    for (const id of a.ranking.lideres) lideres.add(id);
    for (const s of Object.values(a.estados)) if (s.estado === "eliminado") eliminados.add(s.id);
    for (const t of a.contrastes.naoInvestigados) sinalizados.add(par(t.entre));
    for (const e of Object.keys(p.respostas)) respondidos.add(e);
  }
  const cls = classificarEixos(corpus, corpus.candidatos);
  const semLideranca = corpus.candidatos.filter((c) => !lideres.has(c.id)).map((c) => c.id);
  const contrastesMudos = (corpus.contrastes || []).map((t) => par(t.entre)).filter((k) => !sinalizados.has(k));
  const eixosMudos = Object.keys(corpus.eixos).filter((e) => !respondidos.has(e));
  const divisivosMudos = cls.divisivos.map((d) => d.eixo).filter((e) => !respondidos.has(e));

  console.log(`${corpus.candidatos.length} candidatos · ${semLideranca.length} que nenhum perfil coloca na liderança`);
  if (semLideranca.length) console.log(`  ${semLideranca.join(", ")}`);
  console.log(`${(corpus.contrastes || []).length} contrastes · ${contrastesMudos.length} que nenhum perfil sinaliza`);
  if (contrastesMudos.length) console.log(`  ${contrastesMudos.join(", ")}`);
  console.log(`${cls.divisivos.length} eixos divisivos · ${divisivosMudos.length} que nenhum perfil responde`);
  if (divisivosMudos.length) console.log(`  ${divisivosMudos.join(", ")}`);
  console.log(`${Object.keys(corpus.eixos).length} eixos no total · ${eixosMudos.length} que nenhum perfil responde`);
  console.log(`  (os não divisivos só são respondidos na fase complementar, que os perfis não exercitam)`);
  console.log(`\nCada linha acima é tarefa de curadoria, não defeito do motor.`);
}

// ── modo 3: mutação ──────────────────────────────────────────────────────────
function modoMutacao(corpus, perfis) {
  const base = perfis.map((p) => rodarPerfil(corpus, p).assinatura);
  const detecta = (mutante) => perfis.some((p, i) => {
    try { return assinatura(analisar(mutante, p.respostas, new Set(p.linhasVermelhas || []))) !== base[i]; }
    catch { return true; }
  });

  let cob = 0; const sobreviventes = [];
  const posturas = corpus.candidatos.flatMap((c) => c.posicoes.map((p) => [c.id, p.eixo]));
  for (const [cid, eixo] of posturas) {
    const m = structuredClone(corpus);
    const cand = m.candidatos.find((x) => x.id === cid);
    cand.posicoes = cand.posicoes.filter((p) => p.eixo !== eixo);
    m.contrastes = (m.contrastes || []).filter((t) => !(t.discriminador === eixo && t.entre.includes(cid)));
    if (detecta(m)) cob++; else sobreviventes.push(`${cid}/${eixo}`);
  }
  console.log(`POSTURAS: ${cob}/${posturas.length} cobertas · ${sobreviventes.length} sobreviventes`);
  console.log(`  Cada sobrevivente é uma postura que pode ser APAGADA do corpus sem que nenhum`);
  console.log(`  perfil acuse — um trecho de plano que o projeto hoje não verifica de forma alguma.`);

  // Sem clamp na faixa 1–3: o mutante não passa pelo validador, e não precisa.
  const pesosCriticos = [], pesosDecorativos = [];
  for (const eixo of Object.keys(corpus.eixos)) {
    const m = structuredClone(corpus);
    m.eixos[eixo].peso = corpus.eixos[eixo].peso * 2;
    if (detecta(m)) pesosCriticos.push(eixo); else pesosDecorativos.push(eixo);
  }
  console.log(`\nPESOS: dobrar o peso muda algum desfecho em ${pesosCriticos.length}/${Object.keys(corpus.eixos).length} eixos`);
  if (pesosCriticos.length) console.log(`  críticos:    ${pesosCriticos.join(", ")}`);
  console.log(`  decorativos: ${pesosDecorativos.length} eixos (nenhum perfil percebe a mudança)`);
  console.log(`  Peso que não muda nada é decorativo. Peso que muda tudo é uma escolha de`);
  console.log(`  curadoria da qual o resultado inteiro depende — e isso precisa aparecer no relatório.`);

  if (sobreviventes.length) {
    console.log(`\nSobreviventes (lista priorizada de perfis a escrever):`);
    for (const s of sobreviventes.slice(0, 40)) console.log(`  · ${s}`);
    if (sobreviventes.length > 40) console.log(`  … e mais ${sobreviventes.length - 40}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const corpus = carregarCorpus(), perfis = carregarPerfis();
  const modo = process.argv[2] || "verificar";
  if (modo === "cobertura") modoCobertura(corpus, perfis);
  else if (modo === "mutacao") modoMutacao(corpus, perfis);
  else process.exit(modoVerificar(corpus, perfis) ? 1 : 0);
}
