import React, { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Quiz } from './pages/Quiz';
import { ReportPreview } from './pages/ReportPreview';
import { ReportFull } from './pages/ReportFull';

// URL for the product checkout page on Kiwify
const KIWIFY_BASE_URL = 'https://pay.kiwify.com.br/RHpnrVL';

type AppState = 'home' | 'quiz' | 'preview' | 'full_report';

function App() {
  const [view, setView] = useState<AppState>('home');
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // This effect runs only once on component mount to check for a transaction ID in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTid = params.get('tid') || params.get('transactionId') || params.get('aff_content');

    if (urlTid) {
      console.log("[APP] Transaction ID detected in URL:", urlTid);
      setTransactionId(urlTid);
      setView('full_report');

      // Clean up the URL for a cleaner user experience, without reloading the page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleStartQuiz = () => {
    // Ensure a clean state before starting a new quiz
    setTransactionId(null);
    localStorage.removeItem('apex_transaction_id');
    setView('quiz');
  };

  const handleQuizComplete = (tid: string) => {
    console.log("Quiz completed. Transaction ID:", tid);
    setTransactionId(tid);
    // Temporarily save the ID to localStorage to survive the redirect to checkout
    localStorage.setItem('apex_transaction_id', tid);
    setView('preview');
  };
  
  const handleUnlockReport = () => {
    if (transactionId) {
      const checkoutUrl = `${KIWIFY_BASE_URL}?aff_content=${transactionId}`;
      window.location.href = checkoutUrl;
    }
  };

  // Resets the entire application state to the beginning
  const handleReset = () => {
    localStorage.removeItem('apex_transaction_id');
    setTransactionId(null);
    // Also clear any URL parameters just in case
    window.history.replaceState({}, document.title, window.location.pathname);
    setView('home');
  };

  const renderCurrentView = () => {
    switch (view) {
      case 'home':
        return <Home onStart={handleStartQuiz} />;
      case 'quiz':
        return <Quiz onComplete={handleQuizComplete} />;
      case 'preview':
        if (transactionId) {
          return <ReportPreview transactionId={transactionId} onUnlock={handleUnlockReport} />;
        }
        // Fallback if transactionId is missing
        handleReset(); 
        return null;
      case 'full_report':
        if (transactionId) {
          return <ReportFull transactionId={transactionId} onRestart={handleReset} />;
        }
        // Fallback if transactionId is missing
        handleReset();
        return null;
      default:
        return <Home onStart={handleStartQuiz} />;
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-amber-500/30 selection:text-amber-900">
      {renderCurrentView()}
    </div>
  );
}

export default App;
