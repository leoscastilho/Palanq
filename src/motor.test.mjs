/** Testes do motor. Sem framework: um t() e um eq(). Rode com `node src/motor.test.mjs`. */
import { readFileSync } from "node:fs";
import {
  avaliar, analisar, ranking, classificarEixos, contrastes, proximaPergunta,
  afinidadeComOCampo, eliminacoes, transicoes, explicarMotivo, confrontar,
} from "./motor.mjs";
import { validarCorpus } from "./validar.mjs";
import { montarRelatorio } from "./relatorio.mjs";
import { carregarPerfis, rodarPerfil } from "./perfis.mjs";

let ok = 0, fail = 0;
const t = (nome, fn) => { try { fn(); ok++; console.log(`  ok   ${nome}`); }
  catch (e) { fail++; console.log(`  FALHA ${nome}\n         ${e.message}`); } };
const eq = (a, b, msg = "") => {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A !== B) throw new Error(`${msg}\n         esperado ${B}\n         obtido   ${A}`);
};
const assert = (c, msg) => { if (!c) throw new Error(msg); };
const round = (x, n = 3) => (x === null ? null : Number(x.toFixed(n)));

const CORPUS = JSON.parse(readFileSync(new URL("../data/corpus.json", import.meta.url), "utf8"));

// ── fixtures ─────────────────────────────────────────────────────────────────
const cit = (s) => ({ texto: s, fonte: "fixture", local: "fixture", url: null, contexto: "fixture", recuperadoEm: null });
const p = (eixo, postura) => ({ eixo, postura, citacao: cit(`${eixo}:${postura}`), interpretacao: null });
const eixo = (peso) => ({ label: "l", pergunta: "q", dominio: "d", peso, formulacaoNeutra: true, notaRedacao: null });

/** Corpus mínimo: 4 combinações usuário×candidato + um mudo. */
const F4 = {
  schemaVersion: "1.0.0", corpusVersion: "t", status: "draft", aviso: "a",
  curadoria: { metodo: "m", criterioDeInclusao: "c" },
  eixos: { x: eixo(2) },
  portoes: {},
  candidatos: [
    { id: "F", nome: "favor",  posicoes: [p("x", "favor")] },
    { id: "K", nome: "contra", posicoes: [p("x", "contra")] },
    { id: "M", nome: "mudo",   posicoes: [] },
  ],
  contrastes: [],
};

/** Contraexemplo literal de §20: A(P=40, f=0.550) e B(P=10, f=0.500) + unânime peso 3. */
const F20 = {
  schemaVersion: "1.0.0", corpusVersion: "t", status: "draft", aviso: "a",
  curadoria: { metodo: "m", criterioDeInclusao: "c" },
  eixos: { xa1: eixo(22), xa2: eixo(18), xb1: eixo(5), xb2: eixo(5), u1: eixo(3) },
  portoes: {},
  candidatos: [
    { id: "A", nome: "A", posicoes: [p("xa1", "favor"), p("xa2", "contra"), p("u1", "favor")] },
    { id: "B", nome: "B", posicoes: [p("xb1", "favor"), p("xb2", "contra"), p("u1", "favor")] },
    { id: "Z", nome: "Z", posicoes: [p("xa1", "contra"), p("xa2", "favor"), p("xb1", "contra"), p("xb2", "favor"), p("u1", "favor")] },
  ],
  contrastes: [],
};

/** Um unilateral e um portão duplo, para B1 e §20. */
const FG = {
  schemaVersion: "1.0.0", corpusVersion: "t", status: "draft", aviso: "a",
  curadoria: { metodo: "m", criterioDeInclusao: "c" },
  eixos: { d: eixo(2), uni: eixo(3) },
  portoes: {
    g1: { pergunta: "g1?", nota: "n1", efeito: "invalida-todos-se-nao" },
    g2: { pergunta: "g2?", nota: "n2", efeito: "registro" },
  },
  candidatos: [
    { id: "A", nome: "A", posicoes: [p("d", "favor"), p("uni", "favor")] },
    { id: "B", nome: "B", posicoes: [p("d", "contra")] },
  ],
  contrastes: [{ entre: ["A", "B"], discriminador: "d", inclina: { concordo: "A", discordo: "B" }, nota: "n" }],
};

