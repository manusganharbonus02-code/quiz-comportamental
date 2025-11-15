import React, { useState } from 'react';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Report from './pages/Report';
import { Answers, QuizCompletionData } from './types';

interface AppState {
  page: 'home' | 'quiz' | 'report';
  transactionId: string | null;
  answers: Answers | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    page: 'home',
    transactionId: null,
    answers: null,
  });

  const handleStartQuiz = () => {
    setState({ page: 'quiz', transactionId: null, answers: null });
  };

  const handleCancelQuiz = () => {
    setState({ page: 'home', transactionId: null, answers: null });
  };

  const handleCompleteQuiz = (data: QuizCompletionData) => {
    setState(prev => ({
      ...prev,
      page: 'report',
      transactionId: data.transactionId,
      answers: data.answers,
    }));
  };

  const handleRestart = () => {
    setState({ page: 'home', transactionId: null, answers: null });
  };

  const renderPage = () => {
    switch (state.page) {
      case 'quiz':
        return <Quiz onComplete={handleCompleteQuiz} onCancel={handleCancelQuiz} />;
      case 'report':
        return state.transactionId && state.answers 
          ? <Report transactionId={state.transactionId} answers={state.answers} onRestart={handleRestart} /> 
          : <Home onStartQuiz={handleStartQuiz} />;
      case 'home':
      default:
        return <Home onStartQuiz={handleStartQuiz} />;
    }
  };

  return (
    <div className="bg-slate-900 text-gray-300 min-h-screen font-sans">
      {renderPage()}
    </div>
  );
}

export default App;
