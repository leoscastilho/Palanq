/**
 * Gera data/corpus.json.
 *
 * PROVENIÊNCIA. Toda postura deste corpus vem de uma CITAÇÃO LITERAL do plano de
 * governo registrado da candidatura, com número de página. As citações foram
 * extraídas dos PDFs em source/propostas/ e estão versionadas em
 * data/_posturas.div.json (eixos divisivos) e data/_posturas.uni.json (não
 * discriminantes) — arquivos que este script consome e não reescreve.
 *
 * source/propostas.md e source/auxiliar.md são resumos curatoriais de terceiro.
 * Foram usados para DESCOBRIR quais eixos existem; nenhuma postura se apoia neles.
 * Sempre que o plano original não sustentou o que o resumo afirmava, a postura foi
 * removida — ver docs/CURADORIA.md §2.
 *
 * Rode: node tools/gerar-corpus.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const raiz = new URL("../", import.meta.url);
const ler = (p) => JSON.parse(readFileSync(new URL(p, raiz), "utf8"));

const CANDIDATOS = [
  { id: "C01", nome: "Flávio Bolsonaro", partido: null, paginas: 76,
    arquivo: "FLAVIO-BOLSONARO-PARA-O-BRASIL-VENCER-O-ATRASO-1-1.pdf",
    planoUrl: "https://static.poder360.com.br/uploads/2026/08/FLAVIO-BOLSONARO-PARA-O-BRASIL-VENCER-O-ATRASO-1-1.pdf" },
  { id: "C02", nome: "Ronaldo Caiado", partido: "PSD", paginas: 100,
    arquivo: "Plano-de-Governo-Ronaldo-Caiado-Presidente.pdf",
    planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano-de-Governo-Ronaldo-Caiado-Presidente.pdf" },
  { id: "C03", nome: "Romeu Zema", partido: null, paginas: 81,
    arquivo: "Plano_gov_Zema_2026.pdf",
    planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_Zema_2026.pdf" },
  { id: "C04", nome: "Renan Missão", partido: "Missão", paginas: 51,
    arquivo: "Plano_gov_Renan_Missao_2026.pdf",
    planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_Renan_Missao_2026.pdf" },
  { id: "C05", nome: "Luiz Inácio Lula da Silva", partido: null, paginas: 84,
    arquivo: "plano-governo-lula.pdf",
    planoUrl: "https://static.poder360.com.br/uploads/2026/08/plano-governo-lula.pdf" },
  { id: "C06", nome: "Augusto Cury", partido: "Avante", paginas: 200,
    arquivo: "Plano_gov_Augusto_Cury_2026.pdf",
    planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_Augusto_Cury_2026.pdf" },
  { id: "C07", nome: "Wilson Grassi", partido: "Democrata", paginas: 58,
    arquivo: "Plano_gov_Wilson_Grassi_2026.pdf",
    planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_Wilson_Grassi_2026.pdf" },
  { id: "C08", nome: "Clariana Barão", partido: "DC", paginas: 15,
    arquivo: "Plano_gov_DC_Clariana_Barao.pdf",
    planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_DC_Clariana_Barao.pdf" },
  { id: "C09", nome: "Samara Martins", partido: "UP", paginas: 67,
    arquivo: "Plano_gov_Samara_UP_2026.pdf.pdf",
    planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_Samara_UP_2026.pdf.pdf" },
  { id: "C10", nome: "Edmilson Costa", partido: "PCB", paginas: 16,
    arquivo: "Plano_gov_Edmilson_Costa_PCB_2026.pdf",
    planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_Edmilson_Costa_PCB_2026.pdf" },
  { id: "C11", nome: "Hertz Dias", partido: "PSTU", paginas: 33,
    arquivo: "Plano_gov_Hertz_Dias_PSTU_2026.pdf",
    planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_Hertz_Dias_PSTU_2026.pdf" },
  { id: "C12", nome: "Rui Costa Pimenta", partido: "PCO", paginas: 7,
    arquivo: "Plano_gov_PCO_Rui_Costa_Pimenta2026.pdf",
    planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_PCO_Rui_Costa_Pimenta2026.pdf" },
];
const POR_ID = Object.fromEntries(CANDIDATOS.map((c) => [c.id, c]));

/**
 * Interpretações — as ÚNICAS posturas cujo sentido não é literal na citação.
 * Cada uma é exibida ao usuário junto do trecho, em destaque, para ser contestada.
 * Chave: "<eixo>/<candidato>".
 */