// ─────────────────────────────────────────────────────────────────────────────
console.log("\n§16 — as quatro combinações usuário × candidato");

t("concordo + favor = alinhado", () => {
  const s = avaliar(F4, { x: "concordo" });
  eq(s.F.score, 2); eq(s.F.alinhados, ["x"]); eq(s.F.afinidade, 1);
});
t("discordo + contra = ALINHADO (o caso que um port apressado erra)", () => {
  const s = avaliar(F4, { x: "discordo" });
  eq(s.K.score, 2); eq(s.K.alinhados, ["x"]); eq(s.K.afinidade, 1);
});
t("concordo + contra = divergente", () => {
  const s = avaliar(F4, { x: "concordo" });
  eq(s.K.score, -2); eq(s.K.divergentes, ["x"]); eq(s.K.afinidade, 0);
});
t("discordo + favor = divergente", () => {
  const s = avaliar(F4, { x: "discordo" });
  eq(s.F.score, -2); eq(s.F.divergentes, ["x"]); eq(s.F.afinidade, 0);
});
t("confrontar() distingue os quatro valores", () => {
  eq(confrontar(undefined, p("x", "favor")), undefined);
  eq(confrontar("ns", p("x", "favor")), undefined);
  eq(confrontar("indiferente", p("x", "favor")), null);
  eq(confrontar("concordo", null), undefined);
  eq(confrontar("concordo", p("x", "favor")), true);
});

console.log("\n§17/§18 — silêncio, indiferente, ns, afinidade nula");

t("silêncio não soma nem subtrai, e reduz cobertura", () => {
  const s = avaliar(F4, { x: "concordo" });
  eq(s.M.score, 0); eq(s.M.silencios, ["x"]); eq(s.M.pesoSilencioso, 2);
  eq(s.M.afinidade, null, "sem nada declarado, afinidade é null — não zero");
  eq(s.M.cobertura, 0, "cobertura é 0: respondeu peso 2, o candidato declarou 0");
  eq(s.F.cobertura, 1);
});
t("indiferente neutraliza: peso 0, fora do numerador E do denominador", () => {
  const s = avaliar(F4, { x: "indiferente" });
  eq(s.F.score, 0); eq(s.F.pesoRespondido, 0); eq(s.F.pesoDeclarado, 0);
  eq(s.F.afinidade, null); eq(s.F.cobertura, null);
  eq(s.F.indiferentes, ["x"]); eq(s.M.indiferentes, [], "mudo não registra indiferença");
});
t("ns mantém a pendência viva e não altera score", () => {
  const s = avaliar(F4, { x: "ns" });
  eq(s.F.score, 0); eq(s.F.pesoRespondido, 0);
  eq(s.F.inconclusivos, ["x"]); eq(s.F.afinidade, null);
});
t("indiferente e ns são distinguíveis (campos separados)", () => {
  const s = avaliar({ ...F4, eixos: { x: eixo(2), y: eixo(2) },
    candidatos: [{ id: "F", nome: "f", posicoes: [p("x", "favor"), p("y", "favor")] }] },
    { x: "ns", y: "indiferente" });
  eq(s.F.inconclusivos, ["x"]); eq(s.F.indiferentes, ["y"]);
});
t("afinidade null não entra no ranking como 0", () => {
  const s = avaliar(F4, { x: "discordo" });          // F=0.0, K=1.0, M=null
  const r = ranking(F4, s);
  eq(r.ordem, ["K", "F"], "M fica fora da ordem");
  eq(r.semSinal, ["M"]);
  assert(!r.ordem.includes("M"), "M não pode aparecer no ranking");
});

console.log("\n§20 — eixos não discriminantes fora do ranking");

t("classificarEixos reparte em divisivo / unânime / unilateral / mudo", () => {
  const cls = classificarEixos(FG, FG.candidatos);
  eq(cls.divisivos.map((x) => x.eixo), ["d"]);
  eq(cls.unilaterais.map((x) => x.eixo), ["uni"]);
  eq(cls.unilaterais[0].mudos, 1, "conta os mudos nominalmente");
  eq(cls.unanimes, []); eq(cls.mudos, []);
});
t("eixo unilateral NUNCA é oferecido nas fases 1–3", () => {
  let r = {}, a = analisar(FG, r), q, vistos = [];
  while ((q = proximaPergunta(FG, r, a.estados, { linhasVermelhas: new Set() }))) {
    vistos.push(q.id); r = { ...r, [q.id]: q.tipo === "portao" ? "sim" : "concordo" }; a = analisar(FG, r);
  }
  assert(!vistos.includes("uni"), `unilateral foi perguntado: ${vistos}`);
  eq(vistos, ["d", "g1", "g2"]);
});
t("eixo unilateral respondido por outra via não entra em afinidade nem cobertura", () => {
  const semUni = avaliar(FG, { d: "concordo" });
  const comUni = avaliar(FG, { d: "concordo", uni: "concordo" });
  eq(round(comUni.A.afinidade), round(semUni.A.afinidade));
  eq(comUni.A.cobertura, semUni.A.cobertura);
  eq(comUni.A.pesoDeclarado, semUni.A.pesoDeclarado);
  eq(comUni.A.complementar.alinhados, ["uni"], "vai para a métrica complementar");
});
t("CONTRAEXEMPLO DE §20 — unânime de peso 3 não inverte A > B", () => {
  const resp = { xa1: "concordo", xa2: "concordo", xb1: "concordo", xb2: "concordo" };
  const s0 = avaliar(F20, resp);
  eq(round(s0.A.afinidade), 0.55); eq(round(s0.A.cobertura, 2), 0.8);
  eq(round(s0.B.afinidade), 0.5);  eq(round(s0.B.cobertura, 2), 0.2);
  eq(ranking(F20, s0).ordem.slice(0, 2), ["A", "B"]);

  const s1 = avaliar(F20, { ...resp, u1: "concordo" });   // unânime respondido
  eq(round(s1.A.afinidade), 0.55, "A não pode ser puxado para 1");
  eq(round(s1.B.afinidade), 0.5,  "B não pode ser puxado para 1");
  eq(ranking(F20, s1).ordem.slice(0, 2), ["A", "B"], "a ordem NÃO pode inverter");
});
t("afinidadeComOCampo é métrica separada e não influencia o ranking", () => {
  const resp = { xa1: "concordo", xa2: "concordo", xb1: "concordo", xb2: "concordo", u1: "concordo" };
  const a = analisar(F20, resp);
  eq(a.campo.afinidade, 1, "concorda com o único eixo em que o campo é unânime");
  eq(a.campo.cobertura, 1, "unânime: todos os vivos declararam");
  eq(a.ranking.ordem.slice(0, 2), ["A", "B"]);
});
t("fase 4 oferece os não discriminantes, marcados como tal", () => {
  const r = { d: "concordo", g1: "sim", g2: "sim" };
  const a = analisar(FG, r);
  eq(proximaPergunta(FG, r, a.estados, {}), null, "sem complementar: encerrado");
  const q = proximaPergunta(FG, r, a.estados, { complementar: true });
  eq(q.id, "uni"); eq(q.fase, 4); eq(q.naoDiscriminante, true); eq(q.categoria, "unilateral");
});

console.log("\n§19 — seleção por ganho de discriminação");

t("ordena por ganho = nFavor × nContra × peso, desempate lexicográfico", () => {
  const a = analisar(CORPUS, {});
  const q = proximaPergunta(CORPUS, {}, a.estados, {});
  eq(q.id, "e_gestao_privada_saude", "7×4×3 = 84 é o maior ganho do corpus");
  eq(q.separa.ganho, 84);
});
t("eixo com separacoes = 0 nunca entra na fase 1", () => {
  const a = analisar(FG, {});
  const q = proximaPergunta(FG, {}, a.estados, {});
  eq(q.id, "d");
});

console.log("\n§21 — linhas vermelhas, contrastes, portões");

t("linha vermelha elimina, com motivo estruturado e citação", () => {
  const s = avaliar(F4, { x: "concordo" }, new Set(["x"]));
  eq(s.K.estado, "eliminado");
  eq(s.K.motivo.tipo, "linha-vermelha"); eq(s.K.motivo.eixo, "x");
  assert(s.K.motivo.citacao?.texto, "a eliminação precisa carregar a citação que a causou");
  eq(s.F.estado, "vivo"); eq(s.M.estado, "vivo", "silêncio não é divergência");
});
t("linha vermelha sobrevive a respostas posteriores", () => {
  const c = { ...F4, eixos: { x: eixo(2), y: eixo(2) },
    candidatos: [{ id: "K", nome: "k", posicoes: [p("x", "contra"), p("y", "favor")] }] };
  const s = avaliar(c, { x: "concordo", y: "concordo" }, new Set(["x"]));
  eq(s.K.estado, "eliminado");
});
t("ns e indiferente nunca eliminam por linha vermelha", () => {
  eq(avaliar(F4, { x: "ns" }, new Set(["x"])).K.estado, "vivo");
  eq(avaliar(F4, { x: "indiferente" }, new Set(["x"])).K.estado, "vivo");
});
t("eliminação de todos mostra o ranking contrafactual, não conjunto vazio", () => {
  const a = analisar(F4, { x: "concordo" }, new Set(["x"]));
  const b = analisar(F4, { x: "discordo" }, new Set(["x"]));
  assert(b.contrafactual, "precisa haver contrafactual");
  eq(b.contrafactual.ranking.ordem, ["K", "F"], "ordem que existiria sem a linha vermelha");
  eq(round(b.contrafactual.estados.K.afinidade), 1);
  eq(a.estados.K.estado, "eliminado");
});
t("contraste NUNCA elimina — só sinaliza", () => {
  const a = analisar(FG, { d: "concordo" });
  eq(a.estados.A.estado, "vivo"); eq(a.estados.B.estado, "vivo");
  eq(a.contrastes.investigados.length, 1);
  eq(a.contrastes.investigados[0].inclina, "A");
});
t("contraste: ns, indiferente e não perguntado ficam abertos com motivos distintos", () => {
  const m = (r) => contrastes(FG, r, analisar(FG, r).estados).naoInvestigados[0]?.motivo;
  eq(m({}), "não perguntado");
  eq(m({ d: "ns" }), "resposta inconclusiva");
  eq(m({ d: "indiferente" }), "declarado indiferente");
});
t("contraste some quando um dos lados é eliminado", () => {
  const a = analisar(FG, { d: "concordo" }, new Set(["d"]));
  eq(a.contrastes.naoInvestigados, []); eq(a.contrastes.investigados, []);
  eq(a.contrastes.inativos.length, 1);
});
t("REGRESSÃO B1 — portão que invalida todos não bloqueia os portões seguintes", () => {
  const r = { d: "concordo", g1: "nao" };
  const a = analisar(FG, r);
  eq(a.todosEliminados, true);
  eq(a.ranking.ordem, [], "sem ranking agora");
  const q = proximaPergunta(FG, r, a.estados, {});
  assert(q, "B1: o motor parou de perguntar");
  eq(q.id, "g2"); eq(q.tipo, "portao");
});
t("portão só é perguntado depois de haver ranking", () => {
  const a = analisar(FG, {});
  eq(proximaPergunta(FG, {}, a.estados, {}).id, "d", "antes de qualquer resposta, não pergunta portão");
});
t("portão de efeito registro não altera estado nenhum", () => {
  const s1 = avaliar(FG, { d: "concordo" });
  const s2 = avaliar(FG, { d: "concordo", g2: "nao" });
  eq(s1.A.estado, s2.A.estado); eq(s1.A.score, s2.A.score);
});
t("explicarMotivo usa o portão que disparou, não uma string fixa (B8)", () => {
  const m = eliminacoes(FG, { g1: "nao" }, new Set()).A;
  const txt = explicarMotivo(FG, m);
  assert(txt.includes("n1"), `esperava a nota do portão g1, obtive: ${txt}`);
});

