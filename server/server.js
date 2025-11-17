// server/server.mjs
import express from 'express';
import cors from 'cors'; // ESSENCIAL para a comunicação Frontend/Backend
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Inicialização da API Key da Gemini
const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.error("ERRO: Variável de ambiente API_KEY não definida.");
}
const ai = new GoogleGenAI({ apiKey });

const app = express();

// CORREÇÃO CRÍTICA 1: Aplicação do CORS para comunicação Frontend/Backend
app.use(cors({
    origin: '*', // Permite todas as origens, fundamental para a Render
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

app.use(express.json());

// Rota de teste simples
app.get('/', (req, res) => {
    res.send('Servidor do Quiz Comportamental está online!');
});

// Exemplo de Rota de Prévia (POST /api/report/preview)
app.post('/api/report/preview', async (req, res) => {
    const { answers } = req.body;
    
    if (!answers || answers.length === 0) {
        return res.status(400).json({ error: "Respostas ausentes." });
    }

    try {
        const prompt = `Analise estas respostas para um teste de perfil comportamental e gere uma **prévia sutil** da análise, focando em despertar curiosidade e motivar a compra do relatório completo. Respostas: ${answers.join(', ')}`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: prompt,
        });

        res.json({ preview: response.text });
    } catch (error) {
        console.error("Erro ao gerar prévia da análise:", error);
        res.status(500).json({ error: "Ocorreu um erro na geração da prévia da análise. Tente novamente." });
    }
});


// Configuração da Porta do Servidor (usa a variável de ambiente PORT da Render)
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Servidor ouvindo na porta ${PORT}`);
});
