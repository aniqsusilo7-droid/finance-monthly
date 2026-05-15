import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MonthlyData } from '../types';
import { formatRupiah } from '../utils';
import { Sparkles, BrainCircuit, RefreshCw, AlertCircle, CheckCircle2, Wifi } from 'lucide-react';

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
      setError("Koneksi internet tidak terdeteksi. Silakan periksa jaringan Anda.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Inisialisasi Gemini API sesuai panduan (selalu gunakan process.env.GEMINI_API_KEY)
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY_MISSING");
      }

      const ai = new GoogleGenAI({ apiKey });
      
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
      1. Health Check: Evaluasi singkat kondisi bulan ini.
      2. Budget Efficiency: Analisis apakah pengeluaran aktual sesuai dengan anggaran.
      3. Aset & Investasi: Komentar tentang pertumbuhan aset.
      4. 3 Action Steps: Langkah nyata untuk bulan depan.
      
      Gunakan format Markdown yang profesional dan mudah dibaca di smartphone.`;

      // Menggunakan gemini-3-flash-preview untuk tugas teks dasar
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const text = response.text;
      if (!text) {
        throw new Error("EMPTY_RESPONSE");
      }

      setAnalysis(text);
    } catch (err: any) {
      console.error("AI Analysis Error:", err);
      
      if (err.message === "GEMINI_API_KEY_MISSING") {
        setError("API Key belum dikonfigurasi. Silakan atur GEMINI_API_KEY di menu Settings > Secrets.");
      } else if (err.message?.includes("403") || err.message?.includes("400") || err.message?.includes("API_KEY_INVALID")) {
        setError("API Key tidak valid atau akses ditolak. Silakan periksa key Anda di menu Settings > Secrets.");
      } else if (err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED")) {
        setError("Batas kuota API tercapai. Silakan coba lagi nanti atau hubungkan Billing Enabled Key.");
      } else {
        setError(`Terjadi kesalahan: ${err.message || "Gagal menghubungi server AI. Pastikan koneksi internet stabil."}`);
      }
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
          <p className="text-slate-400 max-w-sm font-bold text-[10px] sm:text-sm leading-relaxed mb-6 sm:mb-8 px-2">
            Konsultasikan strategi keuangan bulanan Anda dengan kecerdasan buatan Gemini AI.
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
        <div className="glass-panel p-4 rounded-xl border-l-4 border-rose-500 flex items-start gap-3 bg-rose-500/10 animate-fadeIn">
          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
          <div className="flex-1">
            <p className="text-rose-200 text-[10px] font-black uppercase tracking-tight leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {analysis && !isLoading && (
        <div className="glass-panel p-5 sm:p-10 rounded-[2rem] border border-white/5 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-3">
            <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
            <h3 className="text-[10px] sm:text-sm font-black text-white uppercase tracking-widest">Laporan Keuangan Cerdas Aniq</h3>
          </div>
          
          <div className="prose prose-invert max-w-none">
            <div className="text-slate-300 text-[10px] sm:text-sm leading-relaxed font-bold space-y-4 whitespace-pre-wrap px-1">
              {analysis.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (trimmed.startsWith('#') || (trimmed.length > 2 && trimmed === trimmed.toUpperCase() && !trimmed.includes(' '))) {
                  return <h3 key={i} className="font-black text-indigo-400 mt-5 mb-2 uppercase border-l-2 border-indigo-500 pl-2 text-[11px] sm:text-base">{trimmed.replace(/#/g, '').trim()}</h3>;
                }
                if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
                  return (
                    <div key={i} className="flex gap-2 items-start ml-1 mb-2">
                      <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-slate-200">{trimmed.replace(/^[-*\d.]/, '').trim()}</span>
                    </div>
                  );
                }
                if (!trimmed) return <div key={i} className="h-2"></div>;
                return <p key={i} className="mb-2">{trimmed}</p>;
              })}
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-[8px] font-black uppercase text-slate-500 tracking-widest">
              <Wifi size={10} className="text-indigo-500" />
              Connected to Google Gemini AI
            </div>
            <button onClick={generateAnalysis} className="text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors flex items-center gap-2 bg-indigo-500/5 px-4 py-2 rounded-lg">
              <RefreshCw size={12} /> Analisis Ulang
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysis;