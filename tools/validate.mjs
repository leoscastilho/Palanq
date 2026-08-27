/** CLI: valida data/corpus.json e sai com código 1 se houver erro. Bloqueia o build. */
import { readFileSync } from "node:fs";
import { validarCorpus } from "../src/validar.mjs";
import { classificarEixos } from "../src/motor.mjs";

const alvo = process.argv[2] || new URL("../data/corpus.json", import.meta.url);
const corpus = JSON.parse(readFileSync(alvo, "utf8"));
const { erros, avisos, metricas } = validarCorpus(corpus);
const cls = classificarEixos(corpus, corpus.candidatos);

console.log(`corpus ${corpus.corpusVersion} (schema ${corpus.schemaVersion}) · status: ${corpus.status}`);
console.log(`${metricas.candidatos} candidatos · ${metricas.eixos} eixos · ${metricas.posturas} posturas · ${metricas.contrastes} contrastes · ${metricas.portoes} portões`);
console.log(`eixos: ${cls.divisivos.length} divisivos · ${cls.unanimes.length} unânimes · ${cls.unilaterais.length} unilaterais · ${cls.mudos.length} mudos`);
console.log(`superfície de responsabilidade autoral: ${metricas.interpretacoes} posturas com interpretação declarada`);
console.log(`${metricas.semCitacaoLiteral} posturas com fonte de resumo curatorial (sem citação literal auditável)`);
console.log(`explicação leiga em todos os eixos · ${metricas.explicacaoMedia} caracteres em média (texto autoral, sem âncora em citação — é o que mais precisa de revisão externa)`);

// Redação das perguntas. Começar por "Você concorda que..." duplica o que os botões
// já dizem e produz dupla negação — discordar de uma frase que já contém "proibidas",
// "sem" ou "fim de" vira ginástica. A pergunta é uma proposição direta; quem responde
// concorda ou discorda dela. Os portões são exceção legítima: perguntam sobre a
// pessoa ("Você está apto a votar?"), não sobre uma política.
for (const [id, e] of Object.entries(corpus.eixos)) {
  if (/^você\s/i.test(e.pergunta))   // `\b` é ASCII e não casa depois de "ê"
    erros.push(`${id}: pergunta começa por "Você" — use a proposição direta ("A maioridade penal deve ser reduzida?")`);
  if (!e.pergunta.trimEnd().endsWith("?"))
    erros.push(`${id}: pergunta não termina em "?"`);
}

// Palavra que a extração do PDF partiu ao meio ("públ ica", "segur ança"). Escapa
// de qualquer revisão a olho: só aparece quando alguém lê aquela citação na tela.
// O sinal é estatístico e forte — as duas metades praticamente não existem soltas
// nas ~1.000 páginas dos planos, enquanto a junção é comum. Cada caso confirmado
// vira uma linha de PARTIDAS em tools/gerar-corpus.mjs, conferida no plano.
try {
  const paginas = JSON.parse(readFileSync(new URL("../data/_paginas.json", import.meta.url), "utf8"));
  const freq = new Map();
  for (const v of Object.values(paginas)) for (const pg of v.paginas)
    for (const w of pg.split(/[^A-Za-zÀ-ÿ]+/)) if (w) {
      const k = w.toLowerCase(); freq.set(k, (freq.get(k) || 0) + 1);
    }
  const F = (w) => freq.get(w.toLowerCase()) || 0;
  for (const c of corpus.candidatos) for (const p of c.posicoes) {
    const t = p.citacao?.texto; if (!t) continue;
    const w = t.split(/\s+/);
    for (let i = 0; i < w.length - 1; i++) {
      const a = w[i].replace(/[^A-Za-zÀ-ÿ]/g, ""), b = w[i + 1].replace(/[^A-Za-zÀ-ÿ]/g, "");
      if (!a || !b || a.length < 2 || b.length > 6) continue;
      const j = a + b;
      if (F(j) >= 15 && F(a) <= 4 && F(b) <= 4 && F(j) > 3 * Math.max(F(a), F(b)))
        erros.push(`${c.id}/${p.eixo}: citação com palavra partida — "${a} ${b}" ` +
                   `(${F(j)}× junto no corpus, ${F(a)}×/${F(b)}× soltos)`);
    }
  }
} catch (e) {
  if (e.code !== "ENOENT") throw e;   // sem o índice de páginas a checagem não roda
}

for (const a of avisos) console.log(`aviso: ${a}`);
if (erros.length) {
  console.error(`\n${erros.length} erro(s):`);
  for (const e of erros) console.error(`  · ${e}`);
  process.exit(1);
}
console.log(`\nOK — ${avisos.length} aviso(s), 0 erros.`);
