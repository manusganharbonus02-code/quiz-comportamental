import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const transactions = new Map();

// Initialize Gemini AI
if (!process.env.API_KEY) {
    console.error("FATAL ERROR: API_KEY environment variable is not set.");
    process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let ALL_QUESTIONS = [];
try {
    const data = await fs.readFile(path.join(__dirname, 'questions.json'), 'utf-8');
    ALL_QUESTIONS = JSON.parse(data);
} catch (error) {
    console.error("Failed to load questions.json:", error);
    process.exit(1);
}

function getShuffledSubset(arr, num) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

// --- API Endpoints ---

app.get('/api/questions', (req, res) => {
    if (ALL_QUESTIONS.length === 0) {
        return res.status(500).json({ message: "Question bank is not available." });
    }
    const questions = getShuffledSubset(ALL_QUESTIONS, 25);
    res.json({ questions });
});

app.post('/api/quiz/submit', (req, res) => {
    const { answers } = req.body;
    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
        return res.status(400).json({ message: 'Invalid answers provided.' });
    }
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    transactions.set(transactionId, { answers, status: 'pending_payment', createdAt: new Date() });
    console.log(`Transaction created: ${transactionId}`);
    res.status(201).json({ transactionId });
});

app.get('/api/report/preview/:transactionId', async (req, res) => {
    const { transactionId } = req.params;
    const transaction = transactions.get(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });

    try {
        const answersString = JSON.stringify(transaction.answers, null, 2);
        const prompt = `
            Você é um coach de alta performance e especialista em análise comportamental.
            Sua tarefa é analisar as respostas de um quiz de autoavaliação (${answersString}) e criar uma amostra de análise curta (2-3 frases) que seja extremamente persuasiva, gerando curiosidade e um senso de urgência para que o usuário compre o relatório completo.

            Siga estes passos rigorosamente:
            1. Identifique o padrão positivo mais fascinante nas respostas e elogie-o de forma inspiradora e específica. Ex: "Sua capacidade de manter o foco sob pressão é notável...".
            2. Em seguida, identifique o 'ponto cego' ou o desafio mais crítico que as respostas sugerem. Apresente isso como uma oportunidade crucial que cria um senso de urgência. Ex: "...no entanto, essa mesma determinação revela um padrão surpreendente na sua tomada de decisão que pode estar, sem que você perceba, limitando seu impacto máximo."
            3. Conecte as duas ideias de forma que o relatório completo seja posicionado como a chave indispensável para resolver esse conflito e desbloquear o verdadeiro potencial.

            O tom deve ser profissional, direto e intrigante. O resultado precisa parecer 100% personalizado.
            Responda em português do Brasil.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.8 }
        });
        
        const previewText = response.text.trim();
        res.json({ previewText });

    } catch (error) {
        console.error('Gemini preview generation error:', error);
        res.status(500).json({ previewText: 'Analisamos suas respostas e identificamos um padrão fascinante em sua abordagem para desafios, mas também uma oportunidade única para ampliar seu impacto. O relatório completo detalha como transformar esse potencial em resultados concretos.' });
    }
});

app.post('/api/webhook/kiwify', (req, res) => {
    console.log('Kiwify webhook received:', req.body);
    const { 'order_id': orderId, 'order_status': status } = req.body;
    
    // NOTE: This is a simplified logic for a single-user demo.
    // It finds the most recent pending transaction and assumes the webhook is for it.
    // This is NOT robust for a real multi-user production environment.
    let transactionToUpdate = null;
    let transactionId = null;
    let latestTime = 0;

    for (const [key, value] of transactions.entries()) {
        if (value.status === 'pending_payment' && value.createdAt.getTime() > latestTime) {
            latestTime = value.createdAt.getTime();
            transactionToUpdate = value;
            transactionId = key;
        }
    }

    if (status === 'paid' && transactionToUpdate) {
        transactionToUpdate.status = 'paid';
        transactionToUpdate.paymentDetails = req.body;
        transactions.set(transactionId, transactionToUpdate);
        console.log(`SUCCESS: Payment confirmed via webhook for transaction: ${transactionId}`);
    } else {
        console.warn(`Webhook ignored: status was '${status}' or no matching pending transaction found.`);
    }
    
    res.status(200).send({ message: 'Webhook processed' });
});

app.get('/api/payment/status/:transactionId', (req, res) => {
    const { transactionId } = req.params;
    const transaction = transactions.get(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
    res.json({ status: transaction.status });
});

app.get('/api/report/full/:transactionId', async (req, res) => {
    const { transactionId } = req.params;
    const transaction = transactions.get(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
    if (transaction.status !== 'paid') return res.status(403).json({ message: 'Payment not confirmed.' });

    try {
        const answersString = JSON.stringify(transaction.answers, null, 2);
        const prompt = `
            Você é um coach de carreira e especialista em psicologia comportamental.
            Baseado nestas respostas de quiz: ${answersString}, gere uma análise personalizada e acionável.
            Sua resposta DEVE ser um objeto JSON válido, sem formatação markdown.
            O objeto JSON deve ter três chaves: "scores", "interpretations", e "recommendations".
            - "scores": um objeto com pontuações numéricas de 1.0 a 5.0 para "focus", "productivity", e "resilience".
            - "interpretations": um objeto com parágrafos detalhados e perspicazes para "focus", "productivity", e "resilience".
            - "recommendations": um array com exatamente 5 strings, cada uma sendo uma dica concreta e personalizada.
            O tom deve ser profissional, empático e encorajador.
            Responda em português do Brasil.
        `;
        
        const responseSchema = {
          type: Type.OBJECT, properties: {
            scores: { type: Type.OBJECT, properties: { focus: { type: Type.NUMBER }, productivity: { type: Type.NUMBER }, resilience: { type: Type.NUMBER } } },
            interpretations: { type: Type.OBJECT, properties: { focus: { type: Type.STRING }, productivity: { type: Type.STRING }, resilience: { type: Type.STRING } } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
                responseMimeType: 'application/json',
                responseSchema,
            },
        });
        
        const report = JSON.parse(response.text);
        transaction.status = 'completed';
        transactions.set(transactionId, transaction);
        res.json(report);
    } catch (error) {
        console.error('Gemini full report generation error:', error);
        res.status(500).json({ message: 'Error generating full report.' });
    }
});

if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
    app.use(express.static(clientBuildPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
}

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
