import type { QuizData, TransactionResponse, PreviewResponse, FullReportData } from '../types';

// The backend proxy is set up in vite.config.ts, so we only need the relative path.
const API_BASE_URL = '/api';

/**
 * 1. Submits the completed quiz data to the backend.
 * @param quizData The user's answers and the questions they were shown.
 * @returns A promise that resolves to an object containing the unique transactionId.
 */
export const submitQuiz = async (quizData: QuizData): Promise<TransactionResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quizData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao salvar respostas.' }));
      throw new Error(errorData.message);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in submitQuiz:", error);
    throw error;
  }
};

/**
 * 2. Fetches the persuasive AI-generated preview text for the report.
 * @param transactionId The unique ID for the user's quiz session.
 * @returns A promise that resolves to an object containing the preview text.
 */
export const fetchReportPreview = async (transactionId: string): Promise<PreviewResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/report/preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId }),
        });

        if (!response.ok) {
            throw new Error('Erro ao obter a prévia do relatório.');
        }
        return await response.json();
    } catch (error) {
        console.error("Error in fetchReportPreview:", error);
        throw error;
    }
};

/**
 * 3. Fetches the full, detailed report data after a successful payment.
 * @param transactionId The unique ID for the user's quiz session.
 * @returns A promise that resolves to the complete report data.
 */
export const fetchFullReport = async (transactionId: string): Promise<FullReportData> => {
    try {
        const response = await fetch(`${API_BASE_URL}/report/full/${transactionId}`);

        // The backend returns a 403 status if the payment for this transactionId is not yet confirmed.
        if (response.status === 403) {
            throw new Error('PAYMENT_REQUIRED');
        }

        if (!response.ok) {
            throw new Error('Erro ao gerar o relatório completo.');
        }
        return await response.json();
    } catch (error) {
        console.error("Error in fetchFullReport:", error);
        throw error;
    }
};
