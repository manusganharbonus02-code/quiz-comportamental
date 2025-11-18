import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { ArrowLeft, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { startCheckout } from '../services/apiService';
import { Answers } from '../types';
import { getQuizQuestions } from '../services/questionBank';

interface QuizPageProps {
  onComplete: (data: any) => void;
  onCancel: () => void;
}

const ANSWER_OPTIONS = [
    { value: 1, label: "Discordo Totalmente" },
    { value: 2, label: "Discordo" },
    { value: 3, label: "Neutro" },
    { value: 4, label: "Concordo" },
    { value: 5, label: "Concordo Totalmente" },
];

// Mapeia os nomes internos para nomes amigáveis na tela
const DIMENSION_NAMES: Record<string, string> = {
  Foco: "Foco",
  Adaptabilidade: "Adaptabilidade",
  AgressorRotina: "Inovação",
  MatadorDragoes: "Coragem",
  RadarSocial: "Inteligência Social",
}

export default function QuizPage({ onComplete, onCancel }: QuizPageProps) {
  const [quizQuestions] = useState(() => getQuizQuestions(25));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const question = quizQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;
  const isAnswered = answers[question.id] !== undefined;
  const isLastQuestion = currentQuestion === quizQuestions.length - 1;

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
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== quizQuestions.length) {
      setError("Parece que faltam respostas. Por favor, revise antes de finalizar.");
      return;
    }
    setIsSubmitting(true);
    try {
      const quizData = { questions: quizQuestions, answers };
      // Chama a nova função para iniciar o checkout
      const { checkoutUrl } = await startCheckout(quizData);
      // Passa a URL e os dados do quiz para o App.tsx
      onComplete({ checkoutUrl, quizData });
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao enviar suas respostas. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <p className="text-gray-400 font-semibold">Pergunta {currentQuestion + 1} de {quizQuestions.length}</p>
          <div className="mt-2 bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-teal-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <Card>
          <CardContent className="p-6 sm:p-10">
            <div className="mb-8 min-h-[120px] flex flex-col justify-center">
              <span className="inline-block bg-teal-900 text-teal-300 px-3 py-1 rounded-full text-sm font-semibold mb-4 self-center">
                {DIMENSION_NAMES[question.module]}
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
                      ? "border-teal-500 bg-teal-900/40"
                      : "border-gray-600 hover:border-teal-500/50 bg-gray-700/50"
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
        <div className="grid grid-cols-3 gap-4 items-center mt-8">
          <Button onClick={handlePrevious} disabled={currentQuestion === 0} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
          </Button>
          <Button onClick={onCancel} variant="ghost" className="text-gray-400 hover:text-red-400">Cancelar</Button>
          {isLastQuestion ? (
            <Button onClick={handleSubmit} disabled={isSubmitting || !isAnswered} className="bg-green-600 hover:bg-green-500 text-white">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Finalizar e Pagar"}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!isAnswered}>
              Próxima <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
