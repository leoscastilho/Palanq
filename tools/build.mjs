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

const AUTOR = "Leo Castilho";
const SLOGAN = "No papel, qual candidato combina com você?";
const rodapeHtml = ler("src/rodape.html").replace(/\$\{AUTOR\}/g, AUTOR);
const rodapeCss = ler("src/rodape.css");

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
  // O rodapé é injetado em todas as páginas; se a folha da tela definir uma das
  // classes dele, o estilo compartilhado é sobrescrito em silêncio — foi o que
  // aconteceu com ".rodape", que já existia na tela de cartões.
  const semComentario = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "");
  const classesRodape = new Set(semComentario(rodapeCss).match(/\.[a-z][\w-]*/g) || []);
  const cssTela = semComentario(css);
  for (const cls of classesRodape)
    if (new RegExp(`\\${cls}\\b`).test(cssTela)) {
      console.error(`build abortado — "${cls}" é definida no rodapé e em "${titulo}".`);
      console.error("  Renomeie a classe da tela: o rodapé é compartilhado e perde a disputa.");
      process.exit(1);
    }
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
<meta name="author" content="${AUTOR}">
<!-- Prévia de link no WhatsApp, Telegram e redes. Sem og:image: a política de
     segurança da página bloqueia host externo, e imagem local não é buscável por
     quem monta a prévia. -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="Palanq">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${titulo}">
<meta property="og:description" content="${descricao}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${titulo}">
<meta name="twitter:description" content="${descricao}">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'">
<title>${titulo}</title>
<style>
${css}

${rodapeCss}
</style>
</head>
<body>
${html}
${rodapeHtml}
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
    titulo: `Palanq — ${SLOGAN}`,
    descricao: `Deslize os cartões e descubra quais candidaturas mais combinam com você, comparando suas posições com os planos de governo registrados da ${corpus.escopo.eleicao.toLowerCase()}. Não recomenda voto.`,
    css: ler("src/swipe.css"), html: ler("src/swipe.html"), tela: ler("src/swipe.js") },
  { destino: "motor/index.html",
    titulo: `Palanq · motor — ${SLOGAN}`,
    descricao: `Versão completa do Palanq: compara suas posições com as posições declaradas nos planos de governo registrados da ${corpus.escopo.eleicao.toLowerCase()}, com a citação e a página de cada uma. Não recomenda voto.`,
    css: ler("src/estilo.css"), html: ler("src/app.html"), tela: ler("src/ui.js") },
];

let total = 0;
const saidas = [];
for (const p of paginas) {
  const saida = pagina(p);
  saidas.push(saida);
  // O compromisso é a página não BUSCAR nada de fora — nem script, nem folha de
  // estilo, nem fonte, nem imagem. Link que o usuário clica é navegação, não
  // requisição, e por isso é permitido (planos de governo, licença, curadoria).
  const buscasExternas = [
    [/<script[^>]+\bsrc\s*=/i, "<script src>"],
    [/<link[^>]+\bhref\s*=\s*["']https?:/i, "<link href> remoto"],
    [/<(?:img|video|audio|source|iframe|embed)[^>]+\bsrc\s*=\s*["']https?:/i, "mídia remota"],
    [/@import/i, "@import"],
    [/url\(\s*["']?https?:/i, "url() remota"],
    [/\bfetch\s*\(\s*["']https?:/i, "fetch() remoto"],
    [/\bnew\s+(?:XMLHttpRequest|WebSocket|EventSource)\b/i, "conexão externa"],
  ];
  for (const [rx, oque] of buscasExternas)
    if (rx.test(saida)) {
      console.error(`ERRO: ${p.destino} faz busca externa (${oque}) — a página tem de ser autocontida`);
      process.exit(1);
    }
  writeFileSync(new URL(p.destino, raiz), saida);
  const kb = (Buffer.byteLength(saida, "utf8") / 1024).toFixed(1);
  console.log(`${p.destino.padEnd(18)} ${kb.padStart(7)} KB`);
  total += Number(kb);
}
console.log(`corpus ${corpus.corpusVersion} (${corpus.status}) · ${metricas.candidatos} candidatos · ${metricas.eixos} eixos · ${metricas.posturas} posturas · ${metricas.interpretacoes} com interpretação`);
const externos = [...new Set((saidas.join("").match(/https?:\/\/[^"'\s<>]+/g) || [])
  .map((u) => new URL(u).host))].sort();
console.log(`sem busca externa: nada é carregado de fora. Links clicáveis para ${externos.join(", ")}.`);
