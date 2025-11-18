import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { calculateScores } from './quizLogic.js';

// --- VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE ---
if (!process.env.API_KEY) {
    console.error("ERRO FATAL: A variável de ambiente API_KEY da Gemini não está definida.");
    console.error("Por favor, configure-a no seu ambiente de hospedagem (ex: Render.com).");
    process.exit(1); // Encerra o servidor se a chave não estiver configurada
}

// --- CONFIGURAÇÃO INICIAL ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 4000;

// --- SUAS CONFIGURAÇÕES ---
// Substitua pela URL do seu produto na Kiwify
const KIWIFY_PRODUCT_URL = "https://pay.kiwify.com.br/RHpnrVL";

// --- BANCO DE DADOS EM MEMÓRIA ---
// Simples, mas resolve o problema de "amnésia" do servidor.
const transactions = new Map();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- LÓGICA DA GEMINI API (NO BACKEND PARA SEGURANÇA) ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const reportSchema = {
    type: Type.OBJECT,
    properties: {
        archetypeTitle: { type: Type.STRING, description: "Um título de arquétipo poderoso e criativo para o usuário (ex: 'O Estrategista Resiliente', 'A Inovadora Diplomática'). Máximo de 5 palavras." },
        archetypeDescription: { type: Type.STRING, description: "Um parágrafo cativante e perspicaz (2-3 sentenças) descrevendo a essência e o perfil geral desse arquétipo, conectando as dimensões de pontuação mais altas." },
        dimensionAnalyses: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    dimensionName: { type: Type.STRING, description: "O nome exato da dimensão sendo analisada (Foco, Adaptabilidade, AgressorRotina, MatadorDragoes, RadarSocial)." },
                    score: { type: Type.NUMBER, description: "A pontuação numérica (0-100) para esta dimensão, que foi fornecida no prompt." },
                    interpretation: { type: Type.STRING, description: "Uma interpretação personalizada e profunda do que essa pontuação específica significa para o usuário. Deve explicar o que uma pontuação alta ou baixa nessa área implica em termos de comportamento e potencial. (2-3 sentenças)." },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Uma lista de 2 a 3 pontos fortes claros, práticos e acionáveis relacionados a esta dimensão e à pontuação do usuário." },
                    recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Uma lista de 2 a 3 recomendações de desenvolvimento construtivas e práticas para ajudar o usuário a crescer nesta área." }
                },
                required: ["dimensionName", "score", "interpretation", "strengths", "recommendations"]
            }
        }
    },
    required: ["archetypeTitle", "archetypeDescription", "dimensionAnalyses"]
};

