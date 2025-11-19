import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Report from './pages/Report';
import { QuizData } from './types';
import usePersistedState from './hooks/usePersistedState';
// Importante: Importar o CSS global para o Tailwind funcionar
import './index.css';

type Page = 'home' | 'quiz' | 'report';

function App() {
  const [page, setPage] = useState<Page>('home');
  
  // Usa a memória do navegador para não perder os dados quando for para a Kiwify
  const [quizData, setQuizData] = usePersistedState<QuizData | null>('quizData', null);
  const [transactionId, setTransactionId] = usePersistedState<string | null>('transactionId', null);

  // Efeito para detectar quando o usuário VOLTA do pagamento
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // A Kiwify manda o ID de volta no parâmetro 'aff_content'
    const urlTransactionId = params.get('aff_content');

    if (urlTransactionId && quizData) {
      console.log("Retorno do pagamento detectado. Indo para relatório.");
      setTransactionId(urlTransactionId);
      setPage('report');
      // Limpa a URL para ficar bonita
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [quizData, setTransactionId]);


  const handleStartQuiz = () => {
    setQuizData(null);
    setTransactionId(null);
    setPage('quiz');
  };

  const handleCompleteQuiz = (data: { transactionId: string, quizData: QuizData }) => {
    console.log("Quiz completo. Salvando dados e preparando redirecionamento.");
    setQuizData(data.quizData);
    setTransactionId(data.transactionId);
    // O redirecionamento real acontece dentro do componente Quiz, aqui só salvamos o estado
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
        // Só mostra o relatório se tivermos o ID da transação e os dados
        if (transactionId && quizData) {
          return <Report 
            transactionId={transactionId} 
            answers={quizData.answers} 
            questions={quizData.questions} 
            onRestart={handleRestart} 
          />;
        }
        // Se algo der errado, volta para o início
        setPage('home');
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
