import React from 'react';
import { Button } from '../components/ui/Button';
import { Zap, Shield, TrendingUp, BrainCircuit } from 'lucide-react';

interface HomeProps {
  onStart: () => void;
}

export const Home: React.FC<HomeProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
            <BrainCircuit className="text-amber-500 w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight">Apex<span className="text-amber-500">Profile</span></h1>
        </div>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center px-4 text-center py-12">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            Existe um Padrão Oculto ditando seus Resultados. <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Nós o encontramos.</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Profissionais de alta performance são freados por 'pontos cegos' que não conseguem ver. Em menos de 3 minutos, nosso sistema de análise mapeia seus micro-comportamentos para revelar a causa raiz da sua estagnação — e o plano de ação para seu próximo salto de performance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button size="lg" onClick={onStart} className="w-full sm:w-auto shadow-amber-500/20 shadow-2xl animate-pulse-slow">
              INICIAR ANÁLISE E REVELAR MEU PADRÃO
            </Button>
          </div>
        </div>
        <div className="mt-16 grid md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
          <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
            <Zap className="text-amber-500 mb-4 h-8 w-8" />
            <h3 className="text-white font-bold text-lg mb-2">Precisão Cirúrgica</h3>
            <p className="text-slate-400 text-sm">Análise calibrada com um banco de dados de milhares de perfis de executivos para uma precisão implacável.</p>
          </div>
          <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
            <TrendingUp className="text-amber-500 mb-4 h-8 w-8" />
            <h3 className="text-white font-bold text-lg mb-2">Plano Acionável</h3>
            <p className="text-slate-400 text-sm">Vá além da teoria. Receba um protocolo de ações imediatas para transformar insights em resultados tangíveis.</p>
          </div>
          <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
            <Shield className="text-amber-500 mb-4 h-8 w-8" />
            <h3 className="text-white font-bold text-lg mb-2">100% Confidencial</h3>
            <p className="text-slate-400 text-sm">Suas respostas são criptografadas e seu relatório é estritamente pessoal. Seus dados são apagados após a geração.</p>
          </div>
        </div>
      </main>
      <footer className="p-6 text-center text-slate-600 text-sm">
        &copy; {new Date().getFullYear()} ApexProfile Analysis. Todos os direitos reservados.
      </footer>
    </div>
  );
};
