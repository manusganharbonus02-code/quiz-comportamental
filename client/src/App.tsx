import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Report from './pages/Report';
import { QuizData } from './types';
import usePersistedState from './hooks/usePersistedState';
import './index.css';

type Page = 'home' | 'quiz' | 'report';

function App() {
  const [page, setPage] = useState<Page>('home');
  // Salva os dados do quiz na memória do navegador para sobreviver ao redirecionamento
  const [quizData, setQuizData] = usePersistedState<QuizData | null>('quizData', null);
  const [transactionId, setTransactionId] = usePersistedState<string | null>('transactionId', null);

  // Este efeito especial detecta quando o usuário volta da Kiwify
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTransactionId = params.get('aff_content');

    if (urlTransactionId && quizData) {
      setTransactionId(urlTransactionId);
      setPage('report');
      // Limpa a URL para que o usuário possa recarregar a página sem problemas
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [quizData, setTransactionId]);


  const handleStartQuiz = () => {
    // Limpa dados antigos antes de começar um novo quiz
    setQuizData(null);
    setTransactionId(null);
    setPage('quiz');
  };

  const handleCompleteQuiz = (data: { checkoutUrl: string, quizData: QuizData }) => {
    // Salva os dados do quiz e redireciona para o pagamento
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
        // Se chegar aqui sem dados, volta para o início para segurança
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
