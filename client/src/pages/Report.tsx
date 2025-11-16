import React, { useState, useEffect, useMemo } from 'react';
import { getReportPreview, getFullReport, checkPaymentStatus } from '../services/api';
import { Answers, PreviewData, ReportData } from '../types';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Loader2, Lock, CheckCircle, BarChart3, BrainCircuit, Zap, Download, Home as HomeIcon } from 'lucide-react';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface ReportProps {
  transactionId: string;
  onRestart: () => void;
}

const ReportContent: React.FC<{ report: ReportData }> = ({ report }) => {
  const radarData = {
    labels: ['Foco', 'Produtividade', 'Resiliência'],
    datasets: [{
      label: 'Seu Perfil',
      data: [report.scores.focus, report.scores.productivity, report.scores.resilience],
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderColor: '#6366F1',
      pointBackgroundColor: '#6366F1',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#6366F1',
    }],
  };

  const radarOptions = {
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.2)' },
        grid: { color: 'rgba(255, 255, 255, 0.2)' },
        pointLabels: { font: { size: 14 }, color: '#E5E7EB' },
        ticks: { backdropColor: 'transparent', color: '#9CA3AF', stepSize: 1 },
        min: 0,
        max: 5,
      },
    },
    plugins: {
      legend: { display: false },
    },
    maintainAspectRatio: false,
  };
  
  return (
    <div className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-dark-card border border-gray-700 p-6 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 text-white">Seu Perfil Visualizado</h3>
                <div className="h-80"><Radar data={radarData} options={radarOptions} /></div>
            </div>
            <div className="space-y-4">
              <div className="bg-dark-card border border-gray-700 p-6 rounded-lg">
                  <h4 className="flex items-center text-xl font-bold text-brand-secondary mb-2"><BarChart3 className="mr-2" /> Foco: <span className="ml-2 text-white">{report.scores.focus.toFixed(1)}/5.0</span></h4>
                  <p className="text-dark-text-secondary">{report.interpretations.focus}</p>
              </div>
              <div className="bg-dark-card border border-gray-700 p-6 rounded-lg">
                  <h4 className="flex items-center text-xl font-bold text-brand-secondary mb-2"><Zap className="mr-2" /> Produtividade: <span className="ml-2 text-white">{report.scores.productivity.toFixed(1)}/5.0</span></h4>
                  <p className="text-dark-text-secondary">{report.interpretations.productivity}</p>
              </div>
              <div className="bg-dark-card border border-gray-700 p-6 rounded-lg">
                  <h4 className="flex items-center text-xl font-bold text-brand-secondary mb-2"><BrainCircuit className="mr-2" /> Resiliência: <span className="ml-2 text-white">{report.scores.resilience.toFixed(1)}/5.0</span></h4>
                  <p className="text-dark-text-secondary">{report.interpretations.resilience}</p>
              </div>
            </div>
        </div>
        <div className="bg-dark-card border border-gray-700 p-6 rounded-lg">
            <h3 className="text-2xl font-bold mb-4 text-white">Seu Plano de Ação Personalizado</h3>
            <ul className="list-disc list-inside space-y-3 text-dark-text-secondary">
                {report.recommendations.map((rec, i) => <li key={i} className="pl-2">{rec}</li>)}
            </ul>
        </div>
    </div>
  );
};

const BenefitCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="bg-dark-bg border border-gray-700 p-4 rounded-lg text-center flex flex-col items-center">
      <div className="w-12 h-12 flex items-center justify-center text-brand-primary mb-2">
          {icon}
      </div>
      <h4 className="font-semibold text-dark-text">{title}</h4>
      <p className="text-sm text-dark-text-secondary">{description}</p>
    </div>
  );


