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

// --- LÓGICA DE ANÁLISE QUALITATIVA (VERSÃO FINAL ROBUSTA) ---
const calculateScores = (answers, questions) => {
  if (!answers || typeof answers !== 'object' || !questions || !Array.isArray(questions)) {
    console.error('[calculateScores] Dados de entrada inválidos.');
    throw new Error("Dados de entrada inválidos para calculateScores.");
  }

  const scores = { Foco: 0, Adaptabilidade: 0, Inovacao: 0, Coragem: 0, InteligenciaSocial: 0 };
  const counts = { Foco: 0, Adaptabilidade: 0, Inovacao: 0, Coragem: 0, InteligenciaSocial: 0 };
  const extremeBehaviors = [];

  for (const q of questions) {
    if (!q || typeof q.id === 'undefined' || typeof q.module !== 'string') {
      continue;
    }

    const key = q.module;
    
    if (Object.prototype.hasOwnProperty.call(scores, key)) {
      const val = answers[q.id];

      if (typeof val === 'number' && val >= 1 && val <= 5) {
        scores[key] += val;
        counts[key] += 1;

        if (val === 1) {
          extremeBehaviors.push(`admite que não consegue: "${q.text}"`);
        } else if (val === 5) {
          extremeBehaviors.push(`afirma com certeza que: "${q.text}"`);
        }
      }
    }
  }

  for (const key in scores) {
    if (Object.prototype.hasOwnProperty.call(scores, key)) {
        if (counts[key] > 0) {
          const maxScoreForModule = counts[key] * 5;
          scores[key] = Math.round((scores[key] / maxScoreForModule) * 100);
        }
    }
  }

  return { scores, extremeBehaviors };
};


