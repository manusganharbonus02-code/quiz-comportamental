import React, { useEffect, useState } from 'react';
import { fetchFullReport, FullReportData } from '../services/apiService';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CheckCircle, Target, TrendingUp, Lock, Download, LogOut } from 'lucide-react';
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
  onRestart?: () => void; // Nova propriedade opcional
}

export const ReportFull: React.FC<ReportFullProps> = ({ transactionId, onRestart }) => {
  const [report, setReport] = useState<FullReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const data = await fetchFullReport(transactionId);
        setReport(data);
      } catch (err: any) {
        if (err.message === 'PAYMENT_REQUIRED') {
          setError('PAYMENT_REQUIRED');
        } else {
          console.error(err);
          setError('Falha ao carregar o relatório.');
        }
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, [transactionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 text-center font-sans">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold mb-2">Gerando Dossiê Executivo...</h2>
        <p className="text-slate-400 max-w-md">A Inteligência Artificial está compilando seus gráficos e estratégias personalizadas.</p>
      </div>
    );
  }

  if (error === 'PAYMENT_REQUIRED') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 font-sans">
        <div className="bg-red-500/10 p-6 rounded-full mb-6">
            <Lock className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Acesso Pendente</h2>
        <p className="text-slate-400 mb-6 text-center max-w-md">
            Ainda não confirmamos seu pagamento. Se você já pagou, aguarde cerca de 10 segundos e clique no botão abaixo.
        </p>
        <div className="flex gap-4">
            <Button onClick={() => window.location.reload()}>Verificar Novamente</Button>
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
        label: 'Média Executiva',
        data: [75, 70, 65, 80, 75],
        backgroundColor: 'rgba(148, 163, 184, 0.05)',
        borderColor: 'rgba(148, 163, 184, 0.3)',
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
        pointLabels: { color: '#94a3b8', font: { size: 11, weight: 'bold' as const } },
        ticks: { display: false, backdropColor: 'transparent' },
        suggestedMin: 0,
        suggestedMax: 100,
      }
    },
    plugins: {
      legend: { labels: { color: '#cbd5e1', font: { family: 'Inter' } } }
    },
    maintainAspectRatio: false
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 animate-fade-in">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500/10 p-2 rounded-lg">
                <Target className="text-amber-500 w-5 h-5" />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-white">Dossiê de Performance</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()} className="hidden sm:flex">
                <Download className="w-4 h-4 mr-2" /> Salvar PDF
            </Button>
            {onRestart && (
                <Button size="sm" variant="ghost" onClick={onRestart} title="Sair">
                    <LogOut className="w-4 h-4" />
                </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* CONTEÚDO DO RELATÓRIO (CÓDIGO EXISTENTE MANTIDO, SÓ ADICIONADO O HEADER ACIMA) */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold tracking-widest uppercase">
            Resultado da Análise
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
            {report.archetype}
          </h1>
          <Card className="bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800 shadow-2xl max-w-4xl mx-auto">
            <CardContent className="p-8 sm:p-10">
                <p className="text-lg md:text-xl text-slate-300 leading-relaxed italic">"{report.summary}"</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid lg:grid-cols-2 gap-8 items-center">
          <Card className="h-[400px] flex items-center justify-center p-4 bg-slate-900 border-slate-800 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-600 opacity-50"></div>
             <div className="w-full h-full relative z-10">
                <Radar data={chartData} options={chartOptions} />
             </div>
          </Card>
          <div className="space-y-6">
             <div>
               <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                 <TrendingUp className="text-amber-500 w-6 h-6" /> Raio-X de Competências
               </h3>
               <p className="text-slate-400 text-sm">Comparativo direto entre o seu perfil atual e o benchmark de líderes.</p>
             </div>
             <div className="space-y-4">
               {report.dimensions.map((dim) => (
                 <div key={dim.name} className="group">
                   <div className="flex justify-between items-end mb-2">
                     <span className={`font-medium text-sm transition-colors ${dim.score > 75 ? 'text-green-400' : dim.score < 40 ? 'text-red-400' : 'text-slate-200'}`}>
                       {dim.name}
                     </span>
                     <span className="text-xs font-mono text-slate-500">{dim.score}/100</span>
                   </div>
                   <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                     <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${dim.score > 75 ? 'bg-green-500' : dim.score < 40 ? 'bg-red-500' : 'bg-amber-500'}`} 
                        style={{width: `${dim.score}%`}}
                     ></div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </section>

        <section>
            <Card className="border-red-500/30 bg-gradient-to-r from-red-950/20 to-slate-900/50">
            <CardContent className="p-8 flex flex-col md:flex-row gap-6 items-start">
                <div className="bg-red-500/10 p-4 rounded-full shrink-0 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <Lock className="text-red-500 w-8 h-8" />
                </div>
                <div>
                <h3 className="text-xl font-bold text-white mb-2">Ponto Cego Crítico Identificado</h3>
                <p className="text-red-200/80 leading-relaxed text-lg">{report.blindSpot}</p>
                </div>
            </CardContent>
            </Card>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px flex-1 bg-slate-800"></div>
            <h3 className="text-lg font-bold text-slate-400 uppercase tracking-wider">Análise Profunda por Pilar</h3>
            <div className="h-px flex-1 bg-slate-800"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {report.dimensions.map((dim) => (
              <Card key={dim.name} className="hover:border-slate-600 transition-all duration-300 hover:-translate-y-1 bg-slate-800/30">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-amber-500 font-bold uppercase text-xs tracking-wider">{dim.name}</h4>
                    <div className={`w-2 h-2 rounded-full ${dim.score > 70 ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{dim.analysis}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-slate-900 rounded-3xl p-8 md:p-12 border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-10 text-center relative z-10">Seu Plano de Ação Imediato</h3>
          <div className="space-y-6 max-w-3xl mx-auto relative z-10">
            {report.actionPlan.map((action, idx) => (
              <div key={idx} className="flex gap-6 items-start group">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {idx + 1}
                </div>
                <div className="pt-1"><p className="text-slate-200 text-lg leading-relaxed">{action}</p></div>
              </div>
            ))}
          </div>
        </section>
        
        <div className="text-center pb-10 pt-4">
            <p className="text-slate-600 text-sm">Relatório gerado via Inteligência Artificial Comportamental em {new Date().toLocaleDateString()}</p>
        </div>
      </main>
    </div>
  );
};
