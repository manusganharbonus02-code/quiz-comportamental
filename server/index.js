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

// --- LÓGICA DE ANÁLISE QUALITATIVA ---
// Agora capturamos OS DETALHES das respostas, não só os números.
const calculateScores = (answers, questions) => {
  const scores = { Foco: 0, Adaptabilidade: 0, Inovacao: 0, Coragem: 0, InteligenciaSocial: 0 };
  const counts = { ...scores };
  
  // Lista de comportamentos extremos para a IA usar na persuasão
  let extremeBehaviors = [];

  questions.forEach(q => {
    const val = answers[q.id] || 0;
    let key = q.module === 'Inovação' ? 'Inovacao' : (q.module === 'InteligênciaSocial' ? 'InteligenciaSocial' : q.module);
    
    if (scores[key] !== undefined) { 
      scores[key] += val; 
      counts[key] += 1; 
      
      // Se o usuário foi extremo (1 ou 5), guardamos isso para "jogar na cara" dele depois
      if (val === 1) {
        extremeBehaviors.push(`O usuário admite que NÃO consegue: "${q.text}"`);
      } else if (val === 5) {
        extremeBehaviors.push(`O usuário afirma com certeza que: "${q.text}"`);
      }
    }
  });

  Object.keys(scores).forEach(k => { if (counts[k] > 0) scores[k] = Math.round((scores[k] / (counts[k] * 5)) * 100); });
  
  return { scores, extremeBehaviors };
};

// --- ROTAS DA API ---

app.post('/api/quiz/submit', (req, res) => {
  try {
    const { answers, questions } = req.body;
    if(!answers) return res.status(400).json({message: 'Dados inválidos'});
    const transactionId = uuidv4();
    
    // Calcula scores E comportamentos
    const { scores, extremeBehaviors } = calculateScores(answers, questions);
    
    transactions.set(transactionId, { 
      answers, 
      questions, 
      scores, 
      extremeBehaviors, // Salvamos isso para usar no prompt
      status: 'PENDING', 
      createdAt: new Date() 
    });
    res.status(201).json({ transactionId });
  } catch (e) { console.error(e); res.status(500).json({message: 'Erro interno'}); }
});

// --- PRÉVIA: GANCHO HIPER-PERSONALIZADO ---
app.post('/api/report/preview', async (req, res) => {
  try {
    const { transactionId } = req.body;
    const t = transactions.get(transactionId);
    if (!t) return res.status(404).json({ message: "Sessão não encontrada" });
    
    if (!ai) return res.json({ previewText: "Seu perfil indica um potencial executivo alto, mas há uma trava emocional custando oportunidades." });

    // PROMPT ATUALIZADO: Usa as respostas específicas
    const prompt = `
      ATUE COMO: Especialista em Leitura Fria (Cold Reading) e Persuasão.
      
      DADOS DO USUÁRIO:
      - Scores Gerais: ${JSON.stringify(t.scores)}
      - CONFISSÕES DO USUÁRIO (Use isso para ser específico):
      ${t.extremeBehaviors.slice(0, 5).join('\n')}
      
      SUA MISSÃO: Escrever um gancho de venda de 40 palavras.
      
      ESTRATÉGIA:
      1. Pegue uma "Confissão" dele e valide (ex: "Você disse que odeia rotina...").
      2. Conecte isso a um problema invisível (ex: "...isso explica sua instabilidade financeira").
      3. Crie mistério.
      4. NÃO USE MARKDOWN. Texto puro.
      
      Tom de voz: Dominante, Misterioso, Revelador.
    `;

    const response = await ai.models.generateContent({ 
      model: 'gemini-2.5-flash', 
      contents: prompt,
      config: { temperature: 0.7, maxOutputTokens: 150 } 
    });
    
    let cleanText = response.text.trim().replace(/[*#]/g, '');
    if (cleanText.startsWith('"') && cleanText.endsWith('"')) cleanText = cleanText.slice(1, -1);

    res.json({ previewText: cleanText });

  } catch (e) { console.error(e); res.status(500).json({message: 'Erro IA'}); }
});

// --- RELATÓRIO FINAL: O DOSSIÊ COMPLETO ---
app.get('/api/report/full/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const t = transactions.get(transactionId);
    if (!t) return res.status(404).json({ message: "Não encontrado" });

    if (t.fullReport) return res.json(t.fullReport);

    if (!ai) return res.json({ archetype: "Mock", summary: "Mock", dimensions: [], blindSpot: "Mock", actionPlan: [] });

    // PROMPT MASSIVO PARA RELATÓRIO DETALHADO
    const prompt = `
      ATUE COMO: O Maior Mentor de Carreira e Psicólogo Comportamental do Mundo.
      CLIENTE: Alguém buscando a verdade brutal para evoluir.
      
      DADOS TÉCNICOS:
      - Scores: ${JSON.stringify(t.scores)}
      - Comportamentos Específicos: ${JSON.stringify(t.extremeBehaviors)}

      GERE UM JSON ESTRUTURADO E RICO (Sem Markdown, apenas JSON puro):
      {
        "archetype": "Crie um nome de Arquétipo Único e Poderoso (ex: O Construtor de Impérios, O Estrategista Cauteloso)",
        "summary": "Escreva 3 parágrafos densos. Parágrafo 1: Valide quem ele é usando as respostas dele ('Você sente que...'). Parágrafo 2: Aponte a dor oculta que ele não admite. Parágrafo 3: A visão de quem ele pode se tornar.",
        "dimensions": [
          { 
            "name": "Foco", 
            "score": ${t.scores.Foco}, 
            "analysis": "Análise profunda de 3-4 frases. Explique o impacto disso na conta bancária e na felicidade dele." 
          },
          { 
            "name": "Adaptabilidade", 
            "score": ${t.scores.Adaptabilidade}, 
            "analysis": "Análise profunda de 3-4 frases. Como ele lida com crises?" 
          },
          { 
            "name": "Inovação", 
            "score": ${t.scores.Inovacao}, 
            "analysis": "Análise profunda de 3-4 frases. Ele cria ou apenas segue?" 
          },
          { 
            "name": "Coragem", 
            "score": ${t.scores.Coragem}, 
            "analysis": "Análise profunda de 3-4 frases. O medo está travando ele?" 
          },
          { 
            "name": "Inteligência Social", 
            "score": ${t.scores.InteligenciaSocial}, 
            "analysis": "Análise profunda de 3-4 frases. Ele lidera ou manipula?" 
          }
        ],
        "blindSpot": "O Ponto Cego Fatal. Uma frase longa e impactante que resume o maior defeito dele.",
        "actionPlan": [
          "Passo 1: Uma ação prática e imediata para amanhã.",
          "Passo 2: Uma mudança de hábito mental.",
          "Passo 3: Um desafio de desconforto para evoluir.",
          "Passo 4: Uma estratégia de longo prazo."
        ]
      }
    `;

    const response = await ai.models.generateContent({ 
      model: 'gemini-2.5-flash', 
      contents: prompt, 
      config: { responseMimeType: 'application/json' } 
    });
    
    const data = JSON.parse(response.text);
    t.fullReport = data;
    res.json(data);

  } catch (e) { console.error(e); res.status(500).json({message: 'Erro IA'}); }
});

// WEBHOOKS E ROTAS PADRÃO
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
