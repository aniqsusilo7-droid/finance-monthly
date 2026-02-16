import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MonthlyData } from '../types';
import { formatRupiah } from '../utils';
import { Sparkles, BrainCircuit, RefreshCw, TrendingUp, AlertCircle, CheckCircle2, Wifi, WifiOff, Key } from 'lucide-react';

interface AIAnalysisProps {
  currentMonthData: MonthlyData;
  netIncome: number;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ currentMonthData, netIncome }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean>(!!process.env.API_KEY);

  // Cek ketersediaan API Key saat komponen dimuat
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected || !!process.env.API_KEY);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Asumsikan pemilihan berhasil sesuai instruksi teknis
      setHasKey(true);
      setError(null);
    } else {
      setError("Fitur pemilihan API Key tidak tersedia di browser ini. Pastikan Anda menggunakan lingkungan yang mendukung.");
    }
  };

  const generateAnalysis = async () => {
    // 1. Cek Koneksi Internet
    if (!navigator.onLine) {
      setError("Perangkat Anda sedang offline. Mohon hubungkan ke internet untuk menggunakan fitur AI Analysis.");
      return;
    }

    // 2. Cek API Key
    if (!process.env.API_KEY && !hasKey) {
      setError("API Key diperlukan untuk analisis. Silakan hubungkan API Key Anda.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Inisialisasi AI tepat sebelum digunakan untuk mengambil kunci terbaru
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const budgetDetails = JSON.stringify({
        income: formatRupiah(netIncome),
        needs: currentMonthData.budget.needs?.items.map(i => ({ name: i.name, budget: i.budget, actual: i.actual })),
        savings: currentMonthData.budget.savings?.items.map(i => ({ name: i.name, budget: i.budget, actual: i.actual })),
        debt: currentMonthData.budget.debt?.items.map(i => ({ name: i.name, budget: i.budget, actual: i.actual })),
        others: currentMonthData.budget.others?.items.map(i => ({ name: i.name, actual: i.actual })),
        investments: currentMonthData.investments.map(i => ({ name: i.name, value: i.currentValue, target: i.targetValue }))
      });

      const prompt = `Bertindaklah sebagai Konsultan Keuangan Pribadi Profesional. Analisis data keuangan berikut untuk bulan ini dan berikan wawasan mendalam dalam Bahasa Indonesia.
      
      Data Keuangan:
      ${budgetDetails}
      
      Format respon Anda harus meliputi:
      1. Ringkasan Singkat Kesehatan Keuangan (Gunakan nada yang menyemangati).
      2. Analisis Efisiensi Anggaran (Soroti area yang hemat atau overbudget).
      3. Analisis Aset & Investasi (Seberapa dekat dengan target).
      4. 3 Saran Praktis untuk bulan depan agar kondisi keuangan Aniq Susilo semakin kuat.
      
      Berikan respon dalam format Markdown yang rapi dengan heading dan poin-poin.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      if (!response || !response.text) {
        throw new Error("Server AI mengembalikan respon kosong.");
      }

      setAnalysis(response.text);
    } catch (err: any) {
      console.error("AI Analysis Error:", err);
      if (err.message?.includes('entity was not found') || err.message?.includes('404')) {
        setHasKey(false);
        setError("API Key tidak valid atau telah kedaluwarsa. Silakan hubungkan kembali.");
      } else {
        setError(`Terjadi kendala: ${err.message || "Gagal menghubungi AI. Pastikan internet Anda stabil."}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="glass-panel p-6 sm:p-10 rounded-[2.5rem] border border-indigo-500/20 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl group-hover:bg-indigo-600/20 transition-all"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-4 rounded-3xl shadow-xl mb-6 relative">
            <BrainCircuit className="text-white w-8 h-8 sm:w-12 sm:h-12" />
            <div className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-slate-900 ${navigator.onLine ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              {navigator.onLine ? <Wifi size={10} className="text-white" /> : <WifiOff size={10} className="text-white" />}
            </div>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter mb-4">Financial AI Intelligence</h2>
          <p className="text-slate-400 max-w-lg font-bold text-sm sm:text-base leading-relaxed mb-8">
            Dapatkan analisis cerdas dan rekomendasi strategis berdasarkan data keuangan Anda menggunakan teknologi Gemini AI yang selalu online.
          </p>
          
          <div className="flex flex-col gap-4">
            {!hasKey && (
              <button 
                onClick={handleOpenKeySelector}
                className="flex items-center gap-3 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all border border-slate-700"
              >
                <Key className="w-5 h-5 text-indigo-400" />
                Hubungkan API Key
              </button>
            )}

            <button 
              onClick={generateAnalysis}
              disabled={isLoading || (!hasKey && !process.env.API_KEY)}
              className={`flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Proses Analisis...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Mulai Analisis Online
                </>
              )}
            </button>
            
            {!hasKey && !process.env.API_KEY && (
              <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest animate-pulse">
                Silakan hubungkan API Key untuk mengaktifkan AI
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-rose-500 flex items-center gap-4 bg-rose-500/10 animate-fadeIn">
          <AlertCircle className="text-rose-500 shrink-0" size={24} />
          <p className="text-rose-200 text-sm font-black">{error}</p>
        </div>
      )}

      {analysis && !isLoading && (
        <div className="glass-panel p-6 sm:p-10 rounded-[2.5rem] border border-white/5 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
            <h3 className="text-lg font-black text-white uppercase tracking-widest">Laporan Analisis Cerdas</h3>
          </div>
          <div className="prose prose-invert max-w-none">
            <div className="text-slate-300 leading-relaxed font-medium space-y-4 whitespace-pre-wrap">
              {analysis.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (trimmed.startsWith('#')) {
                  const level = (line.match(/#/g) || []).length;
                  return <h3 key={i} className={`font-black text-indigo-400 mt-6 mb-3 uppercase border-l-2 border-indigo-500 pl-3 ${level === 1 ? 'text-2xl' : 'text-lg'}`}>{trimmed.replace(/#/g, '').trim()}</h3>;
                }
                if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                  return (
                    <div key={i} className="flex gap-3 items-start ml-2 mb-2">
                      <div className="mt-1.5 bg-indigo-500/30 rounded-full p-0.5">
                        <CheckCircle2 size={12} className="text-indigo-400" />
                      </div>
                      <span className="text-slate-200 font-bold">{trimmed.replace(/[-*]/, '').trim()}</span>
                    </div>
                  );
                }
                if (!trimmed) return <div key={i} className="h-2"></div>;
                return <p key={i} className="mb-2 font-bold text-slate-300">{trimmed}</p>;
              })}
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <TrendingUp size={14} className="text-indigo-500" />
              Dianalisis secara real-time melalui Jaringan Internet
            </div>
            <button onClick={generateAnalysis} className="text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors flex items-center gap-2 group">
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> Refresh Analisis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysis;