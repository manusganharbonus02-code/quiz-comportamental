import { Answers, ReportData, QuizQuestion } from '../types';

// CORREÇÃO: Usar caminho relativo para funcionar tanto localmente quanto no Render
const API_BASE_URL = '/api';

/**
 * Envia os dados do quiz para o backend para iniciar o checkout.
 * @param quizData - Os dados do quiz (respostas e perguntas).
 * @returns O ID da transação e a URL de checkout.
 */
export const startCheckout = async (quizData: { answers: Answers, questions: QuizQuestion[] }): Promise<{ transactionId: string, checkoutUrl: string }> => {
  console.log('Iniciando checkout com o backend...');
  const response = await fetch(`${API_BASE_URL}/start-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quizData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Falha ao iniciar o processo de checkout.' }));
    throw new Error(errorData.message);
  }
  return response.json();
};


/**
 * Solicita o relatório completo ao backend após o retorno do pagamento.
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