console.log("\n§22 — ranking, margem, empate");

t("líderes dentro da margem produzem empate declarado", () => {
  // Precisa de um terceiro com postura oposta, senão o eixo é unânime e sai do ranking.
  const c = { ...F4, eixos: { x: eixo(2) },
    candidatos: [{ id: "A", nome: "a", posicoes: [p("x", "favor")] },
                 { id: "B", nome: "b", posicoes: [p("x", "favor")] },
                 { id: "C", nome: "c", posicoes: [p("x", "contra")] }] };
  const r = ranking(c, avaliar(c, { x: "concordo" }));
  eq(r.lideres, ["A", "B"]); eq(r.empate, true);
});
t("margem é parâmetro e muda o conjunto de líderes", () => {
  const s = avaliar(F20, { xa1: "concordo", xa2: "concordo", xb1: "concordo", xb2: "concordo" });
  eq(ranking(F20, s, 0.0).lideres, ["A"]);                 // 0.550 sozinho
  eq(ranking(F20, s, 0.06).lideres, ["A", "B"]);           // alcança 0.500
  eq(ranking(F20, s, 0.1).lideres, ["A", "B", "Z"]);       // alcança 0.460
});
t("§22 regra 2 — o eixo que desempata dois líderes vem marcado para destaque", () => {
  const c = { ...FG, eixos: { d: eixo(2), s1: eixo(3) },
    candidatos: [
      { id: "A", nome: "a", posicoes: [p("d", "favor"), p("s1", "favor")] },
      { id: "B", nome: "b", posicoes: [p("d", "contra"), p("s1", "favor")] },
      { id: "C", nome: "c", posicoes: [p("s1", "contra")] }],
    contrastes: [{ entre: ["A", "B"], discriminador: "d", inclina: { concordo: "A", discordo: "B" }, nota: "n" }] };
  const r = { s1: "concordo" };                            // A e B empatam em 1,000
  const a = analisar(c, r);
  eq(a.ranking.lideres, ["A", "B"]); eq(a.ranking.empate, true);
  eq(a.contrastes.desempates.map((x) => x.discriminador), ["d"]);
  const q = proximaPergunta(c, r, a.estados, {});
  eq(q.id, "d"); eq(q.entreLideres, true); eq(q.desempata, ["A", "B"]);
});
t("fase 2 é inalcançável enquanto as travas 15/16 valerem", () => {
  // Todo discriminador de contraste tem posturas opostas nos dois lados; com ambos
  // vivos o eixo é divisivo e a fase 1 o consome antes. Documentado no motor.
  let r = {}, a = analisar(CORPUS, r), q, fases = new Set();
  while ((q = proximaPergunta(CORPUS, r, a.estados, { complementar: true }))) {
    fases.add(q.fase);
    r = { ...r, [q.id]: q.tipo === "portao" ? "sim" : "concordo" }; a = analisar(CORPUS, r);
  }
  eq([...fases].sort(), [1, 3, 4]);
});
t("contraste respondido com ns continua não investigado e vai ao relatório", () => {
  const r = { e_encarceramento_excecao: "ns" };
  const a = analisar(CORPUS, r);
  const alvo = a.contrastes.naoInvestigados.find((t) => t.discriminador === "e_encarceramento_excecao");
  assert(alvo, "o contraste C01~C07 precisa continuar aberto");
  eq(alvo.motivo, "resposta inconclusiva");
});
t("reclassificação após eliminação é diagnosticada, não silenciosa", () => {
  // Eliminar um lado pode tornar um eixo antes divisivo unilateral, tirando-o do
  // ranking. Se isso zerar o conjunto discriminante, o motor precisa dizer.
  const a = analisar(F4, { x: "discordo" }, new Set(["x"]));
  eq(a.estados.F.estado, "eliminado");
  eq(a.diagnostico.semEixosDiscriminantes, true);
  eq(a.diagnostico.reclassificados, ["x"], "x era divisivo e deixou de ser");
  eq(a.diagnostico.rankingVazioComRespostas, true);
});

