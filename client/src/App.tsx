import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Report from './pages/Report';
import { QuizData } from './types';
import usePersistedState from './hooks/usePersistedState';

type Page = 'home' | 'quiz' | 'report';

function App() {
  const [page, setPage] = useState<Page>('home');
  const [quizData, setQuizData] = usePersistedState<QuizData | null>('quizData', null);
  const [transactionId, setTransactionId] = usePersistedState<string | null>('transactionId', null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTransactionId = params.get('aff_content');

    // Se voltou da Kiwify com um ID e temos dados salvos, vá para o relatório no modo loading
    if (urlTransactionId && quizData) {
      setTransactionId(urlTransactionId);
      setPage('report');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [quizData, setTransactionId]);

  const handleStartQuiz = () => {
    setQuizData(null);
    setTransactionId(null);
    setPage('quiz');
  };

  const handleCompleteQuiz = (data: QuizData) => {
    // Salva os dados e mostra a tela de Report (que estará em modo 'preview' pq não tem transactionId ainda)
    setQuizData(data);
    setPage('report');
  };
  
  const handleRestart = () => {
    setQuizData(null);
    setTransactionId(null);
    setPage('home');
  };

  const renderPage = () => {
    switch (page) {
      case 'quiz':
        return <Quiz onComplete={handleCompleteQuiz} onCancel={handleRestart} />;
      case 'report':
        // Só renderiza se tiver dados, senão volta pra home
        if (quizData) {
             return <Report transactionId={transactionId || ''} quizData={quizData} onRestart={handleRestart} />;
        }
        return <Home onStartQuiz={handleStartQuiz} />;
      case 'home':
      default:
        return <Home onStartQuiz={handleStartQuiz} />;
    }
  };

  return (
    <div className="bg-slate-900 text-gray-200 min-h-screen font-sans">
      {renderPage()}
    </div>
  );
}

export default App;
