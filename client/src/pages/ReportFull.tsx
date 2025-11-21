import React, { useEffect, useState } from 'react';
import { generateFullReport } from '../services/apiService'; // Usando a nova função
import { FullReportData, QuizData } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import {
  BrainCircuit, ShieldCheck, Binary, SlidersHorizontal, Sparkles, Flame, EyeOff, CheckSquare,
  TrendingUp, Lock, Download, LogOut, AlertOctagon, AlertTriangle, Library
} from 'lucide-react';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface ReportFullProps {
  transactionId: string;
  quizContext: QuizData; // Recebe o contexto do quiz (perguntas e respostas)
  onRestart?: () => void;
}

export const ReportFull: React.FC<ReportFullProps> = ({ transactionId, quizContext, onRestart }) => {
  const [report, setReport] = useState<FullReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      if (!quizContext || !quizContext.answers) {
          setError("Dados do quiz não foram encontrados. Por favor, reinicie a avaliação.");
          setLoading(false);
          return;
      }
      try {
        // Agora, enviamos os dados do quiz para o servidor gerar o relatório sob demanda
        const data = await generateFullReport(quizContext);
        setReport(data);
      } catch (err: any) {
        console.error("Error generating full report:", err);
        setError('Falha ao gerar o relatório. A IA pode estar indisponível no momento.');
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, [quizContext]);

  const handleShare = () => {
    const url = `${window.location.origin}/?tid=${transactionId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 text-center font-sans">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold mb-2">Gerando Dossiê Completo...</h2>
        <p className="text-slate-400 max-w-md">Nossa IA está compilando seus dados e gerando seu plano de ação exclusivo.</p>
      </div>
    );
  }

  if (error || !report) {
     return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 font-sans text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Erro ao Carregar Relatório</h2>
        <p className="text-slate-400 mb-6 max-w-md">{error || 'Não foi possível gerar os dados do seu relatório.'}</p>
        {onRestart && <Button onClick={onRestart}>Fazer Nova Análise</Button>}
      </div>
    );
  }

  const chartData = {
    labels: report.dimensions.map(d => d.name),
    datasets: [{
      label: 'Seu Perfil',
      data: report.dimensions.map(d => d.score),
      backgroundColor: 'rgba(245, 158, 11, 0.2)',
      borderColor: 'rgba(245, 158, 11, 1)',
      borderWidth: 2,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#f59e0b',
    }],
  };
  const chartOptions = {
    scales: { r: { angleLines: { color: 'rgba(255, 255, 255, 0.1)' }, grid: { color: 'rgba(255, 255, 255, 0.1)' }, pointLabels: { color: '#94a3b8', font: { size: 12 } }, ticks: { display: false }, suggestedMin: 0, suggestedMax: 100 } },
    plugins: { legend: { display: false } },
    maintainAspectRatio: false
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 animate-fade-in print-content">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20 shadow-lg no-print">
        <div className="bg-amber-900/30 border-b border-amber-900/50 py-2 px-4 text-center">
          <p className="text-amber-200 text-xs font-bold flex items-center justify-center gap-2">
            <AlertOctagon className="w-4 h-4" />
            ATENÇÃO: Salve este relatório agora (PDF ou Link). Ao fechar esta página, os dados serão apagados por segurança.
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BrainCircuit className="text-amber-500 w-6 h-6" />
            <h1 className="font-bold text-lg hidden sm:block">Dossiê Comportamental</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleShare}>{copied ? 'Link Copiado!' : 'Salvar Link'}</Button>
            <Button size="sm" onClick={() => window.print()}><Download className="w-4 h-4 mr-2" /> Baixar PDF</Button>
            {onRestart && <Button size="sm" variant="ghost" onClick={onRestart} title="Sair e Apagar"><LogOut className="w-4 h-4" /></Button>}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-20">
        
        <section className="space-y-10">
          <div className="text-center">
            <span className="text-amber-500 text-sm font-bold tracking-widest uppercase">Diagnóstico Comportamental</span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mt-2">
              {report.archetype}
            </h1>
          </div>

          <Card className="p-8 md:p-10 bg-slate-900/30 border-t-4 border-amber-500">
            <h2 className="text-2xl font-bold text-white mb-4">Sumário Executivo</h2>
            <p className="text-lg text-slate-300 leading-relaxed whitespace-pre-line">{report.summary}</p>
          </Card>

          <div className="grid md:grid-cols-3 gap-4 text-center text-sm">
            <Card className="p-4 bg-slate-900/50"><p><ShieldCheck className="w-4 h-4 inline mr-2 text-green-400"/> Confiabilidade: <span className="font-bold">{report.validation.reliabilityIndex}%</span></p></Card>
            <Card className="p-4 bg-slate-900/50"><p><Binary className="w-4 h-4 inline mr-2 text-cyan-400"/> Padrão: <span className="font-mono font-bold">{report.pattern.formula}</span></p></Card>
            <Card className="p-4 bg-slate-900/50"><p><SlidersHorizontal className="w-4 h-4 inline mr-2 text-purple-400"/> Metodologia: <span className="font-bold">{report.validation.methodology}</span></p></Card>
          </div>
        </section>

        <section className="space-y-12">
           <div className="text-center">
             <h2 className="text-3xl font-bold text-white">Raio-X Técnico</h2>
             <p className="text-slate-400 mt-2">Uma análise aprofundada das suas competências centrais.</p>
           </div>
           
           <div className="grid lg:grid-cols-2 gap-12 items-center">
             <div className="w-full aspect-square max-w-[450px] mx-auto relative">
                <Radar data={chartData} options={chartOptions} />
              </div>
              <div className="space-y-6">
                {report.dimensions.map((dim) => (
                  <div key={dim.name}>
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-white">{dim.name}</h4>
                      <span className="font-mono text-sm font-bold text-amber-400">{dim.score}/100</span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2.5">
                        <div className="bg-amber-500 h-2.5 rounded-full" style={{width: `${dim.score}%`}}></div>
                    </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="grid md:grid-cols-2 gap-8">
                <Card className="p-6">
                    <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Sparkles className="text-yellow-400 w-5 h-5"/> Drivers de Motivação</h3>
                    <ul className="list-disc list-inside text-slate-300 space-y-2">
                        {report.coreDrivers.motivation.map(m => <li key={m}>{m}</li>)}
                    </ul>
                </Card>
                <Card className="p-6">
                    <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Flame className="text-red-400 w-5 h-5"/> Fatores de Fricção</h3>
                    <ul className="list-disc list-inside text-slate-300 space-y-2">
                        {report.coreDrivers.friction.map(f => <li key={f}>{f}</li>)}
                    </ul>
                </Card>
           </div>
           
           {report.subFactors && (
             <div>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white">Análise 360° de Subfatores</h2>
                  <p className="text-slate-400 mt-2">Como seus traços se manifestam em situações específicas.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {report.subFactors.map(sub => (
                        <Card key={sub.name} className="p-6">
                           <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Library className="text-purple-400 w-5 h-5"/> {sub.name}</h3>
                           <p className="text-slate-300 text-sm">{sub.analysis}</p>
                        </Card>
                    ))}
                </div>
             </div>
           )}

        </section>

        <section className="space-y-12">
            <Card className="bg-gradient-to-r from-red-900/20 to-slate-900 border border-red-800/50 p-8 flex flex-col md:flex-row gap-6 items-center">
                <div className="bg-red-500/10 p-4 rounded-full flex-shrink-0">
                    <EyeOff className="text-red-400 w-10 h-10" />
                </div>
                <div className="text-center md:text-left">
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">{report.blindSpot.title}</h2>
                    <p className="text-red-200/90 text-lg mt-1 italic">"{report.blindSpot.description}"</p>
                </div>
            </Card>

            <div className="text-center">
             <h2 className="text-3xl font-bold text-white">Protocolo de Desenvolvimento</h2>
             <p className="text-slate-400 mt-2">Seu plano de ação para otimização de performance.</p>
           </div>
            <div className="grid md:grid-cols-2 gap-6">
                {report.actionPlan.map((plan, idx) => (
                    <Card key={idx} className="p-6 border-l-4 border-green-500 bg-slate-900/50">
                        <h3 className="font-bold text-lg text-white mb-3 flex items-center gap-3"><CheckSquare className="text-green-400 w-6 h-6"/> {plan.action}</h3>
                        <p className="text-sm text-slate-400 mb-2"><span className="font-bold text-slate-300">Racional:</span> {plan.rationale}</p>
                        <p className="text-sm text-green-300/80"><span className="font-bold text-green-300">Benefício (ROI):</span> {plan.expectedBenefit}</p>
                    </Card>
                ))}
            </div>
        </section>

        <footer className="text-center pt-10 border-t border-slate-800/50 no-print">
            {onRestart && <Button variant="ghost" onClick={onRestart} className="text-slate-500 hover:text-white">
                Fazer Nova Análise (Apaga dados atuais)
            </Button>}
             <p className="text-slate-700 text-xs mt-4 font-mono">ID: {transactionId} • Gerado em {new Date().toLocaleDateString()}</p>
        </footer>
      </main>
    </div>
  );
};
