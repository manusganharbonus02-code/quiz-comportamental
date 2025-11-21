import React, { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Quiz } from './pages/Quiz';
import { ReportPreview } from './pages/ReportPreview';
import { Waiting } from './pages/Waiting'; // Importamos a nova página
import { ReportFull } from './pages/ReportFull';
import { ALL_QUESTIONS } from './constants';
import { Answers } from './types';

const KIWIFY_BASE_URL = 'https://pay.kiwify.com.br/RHpnrVL';

type AppState = 'home' | 'quiz' | 'preview' | 'waiting' | 'full_report';

function App() {
  const [view, setView] = useState<AppState>('home');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [quizContext, setQuizContext] = useState(null); 

  // Efeito para recuperar o estado se o usuário voltar da Kiwify
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTid = params.get('tid');

    if (urlTid) {
        console.log("[APP] TID detectado na URL, retomando o estado de espera:", urlTid);
        setTransactionId(urlTid);
        setView('waiting'); // Sempre vai para a tela de espera ao detectar um TID na URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleStartQuiz = () => {
    setTransactionId(null);
    setQuizContext(null);
    setView('quiz');
  };

  const handleQuizComplete = (tid: string, answers: Answers) => {
    console.log("Quiz finalizado. ID:", tid);
    const context = { questions: ALL_QUESTIONS, answers };
    
    // Salvamos na memória do navegador para o caso de o usuário recarregar a página
    const contextWrapper = { data: context, timestamp: Date.now() };
    localStorage.setItem(`quiz_context_${tid}`, JSON.stringify(contextWrapper));
    
    setQuizContext(context);
    setTransactionId(tid);
    setView('preview');
  };

  const handleUnlockReport = () => {
    if (!transactionId) return;
    // A principal mudança: em vez de ir para a Kiwify, vamos para a nossa página de espera
    console.log("Indo para a página de espera...");
    setView('waiting'); 
  };
  
  const handlePaymentSuccess = () => {
      console.log("Pagamento confirmado! Carregando relatório...");
      
      // Se o contexto do quiz não estiver no estado (página recarregada), busca no localStorage
      if (!quizContext && transactionId) {
          const savedItem = localStorage.getItem(`quiz_context_${transactionId}`);
          if (savedItem) {
              const { data } = JSON.parse(savedItem);
              setQuizContext(data);
          } else {
              alert("Erro: não foi possível encontrar os dados da sua avaliação. Por favor, reinicie.");
              handleReset();
              return;
          }
      }
      setView('full_report');
  };

  const handleReset = () => {
    if (transactionId) {
        localStorage.removeItem(`quiz_context_${transactionId}`);
    }
    setTransactionId(null);
    setQuizContext(null);
    setView('home');
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // Constrói a URL de checkout, dizendo à Kiwify para onde redirecionar o usuário de volta
  const getCheckoutUrl = () => {
      if (!transactionId) return '#';
      const redirectUrl = `${window.location.origin}/?tid=${transactionId}`;
      return `${KIWIFY_BASE_URL}?aff_content=${transactionId}&redirect_url=${encodeURIComponent(redirectUrl)}`;
  }

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
      
      {view === 'waiting' && transactionId && (
        <Waiting 
          transactionId={transactionId}
          checkoutUrl={getCheckoutUrl()}
          onPaymentSuccess={handlePaymentSuccess}
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
