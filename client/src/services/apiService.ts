import { Answers, ReportData } from '../types';

// A URL base do seu backend. Em produção, será um caminho relativo.
const API_BASE_URL = '/api';

export const submitQuizAnswers = async (answers: Answers): Promise<{ transactionId: string }> => {
  const response = await fetch(`${API_BASE_URL}/quiz/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!response.ok) throw new Error('Falha ao enviar respostas do quiz.');
  return response.json();
};

export const checkPaymentStatus = async (transactionId: string): Promise<{ status: 'PENDING' | 'PAID' }> => {
  const response = await fetch(`${API_BASE_URL}/payment/status/${transactionId}`);
  if (!response.ok) throw new Error('Falha ao verificar o status do pagamento.');
  return response.json();
};

export const simulateSuccessfulPayment = async (transactionId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/payment/simulate/${transactionId}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Falha ao simular o pagamento.');
};

export const fetchReportPreview = async (answers: Answers): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/report/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
    });
    if (!response.ok) throw new Error('Falha ao gerar a prévia do relatório.');
    const data = await response.json();
    return data.previewText;
};

export const fetchReportData = async (transactionId: string): Promise<ReportData> => {
    const response = await fetch(`${API_BASE_URL}/report/full/${transactionId}`);
    if (!response.ok) throw new Error('Falha ao obter os dados do relatório completo.');
    return response.json();
};
