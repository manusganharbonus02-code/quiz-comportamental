// client/src/pages/Report.js (ou Report.tsx)

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

// Certifique-se de que a URL do Backend esteja correta.
// Como o Backend está no Render, use a URL completa do seu serviço.
const API_URL = 'https://quiz-comportamental.onrender.com';

const Report = () => {
    const location = useLocation();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [transactionId, setTransactionId] = useState(null); // Variável para armazenar o ID

    useEffect(() => {
        const fetchReport = async () => {
            const params = new URLSearchParams(location.search);
            
            // CORREÇÃO: Lê os IDs que a Kiwify pode enviar (purchase_id é o mais provável)
            const id = params.get('transaction_id') || params.get('purchase_id');
            setTransactionId(id); // Guarda o ID lido na variável de estado

            // CORREÇÃO CRÍTICA: Se não houver ID, evita o erro 'reading null'
            if (!id) {
                setError("Parâmetro de transação ausente. Este relatório só pode ser acessado após a confirmação da compra.");
                setLoading(false);
                return;
            }

            try {
                // Rota para buscar o relatório final usando o ID da transação
                // O Backend precisará desta rota, mas garantimos que o Frontend não trave.
                const response = await axios.get(`${API_URL}/api/report/final?transaction_id=${id}`);
                setReportData(response.data);
            } catch (err) {
                console.error("Erro ao buscar relatório:", err);
                // Exibe uma mensagem de erro mais informativa
                setError(`Não foi possível carregar o relatório. Erro: ${err.message}. ID: ${id}`);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [location.search]); // Executa sempre que a URL muda

    if (loading) {
        return <div className="p-8 text-center text-xl text-blue-500">Carregando Relatório. Por favor, aguarde...</div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-100 border-l-4 border-red-500 text-red-700 font-bold">
                <p>🛑 Erro ao Carregar</p>
                <p className="font-normal mt-2">{error}</p>
            </div>
        );
    }

    // Exemplo de exibição do relatório
    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-extrabold text-green-700 border-b pb-2 mb-4">Relatório Final Gerado!</h1>
            <p className="text-gray-600 mb-6">Esta análise foi gerada com o ID de Transação: **{transactionId}**</p>
            
            <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                <h2 className="text-2xl font-semibold mb-3">Dados Recebidos do Servidor:</h2>
                {/* Exiba os dados do relatório aqui. Por enquanto, JSON puro para debug. */}
                <pre className="whitespace-pre-wrap break-all text-sm bg-white p-4 rounded border">{JSON.stringify(reportData, null, 2)}</pre>
            </div>
        </div>
    );
};

export default Report;
