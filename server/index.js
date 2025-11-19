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

// --- LOCALIZAR O FRONTEND (BLINDAGEM) ---
// O Render pode rodar o script de lugares diferentes. Vamos procurar a pasta 'dist' em vários níveis.
const searchPaths = [
  path.join(__dirname, '../client/dist'),        // Estrutura padrão local
  path.join(__dirname, '../../client/dist'),     // Estrutura possível no container
  path.join(process.cwd(), 'client/dist'),       // Baseado no comando de execução
  path.join(process.cwd(), 'dist'),              // Baseado na raiz
  path.resolve('/opt/render/project/src/client/dist') // Caminho absoluto padrão do Render
];

let clientDistPath = null;

console.log("--- DIAGNÓSTICO DE INICIALIZAÇÃO ---");
console.log("Diretório atual (__dirname):", __dirname);
console.log("Diretório de execução (cwd):", process.cwd());

for (const p of searchPaths) {
  console.log(`Procurando frontend em: ${p}`);
  if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
    clientDistPath = p;
    console.log(`✅ SUCESSO: Frontend encontrado em: ${p}`);
    break;
  }
}

if (clientDistPath) {
  // Serve os arquivos estáticos (JS, CSS, Imagens)
  app.use(express.static(clientDistPath));
} else {
  console.error("❌ ERRO CRÍTICO: Pasta 'dist' não encontrada em nenhum lugar!");
}

// --- ROTAS DA API (MANTIDAS) ---
// (Seus códigos de API continuam funcionando aqui)

// BANCO DE DADOS EM MEMÓRIA
const transactions = new Map();

// LÓGICA AUXILIAR
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

app.post('/api/report/preview', async (req, res) => {
  try {
    const { transactionId } = req.body;
    const t = transactions.get(transactionId);
    if (!t) return res.status(404).json({ message: "Sessão não encontrada" });
    
    if (!ai) return res.json({ previewText: "Seu perfil indica um potencial executivo alto, mas há uma trava emocional custando oportunidades." });

    const prompt = `Analise este perfil (0-100): ${JSON.stringify(t.scores)}. Escreva um gancho curto e misterioso de 30 palavras para venda.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    res.json({ previewText: response.text.trim() });
  } catch (e) { console.error(e); res.status(500).json({message: 'Erro IA'}); }
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

// --- ROTA "PEGA TUDO" (ESSENCIAL PARA O SITE ABRIR) ---
app.get('*', (req, res) => {
  if (clientDistPath) {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  } else {
    // Se não achou a pasta, mostra um erro descritivo na tela em vez de "Cannot GET /"
    res.status(500).send(`
      <h1>Erro de Configuração no Servidor</h1>
      <p>O servidor iniciou, mas não encontrou os arquivos do site (Frontend).</p>
      <p>Verifique os logs do Render para ver onde ele procurou.</p>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));
