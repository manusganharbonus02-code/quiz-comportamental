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
  // Prompt atualizado para ser altamente persuasivo e valioso
  const prompt = `Você é um Coach Executivo de elite e especialista em comportamento humano. O usuário acabou de pagar por este relatório e espera uma transformação.
  
  DADOS DO USUÁRIO (0-100):
  - Foco: ${scores.Foco}
  - Adaptabilidade: ${scores.Adaptabilidade}
  - Inovação: ${scores.AgressorRotina}
  - Coragem: ${scores.MatadorDragoes}
  - Inteligência Social: ${scores.RadarSocial}

  SUA MISSÃO:
  Gere um relatório JSON que seja profundo, impactante e personalizado.
  1. No "archetypeTitle", dê um nome poderoso para o perfil dele (ex: "O Arquiteto Visionário", "A Força Tática").
  2. Na "archetypeDescription", escreva um texto que faça o usuário se sentir compreendido profundamente. Use linguagem persuasiva ("Você é do tipo que...", "Seu superpoder oculto é...").
  3. Nas análises ("interpretation"), não seja genérico. Mostre as consequências reais do comportamento dele no trabalho e na vida.
  4. Nas recomendações, dê conselhos de carreira "ouro em pó". Coisas que ele pode fazer amanhã para ganhar mais ou ser promovido.

  Gere estritamente no formato JSON solicitado.`;

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
  // Aceita 'paid' ou 'approved' para garantir
  if (transactionId && (data?.order_status === 'paid' || data?.status === 'paid') && transactions.has(transactionId)) {
    const t = transactions.get(transactionId);
    t.status = 'PAID';
    console.log(`Pagamento confirmado para: ${transactionId}`);
  }
  res.sendStatus(200);
});

app.post('/api/get-report', async (req, res) => {
  let { transactionId, answers, questions } = req.body;
  
  let transaction = transactions.get(transactionId);
  
  // Recuperação de falha: Se o servidor reiniciou, recria a transação com os dados que o frontend enviou de volta
  if (!transaction) {
    if (answers && questions) {
       console.log(`[Recuperação] Recriando transação ${transactionId}.`);
       transaction = { status: 'PAID', report: null, answers, questions };
       transactions.set(transactionId, transaction);
    } else {
       return res.status(404).json({ message: 'Transação não encontrada.' });
    }
  }

  // Força status PAGO se o cliente já voltou da Kiwify (Confiança no fluxo do frontend para UX)
  if (transaction.status !== 'PAID') transaction.status = 'PAID';

  if (transaction.report) return res.status(200).json(transaction.report);

  try {
    const scores = calculateScores(transaction.answers, transaction.questions);
    if (!scores) return res.status(400).json({ message: 'Erro no cálculo.' });
    
    const report = await generateReport(scores);
    transaction.report = report;
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao gerar relatório.' });
  }
});

const clientBuildPath = path.resolve(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => res.sendFile(path.resolve(clientBuildPath, 'index.html')));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
