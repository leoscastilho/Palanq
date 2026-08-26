/**
 * Gera data/corpus.json a partir das fontes em source/.
 *
 * Este arquivo É a documentação de proveniência do corpus: cada postura declarada
 * abaixo aponta para o trecho exato de source/propostas.md ou source/auxiliar.md que
 * a sustenta, e toda inferência de curadoria vive no campo `interpretacao`.
 *
 * Rode com:  node tools/gerar-corpus.mjs
 */
import { writeFileSync } from "node:fs";

// ─────────────────────────────────────────────────────────────────────────────
// Candidaturas. IDs seguem a ORDEM DE source/propostas.md.
// Atenção: os códigos entre colchetes em source/auxiliar.md são inconsistentes
// (C03 aparece para Zema e para Cury; Lula aparece como C12). Foram ignorados.
// ─────────────────────────────────────────────────────────────────────────────
const CANDIDATOS = [
  { id: "C01", nome: "Flávio Bolsonaro",       partido: null,  planoUrl: "https://static.poder360.com.br/uploads/2026/08/FLAVIO-BOLSONARO-PARA-O-BRASIL-VENCER-O-ATRASO-1-1.pdf" },
  { id: "C02", nome: "Ronaldo Caiado",         partido: null,  planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano-de-Governo-Ronaldo-Caiado-Presidente.pdf" },
  { id: "C03", nome: "Romeu Zema",             partido: null,  planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_Zema_2026.pdf" },
  { id: "C04", nome: "Renan Missão",           partido: null,  planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_Renan_Missao_2026.pdf" },
  { id: "C05", nome: "Luiz Inácio Lula da Silva", partido: null, planoUrl: "https://static.poder360.com.br/uploads/2026/08/plano-governo-lula.pdf" },
  { id: "C06", nome: "Augusto Cury",           partido: "Avante", planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_Augusto_Cury_2026.pdf" },
  { id: "C07", nome: "Wilson Grassi",          partido: null,  planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_Wilson_Grassi_2026.pdf" },
  { id: "C08", nome: "Clariana Barão",         partido: "DC",   planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_DC_Clariana_Barao.pdf" },
  { id: "C09", nome: "Samara Martins",         partido: "UP",   planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_Samara_UP_2026.pdf.pdf" },
  { id: "C10", nome: "Edmilson Costa",         partido: "PCB",  planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_Edmilson_Costa_PCB_2026.pdf" },
  { id: "C11", nome: "Hertz Dias",             partido: "PSTU", planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_Hertz_Dias_PSTU_2026.pdf" },
  { id: "C12", nome: "Rui Costa Pimenta",      partido: "PCO",  planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_PCO_Rui_Costa_Pimenta2026.pdf" },
];

const NOME = Object.fromEntries(CANDIDATOS.map((c) => [c.id, c.nome]));

// ─────────────────────────────────────────────────────────────────────────────
// Trechos citáveis. `p:` vem de source/propostas.md, `a:` de source/auxiliar.md.
// Nenhum é literal de plano de governo registrado — são resumos curatoriais.
// ─────────────────────────────────────────────────────────────────────────────
const P = {
  sf: "Simplificação e Automação Fiscal: Reestruturação do sistema arrecadatório mediante a simplificação de obrigações e a automação de procedimentos fiscais por meios eletrônicos para reduzir custos de conformidade.",
  pp: "Parcerias e Privatizações: Transferência de ativos e serviços de infraestrutura pública à livre iniciativa por meio de privatizações, concessões e parcerias público-privadas, focando o Estado em atribuições primárias.",
  jfp: "Justiça Fiscal Progressiva: Alteração da matriz de arrecadação nacional para privilegiar a tributação sobre rendimentos elevados, lucros e heranças, com desoneração correspondente sobre o consumo básico.",
  hl: "Humanização das Relações Laborais: Modificação das relações de trabalho mediante a limitação da jornada semanal e fortalecimento de garantias legais, visando à sustentabilidade social do trabalhador.",
  rd: "Reestatização e Gestão da Dívida: Retomada de empresas estratégicas privatizadas e revisão soberana do endividamento público, direcionando os recursos correspondentes diretamente para finalidades sociais estruturantes.",
  vt: "Vigilância Tecnológica Integrada: Fortalecimento do monitoramento territorial e da identificação de padrões por meio do uso integrado de inteligência artificial, sensores e monitoramento ótico digital.",
  ip: "Isolamento de Lideranças Prisionais: Adoção de padrões prisionais de segurança máxima e aplicação de restrições rígidas de comunicação e trânsito para neutralizar a influência de lideranças prisionais sobre o ambiente urbano.",
  cf: "Coordenação Federal Dedicada: Centralização da governança e coordenação de ações de defesa social por meio do estabelecimento de uma pasta ministerial específica de nível federal.",
  dm: "Desmilitarização e Policiamento de Direitos: Transição organizacional das forças de segurança interna para estruturas essencialmente civis de policiamento preventivo de proximidade, pautadas estritamente na proteção de garantias fundamentais.",
  ies: "Integração de Ensino Superior e Ciência: Unificação institucional do ensino superior de tecnologia e das entidades de fomento científico sob a égide da pasta de Ciência, Tecnologia e Inovações, visando à sinergia com o setor produtivo.",
  ed: "Modelo de Ensino Disciplinar: Fortalecimento da disciplina comportamental nas instituições de ensino básico através de modelos de governança estruturada que enfatizem a ordem, hierarquia e valores familiares.",
  ei: "Incentivos de Permanência e Ensino Integral: Ampliação das escolas em tempo integral de natureza civil e o fortalecimento de programas de incentivo pecuniário para mitigação do abandono escolar.",
  ee: "Estatização e Acesso Irrestrito: Estatização integral das estruturas educacionais e desregulamentação dos mecanismos de seleção para o acesso universal e irrestrito ao ensino superior público.",
  is: "Interoperabilidade Tecnológica de Saúde: Implementação de infraestrutura tecnológica integrada para centralização de prontuários médicos e exames, permitindo a comunicação contínua entre diferentes estabelecimentos de atendimento sanitário.",
  gp: "Gestão Assistencial Privada/OSs: Otimização da oferta assistencial por meio de convênios, concessões à iniciativa privada e contratação de horários e exames ociosos em estabelecimentos particulares.",
  tr: "Triagem de Risco Clínico: Regulação de encaminhamentos e consultas por meio de sistemas eletrônicos que utilizam inteligência artificial para priorizar o atendimento com base no risco clínico dinâmico do cidadão.",
  as: "Abolição Sanitária Privada e Estatização SUS: Nacionalização integral das entidades médico-hospitalares, descredenciamento definitivo de operadoras de planos de saúde e gestão sanitária realizada por representações de trabalhadores.",
};

const A = {
  sindical: "Oposição à Monopolização e Ativismo Sindical: Rejeição explícita à centralidade de representações corporativistas na formulação de políticas públicas e à restauração de encargos compulsórios sobre trabalhadores.",
  plataformas: "Oposição a Marcos Regulatórios Restritivos no Trabalho Digital: Contrariedade ativa à imposição de vínculos empregatícios rígidos que limitem a flexibilidade operacional dos serviços prestados por plataformas eletrônicas.",
  foro: "Oposição à Jurisdição Penal Originária e Monocrática de Tribunais Superiores: Rejeição à competência de julgamento penal de parlamentares por cortes constitucionais e à validade de decisões individuais que suspendam atos do Legislativo.",
  reeleicao: "Oposição à Perpetuidade de Mandatos Executivos: Rejeição categórica à renovação consecutiva de mandatos presidenciais, estaduais e municipais como garantia de isonomia eleitoral e desvinculação da máquina pública.",
  emendasC02: "Oposição ao Alocamento de Recursos sem Rastreabilidade: Rejeição ao direcionamento de emendas impositivas e mecanismos de transferência orçamentária que fragmentem o orçamento ou careçam de acompanhamento transparente.",
  sigilo: "Oposição a Mecanismos de Sigilo Governamental: Rejeição à imposição de sigilos temporais extensos sobre gastos, notas fiscais e relatórios da administração federal.",
  fundos: "Oposição ao Financiamento Público de Partidos e Campanhas: Rejeição explícita à manutenção de dotações orçamentárias públicas (Fundos Partidário e Eleitoral) para o custeio de atividades partidárias.",
  conselhos_prof: "Oposição a Barreiras Corporativas de Trabalho: Rejeição a restrições legais e de conselhos que limitem o livre exercício de profissões sem riscos iminentes à integridade física do cidadão.",
  municipios: "Oposição à Proliferação de Municípios sem Sustentabilidade: Rejeição à autonomia de entes municipais cuja arrecadação própria seja insuficiente para fazer face aos respectivos custos administrativos.",
  contrapartida: "Oposição à Transferência de Renda sem Contrapartida Cívica: Rejeição ao formato assistencial tradicional e incondicional, propondo a transição para modelos baseados em atividades comunitárias públicas.",
  pejotizacao: "Oposição à Pejotização e Subcontratação Irrestrita: Rejeição ativa a práticas contratuais que dissimulem vínculos empregatícios mediante regimes de pessoa jurídica para desoneração de responsabilidades fiscais.",
  emendasC05: "Oposição ao Orçamento Secreto e Emendas sem Planejamento: Rejeição a dispositivos orçamentários de emendas parlamentares impositivas que dispersem recursos de forma desconectada das prioridades do Plano Plurianual.",
  polarizacao: "Oposição à Polarização Ideológica e ao Confronto Retórico: Rejeição à governança baseada no antagonismo estéril de blocos ideológicos e à cultura do conflito nos Três Poderes.",
  cartesiano: "Oposição ao Modelo Pedagógico Cartesiano Expositivo: Rejeição aos métodos de ensino baseados unicamente na absorção passiva de conteúdos, sem desenvolvimento socioemocional.",
  capital_intelectual: "Oposição à Perda Passiva de Capital Intelectual: Rejeição à concessão de fomento à formação de pós-graduandos sem a devida fixação de carreiras e retorno tecnológico ao território nacional.",
  extrajudicial: "Oposição a Regimes Extrajudiciais Prisionais: Rejeição à importação de suspensões de direitos individuais ou prisões em massa sem o devido processo legal.",
  evidencias: "Oposição a Políticas de Segurança sem Evidências: Rejeição a práticas de policiamento e contenção urbana que careçam de dados empíricos de eficácia e monitoramento de resultados.",
  teto: "Oposição às Regras de Responsabilidade e Teto Fiscal: Rejeição absoluta ao Arcabouço Fiscal, à Lei de Responsabilidade Fiscal e a limites fiscais de gastos correntes e sociais.",
  divida: "Oposição ao Serviço da Dívida e Agiotagem Financeira: Rejeição ao direcionamento de recursos federais para o pagamento e amortização de títulos da dívida pública, exigindo auditoria imediata.",
  neoliberais: "Oposição a Reformas Neoliberais e Terceirização: Rejeição integral às reformas trabalhista e previdenciária promovidas desde 2016 e à flexibilização de contratações indiretas.",
  gestao_privada: "Oposição à Gestão Privada de Serviços Públicos: Rejeição irrestrita a convênios com Organizações Sociais (OSs), fundações de direito privado e privatização de hospitais, escolas, transportes e saneamento.",
  militarizado: "Oposição ao Ensino Militarizado e Projetos de Controle Ideológico: Rejeição a modelos escolares cívico-militarizados e a restrições de debate docente nas salas de aula.",
  terapeuticas: "Oposição a Comunidades Terapêuticas de Base Privada: Rejeição à destinação de recursos públicos para entidades de acolhimento asilares ou de base religiosa para dependentes químicos.",
  vestibular: "Oposição a Exames de Seleção Universitária: Rejeição ao sistema de vestibulares ou quaisquer métodos de seleção excludente para o ingresso no ensino superior.",
  // Parte 2 — diferenciação programática
  uso_servicos: "Uso Obrigatório de Serviços Públicos: Determinação legal para que o Presidente, prefeitos, juízes e parlamentares utilizem exclusivamente o SUS e as escolas públicas para si e seus dependentes, alinhando a vivência decisória à realidade popular.",
  dez_pib: "Orçamento Mínimo Vinculado: Defesa de teto de dotação orçamentária fixa de, no mínimo, 10% do PIB diretamente para o fomento da educação pública básica e superior.",
  ferrovias: "Soberania em Transportes: Estatização imediata da CBTU e foco no Plano Nacional de Malha Ferroviária e Metroviária para reduzir a poluição e retirar frotas de concessões privadas.",
  exportacao: "Restrição à Exportação Agrícola: Proibição da exportação de gêneros alimentícios essenciais sem o prévio abastecimento seguro do mercado interno a preços populares.",
  unicameral: "Unicameralismo e Extinção do Senado: Substituição do Congresso Nacional por um Parlamento Unicameral e instauração dos Conselhos Populares deliberativos (trabalho, moradia e estudo) como base da democracia direta.",
  magistratura: "Mandatos Temporários para a Magistratura: Instituição de mandatos de 10 anos, elegíveis e revogáveis pelo voto popular, para juízes de Tribunais Regionais e Superiores, pondo fim à vitaliciedade.",
  bets: "Proibição de Apostas Virtuais (BETs): Interdição total de plataformas de apostas eletrônicas esportivas e expropriação imediata de seus ativos financeiros.",
  estabilidade: "Estabilidade Geral no Emprego: Restabelecimento da estabilidade no emprego para todos os trabalhadores (públicos e privados) após 5 anos de vínculo (OIT 158).",
  escala_movel: "Escala Móvel de Horas e Pleno Emprego: Redução da jornada para 36 horas sem perdas de salários, associada a uma escala móvel que ajuste as horas conforme a demanda para garantir o emprego a todos.",
  bolsa_desemprego: "Bolsa de Amparo ao Desempregado: Criação de benefício de um salário mínimo para cidadãos sem colocação profissional enquanto o pleno emprego não for estruturalmente atingido.",
  ouro: "Expropriação da Cadeia do Ouro: Estatização e expropriação total da produção nacional de ouro e metais preciosos para sua incorporação às reservas cambiais públicas, visando ao descolamento do padrão-dólar.",
  apps_estatais: "Plataformas Tecnológicas Públicas: Criação de aplicativos nacionais estatais de entrega e e-commerce para concorrer com monopólios estrangeiros, subsidiados por empresas expropriadas.",
  midia: "Estatização dos Monopólios de Imprensa: Cancelamento imediato de concessões públicas de radiodifusão e grandes corporações de mídia (ex: Rede Globo) por atos lesa-pátria, transferindo os ativos ao controle operário.",
  cultura: "Defesa da Cultura de Massa Periférica: Proteção contra perseguições institucionais a manifestações do samba, carnaval e futebol, outorgando o controle dos clubes desportivos diretamente a torcedores e trabalhadores do setor.",
  aposentadoria: "Aposentadoria Precoce: Garantia de aposentadoria aos 25 anos de serviço para mulheres e 30 anos para homens.",
  celular: "Fim das Restrições Tecnológicas Escolares: Oposição explícita à proibição de aparelhos celulares nas salas de aula e à censura disciplinar.",
  treva: "Complexo Federal “TREVA”: Instalação de 5 novos presídios de segurança máxima voltados ao isolamento absoluto de chefes de facções criminosas.",
  maioridade: "Punição a Maiores de 14 Anos: Defesa da redução da maioridade penal para 16 anos e punição penal severa a jovens a partir dos 14 anos por crimes dolosos graves.",
  fundo_vitimas: "Fundo de Indenização às Famílias das Vítimas: Redirecionamento integral de dotações destinadas ao auxílio-reclusão das famílias de detentos diretamente para as famílias das vítimas de crimes graves.",
  muralha: "Muralha Brasileira: Criação de uma malha nacional integrada de reconhecimento facial por inteligência artificial dotada de mais de 1 milhão de pontos de captura.",
  centro_governo: "Centro de Governo Integrado: Criação de um núcleo executivo com a atribuição de vincular a permanência ministerial ao atingimento de cartas de missão com indicadores sociais rígidos.",
  corregedoria: "Corregedoria Externa do STF: Instituição de corregedoria independente para avaliar a conduta administrativa e as extrapolações normativas de ministros da Corte Suprema.",
  sem_estabilidade: "Contratação de Servidores sem Estabilidade Ampla: Criação de novos vínculos na administração pública que prescindam de estabilidade de carreira para cargos de natureza não típica de Estado.",
  mec_mcti: "Divisão de Competências do MEC: Concentração das atribuições do MEC unicamente na educação básica e de primeira infância, deslocando o ensino superior de forma definitiva para o MCTI.",
  fusao_municipal: "Grande Consolidação Municipal: Programa compulsório de fusão de pequenos municípios economicamente dependentes e inviáveis em distritos de maior escala.",
  frentes_cidadas: "Frentes Cidadãs de Trabalho: Eliminação do Bolsa Família e substituição por dotações monetárias condicionadas à prestação de serviços civis de manutenção e obras públicas locais.",
  resp_gerencial: "Lei de Responsabilidade Gerencial: Regulamentação que penaliza partidos políticos e extingue repasses estatais a governos locais que apresentem indicadores de saúde e emprego em declínio permanente.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Eixos. `peso` 1–3, escala documentada em docs/CURADORIA.md:
//   3 = eixo estruturante — reorganiza um setor inteiro ou a matriz do Estado
//   2 = política setorial relevante, de efeito amplo mas delimitado
//   1 = mecanismo institucional específico
// `formulacaoNeutra` é AUTOAVALIAÇÃO do curador e marcador de revisão (§15).
// ─────────────────────────────────────────────────────────────────────────────
const E = (label, pergunta, dominio, peso, formulacaoNeutra = true, notaRedacao = null) =>
  ({ label, pergunta, dominio, peso, formulacaoNeutra, notaRedacao });

const EIXOS = {
  // ── eixos DIVISIVOS (há favor e contra declarados) ────────────────────────
  e_privatizacoes: E("Privatizações, concessões e PPPs",
    "Você concorda que ativos e serviços de infraestrutura pública sejam transferidos à iniciativa privada por meio de privatizações, concessões e parcerias público-privadas?",
    "economia", 3),
  e_gestao_privada_saude: E("Gestão privada e OSs na saúde pública",
    "Você concorda que o poder público amplie a oferta de saúde por convênios com organizações sociais, concessões à iniciativa privada e compra de serviços em estabelecimentos particulares?",
    "saude", 3),
  e_ensino_civico_militar: E("Modelo escolar disciplinar / cívico-militar",
    "Você concorda que a educação básica adote modelos de governança escolar centrados em disciplina, hierarquia e valores familiares?",
    "educacao", 3),
  e_flexibilizacao_trabalhista: E("Flexibilização dos vínculos de trabalho",
    "Você concorda com a flexibilização dos vínculos de trabalho — contratação por plataformas sem vínculo empregatício, terceirização ampla e prestação de serviço como pessoa jurídica?",
    "trabalho", 3),
  e_encarceramento_excecao: E("Encarceramento de exceção",
    "Você concorda com a adoção de regimes prisionais de exceção — encarceramento em larga escala e suspensão de garantias individuais — como política de segurança pública?",
    "seguranca", 3, false,
    "Não foi possível formular este eixo sem carga avaliativa: qualquer redação que descreva o mecanismo já o qualifica. Marcado para revisão."),
  e_estabilidade_emprego: E("Estabilidade no emprego",
    "Você concorda com a garantia legal de estabilidade no emprego após um período de vínculo, no serviço público e no setor privado?",
    "trabalho", 2),
  e_renda_sem_contrapartida: E("Transferência de renda sem contrapartida",
    "Você concorda com programas de transferência de renda pagos sem exigência de contrapartida em trabalho ou serviço comunitário?",
    "social", 3),

  // ── eixos NÃO DISCRIMINANTES (unânimes ou unilaterais) ────────────────────
  e_simplificacao_fiscal: E("Simplificação e automação fiscal",
    "Você concorda com a simplificação de obrigações tributárias e a automação eletrônica de procedimentos fiscais para reduzir custos de conformidade?", "tributacao", 2),
  e_justica_fiscal_progressiva: E("Tributação progressiva sobre renda, lucro e herança",
    "Você concorda em deslocar a carga tributária para rendimentos elevados, lucros e heranças, desonerando o consumo básico?", "tributacao", 3),
  e_reducao_jornada: E("Redução da jornada de trabalho",
    "Você concorda com a redução da jornada semanal de trabalho acompanhada do reforço de garantias legais?", "trabalho", 2),
  e_reestatizacao: E("Reestatização de empresas estratégicas",
    "Você concorda com a retomada pelo Estado de empresas estratégicas que foram privatizadas?", "economia", 3),
  e_teto_fiscal: E("Regras de teto e responsabilidade fiscal",
    "Você concorda com a manutenção de regras que limitam o crescimento do gasto público, como o arcabouço fiscal e a Lei de Responsabilidade Fiscal?", "fiscal", 3),
  e_servico_divida: E("Pagamento do serviço da dívida pública",
    "Você concorda que o orçamento federal continue destinando recursos ao pagamento e à amortização dos títulos da dívida pública?", "fiscal", 3),
  e_representacao_sindical: E("Financiamento compulsório e peso institucional dos sindicatos",
    "Você concorda com a participação central de entidades sindicais na formulação de políticas públicas e com encargos compulsórios que as financiem?", "trabalho", 1),
  e_conselhos_profissionais: E("Restrições de conselhos ao exercício profissional",
    "Você concorda com a manutenção de exigências legais e de conselhos profissionais para o exercício de ocupações que não envolvem risco à integridade física?", "trabalho", 2),
  e_escala_movel: E("Escala móvel de horas e pleno emprego",
    "Você concorda com a redução da jornada para 36 horas sem redução salarial, com escala móvel que distribua as horas para garantir emprego a todos?", "trabalho", 2),
  e_expropriacao_ouro: E("Estatização da cadeia do ouro",
    "Você concorda com a estatização da produção nacional de ouro e metais preciosos para compor reservas cambiais públicas?", "economia", 2),
  e_plataformas_estatais: E("Plataformas digitais estatais",
    "Você concorda com a criação de aplicativos estatais de entrega e comércio eletrônico para concorrer com plataformas privadas?", "economia", 2),
  e_proibicao_bets: E("Proibição de apostas eletrônicas",
    "Você concorda com a proibição total das plataformas de apostas esportivas eletrônicas e a expropriação de seus ativos?", "economia", 2),
  e_restricao_exportacao_alimentos: E("Restrição à exportação de alimentos essenciais",
    "Você concorda com a proibição de exportar gêneros alimentícios essenciais antes de assegurado o abastecimento interno a preços populares?", "economia", 2),
  e_aposentadoria_tempo_servico: E("Aposentadoria por tempo de serviço reduzido",
    "Você concorda com aposentadoria garantida aos 25 anos de serviço para mulheres e 30 para homens?", "previdencia", 2),

  e_vigilancia_massa: E("Vigilância eletrônica e reconhecimento facial",
    "Você concorda com o monitoramento territorial por inteligência artificial, sensores e reconhecimento facial em larga escala?", "seguranca", 3),
  e_isolamento_liderancas: E("Isolamento de lideranças de facções",
    "Você concorda com presídios de segurança máxima e restrição rígida de comunicação para isolar lideranças de facções criminosas?", "seguranca", 2),
  e_ministerio_seguranca: E("Pasta federal dedicada à segurança",
    "Você concorda com a criação de um ministério federal específico para coordenar as ações de segurança e defesa social?", "seguranca", 1),
  e_desmilitarizacao: E("Desmilitarização das polícias",
    "Você concorda com a transição das forças de segurança para estruturas civis de policiamento preventivo de proximidade?", "seguranca", 3),
  e_maioridade_penal: E("Redução da maioridade penal",
    "Você concorda com a redução da maioridade penal para 16 anos e com punição penal severa a adolescentes a partir dos 14 por crimes dolosos graves?", "seguranca", 3),
  e_fundo_vitimas: E("Redirecionamento do auxílio-reclusão",
    "Você concorda em redirecionar as dotações do auxílio-reclusão para um fundo de indenização às famílias das vítimas de crimes graves?", "seguranca", 1),
  e_seguranca_baseada_evidencias: E("Exigência de evidência empírica em segurança",
    "Você concorda que práticas de policiamento só sejam adotadas mediante dados empíricos de eficácia e monitoramento de resultados?", "seguranca", 2),

  e_ensino_superior_mcti: E("Ensino superior sob a pasta de Ciência e Tecnologia",
    "Você concorda em deslocar o ensino superior e o fomento científico do MEC para o Ministério de Ciência, Tecnologia e Inovações?", "educacao", 2),
  e_ensino_integral_civil: E("Escola em tempo integral e incentivo à permanência",
    "Você concorda com a ampliação de escolas em tempo integral de natureza civil e com incentivos pecuniários contra o abandono escolar?", "educacao", 2),
  e_estatizacao_ensino: E("Estatização integral do ensino",
    "Você concorda com a estatização integral das estruturas educacionais do país?", "educacao", 3),
  e_fim_vestibular: E("Fim dos exames de seleção para o ensino superior",
    "Você concorda com o fim do vestibular e de outros exames de seleção como forma de ingresso no ensino superior público?", "educacao", 2),
  e_pedagogia_socioemocional: E("Pedagogia socioemocional",
    "Você concorda que o ensino básico substitua a transmissão expositiva de conteúdo por métodos que incluam desenvolvimento socioemocional?", "educacao", 2),
  e_orcamento_educacao_pib: E("Piso de 10% do PIB para a educação",
    "Você concorda com a vinculação de no mínimo 10% do PIB ao financiamento da educação pública?", "educacao", 2),
  e_celular_em_sala: E("Uso de celular em sala de aula",
    "Você concorda com a permissão do uso de aparelhos celulares em sala de aula?", "educacao", 1),

  e_interoperabilidade_saude: E("Prontuário eletrônico integrado",
    "Você concorda com a centralização de prontuários e exames em uma infraestrutura tecnológica que integre todos os estabelecimentos de saúde?", "saude", 2),
  e_triagem_ia: E("Triagem de atendimento por inteligência artificial",
    "Você concorda que encaminhamentos e consultas sejam regulados por sistemas de inteligência artificial que priorizem por risco clínico?", "saude", 2),
  e_comunidades_terapeuticas: E("Repasse público a comunidades terapêuticas",
    "Você concorda com a destinação de recursos públicos a comunidades terapêuticas de base privada ou religiosa para dependentes químicos?", "saude", 2),

  e_foro_e_monocraticas: E("Foro penal em cortes superiores e decisões monocráticas",
    "Você concorda com a competência de cortes constitucionais para julgar penalmente parlamentares e com decisões individuais de ministros que suspendam atos do Legislativo?", "justica", 2),
  e_controle_externo_stf: E("Controle externo do Supremo Tribunal Federal",
    "Você concorda com a criação de corregedoria externa ao STF e com a votação obrigatória, pelo Senado, de pedidos de destituição de ministros?", "justica", 2),
  e_mandato_magistratura: E("Fim da vitaliciedade da magistratura",
    "Você concorda com mandatos temporários e revogáveis por voto popular para juízes de tribunais regionais e superiores?", "justica", 3),
  e_reeleicao_executivo: E("Reeleição consecutiva no Executivo",
    "Você concorda com a manutenção da reeleição consecutiva para presidente, governadores e prefeitos?", "politica", 2),
  e_emendas_impositivas: E("Emendas parlamentares impositivas",
    "Você concorda com a manutenção de emendas parlamentares impositivas e de mecanismos de transferência orçamentária sem rastreabilidade?", "orcamento", 2),
  e_sigilo_gastos: E("Sigilo sobre gastos da administração federal",
    "Você concorda com a imposição de sigilos de longo prazo sobre gastos, notas fiscais e relatórios da administração federal?", "transparencia", 1),
  e_financiamento_publico_campanhas: E("Fundo partidário e fundo eleitoral",
    "Você concorda com a manutenção de recursos públicos (Fundo Partidário e Fundo Eleitoral) para custear partidos e campanhas?", "politica", 2),
  e_unicameralismo: E("Parlamento unicameral e conselhos populares",
    "Você concorda com a substituição do Congresso por um parlamento unicameral e com conselhos populares deliberativos como base da democracia direta?", "politica", 3),
  e_fusao_municipios: E("Fusão compulsória de municípios",
    "Você concorda com a fusão compulsória de pequenos municípios economicamente dependentes em distritos de maior escala?", "federativo", 2),
  e_responsabilidade_gerencial: E("Sanção a governos locais por indicadores",
    "Você concorda com a extinção de repasses e a penalização de partidos quando governos locais apresentam indicadores de saúde e emprego em declínio?", "federativo", 1),
  e_centro_governo: E("Permanência ministerial vinculada a metas",
    "Você concorda em vincular a permanência de ministros no cargo ao cumprimento de cartas de missão com indicadores rígidos?", "estado", 1),
  e_despolarizacao: E("Governança pela despolarização",
    "Você concorda que o governo deva ser conduzido pela busca ativa de acordo entre blocos ideológicos, em vez do confronto?", "politica", 1),
  e_fixacao_pesquisadores: E("Contrapartida de fixação para pós-graduandos",
    "Você concorda que o fomento à pós-graduação seja condicionado à fixação de carreiras e ao retorno tecnológico no país?", "ciencia", 2),
  e_estatizacao_midia: E("Estatização de grupos de comunicação",
    "Você concorda com o cancelamento das concessões de radiodifusão de grandes grupos de mídia e a transferência de seus ativos ao controle de trabalhadores?", "comunicacao", 3),
  e_uso_obrigatorio_servicos_publicos: E("Uso obrigatório de SUS e escola pública por autoridades",
    "Você concorda com a obrigação legal de que autoridades dos três poderes usem exclusivamente o SUS e as escolas públicas?", "estado", 2),
  e_estatizacao_ferroviaria: E("Estatização do transporte ferroviário",
    "Você concorda com a estatização da malha ferroviária e metroviária, retirando-a de concessões privadas?", "transporte", 2),
  e_controle_torcedores: E("Controle de clubes por torcedores e trabalhadores",
    "Você concorda com a transferência do controle dos clubes desportivos a torcedores e trabalhadores do setor?", "cultura", 1),
};

// ─────────────────────────────────────────────────────────────────────────────
// Posturas. Cada entrada: [eixo, postura, candidatos, texto, seção, contexto, interpretação]
//   seção "p:<Eixo>"  → source/propostas.md
//   seção "a1"        → source/auxiliar.md, Parte 1 (oposições explícitas)
//   seção "a2"        → source/auxiliar.md, Parte 2 (diferenciação programática)
// `interpretacao` preenchida = a postura NÃO é literal no trecho; é inferência
// do curador, e o instrumento a exibe ao lado da citação para que seja contestada.
// ─────────────────────────────────────────────────────────────────────────────
const POS = [];
const pos = (eixo, postura, cands, texto, secao, contexto, interpretacao = null) =>
  POS.push({ eixo, postura, cands, texto, secao, contexto, interpretacao });

const TODOS_DIR = ["C01", "C02", "C03", "C04"];
const ESQ = ["C09", "C10", "C11", "C12"];

// ── DIVISIVOS ────────────────────────────────────────────────────────────────
pos("e_privatizacoes", "favor", ["C01","C02","C03","C04","C08"], P.pp, "p:Economia e Tributação", "item do eixo Economia e Tributação, ao lado da simplificação fiscal");
pos("e_privatizacoes", "contra", ESQ, A.gestao_privada, "a1", "eixo Gestão de Serviços Sociais, no bloco compartilhado por UP, PCB, PSTU e PCO");

pos("e_gestao_privada_saude", "favor", ["C01","C02","C03","C04","C06","C07","C08"], P.gp, "p:Saúde", "item do eixo Saúde");
pos("e_gestao_privada_saude", "contra", ESQ, P.as, "p:Saúde", "único item do eixo Saúde nas quatro candidaturas");

pos("e_ensino_civico_militar", "favor", TODOS_DIR, P.ed, "p:Educação", "item do eixo Educação");
pos("e_ensino_civico_militar", "contra", ESQ, A.militarizado, "a1", "eixo Gestão de Serviços Sociais, no bloco compartilhado");

pos("e_flexibilizacao_trabalhista", "favor", ["C01"], A.plataformas, "a1", "eixo Governança do Trabalho e Organização Social",
  "O plano não declara apoio explícito à flexibilização; declara contrariedade ativa à imposição de vínculos empregatícios rígidos no trabalho por plataformas. A postura \"favor\" é inferida dessa rejeição e é contestável.");
pos("e_flexibilizacao_trabalhista", "contra", ["C05"], A.pejotizacao, "a1", "eixo Relações de Trabalho e Estrutura Organizacional");
pos("e_flexibilizacao_trabalhista", "contra", ESQ, A.neoliberais, "a1", "eixo Relações Trabalhistas e Previdenciárias, no bloco compartilhado");

pos("e_encarceramento_excecao", "favor", ["C01"], A.treva, "a2", "subitem do bloco intitulado \"Infraestrutura Prisional de Padrão Salvadorenho\"",
  "A postura \"favor\" apoia-se no enunciado curatorial que enquadra a proposta como padrão salvadorenho. O texto descreve presídios federais de segurança máxima para lideranças de facções — não encarceramento em massa nem suspensão de garantias. A inferência é do curador e é a mais frágil deste corpus.");
pos("e_encarceramento_excecao", "contra", ["C07"], A.extrajudicial, "a1", "eixo Ciência e Relações Comerciais");

pos("e_estabilidade_emprego", "contra", ["C03"], A.sem_estabilidade, "a2", "bloco Modernização Administrativa e de Carreira");
pos("e_estabilidade_emprego", "favor", ["C10"], A.estabilidade, "a2", "bloco Regulação e Controle Financeiro");

pos("e_renda_sem_contrapartida", "contra", ["C04"], A.contrapartida, "a1", "eixo Assistencialismo e Fomento");
pos("e_renda_sem_contrapartida", "favor", ["C11"], A.bolsa_desemprego, "a2", "bloco Organização Econômica e Distribuição de Riqueza",
  "O plano não discute contrapartidas; propõe um benefício de um salário mínimo a desempregados sem condicionalidade declarada. A postura \"favor\" é inferida da ausência de contrapartida no desenho do benefício.");

// ── ECONOMIA / TRIBUTAÇÃO / TRABALHO ─────────────────────────────────────────
pos("e_simplificacao_fiscal", "favor", ["C01","C02","C03","C04","C06","C07","C08"], P.sf, "p:Economia e Tributação", "primeiro item do eixo Economia e Tributação");
pos("e_justica_fiscal_progressiva", "favor", ["C05", ...ESQ], P.jfp, "p:Economia e Tributação", "primeiro item do eixo Economia e Tributação");
pos("e_reducao_jornada", "favor", ["C05", ...ESQ], P.hl, "p:Economia e Tributação", "item do eixo Economia e Tributação");
pos("e_reestatizacao", "favor", ESQ, P.rd, "p:Economia e Tributação", "item do eixo Economia e Tributação");
pos("e_teto_fiscal", "contra", ESQ, A.teto, "a1", "eixo Matriz Macroeconômica e Finanças Públicas, no bloco compartilhado");
pos("e_servico_divida", "contra", ESQ, A.divida, "a1", "eixo Matriz Macroeconômica e Finanças Públicas, no bloco compartilhado");
pos("e_representacao_sindical", "contra", ["C01"], A.sindical, "a1", "eixo Governança do Trabalho e Organização Social");
pos("e_conselhos_profissionais", "contra", ["C03"], A.conselhos_prof, "a1", "eixo Finanças e Reforma do Estado");
pos("e_escala_movel", "favor", ["C11"], A.escala_movel, "a2", "bloco Organização Econômica e Distribuição de Riqueza");
pos("e_expropriacao_ouro", "favor", ["C11"], A.ouro, "a2", "bloco Soberania Mineral e Financeira Rígida");
pos("e_plataformas_estatais", "favor", ["C11"], A.apps_estatais, "a2", "bloco Soberania Mineral e Financeira Rígida");
pos("e_proibicao_bets", "favor", ["C10"], A.bets, "a2", "bloco Regulação e Controle Financeiro");
pos("e_restricao_exportacao_alimentos", "favor", ["C09"], A.exportacao, "a2", "bloco Abastecimento e Soberania Alimentar");
pos("e_aposentadoria_tempo_servico", "favor", ["C12"], A.aposentadoria, "a2", "bloco Políticas Educacionais e Previdenciárias Singulares");

// ── SEGURANÇA ────────────────────────────────────────────────────────────────
pos("e_vigilancia_massa", "favor", ["C02","C03","C04","C05","C06","C07","C08"], P.vt, "p:Segurança Pública", "primeiro item do eixo Segurança Pública");
pos("e_vigilancia_massa", "favor", ["C01"], A.muralha, "a2", "bloco Vigilância Eletrônica de Massa");
pos("e_isolamento_liderancas", "favor", ["C01","C02","C03","C04","C07"], P.ip, "p:Segurança Pública", "item do eixo Segurança Pública");
pos("e_ministerio_seguranca", "favor", ["C01","C02","C05","C06"], P.cf, "p:Segurança Pública", "item do eixo Segurança Pública");
pos("e_desmilitarizacao", "favor", ESQ, P.dm, "p:Segurança Pública", "único item do eixo Segurança Pública nas quatro candidaturas");
pos("e_maioridade_penal", "favor", ["C01"], A.maioridade, "a2", "bloco Reformulação Penal e Assistencial de Custódia");
pos("e_fundo_vitimas", "favor", ["C01"], A.fundo_vitimas, "a2", "bloco Reformulação Penal e Assistencial de Custódia");
pos("e_seguranca_baseada_evidencias", "favor", ["C08"], A.evidencias, "a1", "eixo Políticas de Defesa Social e Gênero");

// ── EDUCAÇÃO ─────────────────────────────────────────────────────────────────
pos("e_ensino_superior_mcti", "favor", ["C01","C04"], P.ies, "p:Educação", "item do eixo Educação");
pos("e_ensino_superior_mcti", "favor", ["C03"], A.mec_mcti, "a2", "bloco Modernização Administrativa e de Carreira");
pos("e_ensino_integral_civil", "favor", ["C02","C05","C06","C07"], P.ei, "p:Educação", "item do eixo Educação");
pos("e_estatizacao_ensino", "favor", ESQ, P.ee, "p:Educação", "único item do eixo Educação nas quatro candidaturas");
pos("e_fim_vestibular", "favor", ESQ, A.vestibular, "a1", "eixo Gestão de Serviços Sociais, no bloco compartilhado");
pos("e_pedagogia_socioemocional", "favor", ["C06"], A.cartesiano, "a1", "eixo Cultura Política e Modelos Educacionais");
pos("e_orcamento_educacao_pib", "favor", ["C09"], A.dez_pib, "a2", "bloco Políticas Educacionais e de Infraestrutura");
pos("e_celular_em_sala", "favor", ["C12"], A.celular, "a2", "bloco Políticas Educacionais e Previdenciárias Singulares");

// ── SAÚDE ────────────────────────────────────────────────────────────────────
pos("e_interoperabilidade_saude", "favor", ["C01","C02","C03","C04","C05","C06","C07","C08"], P.is, "p:Saúde", "primeiro item do eixo Saúde");
pos("e_triagem_ia", "favor", ["C01","C02","C03","C04","C05","C06","C07"], P.tr, "p:Saúde", "item do eixo Saúde");
pos("e_comunidades_terapeuticas", "contra", ESQ, A.terapeuticas, "a1", "eixo Gestão de Serviços Sociais, no bloco compartilhado");

// ── INSTITUIÇÕES, JUSTIÇA, ORÇAMENTO ─────────────────────────────────────────
pos("e_foro_e_monocraticas", "contra", ["C01"], A.foro, "a1", "eixo Justiça e Equilíbrio de Poderes");
pos("e_controle_externo_stf", "favor", ["C03"], A.corregedoria, "a2", "bloco Reforma do Sistema de Justiça e do Controle");
pos("e_mandato_magistratura", "favor", ["C10"], A.magistratura, "a2", "bloco Democratização e Controle do Judiciário");
pos("e_reeleicao_executivo", "contra", ["C02"], A.reeleicao, "a1", "eixo Reforma Política e Gestão de Campanha");
pos("e_emendas_impositivas", "contra", ["C02"], A.emendasC02, "a1", "eixo Finanças Públicas e Orçamento");
pos("e_emendas_impositivas", "contra", ["C05"], A.emendasC05, "a1", "eixo Relações de Trabalho e Estrutura Organizacional");
pos("e_sigilo_gastos", "contra", ["C03"], A.sigilo, "a1", "eixo Finanças e Reforma do Estado");
pos("e_financiamento_publico_campanhas", "contra", ["C03"], A.fundos, "a1", "eixo Finanças e Reforma do Estado");
pos("e_unicameralismo", "favor", ["C10"], A.unicameral, "a2", "bloco Reforma do Estado e Poder Popular");
pos("e_fusao_municipios", "favor", ["C04"], A.fusao_municipal, "a2", "bloco Reorganização Territorial e Gerencial");
pos("e_responsabilidade_gerencial", "favor", ["C04"], A.resp_gerencial, "a2", "bloco Governança por Desempenho Local");
pos("e_centro_governo", "favor", ["C02"], A.centro_governo, "a2", "bloco Coordenação Rígida de Governo");
pos("e_despolarizacao", "favor", ["C06"], A.polarizacao, "a1", "eixo Cultura Política e Modelos Educacionais");
pos("e_fixacao_pesquisadores", "favor", ["C07"], A.capital_intelectual, "a1", "eixo Ciência e Relações Comerciais");
pos("e_estatizacao_midia", "favor", ["C12"], A.midia, "a2", "bloco Meios de Comunicação e Cultura Popular");
pos("e_uso_obrigatorio_servicos_publicos", "favor", ["C09"], A.uso_servicos, "a2", "bloco Atuação de Agentes Públicos e Responsabilidade Direta");
pos("e_estatizacao_ferroviaria", "favor", ["C09"], A.ferrovias, "a2", "bloco Políticas Educacionais e de Infraestrutura");
pos("e_controle_torcedores", "favor", ["C12"], A.cultura, "a2", "bloco Meios de Comunicação e Cultura Popular");

// ─────────────────────────────────────────────────────────────────────────────
// Montagem
// ─────────────────────────────────────────────────────────────────────────────
const ARQUIVO = { p: "source/propostas.md", a1: "source/auxiliar.md", a2: "source/auxiliar.md" };
const PARTE = {
  a1: "Parte 1 — Mapeamento de Oposições Explícitas",
  a2: "Parte 2 — Especificação e Diferenciação Programática",
};

function localizador(secao, candId) {
  const nome = NOME[candId];
  if (secao.startsWith("p:")) return `${ARQUIVO.p} › ${nome} › Eixo: ${secao.slice(2)}`;
  return `${ARQUIVO[secao]} › ${PARTE[secao]} › ${nome}`;
}
function fonteDe(secao) {
  const arq = secao.startsWith("p:") ? ARQUIVO.p : ARQUIVO[secao];
  return `${arq} — resumo curatorial (não é transcrição literal do plano registrado)`;
}

const ordemEixo = Object.keys(EIXOS);
const posicoesPorCandidato = Object.fromEntries(CANDIDATOS.map((c) => [c.id, []]));

for (const p of POS) {
  for (const cid of p.cands) {
    if (!posicoesPorCandidato[cid]) throw new Error(`candidato desconhecido: ${cid}`);
    posicoesPorCandidato[cid].push({
      eixo: p.eixo,
      postura: p.postura,
      citacao: {
        texto: p.texto,
        fonte: fonteDe(p.secao),
        local: localizador(p.secao, cid),
        url: null,
        contexto: p.contexto,
        recuperadoEm: null,
      },
      interpretacao: p.interpretacao,
    });
  }
}
for (const cid of Object.keys(posicoesPorCandidato)) {
  posicoesPorCandidato[cid].sort((a, b) => ordemEixo.indexOf(a.eixo) - ordemEixo.indexOf(b.eixo));
}

const corpus = {
  schemaVersion: "1.0.0",
  corpusVersion: "0.1.0",
  escopo: {
    eleicao: "Eleição Geral de 2026",
    cargo: "Presidente da República",
    ambito: "Brasil",
    turno: 1,
  },
  status: "draft",
  aviso:
    "CORPUS EM RASCUNHO. As citações deste corpus são RESUMOS CURATORIAIS extraídos de source/propostas.md e source/auxiliar.md — não são transcrições literais dos planos de governo registrados. Os planos completos estão linkados em cada candidatura e prevalecem sobre qualquer resumo aqui. Este instrumento compara posições declaradas em documentos e NÃO recomenda voto.",
  curadoria: {
    responsavel: null,
    data: null,
    metodo:
      "Os eixos foram derivados por agrupamento das propostas e das oposições declaradas em source/propostas.md (o que cada candidatura defende) e source/auxiliar.md (o que cada candidatura declara combater). Uma postura 'contra' só foi registrada quando o texto declara rejeição àquela política; quando a postura foi inferida e não é literal, a inferência está no campo 'interpretacao' e é exibida ao usuário junto da citação.",
    criterioDeInclusao:
      "Foram incluídos todos os eixos com ao menos uma postura declarada nas fontes. Eixos em que nenhuma candidatura se opõe permanecem no corpus como não discriminantes: não entram no ranking e são reportados como consenso ou posição unilateral do campo.",
    revisadoPor: null,
    limitacoesConhecidas: [
      "As citações são resumos curatoriais, não trechos literais dos planos registrados. Nenhuma postura tem, hoje, citação verbatim auditável.",
      "Os códigos entre colchetes em source/auxiliar.md são internamente inconsistentes (C03 designa tanto Romeu Zema quanto Augusto Cury; Lula aparece como C12). Foram descartados; os IDs deste corpus seguem a ordem de source/propostas.md.",
      "As candidaturas C09, C10, C11 e C12 têm plataformas idênticas em source/propostas.md; separam-se apenas pelas propostas exclusivas de source/auxiliar.md, que são majoritariamente não discriminantes. O empate entre elas no ranking é um fato do corpus, não um defeito do motor.",
      "Os pesos dos eixos são escolha do curador e não vêm das fontes. Rode `node src/perfis.mjs mutacao` para ver de quais deles o resultado depende: hoje, dobrar o peso muda algum desfecho em 7 dos 55 eixos.",
    ],
  },
  eixos: EIXOS,
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
    planoNota: "Plano de governo integral, conforme publicado pelo Poder360. Prevalece sobre os resumos citados neste corpus.",
    posicoes: posicoesPorCandidato[c.id],
  })),
  contrastes: [
    { entre: ["C01", "C07"], discriminador: "e_encarceramento_excecao",
      inclina: { concordo: "C01", discordo: "C07" },
      nota: "Ambos endurecem a política prisional e defendem o isolamento de lideranças de facções. Separam-se no encarceramento de exceção sem devido processo individualizado." },
    { entre: ["C01", "C05"], discriminador: "e_flexibilizacao_trabalhista",
      inclina: { concordo: "C01", discordo: "C05" },
      nota: "Ambos apostam em vigilância tecnológica e em pasta federal de segurança. Separam-se na regulação do trabalho por plataformas." },
    { entre: ["C03", "C10"], discriminador: "e_estabilidade_emprego",
      inclina: { discordo: "C03", concordo: "C10" },
      nota: "Únicas duas candidaturas que tratam explicitamente da estabilidade no emprego, e em direções opostas." },
    { entre: ["C04", "C11"], discriminador: "e_renda_sem_contrapartida",
      inclina: { discordo: "C04", concordo: "C11" },
      nota: "Únicas duas candidaturas que desenham um benefício de renda; divergem sobre exigir contrapartida." },
  ],
};

const json = JSON.stringify(corpus, null, 2) + "\n";
writeFileSync(new URL("../data/corpus.json", import.meta.url), json);

const nPos = CANDIDATOS.reduce((n, c) => n + posicoesPorCandidato[c.id].length, 0);
const nInterp = POS.filter((p) => p.interpretacao).reduce((n, p) => n + p.cands.length, 0);
console.log(`corpus.json escrito: ${CANDIDATOS.length} candidatos · ${Object.keys(EIXOS).length} eixos · ${nPos} posturas · ${nInterp} com interpretação · ${corpus.contrastes.length} contrastes · ${Object.keys(corpus.portoes).length} portões`);
