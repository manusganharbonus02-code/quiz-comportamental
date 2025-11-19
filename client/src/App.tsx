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
    // 1. Tenta recuperar da URL (caso o webhook/link direto funcione)
    const params = new URLSearchParams(window.location.search);
    const urlTid = params.get('tid') || params.get('transactionId') || params.get('aff_content');
    
    // 2. Tenta recuperar da Memória do Navegador (Salvaguarda)
    const localTid = localStorage.getItem('apex_transaction_id');

    if (urlTid) {
      console.log("[APP] ID via URL:", urlTid);
      setTransactionId(urlTid);
      localStorage.setItem('apex_transaction_id', urlTid); // Atualiza local
      setView('full_report');
    } else if (localTid) {
      console.log("[APP] ID via LocalStorage:", localTid);
      setTransactionId(localTid);
      // Se tem ID salvo, assume que ele foi pagar e voltou. 
      // O componente ReportFull vai verificar se o pagamento foi aprovado.
      setView('full_report'); 
    }
  }, []);

  const handleStartQuiz = () => setView('quiz');

  const handleQuizComplete = (tid: string) => {
    console.log("Quiz finalizado. ID:", tid);
    setTransactionId(tid);
    // Salva no navegador para não perder se o usuário fechar a aba
    localStorage.setItem('apex_transaction_id', tid);
    setView('preview');
  };

  const handleUnlockReport = () => {
    if (transactionId) {
      // Garante que está salvo antes de sair do site
      localStorage.setItem('apex_transaction_id', transactionId);
      
      const checkoutUrl = `${KIWIFY_BASE_URL}?aff_content=${transactionId}`;
      console.log("Redirecionando para:", checkoutUrl);
      window.location.href = checkoutUrl;
    }
  };

  // Função para "Sair" ou "Reiniciar" (Limpa a memória)
  const handleReset = () => {
    localStorage.removeItem('apex_transaction_id');
    setTransactionId(null);
    setView('home');
    window.history.replaceState({}, document.title, "/");
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
          // @ts-ignore - Vamos adicionar essa prop no ReportFull no próximo passo
          onRestart={handleReset} 
        />
      )}
    </div>
  );
}

export default App;
