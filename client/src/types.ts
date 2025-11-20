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

// FASE 1: Análise Técnica e Validação
export interface ReportValidation {
  methodology: string;
  reliabilityIndex: number;
  confidentialityClause: string;
}

export interface BehavioralPattern {
  name: string; // Ex: "O Estrategista Cauteloso"
  formula: string; // Ex: "F:90 A:60 I:40 C:80"
}

// FASE 2: Apresentação dos Resultados
export interface ActionFilter {
  speed: 'Rápido' | 'Reflexivo';
  focus: 'Pessoas' | 'Tarefas';
  description: string;
}

export interface CoreDrivers {
  motivation: string[]; // O que energiza
  friction: string[];   // O que drena energia
  idealEnvironment: string;
}

// FASE 3: Aplicação Estratégica
export interface BlindSpotAnalysis {
  title: string; // "O Custo da Potência"
  description: string;
}

export interface DevelopmentProtocol {
  action: string; // O que fazer
  rationale: string; // O porquê técnico
  expectedBenefit: string; // O ROI Comportamental
}


/**
 * @deprecated A interface ReportData antiga será removida. Use FullReportData.
 */
export interface ReportData {
  archetypeTitle: string;
  archetypeDescription: string;
  dimensionAnalyses: Array<{
    dimensionName: Dimension | string;
    score: number;
    interpretation: string;
    strengths: string[];
    recommendations:string[];
  }>;
}

// A nova estrutura de dados mestre para o relatório
export interface FullReportData {
  // Metadados
  archetype: string; // Nome principal (mantido para consistência)
  
  // FASE 1
  validation: ReportValidation;
  pattern: BehavioralPattern;
  summary: string; // Sumário Executivo
  
  // FASE 2
  actionFilter: ActionFilter;
  coreDrivers: CoreDrivers;
  dimensions: Array<{
    name: string;
    score: number;
    analysis: string;
  }>;
  
  // FASE 3
  blindSpot: BlindSpotAnalysis;
  actionPlan: DevelopmentProtocol[];
}
