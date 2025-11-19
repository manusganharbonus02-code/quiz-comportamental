import React, { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Quiz } from './pages/Quiz';
import { ReportPreview } from './pages/ReportPreview';
import { ReportFull } from './pages/ReportFull';

// URL do seu produto no Kiwify (Obtida nos prints)
const KIWIFY_BASE_URL = 'https://pay.kiwify.com.br/RHpnrVL';

type AppState = 'home' | 'quiz' | 'preview' | 'full_report';

function App() {
  const [view, setView] = useState<AppState>('home');
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Verifica a URL ao carregar para ver se o usuário voltou do Kiwify
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // O Kiwify manda o ID de volta no parâmetro 'aff_content' (que configuramos no checkout)
    // Mas vamos verificar outros parâmetros também por segurança.
    const urlTid = params.get('aff_content') || params.get('tid') || params.get('transactionId');
    
    if (urlTid) {
      console.log("[APP] Retorno do pagamento detectado:", urlTid);
      setTransactionId(urlTid);
      // Se tiver ID na URL, assume que é para ver o relatório (Backend vai bloquear se não pagou)
      setView('full_report');
      
      // Limpa a URL para ficar mais bonita (opcional)
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleStartQuiz = () => setView('quiz');

  const handleQuizComplete = (tid: string) => {
    console.log("Quiz finalizado. ID da Transação:", tid);
    setTransactionId(tid);
    setView('preview');
  };

  const handleUnlockReport = () => {
    if (transactionId) {
      // REDIRECIONAMENTO PARA O KIWIFY
      // Passamos o ID no 'aff_content' para rastrear no webhook
      // Isso é CRUCIAL para a integração funcionar
      const checkoutUrl = `${KIWIFY_BASE_URL}?aff_content=${transactionId}`;
      console.log("Redirecionando para:", checkoutUrl);
      window.location.href = checkoutUrl;
    }
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
        <ReportFull transactionId={transactionId} />
      )}
    </div>
  );
}

export default App;
