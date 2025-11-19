import React, { useEffect, useState } from 'react';
import { fetchFullReport, FullReportData } from '../services/apiService';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CheckCircle, Target, TrendingUp, Lock, Download, LogOut, Share2, Brain, Zap, AlertTriangle } from 'lucide-react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface ReportFullProps {
  transactionId: string;
  onRestart?: () => void;
}

export const ReportFull: React.FC<ReportFullProps> = ({ transactionId, onRestart }) => {
  const [report, setReport] = useState<FullReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const data = await fetchFullReport(transactionId);
        setReport(data);
      } catch (err: any) {
        if (err.message === 'PAYMENT_REQUIRED') {
          setError('PAYMENT_REQUIRED');
        } else {
          setError('Falha ao carregar o relatório.');
        }
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, [transactionId]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 text-center font-sans">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold mb-2">Processando Análise Profunda...</h2>
        <p className="text-slate-400 max-w-md">A IA está correlacionando suas respostas com 5 pilares de performance para gerar seu dossiê exclusivo.</p>
      </div>
    );
  }

  if (error === 'PAYMENT_REQUIRED') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 font-sans">
        <Lock className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Acesso Pendente</h2>
        <p className="text-slate-400 mb-6 text-center">Aguardando confirmação...</p>
        <div className="flex gap-4">
          <Button onClick={() => window.location.reload()}>Verificar</Button>
          {onRestart && <Button variant="ghost" onClick={onRestart}>Sair</Button>}
        </div>
      </div>
    );
  }

  if (!report) return null;

  const chartData = {
    labels: report.dimensions.map(d => d.name),
    datasets: [
      {
        label: 'Seu Perfil',
        data: report.dimensions.map(d => d.score),
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 2,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#f59e11',
      },
      {
        label: 'Benchmark Global',
        data: [80, 80, 80, 80, 80],
        backgroundColor: 'rgba(148, 163, 184, 0.05)',
        borderColor: 'rgba(148, 163, 184, 0.2)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
      }
    ],
  };

  const chartOptions = {
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        pointLabels: { color: '#94a3b8', font: { size: 10, weight: 'bold' as const } },
        ticks: { display: false },
        suggestedMin: 0,
        suggestedMax: 100,
      }
    },
    plugins: { legend: { labels: { color: '#cbd5e1' } } },
    maintainAspectRatio: false
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 animate-fade-in print-content">
      
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20 shadow-lg no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Target className="text-amber-500 w-5 h-5" />
            <h1 className="font-bold text-lg hidden sm:block">Dossiê Executivo</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleShare}>{copied ? 'Link Copiado' : 'Salvar Link'}</Button>
            <Button size="sm" onClick={() => window.print()}><Download className="w-4 h-4 mr-2" /> PDF</Button>
            {onRestart && <Button size="sm" variant="ghost" onClick={onRestart} title="Nova Análise"><LogOut className="w-4 h-4" /></Button>}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-16">
        
        {/* 1. IDENTIDADE (ARQUÉTIPO) */}
        <section className="text-center space-y-8 break-inside-avoid">
          <div>
            <span className="text-amber-500 text-xs font-bold tracking-[0.2em] uppercase mb-3 block">Diagnóstico Final</span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
              {report.archetype}
            </h1>
            <div className="w-24 h-1 bg-amber-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="bg-slate-900/50 border-l-4 border-amber-500 p-6 md:p-10 text-left rounded-r-xl">
             <p className="text-lg md:text-xl text-slate-300 leading-relaxed whitespace-pre-line font-light">
               {report.summary}
             </p>
          </div>
        </section>

        {/* 2. RAIO-X TÉCNICO */}
        <section className="grid lg:grid-cols-2 gap-12 items-start break-inside-avoid">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col items-center shadow-2xl">
             <h3 className="text-white font-bold mb-4 flex items-center gap-2"><TrendingUp className="text-amber-500 w-5 h-5"/> Mapa de Competências</h3>
             <div className="w-full aspect-square max-w-[400px] relative">
                <Radar data={chartData} options={chartOptions} />
             </div>
          </div>
          
          <div className="space-y-6">
             {report.dimensions.map((dim) => (
               <div key={dim.name} className="bg-slate-900/30 rounded-xl p-5 border border-slate-800/50 hover:border-amber-500/20 transition-colors">
                 <div className="flex justify-between items-center mb-3">
                   <h4 className="font-bold text-white text-lg">{dim.name}</h4>
                   <span className={`text-sm font-mono px-2 py-1 rounded font-bold ${dim.score > 75 ? 'bg-green-500/10 text-green-400' : dim.score < 50 ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                     {dim.score}/100
                   </span>
                 </div>
                 <p className="text-slate-400 text-sm leading-relaxed border-t border-slate-800 pt-3">
                   {dim.analysis}
                 </p>
               </div>
             ))}
          </div>
        </section>

        {/* 3. A VERDADE BRUTAL (PONTO CEGO) */}
        <section className="break-inside-avoid">
          <div className="bg-gradient-to-r from-red-950/40 to-slate-900 border border-red-900/30 rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-center shadow-[0_0_30px_rgba(127,29,29,0.1)]">
             <div className="bg-red-500/10 p-4 rounded-full shrink-0">
               <AlertTriangle className="text-red-500 w-10 h-10" />
             </div>
             <div className="text-center md:text-left">
               <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wider">Alerta de Ponto Cego</h3>
               <p className="text-red-100/90 text-lg font-medium italic">
                 "{report.blindSpot}"
               </p>
             </div>
          </div>
        </section>

        {/* 4. PROTOCOLO DE AÇÃO */}
        <section className="bg-slate-900 rounded-3xl p-8 md:p-12 border border-slate-800 relative overflow-hidden break-inside-avoid">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-10 text-center relative z-10 flex justify-center items-center gap-3">
            <Zap className="text-amber-500 w-8 h-8" /> Plano de Ação Imediato
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6 relative z-10">
            {report.actionPlan.map((action, idx) => (
              <div key={idx} className="bg-slate-950 p-6 rounded-xl border-l-4 border-amber-600 shadow-lg flex gap-4">
                <span className="text-4xl font-bold text-slate-800">{idx + 1}</span>
                <p className="text-slate-200 text-lg leading-relaxed self-center">{action}</p>
              </div>
            ))}
          </div>
        </section>
        
        <div className="text-center pb-10 pt-10 border-t border-slate-800/50">
           <Button variant="ghost" onClick={onRestart} className="text-slate-500 hover:text-white">
             Fazer Nova Análise
           </Button>
           <p className="text-slate-700 text-xs mt-4 font-mono">ID: {transactionId} • Gerado em {new Date().toLocaleDateString()}</p>
        </div>

      </main>
    </div>
  );
};
