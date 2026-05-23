import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MonthlyData } from '../types';
import { formatRupiah } from '../utils';
import { 
  Sparkles, BrainCircuit, RefreshCw, AlertCircle, 
  CheckCircle2, Wifi, KeyRound, Eye, EyeOff, Settings, 
  X, Lock, ExternalLink, Copy, Check
} from 'lucide-react';

interface AIAnalysisProps {
  currentMonthData: MonthlyData;
  netIncome: number;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ currentMonthData, netIncome }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual API Key State
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    return localStorage.getItem('user_gemini_api_key') || '';
  });
  const [showKey, setShowKey] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(() => {
    const stored = localStorage.getItem('user_gemini_api_key');
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    return !stored && !envKey;
  });
  const [savedKeyFeedback, setSavedKeyFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const keyToProvide = "AIzaSyDxYNvHt5a0VjhBVeFoJ9gxmas3HVTDgTo";

  const handleApplyKey = () => {
    setApiKeyInput(keyToProvide);
    navigator.clipboard.writeText(keyToProvide);
    setCopied(true);
    setSavedKeyFeedback("Key berhasil disalin & dimasukkan!");
    setTimeout(() => {
      setCopied(false);
      setSavedKeyFeedback(null);
    }, 2000);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = apiKeyInput.trim();
    if (trimmed) {
      localStorage.setItem('user_gemini_api_key', trimmed);
      setSavedKeyFeedback("API Key berhasil disimpan!");
      setError(null);
      setTimeout(() => {
        setSavedKeyFeedback(null);
        setIsConfigOpen(false);
      }, 1500);
    } else {
      localStorage.removeItem('user_gemini_api_key');
      setSavedKeyFeedback("API Key terhapus.");
      setTimeout(() => setSavedKeyFeedback(null), 1500);
    }
  };

  const handleRemoveKey = () => {
    localStorage.removeItem('user_gemini_api_key');
    setApiKeyInput('');
    setSavedKeyFeedback("API Key berhasil dihapus.");
    setTimeout(() => setSavedKeyFeedback(null), 1500);
  };

  const currentActiveKey = apiKeyInput.trim() || import.meta.env.VITE_GEMINI_API_KEY || '';

  const generateAnalysis = async () => {
    // 1. Cek Koneksi Internet
    if (!navigator.onLine) {
      setError("Koneksi internet tidak terdeteksi. Silakan periksa jaringan Anda.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Inisialisasi Gemini API secara aman (mendahulukan key manual dari user)
      const apiKey = localStorage.getItem('user_gemini_api_key')?.trim() || import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        setIsConfigOpen(true);
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

      // Menggunakan gemini-3.5-flash sesuai rekomendasi skill
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
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
        setError("API Key belum dikonfigurasi. Silakan masukkan API Key Anda menggunakan dialog 'Setup Manual API Key' di bawah.");
      } else if (err.message?.includes("403") || err.message?.includes("400") || err.message?.includes("API_KEY_INVALID")) {
        setError("API Key tidak valid atau akses ditolak. Silakan periksa kembali Gemini API Key yang Anda masukkan.");
      } else if (err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED")) {
        setError("Batas kuota API tercapai. Silakan coba lagi nanti atau gunakan Free/Premium API Key yang lain.");
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
          <p className="text-slate-400 max-w-sm font-bold text-[10px] sm:text-sm leading-relaxed mb-4 px-2">
            Konsultasikan strategi keuangan bulanan Anda dengan kecerdasan buatan Gemini AI.
          </p>

          {/* Status API Key & Toggle Setup */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            {currentActiveKey ? (
              <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                <CheckCircle2 size={10} />
                API Key {apiKeyInput.trim() ? 'Manual Setup' : 'Default Active'}
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                <AlertCircle size={10} />
                API Key Diperlukan
              </div>
            )}
            
            <button 
              type="button"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 border border-white/5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all"
            >
              <Settings size={10} className={isConfigOpen ? "rotate-45" : ""} />
              {isConfigOpen ? 'Tutup Setup Key' : 'Setup Manual Key'}
            </button>
          </div>

          {/* Form Setup Manual API Key */}
          {isConfigOpen && (
            <div className="w-full max-w-md bg-slate-950/60 border border-white/10 p-5 rounded-2xl text-left mb-6 relative animate-fadeIn shadow-inner">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <KeyRound size={14} className="text-indigo-400" />
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Setup Manual Gemini Key</h4>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsConfigOpen(false)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Quick Fill Key Default */}
              <div className="mb-4 bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-3 sm:p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase text-indigo-400 tracking-wider">Default Demo Key Tersedia</span>
                  <button
                    type="button"
                    onClick={handleApplyKey}
                    className="flex items-center gap-1.5 text-[8px] font-black uppercase text-white bg-indigo-600/80 hover:bg-indigo-600 px-2.5 py-1 rounded-lg transition-all active:scale-95 shadow-md"
                  >
                    {copied ? (
                      <>
                        <Check size={10} /> Berhasil
                      </>
                    ) : (
                      <>
                        <Copy size={10} /> Salin & Gunakan
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between bg-slate-950/80 rounded-lg p-2 font-mono text-[9px] sm:text-[10px] text-indigo-300 select-all overflow-hidden text-ellipsis border border-indigo-500/10">
                  {keyToProvide}
                </div>
                <p className="text-[8px] text-slate-400 leading-normal">
                  *Klik tombol untuk menyalin dan mengisi formulir di bawah secara instan.
                </p>
              </div>

              <form onSubmit={handleSaveKey} className="space-y-3.5">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">API Key Anda</label>
                    <a 
                      href="https://aistudio.google.com/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[8px] font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase tracking-wider transition-colors"
                    >
                      Dapatkan Key Gratis <ExternalLink size={8} />
                    </a>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                      type={showKey ? "text" : "password"} 
                      value={apiKeyInput} 
                      onChange={(e) => setApiKeyInput(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-850" 
                      placeholder="Masukkan Gemini API Key (AIzaSy...)" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowKey(!showKey)} 
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                    >
                      {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {savedKeyFeedback && (
                  <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest text-center py-1">
                    {savedKeyFeedback}
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                  >
                    Simpan Key
                  </button>
                  {localStorage.getItem('user_gemini_api_key') && (
                    <button 
                      type="button" 
                      onClick={handleRemoveKey}
                      className="py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <p className="text-[8px] text-slate-500 leading-normal pl-1">
                  *Key disimpan aman di browser Anda lokal (localStorage) dan tidak dikirimkan ke server mana pun kecuali API resmi Google.
                </p>
              </form>
            </div>
          )}
          
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