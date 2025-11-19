import { Answers, ReportData, QuizQuestion } from '../types';

// CORREÇÃO CRÍTICA:
// Mudamos de 'http://localhost:4000/api' para apenas '/api'.
// Isso faz com que o navegador use automaticamente o endereço correto do site no Render.
const API_BASE_URL = '/api';

/**
 * Envia as respostas e as perguntas do quiz para o backend.
 * @param answers - As respostas do usuário.
 * @param questions - As perguntas que foram feitas ao usuário.
 * @returns O ID da transação criada.
 */
export const submitQuizAnswers = async (answers: Answers, questions: QuizQuestion[]): Promise<{ transactionId: string }> => {
  console.log('Enviando respostas e perguntas para o backend...');
  try {
    const response = await fetch(`${API_BASE_URL}/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, questions }),
    });
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: Falha ao enviar respostas.`);
    }
    return response.json();
  } catch (error) {
    console.error("Erro de conexão:", error);
    throw error;
  }
};

/**
 * Verifica o status de pagamento de uma transação com o backend.
 * @param transactionId - O ID da transação a ser verificada.
 * @returns O status atual da transação ('PENDING' ou 'PAID').
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
 * @param transactionId - O ID da transação a ser marcada como paga.
 */
export const simulateSuccessfulPayment = async (transactionId: string): Promise<void> => {
    console.log(`SIMULANDO pagamento para ${transactionId}...`);
    const response = await fetch(`${API_BASE_URL}/payment/simulate/${transactionId}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Falha ao simular o pagamento.');
    }
};

/**
 * Solicita a prévia persuasiva do relatório gerada pela IA.
 * @param answers - As respostas do usuário.
 * @param questions - As perguntas feitas.
 * @returns O texto da prévia.
 */
export const fetchReportPreview = async (answers: Answers, questions: QuizQuestion[]): Promise<string> => {
    console.log(`Solicitando prévia do relatório da IA...`);
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
 * Solicita o relatório completo gerado pela IA ao backend após pagamento.
 * @param transactionId - O ID da transação paga.
 * @returns Os dados completos do relatório.
 */
export const fetchReportData = async (transactionId: string): Promise<ReportData> => {
    console.log(`Solicitando relatório completo para a transação ${transactionId}...`);
    const response = await fetch(`${API_BASE_URL}/report/full/${transactionId}`);
    if (!response.ok) {
        throw new Error('Falha ao obter os dados do relatório completo.');
    }
    return response.json();
};
