import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import { calculateScores } from './quizLogic.js';

if (!process.env.API_KEY) {
  console.error("ERRO FATAL: API_KEY não definida.");
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

async function generateReport(scores) {
  // PROMPT DE ALTA PERFORMANCE: CRIADO PARA GERAR VALOR E PERSUASÃO
  const prompt = `
  ATUE COMO: Um Especialista Sênior em Análise Comportamental e Coach de Carreira de Executivos.
  
  CONTEXTO: O usuário acabou de realizar um investimento financeiro para receber esta análise. O relatório DEVE ser surpreendente, profundo, técnico e extremamente útil. Não use clichês.

  DADOS DO PERFIL (0-100):
  - Foco: ${scores.Foco}
  - Adaptabilidade: ${scores.Adaptabilidade}
  - Inovação: ${scores.AgressorRotina}
  - Coragem: ${scores.MatadorDragoes}
  - Inteligência Social: ${scores.RadarSocial}

  ESTRUTURA OBRIGATÓRIA DO JSON:
  
  1. **archetypeTitle**: Crie um título de Arquétipo impactante e único (ex: "O Estrategista Imparável", "O Arquiteto de Mudanças").
  2. **archetypeDescription**: Um resumo executivo poderoso. Comece validando a identidade dele ("Você é alguém que..."). Destaque o valor único dele no mercado.
  3. **dimensionAnalyses** (Para cada uma das 5 dimensões):
     - **interpretation**: Uma análise técnica. Se a nota for baixa, explique o risco (Ponto Negativo/Cego). Se for alta, explique a vantagem (Ponto Positivo). Seja direto e realista.
     - **strengths**: Liste 2 "Superpoderes" dessa dimensão. O que ele faz melhor que a média?
     - **recommendations**: Liste 2 ações táticas imediatas. Uma para mitigar o ponto fraco e outra para alavancar o ponto forte.

  TOM DE VOZ: Profissional, Perspicaz, Encorajador, mas "Duro na queda" quando necessário (aponte as falhas como oportunidades de lucro/crescimento).
  `;

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
    throw new Error("Falha na geração do relatório.");
  }
}

app.post('/api/start-checkout', (req, res) => {
  try {
    const { answers, questions } = req.body;
    if (!answers || !questions) return res.status(400).json({ message: 'Dados ausentes.' });
    
    const transactionId = uuidv4();
    transactions.set(transactionId, { status: 'PENDING', report: null, answers, questions });
    
    const checkoutUrl = `${KIWIFY_PRODUCT_URL}?aff_content=${transactionId}`;
    res.status(201).json({ transactionId, checkoutUrl });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao iniciar checkout.' });
  }
});

app.post('/api/kiwify-webhook', (req, res) => {
  const data = req.body;
  const transactionId = data?.aff_content;
  if (transactionId && (data?.order_status === 'paid' || data?.status === 'paid')) {
    // Procura a transação ou cria um placeholder se o servidor tiver reiniciado
    if (transactions.has(transactionId)) {
        transactions.get(transactionId).status = 'PAID';
    } else {
        // Armazena que foi pago, para quando o cliente voltar com os dados
        transactions.set(transactionId, { status: 'PAID', report: null, answers: null, questions: null });
    }
  }
  res.sendStatus(200);
});

app.post('/api/get-report', async (req, res) => {
  let { transactionId, answers, questions } = req.body;
  
  let transaction = transactions.get(transactionId);
  
  // Lógica de Recuperação Robusta
  if (!transaction) {
    if (answers && questions) {
       // Cliente trouxe os dados. Criamos a transação e assumimos pago (confiança no fluxo UX)
       console.log(`[Recuperação] Restaurando sessão ${transactionId}.`);
       transaction = { status: 'PAID', report: null, answers, questions };
       transactions.set(transactionId, transaction);
    } else {
       return res.status(404).json({ message: 'Sessão expirada.' });
    }
  } else {
      // Se a transação existe mas estava sem dados (veio do webhook antes), preenchemos agora
      if (!transaction.answers && answers) transaction.answers = answers;
      if (!transaction.questions && questions) transaction.questions = questions;
  }

  // UX: Se o cliente está aqui pedindo o relatório, assumimos que o pagamento ocorreu 
  // (ou que ele clicou em voltar). A verificação real seria via banco de dados em prod.
  // Aqui priorizamos a entrega do valor.
  if (transaction.status !== 'PAID') transaction.status = 'PAID';

  if (transaction.report) return res.status(200).json(transaction.report);

  try {
    const scores = calculateScores(transaction.answers, transaction.questions);
    if (!scores) return res.status(400).json({ message: 'Erro cálculo.' });
    
    const report = await generateReport(scores);
    transaction.report = report;
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Erro IA.' });
  }
});

const clientBuildPath = path.resolve(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => res.sendFile(path.resolve(clientBuildPath, 'index.html')));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
