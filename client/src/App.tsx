import React, { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Quiz } from './pages/Quiz';
import { ReportPreview } from './pages/ReportPreview';
import { ReportFull } from './pages/ReportFull';
import { ALL_QUESTIONS } from './constants';
import { Answers } from './types';

const KIWIFY_BASE_URL = 'https://pay.kiwify.com.br/RHpnrVL';
const QUIZ_CONTEXT_EXPIRATION_MS = 2 * 60 * 1000; // 2 minutos em milissegundos

type AppState = 'home' | 'quiz' | 'preview' | 'full_report';

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
          console.log("[APP] Valid quiz context found in localStorage.");
          setQuizContext(data);
          setTransactionId(urlTid);
          setView('full_report');
        } else {
          console.warn("[APP] Expired quiz context found. Cleaning up and resetting.");
          localStorage.removeItem(`quiz_context_${urlTid}`);
          setView('home');
        }
      } else {
        console.warn("[APP] No quiz context found for this transaction ID. Resetting.");
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
    console.log("Quiz finished. ID:", tid);
    const context = { questions: ALL_QUESTIONS, answers };
    
    // Salva o contexto com um carimbo de tempo
    const contextWrapper = {
      data: context,
      timestamp: Date.now()
    };
    localStorage.setItem(`quiz_context_${tid}`, JSON.stringify(contextWrapper));
    
    setTransactionId(tid);
    setQuizContext(context); // Guarda o contexto para a prévia
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
          quizContext={quizContext} // Passa o contexto para a prévia
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
