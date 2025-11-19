import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 4000;

// --- CONFIGURAÇÃO DA IA (GEMINI) ---
// Certifique-se de ter a variável API_KEY no seu arquivo .env
const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

app.use(cors());
app.use(express.json());

// --- BANCO DE DADOS EM MEMÓRIA ---
// Armazena o estado do usuário, respostas e status do pagamento.
const transactions = new Map();

// --- LÓGICA DE CÁLCULO DE PONTUAÇÃO ---
// Transforma as respostas (1 a 5) em uma porcentagem (0 a 100) para cada dimensão.
const calculateScores = (answers, questions) => {
  const scores = {
    Foco: 0,
    Adaptabilidade: 0,
    Inovacao: 0,
    Coragem: 0,
    InteligenciaSocial: 0
  };
  
  const counts = { ...scores }; // Para contar quantas perguntas de cada tipo existem

  questions.forEach(q => {
    const answerValue = answers[q.id] || 0;
    // Mapeia o nome do módulo vindo do frontend para as chaves do objeto scores
    // Remove acentos caso venha "Inovação" ou "InteligênciaSocial"
    let moduleKey = q.module;
    if (moduleKey === 'Inovação') moduleKey = 'Inovacao';
    if (moduleKey === 'InteligênciaSocial') moduleKey = 'InteligenciaSocial';

    if (scores[moduleKey] !== undefined) {
      scores[moduleKey] += answerValue;
      counts[moduleKey] += 1;
    }
  });

  // Normaliza para 0-100%
  Object.keys(scores).forEach(key => {
    if (counts[key] > 0) {
      // (Soma das respostas / (Numero de perguntas * 5)) * 100
      scores[key] = Math.round((scores[key] / (counts[key] * 5)) * 100);
    }
  });

  return scores;
};

// --- ROTAS DA API ---

// ROTA 1: RECEBER O QUIZ (Início do Checkout)
app.post('/api/quiz/submit', (req, res) => {
  try {
    const { answers, questions } = req.body;

    if (!answers || !questions) {
      return res.status(400).json({ message: 'Dados inválidos enviadas para o servidor.' });
    }

    const transactionId = uuidv4();
    
    // Calcula os scores imediatamente para usar na prévia
    const scores = calculateScores(answers, questions);

    // Salva tudo na memória
    transactions.set(transactionId, {
      answers,
      questions,
      scores,
      status: 'PENDING', // Status inicial. Vai para 'PAID' quando o webhook do Kiwify bater.
      createdAt: new Date()
    });

    console.log(`[NOVO QUIZ] ID Gerado: ${transactionId}`);
    res.status(201).json({ transactionId });

  } catch (error) {
    console.error("Erro ao processar submit:", error);
    res.status(500).json({ message: "Erro interno no servidor." });
  }
});

