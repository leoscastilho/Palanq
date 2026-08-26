/** Gera perfis/*.json. Rode: node tools/gerar-perfis.mjs */
import { writeFileSync } from "node:fs";
const D = ["e_gestao_privada_saude","e_privatizacoes","e_ensino_civico_militar",
           "e_flexibilizacao_trabalhista","e_encarceramento_excecao",
           "e_renda_sem_contrapartida","e_estabilidade_emprego"];
const M = { c: "concordo", d: "discordo", n: "ns", i: "indiferente" };
const V = (s) => Object.fromEntries([...s].map((ch, i) => [D[i], M[ch]]));

const AUTORIA = {
  redigidoPor: null,
  independenteDoCorpus: false,
  data: null,
  nota: "ATENÇÃO — CIRCULARIDADE (§9.4/§25.2). Este perfil foi redigido por quem montou o corpus, olhando os eixos que o corpus tem. Ele mede se a curadoria é internamente consistente; NÃO mede se ela é justa. Um perfil escrito por um eleitor real, sem ver o corpus, vale mais do que os sete daqui somados.",
};

const P = [
  { id: "P001", titulo: "Eleitora estatista",
    descricao: "Trabalha no serviço público, viu a terceirização chegar ao seu setor e associa concessão a perda de qualidade. Acha que hospital e escola são obrigação do Estado, não oportunidade de contrato. Desconfia de disciplina militar em escola. Quer estabilidade no emprego e benefício social pago sem cobrança de contrapartida — para ela, exigir trabalho em troca de auxílio é trocar assistência por mão de obra barata.",
    s: "dddddcc", lv: [],
    esperado: { deveLiderar: ["C09","C10","C11","C12"], naoPodeLiderar: ["C01","C02","C03","C04","C08"],
                deveEliminar: [], deveEmpatar: ["C05","C09","C10","C11","C12"], deveSinalizar: [], semAssercao: ["C06","C07"] },
    justificativa: "As quatro candidaturas do bloco anticapitalista declaram exatamente as posições dela em todos os eixos divisivos. Lula empata com elas por concordância perfeita, mas declarou postura em UM único eixo divisivo (flexibilização) — o empate dele é feito de silêncio, e cobertura 0,15 tem de aparecer na mesma linha do resultado. C06 e C07 ficam sem asserção: falam pouco demais para que este perfil diga algo confiável sobre eles." },

  { id: "P002", titulo: "Eleitor liberal-conservador",
    descricao: "Empresário de cidade média. Acha o Estado grande e lento, quer o serviço público entregue a quem executa melhor, aceita gestão privada no SUS se a fila anda. Na escola quer ordem e hierarquia. Na segurança, acha que o país precisa endurecer de verdade, inclusive no que outros chamam de exceção. Rejeita auxílio sem contrapartida e acha a estabilidade no emprego um privilégio.",
    s: "cccccdd", lv: [],
    esperado: { deveLiderar: ["C01","C02","C03","C04"], naoPodeLiderar: ["C05","C09","C10","C11","C12"],
                deveEliminar: [], deveEmpatar: ["C01","C02","C03","C04","C06","C08"], deveSinalizar: [], semAssercao: ["C07"] },
    justificativa: "Espelho de P001. Que P001 e P002 elejam blocos opostos é a checagem mínima de que o corpus não está degenerado. C06 e C08 entram no empate por silêncio (cobertura 0,15 e 0,30) e é por isso que aparecem em deveEmpatar mas não em deveLiderar como afirmação forte: o instrumento deve dizer que eles empatam por não terem falado." },

  { id: "P003", titulo: "Eleitor de fronteira entre Flávio Bolsonaro e Romeu Zema",
    descricao: "Concorda com privatizar e com escola disciplinar, aceita a flexibilização do trabalho em plataformas, mas não quer gestão privada dentro do SUS e é contra estabilidade no emprego. Sobre encarceramento de exceção e sobre auxílio com contrapartida, não tem posição formada e diz que não sabe.",
    s: "dcccnnd", lv: [],
    esperado: { deveLiderar: ["C01","C03"], naoPodeLiderar: ["C02","C04","C05","C09","C10","C11","C12"],
                deveEliminar: [], deveEmpatar: ["C01","C03"], deveSinalizar: [["C01","C07"]], semAssercao: ["C06","C08"] },
    justificativa: "PERFIL ADVERSARIAL. C01 (0,750) e C03 (0,727) ficam a 0,023 um do outro — dentro da margem de 0,05, e por isso empatados. É aqui que remover uma postura ou dobrar um peso vira mudança de desfecho; perfis confortáveis não detectam nada (§25.3). O contraste C01~C07 tem de aparecer como não investigado: o eleitor respondeu \"não sei\" justamente no eixo que os separa." },

  { id: "P004", titulo: "Eleitora com a lacuna no eixo que decide",
    descricao: "Concorda com toda a agenda de mercado e com a escola disciplinar. Sobre regimes prisionais de exceção, não tem posição: ouviu falar do modelo salvadorenho, achou eficaz e achou assustador, e responde que não sabe.",
    s: "ccccncc", lv: [],
    esperado: { deveLiderar: ["C01","C07"], naoPodeLiderar: ["C05","C09","C10","C12"],
                deveEliminar: [], deveEmpatar: ["C01","C02","C06","C07","C08"], deveSinalizar: [["C01","C07"]], semAssercao: ["C03","C04","C11"] },
    justificativa: "O desfecho CORRETO aqui não é eleger alguém — é sinalizar a lacuna. Flávio Bolsonaro e Wilson Grassi aparecem empatados em 1,000 e são exatamente os dois lados do único contraste que ela deixou em aberto. Se o instrumento fechar sem destacar isso, induziu fechamento prematuro, que é o dano que a seção NÃO INVESTIGADO existe para evitar. Note também a cobertura: C06 e C07 lideram com 0,18." },

  { id: "P005", titulo: "Eleitor com linha vermelha em privatização",
    descricao: "Mesmas posições de P001, mas privatização para ele não é preferência: é inegociável. Marca o eixo como linha vermelha e declara que não considera candidatura que defenda transferir infraestrutura pública à iniciativa privada, qualquer que seja o resto do plano.",
    s: "dddddcc", lv: ["e_privatizacoes"],
    esperado: { deveLiderar: ["C09","C10","C11","C12"], naoPodeLiderar: ["C01","C02","C03","C04","C08"],
                deveEliminar: ["C01","C02","C03","C04","C08"], deveEmpatar: ["C09","C10","C11","C12"],
                deveSinalizar: [], semAssercao: ["C05","C06","C07"] },
    justificativa: "Cinco candidaturas caem por linha vermelha e cada uma precisa sair do relatório COM a citação que a derrubou — eliminação silenciosa é o pior desfecho possível (§21). Repare no efeito colateral do §20 que o motor tem de diagnosticar: sem C01–C04 e C08, o eixo privatizações fica só com o lado \"contra\" e deixa de ser divisivo; o ranking passa a se apoiar em menos eixos." },

  { id: "P006", titulo: "Eleitor cujo líder quase não falou",
    descricao: "É contra gestão privada no SUS e contra privatização, mas quer escola com disciplina e aceita endurecimento prisional de exceção. É contra flexibilizar o trabalho, contra auxílio sem contrapartida e a favor de estabilidade no emprego. Uma combinação que nenhum bloco cobre inteira.",
    s: "ddcdcdc", lv: [],
    esperado: { deveLiderar: ["C05"], naoPodeLiderar: ["C06","C07","C08","C02","C03"],
                deveEliminar: [], deveEmpatar: [], deveSinalizar: [], semAssercao: ["C01","C04","C09","C10","C11","C12"] },
    justificativa: "Lula lidera SOZINHO com afinidade 1,000 e cobertura 0,15: acertou o único eixo divisivo em que declarou posição. Logo atrás, Edmilson Costa tem 0,786 com cobertura 0,70. Este é o caso que o §18 existe para tornar impossível de ler errado — se o relatório mostrar 1,000 sem a cobertura ao lado, o instrumento mentiu sem dizer nenhuma inverdade." },

  { id: "P007", titulo: "Eleitora de fronteira entre blocos opostos",
    descricao: "Quer privatização e é contra gestão privada no SUS; é contra escola disciplinar mas a favor da flexibilização do trabalho e do endurecimento prisional; a favor de estabilidade no emprego. Um eleitor que nenhum dos dois blocos representa, e que fica a meio caminho dos dois.",
    s: "dcdccnc", lv: [],
    esperado: { deveLiderar: ["C01","C10"], naoPodeLiderar: ["C05","C06","C07","C02","C03"],
                deveEliminar: [], deveEmpatar: ["C01","C10"], deveSinalizar: [["C04","C11"]], semAssercao: ["C08","C09","C12"] },
    justificativa: "SEGUNDO PERFIL ADVERSARIAL, e o mais duro: os dois líderes vêm de blocos opostos e estão a 0,029 um do outro (0,600 e 0,571), ambos com cobertura alta (0,88 e 0,82). Nenhum dos dois passa de 0,60 — o resultado honesto é \"este campo não te representa bem\", e é a afinidade com o campo, não o ranking, que deve dizer isso." },
];

for (const p of P) {
  const obj = {
    id: p.id, titulo: p.titulo, autoria: AUTORIA, descricao: p.descricao,
    respostas: V(p.s), linhasVermelhas: p.lv, esperado: p.esperado, justificativa: p.justificativa,
  };
  writeFileSync(new URL(`../perfis/${p.id}.json`, import.meta.url), JSON.stringify(obj, null, 2) + "\n");
}
console.log(`${P.length} perfis escritos em perfis/`);