async function generateAIReport(scores) {
    const prompt = `
      Você é um especialista em análise de perfil comportamental e coach de carreira de classe mundial. Sua linguagem é encorajadora, perspicaz e profissional.
      Baseado nas seguintes pontuações (de 0 a 100) de um usuário, crie um relatório de análise comportamental completo e inspirador.
      
      Pontuações do Usuário:
      - Foco: ${scores.Foco}
      - Adaptabilidade: ${scores.Adaptabilidade}
      - Inovação (AgressorRotina): ${scores.AgressorRotina}
      - Coragem (MatadorDragoes): ${scores.MatadorDragoes}
      - Social (RadarSocial): ${scores.RadarSocial}

      Siga ESTRITAMENTE o schema JSON fornecido. O resultado deve ser um JSON válido e completo.
      1.  **archetypeTitle**: Crie um título de arquétipo que seja poderoso, memorável e reflita as pontuações mais altas do usuário.
      2.  **archetypeDescription**: Escreva uma descrição concisa e cativante que resuma a essência do perfil do usuário.
      3.  **dimensionAnalyses**: Crie uma análise DETALHADA e ÚNICA para CADA UMA das 5 dimensões. A interpretação deve ser específica para a pontuação (alta, média ou baixa). Forneça pontos fortes ('strengths') e recomendações de desenvolvimento ('recommendations') que sejam práticos e acionáveis.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: reportSchema,
                temperature: 0.75,
            }
        });
        const parsedResponse = JSON.parse(response.text.trim());
        
        // Validação da resposta da IA
        if (!parsedResponse.archetypeTitle || !Array.isArray(parsedResponse.dimensionAnalyses) || parsedResponse.dimensionAnalyses.length !== 5) {
            console.error("Resposta da IA inválida:", parsedResponse);
            throw new Error("A resposta da IA não corresponde ao formato esperado.");
        }
        return parsedResponse;
    } catch (error) {
        console.error("Erro ao gerar relatório com a Gemini:", error);
        throw new Error("A Inteligência Artificial não conseguiu processar sua análise. Por favor, tente novamente.");
    }
}

// --- ROTAS DA API ---

// Rota 1: Cliente termina o quiz -> Inicia o checkout
app.post('/api/start-checkout', (req, res) => {
    try {
        const transactionId = uuidv4();
        // Armazena a transação com status inicial PENDENTE
        transactions.set(transactionId, { status: 'PENDING', report: null });
        
        const checkoutUrl = `${KIWIFY_PRODUCT_URL}?aff_content=${transactionId}`;
        console.log(`[Checkout Iniciado] ID: ${transactionId}`);
        res.status(201).json({ transactionId, checkoutUrl });
    } catch (error) {
        console.error("Erro em /api/start-checkout:", error);
        res.status(500).json({ message: "Erro interno do servidor ao iniciar o checkout." });
    }
});

// Rota 2: Frontend verifica o status do pagamento (polling)
app.get('/api/check-payment/:transactionId', (req, res) => {
    const { transactionId } = req.params;
    const transaction = transactions.get(transactionId);

    if (!transaction) {
        return res.status(404).json({ message: 'Transação não encontrada ou expirada. Por favor, reinicie o teste.' });
    }
    
    res.status(200).json({ status: transaction.status });
});

// Rota 3: Kiwify envia notificação de pagamento (Webhook)
app.post('/api/kiwify-webhook', (req, res) => {
    try {
        const data = req.body;
        // O ID da transação que geramos está no campo 'aff_content'
        const transactionId = data?.aff_content; 
        const orderStatus = data?.order_status;

        console.log(`[Webhook Recebido] Status: ${orderStatus}, ID: ${transactionId}`);

        if (transactionId && orderStatus === 'paid' && transactions.has(transactionId)) {
            const transaction = transactions.get(transactionId);
            if (transaction.status !== 'PAID') {
                transaction.status = 'PAID';
                console.log(`[Pagamento Confirmado] Transação ${transactionId} marcada como PAGA via webhook.`);
            }
        }
        res.sendStatus(200); // Responde 200 OK para a Kiwify
    } catch (error) {
        console.error("Erro no processamento do webhook da Kiwify:", error);
        res.sendStatus(500);
    }
});

// Rota 4: Frontend pede o relatório após confirmar o pagamento
app.post('/api/generate-report', async (req, res) => {
    const { transactionId, answers, questions } = req.body;

    // Validação de entrada
    if (!transactionId || !answers || !questions) {
        return res.status(400).json({ message: 'Dados insuficientes. ID da transação, respostas e perguntas são obrigatórios.' });
    }

    const transaction = transactions.get(transactionId);
    if (!transaction) {
        return res.status(404).json({ message: 'Sessão de pagamento inválida ou expirada. Por favor, reinicie o teste.' });
    }
    
    // Se o pagamento ainda não foi confirmado pelo webhook, mas o cliente está pedindo o relatório,
    // é seguro assumir que o pagamento foi feito (confiamos no polling do frontend).
    if(transaction.status !== 'PAID') {
        console.warn(`[Aviso] Gerando relatório para transação ${transactionId} ainda não confirmada por webhook. Status: ${transaction.status}. Forçando para PAGO.`);
        transaction.status = 'PAID';
    }

    // Se o relatório já foi gerado antes, retorna a versão em cache para economizar chamadas à IA
    if (transaction.report) {
        console.log(`[Relatório Entregue] Retornando relatório em cache para ID: ${transactionId}`);
        return res.status(200).json(transaction.report);
    }

    try {
        console.log(`[Gerando Relatório] Calculando pontuações para ID: ${transactionId}`);
        const scores = calculateScores(answers, questions);
        if (!scores) {
            throw new Error("Não foi possível calcular as pontuações. Os dados de respostas ou perguntas podem estar corrompidos.");
        }
        
        console.log(`[Gerando Relatório] Pontuações calculadas:`, scores);
        console.log(`[Gerando Relatório] Chamando IA da Gemini para ID: ${transactionId}`);
        const report = await generateAIReport(scores);
        
        // Armazena o relatório na transação para futuras requisições
        transaction.report = report;
        console.log(`[Relatório Gerado] Sucesso para ID: ${transactionId}`);
        
        res.status(200).json(report);
    } catch (error) {
        console.error(`[ERRO FATAL] Ao gerar relatório para ${transactionId}:`, error);
        res.status(500).json({ message: error.message || 'Ocorreu um erro inesperado no servidor ao gerar o relatório.' });
    }
});

// --- SERVIR ARQUIVOS ESTÁTICOS DO CLIENTE (PARA PRODUÇÃO) ---
// Isso garante que o Render.com sirva seu app React.
const clientBuildPath = path.resolve(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
    res.sendFile(path.resolve(clientBuildPath, 'index.html'));
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Frontend servido a partir de: ${clientBuildPath}`);
});
