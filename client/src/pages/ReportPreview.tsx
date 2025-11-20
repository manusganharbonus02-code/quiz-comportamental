import React, { useEffect, useState } from 'react';
import { fetchReportPreview } from '../services/apiService';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Lock, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

interface ReportPreviewProps {
  transactionId: string;
  onUnlock: () => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({ transactionId, onUnlock }) => {
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const data = await fetchReportPreview(transactionId);
        setPreviewText(data.previewText);
      } catch (error) {
        // Security fallback in case the AI fails or is slow, to not lose the sale
        setPreviewText("Seu perfil indica um potencial executivo extremamente alto, mas existe uma barreira invisível em sua tomada de decisão que está custando oportunidades financeiras.");
      } finally {
        setLoading(false);
      }
    };
    loadPreview();
  }, [transactionId]);

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 flex items-center justify-center font-sans">
      <div className="max-w-3xl w-full space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-green-900/30 border border-green-500/30 rounded-full mb-2 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                <ShieldCheck className="w-6 h-6 text-green-400" />
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
             Análise Processada com Sucesso
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
             Nossa IA cruzou suas respostas com mais de 10.000 perfis executivos e encontrou um <span className="text-amber-400 font-semibold">padrão revelador</span>.
            </p>
        </div>

        <Card className="border-amber-500/40 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl shadow-amber-900/10">
          <CardContent className="p-6 md:p-10">
            <div className="mb-10">
              <h3 className="text-amber-500 font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Insight Crítico
              </h3>
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-slate-800 rounded w-full"></div>
                  <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-800 rounded w-4/6"></div>
                </div>
              ) : (
                <div className="text-xl md:text-2xl text-slate-200 font-medium italic leading-relaxed border-l-4 border-amber-500 pl-6 py-2 bg-amber-500/5">
                  "{previewText}"
                </div>
              )}
            </div>

            <div className="relative rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden group mt-8">
              <div className="p-8 filter blur-sm opacity-30 select-none pointer-events-none bg-slate-900">
                <h4 className="text-xl font-bold text-white mb-4">Dossiê Completo:</h4>
                <ul className="space-y-4 text-slate-300">
                  <li className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div>Sua principal armadilha mental revelada...</li>
                  <li className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div>5 passos para dobrar sua produtividade...</li>
                  <li className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div>O arquétipo exato da sua liderança...</li>
                </ul>
              </div>

              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent p-6">
                <div className="bg-slate-900 p-4 rounded-full border border-amber-500/30 mb-4 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                  <Lock className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">O relatório completo está pronto</h3>
                <p className="text-slate-400 mb-8 max-w-md text-sm md:text-base">
                  Não deixe este padrão oculto sabotar seu crescimento. Acesse seu plano de ação personalizado agora.
                </p>
                <Button size="lg" onClick={onUnlock} className="w-full md:w-auto text-lg py-4 px-10 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse-slow hover:scale-105 transform transition-all duration-200">
                  DESBLOQUEAR MEU RESULTADO <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <div className="mt-6 flex items-center gap-4 text-xs text-slate-500 uppercase tracking-widest font-semibold">
                    <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Compra Segura</span>
                    <span>•</span>
                    <span>Acesso Imediato</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
