import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { Answers, QuizCompletionData } from '../types';
import { getQuizQuestions } from '../services/questionBank';

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
    }, 300);
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

  const handleSubmit = () => {
    if (Object.keys(answers).length !== quizQuestions.length) {
      setError("Parece que faltam respostas.");
      return;
    }
    // NÃO chama API aqui. Apenas passa os dados para mostrar a prévia.
    onComplete({ transactionId: "", answers, questions: quizQuestions });
  };

  return (
    <div className="min-h-screen p-4 flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <p className="text-gray-400 font-semibold">Pergunta {currentQuestion + 1} de {quizQuestions.length}</p>
          <div className="mt-2 bg-slate-700 rounded-full h-2.5">
            <div
              className="bg-teal-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className={`transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
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
                        : "border-slate-600 hover:border-teal-500/50 bg-slate-700/50"
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
            <Button onClick={handlePrevious} disabled={currentQuestion === 0} variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Anterior</Button>
            <Button onClick={onCancel} variant="ghost" className="text-gray-400 hover:text-red-400">Cancelar</Button>
            {isLastQuestion ? (
                <Button onClick={handleSubmit} disabled={!isAnswered} className="bg-green-600 hover:bg-green-500 text-white">Ver Resultado</Button>
            ) : (
                <Button onClick={handleNext} disabled={!isAnswered}>Próxima <ArrowRight className="w-4 h-4 ml-2" /></Button>
            )}
        </div>
      </div>
    </div>
  );
}
