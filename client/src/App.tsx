import React, { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Quiz } from './pages/Quiz';
import { ReportPreview } from './pages/ReportPreview';
import { Waiting } from './pages/Waiting';
import { ReportFull } from './pages/ReportFull';

// ATUALIZADO: Substitua pela sua URL de checkout da Hotmart
const CHECKOUT_BASE_URL = 'https://pay.hotmart.com/SEU_CODIGO_DE_PRODUTO_AQUI';

type AppState = 'home' | 'quiz' | 'preview' | 'waiting' | 'full_report';

function App() {
  const [view, setView] = useState<AppState>('home');
  const [transactionId, setTransactionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // A Hotmart também pode usar 'tid' no redirecionamento se configurarmos
    const urlTid = params.get('tid') || params.get('transactionId');

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
      // ATUALIZADO: A Hotmart usa o parâmetro 'src' para rastrear o ID que enviamos.
      // A URL de redirecionamento agora é configurada na plataforma da Hotmart, não aqui.
      return `${CHECKOUT_BASE_URL}?src=${transactionId}`;
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans">
      {view === 'home' && <Home onStart={handleStartQuiz} />}
      
      {view === 'quiz' && <Quiz onComplete={handleQuizComplete} />}
      
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
