export type Dimension = 'Foco' | 'Adaptabilidade' | 'AgressorRotina' | 'MatadorDragoes' | 'RadarSocial';

export interface QuizQuestion {
  id: number;
  module: Dimension | string;
  text: string;
}

export type Answers = Record<number, number>;

export interface QuizData {
  answers: Answers;
  questions: QuizQuestion[];
}

export interface TransactionResponse {
  transactionId: string;
}

// --- NOVAS INTERFACES PARA O RELATÓRIO COMPLETO ---

export interface ReportValidation {
  methodology: string;
  reliabilityIndex: number;
  confidentialityClause: string;
}

export interface BehavioralPattern {
  name: string;
  formula: string;
}

export interface ActionFilter {
  speed: 'Rápido' | 'Reflexivo';
  focus: 'Pessoas' | 'Tarefas';
  description: string;
}

export interface CoreDrivers {
  motivation: string[];
  friction: string[];
  idealEnvironment: string;
}

// NOVA INTERFACE PARA A ANÁLISE 360º
export interface SubFactor {
  name: string; // Ex: "Nível de Detalhismo"
  analysis: string;
}

export interface BlindSpotAnalysis {
  title: string;
  description: string;
}

export interface DevelopmentProtocol {
  action: string;
  rationale: string;
  expectedBenefit: string;
}

// A nova estrutura de dados mestre para o relatório
export interface FullReportData {
  archetype: string;
  
  // FASE 1
  validation: ReportValidation;
  pattern: BehavioralPattern;
  summary: string;
  
  // FASE 2
  actionFilter: ActionFilter;
  coreDrivers: CoreDrivers;
  dimensions: Array<{
    name: string;
    score: number;
    analysis: string;
  }>;
  subFactors: SubFactor[]; // ADICIONADO: Análise 360º de Subfatores
  
  // FASE 3
  blindSpot: BlindSpotAnalysis;
  actionPlan: DevelopmentProtocol[];
}
