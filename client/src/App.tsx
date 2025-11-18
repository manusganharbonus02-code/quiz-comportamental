import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Report from './pages/Report';
import { QuizData } from './types';
import usePersistedState from './hooks/usePersistedState';
import './index.css';

type Page = 'home' | 'quiz' | 'report';

function App() {
  // MUDANÇA CRÍTICA: Agora persistimos a página atual. 
  // Se o usuário for para a Kiwify e voltar, o site lembra que ele estava em 'report'.
  const [page, setPage] = usePersistedState<Page>('app-current-page', 'home');
  const [quizData, setQuizData] = usePersistedState<QuizData | null>('quizData', null);
  const [transactionId, setTransactionId] = usePersistedState<string | null>('transactionId', null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Kiwify pode retornar parâmetros variados, verificamos alguns comuns ou apenas a presença de params
    const hasQueryParams = Array.from(params.keys()).length > 0;

    // Se voltamos com dados salvos e estamos na home, força a ida para o report para verificar pagamento
    if (hasQueryParams && quizData && page === 'home') {
      setPage('report');
    }
  }, [quizData, page, setPage]);

  const handleStartQuiz = () => {
    setQuizData(null);
    setTransactionId(null);
    setPage('quiz');
  };

  const handleCompleteQuiz = (data: { checkoutUrl: string, quizData: QuizData }) => {
    setQuizData(data.quizData);
    setPage('report'); // Garante que estamos na tela de relatório antes de sair
    window.location.href = data.checkoutUrl;
  };
  
  const handleRestart = () => {
    setQuizData(null);
    setTransactionId(null);
    setPage('home');
    // Limpa a URL
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const renderPage = () => {
    switch (page) {
      case 'quiz':
        return <Quiz onComplete={handleCompleteQuiz} onCancel={handleRestart} />;
      case 'report':
        // Se temos dados, mostramos o relatório (que vai verificar o pagamento)
        if (quizData) {
          return <Report 
            transactionId={transactionId || ''} 
            quizData={quizData} 
            onRestart={handleRestart} 
          />;
        }
        // Se algo deu errado e não temos dados, volta pra home
        setPage('home');
        return <Home onStartQuiz={handleStartQuiz} />;
      case 'home':
      default:
        return <Home onStartQuiz={handleStartQuiz} />;
    }
  };

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
      {renderPage()}
    </div>
  );
}

export default App;
