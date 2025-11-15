export interface QuizQuestion {
  id: number;
  dimension: 'Foco' | 'Produtividade' | 'Resiliência';
  text: string;
}

export type Answers = Record<number, number>;

export interface QuizCompletionData {
  transactionId: string;
  answers: Answers;
}

export interface ReportData {
  scores: {
    Foco: number;
    Produtividade: number;
    Resiliência: number;
  };
  interpretations: {
    Foco: string;
    Produtividade: string;
    Resiliência: string;
  };
  recommendations: string[];
}
