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
const reportSchema = { /* ... (schema completo aqui, não precisa mudar) ... */ };

async function generateAIReport(scores) { /* ... (função completa aqui, não precisa mudar) ... */ }

// ... (todas as rotas da API aqui, não precisa mudar) ...

// SERVIR ARQUIVOS DO CLIENT
const clientDistPath = path.resolve(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
    res.sendFile(path.resolve(clientDistPath, 'index.html'));
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
