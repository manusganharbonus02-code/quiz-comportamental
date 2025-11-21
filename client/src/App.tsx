import React, { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Quiz } from './pages/Quiz';
import { ReportPreview } from './pages/ReportPreview';
import { Waiting } from './pages/Waiting';
import { ReportFull } from './pages/ReportFull';

const KIWIFY_BASE_URL = 'https://pay.kiwify.com.br/RHpnrVL';

type AppState = 'home' | 'quiz' | 'preview' | 'waiting' | 'full_report';

function App() {
  const [view, setView] = useState<AppState>('home');
  const [transactionId, setTransactionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTid = params.get('tid');

    if (urlTid) {
        console.log("[APP] TID detectado, indo para a tela de espera:", urlTid);
        setTransactionId(urlTid);
        setView('waiting'); 
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleStartQuiz = () => {
    setTransactionId(null);
    setView('quiz');
  };

  // A função agora só precisa do TID, como planejado na arquitetura final.
  const handleQuizComplete = (tid: string) => {
    console.log("Quiz finalizado. ID:", tid);
    setTransactionId(tid);
    setView('preview');
  };

  const handleUnlockReport = () => {
    if (!transactionId) return;
    console.log("Indo para a página de espera...");
    setView('waiting'); 
  };
  
  const handlePaymentSuccess = () => {
      console.log("Pagamento confirmado! Carregando relatório...");
      setView('full_report');
  };

  const handleReset = () => {
    setTransactionId(null);
    setView('home');
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const getCheckoutUrl = () => {
      if (!transactionId) return '#';
      // A URL de redirecionamento agora aponta para a tela de espera, que sabe como lidar com o TID.
      const redirectUrl = `${window.location.origin}/?tid=${transactionId}`;
      return `${KIWIFY_BASE_URL}?aff_content=${transactionId}&redirect_url=${encodeURIComponent(redirectUrl)}`;
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans">
      {view === 'home' && <Home onStart={handleStartQuiz} />}
      
      {view === 'quiz' && <Quiz onComplete={handleQuizComplete} />}
      
      {/* CORREÇÃO CRÍTICA: A verificação '&& quizContext' foi removida. */}
      {view === 'preview' && transactionId && (
        <ReportPreview 
          transactionId={transactionId} 
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
      
      {/* CORREÇÃO CRÍTICA: A verificação '&& quizContext' foi removida. */}
      {view === 'full_report' && transactionId && (
        <ReportFull 
          transactionId={transactionId} 
          onRestart={handleReset} 
        />
      )}
    </div>
  );
}

export default App;
