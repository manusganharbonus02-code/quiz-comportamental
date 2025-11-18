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

  const handleCompleteQuiz = (data: { checkoutUrl: string, quizData: QuizData }) => {
    setQuizData(data.quizData);
    window.location.href = data.checkoutUrl;
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
        if (transactionId) {
          return <Report transactionId={transactionId} onRestart={handleRestart} />;
        }
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
