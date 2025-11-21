import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { ALL_QUESTIONS, ANSWER_OPTIONS } from '../constants';
import { startCheckout } from '../services/apiService';
import { QuizData, Answers } from '../types';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface QuizProps {
  onComplete: (transactionId: string) => void;
}

export const Quiz: React.FC<QuizProps> = ({ onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = ALL_QUESTIONS[currentIdx];
  const progress = ((currentIdx + 1) / ALL_QUESTIONS.length) * 100;

  const handleAnswer = async (value: number) => {
    const newAnswers = { ...answers, [question.id]: value };
    setAnswers(newAnswers);
    setError(null);

    if (currentIdx < ALL_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentIdx(prev => prev + 1), 200);
    } else {
      await submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers: Answers) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: QuizData = {
        questions: ALL_QUESTIONS,
        answers: finalAnswers,
      };
      const result = await startCheckout(payload);
      onComplete(result.transactionId);
    } catch (err: any) {
      setError("Ocorreu um erro ao processar suas respostas.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 font-sans">
      {/* ... O resto do JSX permanece o mesmo ... */}
    </div>
  );
};
