/**
 * Build. Gera `index.html` — arquivo único, autocontido, sem nenhuma requisição
 * externa. É o argumento de privacidade inteiro (§26): sem servidor, sem
 * telemetria, sem CDN; as respostas do usuário são as posições políticas dele e
 * a única defesa que não depende de confiança é não ter para onde mandá-las.
 *
 * A validação do corpus roda ANTES e bloqueia: corpus inconsistente não é publicável.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { validarCorpus } from "../src/validar.mjs";

const raiz = new URL("../", import.meta.url);
const ler = (p) => readFileSync(new URL(p, raiz), "utf8");

const corpus = JSON.parse(ler("data/corpus.json"));
const { erros, avisos, metricas } = validarCorpus(corpus);
for (const a of avisos) console.log(`aviso: ${a}`);
if (erros.length) {
  console.error(`build abortado — ${erros.length} erro(s) no corpus:`);
  for (const e of erros) console.error(`  · ${e}`);
  process.exit(1);
}

/** Mini-bundler: junta os módulos do projeto num único escopo de módulo.
 *  Só funciona porque controlamos as fontes — sem dependências, sem `export default`,
 *  sem colisão de nomes entre motor.mjs e relatorio.mjs. */
const achatar = (src) => src
  .split("\n")
  .filter((l) => !/^\s*import\s.*from\s+["']\.\/.*["'];?\s*$/.test(l))
  .map((l) => l.replace(/^export\s+(?=(const|function|let|class)\b)/, ""))
  .join("\n");

const modulos = [achatar(ler("src/motor.mjs")), achatar(ler("src/relatorio.mjs"))].join("\n\n");
const dados = `const CORPUS = Object.freeze(${JSON.stringify(corpus)});`;
const ui = ler("src/ui.js");
const css = ler("src/estilo.css");
const html = ler("src/app.html");

const escapar = (s) => s.replace(/<\/script/gi, "<\\/script");
const saida = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="referrer" content="no-referrer">
<meta name="description" content="Compara suas posições com as posições declaradas nos planos de governo. Não recomenda voto.">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'">
<title>Match Presidenciáveis — ${corpus.escopo.eleicao}</title>
<style>
${css}
</style>
</head>
<body>
${html}
<script type="module">
${escapar(modulos)}

${escapar(dados)}

${escapar(ui)}
</script>
</body>
</html>
`;

writeFileSync(new URL("index.html", raiz), saida);
const kb = (Buffer.byteLength(saida, "utf8") / 1024).toFixed(1);
console.log(`index.html escrito · ${kb} KB · corpus ${corpus.corpusVersion} (${corpus.status})`);
console.log(`${metricas.candidatos} candidatos · ${metricas.eixos} eixos · ${metricas.posturas} posturas · ${metricas.interpretacoes} com interpretação declarada`);
if (/https?:\/\//.test(saida.replace(/https:\/\/static\.poder360\.com\.br[^"'\s]*/g, ""))) {
  console.error("ERRO: o build contém URL externa fora dos links de plano de governo");
  process.exit(1);
}
console.log("sem requisição externa: nenhum src/href remoto além dos PDFs de plano (abertos pelo usuário).");
