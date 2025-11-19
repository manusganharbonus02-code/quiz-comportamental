import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import { calculateScores } from './quizLogic.js';

// --- VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE ---
if (!process.env.API_KEY) {
  console.error("ERRO FATAL: A variável de ambiente API_KEY da Gemini não está definida.");
  // Não encerramos o processo para permitir que o servidor inicie e mostre logs, mas a IA falhará.
}

// --- CONFIGURAÇÃO INICIAL ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 4000;

// --- CONFIGURAÇÃO DA IA ---
// Inicializa apenas se a chave existir para evitar crash imediato
const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- BANCO DE DADOS EM MEMÓRIA ---
const transactions = new Map();

// Mapeamento de labels para a IA entender as respostas
const ANSWER_LABELS = { 1: "Discordo Totalmente", 2: "Discordo", 3: "Neutro", 4: "Concordo", 5: "Concordo Totalmente" };
const formatAnswersForAI = (questions, answers) => {
    return questions
        .map(q => `Dimensão '${q.dimension}': "${q.text}" -> Resposta: ${ANSWER_LABELS[answers[q.id]] || 'N/A'} (valor: ${answers[q.id]}/5)`)
        .join('\n');
};

// --- ROTAS DA API ---

// 1. SUBMETER QUIZ (Início da Jornada)
app.post('/api/quiz/submit', (req, res) => {
  try {
    const { answers, questions } = req.body;
    if (!answers || !questions) {
      return res.status(400).json({ message: 'Dados inválidos.' });
    }
    const transactionId = uuidv4();
    transactions.set(transactionId, { answers, questions, status: 'PENDING' });
    console.log(`[NOVO QUIZ] Transação criada: ${transactionId}`);
    res.status(201).json({ transactionId });
  } catch (error) {
    console.error("Erro ao submeter quiz:", error);
    res.status(500).json({ message: "Erro interno ao processar o quiz." });
  }
});

// 2. GERAR PRÉVIA PERSUASIVA (O Gancho)
app.post('/api/report/preview', async (req, res) => {
  if (!ai) return res.status(500).json({ message: "Servidor de IA não configurado (API_KEY ausente)." });

  const { answers, questions } = req.body;
  
  const scores = calculateScores(answers, questions);
  if (!scores) return res.status(400).json({ message: 'Erro ao calcular scores.' });

  // Identifica a dimensão mais forte e a mais fraca para personalizar o gancho
  const sortedScores = Object.entries(scores).sort(([,a], [,b]) => b - a);
  const strongest = sortedScores[0][0]; // Ex: Foco
  const weakest = sortedScores[sortedScores.length - 1][0]; // Ex: Resiliência

  const systemInstruction = `Você é um especialista renomado em comportamento humano e persuasão de alto nível. 
  Sua missão é escrever um parágrafo curto e extremamente intrigante para um usuário que acabou de fazer um teste comportamental.
  
  OBJETIVO: Fazer o usuário sentir uma necessidade urgente de comprar o relatório completo.
  
  ESTRATÉGIA:
  1. Valide o usuário: Comece elogiando a dimensão mais forte dele (${strongest}). Diga que ele tem um "talento natural raro".
  2. Crie a tensão (O Gap): Mencione que você detectou um "padrão de comportamento oculto" ligado à dimensão mais fraca (${weakest}) que está sabotando silenciosamente o crescimento dele.
  3. Não revele a solução: Diga que o relatório completo explica exatamente como desbloquear essa trava.
  4. Use gatilhos mentais: Curiosidade, Exclusividade e Medo de Perder (FOMO).
  
  Tom de voz: Profissional, misterioso, direto e autoridade.`;

  const prompt = `Gere a prévia persuasiva. O usuário pontuou alto em ${strongest} e baixo em ${weakest}.`;

  try {
    const response = await ai.models.generateContent({ 
      model: "gemini-2.5-flash", 
      contents: prompt, 
      config: { systemInstruction, temperature: 0.8 } 
    });
    res.status(200).json({ previewText: response.text.trim() });
  } catch (error) {
    console.error("Erro na prévia:", error);
    res.status(500).json({ message: "Erro ao gerar prévia." });
  }
});

