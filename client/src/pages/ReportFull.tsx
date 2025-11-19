import React, { useEffect, useState } from 'react';
import { fetchFullReport, FullReportData } from '../services/apiService';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CheckCircle, Target, TrendingUp, Lock, Download, LogOut, Share2, AlertTriangle } from 'lucide-react';
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

// DADOS DE FALLBACK (Segurança)
const FALLBACK_REPORT: FullReportData = {
  archetype: "Estrategista em Potencial",
  summary: "Sua análise indica um perfil com alta capacidade de adaptação, porém com desafios claros em foco e execução.",
  dimensions: [
    { name: "Foco", score: 65, analysis: "Análise de foco..." },
    { name: "Adaptabilidade", score: 85, analysis: "Análise de adaptabilidade..." },
    { name: "Inovação", score: 70, analysis: "Análise de inovação..." },
    { name: "Coragem", score: 60, analysis: "Análise de coragem..." },
    { name: "Inteligência Social", score: 75, analysis: "Análise social..." }
  ],
  blindSpot: "Dificuldade em dizer 'não' para demandas urgentes.",
  actionPlan: ["Ação 1", "Ação 2", "Ação 3"]
};

export const ReportFull: React.FC<ReportFullProps> = ({ transactionId, onRestart }) => {
  const [report, setReport] = useState<FullReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const data = await fetchFullReport(transactionId);
        if (!data || !data.dimensions) throw new Error("Dados inválidos");
        setReport(data);
      } catch (err: any) {
        console.error("Erro ao carregar:", err);
        if (err.message === 'PAYMENT_REQUIRED') {
          setError('PAYMENT_REQUIRED');
        } else {
          // Se for erro de ID não encontrado (que é o seu caso), mostra erro na tela
          setError('Relatório não encontrado ou expirado.');
        }
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, [transactionId]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
        try { await navigator.share({ title: 'Dossiê', url }); } catch (e) {}
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 text-center font-sans">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold mb-2">Carregando...</h2>
      </div>
    );
  }

  // TELA DE ERRO (ONDE VOCÊ ESTÁ PRESO)
  if (error && error !== 'PAYMENT_REQUIRED') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 text-center font-sans">
         <div className="bg-red-900/20 p-6 rounded-full mb-6 border border-red-800">
            <AlertTriangle className="w-12 h-12 text-red-500" />
         </div>
         <h2 className="text-2xl font-bold mb-2">Sessão Expirada ou Inválida</h2>
         <p className="text-slate-400 mb-8 max-w-md">
            Não conseguimos recuperar seu relatório antigo. Isso acontece quando o servidor reinicia. Por favor, inicie uma nova análise.
         </p>
         
         {/* BOTÃO SALVADOR */}
         <Button onClick={onRestart} size="lg">
            Começar Novo Teste
         </Button>
      </div>
    );
  }

  if (error === 'PAYMENT_REQUIRED') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 font-sans">
        <Lock className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Acesso Pendente</h2>
        <div className="flex gap-4 flex-col sm:flex-row">
            <Button onClick={() => window.location.reload()}>Verificar</Button>
            {onRestart && <Button variant="ghost" onClick={onRestart}>Sair</Button>}
        </div>
      </div>
    );
  }

  if (!report) return null;

  // ... (Resto do código do relatório/gráfico igual ao anterior)
  const safeDimensions = report.dimensions || FALLBACK_REPORT.dimensions;
  const chartData = {
    labels: safeDimensions.map(d => d.name),
    datasets: [{
        label: 'Seu Perfil',
        data: safeDimensions.map(d => d.score),
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 2,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#f59e11',
    }]
  };
  const chartOptions = { scales: { r: { suggestedMin: 0, suggestedMax: 100, ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { color: '#94a3b8' } } } };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 animate-fade-in print-content">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20 shadow-lg no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Target className="text-amber-500 w-5 h-5" />
            <h1 className="font-bold text-lg">Dossiê de Performance</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleShare}>{copied ? 'Copiado!' : 'Salvar Link'}</Button>
            <Button size="sm" variant="primary" onClick={() => window.print()}><Download className="w-4 h-4 mr-2" /> PDF</Button>
            {onRestart && <Button size="sm" variant="ghost" onClick={onRestart}><LogOut className="w-4 h-4" /></Button>}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        <section className="text-center break-inside-avoid">
            <h1 className="text-4xl font-bold text-white mb-4">{report.archetype}</h1>
            <Card className="bg-slate-900 border-slate-800"><CardContent className="p-8 text-lg italic text-slate-300">"{report.summary}"</CardContent></Card>
        </section>
        <section className="flex justify-center break-inside-avoid">
            <div className="w-full max-w-md h-[400px] bg-slate-900 p-4 rounded-xl border border-slate-800">
                <Radar data={chartData} options={chartOptions} />
            </div>
        </section>
        {/* ... Resto do conteúdo ... */}
        <div className="text-center text-slate-600 text-sm mt-10">Relatório gerado em {new Date().toLocaleDateString()}</div>
      </main>
    </div>
  );
};