const INTERPRETACOES = {
  "e_tributar_altas_rendas/C01": "O plano não trata de imposto sobre grandes fortunas. A postura \"contra\" é inferida do compromisso declarado de reduzir a carga tributária total, que é incompatível com a criação de um novo tributo sobre patrimônio.",
  "e_tributar_altas_rendas/C02": "O plano não trata de imposto sobre grandes fortunas. A postura \"contra\" é inferida do compromisso explícito de não recorrer a aumentos permanentes de carga tributária.",
  "e_tributar_altas_rendas/C03": "O plano não trata de imposto sobre grandes fortunas. A postura \"contra\" é inferida das metas declaradas de redução progressiva da carga tributária.",
  "e_tributar_altas_rendas/C06": "O plano não trata de imposto sobre grandes fortunas. A postura \"contra\" é inferida do compromisso declarado com uma carga tributária menor ao fim da transição.",
  "e_reducao_jornada/C01": "O plano não rejeita a redução de jornada em si; rejeita que ela seja imposta por lei em vez de negociada. A postura \"contra\" refere-se à redução LEGAL da jornada e é inferida dessa posição.",
  "e_licenciamento_simplificado/C05": "O plano não trata da Lei 15.190/2025. A postura \"contra\" é inferida da crítica explícita à desmontagem das estruturas de controle ambiental e de seus efeitos.",
  "e_licenciamento_simplificado/C07": "A postura \"contra\" refere-se à SIMPLIFICAÇÃO do rito: o plano condiciona a atividade a licenciamento ambiental pleno, com exigências adicionais. Não é oposição ao licenciamento com prazo, que o mesmo plano defende — a candidatura está dos dois lados deste eixo, e o corpus registrou o lado mais restritivo.",
  "e_mineracao_terras_indigenas/C09": "O plano não menciona a regulamentação da mineração em terras indígenas. A postura \"contra\" é inferida da exigência de retirada de garimpeiros e demais invasores desses territórios.",
  "e_mineracao_terras_indigenas/C10": "O plano não menciona a regulamentação da mineração em terras indígenas. A postura \"contra\" é inferida da defesa de proteção integral dos territórios sob gestão dos próprios povos originários.",
  "e_mineracao_terras_indigenas/C11": "O plano não menciona a regulamentação da mineração em terras indígenas. A postura \"contra\" é inferida da defesa de demarcação imediata e proteção das comunidades tradicionais.",
  "e_alinhamento_brics/C05": "O plano não declara explicitamente a permanência no BRICS. A postura \"favor\" é inferida da defesa do multilateralismo e do registro da cúpula do bloco sediada pelo governo.",
  "e_ensino_civico_militar/C04": "A postura \"favor\" é qualificada na própria citação: o plano trata a militarização escolar como medida provisória e localizada, não como modelo educacional.",
  "e_ppp_servicos_publicos/C04": "O plano critica explicitamente a fórmula de \"privatizar tudo\" (p. 5). A postura \"favor\" aqui vale para PPPs como instrumento de governança, que o plano adota, e NÃO para privatização como programa — por isso a candidatura não aparece no eixo de privatização de estatais.",
  "e_ministerio_seguranca/C10": "A postura \"contra\" é inferida da proposta de substituir a política e o ministério de segurança pública por uma \"política de segurança dos direitos\" sob marco civil.",
  "e_estatizacao_setores/C11": "A postura \"favor\" é inferida das propostas de estatização setorial declaradas ao longo do plano (transporte, ouro, plataformas), não de uma formulação geral de monopólio estatal.",
  "e_estatizacao_setores/C12": "A postura \"favor\" é inferida das propostas de estatização declaradas ao longo do plano (imprensa, ensino pago, empresas que demitem), não de uma formulação geral de monopólio estatal.",
};

/**
 * Eixos cuja pergunta não foi possível escrever sem carga avaliativa. O validador
 * exige nota; o relatório e a interface sinalizam sempre que o eixo é respondido.
 */
const REDACAO_NAO_NEUTRA = {
  e_encarceramento_excecao:
    "Não há redação deste eixo que descreva o mecanismo sem já o qualificar: \"suspensão de garantias\" e \"regime de exceção\" são os termos usados pelas próprias candidaturas dos dois lados, e ambos carregam juízo. Marcado para revisão.",
  e_aborto:
    "Tema em que a formulação da pergunta move a resposta mais do que em qualquer outro eixo do corpus. A redação adotada usa os termos da citação favorável (\"descriminalização e legalização\"); uma redação a partir do lado contrário (\"vida desde a concepção\") colheria respostas diferentes. Marcado para revisão.",
  e_liberdade_irrestrita_redes:
    "\"Censura\" e \"moderação\" descrevem o mesmo ato com sinais opostos, e as duas candidaturas deste eixo usam palavras diferentes para ele. A pergunta descreve o mecanismo (remover conteúdo e suspender perfis) para evitar escolher entre os dois vocabulários, mas a escolha não é neutra. Marcado para revisão.",
};

