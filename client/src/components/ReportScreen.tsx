import { ReportData } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Button } from './ui/Button';
import { Home, Download, Zap, Target, BookOpen } from 'lucide-react';
import { Card } from './ui/Card';

interface ReportScreenProps {
  reportData: ReportData;
  onRestart: () => void;
}

const DIMENSION_DISPLAY_NAMES: Record<string, string> = {
  Foco: "Foco & Disciplina",
  Adaptabilidade: "Adaptabilidade",
  AgressorRotina: "Inovação & Criatividade",
  MatadorDragoes: "Coragem & Liderança",
  RadarSocial: "Inteligência Social",
};

export function ReportScreen({ reportData, onRestart }: ReportScreenProps) {
  if (!reportData || !Array.isArray(reportData.dimensionAnalyses)) {
    return (
        <div className="flex flex-col h-full items-center justify-center p-6 text-center">
            <h1 className="text-2xl font-bold text-red-500">Erro nos Dados</h1>
            <Button onClick={onRestart} className="mt-6">Reiniciar</Button>
        </div>
    );
  }

  const chartData = reportData.dimensionAnalyses.map(d => ({
    subject: DIMENSION_DISPLAY_NAMES[d.dimensionName] || d.dimensionName,
    A: d.score,
    fullMark: 100,
  }));

  return (
    <div className="flex flex-col min-h-screen animate-fade-in bg-slate-950">
        <header className="p-6 text-center bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
            <h1 className="text-xl md:text-2xl font-bold text-gray-100">Relatório de Perfil Executivo</h1>
        </header>

        <main className="flex-grow p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto w-full">
            
            {/* Arquétipo Principal */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-amber-500/40 p-8 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-600"></div>
                <h2 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-2">Seu Arquétipo Dominante</h2>
                <h3 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
                    {reportData.archetypeTitle}
                </h3>
                <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto border-l-4 border-amber-500 pl-6 text-left italic">
                    "{reportData.archetypeDescription}"
                </p>
            </Card>

            {/* Gráfico */}
            <div className="grid md:grid-cols-3 gap-8">
                <Card className="md:col-span-1 bg-slate-900 border-slate-800 p-4 flex flex-col justify-center">
                    <h4 className="text-center font-bold text-gray-400 mb-4">Mapeamento de Competências</h4>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Você" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Detalhamento das Dimensões */}
                <div className="md:col-span-2 space-y-6">
                    {reportData.dimensionAnalyses.map((analysis) => (
                        <Card key={analysis.dimensionName} className="bg-slate-900/80 border border-slate-700 overflow-hidden transition-all hover:border-slate-600">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Target className="w-5 h-5 text-amber-500" />
                                        {DIMENSION_DISPLAY_NAMES[analysis.dimensionName] || analysis.dimensionName}
                                    </h4>
                                    <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
                                        <span className={`font-bold text-lg ${analysis.score > 70 ? 'text-green-400' : analysis.score < 40 ? 'text-red-400' : 'text-yellow-400'}`}>
                                            {analysis.score}
                                        </span>
                                        <span className="text-xs text-slate-500">/100</span>
                                    </div>
                                </div>
                                
                                <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4">
                                    <div 
                                        className={`h-1.5 rounded-full transition-all duration-1000 ${analysis.score > 70 ? 'bg-green-500' : analysis.score < 40 ? 'bg-red-500' : 'bg-yellow-500'}`} 
                                        style={{ width: `${analysis.score}%` }}
                                    ></div>
                                </div>

                                <p className="text-gray-300 mb-6 leading-relaxed text-sm md:text-base">
                                    {analysis.interpretation}
                                </p>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                                        <h5 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                                            <Zap className="w-4 h-4" /> Superpoderes (Pontos Fortes)
                                        </h5>
                                        <ul className="space-y-2">
                                            {analysis.strengths.map((strength, i) => (
                                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                                    <span className="text-green-500 mt-1">•</span> {strength}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                                        <h5 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
                                            <BookOpen className="w-4 h-4" /> Plano de Ação (Melhorias)
                                        </h5>
                                        <ul className="space-y-2">
                                            {analysis.recommendations.map((rec, i) => (
                                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                                    <span className="text-blue-500 mt-1">→</span> {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

             <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 pb-12">
                <Button variant="outline" onClick={() => window.print()} className="border-slate-600 hover:bg-slate-800 text-white">
                    <Download className="w-4 h-4 mr-2" /> Salvar PDF
                </Button>
                <Button onClick={onRestart} variant="ghost" className="text-slate-400 hover:text-white">
                    <Home className="w-4 h-4 mr-2" /> Nova Avaliação
                </Button>
            </div>
        </main>
    </div>
  );
}
