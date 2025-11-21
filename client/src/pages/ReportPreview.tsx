import React, { useEffect, useState } from 'react';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const data = await fetchReportPreview(transactionId);
        setPreviewText(data.previewText);
      } catch (err: any) {
        setError(err.message || "Ocorreu um erro ao gerar seu insight.");
      } finally {
        setLoading(false);
      }
    };
    loadPreview();
  }, [transactionId]);

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 flex items-center justify-center font-sans">
        {/* ... O resto do JSX permanece o mesmo ... */}
    </div>
  );
};
