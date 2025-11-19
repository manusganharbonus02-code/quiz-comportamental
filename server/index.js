import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 4000;

// --- CONFIGURAÇÃO DE CAMINHOS (ES MODULES) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURAÇÃO DA IA ---
const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

app.use(cors());
app.use(express.json());

// --- SERVIR ARQUIVOS ESTÁTICOS (FRONTEND) ---
// Isso conecta o Backend ao Frontend. Ele diz ao servidor para usar a pasta 'dist' do cliente.
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// --- BANCO DE DADOS EM MEMÓRIA ---
const transactions = new Map();

// --- LÓGICA AUXILIAR ---
const calculateScores = (answers, questions) => {
  const scores = {
    Foco: 0,
    Adaptabilidade: 0,
    Inovacao: 0,
    Coragem: 0,
    InteligenciaSocial: 0
  };
  
  const counts = { ...scores };

  questions.forEach(q => {
    const answerValue = answers[q.id] || 0;
    let moduleKey = q.module;
    if (moduleKey === 'Inovação') moduleKey = 'Inovacao';
    if (moduleKey === 'InteligênciaSocial') moduleKey = 'InteligenciaSocial';

    if (scores[moduleKey] !== undefined) {
      scores[moduleKey] += answerValue;
      counts[moduleKey] += 1;
    }
  });

  Object.keys(scores).forEach(key => {
    if (counts[key] > 0) {
      scores[key] = Math.round((scores[key] / (counts[key] * 5)) * 100);
    }
  });

  return scores;
};

// --- ROTAS DA API ---

// 1. SUBMISSÃO DO QUIZ
app.post('/api/quiz/submit', (req, res) => {
  try {
    const { answers, questions } = req.body;
    if (!answers || !questions) return res.status(400).json({ message: 'Dados inválidos.' });

    const transactionId = uuidv4();
    const scores = calculateScores(answers, questions);

    transactions.set(transactionId, {
      answers,
      questions,
      scores,
      status: 'PENDING',
      createdAt: new Date()
    });

    console.log(`[NOVO QUIZ] ID: ${transactionId}`);
    res.status(201).json({ transactionId });
  } catch (error) {
    console.error("Erro submit:", error);
    res.status(500).json({ message: "Erro interno." });
  }
});

// 2. PRÉVIA PERSUASIVA (HOOK)
app.post('/api/report/preview', async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transaction = transactions.get(transactionId);

    if (!transaction) return res.status(404).json({ message: "Sessão não encontrada." });

    if (!ai) {
      return res.json({ previewText: "Sua análise detectou um padrão de comportamento raro. Você possui uma capacidade de liderança natural, mas identificamos uma 'trava invisível' em sua inteligência emocional." });
    }

    const prompt = `
      Analise este perfil comportamental executivo baseado nestas pontuações (0-100):
      ${JSON.stringify(transaction.scores)}
      
      Escreva UM parágrafo curto (max 30 palavras) e MISTERIOSO para a tela de pré-venda.
      1. Elogie o ponto mais forte.
      2. Diga que o ponto mais fraco está custando caro para a carreira dele.
      3. Crie um "cliffhanger" (suspense) para ele comprar o relatório completo.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.7 }
    });

    res.json({ previewText: response.text.trim() });

  } catch (error) {
    console.error("Erro Preview:", error);
    res.status(500).json({ message: "Erro ao gerar prévia." });
  }
});

// 3. RELATÓRIO COMPLETO (ENTREGA DE VALOR)
app.get('/api/report/full/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = transactions.get(transactionId);

    if (!transaction) return res.status(404).json({ message: "Relatório não encontrado." });

    // if (transaction.status !== 'PAID') return res.status(403).json({ message: "Pagamento pendente." });

    if (transaction.fullReport) {
      return res.json(transaction.fullReport);
    }

    if (!ai) {
      return res.json({
        archetype: "O Estrategista Visionário (Mock)",
        summary: "Você possui uma visão única, mas tropeça na execução detalhada.",
        dimensions: [
          { name: "Foco", score: transaction.scores.Foco || 50, analysis: "Análise teste..." },
          { name: "Coragem", score: transaction.scores.Coragem || 50, analysis: "Análise teste..." },
          { name: "Inovacao", score: transaction.scores.Inovacao || 50, analysis: "Análise teste..." },
          { name: "Adaptabilidade", score: transaction.scores.Adaptabilidade || 50, analysis: "Análise teste..." },
          { name: "InteligenciaSocial", score: transaction.scores.InteligenciaSocial || 50, analysis: "Análise teste..." }
        ],
        blindSpot: "Falta de acabativa em projetos longos.",
        actionPlan: ["Delegue tarefas repetitivas", "Use a técnica Pomodoro"]
      });
    }

    const prompt = `
      Você é um Consultor Executivo de Elite. Gere um relatório JSON detalhado para este perfil:
      Scores: ${JSON.stringify(transaction.scores)}
      
      O JSON deve seguir EXATAMENTE esta estrutura:
      {
        "archetype": "Nome Criativo do Arquétipo (ex: O Comandante Resiliente)",
        "summary": "Resumo executivo de 2 parágrafos sobre o perfil.",
        "dimensions": [
          { "name": "Foco", "score": ${transaction.scores.Foco || 0}, "analysis": "Análise profunda..." },
          { "name": "Adaptabilidade", "score": ${transaction.scores.Adaptabilidade || 0}, "analysis": "Análise profunda..." },
          { "name": "Inovacao", "score": ${transaction.scores.Inovacao || 0}, "analysis": "Análise profunda..." },
          { "name": "Coragem", "score": ${transaction.scores.Coragem || 0}, "analysis": "Análise profunda..." },
          { "name": "InteligenciaSocial", "score": ${transaction.scores.InteligenciaSocial || 0}, "analysis": "Análise profunda..." }
        ],
        "blindSpot": "O maior ponto cego que está impedindo o sucesso financeiro dessa pessoa.",
        "actionPlan": [
          "Ação prática 1",
          "Ação prática 2",
          "Ação prática 3"
        ]
      }
      Responda APENAS o JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const reportData = JSON.parse(response.text);
    transaction.fullReport = reportData;
    res.json(reportData);

  } catch (error) {
    console.error("Erro Full Report:", error);
    res.status(500).json({ message: "Erro ao gerar relatório completo." });
  }
});

// 4. WEBHOOK KIWIFY
app.post('/api/kiwify-webhook', (req, res) => {
  const data = req.body;
  const transactionId = data.aff_content || (data.order && data.order.src);
  const status = data.order_status;

  if (transactionId && transactions.has(transactionId)) {
    const t = transactions.get(transactionId);
    if (status === 'paid') {
      t.status = 'PAID';
      console.log(`Pagamento confirmado para ${transactionId}`);
    }
  }
  res.status(200).send('OK');
});

app.get('/api/simulate-pay/:id', (req, res) => {
  const { id } = req.params;
  if (transactions.has(id)) {
    transactions.get(id).status = 'PAID';
    res.send(`Transação ${id} marcada como PAGA.`);
  } else {
    res.status(404).send("ID não encontrado.");
  }
});

// --- ROTA CATCH-ALL (A Mágica acontece aqui) ---
// Se a requisição não for para /api, entrega o index.html do React
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
