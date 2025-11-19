import { QuizData, ReportData } from '../types';

// CORREÇÃO: Caminho relativo para funcionar tanto localmente quanto no Render
const API_BASE_URL = '/api';

/**
 * Envia os dados do quiz para o backend para iniciar o checkout.
 * @param quizData - Os dados do quiz (respostas e perguntas).
 * @returns O ID da transação e a URL de checkout.
 */
export const startCheckout = async (quizData: QuizData): Promise<{ transactionId: string, checkoutUrl: string }> => {
  console.log('Iniciando checkout com o backend...');
  // CORREÇÃO: Rota atualizada para bater com o server.js (/start-checkout)
  const response = await fetch(`${API_BASE_URL}/start-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quizData),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Falha ao iniciar o processo de checkout.' }));
    throw new Error(errorData.message || 'Falha de comunicação com o servidor.');
  }
  return response.json();
};

/**
 * Solicita o relatório completo gerado pela IA ao backend após o retorno do pagamento.
 * @param transactionId - O ID da transação.
 * @returns Os dados completos do relatório.
 */
export const fetchReportData = async (transactionId: string): Promise<ReportData> => {
    console.log(`Solicitando relatório completo para a transação ${transactionId}...`);
    const response = await fetch(`${API_BASE_URL}/get-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Falha ao obter os dados do relatório completo.' }));
        throw new Error(errorData.message);
    }
    return response.json();
};

// Funções auxiliares mantidas para compatibilidade caso necessárias, mas o fluxo principal usa as acima.
export const checkPaymentStatus = async (transactionId: string): Promise<{ status: 'PENDING' | 'PAID' }> => {
    return { status: 'PENDING' };
};

export const simulateSuccessfulPayment = async (transactionId: string): Promise<void> => {
    console.log('Simulação de pagamento acionada');
};

export const fetchReportPreview = async (answers: any): Promise<string> => {
    return "Prévia indisponível neste fluxo.";
};
