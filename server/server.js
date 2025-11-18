import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { calculateScores } from './quizLogic.js';

if (!process.env.API_KEY) {
    console.error("ERRO FATAL: A variável de ambiente API_KEY da Gemini não está definida.");
    process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const KIWIFY_PRODUCT_URL = "https://pay.kiwify.com.br/RHpnrVL";
const transactions = new Map();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const reportSchema = {
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

async function generateAIReport(scores) {
    const prompt = `
      Você é um especialista em análise de perfil comportamental. Baseado nas seguintes pontuações (de 0 a 100), crie um relatório completo e perspicaz.
      Pontuações: Foco: ${scores.Foco}, Adaptabilidade: ${scores.Adaptabilidade}, Inovação (AgressorRotina): ${scores.AgressorRotina}, Coragem (MatadorDragoes): ${scores.MatadorDragoes}, Social (RadarSocial): ${scores.RadarSocial}.
      O relatório deve seguir ESTRITAMENTE o schema JSON fornecido.
      1. archetypeTitle: Crie um título de arquétipo poderoso (ex: "O Estrategista Resiliente").
      2. archetypeDescription: Um parágrafo cativante descrevendo a essência desse arquétipo.
      3. dimensionAnalyses: Uma análise DETALHADA para CADA UMA das 5 dimensões com interpretation, 2-3 strengths e 2-3 recommendations.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: reportSchema,
                temperature: 0.7,
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Erro ao gerar relatório com a Gemini:", error);
        throw new Error("A IA não conseguiu processar a análise. Tente novamente.");
    }
}

app.post('/api/start-checkout', (req, res) => {
    try {
        const transactionId = uuidv4();
        transactions.set(transactionId, { status: 'PENDING', report: null });
        const checkoutUrl = `${KIWIFY_PRODUCT_URL}?aff_content=${transactionId}`;
        res.status(201).json({ transactionId, checkoutUrl });
    } catch (error) {
        res.status(500).json({ message: "Erro interno ao iniciar o checkout." });
    }
});

app.get('/api/check-payment/:transactionId', (req, res) => {
    const { transactionId } = req.params;
    const transaction = transactions.get(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transação não encontrada.' });
    res.status(200).json({ status: transaction.status });
});

app.post('/api/kiwify-webhook', (req, res) => {
    const transactionId = req.body.aff_content;
    const orderStatus = req.body.order_status;
    if (transactionId && orderStatus === 'paid' && transactions.has(transactionId)) {
        const transaction = transactions.get(transactionId);
        if (transaction.status !== 'PAID') {
            transaction.status = 'PAID';
        }
    }
    res.sendStatus(200);
});

app.post('/api/generate-report', async (req, res) => {
    const { transactionId, answers, questions } = req.body;
    if (!transactionId || !answers || !questions) return res.status(400).json({ message: 'Dados insuficientes.' });
    
    const transaction = transactions.get(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transação inválida.' });
    
    transaction.status = 'PAID';
    if (transaction.report) return res.status(200).json(transaction.report);

    try {
        const scores = calculateScores(answers, questions);
        if (!scores) throw new Error("Não foi possível calcular as pontuações.");
        const report = await generateAIReport(scores);
        transaction.report = report;
        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Erro ao gerar o relatório.' });
    }
});

// SERVIR ARQUIVOS DO CLIENT (A PARTE VISUAL)
// Esta linha diz ao servidor para procurar a pasta 'dist' que o Render vai criar.
const clientDistPath = path.resolve(__dirname, '..', 'dist');
app.use(express.static(clientDistPath));

// Se nenhuma rota da API for encontrada, envie o arquivo principal do app para o navegador.
app.get('*', (req, res) => {
    res.sendFile(path.resolve(clientDistPath, 'index.html'));
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
