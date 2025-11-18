import { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Home, Loader2, AlertCircle } from "lucide-react";
import { fetchReportData } from '../services/apiService';
import { ReportData } from "../types";
import { ReportScreen } from "../components/ReportScreen";

interface ReportPageProps {
  transactionId: string;
  onRestart: () => void;
}

export default function ReportPage({ transactionId, onRestart }: ReportPageProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Adiciona um pequeno delay para uma melhor experiência de usuário
    setTimeout(() => {
        fetchReportData(transactionId)
        .then(data => {
            setReportData(data);
        })
        .catch(err => {
            console.error("Failed to fetch report data:", err);
            setErrorMessage(err.message || "Não foi possível carregar seu relatório. Tente novamente mais tarde.");
        })
        .finally(() => {
            setIsLoading(false);
        });
    }, 2000); // 2 segundos de delay
  }, [transactionId]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <Loader2 className="w-12 h-12 text-teal-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Pagamento Confirmado!</h2>
        <p className="text-gray-400 max-w-md">
          Estamos gerando seu relatório personalizado com a IA. Isso pode levar um momento.
        </p>
      </div>
    );
  }

  if (errorMessage) {
    return (
       <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center border-red-500/50">
            <CardContent className="pt-8">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-100 mb-2">Ocorreu um Erro</h2>
                <p className="text-gray-400">{errorMessage}</p>
                 <Button onClick={onRestart} className="mt-6"><Home className="w-4 h-4 mr-2" /> Voltar ao Início</Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (reportData) {
    return <ReportScreen reportData={reportData} onRestart={onRestart} />
  }

  return null;
}
