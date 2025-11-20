// FIX: Manually define types for `import.meta.env` as the Vite client types are unavailable.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly PROD: boolean;
    };
  }
}

import { QuizData, TransactionResponse, FullReportData } from '../types';

const isProduction = import.meta.env.PROD;
const API_BASE_URL = isProduction
  ? 'https://quiz-comportamental.onrender.com/api'
  : 'http://localhost:4000/api';

console.log(`[API SERVICE] Connecting to: ${API_BASE_URL} (Prod: ${isProduction})`);

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
    console.error("Error in startCheckout:", error);
    throw error;
  }
};

export const fetchReportPreview = async (transactionId: string): Promise<{ previewText: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/report/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId }),
    });

    // MELHORIA: Captura a mensagem de erro específica do servidor
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: 'Erro desconhecido ao contatar o servidor.' }));
      throw new Error(errorBody.message);
    }
    return await response.json();
  } catch (error) {
    // Re-lança o erro para o componente poder capturá-lo
    throw error;
  }
};

export const fetchFullReport = async (transactionId: string): Promise<FullReportData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/report/full/${transactionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.status === 403) {
      throw new Error('PAYMENT_REQUIRED');
    }
    if (!response.ok) {
      throw new Error('Erro ao gerar relatório.');
    }
    return await response.json();
  } catch (error) {
    console.error("Error in fetchFullReport:", error);
    throw error;
  }
};
