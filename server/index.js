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
  
  // Para análise qualitativa no prompt
  let qualitativeSummary = [];

  questions.forEach(q => {
    const val = answers[q.id] || 0;
    let key = q.module === 'Inovação' ? 'Inovacao' : (q.module === 'InteligênciaSocial' ? 'InteligenciaSocial' : q.module);
    
    if (scores[key] !== undefined) { 
      scores[key] += val; 
      counts[key] += 1; 
      // Guarda respostas extremas (1 ou 5) para a IA personalizar
      if (val === 1 || val === 5) {
        qualitativeSummary.push(`Item "${q.text}" -> Resposta: ${val}/5`);
      }
    }
  });

  Object.keys(scores).forEach(k => { if (counts[k] > 0) scores[k] = Math.round((scores[k] / (counts[k] * 5)) * 100); });
  return { scores, qualitativeSummary };
};

// --- ROTAS DA API ---

app.post('/api/quiz/submit', (req, res) => {
  try {
    const { answers, questions } = req.body;
    if(!answers) return res.status(400).json({message: 'Dados inválidos'});
    const transactionId = uuidv4();
    const { scores, qualitativeSummary } = calculateScores(answers, questions);
    
    transactions.set(transactionId, { 
      answers, 
      questions, 
      scores, 
      qualitativeSummary,
      status: 'PENDING', 
      createdAt: new Date() 
    });
    res.status(201).json({ transactionId });
  } catch (e) { console.error(e); res.status(500).json({message: 'Erro interno'}); }
});

// --- PRÉVIA PERSUASIVA (HOOK HIPER-PERSONALIZADO) ---
app.post('/api/report/preview', async (req, res) => {
  try {
    const { transactionId } = req.body;
    const t = transactions.get(transactionId);
    if (!t) return res.status(404).json({ message: "Sessão não encontrada" });
    
    if (!ai) return res.json({ previewText: "Seu perfil revela um potencial executivo raro, mas detectamos um padrão de autossabotagem invisível ligado à sua adaptabilidade que pode estar custando oportunidades." });

    const prompt = `
      ATUE COMO: Especialista em Profiling Comportamental e Copywriting de Elite.
      
      DADOS DO USUÁRIO:
      - Scores (0-100): ${JSON.stringify(t.scores)}
      - Comportamentos Extremos (As respostas mais fortes dele): 
      ${t.qualitativeSummary.slice(0, 5).join('\n')}
      
      MISSÃO: Escrever APENAS UM parágrafo de ALTO IMPACTO (máx 40 palavras) para vender o relatório completo.
      
      REGRAS DE OURO:
      1. Use os "Comportamentos Extremos" para provar que você leu a mente dele. Seja específico!
      2. Crie uma TENSÃO imediata: Mostre que a maior força dele está gerando um efeito colateral perigoso (O Ponto Cego).
      3. NÃO use markdown, asteriscos ou formatação. Apenas texto corrido.
      4. Termine com um convite irrecusável.
      
      Exemplo do Tom: "Você disse que define prioridades claras, mas sua baixa pontuação em inovação sugere que você está apenas otimizando o passado, não criando o futuro. Descubra o que você está deixando na mesa agora."
    `;

    const response = await ai.models.generateContent({ 
      model: 'gemini-2.5-flash', 
      contents: prompt,
      config: { 
        temperature: 0.8, 
        maxOutputTokens: 150 
      } 
    });
    
    let cleanText = response.text.trim().replace(/[*#]/g, '');
    if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
      cleanText = cleanText.slice(1, -1);
    }

    res.json({ previewText: cleanText });

  } catch (e) { console.error(e); res.status(500).json({message: 'Erro IA'}); }
});

// --- RELATÓRIO COMPLETO (A ENTREGA MASSIVA) ---
app.get('/api/report/full/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const t = transactions.get(transactionId);
    if (!t) return res.status(404).json({ message: "Não encontrado" });

    // if (t.status !== 'PAID') return res.status(403).json({ message: 'PAYMENT_REQUIRED' });

    if (t.fullReport) return res.json(t.fullReport);

    // Mock para testes sem IA
    if (!ai) return res.json({ 
        archetype: "Estrategista Bloqueado", 
        summary: "Texto mock...", 
        dimensions: [], 
        blindSpot: "Mock", 
        actionPlan: [] 
    });

    const prompt = `
      ATUE COMO: O Maior Consultor de Carreira e Psicologia Executiva do Mundo.
      CONTEXTO: O usuário pagou por uma análise profunda e transformadora. Ele quer a "Verdade Nua e Crua".
      
      PERFIL DO USUÁRIO:
      - Scores: ${JSON.stringify(t.scores)}
      - Respostas Chave: ${JSON.stringify(t.qualitativeSummary)}

      GERE UM JSON COM ESTA ESTRUTURA EXATA (Seja denso, rico e persuasivo):
      {
        "archetype": "Um Título de Arquétipo Poderoso e Único (Ex: O Visionário Solitário, O Executor Implacável)",
        "summary": "Uma análise psicológica profunda de 3 parágrafos. O primeiro valida o ego dele (forças). O segundo destrói as ilusões (fraquezas ocultas). O terceiro mostra a visão de futuro se ele corrigir isso. Use linguagem 'Cold Reading' (ex: 'Você sente que muitas vezes carrega a equipe nas costas...').",
        "dimensions": [
          { 
            "name": "Nome da Dimensão (ex: Foco)", 
            "score": (número do score), 
            "analysis": "Um parágrafo denso explicando não só a nota, mas COMO isso se manifesta no dia a dia dele e qual o impacto financeiro/emocional." 
          }
          // ... repetir para as 5 dimensões
        ],
        "blindSpot": "O Insight Matador. Uma verdade dura que ele provavelmente nega, mas que é a raiz dos problemas dele. Escreva de forma direta e impactante.",
        "actionPlan": [
          "Ação 1: Algo prático, técnico e imediato para fazer amanhã.",
          "Ação 2: Uma mudança de mindset ou rotina baseada em neurociência/produtividade.",
          "Ação 3: Um desafio comportamental para a próxima semana.",
          "Ação 4: Uma ferramenta ou técnica específica para usar."
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
