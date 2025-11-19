import { QuizData, TransactionResponse } from '../types';

// --- CONFIGURAÇÃO DA URL DA API ---
// Se estiver em produção (Render), usa a URL real.
// Se estiver local, usa o localhost:4000.
const isProduction = (import.meta as any).env.PROD;
const API_BASE_URL = isProduction 
  ? 'https://quiz-comportamental.onrender.com/api' 
  : 'http://localhost:4000/api';

console.log(`[API SERVICE] Conectando em: ${API_BASE_URL} (Prod: ${isProduction})`);

// --- TIPOS DO RELATÓRIO (Compatível com o JSON da IA) ---
export interface FullReportData {
  archetype: string;
  summary: string;
  dimensions: Array<{
    name: string;
    score: number;
    analysis: string;
  }>;
  blindSpot: string;
  actionPlan: string[];
}

// 1. INICIAR CHECKOUT (Envia as respostas e recebe o ID da transação)
export const startCheckout = async (quizData: QuizData): Promise<TransactionResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quizData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro ao salvar respostas.');
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no startCheckout:", error);
    throw error;
  }
};

// 2. OBTER PRÉVIA (Busca o gancho persuasivo gerado pela IA)
export const fetchReportPreview = async (transactionId: string): Promise<{ previewText: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/report/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId }),
    });

    if (!response.ok) {
      throw new Error('Erro ao obter prévia.');
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no fetchReportPreview:", error);
    throw error;
  }
};

// 3. OBTER RELATÓRIO COMPLETO (Busca o JSON detalhado após o pagamento)
export const fetchFullReport = async (transactionId: string): Promise<FullReportData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/report/full/${transactionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Tratamento específico para pagamento pendente (Retorno 403 do backend)
    if (response.status === 403) {
      throw new Error('PAYMENT_REQUIRED');
    }
    
    if (!response.ok) {
      throw new Error('Erro ao gerar relatório.');
    }

    return await response.json();
  } catch (error) {
    console.error("Erro no fetchFullReport:", error);
    throw error;
  }
};
