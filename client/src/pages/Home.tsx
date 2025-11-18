import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Zap, TrendingUp, Award } from 'lucide-react';

interface HomeProps {
  onStartQuiz: () => void;
}

export default function Home({ onStartQuiz }: HomeProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-gray-300">
      <header className="bg-slate-900/70 backdrop-blur-sm shadow-lg shadow-black/20 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-100">
            Perfil Comportamental
          </h1>
          <Button onClick={onStartQuiz} className="hidden sm:inline-flex" variant="outline">
            Iniciar Avaliação
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-4 tracking-tight">
            Descubra Seu Potencial
          </h2>
          <p className="text-lg text-gray-400 mb-8 max-w-3xl mx-auto">
            Responda a 25 perguntas e receba um relatório detalhado sobre seu perfil comportamental. Entenda seus pontos fortes e áreas para desenvolvimento em apenas 5 minutos.
          </p>
          <Button
            onClick={onStartQuiz}
            size="lg"
            className="text-lg px-10 py-6"
          >
            Começar Agora
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <Card className="text-center hover:border-amber-500/50 transition-all duration-300 transform hover:-translate-y-2">
            <CardContent className="pt-8">
              <div className="p-4 bg-slate-700/50 rounded-full inline-block mb-4">
                <Zap className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-100">Rápido e Preciso</h3>
              <p className="text-gray-400">
                Complete a avaliação em 5 minutos com perguntas baseadas em ciência comportamental.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:border-amber-500/50 transition-all duration-300 transform hover:-translate-y-2">
            <CardContent className="pt-8">
               <div className="p-4 bg-slate-700/50 rounded-full inline-block mb-4">
                <TrendingUp className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-100">Análise com IA</h3>
              <p className="text-gray-400">
                Relatório com interpretações e recomendações únicas geradas por Inteligência Artificial.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:border-amber-500/50 transition-all duration-300 transform hover:-translate-y-2">
            <CardContent className="pt-8">
               <div className="p-4 bg-slate-700/50 rounded-full inline-block mb-4">
                <Award className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-100">Crescimento Contínuo</h3>
              <p className="text-gray-400">
                Identifique áreas de melhoria e receba um plano de ação para seu desenvolvimento profissional.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-slate-800/60 rounded-2xl p-8 sm:p-12">
          <h3 className="text-3xl font-bold text-gray-100 mb-10 text-center">
            Como Funciona
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { num: 1, title: "Responda", desc: "Responda 25 perguntas sobre seu comportamento no trabalho." },
              { num: 2, title: "Veja a Prévia", desc: "Receba uma amostra intrigante da sua análise gerada por IA." },
              { num: 3, title: "Desbloqueie", desc: "Faça o pagamento seguro para acessar seu relatório completo." },
              { num: 4, title: "Analise", desc: "Receba seus resultados com gráficos e recomendações detalhadas." },
            ].map((step) => (
              <div key={step.num} className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center text-2xl font-bold mx-auto mb-4 ring-8 ring-amber-500/20">
                  {step.num}
                </div>
                <h4 className="font-bold text-lg text-gray-100 mb-2">{step.title}</h4>
                <p className="text-sm text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-gray-950 text-white mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p>© 2024 Quiz Comportamental. Todos os direitos reservados.</p>
          <p className="text-sm text-gray-400 mt-2">
            Suas respostas são confidenciais e usadas exclusivamente para gerar seu relatório.
          </p>
        </div>
      </footer>
    </div>
  );
}
