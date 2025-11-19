import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
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
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

app.use(cors());
app.use(express.json());

// --- LOCALIZAR O FRONTEND ---
const searchPaths = [
  path.join(__dirname, '../client/dist'),
  path.join(__dirname, '../../client/dist'),
  path.join(process.cwd(), 'client/dist'),
  path.join(process.cwd(), 'dist'),
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

// BANCO DE DADOS EM MEMÓRIA
const transactions = new Map();

// LÓGICA AUXILIAR DE SCORE
const calculateScores = (answers, questions) => {
  const scores = { Foco: 0, Adaptabilidade: 0, Inovacao: 0, Coragem: 0, InteligenciaSocial: 0 };
  const counts = { ...scores };
  questions.forEach(q => {
    const val = answers[q.id] || 0;
    let key = q.module === 'Inovação' ? 'Inovacao' : (q.module === 'InteligênciaSocial' ? 'InteligenciaSocial' : q.module);
    if (scores[key] !== undefined) { scores[key] += val; counts[key] += 1; }
  });
  Object.keys(scores).forEach(k => { if (counts[k] > 0) scores[k] = Math.round((scores[k] / (counts[k] * 5)) * 100); });
  return scores;
};

// --- ROTAS DA API ---

app.post('/api/quiz/submit', (req, res) => {
  try {
    const { answers, questions } = req.body;
    if(!answers) return res.status(400).json({message: 'Dados inválidos'});
    const transactionId = uuidv4();
    const scores = calculateScores(answers, questions);
    transactions.set(transactionId, { answers, questions, scores, status: 'PENDING', createdAt: new Date() });
    res.status(201).json({ transactionId });
  } catch (e) { console.error(e); res.status(500).json({message: 'Erro interno'}); }
});

// --- CORREÇÃO AQUI: Prompt Blindado para a Prévia ---
app.post('/api/report/preview', async (req, res) => {
  try {
    const { transactionId } = req.body;
    const t = transactions.get(transactionId);
    if (!t) return res.status(404).json({ message: "Sessão não encontrada" });
    
    if (!ai) return res.json({ previewText: "Seu perfil indica um potencial executivo alto, mas há uma trava emocional custando oportunidades." });

    // PROMPT MUITO MAIS RÍGIDO PARA EVITAR TEXTÃO
    const prompt = `
      ATUE COMO: Copywriter especialista em persuasão e vendas.
      DADOS DO USUÁRIO (0-100): ${JSON.stringify(t.scores)}
      
      SUA MISSÃO: Escrever APENAS UM parágrafo curto (máximo 35 palavras) para a tela de pré-venda.
      
      REGRAS OBRIGATÓRIAS:
      1. NÃO use Markdown, NÃO use negrito (**), NÃO use títulos (##). Apenas texto puro.
      2. NÃO mostre as notas numéricas.
      3. NÃO faça uma análise técnica.
      4. O texto deve ter um tom de MISTÉRIO e ALERTA.
      5. Estrutura: Elogie o ponto forte -> Diga que existe um "Ponto Cego" perigoso -> Convide para ver a solução.
      
      Exemplo de resposta perfeita:
      "Sua capacidade de Foco é impressionante e rara. Porém, detectamos um padrão de comportamento rígido que está limitando seu crescimento financeiro. O relatório completo revela exatamente qual hábito você precisa eliminar hoje."
    `;

    const response = await ai.models.generateContent({ 
      model: 'gemini-2.5-flash', 
      contents: prompt,
      config: { 
        temperature: 0.6, // Temperatura menor para ser mais obediente
        maxOutputTokens: 100 // Corta se tentar escrever muito
      } 
    });
    
    // Limpeza extra caso a IA desobedeça e mande aspas ou quebras de linha
    let cleanText = response.text.trim().replace(/[*#]/g, ''); // Remove * e #
    if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
      cleanText = cleanText.slice(1, -1);
    }

    res.json({ previewText: cleanText });

  } catch (e) { 
    console.error(e); 
    // Fallback em caso de erro na IA
    res.json({ previewText: "Identificamos um perfil de alta performance, mas um ponto cego específico está drenando sua energia e resultados. Desbloqueie para entender como corrigir isso." });
  }
});

app.get('/api/report/full/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const t = transactions.get(transactionId);
    if (!t) return res.status(404).json({ message: "Não encontrado" });

    // if (t.status !== 'PAID') return res.status(403).json({ message: 'PAYMENT_REQUIRED' });

    if (t.fullReport) return res.json(t.fullReport);

    if (!ai) return res.json({ archetype: "Mock", summary: "Mock", dimensions: [], blindSpot: "Mock", actionPlan: [] });

    const prompt = `Gere JSON detalhado para: ${JSON.stringify(t.scores)}. Schema: archetype, summary, dimensions(name, score, analysis), blindSpot, actionPlan.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
    const data = JSON.parse(response.text);
    t.fullReport = data;
    res.json(data);
  } catch (e) { console.error(e); res.status(500).json({message: 'Erro IA'}); }
});

app.post('/api/kiwify-webhook', (req, res) => {
  const d = req.body;
  const tid = d.aff_content || (d.order && d.order.src);
  if (tid && transactions.has(tid) && d.order_status === 'paid') transactions.get(tid).status = 'PAID';
  res.send('OK');
});

app.get('/api/simulate-pay/:id', (req, res) => {
  const { id } = req.params;
  if (transactions.has(id)) { transactions.get(id).status = 'PAID'; res.send('Pago'); } 
  else res.status(404).send('404');
});

app.get('*', (req, res) => {
  if (clientDistPath) {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  } else {
    res.status(500).send("Erro Config: Frontend não encontrado.");
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));