/** Limpeza final dos artefatos de extração de PDF que sobrevivem à passada automática. */
function limpar(t) {
  let s = t.replace(/\s+/g, " ").trim();
  // o PDF da UP (C09) renderiza cada linha duas vezes
  for (let i = 0; i < 4; i++) s = s.replace(/([\wÀ-ÿ][^.;!?]{10,}?)\.?\s*\1/g, "$1");
  s = s.replace(/(\b[\wÀ-ÿ]{4,})\.\1\b/g, "$1");
  // ligaduras quebradas pela extração ("T oda", "AL TERNATIVA", "CL T")
  s = s.replace(/\b([A-ZÀ-Ý]{2,})\s([A-ZÀ-Ý]{1,3})\b/g, (m, a, b) => (b.length <= 2 ? a + b : m));
  s = s.replace(/\b([A-ZÀ-Ý])\s([a-zà-ÿ]{2,})/g, "$1$2");
  s = s.replace(/\s+([,.;:!?])/g, "$1").replace(/\s{2,}/g, " ").trim();
  s = s.replace(/^[•▪●–—-]\s*/, "");
  return s;
}

const div = ler("data/_posturas.div.json");
const uni = ler("data/_posturas.uni.json");
const TODOS = { ...div, ...uni };

const eixos = {};
const posicoesPorCandidato = Object.fromEntries(CANDIDATOS.map((c) => [c.id, []]));
let nInterp = 0;

for (const [id, spec] of Object.entries(TODOS)) {
  eixos[id] = {
    label: spec.label,
    pergunta: spec.pergunta,
    dominio: spec.dominio,
    peso: spec.peso,
    formulacaoNeutra: !(id in REDACAO_NAO_NEUTRA),
    notaRedacao: REDACAO_NAO_NEUTRA[id] ?? null,
  };
  for (const [cid, p] of Object.entries(spec.posturas)) {
    const cand = POR_ID[cid];
    if (!cand) throw new Error(`candidato desconhecido em ${id}: ${cid}`);
    const interpretacao = INTERPRETACOES[`${id}/${cid}`] ?? null;
    if (interpretacao) nInterp++;
    posicoesPorCandidato[cid].push({
      eixo: id,
      postura: p.postura,
      citacao: {
        texto: limpar(p.texto),
        fonte: `Plano de governo registrado — ${cand.nome}${cand.partido ? ` (${cand.partido})` : ""}`,
        local: `${cand.arquivo}, p. ${p.pagina} de ${cand.paginas}`,
        url: cand.planoUrl,
        contexto: `Trecho literal do plano, extraído da página ${p.pagina}. Confira no documento original — o link abre o PDF completo.`,
        recuperadoEm: "2026-08-26",
      },
      interpretacao,
    });
  }
}

const ordem = Object.keys(eixos);
for (const cid of Object.keys(posicoesPorCandidato))
  posicoesPorCandidato[cid].sort((a, b) => ordem.indexOf(a.eixo) - ordem.indexOf(b.eixo));

