import express from 'express';
import cors from 'cors';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 10000;

// --- CONFIGURAÇÃO DE CAMINHOS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURAÇÃO DA IA ---
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.warn("API_KEY do Google não encontrada. O serviço de IA ficará desabilitado.");
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

app.use(cors());
app.use(express.json());

// --- LOCALIZAR O FRONTEND ---
const searchPaths = [
  path.join(__dirname, '../client/dist'),
  path.join(process.cwd(), 'client/dist'),
  path.resolve('/opt/render/project/src/client/dist')
];

let clientDistPath = null;
for (const p of searchPaths) {
  if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
    clientDistPath = p;
    break;
  }
}

if (clientDistPath) {
  app.use(express.static(clientDistPath));
}

// --- BANCO DE DADOS EM MEMÓRIA ---
const transactions = new Map();

// --- LÓGICA DE ANÁLISE QUALITATIVA ---
const calculateScores = (answers, questions) => {
  if (!answers || typeof answers !== 'object' || !questions || !Array.isArray(questions)) {
    throw new Error("Dados de entrada inválidos para calculateScores.");
  }
  const scores = { Foco: 0, Adaptabilidade: 0, Inovacao: 0, Coragem: 0, InteligenciaSocial: 0 };
  const counts = { ...scores };
  const extremeBehaviors = [];
  for (const q of questions) {
    if (!q || !q.module || scores[q.module] === undefined) continue;
    const key = q.module;
    const val = answers[q.id];
    if (typeof val === 'number' && val >= 1 && val <= 5) {
      scores[key] += val;
      counts[key] += 1;
      if (val === 1) extremeBehaviors.push(q.text);
      else if (val === 5) extremeBehaviors.push(q.text);
    }
  }
  for (const key in scores) {
    if (counts[key] > 0) {
      scores[key] = Math.round((scores[key] / (counts[key] * 5)) * 100);
    }
  }
  return { scores, extremeBehaviors };
};

// --- ROTAS DA API ---

app.post('/api/quiz/submit', (req, res) => {
  try {
    const { answers, questions } = req.body;
    if (!answers || !questions) return res.status(400).json({ message: 'Dados inválidos' });
    const transactionId = uuidv4();
    
    transactions.set(transactionId, { 
        answers, 
        questions, 
        status: 'PENDING',
        createdAt: Date.now() 
    });
    console.log(`Nova transação criada e salva na memória: ${transactionId}`);
    res.status(201).json({ transactionId });
  } catch (e) {
    console.error("Erro em /api/quiz/submit:", e);
    res.status(500).json({ message: 'Erro interno ao processar quiz' });
  }
});

app.get('/api/payment-status/:transactionId', (req, res) => {
    const { transactionId } = req.params;
    const transaction = transactions.get(transactionId);

    if (transaction) {
        res.json({ status: transaction.status });
    } else {
        res.status(404).json({ status: 'NOT_FOUND' });
    }
});

