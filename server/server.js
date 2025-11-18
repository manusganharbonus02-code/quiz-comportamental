import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import { calculateScores } from './quizLogic.js';

// --- VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE ---
if (!process.env.API_KEY) {
  console.error("ERRO FATAL: A variável de ambiente API_KEY da Gemini não está definida.");
  console.error("Por favor, configure-a no seu ambiente de hospedagem (ex: Render.com).");
  process.exit(1); // Encerra o servidor se a chave não estiver configurada
}

// --- SUAS CONFIGURAÇÕES ---
// Substitua pela URL do seu produto na Kiwify
const KIWIFY_PRODUCT_URL = "https://pay.kiwify.com.br/RHpnrVL";

// --- CONFIGURAÇÃO INICIAL ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 4000;

// --- CONFIGURAÇÃO DA IA ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Middleware para processar JSON e URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- BANCO DE DADOS EM MEMÓRIA ---
// Atenção: Isso significa que os dados serão perdidos se o servidor reiniciar.
const transactions = new Map();

// --- FUNÇÃO DE GERAÇÃO DE RELATÓRIO ---
async function generateReport(scores) {
  const prompt = `Você é um especialista em análise comportamental. Seu objetivo é gerar um relatório de perfil completo e personalizado com base nas pontuações fornecidas.

As pontuações do usuário (0-100) são:
- Foco: ${scores.Foco}
- Adaptabilidade: ${scores.Adaptabilidade}
- Agressor Rotina (Inovação): ${scores.AgressorRotina}
- Matador Dragões (Coragem): ${scores.MatadorDragoes}
- Social (Radar Social): ${scores.RadarSocial}

Siga ESTRITAMENTE o schema JSON fornecido. O resultado deve ser um JSON válido e completo.
1. **archetypeTitle**: Crie um título de arquétipo que seja poderoso, memorável e reflita as pontuações mais altas do usuário.
2. **archetypeDescription**: Escreva uma descrição concisa e cativante que resuma a essência do perfil do usuário.
3. **dimensionAnalyses**: Crie uma análise DETALHADA e ÚNICA para CADA UMA das 5 dimensões. A interpretação deve ser específica para a pontuação (alta, média ou baixa). Forneça pontos fortes ('strengths') e recomendações de desenvolvimento ('recommendations') que sejam práticos e acionáveis.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      archetypeTitle: { type: Type.STRING, description: "O título do arquétipo do usuário." },
      archetypeDescription: { type: Type.STRING, description: "Uma descrição concisa do arquétipo." },
      dimensionAnalyses: {
        type: Type.ARRAY,
        description: "Uma lista de 5 análises, uma para cada dimensão.",
        items: {
          type: Type.OBJECT,
          properties: {
            dimensionName: { type: Type.STRING, description: "O nome exato da dimensão sendo analisada (Foco, Adaptabilidade, AgressorRotina, MatadorDragoes, RadarSocial)." },
            score: { type: Type.NUMBER, description: "A pontuação numérica (0-100) para esta dimensão, que foi fornecida no prompt." },
            interpretation: { type: Type.STRING, description: "Uma interpretação personalizada e profunda do que essa pontuação específica significa para o usuário. (2-3 sentenças)." },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Uma lista de 2 a 3 pontos fortes claros e práticos." },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Uma lista de 2 a 3 recomendações de desenvolvimento construtivas." }
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
    console.error("Erro ao gerar relatório com a IA:", error);
    throw new Error("A Inteligência Artificial não conseguiu processar sua análise. Por favor, tente novamente.");
  }
}

// --- ROTAS DA API ---

// Rota 1: Cliente termina o quiz -> Inicia o checkout
app.post('/api/start-checkout', (req, res) => {
  try {
    const { answers, questions } = req.body;
    if (!answers || !questions) {
        return res.status(400).json({ message: 'Dados do quiz ausentes.' });
    }
    const transactionId = uuidv4();
    // Armazena a transação com status inicial PENDENTE e as respostas
    transactions.set(transactionId, { status: 'PENDING', report: null, answers, questions });
    const checkoutUrl = `${KIWIFY_PRODUCT_URL}?aff_content=${transactionId}`;
    console.log(`[Checkout Iniciado] ID: ${transactionId}`);
    res.status(201).json({ transactionId, checkoutUrl });
  } catch (error) {
    console.error("Erro em /api/start-checkout:", error);
    res.status(500).json({ message: 'Ocorreu um erro inesperado ao iniciar o checkout.' });
  }
});

// Rota 2: Kiwify envia a confirmação de pagamento (Webhook)
app.post('/api/kiwify-webhook', (req, res) => {
  try {
    const data = req.body;
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
    res.sendStatus(200); // Responde 200 OK sempre
  } catch (error) {
    console.error("Erro em /api/kiwify-webhook:", error);
    res.sendStatus(500);
  }
});

// Rota 3: Cliente retorna do checkout e pede o relatório
app.post('/api/get-report', async (req, res) => {
  const { transactionId } = req.body;
  if (!transactionId || !transactions.has(transactionId)) {
    return res.status(404).json({ message: 'Transação não encontrada.' });
  }
  const transaction = transactions.get(transactionId);
  
  // Confia no frontend que só chama essa rota após voltar do checkout
  if (transaction.status !== 'PAID') {
    console.warn(`[Aviso] Gerando relatório para transação ${transactionId} ainda não confirmada por webhook. Forçando para PAGO.`);
    transaction.status = 'PAID';
  }

  if (transaction.report) {
    console.log(`[Relatório Entregue] Retornando relatório em cache para ID: ${transactionId}`);
    return res.status(200).json(transaction.report);
  }

  try {
    const { answers, questions } = transaction;
    const scores = calculateScores(answers, questions);
    if (!scores) {
      return res.status(400).json({ message: 'Dados do quiz inválidos. Não foi possível calcular a pontuação.' });
    }
    const report = await generateReport(scores);
    transaction.report = report; // Salva o relatório na transação (cache)
    console.log(`[Relatório Gerado] Relatório gerado e salvo para ID: ${transactionId}`);
    res.status(200).json(report);
  } catch (error) {
    console.error(`Erro ao gerar relatório para ${transactionId}:`, error);
    res.status(500).json({ message: error.message || 'Ocorreu um erro inesperado no servidor ao gerar o relatório.' });
  }
});

// --- SERVIR ARQUIVOS ESTÁTICOS DO CLIENTE (PARA PRODUÇÃO) ---
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
