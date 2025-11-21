import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { checkPaymentStatus } from '../services/apiService';

interface WaitingProps {
  transactionId: string;
  checkoutUrl: string;
  onPaymentSuccess: () => void;
}

export const Waiting: React.FC<WaitingProps> = ({ transactionId, checkoutUrl, onPaymentSuccess }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Abre o checkout em uma nova aba assim que a página carrega
    const checkoutWindow = window.open(checkoutUrl, '_blank');
    if (!checkoutWindow) {
      setError("Seu navegador bloqueou a página de pagamento. Por favor, clique no botão abaixo para abri-la.");
    }

    // Começa a verificar o status do pagamento
    const intervalId = setInterval(async () => {
      try {
        console.log(`Verificando status para o TID: ${transactionId}...`);
        const status = await checkPaymentStatus(transactionId);

        if (status === 'PAID') {
          console.log("Pagamento confirmado!");
          clearInterval(intervalId);
          onPaymentSuccess();
        }
        // Se o status for PENDING ou NOT_FOUND, continua tentando silenciosamente.
      } catch (err) {
        console.error("Erro ao verificar status do pagamento:", err);
        setError("Não foi possível verificar o status do pagamento. Tente recarregar a página se você já pagou.");
        clearInterval(intervalId); // Para de tentar se houver um erro de rede
      }
    }, 5000); // Verifica a cada 5 segundos

    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(intervalId);
  }, [transactionId, checkoutUrl, onPaymentSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 font-sans">
      <div className="max-w-md w-full animate-fade-in">
        <Card className="text-center border-amber-500/30">
          <CardContent className="p-8">
            <div className="flex justify-center mb-6">
              <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Aguardando Confirmação</h2>
            <p className="text-slate-400 mb-6">
              Estamos aguardando a confirmação do seu pagamento. Por favor, mantenha esta página aberta. Você será redirecionado automaticamente assim que o pagamento for aprovado.
            </p>

            {error && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-3 text-red-300 text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => window.open(checkoutUrl, '_blank')}
              className="w-full mt-4"
            >
              Abrir Página de Pagamento Novamente
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
