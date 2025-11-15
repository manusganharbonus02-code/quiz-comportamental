import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 4000;

const GEMINI_API_KEY = process.env.API_KEY;
if (!GEMINI_API_KEY) {
  console.error("ERRO: A variável de ambiente API_KEY do Gemini não foi definida.");
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

app.use(cors());
app.use(express.json());

const transactions = new Map();

const ANSWER_LABELS = { 1: "Discordo Totalmente", 2: "Discordo", 3: "Neutro", 4: "Concordo", 5: "Concordo Totalmente" };
const formatAnswersForAI = (answers) => {
    return Object.entries(answers)
        .map(([questionId, answerValue]) => `Pergunta ID ${questionId}: Resposta ${ANSWER_LABELS[answerValue] || 'N/A'} (valor: ${answerValue}/5)`)
        .join('\n');
};

app.get('/api', (req, res) => {
  res.send('API do Quiz Comportamental está no ar!');
});

app.post('/api/quiz/submit', (req, res) => {
  const { answers } = req.body;
  if (!answers || Object.keys(answers).length === 0) {
    return res.status(400).json({ message: 'Respostas inválidas.' });
  }
  const transactionId = `txn_${Date.now()}`;
  transactions.set(transactionId, { answers, status: 'PENDING' });
  console.log(`[OK] Transação criada: ${transactionId}`);
  res.status(201).json({ transactionId });
});

app.post('/api/kiwify-webhook', (req, res) => {
  console.log('[WEBHOOK] Webhook recebido:', req.body);
  // Implemente a lógica de validação e atualização da Kiwify aqui.
  res.sendStatus(200);
});

app.get('/api/payment/status/:transactionId', (req, res) => {
  const { transactionId } = req.params;
  const transaction = transactions.get(transactionId);
  if (!transaction) return res.status(404).json({ message: 'Transação não encontrada.' });
  res.status(200).json({ status: transaction.status });
});

app.post('/api/payment/simulate/:transactionId', (req, res) => {
  const { transactionId } = req.params;
  if (transactions.has(transactionId)) {
    transactions.get(transactionId).status = 'PAID';
    console.log(`[SIMULATION] Status da transação ${transactionId} atualizado para PAGO.`);
    res.status(200).json({ message: 'Pagamento simulado com sucesso.' });
  } else {
    res.status(404).json({ message: 'Transação não encontrada para simulação.' });
  }
});

app.post('/api/report/preview', async (req, res) => {
  const { answers } = req.body;
  if (!answers) return res.status(400).json({ message: 'Respostas não fornecidas.' });
  
  const formattedAnswers = formatAnswersForAI(answers);
  const systemInstruction = `Você é um coach de carreira. Sua tarefa é escrever uma prévia curta (2-3 frases), persuasiva e intrigante de um relatório comportamental. Destaque um ponto forte e sugira uma área de melhoria como um "potencial oculto" para despertar a curiosidade do usuário de comprar o relatório completo.`;
  const prompt = `Com base nestas respostas, gere a prévia persuasiva:\n${formattedAnswers}`;

  try {
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { systemInstruction, temperature: 0.8 } });
    const previewText = response.text.trim();
    res.status(200).json({ previewText });
  } catch (error) {
    console.error("[ERRO IA] Falha ao gerar prévia:", error);
    res.status(500).json({ message: "Erro ao gerar a prévia do relatório." });
  }
});

app.get('/api/report/full/:transactionId', async (req, res) => {
  const { transactionId } = req.params;
  const transaction = transactions.get(transactionId);

  if (!transaction) return res.status(404).json({ message: 'Transação não encontrada.' });
  if (transaction.status !== 'PAID') return res.status(402).json({ message: 'Pagamento necessário.' });

  const { answers } = transaction;
  const formattedAnswers = formatAnswersForAI(answers);
  const systemInstruction = `Você é um especialista em análise de perfil comportamental. Sua tarefa é analisar as respostas de um usuário e gerar um relatório perspicaz, encorajador e acionável em JSON. Calcule scores de 0.0 a 5.0 para Foco, Produtividade e Resiliência. Escreva interpretações personalizadas para cada um e forneça exatamente 5 recomendações práticas.`;
  const prompt = `Analise as seguintes respostas e gere o relatório comportamental em JSON:\n${formattedAnswers}`;
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      scores: { type: Type.OBJECT, properties: { Foco: { type: Type.NUMBER }, Produtividade: { type: Type.NUMBER }, Resiliência: { type: Type.NUMBER } } },
      interpretations: { type: Type.OBJECT, properties: { Foco: { type: Type.STRING }, Produtividade: { type: Type.STRING }, Resiliência: { type: Type.STRING } } },
      recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["scores", "interpretations", "recommendations"]
  };

  try {
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { systemInstruction, responseMimeType: "application/json", responseSchema, temperature: 0.7 } });
    const reportData = JSON.parse(response.text.trim());
    res.status(200).json(reportData);
  } catch (error) {
    console.error(`[ERRO IA] Falha ao gerar relatório completo para ${transactionId}:`, error);
    res.status(500).json({ message: "Erro ao gerar o relatório completo." });
  }
});

app.listen(PORT, () => {
  console.log(`[INFO] Servidor rodando na porta ${PORT}`);
});
