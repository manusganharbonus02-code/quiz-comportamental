import React, { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Quiz } from './pages/Quiz';
import { ReportPreview } from './pages/ReportPreview';
import { ReportFull } from './pages/ReportFull';
import { ALL_QUESTIONS } from './constants';
import { Answers } from './types';

const KIWIFY_BASE_URL = 'https://pay.kiwify.com.br/RHpnrVL';
// AUMENTADO: O tempo de expiração agora é de 15 minutos, mais realista para um fluxo de pagamento.
const QUIZ_CONTEXT_EXPIRATION_MS = 15 * 60 * 1000; 

type AppState = 'home' | 'quiz' | 'preview' | 'full_report';

function App() {
  const [view, setView] = useState<AppState>('home');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [quizContext, setQuizContext] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTid = params.get('tid') || params.get('transactionId') || params.get('aff_content');

    if (urlTid) {
      console.log("[APP] ID detectado na URL:", urlTid);
      const savedItem = localStorage.getItem(`quiz_context_${urlTid}`);
      
      if (savedItem) {
        const { data, timestamp } = JSON.parse(savedItem);
        const elapsedTime = Date.now() - timestamp;
        const isExpired = elapsedTime > QUIZ_CONTEXT_EXPIRATION_MS;

        console.log(`[APP] Contexto encontrado. Tempo decorrido: ${Math.round(elapsedTime / 1000)}s.`);

        if (!isExpired) {
          console.log("[APP] Contexto válido. Carregando relatório completo...");
          setQuizContext(data);
          setTransactionId(urlTid);
          setView('full_report');
        } else {
          console.warn("[APP] CONTEXTO EXPIRADO. O usuário demorou demais para pagar. Limpando e reiniciando.");
          localStorage.removeItem(`quiz_context_${urlTid}`);
          setView('home');
        }
      } else {
        console.warn("[APP] NENHUM CONTEXTO SALVO encontrado para este ID. Reiniciando.");
        setView('home');
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleStartQuiz = () => {
    setTransactionId(null);
    setView('quiz');
  };

  const handleQuizComplete = (tid: string, answers: Answers) => {
    console.log("Quiz finalizado. ID:", tid);
    const context = { questions: ALL_QUESTIONS, answers };
    
    const contextWrapper = {
      data: context,
      timestamp: Date.now()
    };
    localStorage.setItem(`quiz_context_${tid}`, JSON.stringify(contextWrapper));
    console.log(`[APP] Contexto do quiz salvo no localStorage para o ID ${tid}.`);
    
    setTransactionId(tid);
    setQuizContext(context);
    setView('preview');
  };

  const handleUnlockReport = () => {
    if (transactionId) {
      const checkoutUrl = `${KIWIFY_BASE_URL}?aff_content=${transactionId}`;
      window.location.href = checkoutUrl;
    }
  };

  const handleReset = () => {
    if (transactionId) {
      localStorage.removeItem(`quiz_context_${transactionId}`);
    }
    setTransactionId(null);
    setView('home');
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-amber-500/30 selection:text-amber-900">
      {view === 'home' && <Home onStart={handleStartQuiz} />}
      {view === 'quiz' && <Quiz onComplete={handleQuizComplete} />}
      {view === 'preview' && transactionId && quizContext && (
        <ReportPreview
          transactionId={transactionId}
          quizContext={quizContext} 
          onUnlock={handleUnlockReport}
        />
      )}
      {view === 'full_report' && transactionId && quizContext && (
        <ReportFull
          transactionId={transactionId}
          quizContext={quizContext}
          onRestart={handleReset}
        />
      )}
    </div>
  );
}

export default App;
