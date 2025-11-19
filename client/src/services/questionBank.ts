import { QuizQuestion } from '../types';

// Banco de perguntas alinhado com as 5 novas dimensões do backend.
export const ALL_QUESTIONS: QuizQuestion[] = [
  // Foco
  { id: 1, dimension: "Foco", text: "Eu defino prioridades claras para minhas tarefas diárias." },
  { id: 2, dimension: "Foco", text: "Consigo me concentrar em uma única tarefa por longos períodos sem me distrair." },
  { id: 3, dimension: "Foco", text: "Meu ambiente de trabalho é organizado para minimizar interrupções." },
  { id: 4, dimension: "Foco", text: "Eu sei dizer 'não' a solicitações que desviam dos meus objetivos principais." },
  { id: 5, dimension: "Foco", text: "Eu divido grandes projetos em etapas menores e gerenciáveis." },

  // Adaptabilidade
  { id: 6, dimension: "Adaptabilidade", text: "Eu me sinto confortável com mudanças inesperadas nos planos." },
  { id: 7, dimension: "Adaptabilidade", text: "Aprendo rapidamente novas ferramentas ou processos quando necessário." },
  { id: 8, dimension: "Adaptabilidade", text: "Consigo ajustar minha abordagem quando a estratégia inicial não está funcionando." },
  { id: 9, dimension: "Adaptabilidade", text: "Vejo a incerteza como uma oportunidade, não como uma ameaça." },
  { id: 10, dimension: "Adaptabilidade", text: "Estou aberto a ouvir e considerar pontos de vista diferentes dos meus." },

  // AgressorRotina (Inovação)
  { id: 11, dimension: "AgressorRotina", text: "Eu questiono ativamente o 'jeito que sempre fizemos as coisas'." },
  { id: 12, dimension: "AgressorRotina", text: "Gosto de experimentar novas ideias, mesmo que haja risco de falha." },
  { id: 13, dimension: "AgressorRotina", text: "Eu proponho soluções criativas para problemas existentes." },
  { id: 14, dimension: "AgressorRotina", text: "Dedico tempo para pensar em melhorias e inovações para minha área." },
  { id: 15, dimension: "AgressorRotina", text: "Sinto-me energizado por desafios que exigem pensar fora da caixa." },

  // MatadorDragoes (Coragem)
  { id: 16, dimension: "MatadorDragoes", text: "Eu defendo minhas ideias e convicções, mesmo que sejam impopulares." },
  { id: 17, dimension: "MatadorDragoes", text: "Eu assumo a responsabilidade por decisões difíceis." },
  { id: 18, dimension: "MatadorDragoes", text: "Não hesito em ter conversas difíceis quando são necessárias para o bem do projeto." },
  { id: 19, dimension: "MatadorDragoes", text: "Encaro os erros como parte essencial do processo de crescimento." },
  { id: 20, dimension: "MatadorDragoes", text: "Eu me voluntario para tarefas desafiadoras que outros podem evitar." },

  // RadarSocial (Inteligência Emocional)
  { id: 21, dimension: "RadarSocial", text: "Eu percebo facilmente o clima emocional de uma reunião ou equipe." },
  { id: 22, dimension: "RadarSocial", text: "Consigo adaptar meu estilo de comunicação para diferentes pessoas e situações." },
  { id: 23, dimension: "RadarSocial", text: "Sou bom em construir e manter relacionamentos profissionais de confiança." },
  { id: 24, dimension: "RadarSocial", text: "Eu ofereço feedback de forma construtiva e respeitosa." },
  { id: 25, dimension: "RadarSocial", text: "Eu consigo gerenciar minhas próprias emoções sob pressão." },
];

// Função simplificada para embaralhar e retornar as perguntas
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getQuizQuestions = (count: number = 25): QuizQuestion[] => {
  return shuffleArray(ALL_QUESTIONS).slice(0, count);
};
