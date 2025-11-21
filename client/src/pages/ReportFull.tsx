import React, { useEffect, useState } from 'react';
import { fetchFullReport } from '../services/apiService';
import { FullReportData } from '../types';
import { Button } from '../components/ui/Button';
// ... outros imports ...

interface ReportFullProps {
  transactionId: string;
  onRestart?: () => void;
}

export const ReportFull: React.FC<ReportFullProps> = ({ transactionId, onRestart }) => {
  const [report, setReport] = useState<FullReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // ... outros estados ...

  useEffect(() => {
    const loadReport = async () => {
      try {
        const data = await fetchFullReport(transactionId);
        setReport(data);
      } catch (err: any) {
        setError('Falha ao carregar o relatório.');
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, [transactionId]);
  
  // ... resto do componente e JSX ...
};
