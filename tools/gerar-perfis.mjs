/**
 * Gera perfis/*.json — os eleitores sintéticos que verificam o corpus.
 *
 * A descrição em prosa de cada perfil foi escrita ANTES do mapeamento das
 * respostas; é ela, e não o vetor, que é a fonte de verdade. Um vetor gerado por
 * busca aleatória produziria um "eleitor" que ninguém consegue descrever — e a
 * asserção viraria uma tautologia sobre o motor.
 *
 * Rode: node tools/gerar-perfis.mjs
 */
import { writeFileSync } from "node:fs";

const AUTORIA = {
  redigidoPor: null,
  independenteDoCorpus: false,
  data: "2026-08-26",
  nota: "ATENÇÃO — CIRCULARIDADE (§9.4/§25.2). Estes perfis foram redigidos por quem montou o corpus, olhando os eixos que o corpus tem. Medem se a curadoria é internamente consistente; NÃO medem se ela é justa. Um perfil escrito por um eleitor real, sem ver o corpus, vale mais do que os sete daqui somados.",
};

/** Eleitor de esquerda coerente em todos os 22 eixos divisivos. */
const ESQ = {
  e_privatizacao_estatais: "discordo", e_ppp_servicos_publicos: "discordo",
  e_gestao_privada_saude: "discordo", e_ans_planos_flexiveis: "discordo",
  e_ensino_civico_militar: "discordo", e_negociado_sobre_legislado: "discordo",
  e_estabilidade_emprego: "concordo", e_renda_sem_contrapartida: "concordo",
  e_encarceramento_excecao: "discordo", e_autonomia_banco_central: "discordo",
  e_margem_equatorial: "discordo", e_reforma_agraria: "concordo",
  e_tributar_altas_rendas: "concordo", e_reforma_previdencia: "discordo",
  e_alinhamento_brics: "concordo", e_licenciamento_simplificado: "discordo",
  e_mineracao_terras_indigenas: "discordo", e_reducao_jornada: "concordo",
  e_ministerio_seguranca: "discordo", e_arcabouco_fiscal: "discordo",
  e_aborto: "concordo", e_liberdade_irrestrita_redes: "discordo",
};
const inverte = (o) => Object.fromEntries(
  Object.entries(o).map(([k, v]) => [k, v === "concordo" ? "discordo" : "concordo"]));
const DIR = inverte(ESQ);
const sem = (o, ...ks) => { const r = { ...o }; for (const k of ks) delete r[k]; return r; };