export default function Report({ transactionId, onRestart }: ReportProps) {
  // --- CONFIGURAÇÃO IMPORTANTE ---
  // A URL de checkout real da Kiwify.
  const KIWIFY_CHECKOUT_URL = 'https://pay.kiwify.com.br/RHpnrVL';
  // ---------------------------------

  const [stage, setStage] = useState<'loading_preview' | 'preview' | 'waiting_payment' | 'loading_full' | 'full' | 'error'>('loading_preview');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [fullReport, setFullReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const data = await getReportPreview(transactionId);
        setPreview(data);
        setStage('preview');
      } catch (err) {
        setError("Não foi possível gerar a prévia da sua análise. Tente novamente.");
        setStage('error');
      }
    };
    loadPreview();
  }, [transactionId]);
  
  useEffect(() => {
    if (stage !== 'waiting_payment') return;

    const intervalId = setInterval(async () => {
      try {
        const { status } = await checkPaymentStatus(transactionId);
        if (status === 'paid') {
          clearInterval(intervalId);
          setStage('loading_full');
        }
      } catch (err) {
        console.error("Error checking payment status:", err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(intervalId);
  }, [stage, transactionId]);
  
  useEffect(() => {
    if (stage === 'loading_full') {
      const loadFullReport = async () => {
        try {
          const data = await getFullReport(transactionId);
          setFullReport(data);
          setStage('full');
        } catch (err) {
          setError("Ocorreu um erro ao buscar seu relatório completo. Verificamos seu pagamento, mas algo deu errado. Por favor, contate o suporte.");
          setStage('error');
        }
      };
      loadFullReport();
    }
  }, [stage, transactionId]);

  const handlePay = () => {
    window.open(KIWIFY_CHECKOUT_URL, '_blank');
    setStage('waiting_payment');
  };
  
  const stageContent = useMemo(() => {
    switch (stage) {
      case 'loading_preview':
        return (
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-brand-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Analisando seu perfil...</h2>
            <p className="text-dark-text-secondary">Nossa IA está processando suas respostas para criar seu relatório personalizado.</p>
          </div>
        );
        case 'preview':
            return (
              <div className="text-center max-w-2xl mx-auto animate-fade-in">
                  <h2 className="text-3xl font-bold text-white mb-4">Sua Análise Preliminar está Pronta!</h2>
                  <div className="bg-dark-card border border-gray-700 p-8 rounded-lg my-8">
                      <p className="text-lg text-dark-text italic">"{preview?.previewText || 'Gerando prévia...'}"</p>
                  </div>
                  
                  <div className="my-10 text-left">
                    <h3 className="text-xl font-bold text-center text-white mb-6">Ao desbloquear, você receberá:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <BenefitCard
                        icon={<BarChart3 size={28} />}
                        title="Perfil Detalhado"
                        description="Gráficos e pontuações exatas de suas competências."
                      />
                      <BenefitCard
                        icon={<BrainCircuit size={28} />}
                        title="Arquétipo Secreto"
                        description="Um insight poderoso sobre seu padrão comportamental."
                      />
                      <BenefitCard
                        icon={<Zap size={28} />}
                        title="Plano de Ação"
                        description="Recomendações práticas e personalizadas para agir."
                      />
                    </div>
                  </div>
    
                  <button
                    onClick={handlePay}
                    className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-amber-500 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-amber-600 transform hover:scale-105 transition-all duration-300"
                  >
                    <Lock size={20} /> Desbloquear Relatório Completo por R$ 5,00
                  </button>
                  <p className="text-xs text-dark-text-secondary mt-4">
                    Pagamento único e seguro via Kiwify. Acesso imediato ao relatório.
                  </p>
              </div>
            );
      case 'waiting_payment':
        return (
          <div className="text-center animate-fade-in">
            <Loader2 className="w-12 h-12 animate-spin text-brand-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Aguardando confirmação de pagamento...</h2>
            <p className="text-dark-text-secondary mt-2 max-w-md mx-auto">
              A página de pagamento foi aberta em uma nova aba. Após a conclusão, esta página será atualizada automaticamente.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Não feche esta janela.
            </p>
          </div>
        );
      case 'loading_full':
        return (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Pagamento Confirmado!</h2>
            <p className="text-dark-text-secondary">Gerando seu relatório completo...</p>
          </div>
        );
      case 'full':
        return fullReport ? (
          <div className="max-w-5xl mx-auto w-full animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white">Seu Relatório Comportamental Completo</h1>
                    <p className="text-dark-text-secondary mt-2">Aqui estão os insights sobre seu perfil único.</p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                    <button onClick={onRestart} className="px-4 py-2 bg-dark-card border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"><HomeIcon size={16}/> Início</button>
                    <button className="px-4 py-2 bg-brand-primary rounded-lg hover:bg-brand-secondary transition-colors flex items-center gap-2"><Download size={16}/> Baixar PDF</button>
                </div>
            </div>
            <ReportContent report={fullReport} />
          </div>
        ) : null;
      case 'error':
        return (
            <div className="text-center text-red-400 bg-red-900/20 p-8 rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Ocorreu um Erro</h2>
                <p>{error}</p>
                <button onClick={onRestart} className="mt-6 px-6 py-2 bg-brand-primary rounded-lg">Voltar ao Início</button>
            </div>
        );
    }
  }, [stage, preview, fullReport, error, onRestart, KIWIFY_CHECKOUT_URL]);
  
  return (
    <div className="min-h-screen bg-dark-bg p-4 sm:p-8 flex items-center justify-center">
        {stageContent}
    </div>
  );
}
