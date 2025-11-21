import React, { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Quiz } from './pages/Quiz';
import { ReportPreview } from './pages/ReportPreview';
import { ReportFull } from './pages/ReportFull';
import { ALL_QUESTIONS } from './constants';
import { Answers } from './types';

const KIWIFY_BASE_URL = 'https://pay.kiwify.com.br/RHpnrVL';
const QUIZ_CONTEXT_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutos

type AppState = 'home' | 'quiz' | 'preview' | 'full_report';

// Função para verificar se o modo de simulação está ativo
const isDevMode = () => new URLSearchParams(window.location.search).get('dev') === 'true';

function App() {
  const [view, setView] = useState<AppState>('home');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [quizContext, setQuizContext] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTid = params.get('tid') || params.get('transactionId') || params.get('aff_content');

    if (urlTid) {
      console.log("[APP] ID detected in URL:", urlTid);
      const savedItem = localStorage.getItem(`quiz_context_${urlTid}`);
      
      if (savedItem) {
        const { data, timestamp } = JSON.parse(savedItem);
        const isExpired = (Date.now() - timestamp) > QUIZ_CONTEXT_EXPIRATION_MS;

        if (!isExpired) {
          setQuizContext(data);
          setTransactionId(urlTid);
          setView('full_report');
        } else {
          localStorage.removeItem(`quiz_context_${urlTid}`);
          setView('home');
        }
      } else {
        setView('home');
      }
      // Limpa a URL para o usuário não ver o tid, mas mantém o modo dev se ele estiver ativo
      const cleanUrl = isDevMode() ? '?dev=true' : window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  const handleStartQuiz = () => {
    setTransactionId(null);
    setView('quiz');
  };

  const handleQuizComplete = (tid: string, answers: Answers) => {
    const context = { questions: ALL_QUESTIONS, answers };
    const contextWrapper = { data: context, timestamp: Date.now() };
    localStorage.setItem(`quiz_context_${tid}`, JSON.stringify(contextWrapper));
    
    setTransactionId(tid);
    setQuizContext(context);
    setView('preview');
  };

  const handleUnlockReport = () => {
    if (!transactionId) return;

    // LÓGICA DE SIMULAÇÃO
    if (isDevMode()) {
      console.log('--- MODO DE SIMULAÇÃO ATIVADO ---');
      console.log('Pagamento simulado. Redirecionando para a página do relatório...');
      
      // Simula o redirecionamento da Kiwify de volta para o site
      window.location.href = `/?tid=${transactionId}&dev=true`;

    } else {
      // Fluxo normal de produção
      const checkoutUrl = `${KIWIFY_BASE_URL}?aff_content=${transactionId}`;
      window.location.href = checkoutUrl;
    }
  };

  const handleReset = () => {
    if (transactionId) {
      localStorage.removeItem(`quiz_context_${transactionId}`);
    }
    setTransactionId(null);
    window.location.href = isDevMode() ? '/?dev=true' : '/'; // Mantém o modo dev ao reiniciar
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
