import { QuizData, ReportData, Answers, QuizQuestion } from '../types';

// O caminho relativo '/api' é o correto para produção no Render.
const API_BASE_URL = '/api';

/**
 * Envia os dados do quiz para o backend para iniciar o checkout.
 * @param quizData - Os dados do quiz (respostas e perguntas).
 * @returns O ID da transação e a URL de checkout.
 */
export const startCheckout = async (quizData: QuizData): Promise<{ transactionId: string, checkoutUrl: string }> => {
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
 * Verifica o status de pagamento de uma transação com o backend.
 */
export const checkPaymentStatus = async (transactionId: string): Promise<{ status: 'PENDING' | 'PAID' }> => {
  const response = await fetch(`${API_BASE_URL}/payment/status/${transactionId}`);
  if (!response.ok) {
    throw new Error('Falha ao verificar o status do pagamento.');
  }
  return response.json();
};

/**
 * SIMULAÇÃO: Marca uma transação como paga no backend para testes.
 */
export const simulateSuccessfulPayment = async (transactionId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/payment/simulate/${transactionId}`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Falha ao simular o pagamento.');
  }
};

/**
 * Solicita a prévia do relatório gerada pela IA ao backend.
 */
export const fetchReportPreview = async (answers: Answers, questions: QuizQuestion[]): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/report/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, questions }),
  });
  if (!response.ok) {
      throw new Error('Falha ao gerar a prévia do relatório.');
  }
  const data = await response.json();
  return data.previewText;
};

/**
 * Solicita o relatório completo ao backend após o retorno do pagamento.
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
