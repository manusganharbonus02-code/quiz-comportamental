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
    
    // Só recupera se vier na URL (retorno do pagamento ou link salvo)
    const urlTid = params.get('tid') || params.get('transactionId') || params.get('aff_content');
    
    if (urlTid) {
      console.log("[APP] ID detectado na URL:", urlTid);
      setTransactionId(urlTid);
      setView('full_report');
      
      // Limpa a URL para ficar bonita, mas mantém o estado
      window.history.replaceState({}, document.title, window.location.pathname);
    } 
    // REMOVIDO: A verificação automática do localStorage ao iniciar.
    // Isso quebrava o fluxo se o ID fosse velho. 
    // Agora, entrou no site limpo -> Vai para a Home.
  }, []);

  const handleStartQuiz = () => {
    // Limpa qualquer resquício anterior ao começar novo
    setTransactionId(null);
    localStorage.removeItem('apex_transaction_id');
    setView('quiz');
  };

  const handleQuizComplete = (tid: string) => {
    console.log("Quiz finalizado. ID:", tid);
    setTransactionId(tid);
    // Salvamos apenas temporariamente para o fluxo de compra
    localStorage.setItem('apex_transaction_id', tid);
    setView('preview');
  };

  const handleUnlockReport = () => {
    if (transactionId) {
      const checkoutUrl = `${KIWIFY_BASE_URL}?aff_content=${transactionId}`;
      window.location.href = checkoutUrl;
    }
  };

  // Reinicia tudo
  const handleReset = () => {
    localStorage.removeItem('apex_transaction_id');
    setTransactionId(null);
    setView('home');
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
          onRestart={handleReset} 
        />
      )}
    </div>
  );
}

export default App;
