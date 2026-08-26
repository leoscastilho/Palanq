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

for (const a of avisos) console.log(`aviso: ${a}`);
if (erros.length) {
  console.error(`\n${erros.length} erro(s):`);
  for (const e of erros) console.error(`  · ${e}`);
  process.exit(1);
}
console.log(`\nOK — ${avisos.length} aviso(s), 0 erros.`);
