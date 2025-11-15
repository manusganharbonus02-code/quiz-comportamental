import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Download, Home, Loader2, CheckCircle, CreditCard, AlertCircle } from "lucide-react";
import { Radar } from "react-chartjs-2";
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";
import { checkPaymentStatus, fetchReportData, simulateSuccessfulPayment, fetchReportPreview } from '../services/apiService';
import { ReportData, Answers } from "../types";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const KIWIFY_CHECKOUT_URL = 'https://pay.kiwify.com.br/RHpnrVL';

interface ReportPageProps {
  transactionId: string;
  answers: Answers;
  onRestart: () => void;
}

export default function ReportPage({ transactionId, answers, onRestart }: ReportPageProps) {
  const [stage, setStage] = useState<'preview' | 'selection' | 'waiting' | 'generating' | 'success' | 'error'>('preview');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [previewText, setPreviewText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const startPaymentProcess = () => {
    window.open(KIWIFY_CHECKOUT_URL, '_blank');
    simulateSuccessfulPayment(transactionId);
    setStage('waiting');
  };

  const generateFullReport = useCallback(async () => {
    setStage('generating');
    try {
        const data = await fetchReportData(transactionId);
        setReportData(data);
        setStage('success');
    } catch (err) {
        console.error("Failed to fetch report data:", err);
        setErrorMessage("Ocorreu um erro ao gerar seu relatório. Por favor, tente novamente.");
        setStage('error');
    }
  }, [transactionId]);

  const verifyPayment = useCallback(async () => {
    try {
      const response = await checkPaymentStatus(transactionId);
      if (response.status === 'PAID') {
        generateFullReport();
      }
    } catch (err) {
      console.error("Payment check failed:", err);
    }
  }, [transactionId, generateFullReport]);

  useEffect(() => {
    if (stage === 'preview' && !previewText) {
        setIsLoading(true);
        fetchReportPreview(answers)
            .then(text => setPreviewText(text))
            .catch(err => {
                console.error("Failed to fetch preview:", err);
                setPreviewText("Analisamos suas respostas e identificamos um padrão fascinante em sua abordagem para desafios, mas também uma oportunidade única para ampliar seu impacto. O relatório completo detalha como transformar esse potencial em resultados concretos.");
            })
            .finally(() => setIsLoading(false));
    }
  }, [stage, answers, previewText]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (stage === 'waiting') {
      verifyPayment();
      interval = setInterval(verifyPayment, 3000);
    }
    return () => clearInterval(interval);
  }, [stage, verifyPayment]);
  
  useEffect(() => {
    let countdownInterval: ReturnType<typeof setInterval>;
    if (stage === 'waiting') {
      countdownInterval = setInterval(() => {
        setCountdown(prev => (prev > 1 ? prev - 1 : 3));
      }, 1000);
    }
    return () => clearInterval(countdownInterval);
  }, [stage]);

  const radarData = {
    labels: ["Foco", "Produtividade", "Resiliência"],
    datasets: [
      {
        label: "Sua Pontuação",
        data: [reportData?.scores.Foco || 0, reportData?.scores.Produtividade || 0, reportData?.scores.Resiliência || 0],
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.2)",
        borderWidth: 2,
        pointBackgroundColor: "#f59e0b",
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { r: { min: 0, max: 5, ticks: { stepSize: 1, backdropColor: 'transparent', color: 'rgba(255, 255, 255, 0.4)' }, pointLabels: { font: { size: 14, weight: 'bold' }, color: '#e2e8f0' }, grid: { color: 'rgba(255, 255, 255, 0.2)' } } },
    plugins: { legend: { display: false } }
  };
  
  const StageContent = () => {
    switch(stage) {
      case 'preview':
        if (isLoading) return <div className="text-center"><Loader2 className="w-12 h-12 text-amber-500 mx-auto animate-spin mb-4" /><p className="text-lg font-semibold text-gray-300">Analisando suas respostas...</p></div>;
        return (
            <div className="max-w-2xl mx-auto text-center"><Card><CardHeader><CardTitle className="text-3xl text-gray-100">Uma Amostra da Sua Análise</CardTitle></CardHeader><CardContent className="pt-2"><p className="text-gray-300 text-lg mb-8 min-h-[100px] flex items-center justify-center italic">"{previewText}"</p><Button onClick={() => setStage('selection')} size="lg" className="w-full text-lg">Desbloquear Relatório Completo por R$ 5,00</Button></CardContent></Card></div>
        );
      
      case 'selection':
        return (
            <div className="max-w-2xl mx-auto text-center"><div className="p-4 bg-amber-900/50 border-l-4 border-amber-500 rounded-r-lg mb-8"><p className="font-bold text-amber-300">Seu relatório está quase pronto!</p><p className="text-amber-400">Para desbloquear sua análise completa, finalize o pagamento seguro.</p></div><Card><CardHeader><CardTitle className="text-3xl text-gray-100">Desbloqueie seu Relatório</CardTitle></CardHeader><CardContent className="pt-2"><p className="text-gray-400 mb-6">Acesso vitalício por um pagamento único de:</p><p className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-8">R$ 5,00</p><Button onClick={startPaymentProcess} size="lg" className="w-full text-lg"><CreditCard className="w-5 h-5 mr-3" /> Pagar Agora e Desbloquear</Button><p className="text-xs text-gray-500 mt-4">Você será redirecionado para a plataforma de pagamento Kiwify.</p></CardContent></Card></div>
        );

      case 'waiting':
        return (
          <div className="max-w-md mx-auto text-center"><Card><CardContent className="pt-8 flex flex-col items-center"><div className="relative w-24 h-24 mb-6"><Loader2 className="w-16 h-16 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" /><svg className="w-full h-full" viewBox="0 0 100 100"><circle className="text-slate-700" stroke="currentColor" strokeWidth="8" cx="50" cy="50" r="42" fill="transparent" /><circle className="text-amber-500 transition-all duration-1000 linear" stroke="currentColor" strokeWidth="8" cx="50" cy="50" r="42" fill="transparent" strokeLinecap="round" transform="rotate(-90 50 50)" strokeDasharray={2 * Math.PI * 42} strokeDashoffset={(2 * Math.PI * 42) * (1 - (countdown / 3))} /></svg></div><h2 className="text-2xl font-bold text-gray-100 mb-2">Aguardando confirmação...</h2><p className="text-gray-400">Estamos verificando a confirmação do pagamento. Isso pode levar alguns instantes.</p><p className="text-sm text-gray-500 mt-4">Verificando em <span className="font-bold text-amber-400 text-base">{countdown}</span>s...</p></CardContent></Card></div>
        );

      case 'generating':
        return <div className="text-center"><Loader2 className="w-12 h-12 text-amber-500 mx-auto animate-spin mb-4" /><p className="text-lg font-semibold text-gray-300">Pagamento confirmado! Gerando seu relatório personalizado...</p></div>;

      case 'success':
        if (!reportData) return <div className="text-center"><Loader2 className="w-12 h-12 text-amber-500 mx-auto animate-spin mb-4" /></div>;
        return (
            <div className="space-y-8"><header className="text-center"><h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 tracking-tight">Seu Relatório Comportamental</h1><p className="mt-2 text-lg text-gray-400">Uma análise detalhada do seu perfil profissional.</p></header><Card><CardHeader><CardTitle>Visão Geral Gráfica</CardTitle></CardHeader><CardContent><div className="h-80 md:h-96"><Radar data={radarData} options={radarOptions} /></div></CardContent></Card><div className="grid md:grid-cols-3 gap-6"><Card><CardHeader><CardTitle>Foco: {reportData.scores.Foco.toFixed(1)} / 5.0</CardTitle></CardHeader><CardContent><p className="text-gray-400">{reportData.interpretations.Foco}</p></CardContent></Card><Card><CardHeader><CardTitle>Produtividade: {reportData.scores.Produtividade.toFixed(1)} / 5.0</CardTitle></CardHeader><CardContent><p className="text-gray-400">{reportData.interpretations.Produtividade}</p></CardContent></Card><Card><CardHeader><CardTitle>Resiliência: {reportData.scores.Resiliência.toFixed(1)} / 5.0</CardTitle></CardHeader><CardContent><p className="text-gray-400">{reportData.interpretations.Resiliência}</p></CardContent></Card></div><Card><CardHeader><CardTitle>Recomendações para Desenvolvimento</CardTitle></CardHeader><CardContent><ul className="space-y-4">{reportData.recommendations.map((rec, index) => (<li key={index} className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" /> <span className="text-gray-300">{rec}</span></li>))}</ul></CardContent></Card><div className="flex flex-col sm:flex-row gap-4 justify-center"><Button variant="outline" onClick={() => window.print()}><Download className="w-4 h-4 mr-2" /> Salvar como PDF</Button><Button onClick={onRestart} variant="ghost"><Home className="w-4 h-4 mr-2" /> Refazer Avaliação</Button></div></div>
        );
      
      case 'error':
        return (
            <div className="max-w-md mx-auto text-center"><Card className="border-red-500/50"><CardContent className="pt-8"><AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" /><h2 className="text-2xl font-bold text-gray-100 mb-2">Ocorreu um Erro</h2><p className="text-gray-400">{errorMessage}</p><Button onClick={generateFullReport} className="mt-6">Tentar Gerar Novamente</Button></CardContent></Card></div>
        );
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-8 flex items-center justify-center">
      <div key={stage} className="w-full max-w-4xl animate-fade-in">
        <StageContent />
      </div>
    </div>
  );
}
