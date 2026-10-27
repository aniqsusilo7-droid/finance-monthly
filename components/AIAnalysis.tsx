import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { MonthlyData, BudgetCategory } from '../types';
import { formatRupiah } from '../utils';
import { 
  Sparkles, BrainCircuit, RefreshCw, AlertCircle, 
  CheckCircle2, Wifi, KeyRound, Eye, EyeOff, Settings, 
  X, Lock, ExternalLink, Copy, Check, Filter, TrendingDown,
  PieChart, ShieldCheck, Target, ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface AIAnalysisProps {
  currentMonthData: MonthlyData;
  netIncome: number;
}

type AnalysisMode = 'full' | 'savings' | 'efficiency';

const AIAnalysis: React.FC<AIAnalysisProps> = ({ currentMonthData, netIncome }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('full');
  const [isCopiedReport, setIsCopiedReport] = useState(false);

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

  // Helper to compile rich structured financial context for Gemini
  const prepareComprehensiveFinancialData = () => {
    const { salary, budget, investments = [], overtimeEntries = [], profile } = currentMonthData || {};

    const processCategory = (catName: string, cat?: BudgetCategory) => {
      const items = (cat?.items || []).map(i => {
        const bg = i.budget || 0;
        const ac = i.actual || 0;
        return {
          nama_item: i.name || 'Tanpa Nama',
          anggaran: formatRupiah(bg),
          realisasi: formatRupiah(ac),
          selisih: formatRupiah(bg - ac),
          status: ac > bg && bg > 0 ? 'OVERBUDGET' : (ac > 0 ? 'TERPAKE' : 'BELUM TERPAKAI'),
          tanggal: i.date || 'Tidak dicatat'
        };
      });

      const totalBudget = (cat?.items || []).reduce((a, b) => a + (b.budget || 0), 0);
      const totalActual = (cat?.items || []).reduce((a, b) => a + (b.actual || 0), 0);
      const limit = cat?.limit || null;
      const effectiveTarget = limit && limit > 0 ? limit : totalBudget;

      return {
        nama_pos: cat?.name || catName,
        limit_kategori: limit ? formatRupiah(limit) : 'Tidak ada limit khusus',
        total_anggaran_item: formatRupiah(totalBudget),
        total_realisasi_aktual: formatRupiah(totalActual),
        sisa_alokasi: formatRupiah(effectiveTarget - totalActual),
        status_kategori: totalActual > effectiveTarget && effectiveTarget > 0 ? 'MEMBENGKAK / OVER' : 'AMAN',
        jumlah_item: items.length,
        daftar_item: items,
        _rawActual: totalActual,
        _rawBudget: totalBudget
      };
    };

    const needs = processCategory("Kebutuhan Pokok", budget?.needs);
    const savings = processCategory("Tabungan & Investasi", budget?.savings);
    const debt = processCategory("Hutang & Cicilan", budget?.debt);

    const customCategories = (budget?.custom || []).map((cat, idx) => 
      processCategory(cat?.name || `Kategori Tambahan ${idx + 1}`, cat)
    );

    const othersItems = (budget?.others?.items || []).map(i => ({
      keterangan: i.name || 'Pengeluaran Lain',
      nominal: formatRupiah(i.actual || 0),
      tanggal: i.date || 'Tidak dicatat'
    }));
    const othersActual = (budget?.others?.items || []).reduce((a, b) => a + (b.actual || 0), 0);
    const othersAllocation = budget?.others?.allocation || 0;

    const others = {
      nama_pos: "Pengeluaran Lainnya / Tak Terduga",
      alokasi: formatRupiah(othersAllocation),
      total_realisasi: formatRupiah(othersActual),
      sisa_alokasi: formatRupiah(othersAllocation - othersActual),
      daftar_pengeluaran: othersItems
    };

    // Overall summary calculation using raw numbers
    const totalNeedsActual = needs._rawActual;
    const totalSavingsActual = savings._rawActual;
    const totalDebtActual = debt._rawActual;
    const totalCustomActual = customCategories.reduce((a, c) => a + c._rawActual, 0);
    
    const grandTotalActual = totalNeedsActual + totalSavingsActual + totalDebtActual + othersActual + totalCustomActual;

    const netCashFlow = netIncome - grandTotalActual;
    const savingsRate = netIncome > 0 ? ((totalSavingsActual + investments.reduce((a, b) => a + (b.currentValue || 0), 0)) / netIncome) * 100 : 0;
    const debtRatio = netIncome > 0 ? (totalDebtActual / netIncome) * 100 : 0;

    return {
      profil_pengguna: profile?.name || "Aniq Susilo",
      pemasukan: {
        penghasilan_bersih_take_home_pay: formatRupiah(netIncome),
        gaji_pokok: formatRupiah(salary?.basicSalary || 0),
        tunjangan_tempat_tinggal: formatRupiah(salary?.housingAllowance || 0),
        tunjangan_shift: formatRupiah(salary?.shiftAllowance || 0),
        jam_lembur: salary?.overtimeHours || 0,
        thr: formatRupiah(salary?.thr || 0),
        bonus: salary?.bonusMultiplier ? `${salary.bonusMultiplier}x Gaji` : '0'
      },
      ringkasan_makro: {
        total_pemasukan: formatRupiah(netIncome),
        total_realisasi_pengeluaran_keseluruhan: formatRupiah(grandTotalActual),
        sisa_arus_kas_neto: formatRupiah(netCashFlow),
        rasio_tabungan: `${savingsRate.toFixed(1)}%`,
        rasio_cicilan_hutang: `${debtRatio.toFixed(1)}%`
      },
      pos_pos_anggaran: {
        kebutuhan_pokok: needs,
        tabungan_dan_investasi: savings,
        hutang_dan_cicilan: debt,
        kategori_custom_tambahan: customCategories,
        pengeluaran_lainnya: others
      },
      portofolio_investasi: (investments || []).map(inv => ({
        nama_aset: inv.name,
        nilai_saat_ini: formatRupiah(inv.currentValue || 0),
        target_nilai: formatRupiah(inv.targetValue || 0),
        pencapaian_persen: inv.targetValue > 0 ? `${Math.min(100, Math.round(((inv.currentValue || 0) / inv.targetValue) * 100))}%` : '0%'
      })),
      catatan_lembur: {
        total_entri_lembur: overtimeEntries?.length || 0
      }
    };
  };

  const generateAnalysis = async () => {
    if (!navigator.onLine) {
      setError("Koneksi internet tidak terdeteksi. Silakan periksa jaringan Anda.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const apiKey = localStorage.getItem('user_gemini_api_key')?.trim() || import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        setIsConfigOpen(true);
        throw new Error("GEMINI_API_KEY_MISSING");
      }

      const ai = new GoogleGenAI({ apiKey });
      const financialContext = prepareComprehensiveFinancialData();
      const budgetDetailsJson = JSON.stringify(financialContext, null, 2);

      let modePromptInstruction = "";
      if (analysisMode === 'efficiency') {
        modePromptInstruction = "FOKUS UTAMA: Lakukan audit ketat pada kebocoran anggaran, pengeluaran berlebihan (overbudget), dan identifikasi pos-pos mana saja yang bisa dipangkas untuk efisiensi maksimal.";
      } else if (analysisMode === 'savings') {
        modePromptInstruction = "FOKUS UTAMA: Lakukan analisis optimalisasi alokasi tabungan, pertumbuhan aset investasi, serta strategi percepatan pencapaian target keuangan jangka panjang.";
      } else {
        modePromptInstruction = "FOKUS UTAMA: Lakukan bedah komprehensif menyeluruh pada semua pos anggaran dan item pengeluaran secara seimbang dan mendalam.";
      }

      const prompt = `Bertindaklah sebagai Senior Certified Financial Planner (CFP) & Analis Keuangan Pribadi Tingkat Lanjut.
Lakukan analisis **BEDAH MENDALAM DENGAN SANGAT COMPREHENSIVE DAN DETAIL** pada seluruh data keuangan bulanan milik ${financialContext.profil_pengguna}.

${modePromptInstruction}

CRITICAL REQUIREMENT: Anda WAJIB membedah SETIAP POS ANGGARAN (Kebutuhan Pokok, Tabungan & Investasi, Hutang & Cicilan, Kategori Custom/Tambahan, dan Pengeluaran Lainnya) beserta ITEM-ITEM DI DALAMNYA SATU PER SATU secara rinci. Jangan melewatkan kategori mana pun!

Data Keuangan Lengkap & Terstruktur (JSON):
\`\`\`json
${budgetDetailsJson}
\`\`\`

Berikan laporan analisis dalam Bahasa Indonesia dengan format Markdown yang rapi, profesional, dan menggunakan struktur berikut:

# 📊 1. RINGKASAN EKSEKUTIF & HEALTH CHECK KEUANGAN
- **Skor Kesehatan Keuangan**: [Berikan Skor x/100 beserta status: SEHAT / WASPADA / KRITIS]
- **Evaluasi Makro Arus Kas**: Bahas total pemasukan (${financialContext.ringkasan_makro.total_pemasukan}) vs total pengeluaran (${financialContext.ringkasan_makro.total_realisasi_pengeluaran_keseluruhan}) dan Sisa Arus Kas (${financialContext.ringkasan_makro.sisa_arus_kas_neto}).
- **Indikator Rasio Utama**: Bahas Rasio Tabungan (${financialContext.ringkasan_makro.rasio_tabungan}) & Rasio Hutang (${financialContext.ringkasan_makro.rasio_cicilan_hutang}) terhadap norma keuangan ideal.

# 🔍 2. BEDAH MENDALAM PER POS ANGGARAN & ITEM PENGELUARAN
Ulas satu per satu secara terperinci setiap pos di bawah ini:

### A. Pos Kebutuhan Pokok
- Evaluasi Total Anggaran vs Realisasi & Limit.
- Bedah item per item (sebutkan nama item, nominal anggaran vs realisasi).
- Analisis item yang paling dominan, efisien, atau overbudget.

### B. Pos Tabungan & Investasi
- Evaluasi kedisiplinan alokasi masa depan.
- Bedah item per item di dalam pos tabungan.

### C. Pos Hutang & Cicilan
- Evaluasi rasio beban cicilan bulanan.
- Bedah item per item cicilan/hutang yang ada.

### D. Pos Kategori Custom / Tambahan (PENTING)
- Bedah setiap kategori custom yang dibuat pengguna satu per satu beserta limit & item pengeluaran di dalamnya. Jika tidak ada, berikan catatan.

### E. Pos Pengeluaran Lainnya / Tak Terduga
- Evaluasi pengeluaran insidental & barang/jasa acak yang dicatat.

# ⚠️ 3. TOP EXPENSES & DETEKSI KEBOCORAN HALUS
- **5 Pengeluaran Terbesar**: Sebutkan 5 item pengeluaran nominal terbesar bulan ini dan dampaknya pada arus kas.
- **Anomali / Overbudget Alert**: Soroti item yang melebihi batas anggaran atau berpotensi menjadi kebocoran halus (latte factor).

# 📈 4. PORTOFOLIO & PERTUMBUHAN ASET
- Analisis perkembangan aset investasi (${financialContext.portofolio_investasi.length} instrumen) vs targetnya.
- Saran diversifikasi atau akselerasi alokasi.

# 💡 5. ACTION PLAN STRATEGIS (5 LANGKAH KONKRET BULAN DEPAN)
1. [Langkah taktis 1]
2. [Langkah taktis 2]
3. [Langkah taktis 3]
4. [Langkah taktis 4]
5. [Langkah taktis 5]

Gunakan bahasa yang lugas, empatik, berbasis data, dan terstruktur dengan bullet points serta cetak tebal untuk angka penting.`;

      let text = '';
      try {
        // Primary model according to Gemini API guidance
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });
        text = response.text || '';
      } catch (firstErr) {
        console.warn("gemini-3.6-flash failed, trying gemini-flash-latest fallback:", firstErr);
        const responseFallback = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: prompt,
        });
        text = responseFallback.text || '';
      }

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

  const handleCopyReport = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis);
    setIsCopiedReport(true);
    setTimeout(() => setIsCopiedReport(false), 2000);
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
          <p className="text-slate-400 max-w-lg font-bold text-[10px] sm:text-sm leading-relaxed mb-6 px-2">
            Bedah secara mendalam seluruh pos anggaran, item pengeluaran, serta portofolio investasi Anda dengan rekomendasi taktis dari Gemini AI.
          </p>

          {/* Mode Analisis Selector */}
          <div className="w-full max-w-xl bg-slate-950/60 p-1.5 rounded-2xl border border-white/10 flex items-center justify-between mb-6 text-[10px] sm:text-xs font-black uppercase">
            <button
              onClick={() => setAnalysisMode('full')}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                analysisMode === 'full' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PieChart size={14} /> Bedah Komprehensif
            </button>
            <button
              onClick={() => setAnalysisMode('efficiency')}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                analysisMode === 'efficiency' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingDown size={14} /> Audit Efisiensi
            </button>
            <button
              onClick={() => setAnalysisMode('savings')}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                analysisMode === 'savings' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target size={14} /> Optimalisasi Aset
            </button>
          </div>

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
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-xs tracking-widest transition-all shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Membedah Seluruh Pos Anggaran...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Mulai Bedah Pos Anggaran
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
        <div className="glass-panel p-6 sm:p-10 rounded-[2rem] border border-white/10 shadow-2xl animate-fadeIn space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-xs sm:text-base font-black text-white uppercase tracking-wider">Laporan Bedah Keuangan Mendalam</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Analisis Komprehensif Berbasis Gemini AI</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={handleCopyReport}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
              >
                {isCopiedReport ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {isCopiedReport ? "Tersalin!" : "Salin Laporan"}
              </button>
            </div>
          </div>
          
          <div className="prose prose-invert max-w-none text-slate-200">
            <Markdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-sm sm:text-lg font-black text-indigo-300 uppercase tracking-wider mt-8 mb-4 border-b border-indigo-500/30 pb-2.5 flex items-center gap-2 bg-indigo-950/40 p-3 rounded-2xl border-l-4 border-l-indigo-500">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xs sm:text-base font-black text-indigo-400 uppercase tracking-wider mt-6 mb-3 border-l-4 border-indigo-500 pl-3">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-wide mt-5 mb-2.5 flex items-center gap-2">
                    <ArrowUpRight size={14} className="text-indigo-400 shrink-0" />
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed mb-3">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="space-y-2.5 my-4 pl-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="space-y-2.5 my-4 pl-1 list-decimal list-inside text-xs sm:text-sm text-slate-300 font-medium">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 font-medium leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-white/5 shadow-inner">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0 shadow-sm shadow-indigo-500/50" />
                    <div className="flex-1">{children}</div>
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-black text-white bg-indigo-500/15 px-2 py-0.5 rounded-lg text-indigo-200 border border-indigo-500/30">
                    {children}
                  </strong>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-5 rounded-2xl border border-slate-800 shadow-xl">
                    <table className="w-full text-left text-xs text-slate-300 border-collapse">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-slate-900 font-black uppercase text-[10px] text-indigo-300 tracking-wider">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-slate-900/40 transition-colors">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="p-3.5 border-b border-slate-800 font-black uppercase tracking-wider">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="p-3.5 font-bold">{children}</td>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-amber-500 bg-amber-500/10 p-4 rounded-r-2xl text-amber-200 text-xs font-bold my-4 leading-relaxed">
                    {children}
                  </blockquote>
                )
              }}
            >
              {analysis}
            </Markdown>
          </div>
          
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500 tracking-widest">
              <Wifi size={12} className="text-emerald-400 animate-pulse" />
              Connected to Google Gemini AI Engine
            </div>
            <button 
              onClick={generateAnalysis} 
              className="w-full sm:w-auto text-[10px] font-black uppercase tracking-widest text-indigo-300 hover:text-white transition-all flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 px-5 py-2.5 rounded-xl border border-indigo-500/30"
            >
              <RefreshCw size={12} /> Analisis Ulang Pos Anggaran
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysis;
