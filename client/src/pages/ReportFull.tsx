import React, { useEffect, useState, useRef } from 'react';
import { fetchFullReport } from '../services/apiService';
import { FullReportData } from '../types';
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
  onRestart?: () => void;
}

const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // 3 segundos

export const ReportFull: React.FC<ReportFullProps> = ({ transactionId, onRestart }) => {
  const [report, setReport] = useState<FullReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const retryCount = useRef(0);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const data = await fetchFullReport(transactionId);
        setReport(data);
        setLoading(false);
      } catch (err: any) {
        // Se o erro for de pagamento pendente, ou o servidor "esqueceu", tentamos de novo
        if (retryCount.current < MAX_RETRIES) {
          retryCount.current++;
          console.log(`Relatório não encontrado ou pendente. Tentativa ${retryCount.current}/${MAX_RETRIES} em ${RETRY_DELAY / 1000}s...`);
          setTimeout(loadReport, RETRY_DELAY);
        } else {
          setError(err.message === 'PAYMENT_REQUIRED' ? 'Seu pagamento ainda está sendo processado. Por favor, aguarde alguns instantes e tente novamente.' : 'Falha ao carregar o relatório após várias tentativas.');
          setLoading(false);
        }
      }
    };
    loadReport();
  }, [transactionId]);

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
        <h2 className="text-2xl font-bold mb-2">Validando seu Acesso...</h2>
        <p className="text-slate-400 max-w-md">Estamos confirmando seu pagamento e gerando seu dossiê exclusivo. Isso pode levar alguns segundos.</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 font-sans text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Erro ao Carregar Relatório</h2>
        <p className="text-slate-400 mb-6 max-w-md">{error || 'Não foi possível encontrar os dados do seu relatório.'}</p>
        <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </div>
    );
  }
  
  const chartData = { /* ... (código do gráfico mantido igual) ... */ };
  const chartOptions = { /* ... (código do gráfico mantido igual) ... */ };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 animate-fade-in print-content">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20 shadow-lg no-print">
        {/* ... (código do header mantido igual) ... */}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-20">
        {/* ... (todo o conteúdo do relatório aqui, exatamente como estava antes) ... */}
      </main>
    </div>
  );
};
