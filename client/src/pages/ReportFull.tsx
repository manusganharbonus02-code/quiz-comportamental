import React, { useEffect, useState } from 'react';
import { fetchFullReport, FullReportData } from '../services/apiService';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CheckCircle, Target, TrendingUp, Lock, Download, LogOut, Share2, Brain, Zap } from 'lucide-react';
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
        <h2 className="text-2xl font-bold mb-2">Gerando Dossiê Completo...</h2>
        <p className="text-slate-400 max-w-md">A IA está compilando seus dados brutos, cruzando padrões e gerando seu plano de ação exclusivo.</p>
      </div>
    );
  }

  if (error === 'PAYMENT_REQUIRED') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 font-sans">
        <Lock className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Acesso Pendente</h2>
        <p className="text-slate-400 mb-6 text-center">Aguardando confirmação do pagamento...</p>
        <Button onClick={() => window.location.reload()}>Verificar Novamente</Button>
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
        label: 'Alta Performance',
        data: [85, 85, 85, 85, 85],
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
            {onRestart && <Button size="sm" variant="ghost" onClick={onRestart}><LogOut className="w-4 h-4" /></Button>}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-16">
        
        {/* 1. ARQUÉTIPO */}
        <section className="text-center space-y-8 break-inside-avoid">
          <div>
            <span className="text-amber-500 text-sm font-bold tracking-widest uppercase mb-2 block">Identidade Comportamental</span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
              {report.archetype}
            </h1>
          </div>
          
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 rounded-2xl shadow-2xl text-left">
            <div className="prose prose-invert max-w-none">
               <p className="text-lg md:text-xl text-slate-300 leading-relaxed whitespace-pre-line">
                 {report.summary}
               </p>
            </div>
          </div>
        </section>

        {/* 2. VISUALIZAÇÃO TÉCNICA */}
        <section className="grid lg:grid-cols-2 gap-12 items-center break-inside-avoid">
          <div className="h-[450px] w-full bg-slate-900/50 rounded-2xl border border-slate-800 p-4 flex items-center justify-center relative">
             <div className="absolute top-4 right-4 text-xs text-slate-500">Comparativo vs. Mercado</div>
             <div className="w-full h-full">
                <Radar data={chartData} options={chartOptions} />
             </div>
          </div>
          
          <div className="space-y-8">
            <div>
               <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                 <TrendingUp className="text-amber-500 w-6 h-6" /> Mapeamento de Competências
               </h3>
               <p className="text-slate-400">Análise quantitativa dos seus 5 pilares fundamentais de performance.</p>
            </div>
             
             <div className="space-y-5">
               {report.dimensions.map((dim) => (
                 <div key={dim.name}>
                   <div className="flex justify-between items-end mb-2">
                     <span className="font-bold text-slate-200">{dim.name}</span>
                     <span className={`text-sm font-mono px-2 py-0.5 rounded ${dim.score > 75 ? 'bg-green-900/30 text-green-400' : dim.score < 50 ? 'bg-red-900/30 text-red-400' : 'bg-amber-900/30 text-amber-400'}`}>
                       {dim.score}/100
                     </span>
                   </div>
                   <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                     <div 
                        className={`h-full rounded-full ${dim.score > 75 ? 'bg-green-500' : dim.score < 50 ? 'bg-red-500' : 'bg-amber-500'}`} 
                        style={{width: `${dim.score}%`}}
                     ></div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </section>

        {/* 3. PONTO CEGO (VERDADE BRUTAL) */}
        <section className="break-inside-avoid">
          <div className="bg-gradient-to-r from-red-950/30 to-slate-900 border border-red-900/50 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start shadow-lg shadow-red-900/10">
             <div className="bg-red-500/10 p-5 rounded-full shrink-0 border border-red-500/20">
               <Brain className="text-red-500 w-10 h-10" />
             </div>
             <div>
               <h3 className="text-2xl font-bold text-white mb-4">Ponto Cego Crítico Detectado</h3>
               <p className="text-red-100/80 leading-relaxed text-lg border-l-4 border-red-500/50 pl-6 italic">
                 "{report.blindSpot}"
               </p>
             </div>
          </div>
        </section>

        {/* 4. ANÁLISE PROFUNDA (CARDS EXTENDIDOS) */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-800"></div>
            <h3 className="text-xl font-bold text-slate-400 uppercase tracking-wider">Detalhamento Técnico</h3>
            <div className="h-px flex-1 bg-slate-800"></div>
          </div>
          
          <div className="grid gap-6">
            {report.dimensions.map((dim) => (
              <Card key={dim.name} className="bg-slate-800/20 hover:bg-slate-800/40 transition-colors border-slate-700/50">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                    <h4 className="text-amber-500 font-bold text-lg uppercase tracking-wider min-w-[150px]">{dim.name}</h4>
                    <div className="h-px flex-1 bg-slate-700 hidden md:block"></div>
                    <span className="text-slate-500 text-xs uppercase font-bold">Impacto na Carreira</span>
                  </div>
                  <p className="text-slate-300 text-base leading-relaxed">
                    {dim.analysis}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 5. PLANO DE AÇÃO ESTRATÉGICO */}
        <section className="bg-slate-900 rounded-3xl p-8 md:p-12 border border-slate-800 relative overflow-hidden break-inside-avoid">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <h3 className="text-3xl font-bold text-white mb-12 text-center relative z-10 flex justify-center items-center gap-3">
            <Zap className="text-amber-500 w-8 h-8" /> Protocolo de Evolução
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6 relative z-10">
            {report.actionPlan.map((action, idx) => (
              <div key={idx} className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 flex gap-5 hover:border-amber-500/30 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-xl flex items-center justify-center shadow-lg">
                  {idx + 1}
                </div>
                <div>
                    <h5 className="text-white font-bold mb-2 text-sm uppercase tracking-wide text-slate-500">Passo {idx + 1}</h5>
                    <p className="text-slate-200 text-lg leading-relaxed">{action}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        <div className="text-center pb-10 pt-10 border-t border-slate-800/50">
            <p className="text-slate-600 text-sm">Relatório de Inteligência Comportamental &copy; {new Date().getFullYear()}</p>
            <p className="text-slate-700 text-xs mt-1 font-mono">ID: {transactionId}</p>
        </div>

      </main>
    </div>
  );
};