// 3. GERAR RELATÓRIO COMPLETO (A Entrega de Valor)
app.get('/api/report/full/:transactionId', async (req, res) => {
  const { transactionId } = req.params;
  const transaction = transactions.get(transactionId);

  if (!transaction) return res.status(404).json({ message: 'Transação não encontrada.' });
  
  // Permite gerar se estiver PAGO ou em ambiente de desenvolvimento (opcional, mas seguro manter a verificação)
  if (transaction.status !== 'PAID') {
      console.warn(`Tentativa de acesso a relatório não pago: ${transactionId}`);
      return res.status(402).json({ message: 'Pagamento pendente.' });
  }

  // Se já existe cache, retorna
  if (transaction.reportData) {
      return res.status(200).json(transaction.reportData);
  }

  if (!ai) return res.status(500).json({ message: "Servidor de IA não configurado." });

  const { answers, questions } = transaction;
  const scores = calculateScores(answers, questions);
  const formattedAnswers = formatAnswersForAI(questions, answers);

  const systemInstruction = `Você é um consultor executivo de carreira sênior. O usuário pagou por uma análise comportamental profunda.
  Sua tarefa é gerar um relatório JSON detalhado, acionável e transformador.
  
  Baseie-se nas pontuações: ${JSON.stringify(scores)}.
  
  Estrutura da Análise:
  1. "interpretations": Para cada pilar (Foco, Produtividade, Resiliência), escreva uma análise profunda (3-4 frases). Não seja genérico. Use os dados das respostas para ser específico.
  2. "recommendations": Liste 5 ações práticas, "mão na massa", que o usuário pode fazer amanhã para melhorar seus resultados.`;

  const prompt = `Analise estas respostas detalhadas:\n${formattedAnswers}\n\nGere o JSON de acordo com o schema.`;
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      archetypeTitle: { type: Type.STRING }, // Adicionado para compatibilidade com frontend
      archetypeDescription: { type: Type.STRING }, // Adicionado para compatibilidade com frontend
      scores: { type: Type.OBJECT, properties: { Foco: { type: Type.NUMBER }, Produtividade: { type: Type.NUMBER }, Resiliência: { type: Type.NUMBER } } },
      interpretations: { type: Type.OBJECT, properties: { Foco: { type: Type.STRING }, Produtividade: { type: Type.STRING }, Resiliência: { type: Type.STRING } } },
      recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["scores", "interpretations", "recommendations", "archetypeTitle", "archetypeDescription"]
  };

  try {
    const response = await ai.models.generateContent({ 
      model: "gemini-2.5-flash", 
      contents: prompt, 
      config: { systemInstruction, responseMimeType: "application/json", responseSchema, temperature: 0.7 } 
    });
    
    const aiData = JSON.parse(response.text.trim());
    
    // Garante que os scores numéricos calculados sejam usados (mais preciso que a IA)
    aiData.scores = scores; 
    
    // Fallback para campos que podem vir vazios
    if (!aiData.archetypeTitle) aiData.archetypeTitle = "Perfil em Análise";
    if (!aiData.archetypeDescription) aiData.archetypeDescription = "Sua análise completa está detalhada abaixo.";

    // ADAPTAÇÃO: O frontend espera 'dimensionAnalyses'. Vamos converter o formato antigo para o novo se necessário.
    // Mas para manter compatibilidade com o seu frontend atual (que parece esperar scores/interpretations separados),
    // vamos manter a estrutura que o frontend Report.tsx usa.
    // Observando o Report.tsx que você mandou, ele usa: reportData.scores.Foco, reportData.interpretations.Foco.
    // Então este JSON está correto.

    transaction.reportData = aiData; // Cache
    res.status(200).json(aiData);
  } catch (error) {
    console.error("Erro no relatório completo:", error);
    res.status(500).json({ message: "Erro ao gerar relatório completo." });
  }
});

// 4. WEBHOOK KIWIFY (Confirmação de Pagamento)
app.post('/api/kiwify-webhook', (req, res) => {
  const data = req.body;
  console.log('[WEBHOOK RAW]', JSON.stringify(data));

  // Tenta capturar o ID de várias formas possíveis que a Kiwify pode enviar
  const transactionId = data.aff_content || data.src || (data.order && data.order.src); 
  const orderStatus = data.order_status;

  console.log(`[WEBHOOK] ID Extraído: ${transactionId}, Status: ${orderStatus}`);

  if (transactionId && transactions.has(transactionId)) {
    if (orderStatus === 'paid') {
        transactions.get(transactionId).status = 'PAID';
        console.log(`[PAGAMENTO CONFIRMADO] Transação ${transactionId} liberada.`);
    }
  } else {
      console.warn(`[WEBHOOK] Transação ${transactionId} não encontrada na memória.`);
  }
  res.status(200).send('OK');
});

// Status Check
app.get('/api/payment/status/:transactionId', (req, res) => {
  const t = transactions.get(req.params.transactionId);
  res.json({ status: t ? t.status : 'UNKNOWN' });
});

// Simulação
app.post('/api/payment/simulate/:transactionId', (req, res) => {
  const t = transactions.get(req.params.transactionId);
  if(t) { 
      t.status = 'PAID'; 
      console.log(`[SIMULAÇÃO] Transação ${req.params.transactionId} marcada como PAGA.`);
      res.json({msg: 'Pago'}); 
  }
  else res.status(404).json({msg: 'Não encontrado'});
});

// Servir Frontend
const clientBuildPath = path.resolve(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => res.sendFile(path.resolve(clientBuildPath, 'index.html')));

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
