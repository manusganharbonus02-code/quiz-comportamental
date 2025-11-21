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
      // Envia os dados para o servidor e recebe o ID da transação
      const result = await startCheckout(payload);
      
      // Passa apenas o ID para o App.tsx, que agora gerencia o fluxo
      onComplete(result.transactionId);

    } catch (err: any) {
      console.error("Error submitting quiz:", err);
      setError("Ocorreu um erro ao processar suas respostas.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 font-sans">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
            <span>Pergunta {currentIdx + 1} / {ALL_QUESTIONS.length}</span>
            <span>{Math.round(progress)}% Concluído</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card className="animate-fade-in border-slate-700 bg-slate-800/50 shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-8 min-h-[120px] flex flex-col items-center justify-center text-center">
              <span className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-3 bg-amber-500/10 px-3 py-1 rounded-full">
                Avaliação Comportamental
              </span>
              <h2 className="text-xl md:text-2xl font-semibold text-white leading-snug">
                "{question.text}"
              </h2>
            </div>

            <div className="space-y-3">
              {ANSWER_OPTIONS.map((option) => {
                const isSelected = answers[question.id] === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => !isSubmitting && handleAnswer(option.value)}
                    disabled={isSubmitting}
                    className={`
                      w-full p-4 text-left rounded-xl border-2 transition-all duration-200 group relative overflow-hidden
                      ${isSelected
                        ? 'border-amber-500 bg-amber-500/10 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-200 hover:bg-slate-700'}
                      ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <span className="relative z-10 font-medium flex justify-between items-center">
                      {option.label}
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
                    </span>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-800 rounded-xl flex items-start gap-3 animate-pulse">
                <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                  <Button variant="danger" size="sm" className="mt-3 w-full" onClick={() => submitQuiz(answers)}>
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            )}

            {isSubmitting && !error && (
              <div className="mt-8 text-center space-y-3">
                <div className="flex justify-center">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-amber-500 font-medium animate-pulse">
                  Analisando seus padrões...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