const corpus = {
  schemaVersion: "1.0.0",
  corpusVersion: "0.2.0",
  escopo: { eleicao: "Eleição Geral de 2026", cargo: "Presidente da República", ambito: "Brasil", turno: 1 },
  status: "draft",
  aviso:
    "CORPUS EM RASCUNHO — SEM REVISÃO INDEPENDENTE. Todas as citações são trechos literais dos planos de governo registrados, com número de página, e cada uma linka o PDF completo. O que ainda falta é revisão por alguém que não montou o corpus: a escolha de QUAIS eixos existem e de QUAL trecho representa cada candidatura continua sendo do curador. Este instrumento compara posições declaradas em documentos e NÃO recomenda voto.",
  curadoria: {
    responsavel: null,
    data: "2026-08-26",
    metodo:
      "Os 12 planos de governo registrados foram extraídos em texto e varridos tema a tema. Uma postura só foi registrada quando o plano enuncia a posição por escrito; o campo citacao.texto traz o trecho literal e citacao.local traz a página. Quando o sentido da postura não é literal no trecho, a inferência está declarada em 'interpretacao' e é exibida ao usuário junto da citação. Silêncio nunca foi convertido em oposição.",
    criterioDeInclusao:
      "Um eixo entra no corpus quando ao menos uma candidatura declara posição sobre ele por escrito. Eixos em que ninguém se opõe permanecem como não discriminantes: ficam fora do ranking e são reportados como consenso ou posição unilateral do campo.",
    revisadoPor: null,
    limitacoesConhecidas: [
      "As citações são literais e paginadas, mas a SELEÇÃO delas é do curador. Um trecho escolhido é sempre um trecho entre outros, e nenhuma trava técnica protege contra escolha tendenciosa — só revisão independente, que este corpus ainda não teve.",
      "Os pesos dos eixos são escolha do curador e não vêm dos planos. Rode `node src/perfis.mjs mutacao` para ver de quais deles o resultado depende.",
      "Planos muito curtos ou escritos como arcabouço genérico — caso de Clariana Barão (15 páginas) — produzem poucas posturas e cobertura baixa. Isso é fato sobre o documento, não sobre a candidatura, e a cobertura exibida ao lado da afinidade existe para tornar essa diferença visível.",
      "source/propostas.md e source/auxiliar.md, resumos de terceiro, foram usados apenas para descobrir quais temas investigar. Onde o plano original não sustentou o que o resumo afirmava, a postura foi removida.",
      "A extração de texto de PDF introduz ruído tipográfico. As citações passam por limpeza automática; divergências de espaçamento em relação ao original são artefato de extração, não alteração de conteúdo.",
    ],
  },
  eixos,
  portoes: {
    p_apto: {
      pergunta: "Você está apto a votar nesta eleição (título eleitoral em situação regular)?",
      nota: "Sem aptidão eleitoral a comparação não tem consequência prática. Nenhuma candidatura se sustenta como resultado.",
      efeito: "invalida-todos-se-nao",
    },
    p_ciente_limites: {
      pergunta:
        "Você entende que este instrumento compara apenas posições declaradas em documentos — ignorando histórico de mandato, capacidade de execução, coalizão e financiamento — e que ele não recomenda voto?",
      nota: "Portão de registro. Não altera nenhum estado; a resposta é gravada no relatório.",
      efeito: "registro",
    },
  },
  candidatos: CANDIDATOS.map((c) => ({
    id: c.id,
    nome: c.nome,
    partido: c.partido,
    planoUrl: c.planoUrl,
    planoNota: `Plano de governo integral (${c.paginas} páginas), conforme publicado pelo Poder360. Prevalece sobre qualquer trecho citado aqui.`,
    posicoes: posicoesPorCandidato[c.id],
  })),
  // Pares que se separam por EXATAMENTE UM eixo — a definição semântica de contraste
  // neste motor. Verificado contra o corpus; as travas 15 e 16 do §24 recusam qualquer
  // par cujo discriminador tenha lado mudo ou posturas iguais.
  contrastes: [
    { entre: ["C02", "C03"], discriminador: "e_alinhamento_brics",
      inclina: { concordo: "C02", discordo: "C03" },
      nota: "Duas candidaturas que concordam em privatizar, simplificar o licenciamento e disciplinar o gasto. A única coisa que as separa é a política externa: Zema propõe tirar o Brasil do BRICS." },
    { entre: ["C10", "C12"], discriminador: "e_liberdade_irrestrita_redes",
      inclina: { discordo: "C10", concordo: "C12" },
      nota: "Duas candidaturas anticapitalistas de plataforma quase idêntica. Divergem em um ponto: o PCB quer forte regulação das plataformas digitais; o PCO quer o fim de toda censura." },
    { entre: ["C11", "C12"], discriminador: "e_liberdade_irrestrita_redes",
      inclina: { discordo: "C11", concordo: "C12" },
      nota: "Mesmo caso: PSTU e PCO só se separam sobre responsabilizar ou não as plataformas pelo conteúdo que circula nelas." },
    { entre: ["C02", "C06"], discriminador: "e_renda_sem_contrapartida",
      inclina: { concordo: "C02", discordo: "C06" },
      nota: "Ambos ampliam PPPs, licenciamento com prazo e disciplina fiscal. Separam-se sobre preservar ou substituir a transferência de renda incondicional." },
    { entre: ["C03", "C07"], discriminador: "e_licenciamento_simplificado",
      inclina: { concordo: "C03", discordo: "C07" },
      nota: "Duas candidaturas de direita que divergem sobre o rito ambiental: uma quer simplificar o licenciamento, a outra o quer pleno e com garantia financeira prévia." },
    { entre: ["C05", "C10"], discriminador: "e_ministerio_seguranca",
      inclina: { concordo: "C05", discordo: "C10" },
      nota: "Ambos rejeitam o encarceramento em massa e defendem reforma agrária. Separam-se sobre criar um ministério da segurança pública ou substituí-lo por uma política de segurança dos direitos." },
  ],
};

writeFileSync(new URL("data/corpus.json", raiz), JSON.stringify(corpus, null, 2) + "\n");

const nPos = CANDIDATOS.reduce((n, c) => n + posicoesPorCandidato[c.id].length, 0);
console.log(`corpus.json ${corpus.corpusVersion} · ${CANDIDATOS.length} candidatos · ${Object.keys(eixos).length} eixos · ${nPos} posturas (100% com citação literal e página) · ${nInterp} com interpretação declarada · ${corpus.contrastes.length} contrastes`);
