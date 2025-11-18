export type Dimension = 'Foco' | 'Adaptabilidade' | 'AgressorRotina' | 'MatadorDragoes' | 'RadarSocial';

export interface QuizQuestion {
  id: number;
  module: Dimension;
  text: string;
}

export type Answers = Record<number, number>;

// Este é o objeto que será salvo na memória do navegador
export interface QuizData {
    answers: Answers;
    questions: QuizQuestion[];
}

// Este é o formato do relatório final que vem do servidor
export interface ReportData {
  archetypeTitle: string;
  archetypeDescription: string;
  dimensionAnalyses: Array<{
    dimensionName: Dimension | string;
    score: number;
    interpretation: string;
    strengths: string[];
    recommendations: string[];
  }>;
}
