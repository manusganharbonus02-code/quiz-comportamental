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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.warn("API_KEY do Google não encontrada. O serviço de IA ficará desabilitado.");
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

app.use(cors());
app.use(express.json());

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

const transactions = new Map();

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
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.75 } });
    
    if (!response.text) {
        throw new Error("A IA não retornou uma resposta.");
    }
    
    res.json({ previewText: response.text.trim() });
  } catch (e) {
    console.error("Erro na geração da prévia:", e);
    res.status(500).json({ message: `Erro na IA. Causa: ${e.message}` });
  }
});

app.get('/api/report/full/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const t = transactions.get(transactionId);

    if (!t) {
        return res.status(404).json({ message: "Sessão não encontrada. Por favor, reinicie o processo se o pagamento foi concluído." });
    }
    
    if (t.status !== 'PAID') {
        return res.status(402).json({ message: "Pagamento não confirmado." });
    }

    if (t.fullReport) return res.json(t.fullReport);
    if (!ai) return res.status(503).json({ message: "IA indisponível" });

    const { scores, extremeBehaviors } = calculateScores(t.answers, t.questions);
    
    const prompt = `
      ATUE COMO: Um psicólogo organizacional e mentor de carreira de elite... (o resto do prompt permanece o mesmo)
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

// A rota da Kiwify permanece, caso você queira voltar a usá-la no futuro.
app.post('/api/kiwify-webhook', (req, res) => {
  const d = req.body;
  const tid = d.aff_content;
  
  if (tid && transactions.has(tid)) {
      if(d.order_status === 'paid') {
        console.log(`Webhook da KIWIFY confirmou PAGAMENTO para a transação: ${tid}`);
        const transaction = transactions.get(tid);
        transaction.status = 'PAID';
      }
  }
  res.send('OK');
});

// ATUALIZADO: Nova rota para o webhook da Hotmart
app.post('/api/hotmart-webhook', (req, res) => {
  const d = req.body;
  // ATUALIZADO: A Hotmart envia o ID que passamos no parâmetro 'src'
  const tid = d.src; 
  
  if (tid && transactions.has(tid)) {
      // ATUALIZADO: O status de compra aprovada da Hotmart é 'approved'
      if(d.status === 'approved') {
        console.log(`Webhook da HOTMART confirmou PAGAMENTO para a transação: ${tid}`);
        const transaction = transactions.get(tid);
        transaction.status = 'PAID';
      }
  } else {
    console.log(`Webhook da Hotmart recebido para T_ID desconhecido: ${tid}`);
  }
  // A Hotmart exige uma resposta 200 para confirmar o recebimento
  res.status(200).send('OK');
});


app.get('*', (req, res) => {
  if (clientDistPath) {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  } else {
    res.status(500).send("Erro Config: Frontend não encontrado.");
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));