// --- ROTAS DA API ---
app.post('/api/quiz/submit', (req, res) => {
  try {
    const { answers, questions } = req.body;
    if (!answers || !questions) {
      return res.status(400).json({ message: 'Dados inválidos' });
    }
    const transactionId = uuidv4();
    const { scores, extremeBehaviors } = calculateScores(answers, questions);

    transactions.set(transactionId, {
      answers,
      questions,
      scores,
      extremeBehaviors,
      status: 'PENDING',
      createdAt: new Date()
    });
    res.status(201).json({ transactionId });
  } catch (e) {
    console.error("Erro em /api/quiz/submit:", e);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
});

app.post('/api/report/preview', async (req, res) => {
    try {
        const { transactionId } = req.body;
        const t = transactions.get(transactionId);
        if (!t) return res.status(404).json({ message: "Sessão não encontrada" });

        if (!ai) return res.json({ previewText: "Seu perfil indica um potencial executivo extremamente alto, mas existe uma barreira invisível em sua tomada de decisão que está custando oportunidades financeiras." });

        const prompt = `
            ATUE COMO: Um psicólogo organizacional de elite, finalizando um Dossiê Comportamental.
            SUA MISSÃO: Escrever uma nota de capa (40-50 palavras) para o cliente. A nota deve ser um gancho de venda poderoso, dando uma amostra real e específica do relatório, criando urgência para a leitura completa.

            DADOS DO CLIENTE:
            - Scores: ${JSON.stringify(t.scores)}
            - Confissões (respostas extremas): ${JSON.stringify(t.extremeBehaviors)}

            ESTRATÉGIA:
            1. Inicie com uma validação forte. Ex: "Após analisar suas respostas, um padrão se destacou..."
            2. Cite DIRETAMENTE uma das 'Confissões' do usuário e conecte-a ao seu score MAIS BAIXO. Ex: "Sua admissão de que '[Confissão]' está diretamente ligada ao seu score de X em [Dimensão], e isso tem um custo financeiro que talvez você não tenha calculado."
            3. Crie um mistério sobre a solução que está no relatório completo. Ex: "No dossiê, detalhamos o 'Protocolo de Refatoração Comportamental' para reverter exatamente isso."
            4. Tom de voz: Clínico, direto, revelador e levemente provocador. Não use markdown.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.7, maxOutputTokens: 150 }
        });
        
        let cleanText = response.text.trim().replace(/[*#"]/g, '');

        res.json({ previewText: cleanText });
    } catch (e) {
        console.error("Erro na geração da prévia:", e);
        res.status(500).json({ message: 'Erro na IA ao gerar prévia' });
    }
});

app.get('/api/report/full/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const t = transactions.get(transactionId);
    if (!t) return res.status(404).json({ message: "Não encontrado" });
    if (t.fullReport) return res.json(t.fullReport);
    if (!ai) return res.status(503).json({ message: "IA indisponível" });

    const prompt = `
      ATUE COMO: Um psicólogo organizacional e mentor de carreira de elite, especializado em análise comportamental DISC.
      CLIENTE: Um profissional buscando um relatório profundo e acionável.
      DADOS BRUTOS:
      - Scores (0-100): ${JSON.stringify(t.scores)}
      - Comportamentos Extremos (Confissões): ${JSON.stringify(t.extremeBehaviors)}

      TAREFA: Gere um relatório ESTRUTURADO em JSON, sem markdown, seguindo o schema abaixo. Seja profundo, técnico e persuasivo.

      SCHEMA JSON OBRIGATÓRIO:
      {
        "archetype": "Crie um nome de Padrão Comportamental Único e poderoso. Ex: 'O Estrategista Resoluto', 'O Arquiteto de Pessoas'.",
        "validation": {
          "methodology": "Análise Comportamental (DISC)",
          "reliabilityIndex": ${Math.floor(88 + Math.random() * 11)},
          "confidentialityClause": "Este relatório é estritamente confidencial e gerado exclusivamente para o seu desenvolvimento pessoal e profissional."
        },
        "pattern": {
          "name": "Use o mesmo nome do 'archetype'.",
          "formula": "F:${t.scores.Foco} A:${t.scores.Adaptabilidade} I:${t.scores.Inovacao} C:${t.scores.Coragem} S:${t.scores.InteligenciaSocial}"
        },
        "summary": "Escreva um sumário executivo denso de 3 parágrafos. Parágrafo 1: Valide a identidade do usuário usando suas 'Confissões' e scores. Parágrafo 2: Aponte a dor oculta que ele não admite. Parágrafo 3: Pinte uma visão inspiradora do seu potencial máximo.",
        "actionFilter": {
          "speed": "${t.scores.Coragem > 60 ? 'Rápido' : 'Reflexivo'}",
          "focus": "${t.scores.InteligenciaSocial > 55 ? 'Pessoas' : 'Tarefas'}",
          "description": "Descreva como a combinação de velocidade e foco define o estilo de comunicação, decisão e resposta a conflitos do usuário."
        },
        "coreDrivers": {
          "motivation": ["Liste 3 fatores intrínsecos que energizam este perfil."],
          "friction": ["Liste 3 fatores que drenam a energia deste perfil."],
          "idealEnvironment": "Descreva o ambiente de trabalho ideal que otimiza o desempenho, usando termos como 'Engenharia Comportamental'."
        },
        "dimensions": [
          {"name": "Foco", "score": ${t.scores.Foco}, "analysis": "Análise profunda de 3-4 frases sobre o impacto do nível de foco na produtividade e resultados financeiros."},
          {"name": "Adaptabilidade", "score": ${t.scores.Adaptabilidade}, "analysis": "Análise profunda de 3-4 frases sobre como ele lida com crises e mudanças inesperadas."},
          {"name": "Inovacao", "score": ${t.scores.Inovacao}, "analysis": "Análise profunda de 3-4 frases sobre a capacidade de criar ou otimizar."},
          {"name": "Coragem", "score": ${t.scores.Coragem}, "analysis": "Análise profunda de 3-4 frases sobre a tolerância ao risco e a capacidade de tomar decisões difíceis."},
          {"name": "InteligenciaSocial", "score": ${t.scores.InteligenciaSocial}, "analysis": "Análise profunda de 3-4 frases sobre como ele lidera, influencia ou manipula."}
        ],
        "blindSpot": {
          "title": "O Custo Oculto da sua Genialidade",
          "description": "Baseado na pontuação mais baixa ou em uma 'Confissão' crítica, descreva o Ponto Cego Fatal. Uma frase longa e impactante que resume o maior risco comportamental dele."
        },
        "actionPlan": [
          {"action": "Ação prática e imediata para amanhã.", "rationale": "O porquê técnico desta ação.", "expectedBenefit": "O Retorno Sobre o Investimento (ROI) comportamental esperado."},
          {"action": "Uma mudança de hábito mental a ser cultivada.", "rationale": "O porquê técnico desta ação.", "expectedBenefit": "O Retorno Sobre o Investimento (ROI) comportamental esperado."},
          {"action": "Um desafio de desconforto para evoluir.", "rationale": "O porquê técnico desta ação.", "expectedBenefit": "O Retorno Sobre o Investimento (ROI) comportamental esperado."},
          {"action": "Uma estratégia de longo prazo.", "rationale": "O porquê técnico desta ação.", "expectedBenefit": "O Retorno Sobre o Investimento (ROI) comportamental esperado."}
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
  } catch (e) {
    console.error("Erro ao gerar relatório completo:", e);
    res.status(500).json({ message: 'Erro IA' });
  }
});

// --- WEBHOOKS E ROTAS PADRÃO ---
app.post('/api/kiwify-webhook', (req, res) => {
  const d = req.body;
  const tid = d.aff_content || (d.order && d.order.src);
  if (tid && transactions.has(tid) && d.order_status === 'paid') {
    transactions.get(tid).status = 'PAID';
  }
  res.send('OK');
});

// Rota de fallback para servir o index.html do React
app.get('*', (req, res) => {
  if (clientDistPath) {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  } else {
    res.status(500).send("Erro Config: Frontend não encontrado.");
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));
