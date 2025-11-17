import { QuizQuestion, Answers, PreviewData, ReportData } from '../types';

const API_BASE_URL = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An unknown API error occurred' }));
    throw new Error(error.message || 'An API error occurred');
  }
  return response.json() as Promise<T>;
}

export const getQuestions = (): Promise<{ questions: QuizQuestion[] }> => {
  return fetch(`${API_BASE_URL}/questions`).then(res => handleResponse<{ questions: QuizQuestion[] }>(res));
};

export const submitAnswers = (answers: Answers): Promise<{ transactionId: string }> => {
  return fetch(`${API_BASE_URL}/quiz/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  }).then(res => handleResponse<{ transactionId: string }>(res));
};

export const getReportPreview = (transactionId: string): Promise<PreviewData> => {
  return fetch(`${API_BASE_URL}/report/preview/${transactionId}`)
    .then(res => handleResponse<PreviewData>(res));
};

export const getFullReport = (transactionId: string): Promise<ReportData> => {
  return fetch(`${API_BASE_URL}/report/full/${transactionId}`)
    .then(res => handleResponse<ReportData>(res));
};

export const checkPaymentStatus = (transactionId: string): Promise<{ status: string }> => {
    return fetch(`${API_BASE_URL}/payment/status/${transactionId}`)
        .then(res => handleResponse<{ status: string }>(res));
};
