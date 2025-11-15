import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { ArrowLeft, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { submitQuizAnswers } from '../services/apiService';
import { Answers, QuizCompletionData } from '../types';
import { getRandomQuestions } from '../services/questionBank';

interface QuizPageProps {
  onComplete: (data: QuizCompletionData) => void;
  onCancel: () => void;
}

const ANSWER_OPTIONS = [
    { value: 1, label: "Discordo Totalmente" },
    { value: 2, label: "Discordo" },
    { value: 3, label: "Neutro" },
    { value: 4, label: "Concordo" },
    { value: 5, label: "Concordo Totalmente" },
];

export default function QuizPage({ onComplete, onCancel }: QuizPageProps) {
  const [quizQuestions] = useState(() => getRandomQuestions(25));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const question = quizQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;
  const isAnswered = answers[question.id] !== undefined;
  const isLastQuestion = currentQuestion === quizQuestions.length - 1;

  const transitionToQuestion = (newIndex: number) => {
    setIsFading(true);
    setTimeout(() => {
        setCurrentQuestion(newIndex);
        setIsFading(false);
    }, 300); // Deve corresponder à duração da transição do CSS
  };

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({ ...prev, [question.id]: value }));
    setError("");
  };

  const handleNext = () => {
    if (!isAnswered) {
      setError("Por favor, selecione uma resposta para continuar.");
      return;
    }
    if (!isLastQuestion) {
      transitionToQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      transitionToQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== quizQuestions.length) {
      setError("Parece que faltam respostas. Por favor, revise antes de finalizar.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { transactionId } = await submitQuizAnswers(answers);
      onComplete({ transactionId, answers });
    } catch (err) {
      setError("Ocorreu um erro ao enviar suas respostas. Tente novamente.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <p className="text-gray-400 font-semibold">Pergunta {currentQuestion + 1} de {quizQuestions.length}</p>
          <div className="mt-2 bg-slate-700 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className={`transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
            <Card>
            <CardContent className="p-6 sm:p-10">
                <div className="mb-8 min-h-[120px] flex flex-col justify-center">
                <span className="inline-block bg-teal-900/50 text-teal-300 px-3 py-1 rounded-full text-sm font-semibold mb-4 self-center">
                    {question.dimension}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-100 text-center">{question.text}</h2>
                </div>

                <div className="space-y-3">
                {ANSWER_OPTIONS.map(option => (
                    <button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 text-gray-200 font-medium ${
                        answers[question.id] === option.value
                        ? "border-amber-500 bg-amber-900/20 ring-2 ring-amber-500/30"
                        : "border-slate-600 hover:border-amber-500/50 bg-slate-700/50"
                    }`}
                    >
                    {option.label}
                    </button>
                ))}
                </div>
                
                {error && (
                <div className="mt-6 p-3 bg-red-900/50 border border-red-500/30 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-300 text-sm font-medium">{error}</p>
                </div>
                )}
            </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-3 gap-4 items-center mt-8">
            <Button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                variant="outline"
                className="flex items-center justify-center gap-2"
            >
                <ArrowLeft className="w-4 h-4" />
                Anterior
            </Button>

            <Button
                onClick={onCancel}
                variant="ghost"
                className="text-slate-400 hover:text-red-400"
            >
                Cancelar
            </Button>

            {isLastQuestion ? (
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !isAnswered}
                    className="bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20"
                >
                    {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        "Finalizar e Ver Prévia"
                    )}
                </Button>
            ) : (
                <Button
                    onClick={handleNext}
                    disabled={!isAnswered}
                    className="flex items-center justify-center gap-2"
                >
                    Próxima
                    <ArrowRight className="w-4 h-4" />
                </Button>
            )}
        </div>
      </div>
    </div>
  );
}
