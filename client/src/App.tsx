import React, { useState, useEffect } from 'react';
import IntroScreen from './components/IntroScreen';
import QuizScreen from './components/QuizScreen';
import LockedScreen from './components/LockedScreen';
import ReportScreen from './components/ReportScreen';
import { questionBank } from './data/questions';
import { Dimension, Question, Scores, ReportData } from './types';
import { DIMENSIONS, QUESTIONS_PER_DIMENSION, KIWIFY_CHECKOUT_URL } from './constants';
import { generateReport } from './services/geminiService';
import { Loader2 } from 'lucide-react';

type Screen = 'intro' | 'quiz' | 'preview' | 'report';

// Função auxiliar para embaralhar perguntas
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const App: React.FC = () => {
  // --- ESTADOS ---
  const [screen, setScreen] = useState<Screen>('intro');
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [scores, setScores] = useState<Scores | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de Carregamento
  const [isCheckingPayment, setIsCheckingPayment] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // --- 1. INICIALIZAÇÃO INTELIGENTE (Roda ao abrir o site) ---
  useEffect(() => {
    const checkUrlForReturn = async () => {
      try {
        // Captura parâmetros tanto da Query string (?tid=...) quanto do Hash (#/?tid=...)
        // Isso é crucial pois alguns gateways ou routers colocam parametros em lugares diferentes
        const currentUrl = new URL(window.location.href);
        let tid = currentUrl.searchParams.get('tid') || currentUrl.searchParams.get('transactionId');
        
        // Fallback para Hash se não achar na query normal
        if (!tid && window.location.hash.includes('tid=')) {
            const match = window.location.hash.match(/tid=([^&]*)/);
            if (match) {
                tid = match[1];
            }
        }
        
        if (tid) {
          console.log("[APP] Retorno de pagamento detectado. ID:", tid);
          setTransactionId(tid);
          
          // Tenta recuperar os dados do LocalStorage
          const storedData = localStorage.getItem(tid);
          
          if (storedData) {
            console.log("[APP] Dados recuperados com sucesso.");
            const { scores: retrievedScores } = JSON.parse(storedData);
            setScores(retrievedScores);
            
            // IMPORTANTE: Força a tela de relatório imediatamente
            setScreen('report'); 
            
            // Chama a IA
            await fetchReport(tid, retrievedScores);
          } else {
            console.warn("[APP] ID encontrado, mas dados não estão no navegador.");
            // Se não achou os dados, infelizmente tem que refazer ou mostrar erro
            // Mas não redirecionamos para intro automaticamente para não confundir
            setError("Não foi possível recuperar suas respostas anteriores. Por favor, tente realizar o teste novamente.");
          }
        }
      } catch (e) {
        console.error("[APP] Erro crítico ao verificar URL:", e);
      } finally {
        // Só libera a tela inicial se não estivermos processando um retorno
        setIsCheckingPayment(false);
      }
    };

    checkUrlForReturn();
  }, []);

  // --- 2. LÓGICA DO QUIZ ---
  const startQuiz = () => {
    let selectedQuestions: Question[] = [];
    DIMENSIONS.forEach(dimension => {
      const dimensionQuestions = questionBank.filter(q => q.dimension === dimension);
      selectedQuestions.push(...shuffleArray(dimensionQuestions).slice(0, QUESTIONS_PER_DIMENSION));
    });
    setQuizQuestions(shuffleArray(selectedQuestions));
    setScreen('quiz');
    setError(null);
  };

  const handleQuizComplete = (answers: { [key: string]: number }) => {
    // Calcula os Scores
    const newScores = DIMENSIONS.reduce((acc, dim) => {
      acc[dim] = 0;
      return acc;
    }, {} as Scores);

    quizQuestions.forEach(q => {
      if (answers[q.id]) {
        newScores[q.dimension] += answers[q.id];
      }
    });
    
    // Gera ID Único e Persistente
    const newTransactionId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setTransactionId(newTransactionId);
    setScores(newScores);

    // SALVA NO LOCALSTORAGE
    // Isso garante que os dados sobrevivam à ida e volta do Kiwify
    localStorage.setItem(newTransactionId, JSON.stringify({ 
        scores: newScores, 
        timestamp: Date.now() 
    }));

    // Vai para a tela de Prévia
    setScreen('preview');
  };

  // --- 3. LÓGICA DE PAGAMENTO ---
  const handlePayment = () => {
      if (!transactionId) {
          setError("Erro de processamento. Tente reiniciar o teste.");
          return;
      }
      
      // Monta a URL de retorno garantindo que o TID esteja presente
      const baseUrl = window.location.origin + window.location.pathname;
      const returnUrl = `${baseUrl}?tid=${transactionId}`;
      
      console.log("[APP] Iniciando pagamento. Retorno configurado para:", returnUrl);

      const finalCheckoutUrl = `${KIWIFY_CHECKOUT_URL}?return_url=${encodeURIComponent(returnUrl)}`;

      // Redireciona
      window.location.href = finalCheckoutUrl;
  };
  
  // --- 4. GERAÇÃO DE RELATÓRIO (IA) ---
  const fetchReport = async (tid: string, scoresToAnalyze: Scores) => {
    if (isLoadingReport) return;
    
    setIsLoadingReport(true);
    try {
        const report = await generateReport(scoresToAnalyze);
        setReportData(report);
    } catch (e) {
        const err = e as Error;
        console.error("Erro na IA:", err);
        setError("Ocorreu um erro ao gerar sua análise. Tente recarregar a página.");
    } finally {
        setIsLoadingReport(false);
    }
  };

  const handleRestart = () => {
    setScreen('intro');
    setScores(null);
    setReportData(null);
    setTransactionId(null);
    setError(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  // --- RENDERIZAÇÃO ---
  
  if (isCheckingPayment) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
        <p className="text-slate-300 font-medium animate-pulse">Verificando pagamento e gerando análise...</p>
      </div>
    );
  }

  if (error) {
      return (
          <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-4 text-center">
              <div className="bg-slate-800 border border-red-500/30 p-8 rounded-2xl max-w-md shadow-2xl">
                  <h2 className="text-2xl font-bold text-red-400 mb-4">Atenção</h2>
                  <p className="text-slate-300 mb-6">{error}</p>
                  <button onClick={handleRestart} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                      Voltar ao Início
                  </button>
              </div>
          </div>
      );
  }

  switch (screen) {
    case 'intro':
      return <IntroScreen onStart={startQuiz} />;
    case 'quiz':
      return <QuizScreen questions={quizQuestions} onComplete={handleQuizComplete} />;
    case 'preview':
      return scores ? <LockedScreen scores={scores} onPay={handlePayment} /> : null;
    case 'report':
      return <ReportScreen reportData={reportData} onRestart={handleRestart} />;
    default:
      return <IntroScreen onStart={startQuiz} />;
  }
};

export default App;
