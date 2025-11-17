import React, { useCallback } from 'react';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Report from './pages/Report';
import { Answers } from './types';
import usePersistedState from './hooks/usePersistedState';

type Page = 'home' | 'quiz' | 'report';

interface AppState {
  page: Page;
  transactionId: string | null;
  answers: Answers | null;
}

function App() {
  const [state, setState] = usePersistedState<AppState>('quiz-app-state', {
    page: 'home',
    transactionId: null,
    answers: null,
  });

  const handleStartQuiz = useCallback(() => {
    setState({ page: 'quiz', transactionId: null, answers: null });
  }, [setState]);

  const handleQuizComplete = useCallback((transactionId: string, answers: Answers) => {
    setState({ page: 'report', transactionId, answers });
  }, [setState]);
  
  const handleCancelQuiz = useCallback(() => {
    setState({ page: 'home', transactionId: null, answers: null });
  }, [setState]);

  const handleRestart = useCallback(() => {
    // Clear persisted state on restart
    window.localStorage.removeItem('quiz-app-state');
    setState({ page: 'home', transactionId: null, answers: null });
  }, [setState]);

  const renderPage = () => {
    switch (state.page) {
      case 'home':
        return <Home onStartQuiz={handleStartQuiz} />;
      case 'quiz':
        return <Quiz onComplete={handleQuizComplete} onCancel={handleCancelQuiz} />;
      case 'report':
        if (state.transactionId && state.answers) {
          return <Report transactionId={state.transactionId} onRestart={handleRestart} />;
        }
        // Fallback to home if report is rendered without necessary data
        handleRestart(); // Clear any inconsistent state
        return <Home onStartQuiz={handleStartQuiz} />;
      default:
        return <Home onStartQuiz={handleStartQuiz} />;
    }
  };

  return (
    <div className="dark min-h-screen font-sans text-dark-text bg-dark-bg">
      <main>{renderPage()}</main>
    </div>
  );
}

export default App;
