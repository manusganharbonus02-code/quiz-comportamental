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

// --- Variáveis Globais (Inicializadas abaixo) ---
let ai;
let ALL_QUESTIONS = [];


// --- Funções de Inicialização ---

async function loadQuestions() {
    try {
        // Tenta carregar o arquivo, assumindo que está na mesma pasta do servidor
        const data = await fs.readFile(path.join(__dirname, 'questions.json'), 'utf-8');
        ALL_QUESTIONS = JSON.parse(data);
        console.log("SUCCESS: Questions loaded successfully.");
    } catch (error) {
        // O servidor não deve parar se o arquivo faltar, apenas avisa (CRITICAL WARNING)
        console.error("CRITICAL WARNING: Failed to load questions.json. Questions API will be empty.", error.message);
        ALL_QUESTIONS = []; // Garante que a lista fique vazia, mas o servidor não para
    }
}

function getShuffledSubset(arr, num) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

// --- API Endpoints ---

app.get('/api/questions', (req, res) => {
    // Agora verifica se a lista foi carregada
    if (ALL_QUESTIONS.length === 0) {
        return res.status(500).json({ message: "Question bank is not available. Check server logs." });
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
        // Verifica se a IA foi inicializada antes de usar
        if (!ai) return res.status(500).json({ previewText: 'Server is initializing. Try again in a moment.' });
        
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
        // Resposta alternativa que o Frontend pode renderizar em caso de falha da IA
        res.status(500).json({ previewText: 'Analisamos suas respostas e identificamos um padrão fascinante em sua abordagem para desafios, mas também uma oportunidade única para ampliar seu impacto. O relatório completo detalha como transformar esse potencial em resultados concretos.' });
    }
});

app.post('/api/webhook/kiwify', (req, res) => {
    console.log('Kiwify webhook received:', req.body);
    const { 'order_id': orderId, 'order_status': status } = req.body;
    
    // NOTE: This is a simplified logic for a single-user demo.
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
        if (!ai) return res.status(500).json({ message: 'Server is initializing. Try again in a moment.' });

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


// --- Inicialização do Servidor (Função Assíncrona) ---

async function initializeServer() {
    // 1. Verifica a chave API
    if (!process.env.API_KEY) {
        console.error("FATAL ERROR: API_KEY environment variable is not set. Cannot initialize AI.");
        // Retorna, mas NÃO encerra o processo se possível para tentar servir o frontend
        // No Render, este erro fatal irá provavelmente reiniciar o serviço
        return; 
    }
    
    // Inicializa a IA (depois de verificar a chave)
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 2. Carrega as perguntas
    await loadQuestions();

    // 3. Configuração de arquivos estáticos (Frontend Build)
    if (process.env.NODE_ENV === 'production') {
        // A Render sugere que o build do client está em 'client/dist'
        const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
        app.use(express.static(clientBuildPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(clientBuildPath, 'index.html'));
        });
    }

    // 4. Inicia o servidor
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
}

// Inicia o processo do servidor
initializeServer();