// ROTA 2: GERAR PRÉVIA PERSUASIVA (O Gancho)
// Essa rota deve ser rápida e gerar um texto curto que deixe o usuário curioso.
app.post('/api/report/preview', async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transaction = transactions.get(transactionId);

    if (!transaction) {
      return res.status(404).json({ message: "Sessão não encontrada." });
    }

    // Fallback se a IA não estiver configurada
    if (!ai) {
      return res.json({ 
        previewText: "Seu perfil indica uma capacidade de liderança natural, mas nossos algoritmos detectaram um padrão de autossabotagem na sua tomada de decisão." 
      });
    }

    // Prompt Persuasivo
    const prompt = `
      Atue como um especialista em comportamento humano e persuasão (copywriting).
      
      Analise estas pontuações de um perfil executivo (0 a 100):
      ${JSON.stringify(transaction.scores)}
      
      Sua tarefa: Escrever UM parágrafo curto (máximo 30 palavras) e MISTERIOSO para exibir na tela de pré-venda antes do usuário comprar o relatório completo.
      
      Regras:
      1. Identifique o ponto mais forte e elogie brevemente.
      2. Identifique o ponto mais fraco e diga (sem revelar qual é) que ele está custando dinheiro ou oportunidades para essa pessoa.
      3. Crie um "cliffhanger" (suspense) dizendo que o relatório completo revela como destravar isso.
      4. Tom de voz: Sério, profissional, mas intrigante.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.7 }
    });

    res.json({ previewText: response.text.trim() });

  } catch (error) {
    console.error("Erro ao gerar preview:", error);
    res.status(500).json({ message: "Erro ao comunicar com a IA." });
  }
});

// ROTA 3: GERAR RELATÓRIO COMPLETO (A Entrega Técnica)
// Aqui geramos o JSON complexo com gráficos e análises.
app.get('/api/report/full/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = transactions.get(transactionId);

    if (!transaction) {
      return res.status(404).json({ message: "Relatório não encontrado." });
    }

    // --- VALIDAÇÃO DE PAGAMENTO ---
    // Em produção, descomente a linha abaixo para bloquear quem não pagou.
    // Para testar agora, deixe comentado.
    // if (transaction.status !== 'PAID') return res.status(403).json({ message: "Pagamento pendente." });

    // Se já geramos o relatório antes, retorna o cache (economiza tempo e dinheiro)
    if (transaction.fullReport) {
      return res.json(transaction.fullReport);
    }

    if (!ai) {
      // Mock para testes sem API Key
      return res.json({
        archetype: "O Estrategista Visionário (Mock)",
        summary: "Você possui uma visão única, mas tropeça na execução detalhada.",
        dimensions: [
          { name: "Foco", score: transaction.scores.Foco || 50, analysis: "Análise de teste..." },
          { name: "Coragem", score: transaction.scores.Coragem || 50, analysis: "Análise de teste..." },
          { name: "Inovacao", score: transaction.scores.Inovacao || 50, analysis: "Análise de teste..." },
          { name: "Adaptabilidade", score: transaction.scores.Adaptabilidade || 50, analysis: "Análise de teste..." },
          { name: "InteligenciaSocial", score: transaction.scores.InteligenciaSocial || 50, analysis: "Análise de teste..." }
        ],
        blindSpot: "Falta de acabativa em projetos longos.",
        actionPlan: ["Delegue tarefas repetitivas", "Use a técnica Pomodoro", "Peça feedback semanal"]
      });
    }

    // Prompt Técnico e Completo
    const prompt = `
      Você é um Consultor Executivo de Elite com 20 anos de experiência.
      Gere um relatório JSON técnico e detalhado para este perfil baseado nos seguintes scores (0-100):
      ${JSON.stringify(transaction.scores)}
      
      O JSON deve seguir ESTRITAMENTE esta estrutura (não inclua markdown, apenas o JSON):
      {
        "archetype": "Um Título Criativo e Poderoso para o Arquétipo (ex: O Comandante Resiliente)",
        "summary": "Resumo executivo de 2 parágrafos sobre o perfil, focado em carreira e negócios.",
        "dimensions": [
          { "name": "Foco", "score": ${transaction.scores.Foco || 0}, "analysis": "Análise profunda e técnica de 2 frases sobre este pilar específico para este usuário." },
          { "name": "Adaptabilidade", "score": ${transaction.scores.Adaptabilidade || 0}, "analysis": "Análise profunda e técnica..." },
          { "name": "Inovacao", "score": ${transaction.scores.Inovacao || 0}, "analysis": "Análise profunda e técnica..." },
          { "name": "Coragem", "score": ${transaction.scores.Coragem || 0}, "analysis": "Análise profunda e técnica..." },
          { "name": "InteligenciaSocial", "score": ${transaction.scores.InteligenciaSocial || 0}, "analysis": "Análise profunda e técnica..." }
        ],
        "blindSpot": "Identifique UM grande ponto cego comportamental que está impedindo o sucesso financeiro dessa pessoa.",
        "actionPlan": [
          "Ação prática e técnica número 1",
          "Ação prática e técnica número 2",
          "Ação prática e técnica número 3"
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const reportData = JSON.parse(response.text);
    
    // Salva no cache da transação
    transaction.fullReport = reportData;
    
    res.json(reportData);

  } catch (error) {
    console.error("Erro Full Report:", error);
    res.status(500).json({ message: "Erro ao gerar relatório completo." });
  }
});

// ROTA 4: WEBHOOK KIWIFY (Integração de Pagamento)
app.post('/api/kiwify-webhook', (req, res) => {
  const data = req.body;
  
  console.log("[WEBHOOK RECEBIDO]", data);

  // Tenta capturar o ID de várias formas possíveis que a Kiwify pode enviar
  // O mais importante é o 'aff_content' que vamos passar na URL de checkout no Frontend
  const transactionId = data.aff_content || (data.order && data.order.src) || data.src;
  const status = data.order_status; // ex: 'paid'

  console.log(`[WEBHOOK] Processando ID: ${transactionId} | Status: ${status}`);

  if (transactionId && transactions.has(transactionId)) {
    const t = transactions.get(transactionId);
    
    // Verifica se foi pago
    if (status === 'paid') {
      t.status = 'PAID';
      console.log(`>>> PAGAMENTO CONFIRMADO para transação ${transactionId} <<<`);
    }
  } else {
    console.warn("Transação não encontrada ou ID inválido.");
  }

  // Kiwify espera um 200 OK sempre
  res.status(200).send('OK');
});

// Rota de Teste para Simular Pagamento Manualmente (útil para desenvolvimento)
app.get('/api/simulate-pay/:id', (req, res) => {
  const { id } = req.params;
  if (transactions.has(id)) {
    transactions.get(id).status = 'PAID';
    res.send(`SUCESSO: Transação ${id} marcada como PAGA manualmente.`);
  } else {
    res.status(404).send("ID não encontrado.");
  }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
