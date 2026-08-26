/**
 * Mede a regra de parada da tela de cartões fora do navegador.
 *
 * Reproduz `acabou()` de src/swipe.js — que é política de produto e não vive no
 * motor — e exercita os casos-limite, principalmente aqueles em que marcar um tema
 * como inegociável encolhe o questionário para menos perguntas que o próprio piso.
 * Se os pisos mudarem lá, mude aqui também.
 *
 *   node tools/medir-parada.mjs
 */
import { readFileSync } from "node:fs";
import { analisar, proximaPergunta, classificarEixos } from "../src/motor.mjs";
const CORPUS = JSON.parse(readFileSync(new URL("../data/corpus.json", import.meta.url), "utf8"));
const MINIMO = 10, MINIMO_TEMAS = 8;

function rodar(f, continuar = false) {
  let r = {}, lv = new Set(), i = 0;
  const temaDe = (d) => CORPUS.eixos[d.eixo].dominio;
  for (;;) {
    const a = analisar(CORPUS, r, lv);
    const q = proximaPergunta(CORPUS, r, a.estados, { linhasVermelhas: lv });
    const perg = q && q.tipo === "eixo" && q.fase === 1 ? q : null;
    const div = a.classes.divisivos;
    const feitas = div.filter((d) => r[d.eixo] !== undefined);
    const tocados = new Set(feitas.map(temaDe)).size;
    const existentes = new Set(div.map(temaDe)).size;
    const acabou = !perg || (!continuar && a.decisao.estavel &&
      feitas.length >= Math.min(MINIMO, div.length) &&
      tocados >= Math.min(MINIMO_TEMAS, existentes));
    if (acabou) return { perguntas: i, temas: tocados, existentes, divisivos: div.length,
                         estavelDesde: a.decisao.estavel, semPerguntas: !perg,
                         lideres: a.ranking.lideres.length };
    const v = f(i, perg.id);
    r = { ...r, [perg.id]: v.resp }; if (v.ine) lv.add(perg.id);
    i++;
    if (i > 40) throw new Error("não terminou");
  }
}
const casos = {
  "tudo concordo":            () => ({ resp: "concordo" }),
  "tudo discordo":            () => ({ resp: "discordo" }),
  "alternado":              (i) => ({ resp: i % 2 ? "concordo" : "discordo" }),
  "tudo não opinar":          () => ({ resp: "indiferente" }),
  "1 inegociável no início":(i) => ({ resp: "concordo", ine: i === 0 }),
  "2 inegociáveis no início":(i) => ({ resp: "discordo", ine: i < 2 }),
  "inegociável no 5º":      (i) => ({ resp: "discordo", ine: i === 4 }),
};
console.log("caso".padEnd(26) + "perg  temas/existentes  divisivos  motivo da parada");
for (const [nome, f] of Object.entries(casos)) {
  const x = rodar(f);
  const motivo = x.semPerguntas ? "acabaram as perguntas"
    : `pisos atingidos (${x.perguntas}≥${Math.min(MINIMO, x.divisivos)} e ${x.temas}≥${Math.min(MINIMO_TEMAS, x.existentes)})`;
  console.log(nome.padEnd(26) + String(x.perguntas).padStart(4) +
    `      ${x.temas}/${x.existentes}`.padEnd(18) + String(x.divisivos).padStart(9) + "  " + motivo);
}

// "Responder os N restantes": depois de pedir para seguir, só encerra quando as
// perguntas acabam — antes ele voltava ao resultado logo na primeira resposta.
console.log("\ncom o usuário pedindo para responder o resto:");
for (const [nome, f] of Object.entries(casos)) {
  const parou = rodar(f), seguiu = rodar(f, true);
  console.log(`  ${nome.padEnd(26)} parada normal: ${String(parou.perguntas).padStart(2)} · seguindo até o fim: ${String(seguiu.perguntas).padStart(2)}`);
}
