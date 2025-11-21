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

// 1. Envia o quiz, recebe um ID para o checkout
export const startCheckout = async (quizData: QuizData): Promise<TransactionResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quizData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro ao iniciar o checkout.');
    }
    return await response.json();
  } catch (error) {
    console.error("Error in startCheckout:", error);
    throw error;
  }
};

// 2. Envia os dados do quiz para gerar a prévia
export const fetchReportPreview = async (quizData: QuizData): Promise<{ previewText: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/report/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quizData), 
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: 'Erro desconhecido ao gerar prévia.' }));
      throw new Error(errorBody.message);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// 3. NOVA FUNÇÃO para verificar o status do pagamento
export const checkPaymentStatus = async (transactionId: string): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/payment-status/${transactionId}`);
        if (!response.ok) {
            // Se a transação não for encontrada, o servidor retorna 404.
            // Isso é esperado até que o webhook chegue ou o servidor reinicie.
            if (response.status === 404) {
                return 'PENDING';
            }
            throw new Error('Falha ao verificar o status do pagamento.');
        }
        const data = await response.json();
        return data.status; // Ex: 'PENDING' ou 'PAID'
    } catch(error) {
        console.error("Error in checkPaymentStatus:", error);
        throw error;
    }
};


// 4. Envia os dados do quiz para gerar o relatório COMPLETO
export const generateFullReport = async (quizData: QuizData): Promise<FullReportData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/report/generate`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quizData),
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Erro desconhecido ao gerar relatório.' }));
      throw new Error(errorBody.message);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in generateFullReport:", error);
    throw error;
  }
};

/**
 * @deprecated fetchFullReport está obsoleto na nova arquitetura. Use generateFullReport.
 */
export const fetchFullReport = async (transactionId: string): Promise<FullReportData> => {
  console.warn("fetchFullReport is deprecated and should not be used.");
  throw new Error("fetchFullReport is deprecated. Use generateFullReport instead.");
};
