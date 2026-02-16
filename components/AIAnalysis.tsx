import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MonthlyData } from '../types';
import { formatRupiah } from '../utils';
import { Sparkles, BrainCircuit, RefreshCw, TrendingUp, AlertCircle, CheckCircle2, Wifi } from 'lucide-react';

interface AIAnalysisProps {
  currentMonthData: MonthlyData;
  netIncome: number;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ currentMonthData, netIncome }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAnalysis = async () => {
    // 1. Cek Koneksi Internet
    if (!navigator.onLine) {
      setError("Perangkat Anda sedang offline. Mohon hubungkan ke internet.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Inisialisasi Google GenAI dengan model terbaru untuk analisis kompleks
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const budgetDetails = JSON.stringify({
        income: formatRupiah(netIncome),
        needs: currentMonthData.budget.needs?.items.map(i => ({ name: i.name, budget: i.budget, actual: i.actual })),
        savings: currentMonthData.budget.savings?.items.map(i => ({ name: i.name, budget: i.budget, actual: i.actual })),
        debt: currentMonthData.budget.debt?.items.map(i => ({ name: i.name, budget: i.budget, actual: i.actual })),
        others: currentMonthData.budget.others?.items.map(i => ({ name: i.name, actual: i.actual })),
        investments: currentMonthData.investments.map(i => ({ name: i.name, value: i.currentValue, target: i.targetValue }))
      });

      const prompt = `Bertindaklah sebagai Pakar Konsultan Keuangan Pribadi. 
      Lakukan analisis mendalam pada data keuangan bulanan berikut untuk Aniq Susilo.
      
      Data Keuangan:
      ${budgetDetails}
      
      Berikan respon dalam Bahasa Indonesia dengan struktur berikut:
      1. Health Check: Berikan evaluasi cepat tentang kondisi bulan ini.
      2. Budget Efficiency: Analisis apakah pengeluaran aktual sesuai dengan anggaran. Soroti jika ada overbudget.
      3. Aset & Investasi: Berikan komentar tentang pertumbuhan aset dan seberapa dekat dengan target.
      4. 3 Action Steps: Langkah nyata untuk meningkatkan kekayaan di bulan depan.
      
      Gunakan format Markdown yang profesional, rapi, dan mudah dibaca di layar HP.`;

      // Menggunakan gemini-3-pro-preview untuk kemampuan penalaran finansial yang lebih baik
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
      });

      const text = response.text;
      if (!text) {
        throw new Error("Gagal menerima respon dari AI.");
      }

      setAnalysis(text);
    } catch (err: any) {
      console.error("AI Analysis Error:", err);
      setError(`Gagal menganalisis: ${err.message || "Pastikan koneksi internet stabil."}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-12">
      <div className="glass-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-indigo-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-4 rounded-2xl sm:rounded-3xl shadow-xl mb-4 sm:mb-6">
            <BrainCircuit className="text-white w-8 h-8 sm:w-12 sm:h-12" />
          </div>
          <h2 className="text-lg sm:text-3xl font-black text-white uppercase tracking-tight mb-2">Financial AI Analyst</h2>
          <p className="text-slate-400 max-w-sm font-bold text-[10px] sm:text-sm leading-relaxed mb-6 sm:mb-8">
            Dapatkan saran strategi keuangan otomatis berdasarkan data anggaran dan aset Anda.
          </p>
          
          <button 
            onClick={generateAnalysis}
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-xs tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Menganalisis...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Mulai Analisis
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-panel p-4 rounded-xl border-l-4 border-rose-500 flex items-center gap-3 bg-rose-500/10 animate-fadeIn">
          <AlertCircle className="text-rose-500 shrink-0" size={18} />
          <p className="text-rose-200 text-[10px] font-black uppercase">{error}</p>
        </div>
      )}

      {analysis && !isLoading && (
        <div className="glass-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-3">
            <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">Laporan Keuangan Cerdas</h3>
          </div>
          
          <div className="prose prose-invert max-w-none">
            <div className="text-slate-300 text-[11px] sm:text-sm leading-relaxed font-bold space-y-4 whitespace-pre-wrap">
              {analysis.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (trimmed.startsWith('#')) {
                  return <h3 key={i} className="font-black text-indigo-400 mt-4 mb-2 uppercase border-l-2 border-indigo-500 pl-2 text-xs sm:text-base">{trimmed.replace(/#/g, '').trim()}</h3>;
                }
                if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                  return (
                    <div key={i} className="flex gap-2 items-start ml-1 mb-1">
                      <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-slate-200">{trimmed.replace(/[-*]/, '').trim()}</span>
                    </div>
                  );
                }
                if (!trimmed) return <div key={i} className="h-1"></div>;
                return <p key={i} className="mb-1">{trimmed}</p>;
              })}
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 text-[8px] font-black uppercase text-slate-500 tracking-widest">
              <Wifi size={10} className="text-indigo-500" />
              Online Real-time Analysis
            </div>
            <button onClick={generateAnalysis} className="text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors flex items-center gap-2">
              <RefreshCw size={12} /> Perbarui Analisis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysis;