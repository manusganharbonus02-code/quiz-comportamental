import { QuizData, ReportData } from '../types';

const API_BASE_URL = '/api';

export const startCheckout = async (quizData: QuizData): Promise<{ transactionId: string, checkoutUrl: string }> => {
  const response = await fetch(`${API_BASE_URL}/start-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quizData),
  });
  if (!response.ok) throw new Error('Erro ao iniciar checkout.');
  return response.json();
};

export const fetchReportData = async (transactionId: string, quizData?: QuizData): Promise<ReportData> => {
    const response = await fetch(`${API_BASE_URL}/get-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, ...quizData }),
    });
    if (!response.ok) throw new Error('Erro ao obter relatório.');
    return response.json();
};
