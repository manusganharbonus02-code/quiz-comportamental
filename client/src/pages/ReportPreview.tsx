import React, 'react';
import { useEffect, useState } from 'react';
import { fetchReportPreview } from '../services/apiService';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Lock, ArrowRight, AlertCircle, ShieldCheck, Zap, TrendingUp, EyeOff, CheckSquare } from 'lucide-react';

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
             <h1 className="text-sm tracking-wider uppercase text-green-400 font-semibold">Análise Concluída</h1>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
            Seu Padrão Comportamental foi <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Mapeado</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Nossa IA processou suas respostas e identificou um insight crítico que define sua trajetória profissional.
          </p>
        </div>

        <Card className="border-amber-500/40 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl shadow-amber-900/10">
          <CardContent className="p-6 md:p-10">
            <div className="mb-10">
              <h3 className="text-amber-500 font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Insight Revelado
              </h3>
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-5 bg-slate-800 rounded w-full"></div>
                  <div className="h-5 bg-slate-800 rounded w-5/6"></div>
                </div>
              ) : (
                <div className="text-xl md:text-2xl text-slate-200 font-medium italic leading-relaxed border-l-4 border-amber-500 pl-6">
                  "{previewText}"
                </div>
              )}
            </div>

            <div className="relative rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden group mt-8">
              <div className="p-8 filter blur-md opacity-40 select-none pointer-events-none bg-slate-900">
                <h4 className="text-xl font-bold text-white mb-6">Seu Dossiê Completo Inclui:</h4>
                <ul className="space-y-4 text-slate-300">
                  <li className="flex items-center gap-3"><Zap className="text-amber-400"/> O seu Arquétipo Comportamental Único</li>
                  <li className="flex items-center gap-3"><TrendingUp className="text-amber-400"/> Mapa de Competências com scores detalhados</li>
                  <li className="flex items-center gap-3"><EyeOff className="text-amber-400"/> A revelação do seu "Ponto Cego" mais crítico</li>
                  <li className="flex items-center gap-3"><CheckSquare className="text-amber-400"/> Um Plano de Ação Imediato com 4 protocolos</li>
                </ul>
              </div>

              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent p-6">
                <div className="bg-slate-900 p-4 rounded-full border border-amber-500/30 mb-4 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                  <Lock className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Seu Dossiê está Pronto</h3>
                <p className="text-slate-400 mb-8 max-w-md text-sm md:text-base">
                  Acesse agora o plano de ação que pode redefinir sua performance e seus resultados financeiros.
                </p>
                <Button
                  size="lg"
                  onClick={onUnlock}
                  className="w-full md:w-auto text-lg py-4 px-10 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse-slow hover:scale-105 transform transition-all duration-200"
                >
                  DESBLOQUEAR ANÁLISE COMPLETA <ArrowRight className="ml-2 w-5 h-5" />
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
