import React from 'react';
import { Button } from '../components/ui/Button';
import { Zap, Shield, TrendingUp } from 'lucide-react';

interface HomeProps {
  onStart: () => void;
}

export const Home: React.FC<HomeProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-6 flex justify-between items-center max-w-6xl mx-auto w-full">
        <h1 className="text-xl font-bold text-white tracking-tight">Apex<span className="text-amber-500">Profile</span></h1>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-4 text-center py-12">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
            Baseado em Ciência Comportamental Avançada
          </div>
          
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            Descubra o <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Padrão Oculto</span> que define seu Sucesso
          </h2>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            92% dos executivos falham por não conhecerem seus pontos cegos. Nossa IA analisa 25 micro-comportamentos para revelar seu verdadeiro arquétipo em menos de 3 minutos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button size="lg" onClick={onStart} className="w-full sm:w-auto shadow-amber-500/20 shadow-2xl animate-pulse-slow">
              INICIAR ANÁLISE GRATUITA
            </Button>
            <p className="text-slate-500 text-xs sm:mt-0 mt-2 uppercase tracking-wider">
              Tempo estimado: 2 min 45s
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
            <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
              <Zap className="text-amber-500 mb-4 h-8 w-8" />
              <h3 className="text-white font-bold text-lg mb-2">Precisão Cirúrgica</h3>
              <p className="text-slate-400 text-sm">Algoritmos calibrados com milhares de perfis de alta performance.</p>
            </div>
            <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
              <TrendingUp className="text-amber-500 mb-4 h-8 w-8" />
              <h3 className="text-white font-bold text-lg mb-2">Feedback Acionável</h3>
              <p className="text-slate-400 text-sm">Não apenas teoria. Receba um plano prático para desbloquear seu próximo nível.</p>
            </div>
            <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
              <Shield className="text-amber-500 mb-4 h-8 w-8" />
              <h3 className="text-white font-bold text-lg mb-2">100% Confidencial</h3>
              <p className="text-slate-400 text-sm">Seus dados são criptografados e usados apenas para gerar seu relatório.</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="p-6 text-center text-slate-600 text-sm">
        &copy; {new Date().getFullYear()} ApexProfile Analysis. Todos os direitos reservados.
      </footer>
    </div>
  );
};
