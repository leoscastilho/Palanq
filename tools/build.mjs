/**
 * Build. Gera duas páginas autocontidas, sem nenhuma requisição
 *   index.html        versão de cartões — o produto
 *   motor/index.html  versão completa — valida as fórmulas e a curadoria
 *
 * As duas compartilham motor, corpus e relatório; mudam a tela. Ser arquivo único
 * é o argumento de privacidade inteiro (§26): sem servidor, sem telemetria, sem
 * CDN; as respostas do usuário são as posições políticas dele e a única defesa que
 * não depende de confiança é não ter para onde mandá-las.
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

const partes = { "motor.mjs": achatar(ler("src/motor.mjs")), "relatorio.mjs": achatar(ler("src/relatorio.mjs")) };

// O mini-bundler junta tudo num escopo só. Duas declarações com o mesmo nome
// produzem uma página em branco em runtime, e nenhum teste em Node pegaria isso:
// lá cada arquivo tem escopo próprio. Então o build recusa.
const topo = (src) => [...src.matchAll(/^(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
const vistos = new Map();
for (const [arq, src] of Object.entries(partes))
  for (const nome of topo(src)) {
    if (vistos.has(nome)) {
      console.error(`build abortado — "${nome}" é declarado em ${vistos.get(nome)} e em ${arq}.`);
      console.error("  Os módulos são concatenados num único escopo; nomes precisam ser únicos.");
      process.exit(1);
    }
    vistos.set(nome, arq);
  }
const modulos = Object.values(partes).join("\n\n");
const dados = `const CORPUS = Object.freeze(${JSON.stringify(corpus)});`;

const escapar = (s) => s.replace(/<\/script/gi, "<\\/script");

/** Monta uma página autocontida a partir de um css + um shell + um script de tela. */
function pagina({ titulo, descricao, css, html, tela }) {
  for (const nome of topo(tela))
    if (vistos.has(nome)) {
      console.error(`build abortado — "${nome}" é declarado em ${vistos.get(nome)} e na tela "${titulo}".`);
      console.error("  Os módulos são concatenados num único escopo; nomes precisam ser únicos.");
      process.exit(1);
    }
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="referrer" content="no-referrer">
<meta name="description" content="${descricao}">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'">
<title>${titulo}</title>
<style>
${css}
</style>
</head>
<body>
${html}
<script type="module">
${escapar(modulos)}

${escapar(dados)}

${escapar(tela)}
</script>
</body>
</html>
`;
}

const paginas = [
  { destino: "index.html",
    titulo: `Palanq — ${corpus.escopo.eleicao}`,
    descricao: "Deslize os cartões e descubra quais candidaturas mais se parecem com você. Não recomenda voto.",
    css: ler("src/swipe.css"), html: ler("src/swipe.html"), tela: ler("src/swipe.js") },
  { destino: "motor/index.html",
    titulo: `Palanq · motor — ${corpus.escopo.eleicao}`,
    descricao: "Palanq compara suas posições com as posições declaradas nos planos de governo registrados. Não recomenda voto.",
    css: ler("src/estilo.css"), html: ler("src/app.html"), tela: ler("src/ui.js") },
];

let total = 0;
for (const p of paginas) {
  const saida = pagina(p);
  if (/https?:\/\//.test(saida.replace(/https:\/\/static\.poder360\.com\.br[^"'\s]*/g, ""))) {
    console.error(`ERRO: ${p.destino} contém URL externa fora dos links de plano de governo`);
    process.exit(1);
  }
  writeFileSync(new URL(p.destino, raiz), saida);
  const kb = (Buffer.byteLength(saida, "utf8") / 1024).toFixed(1);
  console.log(`${p.destino.padEnd(18)} ${kb.padStart(7)} KB`);
  total += Number(kb);
}
console.log(`corpus ${corpus.corpusVersion} (${corpus.status}) · ${metricas.candidatos} candidatos · ${metricas.eixos} eixos · ${metricas.posturas} posturas · ${metricas.interpretacoes} com interpretação`);
console.log("sem requisição externa: nenhum src/href remoto além dos PDFs de plano (abertos pelo usuário).");
