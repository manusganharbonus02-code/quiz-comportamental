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

// --- SERVE OS ARQUIVOS ESTÁTICOS DO REACT ---
// Esta é a parte crucial que faltava para a Render.
// Diz ao servidor onde encontrar o site que foi "construído".
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Armazenamento em memória para as transações
const transactions = new Map();

// Inicializa a IA da Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Carrega as perguntas do arquivo JSON
let ALL_QUESTIONS = [];
try {
    const data = await fs.readFile(path.join(__dirname, 'questions.json'), 'utf-8');
    ALL_QUESTIONS = JSON.parse(data);
} catch (error) {
    console.error("Falha ao carregar questions.json:", error);
    process.exit(1);
}

function getShuffledSubset(arr, num) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

// --- Endpoints da API ---

app.get('/api/questions', (req, res) => {
    if (ALL_QUESTIONS.length === 0) {
        return res.status(500).json({ message: "O banco de perguntas não está disponível." });
    }
    const questions = getShuffledSubset(ALL_QUESTIONS, 25);
    res.json({ questions });
});

app.post('/api/quiz/submit', (req, res) => {
    const { answers } = req.body;
    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
        return res.status(400).json({ message: 'Respostas inválidas.' });
    }
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    transactions.set(transactionId, { answers, status: 'pending', createdAt: new Date() });
    res.status(201).json({ transactionId });
});

app.get('/api/report/preview/:transactionId', async (req, res) => {
    const { transactionId } = req.params;
    const transaction = transactions.get(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transação não encontrada.' });

    try {
        const answersString = JSON.stringify(transaction.answers);
        const prompt = `Você é um psicólogo comportamental criando uma análise prévia e instigante. Baseado nestas respostas de um quiz (${answersString}), escreva uma prévia de 2-3 frases que seja misteriosa e persuasiva. Dê uma pista sobre uma força única e um 'potencial oculto' ou 'desafio surpreendente'. O objetivo é deixar o usuário extremamente curioso para comprar o relatório completo. Não revele detalhes concretos. Termine com reticências (...) para criar suspense. Responda em português do Brasil.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.8 } });
        res.json({ previewText: response.text.trim() });
    } catch (error) {
        console.error('Erro na prévia da Gemini:', error);
        res.status(500).json({ message: 'Erro ao gerar a prévia.' });
    }
});

app.get('/api/report/full/:transactionId', async (req, res) => {
    const { transactionId } = req.params;
    const transaction = transactions.get(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transação não encontrada.' });

    try {
        const answersString = JSON.stringify(transaction.answers);
        const prompt = `Você é um coach de carreira e especialista em psicologia comportamental. Baseado nestas respostas de quiz: ${answersString}, gere uma análise personalizada e acionável. Sua resposta DEVE ser um objeto JSON válido. O objeto JSON deve ter três chaves: "scores" (um objeto com pontuações para "focus", "productivity", e "resilience" de 1 a 5, podendo ser decimal), "interpretations" (um objeto com parágrafos detalhados para "focus", "productivity", e "resilience"), e "recommendations" (um array com 5 dicas concretas e personalizadas). O tom deve ser profissional, empático e encorajador. Evite generalidades. Responda em português do Brasil.`;
        const responseSchema = { type: Type.OBJECT, properties: { scores: { type: Type.OBJECT, properties: { focus: { type: Type.NUMBER }, productivity: { type: Type.NUMBER }, resilience: { type: Type.NUMBER } } }, interpretations: { type: Type.OBJECT, properties: { focus: { type: Type.STRING }, productivity: { type: Type.STRING }, resilience: { type: Type.STRING } } }, recommendations: { type: Type.ARRAY, items: { type: Type.STRING } } } };
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.7, responseMimeType: 'application/json', responseSchema } });
        const report = JSON.parse(response.text.trim());
        transaction.status = 'completed';
        res.json(report);
    } catch (error) {
        console.error('Erro no relatório completo da Gemini:', error);
        res.status(500).json({ message: 'Erro ao gerar o relatório completo.' });
    }
});

// --- ROTA "CATCH-ALL" ---
// Envia o arquivo principal index.html para qualquer requisição que não seja para a API.
// Essencial para o React funcionar.
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
