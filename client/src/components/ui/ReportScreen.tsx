import { ReportData } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Button } from './ui/Button';
import { Home, Download } from 'lucide-react';
import { Card } from './ui/Card';

interface ReportScreenProps {
  reportData: ReportData;
  onRestart: () => void;
}

const DIMENSION_DISPLAY_NAMES: Record<string, string> = {
  Foco: "Foco",
  Adaptabilidade: "Adaptabilidade",
  AgressorRotina: "Inovação",
  MatadorDragoes: "Coragem",
  RadarSocial: "Radar Social",
};

export function ReportScreen({ reportData, onRestart }: ReportScreenProps) {
  // Verificação de segurança: Se os dados do relatório estiverem mal formados, mostre uma tela de erro em vez de quebrar.
  if (!reportData || !Array.isArray(reportData.dimensionAnalyses) || reportData.dimensionAnalyses.some(d => !d)) {
    return (
        <div className="flex flex-col h-full items-center justify-center p-6 text-center">
            <h1 className="text-2xl font-bold text-red-500">Erro de Dados do Relatório</h1>
            <p className="text-gray-400 mt-4">Os dados recebidos para o seu relatório parecem estar corrompidos. Por favor, reinicie o teste para tentar novamente.</p>
            <Button onClick={onRestart} className="mt-6">Fazer um Novo Teste</Button>
        </div>
    );
  }

  const chartData = reportData.dimensionAnalyses.map(d => ({
    subject: DIMENSION_DISPLAY_NAMES[d.dimensionName] || d.dimensionName,
    A: d.score,
    fullMark: 100,
  }));

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
        <header className="p-4 text-center bg-gray-800/50">
            <h1 className="text-xl font-bold text-gray-100">Seu Relatório Comportamental</h1>
        </header>

        <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">
            <Card className="bg-gray-800/60 border border-teal-500/30 p-6 text-center shadow-lg">
                <h2 className="text-3xl font-extrabold text-teal-400">
                    {reportData.archetypeTitle}
                </h2>
                <p className="text-gray-300 mt-2 max-w-2xl mx-auto">
                    {reportData.archetypeDescription}
                </p>
            </Card>

            <Card className="bg-gray-800/60 border border-gray-700 p-4">
                <h3 className="text-lg font-bold text-center mb-4 text-gray-100">Seu Perfil em Gráfico</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                        <PolarGrid stroke="#374151" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#e0f2f1', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9ca3af' }} />
                        <Radar name="Score" dataKey="A" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.6} />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                        <Legend />
                    </RadarChart>
                </ResponsiveContainer>
            </Card>

            {reportData.dimensionAnalyses.map((analysis) => (
                <Card key={analysis.dimensionName} className="bg-gray-800/60 border border-gray-700 p-4">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-md font-bold text-gray-200">
                            {DIMENSION_DISPLAY_NAMES[analysis.dimensionName] || analysis.dimensionName}
                        </h4>
                        <span className="font-bold text-lg text-teal-400">
                            {analysis.score}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                        <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${analysis.score}%` }}></div>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{analysis.interpretation}</p>

                    {(analysis.strengths?.length > 0 || analysis.recommendations?.length > 0) && (
                        <div className="border-t border-gray-700 pt-3 mt-3 space-y-4">
                            {analysis.strengths?.length > 0 && (
                                <div>
                                    <h5 className="text-sm font-semibold mb-2 text-green-400">✨ Pontos Fortes</h5>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                                        {analysis.strengths.map((strength, i) => <li key={i}>{strength}</li>)}
                                    </ul>
                                </div>
                            )}
                            {analysis.recommendations?.length > 0 && (
                                <div>
                                    <h5 className="text-sm font-semibold mb-2 text-yellow-400">🚀 Recomendações de Desenvolvimento</h5>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                                        {analysis.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            ))}

             <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button variant="outline" onClick={() => window.print()}><Download className="w-4 h-4 mr-2" /> Salvar como PDF</Button>
                <Button onClick={onRestart} variant="ghost"><Home className="w-4 h-4 mr-2" /> Fazer Novo Teste</Button>
            </div>
        </main>
    </div>
  );
}
