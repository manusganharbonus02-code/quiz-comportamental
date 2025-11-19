import React, { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Quiz } from './pages/Quiz';
import { ReportPreview } from './pages/ReportPreview';
import { ReportFull } from './pages/ReportFull';

// URL do seu produto no Kiwify
const KIWIFY_BASE_URL = 'https://pay.kiwify.com.br/RHpnrVL';

type AppState = 'home' | 'quiz' | 'preview' | 'full_report';

function App() {
  const [view, setView] = useState<AppState>('home');
  const [transactionId, setTransactionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTid = params.get('tid') || params.get('transactionId') || params.get('aff_content');
    const localTid = localStorage.getItem('apex_transaction_id');

    if (urlTid) {
      setTransactionId(urlTid);
      localStorage.setItem('apex_transaction_id', urlTid);
      setView('full_report');
    } else if (localTid) {
      // Se tem ID salvo, tenta mostrar o relatório
      setTransactionId(localTid);
      setView('full_report'); 
    }
  }, []);

  const handleStartQuiz = () => setView('quiz');

  const handleQuizComplete = (tid: string) => {
    setTransactionId(tid);
    localStorage.setItem('apex_transaction_id', tid);
    setView('preview');
  };

  const handleUnlockReport = () => {
    if (transactionId) {
      const checkoutUrl = `${KIWIFY_BASE_URL}?aff_content=${transactionId}`;
      window.location.href = checkoutUrl;
    }
  };

  // FUNÇÃO DE RESET (A CHAVE PARA O SEU PROBLEMA)
  const handleReset = () => {
    console.log("Resetando aplicação...");
    localStorage.removeItem('apex_transaction_id'); // Limpa a memória
    setTransactionId(null);
    setView('home'); // Volta para a home
    // Limpa a URL se tiver lixo
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-amber-500/30 selection:text-amber-900">
      {view === 'home' && <Home onStart={handleStartQuiz} />}
      
      {view === 'quiz' && <Quiz onComplete={handleQuizComplete} />}
      
      {view === 'preview' && transactionId && (
        <ReportPreview 
          transactionId={transactionId} 
          onUnlock={handleUnlockReport} 
        />
      )}
      
      {view === 'full_report' && transactionId && (
        <ReportFull 
          transactionId={transactionId} 
          onRestart={handleReset} // Passando a função de reset
        />
      )}
    </div>
  );
}

export default App;
