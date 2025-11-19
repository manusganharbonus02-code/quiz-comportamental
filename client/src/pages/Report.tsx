import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Download, Home, Loader2, CheckCircle, CreditCard, AlertCircle, Star, Lock, ArrowRight, Award } from "lucide-react";
import { Radar } from "react-chartjs-2";
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";
import { checkPaymentStatus, fetchReportData, simulateSuccessfulPayment, fetchReportPreview } from '../services/apiService';
import { ReportData, Answers, QuizQuestion } from "../types";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const KIWIFY_CHECKOUT_URL = 'https://pay.kiwify.com.br/RHpnrVL';

interface ReportPageProps {
  transactionId: string;
  answers: Answers;
  questions: QuizQuestion[];
  onRestart: () => void;
}

export default function ReportPage({ transactionId, answers, questions, onRestart }: ReportPageProps) {
  const [paymentStage, setPaymentStage] = useState<'preview' | 'waiting' | 'success' | 'error'>('preview');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [previewText, setPreviewText] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [errorMessage, setErrorMessage] = useState("");

  const handleUnlockReport = () => {
    const checkoutUrl = `${KIWIFY_CHECKOUT_URL}?aff_content=${transactionId}`;
    window.open(checkoutUrl, '_blank');
    setPaymentStage('waiting');
  };

  useEffect(() => {
    if (paymentStage === 'preview' && !previewText) {
        fetchReportPreview(answers, questions)
            .then(text => setPreviewText(text))
            .catch(err => {
                console.error("Erro na prévia:", err);
                setPreviewText("Seu perfil revela um potencial extraordinário, mas identificamos um padrão crítico que pode estar limitando seu crescimento financeiro e profissional.");
            })
            .finally(() => setIsLoadingPreview(false));
    }
  }, [paymentStage, answers, questions, previewText]);

  const verifyPayment = useCallback(async () => {
    try {
      const response = await checkPaymentStatus(transactionId);
      if (response.status === 'PAID') {
        setPaymentStage('success');
      }
    } catch (err) {
      console.error("Erro checando pagamento:", err);
    }
  }, [transactionId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (paymentStage === 'waiting') {
      verifyPayment();
      interval = setInterval(verifyPayment, 3000);
    }
    return () => clearInterval(interval);
  }, [paymentStage, verifyPayment]);

  useEffect(() => {
      let int: ReturnType<typeof setInterval>;
      if(paymentStage === 'waiting') {
          setCountdown(3);
          int = setInterval(() => setCountdown(p => p > 1 ? p - 1 : 3), 1000);
      }
      return () => clearInterval(int);
  }, [paymentStage]);

  useEffect(() => {
    if (paymentStage === 'success' && !reportData) {
        fetchReportData(transactionId)
            .then(data => setReportData(data))
            .catch((err) => {
                console.error("Erro report:", err);
                setErrorMessage("Erro ao carregar relatório.");
                setPaymentStage('error');
            });
    }
  }, [paymentStage, reportData, transactionId]);

  const radarData = {
    labels: ["Foco", "Produtividade", "Resiliência"],
    datasets: [{
      label: "Seu Perfil",
      data: [reportData?.scores.Foco || 0, reportData?.scores.Produtividade || 0, reportData?.scores.Resiliência || 0],
      borderColor: "#f59e0b",
      backgroundColor: "rgba(245, 158, 11, 0.2)",
      borderWidth: 2,
      pointBackgroundColor: "#f59e0b",
    }],
  };

  const renderPreview = () => (
    <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                Análise Preliminar Concluída
            </h1>
            <p className="text-gray-400 text-lg">
                Nossa Inteligência Artificial processou suas respostas e encontrou algo importante.
            </p>
        </div>

        {isLoadingPreview ? (
            <div className="flex justify-center py-12"><Loader2 className="w-12 h-12 text-amber-500 animate-spin"/></div>
        ) : (
            <Card className="border-amber-500/30 bg-slate-800/80 shadow-2xl shadow-amber-900/20 overflow-hidden relative">
                <CardHeader className="bg-amber-500/10 border-b border-amber-500/20">
                    <CardTitle className="flex items-center gap-2 text-amber-400">
                        <Star className="w-5 h-5 fill-amber-400" /> Insight Exclusivo Detectado
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="text-xl text-gray-200 leading-relaxed font-medium border-l-4 border-amber-500 pl-4 italic">
                        "{previewText}"
                    </div>
                    
                    <div className="relative mt-8 rounded-xl border border-slate-700 bg-slate-900/50 p-6">
                        <div className="absolute inset-0 backdrop-blur-md bg-slate-900/60 z-10 flex flex-col items-center justify-center rounded-xl">
                            <Lock className="w-12 h-12 text-gray-400 mb-3" />
                            <p className="text-gray-200 font-bold text-lg">Análise Profunda Bloqueada</p>
                            <p className="text-gray-400 text-sm">Desbloqueie para ver o plano de correção.</p>
                        </div>
                        <div className="space-y-4 opacity-30 select-none filter blur-sm">
                            <h3 className="text-lg font-bold text-red-400">⚠️ Onde você está perdendo dinheiro:</h3>
                            <p>Baseado na resposta 12, seu padrão de comportamento indica uma falha crítica em...</p>
                            <h3 className="text-lg font-bold text-green-400">🚀 Seu multiplicador de sucesso:</h3>
                            <p>Seu nível de Foco permite que você...</p>
                        </div>
                    </div>

                    <Button onClick={handleUnlockReport} size="lg" className="w-full text-lg h-16 animate-pulse bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 border-0">
                        DESBLOQUEAR MEU RELATÓRIO AGORA <ArrowRight className="ml-2 w-6 h-6" />
                    </Button>
                    <p className="text-center text-xs text-gray-500 uppercase tracking-wider">Acesso Vitalício • Garantia de 7 dias • Pagamento Seguro</p>
                </CardContent>
            </Card>
        )}
    </div>
  );

  const renderWaiting = () => (
    <div className="max-w-md mx-auto text-center space-y-8">
        <Card className="border-amber-500/20">
            <CardContent className="pt-10 pb-10 flex flex-col items-center">
                <div className="relative w-32 h-32 mb-8">
                    <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-amber-500">
                        {countdown}
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Verificando Pagamento...</h2>
                <p className="text-gray-400">Mantenha esta página aberta. Assim que o banco confirmar, seu relatório aparecerá aqui automaticamente.</p>
            </CardContent>
        </Card>
        <Button variant="ghost" onClick={() => window.open(KIWIFY_CHECKOUT_URL, '_blank')}>
            Não abriu o checkout? Clique aqui.
        </Button>
    </div>
  );

  const renderReportContent = () => (
    <div className="space-y-8 animate-fade-in">
        <header className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 mb-4">
                <CheckCircle className="w-4 h-4" /> Pagamento Confirmado
            </div>
            <h1 className="text-4xl font-extrabold text-white">Dossiê Comportamental Completo</h1>
            <p className="text-gray-400">Gerado exclusivamente para o seu perfil.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
            <Card>
                <CardHeader><CardTitle>Mapa de Competências</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-center h-80">
                    <Radar data={radarData} options={{ scales: { r: { grid: { color: '#334155' }, ticks: { display: false }, pointLabels: { color: '#94a3b8', font: { size: 12 } } } }, plugins: { legend: { display: false } } }} />
                </CardContent>
            </Card>

            <div className="space-y-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2"><CardTitle className="text-blue-400 flex justify-between"><span>Foco</span> <span className="text-white">{reportData?.scores.Foco.toFixed(1)}/5.0</span></CardTitle></CardHeader>
                    <CardContent><p className="text-gray-300 leading-relaxed">{reportData?.interpretations.Foco}</p></CardContent>
                </Card>
                 <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2"><CardTitle className="text-amber-400 flex justify-between"><span>Produtividade</span> <span className="text-white">{reportData?.scores.Produtividade.toFixed(1)}/5.0</span></CardTitle></CardHeader>
                    <CardContent><p className="text-gray-300 leading-relaxed">{reportData?.interpretations.Produtividade}</p></CardContent>
                </Card>
                 <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2"><CardTitle className="text-purple-400 flex justify-between"><span>Resiliência</span> <span className="text-white">{reportData?.scores.Resiliência.toFixed(1)}/5.0</span></CardTitle></CardHeader>
                    <CardContent><p className="text-gray-300 leading-relaxed">{reportData?.interpretations.Resiliência}</p></CardContent>
                </Card>
            </div>
        </div>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <CardHeader><CardTitle className="flex items-center gap-2"><Award className="text-yellow-500"/> Plano de Ação Personalizado</CardTitle></CardHeader>
            <CardContent>
                <ul className="grid gap-4 sm:grid-cols-2">
                    {reportData?.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold">{i+1}</div>
                            <span className="text-gray-300">{rec}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => window.print()}><Download className="mr-2 w-4 h-4"/> Salvar PDF</Button>
            <Button variant="ghost" onClick={onRestart}>Sair</Button>
        </div>
    </div>
  );

  const renderError = () => (
    <div className="max-w-md mx-auto text-center">
        <Card className="border-red-500/50">
            <CardContent className="pt-8">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-100 mb-2">Ocorreu um Erro</h2>
                <p className="text-gray-400">{errorMessage}</p>
                 <Button onClick={() => setPaymentStage('waiting')} className="mt-6">Tentar Novamente</Button>
            </CardContent>
        </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl animate-fade-in">
        {paymentStage === 'preview' && renderPreview()}
        {paymentStage === 'waiting' && renderWaiting()}
        {paymentStage === 'success' && renderReportContent()}
        {paymentStage === 'error' && renderError()}
      </div>
    </div>
  );
}