console.log("\nPureza, determinismo, terminação, rastro");

t("avaliar é pura: mesma entrada, mesma saída, sem mutar respostas", () => {
  const r = Object.freeze({ x: "concordo" });
  eq(avaliar(F4, r), avaliar(F4, r));
  eq(Object.keys(r), ["x"]);
});
t("o motor não usa Date nem Math.random", () => {
  const src = readFileSync(new URL("./motor.mjs", import.meta.url), "utf8");
  const codigo = src.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
  assert(!/\bDate\b|Math\.random|require\(|fetch\(/.test(codigo), "impureza encontrada em motor.mjs");
});
t("terminação — fuzz de 500 sequências sobre o corpus real", () => {
  const RESP = ["concordo", "discordo", "indiferente", "ns"];
  let semente = 42;
  const rnd = (n) => { semente = (semente * 1103515245 + 12345) % 2147483648; return semente % n; };
  let maxPassos = 0;
  for (let i = 0; i < 500; i++) {
    const lv = new Set(rnd(4) === 0 ? [Object.keys(CORPUS.eixos)[rnd(55)]] : []);
    let r = {}, passos = 0, q;
    let a = analisar(CORPUS, r, lv);
    while ((q = proximaPergunta(CORPUS, r, a.estados, { complementar: true, linhasVermelhas: lv }))) {
      assert(r[q.id] === undefined, `pergunta repetida: ${q.id}`);
      r = { ...r, [q.id]: q.tipo === "portao" ? (rnd(2) ? "sim" : "nao") : RESP[rnd(4)] };
      a = analisar(CORPUS, r, lv);
      if (++passos > 200) throw new Error(`não terminou na sequência ${i}`);
    }
    maxPassos = Math.max(maxPassos, passos);
  }
  assert(maxPassos <= 57, `máximo de passos ${maxPassos}`);
});
t("sem fase complementar, o corpus real encerra em 9 perguntas", () => {
  let r = {}, n = 0, q, a = analisar(CORPUS, r);
  while ((q = proximaPergunta(CORPUS, r, a.estados, {}))) {
    r = { ...r, [q.id]: q.tipo === "portao" ? "sim" : "concordo" }; a = analisar(CORPUS, r); n++;
  }
  eq(n, 9, "7 eixos divisivos + 2 portões");
});
t("transicoes registra a mudança de ranking causada pela resposta", () => {
  const a0 = analisar(FG, {});
  const a1 = analisar(FG, { d: "concordo" });
  const tr = transicoes(a0, a1);
  eq(tr.ranking.mudou, true); eq(tr.ranking.para, ["A", "B"]);
  const a2 = analisar(FG, { d: "concordo", g1: "nao" });
  eq(transicoes(a1, a2).estados.map((x) => `${x.id}:${x.de}>${x.para}`), ["A:vivo>eliminado", "B:vivo>eliminado"]);
});

console.log("\n§24 — validador");

t("o corpus real passa nas 16 travas", () => {
  const { erros } = validarCorpus(CORPUS);
  eq(erros, []);
});
t("trava 5 — postura sem citação é rejeitada", () => {
  const c = structuredClone(F4); delete c.candidatos[0].posicoes[0].citacao.texto;
  assert(validarCorpus(c).erros.some((e) => e.includes("sem citação")));
});
t("trava 6 — citação sem fonte e localizador é rejeitada", () => {
  const c = structuredClone(F4); c.candidatos[0].posicoes[0].citacao.local = null;
  assert(validarCorpus(c).erros.some((e) => e.includes("auditável")));
});
t("trava 15 — contraste com lado mudo é rejeitado", () => {
  const c = structuredClone(FG); c.contrastes[0].entre = ["A", "B"]; c.candidatos[1].posicoes = [];
  assert(validarCorpus(c).erros.some((e) => e.includes("discriminaria contra o silêncio")));
});
t("trava 16 — contraste com posturas iguais é rejeitado", () => {
  const c = structuredClone(FG); c.candidatos[1].posicoes = [p("d", "favor")];
  assert(validarCorpus(c).erros.some((e) => e.includes("não discrimina")));
});
t("trava 11 — reflexiva não gera o falso positivo do B13", () => {
  const c = structuredClone(FG); delete c.contrastes[0].entre;
  const e = validarCorpus(c).erros;
  assert(e.some((x) => x.includes("precisa de exatamente 2 ids")));
  assert(!e.some((x) => x.includes("reflexivo")), "B13: 'entre' ausente não pode virar reflexivo");
});
t("travas de processo — verified exige curadoria revisada e citação literal", () => {
  const c = structuredClone(CORPUS); c.status = "verified";
  const e = validarCorpus(c).erros;
  assert(e.some((x) => x.includes("responsavel")));
  assert(e.some((x) => x.includes("resumo curatorial")));
});
t("interpretações são contadas a cada build", () => {
  eq(validarCorpus(CORPUS).metricas.interpretacoes, 3);
});

console.log("\n§27 — relatório");

t("o relatório traz todas as seções obrigatórias", () => {
  const a = analisar(CORPUS, { e_privatizacoes: "concordo" });
  const txt = montarRelatorio(CORPUS, a, [], { geradoEm: "FIXO" });
  for (const sec of ["RANKING", "POR QUE", "DIVERGÊNCIAS", "SILÊNCIOS", "ELIMINADOS",
                     "CONSENSO DO CAMPO", "NÃO INVESTIGADO", "PORTÕES", "SUAS RESPOSTAS",
                     "RASTRO DA AVALIAÇÃO", "PLANOS DE GOVERNO INTEGRAIS"])
    assert(txt.includes(sec), `seção ausente: ${sec}`);
  assert(txt.includes(`versão ${CORPUS.corpusVersion}`), "a versão do corpus precisa estar no cabeçalho");
  assert(txt.includes("NÃO RECOMENDA VOTO"), "a ressalva ética não é rodapé opcional");
  assert(txt.includes(CORPUS.curadoria.metodo.slice(0, 40)), "método de curadoria precisa ser impresso");
});
t("afinidade e cobertura nunca aparecem separadas", () => {
  const a = analisar(CORPUS, { e_privatizacoes: "concordo", e_gestao_privada_saude: "concordo" });
  const txt = montarRelatorio(CORPUS, a, [], { geradoEm: "FIXO" });
  // Toda linha que exibe um VALOR de afinidade precisa exibir a cobertura ao lado.
  let n = 0;
  for (const l of txt.split("\n")) {
    if (!/afinidade (\d|—)/.test(l)) continue;
    n++;
    assert(l.includes("cobertura"), `linha com afinidade e sem cobertura: ${l}`);
  }
  assert(n >= a.ranking.ordem.length,
         `esperava ao menos uma linha por candidato ranqueado (${a.ranking.ordem.length}), obtive ${n}`);
});
t("líder com cobertura baixa é denunciado na seção do ranking", () => {
  const p6 = JSON.parse(readFileSync(new URL("../perfis/P006.json", import.meta.url), "utf8"));
  const a = analisar(CORPUS, p6.respostas, new Set(p6.linhasVermelhas));
  const txt = montarRelatorio(CORPUS, a, [], { geradoEm: "FIXO" });
  assert(txt.includes("[SILÊNCIO — leia antes do ranking]"), "o alerta de cobertura precisa aparecer");
  assert(txt.includes("falou menos e por isso errou menos"), "precisa nomear quem tem cobertura maior atrás");
});
t("eliminado sai do relatório com a citação que o derrubou", () => {
  const p5 = JSON.parse(readFileSync(new URL("../perfis/P005.json", import.meta.url), "utf8"));
  const a = analisar(CORPUS, p5.respostas, new Set(p5.linhasVermelhas));
  const txt = montarRelatorio(CORPUS, a, [], { geradoEm: "FIXO" });
  assert(txt.includes("RANKING CONTRAFACTUAL"), "eliminação exige o contrafactual");
  assert(txt.includes("Transferência de ativos e serviços de infraestrutura pública"),
         "a citação que causou a eliminação precisa estar no relatório");
});
t("interpretação do curador é exibida junto da citação", () => {
  const a = analisar(CORPUS, { e_encarceramento_excecao: "concordo" });
  const txt = montarRelatorio(CORPUS, a, [], { geradoEm: "FIXO" });
  assert(txt.includes("[INTERPRETAÇÃO DO CURADOR"), "inferência não literal precisa ser visível e atacável");
});
t("redação não neutra é sinalizada quando o eixo foi respondido", () => {
  const a = analisar(CORPUS, { e_encarceramento_excecao: "concordo" });
  const txt = montarRelatorio(CORPUS, a, [], { geradoEm: "FIXO" });
  assert(txt.includes("[REDAÇÃO NÃO NEUTRA]"));
});
t("o rastro registra a mudança de ranking causada por cada resposta", () => {
  let r = {}, a = analisar(CORPUS, r), q, rastro = [];
  for (let i = 0; i < 3 && (q = proximaPergunta(CORPUS, r, a.estados, {})); i++) {
    const antes = a;
    r = { ...r, [q.id]: "concordo" }; a = analisar(CORPUS, r);
    rastro.push({ pergunta: q, resposta: "concordo", transicoes: transicoes(antes, a) });
  }
  const txt = montarRelatorio(CORPUS, a, rastro, { geradoEm: "FIXO" });
  assert(txt.includes("ranking:"), "o rastro precisa mostrar a mudança de ordem, não só a resposta");
  assert(/1\. \[eixo · fase 1\]/.test(txt));
});
t("montarRelatorio é determinístico quando geradoEm é fornecido", () => {
  const a = analisar(CORPUS, { e_privatizacoes: "concordo" });
  eq(montarRelatorio(CORPUS, a, [], { geradoEm: "X" }), montarRelatorio(CORPUS, a, [], { geradoEm: "X" }));
});

console.log("\nPerfis de referência");

t("os 7 perfis passam contra o corpus", () => {
  const perfis = carregarPerfis();
  eq(perfis.length, 7);
  for (const p of perfis) {
    const r = rodarPerfil(CORPUS, p);
    assert(r.falhas.length === 0, `${p.id}: ${r.falhas.join(" | ")}`);
  }
});
t("perfis opostos elegem blocos opostos — checagem de corpus não degenerado", () => {
  const [p1, p2] = carregarPerfis();
  const a1 = analisar(CORPUS, p1.respostas), a2 = analisar(CORPUS, p2.respostas);
  const inter = a1.ranking.lideres.filter((x) => a2.ranking.lideres.includes(x));
  eq(inter, [], "um corpus em que todo perfil elege o mesmo candidato está mal construído");
});
t("há ao menos um perfil adversarial (dois líderes dentro da margem)", () => {
  const adversariais = carregarPerfis().filter((p) => {
    const a = analisar(CORPUS, p.respostas, new Set(p.linhasVermelhas));
    if (a.ranking.lideres.length !== 2) return false;
    const [x, y] = a.ranking.lideres.map((id) => a.estados[id].afinidade);
    return x !== y;
  });
  assert(adversariais.length >= 2, `perfis de fronteira: ${adversariais.length} — §25.3 exige ao menos 1`);
});

console.log(`\n${ok} ok · ${fail} falhas\n`);
process.exit(fail ? 1 : 0);