const P = [
  { id: "P001", titulo: "Eleitora estatista",
    descricao: "Enfermeira concursada. Viu a gestão do hospital onde trabalha passar para uma organização social e associa isso à piora do atendimento e à perda de vínculo dos colegas. Acha que saúde, educação e infraestrutura são obrigação do Estado, não oportunidade de contrato. Quer tributar quem está no topo, reduzir jornada, retomar a reforma agrária e revogar as regras de teto que, para ela, travam o orçamento social.",
    respostas: ESQ, lv: [],
    esperado: { deveLiderar: ["C09", "C10", "C11"], naoPodeLiderar: ["C01", "C02", "C03", "C04", "C06", "C08"],
                deveEliminar: [], deveEmpatar: ["C09", "C10", "C11"], deveSinalizar: [], semAssercao: ["C05", "C07", "C12"] },
    justificativa: "As três candidaturas anticapitalistas com maior cobertura declaram exatamente as posições dela. Lula fica logo atrás porque diverge no arcabouço fiscal e na autonomia do Banco Central — e porque declarou posição em menos eixos (cobertura 0,31). O PCO empata em afinidade mas com cobertura menor. É o desfecho esperado de um corpus não degenerado." },

  { id: "P002", titulo: "Eleitor liberal-conservador",
    descricao: "Dono de uma transportadora. Acha o Estado caro e lento, quer concessão e PPP em tudo que der, licenciamento com prazo, imposto menor e conta pública fechada. Na escola quer disciplina; na segurança, quer endurecimento de verdade. Desconfia de auxílio pago sem contrapartida e considera a estabilidade no serviço público um privilégio.",
    respostas: DIR, lv: [],
    esperado: { deveLiderar: ["C01", "C03", "C04"], naoPodeLiderar: ["C05", "C09", "C10", "C11", "C12"],
                deveEliminar: [], deveEmpatar: ["C01", "C03", "C04", "C06", "C08"], deveSinalizar: [], semAssercao: ["C02", "C07"] },
    justificativa: "Espelho de P001: perfis opostos elegem blocos opostos, que é a checagem mínima de corpus não degenerado. Repare em quem entra no empate por silêncio: Clariana Barão fecha em 1,000 com cobertura 0,10 — o plano dela tem 15 páginas e declara posição em 7 eixos. O relatório precisa denunciar isso na mesma tela do resultado, ou o instrumento mente sem dizer nenhuma inverdade." },

  { id: "P003", titulo: "Eleitor de esquerda sem posição sobre regulação das redes",
    descricao: "Mesmo eleitor de P001 em tudo, com uma exceção: sobre obrigar as plataformas a remover conteúdo, não tem posição. Acha que desinformação mata, e também que dar a uma empresa o poder de decidir o que pode ser dito é perigoso. Responde que não sabe.",
    respostas: sem(ESQ, "e_liberdade_irrestrita_redes"), lv: [],
    esperado: { deveLiderar: ["C09", "C10", "C11", "C12"], naoPodeLiderar: ["C01", "C02", "C03", "C04"],
                deveEliminar: [], deveEmpatar: ["C09", "C10", "C11", "C12"],
                deveSinalizar: [["C10", "C12"], ["C11", "C12"]], semAssercao: ["C05", "C06", "C07", "C08"] },
    justificativa: "PERFIL DA LACUNA. O desfecho correto aqui não é eleger ninguém — é dizer o que falta. As quatro candidaturas do bloco empatam em 1,000, e o único eixo em que PCB e PSTU divergem do PCO é justamente o que ele deixou em branco. Se o instrumento fechar sem destacar os dois contrastes, induziu fechamento prematuro." },

  { id: "P004", titulo: "Eleitor de direita sem posição sobre o BRICS",
    descricao: "Mesmo eleitor de P002, mas sobre a permanência do Brasil no BRICS não tem opinião formada: não acompanha política externa e desconfia igualmente de quem promete alinhamento automático e de quem promete independência automática.",
    respostas: sem(DIR, "e_alinhamento_brics"), lv: [],
    esperado: { deveLiderar: ["C01", "C03", "C04"], naoPodeLiderar: ["C05", "C09", "C10", "C11", "C12"],
                deveEliminar: [], deveEmpatar: ["C01", "C03", "C04", "C06", "C08"],
                deveSinalizar: [["C02", "C03"]], semAssercao: ["C02", "C07"] },
    justificativa: "Espelho de P003 do outro lado do campo: Caiado e Zema concordam em privatizar, simplificar licenciamento e disciplinar o gasto, e a única coisa que os separa é sair ou não do BRICS. O contraste precisa aparecer como não investigado." },

  { id: "P005", titulo: "Eleitor com linha vermelha em privatização",
    descricao: "Mesmas posições de P001, mas para ele privatizar não é preferência: é inegociável. Marca privatização de estatais e PPPs em serviços públicos como linhas vermelhas e declara que não considera candidatura que defenda qualquer uma das duas, por mais que concorde com ele no resto.",
    respostas: ESQ, lv: ["e_privatizacao_estatais", "e_ppp_servicos_publicos"],
    esperado: { deveLiderar: ["C09", "C10", "C11"], naoPodeLiderar: ["C01", "C02", "C03", "C04", "C06", "C08"],
                deveEliminar: ["C01", "C02", "C03", "C04", "C06", "C08"], deveEmpatar: ["C09", "C10", "C11"],
                deveSinalizar: [], semAssercao: ["C05", "C07", "C12"] },
    justificativa: "Metade do campo cai, e cada eliminação precisa sair do relatório COM o trecho do plano que a causou — eliminação silenciosa é o pior desfecho possível (§21). Repare também no efeito do §20 que o motor tem de diagnosticar: sem as seis eliminadas, eixos antes divisivos ficam com um lado só e saem da conta." },

  { id: "P006", titulo: "Eleitora de esquerda conservadora nos costumes",
    descricao: "Auxiliar de limpeza, evangélica, sindicalizada. Na economia é de esquerda sem hesitar: quer tributar o topo, revogar o teto de gastos, reduzir jornada e reforma agrária. Nos costumes, não: é contra a legalização do aborto e acha que escola com disciplina e hierarquia faz bem para o filho dela.",
    respostas: { ...ESQ, e_aborto: "discordo", e_ensino_civico_militar: "concordo" }, lv: [],
    esperado: { deveLiderar: ["C09", "C10", "C12"], naoPodeLiderar: ["C01", "C02", "C03", "C04", "C06", "C08"],
                deveEliminar: [], deveEmpatar: ["C09", "C10", "C12"],
                deveSinalizar: [], semAssercao: ["C05", "C07", "C11"] },
    justificativa: "PERFIL ADVERSARIAL. Três líderes dentro da margem com afinidades DISTINTAS — é o cenário mais sensível a mutação que este corpus produz: remover uma postura ou dobrar um peso reordena a lista. Perfis confortáveis, em que um candidato domina, não detectam nada (§25.3). Lula liderava aqui até a segunda passada de extração; ganhar posição declarada sobre o arcabouço fiscal, do qual esta eleitora discorda, tirou-o do topo — que é o efeito esperado de um corpus menos incompleto." },

  { id: "P007", titulo: "Eleitor de direita fora do consenso do próprio bloco",
    descricao: "Delegado aposentado. Concorda com quase toda a agenda econômica de mercado, mas não com entregar serviço público a concessionária — viu de perto como funciona — nem com militarizar escola, que para ele confunde os papéis da polícia e do professor.",
    respostas: { ...DIR, e_ppp_servicos_publicos: "discordo", e_ensino_civico_militar: "discordo" }, lv: [],
    esperado: { deveLiderar: ["C01", "C03"], naoPodeLiderar: ["C05", "C09", "C10", "C11", "C12", "C08"],
                deveEliminar: [], deveEmpatar: ["C01", "C03"], deveSinalizar: [], semAssercao: ["C02", "C04", "C06", "C07"] },
    justificativa: "SEGUNDO PERFIL ADVERSARIAL, e o mais limpo: exatamente dois líderes, com afinidades diferentes (0,875 e 0,850) separadas por 0,025 — dentro da margem de 0,05 e portanto declarados empatados. Cobertura alta nos dois (0,39 e 0,65), então o empate é sobre substância, não sobre silêncio." },
];

for (const p of P) {
  writeFileSync(new URL(`../perfis/${p.id}.json`, import.meta.url), JSON.stringify({
    id: p.id, titulo: p.titulo, autoria: AUTORIA, descricao: p.descricao,
    respostas: p.respostas, linhasVermelhas: p.lv, esperado: p.esperado, justificativa: p.justificativa,
  }, null, 2) + "\n");
}
console.log(`${P.length} perfis escritos em perfis/`);
