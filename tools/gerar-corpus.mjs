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
  { id: "C01", nome: "Flávio Bolsonaro", partido: "PL", paginas: 76,
    arquivo: "FLAVIO-BOLSONARO-PARA-O-BRASIL-VENCER-O-ATRASO-1-1.pdf",
    planoUrl: "https://static.poder360.com.br/uploads/2026/08/FLAVIO-BOLSONARO-PARA-O-BRASIL-VENCER-O-ATRASO-1-1.pdf" },
  { id: "C02", nome: "Ronaldo Caiado", partido: "PSD", paginas: 100,
    arquivo: "Plano-de-Governo-Ronaldo-Caiado-Presidente.pdf",
    planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano-de-Governo-Ronaldo-Caiado-Presidente.pdf" },
  { id: "C03", nome: "Romeu Zema", partido: "Novo", paginas: 81,
    arquivo: "Plano_gov_Zema_2026.pdf",
    planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_Zema_2026.pdf" },
  { id: "C04", nome: "Renan Santos", partido: "Missão", paginas: 51,
    arquivo: "Plano_gov_Renan_Missao_2026.pdf",
    planoUrl: "https://static.poder360.com.br/uploads/2026/08/Plano_gov_Renan_Missao_2026.pdf" },
  { id: "C05", nome: "Luiz Inácio Lula da Silva", partido: "PT", paginas: 84,
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
  "e_tributar_altas_rendas/C05": "O plano não propõe imposto sobre grandes fortunas nem sobre heranças. A postura \"favor\" vem do compromisso declarado de deslocar a carga para o topo (\"o pobre no orçamento e o rico no Imposto de Renda\") e de reduzir a regressividade do sistema — é sobre progressividade da renda, não sobre tributar patrimônio.",
  "e_tributar_altas_rendas/C04": "O plano não trata de imposto sobre grandes fortunas. A postura \"contra\" é inferida do diagnóstico de que elevar a carga tributária foi o erro dos ajustes anteriores, e da proposta de ajustar pelo gasto — mesmo critério aplicado às demais candidaturas contrárias neste eixo.",
  "e_renda_sem_contrapartida/C11": "O plano não discute contrapartidas; propõe bolsa de um salário mínimo a desempregados enquanto não houver pleno emprego, sem condicionalidade declarada. A postura \"favor\" é inferida da ausência de contrapartida no desenho do benefício.",
  "e_margem_equatorial/C05": "O plano não cita a Margem Equatorial. A postura \"favor\" vem do compromisso de que a Petrobras siga ampliando exploração onshore e offshore e de que \"as novas reservas serão exploradas\", ainda que com ressalva socioambiental.",
  "e_mineracao_terras_indigenas/C05": "O plano não menciona a regulamentação da mineração em terras indígenas. A postura \"contra\" é inferida do combate declarado ao garimpo em território indígena e da retomada das homologações — mesmo critério aplicado às demais candidaturas contrárias neste eixo.",
  "e_ministerio_seguranca/C10": "A postura \"contra\" é inferida da proposta de substituir a política e o ministério de segurança pública por uma \"política de segurança dos direitos\" sob marco civil.",
  "e_estatizacao_setores/C11": "A postura \"favor\" é inferida das propostas de estatização setorial declaradas ao longo do plano (transporte, ouro, plataformas), não de uma formulação geral de monopólio estatal.",
  "e_estatizacao_setores/C12": "A postura \"favor\" é inferida das propostas de estatização declaradas ao longo do plano (imprensa, ensino pago, empresas que demitem), não de uma formulação geral de monopólio estatal.",
};


/**
 * Explicação em linguagem leiga: o que a proposta quer dizer na prática.
 *
 * É o texto mais fácil de enviesar do projeto inteiro — mais que a escolha das
 * citações, porque aqui não há trecho de plano para servir de âncora. A disciplina
 * adotada: descrever o mecanismo concreto e, onde o desacordo é real, dar uma frase
 * a cada lado, na mesma extensão. Onde o tema tem pouca controvérsia, dizer isso em
 * vez de fabricar uma polêmica.
 *
 * Não é neutro por construção e não há trava técnica que o torne. É o item que mais
 * precisa de revisão de terceiros.
 */
const EXPLICACOES = {
  e_privatizacao_estatais:
    "O governo é dono de empresas como Petrobras, Correios e bancos públicos. Privatizar é vendê-las a investidores. Quem defende diz que empresa privada é mais eficiente e que a venda abate dívida; quem é contra diz que o país perde controle sobre setores estratégicos e que o novo dono passa a cobrar pelo que era serviço.",
  e_ppp_servicos_publicos:
    "O serviço continua público e gratuito para você, mas quem constrói e opera é uma empresa contratada, remunerada pelo Estado ou por tarifa — como já acontece em rodovias e em alguns hospitais. Discute-se se entrega mais rápido e mais barato, ou se transfere o lucro ao particular e deixa o risco com o poder público.",
  e_gestao_privada_saude:
    "Em vez de contratar médicos por concurso, o poder público paga uma organização social para tocar o hospital, ou compra consultas e exames de clínicas privadas. O atendimento segue pelo SUS e de graça. Discute-se se diminui fila, ou se precariza o vínculo de quem trabalha e drena dinheiro da rede própria.",
  e_ans_planos_flexiveis:
    "Hoje todo plano de saúde é obrigado a cobrir uma lista mínima de procedimentos. Flexibilizar é permitir planos mais baratos que cobrem menos. Quem defende diz que dá acesso a quem não tem plano nenhum; quem é contra diz que a pessoa só descobre o que ficou de fora na hora em que adoece.",
  e_ensino_civico_militar:
    "São escolas públicas comuns em que militares ou policiais da reserva cuidam da disciplina, do uniforme e da rotina, enquanto professores civis dão as aulas. Discute-se se isso melhora o ambiente e as notas, ou se escola não é lugar de hierarquia militar.",
  e_negociado_sobre_legislado:
    "Hoje a CLT define um piso que nenhum acordo pode rebaixar. A mudança permite que o acordo entre empresa e trabalhadores valha mais do que a lei em pontos como jornada e intervalos. Quem defende fala em flexibilidade para cada setor; quem é contra diz que quem precisa do emprego não negocia de igual para igual.",
  e_estabilidade_emprego:
    "Depois de um tempo de casa, a empresa não poderia demitir sem justificar o motivo — como já vale para servidores concursados. Quem defende fala em segurança para planejar a vida; quem é contra diz que empresa que não pode demitir também contrata menos.",
  e_renda_sem_contrapartida:
    "É o desenho do Bolsa Família: o dinheiro entra na conta de quem está abaixo de uma linha de renda, sem exigir trabalho em troca. A alternativa é pagar mediante horas de serviço comunitário. Discute-se se a contrapartida ajuda a sair da pobreza ou se vira mão de obra barata.",
  e_encarceramento_excecao:
    "É o modelo aplicado em El Salvador: prender em massa e suspender temporariamente garantias como o direito de defesa e o limite de tempo sem julgamento. Não se trata de construir presídio de segurança máxima, o que quase todos defendem, mas de afrouxar as regras do processo. Quem defende aponta a queda de homicídios lá; quem é contra aponta prisões de inocentes e mortes sob custódia.",
  e_autonomia_banco_central:
    "O Banco Central define os juros básicos, e hoje seu presidente tem mandato fixo — não pode ser demitido pelo presidente da República. Acabar com a autonomia devolve essa decisão à influência do governo. Quem defende a autonomia diz que ela protege contra inflação em ano eleitoral; quem é contra diz que juro alto demais trava emprego e que ninguém elegeu quem decide.",
  e_margem_equatorial:
    "A Margem Equatorial é a costa entre o Amapá e o Rio Grande do Norte, perto da foz do Amazonas, onde há indício de muito petróleo. Abrir a exploração é autorizar perfuração em área ambientalmente sensível. Discute-se se o país deve extrair essa riqueza enquanto ela vale algo, ou se apostar em petróleo novo contradiz o compromisso climático.",
  e_reforma_agraria:
    "O governo desapropria terras que não cumprem função social, indeniza o dono e assenta famílias sem terra. Continuar é criar novos assentamentos; parar é concentrar esforço em tornar produtivos os que já existem. Discute-se se corrige uma concentração histórica de terra ou se atrapalha a produção e estimula invasões.",
  e_tributar_altas_rendas:
    "O Brasil cobra pouco sobre patrimônio, herança e lucro distribuído a sócios, e muito sobre consumo — o que pesa proporcionalmente mais em quem ganha menos. A proposta cria ou aumenta imposto sobre o topo. Quem defende fala em justiça e em financiar serviços; quem é contra diz que capital sai do país e que o Estado deveria gastar melhor antes de arrecadar mais.",
  e_reforma_previdencia:
    "A idade mínima para se aposentar passaria a subir sozinha, conforme os brasileiros vivem mais, sem depender de nova votação. Quem defende diz que é o que mantém a conta fechando com menos jovens contribuindo; quem é contra diz que quem faz trabalho pesado não chega inteiro a essa idade.",
  e_alinhamento_brics:
    "O BRICS reúne Brasil, Rússia, Índia, China e outros, como bloco fora da órbita dos Estados Unidos e da Europa. Permanecer é manter essa aposta; sair é aproximar-se do bloco ocidental. Discute-se se o país ganha mais barganhando com todos ou escolhendo um lado.",
  e_licenciamento_simplificado:
    "Antes de uma obra ou mineração começar, órgãos ambientais analisam impactos e podem exigir mudanças. Simplificar é fixar prazos curtos e dispensar etapas para projetos tidos como de menor risco. Quem defende diz que hoje obra trava por anos; quem é contra lembra que desastres recentes passaram por licenciamento abreviado.",
  e_liberdade_irrestrita_redes:
    "Hoje as plataformas removem posts e derrubam perfis por regras próprias, e a Justiça também manda tirar conteúdo do ar. A proposta proíbe essa remoção: o que fosse ilegal se resolveria depois, com processo e indenização. Quem defende diz que nem empresa nem juiz deveria decidir o que pode ser dito; quem é contra diz que golpe, fraude e ataque coordenado se espalham antes de qualquer processo terminar.",
  e_mineracao_terras_indigenas:
    "A Constituição admite mineração em terra indígena se o Congresso aprovar uma lei regulamentando — o que nunca aconteceu, então hoje toda extração ali é ilegal. Regulamentar é criar essa lei, com regras de consulta e divisão de ganhos. Discute-se se organiza o que hoje é garimpo criminoso, ou se abre território protegido a mineradoras.",
  e_reducao_jornada:
    "Reduzir por lei a jornada semanal — por exemplo, acabar com a escala de seis dias de trabalho e um de folga — mantendo o salário. Quem defende diz que a produtividade já cresceu o bastante para dividir o ganho em tempo livre; quem é contra diz que o custo por hora sobe e o emprego formal encolhe.",
  e_vigilancia_massa:
    "Câmeras nas ruas comparam rostos com bancos de dados de procurados, em tempo real. Quem defende aponta prisões de foragidos; quem é contra aponta erros de identificação — mais frequentes com pessoas negras — e o fato de todos passarem a ser filmados e conferidos o tempo todo.",
  e_ministerio_seguranca:
    "Segurança pública hoje é responsabilidade sobretudo dos estados, e a União coordena pouco. Criar o ministério dá ao governo federal comando próprio para integrar polícias, dados e fronteiras. Discute-se se resolve a falta de coordenação ou se apenas soma mais uma estrutura à que já existe.",
  e_ensino_integral:
    "O aluno passa o dia inteiro na escola, em vez de um turno, com aulas, reforço, esporte e refeições. Quem defende fala em aprendizagem e em tirar a criança da rua; a dificuldade é custo, professor e prédio — cada vaga integral custa perto do dobro.",
  e_interoperabilidade_saude:
    "Seu histórico, exames e receitas ficariam num sistema único, acessível em qualquer posto ou hospital do país. Evita repetir exame e ajuda em emergência. A discussão é sobre quem pode ver esses dados e o que acontece se vazarem.",
  e_desmilitarizacao:
    "A polícia militar deixaria de ter estrutura, hierarquia e formação de caserna, virando polícia civil de bairro. Quem defende diz que treinamento militar produz confronto onde caberia mediação; quem é contra diz que a disciplina militar é o que sustenta uma força que atua armada na rua.",
  e_isolamento_liderancas:
    "Chefes de facção iriam para presídios federais longe de sua região, com visita restrita e bloqueio de celular, para não seguirem mandando no crime de dentro da cadeia. Tem apoio amplo; discute-se o custo e se o comando apenas passa para outro nome.",
  e_reforma_administrativa:
    "Reduzir o número de ministérios, cortar cargos de confiança e limitar salários acima do teto no funcionalismo. Quem defende fala em máquina mais barata; quem é contra diz que o corte costuma cair sobre serviço que atende gente, e não sobre os privilégios do topo.",
  e_simplificacao_fiscal:
    "Empresas gastam milhares de horas por ano só para calcular e declarar imposto. Simplificar é unificar regras e automatizar isso: não muda quanto se paga, muda o trabalho de pagar. É das poucas ideias com apoio quase unânime.",
  e_ia_soberania_digital:
    "O Estado investir em centros de dados, modelos e nuvem próprios, em vez de depender de empresas estrangeiras. Quem defende fala em não ficar refém de tecnologia de fora; quem é contra questiona o custo e se o governo consegue acompanhar o ritmo do setor privado.",
  e_estatizacao_setores:
    "Energia, mineração, telecomunicações e bancos passariam a ser operados só pelo Estado, sem concorrência privada. É mais forte do que reestatizar uma empresa: fecha o setor inteiro. Quem defende diz que serviço essencial não deve dar lucro a ninguém; quem é contra lembra de fila, atraso e falta de investimento em monopólios estatais.",
  e_auditoria_divida:
    "Boa parte do orçamento vai para juros e amortização da dívida pública. A proposta é suspender esses pagamentos e revisar contrato por contrato antes de retomar. Quem defende diz que esse dinheiro faltaria menos na saúde; quem é contra diz que país que suspende pagamento perde crédito e paga mais caro depois.",
  e_arcabouco_fiscal:
    "É a regra que limita quanto o gasto público pode crescer por ano, para a dívida não subir sem parar. Quem defende diz que sem limite a inflação e os juros voltam; quem é contra diz que a regra corta investimento e serviço justamente quando mais se precisa deles.",
  e_controle_externo_stf:
    "Ministros do Supremo ficam no cargo até os 75 anos e são fiscalizados por eles mesmos. As propostas variam: mandato com prazo, órgão externo de correição, aval do Senado para derrubar leis. Quem defende fala em freio a decisões individuais de muito alcance; quem é contra diz que tribunal sob pressão política deixa de proteger quem é minoria.",
  e_reeleicao:
    "Presidente, governador e prefeito não poderiam mais disputar um segundo mandato seguido. Quem defende diz que o mandatário usa a máquina para se reeleger e governa pensando na próxima eleição; quem é contra diz que tira do eleitor o direito de manter quem vai bem.",
  e_emendas_parlamentares:
    "Emendas são fatias do orçamento que cada parlamentar direciona para onde quiser, hoje em boa parte sem rastro de quem pediu. Restringir e rastrear é obrigar a dizer quem indicou, para onde foi e o que foi entregue. Discute-se se limita a barganha política ou se reduz o poder do Legislativo sobre o orçamento.",
  e_fim_fundo_eleitoral:
    "Campanhas e partidos hoje são bancados por dinheiro público, já que doação de empresa é proibida. Acabar com o fundo faria a campanha depender só de doação de pessoas físicas. Quem defende diz que é dinheiro que faria mais falta em outro lugar; quem é contra diz que sem fundo só quem tem dinheiro ou acesso a doadores disputa.",
  e_maioridade_penal:
    "Hoje quem tem menos de 18 anos responde pelo ECA e cumpre no máximo três anos de internação. Reduzir é responder como adulto e ir para presídio comum a partir dos 16. Quem defende fala em crimes graves cometidos por adolescentes; quem é contra diz que presídio brasileiro devolve a pessoa pior do que entrou.",
  e_porte_arma_rural:
    "O produtor rural já pode ter arma em casa; a proposta estende o direito de andar armado por toda a extensão da propriedade, que pode ter quilômetros. Quem defende fala em socorro que demora horas para chegar; quem é contra diz que amplia o risco em conflitos por terra.",
  e_homeschooling:
    "A família educaria a criança em casa, sem matrícula em escola, com avaliação periódica pelo Estado. É comum nos Estados Unidos e hoje proibido no Brasil. Quem defende fala em liberdade da família; quem é contra diz que a escola também é onde a criança convive com quem é diferente e onde maus-tratos são percebidos.",
  e_descriminalizacao_drogas:
    "Usar e portar droga para consumo próprio deixaria de ser crime — o tráfico continuaria sendo. É o que Portugal faz desde 2001, tratando dependência como caso de saúde. Quem defende diz que a lei atual enche presídio de usuário pobre e pequeno traficante; quem é contra diz que afrouxar a lei aumenta o consumo.",
  e_aborto:
    "Hoje o aborto é crime, com três exceções: risco de vida da mulher, gravidez por estupro e feto sem cérebro. Descriminalizar é deixar de ser crime; legalizar é oferecer o procedimento na rede de saúde. É o tema mais dividido deste comparador, e a forma de perguntar já influencia a resposta.",
  e_cotas_trans:
    "Reservar vagas em universidade e concurso público para pessoas trans, como já existe para candidatos negros e pessoas com deficiência. Quem defende aponta a expectativa de vida e a exclusão desse grupo do mercado formal; quem é contra diz que a seleção deveria olhar só o mérito.",
  e_passe_livre:
    "Ninguém paga passagem: o custo do ônibus e do metrô sai inteiro do orçamento público, como já acontece com escola e posto de saúde. Algumas cidades brasileiras já fazem. Discute-se se cabe no caixa e o que se deixa de financiar para pagar.",
  e_plebiscito_penitenciario:
    "Em vez de o governo decidir sozinho como serão os presídios, a pergunta iria a voto popular. Quem defende diz que decisão desse tamanho precisa de mandato explícito; quem é contra diz que política penal por votação tende ao mais severo e que direito fundamental não se decide por maioria.",
  e_fusao_municipios:
    "Municípios pequenos demais para se sustentar — que vivem de repasse e gastam quase tudo com a própria máquina — seriam fundidos a vizinhos. Quem defende fala em economia e serviço melhor; quem é contra diz que a cidade pequena perde voz e o serviço fica mais longe.",
  e_unicameralismo:
    "Acabar com o Senado e deixar uma câmara só, somada a conselhos de trabalhadores e moradores com poder de decidir. Quem defende diz que duas casas emperram e que o Senado super-representa estados pequenos; quem é contra diz que a segunda casa é freio contra decisão tomada no calor do momento.",
  e_estatizacao_midia:
    "Cancelar as concessões de rádio e TV dos grandes grupos e passar o controle desses veículos a trabalhadores do setor. Quem defende fala em quebrar a concentração de quem informa o país; quem é contra diz que governo escolhendo quem pode transmitir é o começo da censura.",
  e_saude_animal_unica:
    "Vigiar junto a saúde de pessoas, animais e ambiente, porque a maior parte das epidemias novas começa em animal. Na prática, é integrar veterinária, saúde pública e meio ambiente num sistema só de alerta. Há pouca controvérsia; a discussão é de custo e prioridade.",
  e_gestao_emocional_educacao:
    "Incluir no currículo o ensino de lidar com frustração, ansiedade e conflito, com aula e método próprios, e não só como projeto isolado da escola. Quem defende aponta o adoecimento mental de adolescentes; quem é contra diz que a escola já não dá conta do básico e que isso é papel da família.",
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
/** Capitular separada do resto pela extração: "T oda" → "Toda". */
const LIGADURA = /\b([B-DF-HJ-NP-TV-Z])\s([a-zà-ÿ]{2,})/g;

// Trava. A versão anterior desta regra aceitava qualquer maiúscula e colava 52 das
// 214 citações: "O governo" virava "Ogoverno", "CORTAR OS" virava "CORTAROS". Num
// app cuja promessa é a citação literal, falsear a fonte é o pior defeito possível.
// A checagem é a propriedade que importa — a regex não pode casar onde a letra
// solta é palavra de verdade — e não a contagem de substituições, que se mede com
// a própria regex e por isso acompanha qualquer alargamento dela.
for (const caso of ["O governo", "A carga", "E vamos", "É preciso", "À noite",
                    "CORTAR OS", "SUFOCAM O", "BRASIL ÀS", "DEMOCRACIAS E"]) {
  LIGADURA.lastIndex = 0;
  if (LIGADURA.test(caso)) {
    throw new Error(`LIGADURA colaria "${caso}" — a regra está larga demais.`);
  }
}
LIGADURA.lastIndex = 0;

/** Palavras que a extração do PDF partiu ao meio, conferidas uma a uma no plano. */
const PARTIDAS = [
  [/\bAL TERNATIVA\b/g, "ALTERNATIVA"],   // C03, p.44
  [/\bMAIS AL TOS\b/g, "MAIS ALTOS"],     // C03, p.18
  [/\bCL T\b/g, "CLT"],                   // C03, p.44 — "À CLT"
  [/\braci smo\b/g, "racismo"],           // C02, p.67
  [/\bpúbl ica\b/g, "pública"],           // C02, p.47
  [/\bman dato\b/g, "mandato"],           // C04, p.43
  [/\bpo bres\b/g, "pobres"],             // C06, p.98
  [/\bministério s\b/g, "ministérios"],   // C06, p.37
  [/\bminist ério\b/g, "ministério"],     // C06, p.37
  [/\bsegur ança\b/g, "segurança"],       // C06, p.37
  [/\bPRIV ADOS\b/g, "PRIVADOS"],         // C09, p.19
];

function limpar(t) {
  let s = t.replace(/\s+/g, " ").trim();
  // o PDF da UP (C09) renderiza cada linha duas vezes
  for (let i = 0; i < 4; i++) s = s.replace(/([\wÀ-ÿ][^.;!?]{10,}?)\.?\s*\1/g, "$1");
  s = s.replace(/(\b[\wÀ-ÿ]{4,})\.\1\b/g, "$1");
  // Ligaduras quebradas pela extração. A versão anterior usava duas regex largas
  // e colava 74 pares legítimos: "O governo" virava "Ogoverno", "CORTAR OS" virava
  // "CORTAROS", "BRASIL ÀS" virava "BRASILÀS". Em citação literal isso é falsear a
  // fonte, então as duas regras foram estreitadas.
  //
  // Palavra partida ao meio: lista explícita. Só um humano sabe se "CL T" é "CLT"
  // ou duas siglas — regex genérica não sabe. Caso novo entra aqui, auditável.
  for (const [re, com] of PARTIDAS) s = s.replace(re, com);
  s = s.replace(LIGADURA, "$1$2");
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
    explicacao: EXPLICACOES[id] ?? null,
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
        local: `página ${p.pagina} de ${cand.paginas}`,
        url: cand.planoUrl,
        contexto: "Trecho reproduzido literalmente do plano de governo registrado. O link abre o documento completo, onde ele pode ser conferido.",
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
    "Este comparador ainda não passou por revisão independente. Todas as frases citadas são trechos reproduzidos literalmente dos planos de governo registrados, com a página indicada e um link para o documento completo. O que falta é alguém de fora conferir as escolhas de quem montou a comparação: quais temas entraram e qual trecho representa cada candidatura. Ele compara posições declaradas em documentos e NÃO recomenda voto.",
  curadoria: {
    responsavel: null,
    data: "2026-08-26",
    metodo:
      "Os planos de governo registrados das 12 candidaturas foram lidos por inteiro e percorridos tema a tema. Uma posição só entrou na comparação quando o plano a afirma por escrito; a frase citada é o próprio texto do plano, e a página é indicada ao lado. Quando a posição não está literal na frase e foi deduzida dela, a dedução aparece em destaque junto da citação, para você poder recusá-la. Não dizer nada sobre um assunto nunca foi tratado como ser contra ele.",
    criterioDeInclusao:
      "Um tema entra quando ao menos uma candidatura declara posição sobre ele por escrito. Temas em que ninguém se opõe ficam de fora do ranking — não separam ninguém — e são apresentados à parte, como retrato do que o conjunto das candidaturas pensa.",
    revisadoPor: null,
    limitacoesConhecidas: [
      "As frases são literais, mas a escolha delas não é: um trecho citado é sempre um trecho entre outros do mesmo plano. Nenhuma verificação automática protege contra uma escolha tendenciosa — só a revisão de alguém de fora, que esta comparação ainda não teve.",
      "A importância atribuída a cada tema foi decidida por quem montou a comparação e não vem dos planos. Ela altera o resultado.",
      "Planos muito curtos, ou escritos como roteiro genérico, rendem poucas posições e cobertura baixa. Isso diz respeito ao documento, não à candidatura — e a cobertura, exibida sempre ao lado da afinidade, existe para tornar essa diferença visível.",
      "A leitura automática de PDF introduz pequenos ruídos de espaçamento. Diferenças de formatação em relação ao original são artefato dessa leitura, não alteração de conteúdo.",
      "Cobertura baixa pode significar que a candidatura não se posicionou — ou que este projeto não encontrou onde ela se posicionou. Uma segunda passada de extração já corrigiu sete casos; restam lacunas não lidas uma a uma. Enquanto for assim, a cobertura é um piso, não uma medida.",
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
const semExpl = Object.keys(eixos).filter((k) => !eixos[k].explicacao);
if (semExpl.length) { console.error(`eixos sem explicação: ${semExpl.join(", ")}`); process.exit(1); }
console.log(`corpus.json ${corpus.corpusVersion} · ${CANDIDATOS.length} candidatos · ${Object.keys(eixos).length} eixos · ${nPos} posturas (100% com citação literal e página) · ${nInterp} com interpretação declarada · ${corpus.contrastes.length} contrastes`);
