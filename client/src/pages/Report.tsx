import { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Home, Loader2, AlertCircle, Lock, Star } from "lucide-react";
import { fetchReportData, startCheckout } from '../services/apiService';
import { ReportData, QuizData } from "../types";
import { ReportScreen } from "../components/ReportScreen";

interface ReportPageProps {
  transactionId: string;
  quizData: QuizData;
  onRestart: () => void;
}

export default function ReportPage({ transactionId, quizData, onRestart }: ReportPageProps) {
  // Se tem ID, é porque voltou do pagamento (loading). Se não, é prévia (preview).
  const [viewState, setViewState] = useState<'preview' | 'loading' | 'success' | 'error'>(
    transactionId ? 'loading' : 'preview'
  );
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Busca o relatório REAL apenas se voltou do pagamento
  useEffect(() => {
    if (transactionId && viewState === 'loading') {
      fetchReportData(transactionId, quizData)
        .then(data => {
          setReportData(data);
          setViewState('success');
        })
        .catch(err => {
          console.error(err);
          setErrorMessage("Erro ao gerar sua análise. Tente recarregar.");
          setViewState('error');
        });
    }
  }, [transactionId, viewState, quizData]);

  const handleBuyClick = async () => {
    setViewState('loading'); // Mostra loading enquanto prepara o checkout
    try {
      const { checkoutUrl } = await startCheckout(quizData);
      window.location.href = checkoutUrl;
    } catch (err) {
      setViewState('preview');
      alert("Erro ao conectar com o pagamento. Tente novamente.");
    }
  };

  // TELA DE PRÉVIA (VENDAS)
  if (viewState === 'preview') {
    return (
       <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-3xl w-full space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                    Análise Concluída com Sucesso!
                </h1>
                <p className="text-gray-400 text-lg">Mapeamos o seu DNA comportamental.</p>
            </div>

            <Card className="bg-slate-800/80 border-amber-500/30 border-2 shadow-2xl shadow-amber-900/20">
                <CardHeader>
                    <CardTitle className="text-2xl text-gray-100 flex items-center gap-2">
                        <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                        O que descobrimos sobre você:
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                        <p className="text-gray-300 text-lg leading-relaxed">
                            Suas respostas revelaram um perfil <span className="font-bold text-amber-400">altamente estratégico</span>. Você possui uma combinação rara de traços que indicam grande potencial de liderança, mas detectamos <span className="font-bold text-red-400">2 bloqueios críticos</span> que podem estar limitando seus ganhos financeiros e sua satisfação profissional hoje.
                        </p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-900/50 rounded-lg opacity-75">
                            <h4 className="font-bold text-gray-500 mb-2 flex items-center gap-2">
                                <Lock className="w-4 h-4" /> Análise de Foco & Produtividade
                            </h4>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-500 w-3/4 blur-sm"></div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-lg opacity-75">
                             <h4 className="font-bold text-gray-500 mb-2 flex items-center gap-2">
                                <Lock className="w-4 h-4" /> Inteligência Emocional
                            </h4>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-500 w-1/2 blur-sm"></div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button onClick={handleBuyClick} size="lg" className="w-full text-xl py-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border-none shadow-xl shadow-green-900/20 transform transition-all hover:scale-[1.02]">
                            QUERO DESBLOQUEAR MEU RELATÓRIO COMPLETO
                        </Button>
                        <p className="text-center text-gray-500 text-sm mt-3">
                            Acesso imediato • Pagamento único de R$ 5,00 • Compra Segura
                        </p>
                    </div>
                </CardContent>
            </Card>
            <div className="text-center">
                <Button onClick={onRestart} variant="ghost" className="text-slate-500 hover:text-slate-400">Voltar ao início (Perder dados)</Button>
            </div>
          </div>
       </div>
    );
  }

  if (viewState === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-slate-900">
        <Loader2 className="w-16 h-16 text-amber-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Gerando sua Análise Premium...</h2>
        <p className="text-gray-400 max-w-md">
          Nossa Inteligência Artificial está compilando seus dados, cruzando com padrões de mercado e escrevendo seu plano de desenvolvimento.
        </p>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
       <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <Card className="max-w-md mx-auto text-center border-red-500/50 bg-slate-800">
            <CardContent className="pt-8">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-100 mb-2">Algo deu errado</h2>
                <p className="text-gray-400">{errorMessage}</p>
                 <Button onClick={() => window.location.reload()} className="mt-6">Tentar Novamente</Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (viewState === 'success' && reportData) {
    return <ReportScreen reportData={reportData} onRestart={onRestart} />
  }

  return null;
}
