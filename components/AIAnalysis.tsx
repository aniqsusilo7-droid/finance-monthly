import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MonthlyData } from '../types';
import { formatRupiah } from '../utils';
import { Sparkles, BrainCircuit, RefreshCw, AlertCircle, CheckCircle2, Wifi, KeyRound, Globe, X, Save, Settings } from 'lucide-react';

interface AIAnalysisProps {
  currentMonthData: MonthlyData;
  netIncome: number;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ currentMonthData, netIncome }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isKeySelected, setIsKeySelected] = useState(false);
  
  // State untuk manajemen API Key manual
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);

  // Cek status API Key saat komponen dimuat
  useEffect(() => {
    const checkKeyStatus = async () => {
      // 1. Cek LocalStorage untuk custom key
      const localKey = localStorage.getItem('user_gemini_api_key');
      if (localKey) {
        setSavedKey(localKey);
        setCustomKey(localKey);
      }

      // 2. Cek AI Studio environment
      if ((window as any).aistudio) {
        try {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          setIsKeySelected(hasKey);
        } catch (e) {
          console.error("Gagal mengecek status API Key AI Studio:", e);
        }
      }
    };
    checkKeyStatus();
  }, []);

  const handleSaveKey = () => {
    if (customKey.trim()) {
      localStorage.setItem('user_gemini_api_key', customKey.trim());
      setSavedKey(customKey.trim());
      setShowKeyInput(false);
      setError(null);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('user_gemini_api_key');
    setSavedKey(null);
    setCustomKey('');
    setShowKeyInput(false);
  };

  const handleOpenKeyPicker = async () => {
    if ((window as any).aistudio) {
      try {
        await (window as any).aistudio.openSelectKey();
        setIsKeySelected(true);
        setError(null);
      } catch (e) {
        setError("Gagal membuka pemilihan API Key.");
      }
    } else {
      // Jika tidak di AI Studio, buka input manual
      setShowKeyInput(true);
    }
  };

  const generateAnalysis = async () => {
    // Reset state error
    setError(null);

    // 1. Cek Koneksi Internet
    if (!navigator.onLine) {
      setError("Koneksi internet tidak terdeteksi. Silakan periksa jaringan smartphone Anda.");
      return;
    }

    // 2. Resolusi API Key (Prioritas: Env -> LocalStorage -> AI Studio)
    let apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY) as string;
    
    // Jika env kosong, gunakan saved key dari localStorage
    if (!apiKey || apiKey.trim() === "" || apiKey === "undefined") {
        apiKey = savedKey || "";
    }

    // Jika masih kosong, cek flow AI Studio atau minta input
    if (!apiKey || apiKey.trim() === "" || apiKey === "undefined") {
      if ((window as any).aistudio) {
        // Cek apakah user sudah select key di AI Studio tapi belum ter-inject
        if (!isKeySelected) {
           setError("API Key belum dipilih. Klik tombol 'Pilih API Key' di bawah.");
           return;
        }
        // Jika isKeySelected true tapi apiKey masih kosong, kita tetap butuh key.
        // Biasanya AI Studio akan meng-inject ke process.env.API_KEY setelah refresh.
      } else {
        // Lingkungan standar (Smartphone/Browser biasa)
        setShowKeyInput(true);
        setError("API Key diperlukan. Silakan masukkan API Key Google Gemini Anda di bawah.");
        return;
      }
    }

    setIsLoading(true);
    
    try {
      // Inisialisasi Gemini API dengan key yang sudah di-resolve
      // Perhatikan: Jika menggunakan AI Studio, apiKey mungkin tetap kosong di sini jika bergantung pada injection otomatis,
      // namun logic di atas mencoba menangani fallback.
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const budgetDetails = JSON.stringify({
        income: formatRupiah(netIncome),
        needs: currentMonthData.budget.needs?.items.map(i => ({ name: i.name, budget: i.budget, actual: i.actual })),
        savings: currentMonthData.budget.savings?.items.map(i => ({ name: i.name, budget: i.budget, actual: i.actual })),
        debt: currentMonthData.budget.debt?.items.map(i => ({ name: i.name, budget: i.budget, actual: i.actual })),
        others: currentMonthData.budget.others?.items.map(i => ({ name: i.name, actual: i.actual })),
        investments: currentMonthData.investments.map(i => ({ name: i.name, value: i.currentValue, target: i.targetValue }))
      });

      const prompt = `Lakukan analisis mendalam pada data keuangan bulanan berikut untuk Aniq Susilo.
      
      Data: ${budgetDetails}
      
      Berikan respon dalam Bahasa Indonesia yang sangat profesional dan mudah dibaca di layar HP smartphone (gunakan bullet points dan teks tebal).
      Fokus pada:
      1. Health Check (Kesehatan Keuangan)
      2. Budget Efficiency (Efisiensi Anggaran)
      3. Aset & Investasi (Pertumbuhan Kekayaan)
      4. 3 Langkah Strategis untuk bulan depan.
      
      Jangan gunakan jargon yang terlalu rumit. Gunakan format Markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const text = response.text;
      if (!text) throw new Error("Respon AI kosong.");
      
      setAnalysis(text);
    } catch (err: any) {
      console.error("AI Analysis Error:", err);
      
      if (err.message?.includes("entity was not found") || err.message?.includes("API key")) {
        setError("API Key tidak valid atau akses ditolak. Silakan periksa key Anda.");
        if (savedKey) {
            setShowKeyInput(true); // Buka input agar user bisa memperbaiki
        }
      } else {
        setError(`Terjadi kesalahan: ${err.message || "Gagal menghubungi server AI."}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-16">
      {/* AI Hero Card */}
      <div className="glass-panel p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-indigo-500/20 shadow-2xl relative overflow-hidden text-center">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="inline-flex bg-gradient-to-br from-indigo-500 to-blue-600 p-4 rounded-2xl sm:rounded-3xl shadow-xl mb-6 shadow-indigo-900/40">
            <BrainCircuit className="text-white w-8 h-8 sm:w-12 sm:h-12" />
          </div>
          <h2 className="text-lg sm:text-3xl font-black text-white uppercase tracking-tight mb-2">Financial AI Analyst</h2>
          <p className="text-slate-400 max-w-sm mx-auto font-bold text-[10px] sm:text-sm leading-relaxed mb-6">
            Analisis cerdas untuk strategi keuangan Aniq Susilo, dioptimalkan untuk performa online smartphone.
          </p>

          {/* Status Key Manual */}
          {savedKey && (
             <div className="flex justify-center mb-6">
                <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 backdrop-blur-sm">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Custom Key Active</span>
                    <button onClick={handleClearKey} className="ml-2 text-slate-500 hover:text-rose-500 transition-colors p-1"><X size={12}/></button>
                </div>
             </div>
          )}
          
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button 
              onClick={generateAnalysis}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-xs tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Mulai Analisis
                </>
              )}
            </button>

            {/* Fallback & Manual Input Button */}
            {!savedKey && !process.env.API_KEY && (
              <button 
                onClick={handleOpenKeyPicker}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-800/80 text-indigo-400 rounded-xl font-black uppercase text-[9px] tracking-widest border border-slate-700 transition-all hover:bg-slate-700"
              >
                {(window as any).aistudio ? <KeyRound size={14} /> : <Settings size={14} />}
                {(window as any).aistudio ? 'Pilih API Key' : 'Setup API Key Manual'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Manual Key Input Form */}
      {showKeyInput && (
         <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 animate-fadeIn">
            <div className="flex justify-between items-center mb-3">
               <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                 <KeyRound size={14} className="text-indigo-400"/> Konfigurasi API Key
               </h3>
               <button onClick={() => setShowKeyInput(false)} className="text-slate-500 hover:text-white"><X size={16}/></button>
            </div>
            <p className="text-[9px] text-slate-400 font-bold mb-3 leading-relaxed">
               Masukkan API Key Google Gemini Anda untuk mengaktifkan analisis. Key disimpan di browser (Local Storage) Anda.
            </p>
            <div className="flex gap-2">
               <input 
                 type="password" 
                 value={customKey}
                 onChange={(e) => setCustomKey(e.target.value)}
                 className="flex-1 bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-indigo-500 outline-none transition-all placeholder-slate-700"
                 placeholder="Tempel API Key di sini..."
               />
               <button 
                 onClick={handleSaveKey}
                 className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2"
               >
                 <Save size={16} />
               </button>
            </div>
            <div className="mt-3 text-[8px] text-slate-500 font-black uppercase tracking-wider text-center">
               <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 underline decoration-indigo-400/30 underline-offset-4">Dapatkan API Key di sini</a>
            </div>
         </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="glass-panel p-4 rounded-xl border-l-4 border-rose-500 flex items-start gap-3 bg-rose-500/10 animate-fadeIn">
          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
          <div className="flex-1">
            <p className="text-rose-200 text-[10px] font-black uppercase tracking-tight leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Analysis Result */}
      {analysis && !isLoading && (
        <div className="glass-panel p-6 sm:p-10 rounded-[2rem] border border-white/5 shadow-xl animate-fadeIn relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
              <h3 className="text-[10px] sm:text-sm font-black text-white uppercase tracking-widest">Financial Strategy Report</h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
               <Globe size={10} className="text-emerald-500" />
               <span className="text-[8px] font-black text-emerald-500 uppercase">Live Analysis</span>
            </div>
          </div>
          
          <div className="prose prose-invert max-w-none">
            <div className="text-slate-300 text-[11px] sm:text-sm leading-relaxed font-bold space-y-5 whitespace-pre-wrap">
              {analysis.split('\n').map((line, i) => {
                const trimmed = line.trim();
                // Deteksi Header Markdown atau Teks Kapital Besar
                if (trimmed.startsWith('#') || (trimmed.length > 5 && trimmed === trimmed.toUpperCase() && !trimmed.includes(' '))) {
                  return <h3 key={i} className="font-black text-indigo-400 mt-6 mb-3 uppercase border-l-2 border-indigo-500 pl-3 text-xs sm:text-base tracking-tight">{trimmed.replace(/#/g, '').trim()}</h3>;
                }
                // Deteksi List
                if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
                  return (
                    <div key={i} className="flex gap-3 items-start ml-1 mb-2 bg-white/5 p-3 rounded-xl border border-white/5">
                      <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-slate-200">{trimmed.replace(/^[-*\d.]/, '').trim()}</span>
                    </div>
                  );
                }
                if (!trimmed) return <div key={i} className="h-2"></div>;
                return <p key={i} className="mb-2 px-1">{trimmed}</p>;
              })}
            </div>
          </div>
          
          <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em]">
              Powered by Google Gemini 3 Flash
            </p>
            <button onClick={generateAnalysis} className="w-full sm:w-auto text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors flex items-center justify-center gap-2 bg-indigo-500/5 px-6 py-3 rounded-xl border border-indigo-500/10">
              <RefreshCw size={14} /> Perbarui Analisis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysis;