import { QuizData, ReportData } from '../types';

const API_BASE_URL = '/api';

export const startCheckout = async (quizData: QuizData): Promise<{ transactionId: string, checkoutUrl: string }> => {
  console.log('Iniciando checkout...');
  try {
    const response = await fetch(`${API_BASE_URL}/start-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quizData),
    });
    
    if (!response.ok) {
      // Tenta ler o erro como texto se não for JSON
      const errorText = await response.text();
      console.error('Erro do servidor:', response.status, errorText);
      let errorMessage = `Erro do servidor: ${response.status}`;
      try {
        const json = JSON.parse(errorText);
        errorMessage = json.message || errorMessage;
      } catch (e) {
        // Se não for JSON, usa o texto puro (pode ser erro 404 ou 500 do Render)
        if (response.status === 404) errorMessage = "Erro de conexão: Rota não encontrada (404). O servidor pode estar desatualizado.";
        else if (response.status === 502) errorMessage = "O servidor está reiniciando ou indisponível (502). Tente novamente em instantes.";
        else errorMessage = `Erro inesperado: ${response.status}`;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  } catch (error: any) {
    console.error('Falha no fetch:', error);
    throw new Error(error.message || 'Falha de rede ao contatar o servidor.');
  }
};

export const fetchReportData = async (transactionId: string): Promise<ReportData> => {
    const response = await fetch(`${API_BASE_URL}/get-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        let message = 'Falha ao obter relatório.';
        try { message = JSON.parse(errorText).message || message; } catch {}
        throw new Error(message);
    }
    return response.json();
};

// Funções auxiliares vazias para manter compatibilidade
export const checkPaymentStatus = async (transactionId: string) => ({ status: 'PENDING' });
export const simulateSuccessfulPayment = async (transactionId: string) => {};
export const fetchReportPreview = async (answers: any) => "";
