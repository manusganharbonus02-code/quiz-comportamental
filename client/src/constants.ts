import { QuizQuestion } from './types';

export const API_BASE_URL = 'https://quiz-comportamental.onrender.com/api';

export const ALL_QUESTIONS: QuizQuestion[] = [
  { id: 1, module: 'Foco', text: "Eu defino prioridades claras para minhas tarefas diárias." },
  { id: 2, module: 'Foco', text: "Consigo manter o foco em objetivos de longo prazo sem me desviar." },
  { id: 3, module: 'Foco', text: "Minimizo facilmente as distrações quando preciso me concentrar." },
  { id: 4, module: 'Foco', text: "Planejo meu dia de forma estruturada para maximizar minha eficiência." },
  { id: 5, module: 'Foco', text: "Tenho o hábito de revisar periodicamente o andamento dos meus objetivos." },
  { id: 6, module: 'Adaptabilidade', text: "Eu me sinto confortável com mudanças inesperadas nos planos." },
  { id: 7, module: 'Adaptabilidade', text: "Aprendo rapidamente novas ferramentas ou processos quando necessário." },
  { id: 8, module: 'Adaptabilidade', text: "Consigo ajustar minha abordagem quando a estratégia inicial não funciona." },
  { id: 9, module: 'Adaptabilidade', text: "Vejo a incerteza como uma oportunidade, não como uma ameaça." },
  { id: 10, module: 'Adaptabilidade', text: "Estou aberto a ouvir e considerar pontos de vista diferentes dos meus." },
  { id: 11, module: 'Inovacao', text: "Eu questiono ativamente o 'jeito que sempre fizemos as coisas'." },
  { id: 12, module: 'Inovacao', text: "Gosto de experimentar novas ideias, mesmo que haja risco de falha." },
  { id: 13, module: 'Inovacao', text: "Eu proponho soluções criativas para problemas existentes." },
  { id: 14, module: 'Inovacao', text: "Dedico tempo para pensar em melhorias e inovações para minha área." },
  { id: 15, module: 'Inovacao', text: "Sinto-me energizado por desafios que exigem pensar fora da caixa." },
  { id: 16, module: 'Coragem', text: "Eu defendo minhas ideias e convicções, mesmo que sejam impopulares." },
  { id: 17, module: 'Coragem', text: "Eu assumo a responsabilidade por decisões difíceis." },
  { id: 18, module: 'Coragem', text: "Não hesito em ter conversas difíceis quando são necessárias." },
  { id: 19, module: 'Coragem', text: "Encaro os erros como parte essencial do processo de crescimento." },
  { id: 20, module: 'Coragem', text: "Eu me voluntario para tarefas desafiadoras que outros podem evitar." },
  { id: 21, module: 'InteligenciaSocial', text: "Eu percebo facilmente o clima emocional de uma reunião ou equipe." },
  { id: 22, module: 'InteligenciaSocial', text: "Consigo adaptar meu estilo de comunicação para diferentes pessoas." },
  { id: 23, module: 'InteligenciaSocial', text: "Sou bom em construir e manter relacionamentos profissionais." },
  { id: 24, module: 'InteligenciaSocial', text: "Eu ofereço feedback de forma construtiva e respeitosa." },
  { id: 25, module: 'InteligenciaSocial', text: "Eu consigo gerenciar minhas próprias emoções sob pressão." }
];

export const ANSWER_OPTIONS = [
  { value: 1, label: "Discordo Totalmente" },
  { value: 2, label: "Discordo" },
  { value: 3, label: "Neutro" },
  { value: 4, label: "Concordo" },
  { value: 5, label: "Concordo Totalmente" },
];