app.get('/api/report/preview/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const t = transactions.get(transactionId);

    if (!t) return res.status(404).json({ message: "Sessão não encontrada." });
    if (!ai) return res.status(503).json({ message: "Serviço de IA indisponível." });

    const { scores, extremeBehaviors } = calculateScores(t.answers, t.questions);

    let strategyPrompt;
    if (extremeBehaviors.length > 0) {
        strategyPrompt = `2. CONECTE UMA OBSERVAÇÃO: Aponte que o comportamento do usuário em relação a '${extremeBehaviors[0]}' se alinha com seu score mais baixo. Descreva isso como uma 'área de alavancagem' chave para seu crescimento.`;
    } else {
        const lowestScore = Object.entries(scores).sort((a, b) => a[1] - b[1])[0];
        strategyPrompt = `2. DESTAQUE UMA OPORTUNIDADE: Aponte que seu score de ${lowestScore[1]} em '${lowestScore[0]}' representa a maior oportunidade de otimização em seu perfil, com impacto direto em seus resultados.`;
    }

    const prompt = `
        ATUE COMO: Um mentor de carreira de elite, escrevendo uma nota de capa para um dossiê executivo.
        SUA MISSÃO: Escrever um insight de 40-50 palavras. O texto deve ser intrigante e mostrar que a análise é personalizada, criando o desejo de ler o relatório completo.
        ESTRATÉGIA:
        1. Inicie com uma validação: "Sua análise revelou um padrão comportamental claro..."
        ${strategyPrompt}
        3. CRIE CURIOSIDADE: Mencione que o dossiê contém o "Protocolo de Otimização de Performance" para transformar essa área de alavancagem em uma força.
        4. TOM DE VOZ: Estratégico, perspicaz, encorajador. Não use markdown ou aspas.
    `;

    // CORREÇÃO CRÍTICA: Adicionando as configurações de segurança para evitar o bloqueio.
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const response = await ai.models.generateContent({ 
        model: 'gemini-2.5-flash', 
        contents: prompt, 
        config: { temperature: 0.75 },
        safetySettings
    });
    
    if (!response.text) {
        throw new Error("A IA não retornou uma resposta, possivelmente devido a filtros de segurança do Google.");
    }
    
    res.json({ previewText: response.text.trim().replace(/[*#"]/g, '') });
  } catch (e) {
    console.error("Erro detalhado na geração da prévia:", e);
    // Tenta extrair uma mensagem mais clara do erro da API
    const errorMessage = e.response?.candidates?.[0]?.safetyRatings?.[0]?.category || e.message;
    res.status(500).json({ message: `Erro na IA. Causa: ${errorMessage}` });
  }
});


app.get('/api/report/full/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const t = transactions.get(transactionId);

    if (!t) {
        console.warn(`Tentativa de gerar relatório para T_ID não encontrado: ${transactionId}`);
        return res.status(404).json({ message: "Sessão não encontrada. Por favor, reinicie o processo se o pagamento foi concluído." });
    }
    
    if (t.status !== 'PAID') {
        console.warn(`Tentativa de acesso ao relatório completo para T_ID ${transactionId} com status ${t.status}`);
        return res.status(402).json({ message: "Pagamento não confirmado." });
    }

    if (t.fullReport) return res.json(t.fullReport);
    if (!ai) return res.status(503).json({ message: "IA indisponível" });

    const { scores, extremeBehaviors } = calculateScores(t.answers, t.questions);
    
    const prompt = `
      ATUE COMO: Um psicólogo organizacional e mentor de carreira de elite, especializado em análise comportamental DISC.
      CLIENTE: Um profissional buscando um relatório profundo e acionável. DADOS BRUTOS: Scores (0-100): ${JSON.stringify(scores)} e Comportamentos Extremos (Confissões): ${JSON.stringify(extremeBehaviors)}.
      TAREFA: Gere um relatório ESTRUTURADO em JSON, sem markdown, seguindo o schema abaixo. Seja profundo, técnico e persuasivo.
      SCHEMA JSON OBRIGATÓRIO: { "archetype": "Crie um nome de Padrão Comportamental Único e poderoso. Ex: 'O Estrategista Resoluto', 'O Arquiteto de Pessoas'.", "validation": { "methodology": "Análise Comportamental (DISC)", "reliabilityIndex": ${Math.floor(88 + Math.random() * 11)}, "confidentialityClause": "Este relatório é estritamente confidencial e gerado exclusivamente para o seu desenvolvimento pessoal e profissional." }, "pattern": { "name": "Use o mesmo nome do 'archetype'.", "formula": "F:${scores.Foco} A:${scores.Adaptabilidade} I:${scores.Inovacao} C:${scores.Coragem} S:${scores.InteligenciaSocial}" }, "summary": "Escreva um sumário executivo denso de 3 parágrafos. Parágrafo 1: Valide a identidade do usuário usando suas 'Confissões' e scores. Parágrafo 2: Aponte a dor oculta que ele não admite. Parágrafo 3: Pinte uma visão inspiradora do seu potencial máximo.", "actionFilter": { "speed": "${scores.Coragem > 60 ? 'Rápido' : 'Reflexivo'}", "focus": "${scores.InteligenciaSocial > 55 ? 'Pessoas' : 'Tarefas'}", "description": "Descreva como a combinação de velocidade e foco define o estilo de comunicação, decisão e resposta a conflitos do usuário." }, "coreDrivers": { "motivation": ["Liste 3 fatores intrínsecos que energizam este perfil."], "friction": ["Liste 3 fatores que drenam a energia deste perfil."], "idealEnvironment": "Descreva o ambiente de trabalho ideal que otimiza o desempenho, usando termos como 'Engenharia Comportamental'." }, "dimensions": [ {"name": "Foco", "score": ${scores.Foco}, "analysis": "Análise profunda de 3-4 frases sobre o impacto do nível de foco na produtividade e resultados financeiros."}, {"name": "Adaptabilidade", "score": ${scores.Adaptabilidade}, "analysis": "Análise profunda de 3-4 frases sobre como ele lida com crises e mudanças inesperadas."}, {"name": "Inovacao", "score": ${scores.Inovacao}, "analysis": "Análise profunda de 3-4 frases sobre a capacidade de criar ou otimizar."}, {"name": "Coragem", "score": ${scores.Coragem}, "analysis": "Análise profunda de 3-4 frases sobre a tolerância ao risco e a capacidade de tomar decisões difíceis."}, {"name": "InteligenciaSocial", "score": ${scores.InteligenciaSocial}, "analysis": "Análise profunda de 3-4 frases sobre como ele lidera, influencia ou manipula."} ], "subFactors": [ {"name": "Nível de Detalhismo", "analysis": "Baseado nos scores de Foco e Adaptabilidade, analise em 2-3 frases se o usuário é orientado a detalhes ou ao quadro geral."}, {"name": "Tolerância ao Risco", "analysis": "Baseado nos scores de Coragem e Inovacao, analise em 2-3 frases a propensão do usuário a tomar riscos calculados."}, {"name": "Estilo de Liderança", "analysis": "Baseado no score de InteligenciaSocial, descreva em 2-3 frases se a liderança é mais diretiva, mentora ou inspiradora."} ], "blindSpot": { "title": "O Custo Oculto da sua Genialidade", "description": "Baseado na pontuação mais baixa ou em uma 'Confissão' crítica, descreva o Ponto Cego Fatal. Uma frase longa e impactante que resume o maior risco comportamental dele." }, "actionPlan": [ {"action": "Ação prática e imediata para amanhã.", "rationale": "O porquê técnico desta ação.", "expectedBenefit": "O Retorno Sobre o Investimento (ROI) comportamental esperado."}, {"action": "Uma mudança de hábito mental a ser cultivada.", "rationale": "O porquê técnico desta ação.", "expectedBenefit": "O Retorno Sobre o Investimento (ROI) comportamental esperado."}, {"action": "Um desafio de desconforto para evoluir.", "rationale": "O porquê técnico desta ação.", "expectedBenefit": "O Retorno Sobre o Investimento (ROI) comportamental esperado."}, {"action": "Uma estratégia de longo prazo.", "rationale": "O porquê técnico desta ação.", "expectedBenefit": "O Retorno Sobre o Investimento (ROI) comportamental esperado."} ] }
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
    const data = JSON.parse(response.text);
    t.fullReport = data;
    res.json(data);
  } catch (e) {
    console.error("Erro ao gerar relatório completo:", e);
    res.status(500).json({ message: 'Erro na IA ao gerar relatório.' });
  }
});

app.post('/api/kiwify-webhook', (req, res) => {
  const d = req.body;
  const tid = d.aff_content || (d.order && d.order.src);
  
  if (tid && transactions.has(tid)) {
      if(d.order_status === 'paid') {
        console.log(`Webhook confirmou PAGAMENTO para a transação: ${tid}`);
        const transaction = transactions.get(tid);
        transaction.status = 'PAID';
      }
  } else {
    console.log(`Webhook recebido para T_ID desconhecido: ${tid}`);
  }
  res.send('OK');
});

app.get('*', (req, res) => {
  if (clientDistPath) {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  } else {
    res.status(500).send("Erro Config: Frontend não encontrado.");
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));
