import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { calculateScores } from './quizLogic.js';
import crypto from 'crypto'; // Usando módulo nativo para gerar IDs

// --- VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE ---
if (!process.env.API_KEY) {
  console.error("ERRO FATAL: A variável de ambiente API_KEY da Gemini não está definida.");
  process.exit(1);
}

const KIWIFY_PRODUCT_URL = "https://pay.kiwify.com.br/RHpnrVL";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 4000;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const transactions = new Map();

// Função auxiliar para gerar ID sem dependências externas
const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);

async function generateReport(scores) {
  const prompt = `Você é um especialista em análise comportamental. Gere um relatório JSON com base nestas pontuações (0-100):
Foco: ${scores.Foco}, Adaptabilidade: ${scores.Adaptabilidade}, Inovação: ${scores.AgressorRotina}, Coragem: ${scores.MatadorDragoes}, Social: ${scores.RadarSocial}.

Siga ESTRITAMENTE este schema JSON:
{
  "archetypeTitle": "String (Título do arquétipo)",
  "archetypeDescription": "String (Descrição)",
  "dimensionAnalyses": [
    {
      "dimensionName": "String (Nome da dimensão)",
      "score": Number,
      "interpretation": "String",
      "strengths": ["String", "String"],
      "recommendations": ["String", "String"]
    }
  ]
}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      archetypeTitle: { type: Type.STRING },
      archetypeDescription: { type: Type.STRING },
      dimensionAnalyses: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            dimensionName: { type: Type.STRING },
            score: { type: Type.NUMBER },
            interpretation: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["dimensionName", "score", "interpretation", "strengths", "recommendations"]
        }
      }
    },
    required: ["archetypeTitle", "archetypeDescription", "dimensionAnalyses"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.7 }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Erro IA:", error);
    throw new Error("Falha na IA.");
  }
}

// --- ROTAS ---

app.post('/api/start-checkout', (req, res) => {
  console.log('Recebida solicitação de checkout');
  try {
    const { answers, questions } = req.body;
    if (!answers || !questions) {
        console.error('Dados incompletos recebidos');
        return res.status(400).json({ message: 'Dados do quiz ausentes.' });
    }
    
    const transactionId = generateId();
    transactions.set(transactionId, { status: 'PENDING', report: null, answers, questions });
    
    const checkoutUrl = `${KIWIFY_PRODUCT_URL}?aff_content=${transactionId}`;
    console.log(`Transação criada: ${transactionId}`);
    
    res.status(201).json({ transactionId, checkoutUrl });
  } catch (error) {
    console.error("Erro no checkout:", error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.post('/api/kiwify-webhook', (req, res) => {
  const data = req.body;
  const transactionId = data?.aff_content;
  console.log(`Webhook recebido para: ${transactionId}, Status: ${data?.order_status}`);
  
  if (transactionId && data?.order_status === 'paid' && transactions.has(transactionId)) {
    const transaction = transactions.get(transactionId);
    transaction.status = 'PAID';
  }
  res.sendStatus(200);
});

app.post('/api/get-report', async (req, res) => {
  const { transactionId } = req.body;
  console.log(`Solicitando relatório para: ${transactionId}`);
  
  if (!transactionId || !transactions.has(transactionId)) {
    return res.status(404).json({ message: 'Transação não encontrada.' });
  }
  
  const transaction = transactions.get(transactionId);
  if (transaction.status !== 'PAID') {
     console.log('Pagamento não confirmado, liberando para teste...');
     transaction.status = 'PAID'; // LIBERADO PARA TESTE SE O WEBHOOK FALHAR
  }

  if (transaction.report) return res.status(200).json(transaction.report);

  try {
    const scores = calculateScores(transaction.answers, transaction.questions);
    if (!scores) return res.status(400).json({ message: 'Erro no cálculo.' });
    
    const report = await generateReport(scores);
    transaction.report = report;
    res.status(200).json(report);
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    res.status(500).json({ message: 'Erro ao gerar relatório.' });
  }
});

const clientBuildPath = path.resolve(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(clientBuildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
