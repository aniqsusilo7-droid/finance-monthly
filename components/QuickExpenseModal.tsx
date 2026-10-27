import React, { useState, useEffect, useRef } from 'react';
import { BudgetData, BudgetItem, OtherBudgetItem } from '../types';
import { formatRupiah, parseRupiah, formatDateToLocalISO } from '../utils';
import { GoogleGenAI } from '@google/genai';
import CurrencyInput from './ui/CurrencyInput';
import {
  Sparkles,
  Zap,
  Mic,
  MicOff,
  ClipboardPaste,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  MessageSquare,
  HelpCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  X,
  Smartphone,
  ChevronDown,
  Check
} from 'lucide-react';

interface ParsedExpenseItem {
  id: string;
  name: string;
  amount: number;
  date: string;
  categoryKey: string; // 'needs' | 'savings' | 'debt' | 'others' | customCategoryId
  categoryName: string;
}

interface QuickExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetData: BudgetData;
  onSaveExpenses: (newExpenses: ParsedExpenseItem[]) => void;
  currentDate: Date;
  initialText?: string;
  isPrivacy?: boolean;
}

// Indonesian keywords map for instant local category detection
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  needs: [
    'makan', 'minum', 'sarapan', 'siang', 'malam', 'warteg', 'padang', 'soto', 'bakso', 'mie', 
    'nasi', 'beras', 'minyak', 'telur', 'sayur', 'bumbu', 'lauk', 'galon', 'gas', 'lpg', 
    'bensin', 'pertalite', 'pertamax', 'solar', 'parkir', 'tol', 'kereta', 'krl', 'ojol', 'gojek', 'grab', 
    'listrik', 'token', 'pdam', 'air', 'wifi', 'indihome', 'pulsa', 'kuota', 'paket data',
    'kontrakan', 'kost', 'kos', 'sewa', 'obat', 'dokter', 'vitamin', 'sabun', 'deterjen', 'odol', 'shampo'
  ],
  savings: [
    'tabung', 'tabungan', 'nabung', 'invest', 'investasi', 'saham', 'reksadana', 'reksa dana', 
    'emas', 'antam', 'crypto', 'bitcoin', 'bibit', 'bareksa', 'deposito', 'rdn', 'dana darurat'
  ],
  debt: [
    'cicilan', 'hutang', 'utang', 'pinjaman', 'pinjol', 'kredivo', 'spaylater', 'shopeepaylater',
    'kartu kredit', 'cc', 'kpr', 'leasing', 'motor', 'mobil', 'angsuran', 'bayar hutang'
  ],
  others: [
    'ngopi', 'kopi', 'kafe', 'cafe', 'starbucks', 'kenangan', 'janji jiwa', 'nongkrong',
    'nonton', 'bioskop', 'cinema', 'game', 'top up', 'steam', 'netflix', 'spotify', 'youtube',
    'jajan', 'snack', 'boba', 'belanja', 'baju', 'kaos', 'sepatu', 'skincare', 'jalan-jalan',
    'liburan', 'hiburan', 'hobi', 'mainan', 'hadiah', 'kado', 'tip', 'amal', 'sedekah'
  ]
};

const SAMPLE_TEXTS = [
  "Makan siang soto ayam 25rb, parkir motor 3k",
  "Beli bensin pertalite 50k tanggal 8 oktober",
  "Bayar wifi indihome 350.000 dan token listrik 100rb",
  "Kopi susu kenangan 22.000",
  "Transfer cicilan motor 650.000",
  "Beli galon aqua 20rb & gas lpg 22rb kemarin"
];

export const QuickExpenseModal: React.FC<QuickExpenseModalProps> = ({
  isOpen,
  onClose,
  budgetData,
  onSaveExpenses,
  currentDate,
  initialText = '',
  isPrivacy = false
}) => {
  const [inputText, setInputText] = useState(initialText);
  const [activeTab, setActiveTab] = useState<'input' | 'whatsapp' | 'shortcut'>('input');
  const [parsedItems, setParsedItems] = useState<ParsedExpenseItem[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Voice recording state (Web Speech API)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Available categories list
  const availableCategories = React.useMemo(() => {
    const list: { key: string; name: string }[] = [];
    if (budgetData.needs) list.push({ key: 'needs', name: budgetData.needs.name || 'Kebutuhan Pokok' });
    if (budgetData.savings) list.push({ key: 'savings', name: budgetData.savings.name || 'Tabungan & Investasi' });
    if (budgetData.debt) list.push({ key: 'debt', name: budgetData.debt.name || 'Hutang & Cicilan' });
    if (budgetData.custom && budgetData.custom.length > 0) {
      budgetData.custom.forEach(c => list.push({ key: c.id, name: c.name }));
    }
    if (budgetData.others) list.push({ key: 'others', name: 'Lain-lain / Hiburan' });
    return list;
  }, [budgetData]);

  // Initial text load
  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
      parseLocally(initialText);
    }
  }, [initialText]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Quick offline parser for Indonesian texts
  const parseLocally = (text: string) => {
    if (!text.trim()) {
      setParsedItems([]);
      return;
    }

    setErrorMessage(null);
    const defaultDateStr = formatDateToLocalISO(new Date());

    // Split text by lines, semicolons, or Indonesian conjunctions ('dan', '&', ',')
    const segments = text
      .split(/\n|;|\bdan\b|&|,/)
      .map(s => s.trim())
      .filter(s => s.length > 2);

    const detected: ParsedExpenseItem[] = [];

    for (const segment of segments) {
      // 1. Detect Amount
      // Match patterns like: "25rb", "25.000", "25000", "50k", "1.5jt", "Rp 50.000", "Rp50rb"
      const amountRegex = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta)?\b/i;
      const match = segment.match(amountRegex);

      let amount = 0;
      let cleanedItemName = segment;

      if (match) {
        const rawNumStr = match[1].replace(',', '.');
        const multiplierStr = (match[2] || '').toLowerCase();
        let baseNum = parseFloat(rawNumStr);

        if (multiplierStr === 'k' || multiplierStr === 'rb' || multiplierStr === 'ribu') {
          amount = Math.round(baseNum * 1000);
        } else if (multiplierStr === 'jt' || multiplierStr === 'juta') {
          amount = Math.round(baseNum * 1000000);
        } else {
          // If no unit, check if it's formatted as 25.000 or raw 25000
          if (match[1].includes('.') && match[1].split('.')[1].length === 3) {
            amount = parseInt(match[1].replace(/\./g, ''), 10);
          } else {
            amount = Math.round(baseNum);
            // If user types small number like "25" or "50", assume ribuan if < 1000
            if (amount < 1000 && (segment.toLowerCase().includes('rb') || segment.toLowerCase().includes('k'))) {
              amount = amount * 1000;
            }
          }
        }

        // Remove the matched price portion from item name
        cleanedItemName = segment.replace(match[0], '').trim();
      }

      // Clean up common filler words
      cleanedItemName = cleanedItemName
        .replace(/\b(beli|bayar|buat|untuk|sebesar|nominal|tgl|tanggal|seharga)\b/gi, '')
        .replace(/[:\-*•]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Check date keywords: "kemarin", "hari ini", "tgl 5", dll
      let itemDate = defaultDateStr;
      const lowerSegment = segment.toLowerCase();
      if (lowerSegment.includes('kemarin')) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        itemDate = formatDateToLocalISO(d);
        cleanedItemName = cleanedItemName.replace(/kemarin/gi, '').trim();
      }

      // Capitalize first letter of item name
      const finalName = cleanedItemName ? cleanedItemName.charAt(0).toUpperCase() + cleanedItemName.slice(1) : 'Pengeluaran';

      // 2. Guess Category
      let matchedKey = 'needs';
      let maxScore = 0;
      const searchTarget = (finalName + ' ' + segment).toLowerCase();

      // Check user custom categories first
      if (budgetData.custom) {
        for (const cust of budgetData.custom) {
          if (searchTarget.includes(cust.name.toLowerCase())) {
            matchedKey = cust.id;
            maxScore = 10;
            break;
          }
        }
      }

      if (maxScore < 10) {
        for (const [catKey, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
          for (const kw of keywords) {
            if (searchTarget.includes(kw)) {
              matchedKey = catKey;
              maxScore = 5;
              break;
            }
          }
          if (maxScore > 0) break;
        }
      }

      const categoryObj = availableCategories.find(c => c.key === matchedKey) || availableCategories[0] || { key: 'needs', name: 'Kebutuhan Pokok' };

      if (amount > 0 || finalName.length > 2) {
        detected.push({
          id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          name: finalName,
          amount: amount || 0,
          date: itemDate,
          categoryKey: categoryObj.key,
          categoryName: categoryObj.name
        });
      }
    }

    setParsedItems(detected);
  };

  // AI-Powered Deep Parser using Gemini
  const handleAiParse = async () => {
    if (!inputText.trim()) {
      setErrorMessage("Silakan ketik atau tempel teks pengeluaran terlebih dahulu.");
      return;
    }

    setIsAiProcessing(true);
    setErrorMessage(null);

    try {
      const apiKey = localStorage.getItem('user_gemini_api_key')?.trim() 
        || import.meta.env.VITE_GEMINI_API_KEY 
        || "AIzaSyDxYNvHt5a0VjhBVeFoJ9gxmas3HVTDgTo";

      const ai = new GoogleGenAI({ apiKey });

      const categoryDescriptions = availableCategories.map(c => `"${c.key}": "${c.name}"`).join(', ');

      const prompt = `Anda adalah asisten cerdas pencatat keuangan Indonesia.
Tugas Anda adalah mengekstrak semua pengeluaran dari teks pengguna (bisa berupa ketikan santai, chat WhatsApp, struk mutasi bank/e-wallet, atau format lainnya).

Kategori yang tersedia di aplikasi:
{ ${categoryDescriptions} }

Teks Pengguna:
"""
${inputText}
"""

Format Tanggal Default jika tidak disebut spesifik: "${formatDateToLocalISO(new Date())}".
Jika disebut "kemarin", hitung tanggal kemarin.

Keluarkan HANYA JSON array murni tanpa format markdown codeblock atau teks lain:
[
  {
    "name": "Nama Pengeluaran Ringkas & Jelas",
    "amount": 25000,
    "date": "YYYY-MM-DD",
    "categoryKey": "key_kategori_yang_paling_sesuai"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt
      });

      const responseText = response.text || '';
      // Clean JSON string
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("Gagal mengenali format pengeluaran. Menggunakan pembacaan standar.");
      }

      const parsedJson = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsedJson) && parsedJson.length > 0) {
        const mappedItems: ParsedExpenseItem[] = parsedJson.map((item: any, idx: number) => {
          const catObj = availableCategories.find(c => c.key === item.categoryKey) || availableCategories[0];
          return {
            id: 'ai_' + Date.now() + '_' + idx,
            name: String(item.name || 'Pengeluaran').trim(),
            amount: Number(item.amount) || 0,
            date: item.date || formatDateToLocalISO(new Date()),
            categoryKey: catObj.key,
            categoryName: catObj.name
          };
        });
        setParsedItems(mappedItems);
      } else {
        parseLocally(inputText);
      }
    } catch (err: any) {
      console.warn("AI parse fallback to local parser:", err);
      // Fallback seamlessly to local parser
      parseLocally(inputText);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Speech-to-Text handler (Web Speech API)
  const toggleVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Browser Anda belum mendukung input suara langsung. Silakan ketik langsung atau tempel teks dari WhatsApp.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const newText = inputText ? `${inputText} ${transcript}` : transcript;
        setInputText(newText);
        parseLocally(newText);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      setIsListening(false);
    }
  };

  // Paste from clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
        parseLocally(text);
      }
    } catch (err) {
      setErrorMessage("Tidak dapat mengakses clipboard. Silakan tempel secara manual di kotak teks.");
    }
  };

  // Save parsed items into budget
  const handleCommitSave = () => {
    if (parsedItems.length === 0) {
      setErrorMessage("Belum ada pengeluaran yang terdeteksi untuk disimpan.");
      return;
    }

    // Validate that items have at least name or amount > 0
    const validItems = parsedItems.filter(i => i.name.trim() && i.amount > 0);
    if (validItems.length === 0) {
      setErrorMessage("Pastikan nama dan nominal pengeluaran lebih dari 0.");
      return;
    }

    onSaveExpenses(validItems);
    setSuccessCount(validItems.length);
    setTimeout(() => {
      setSuccessCount(null);
      setInputText('');
      setParsedItems([]);
      onClose();
    }, 1200);
  };

  // Modify individual parsed item
  const updateParsedItem = (id: string, updates: Partial<ParsedExpenseItem>) => {
    setParsedItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        if (updates.categoryKey) {
          const cat = availableCategories.find(c => c.key === updates.categoryKey);
          if (cat) updated.categoryName = cat.name;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeParsedItem = (id: string) => {
    setParsedItems(prev => prev.filter(i => i.id !== id));
  };

  const addNewBlankItem = () => {
    setParsedItems(prev => [
      ...prev,
      {
        id: 'new_' + Date.now(),
        name: '',
        amount: 0,
        date: formatDateToLocalISO(new Date()),
        categoryKey: availableCategories[0]?.key || 'needs',
        categoryName: availableCategories[0]?.name || 'Kebutuhan Pokok'
      }
    ]);
  };

  // WhatsApp quick text format copy
  const sampleWaFormat = `*Pengeluaran Hari Ini:*
- Makan siang: 25.000
- Kopi kenangan: 18.000
- Bensin: 50.000`;

  const handleCopyWaFormat = () => {
    navigator.clipboard.writeText(sampleWaFormat);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const currentAppUrl = window.location.origin + window.location.pathname;
  const quickLinkExample = `${currentAppUrl}?add_expense=Makan%20siang%2025rb`;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      style={{
        paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 0.75rem), 1rem)',
        paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 0.75rem), 1rem)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 0.75rem)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 0.75rem)'
      }}
    >
      <div 
        className="glass-panel w-full max-w-2xl rounded-[2.2rem] border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh] text-white animate-scaleUp"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 p-2 shrink-0">
              <Zap size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  Input Cepat Pengeluaran
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase tracking-wider">
                  Ketik • WA • AI
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-medium text-slate-300">
                Ketik santai, salin chat WhatsApp, atau rekam suara Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-all"
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 pt-3 border-b border-white/5 flex gap-2 overflow-x-auto bg-slate-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('input')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'input'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap size={14} className={activeTab === 'input' ? 'text-indigo-400' : ''} />
            <span>Ketik / Tempel / Suara</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'whatsapp'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={14} className={activeTab === 'whatsapp' ? 'text-emerald-400' : ''} />
            <span>Format & WhatsApp Helper</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shortcut')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'shortcut'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone size={14} className={activeTab === 'shortcut' ? 'text-indigo-400' : ''} />
            <span>Pintasan iOS / Siri / Link</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-black flex items-center gap-3 animate-bounce">
              <CheckCircle2 size={20} className="text-emerald-400" />
              <span>Berhasil menyimpan {successCount} pengeluaran ke Anggaran!</span>
            </div>
          )}

          {/* TAB 1: INPUT LANGSUNG / TEMPEL */}
          {activeTab === 'input' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    Tuliskan atau Tempel Pengeluaran
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="text-[10px] sm:text-[11px] font-black uppercase bg-slate-800 hover:bg-slate-700 text-indigo-300 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1 transition-all active:scale-95"
                    >
                      <ClipboardPaste size={12} />
                      Tempel (Paste)
                    </button>
                    <button
                      type="button"
                      onClick={toggleVoiceRecognition}
                      className={`text-[10px] sm:text-[11px] font-black uppercase px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all active:scale-95 ${
                        isListening
                          ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700'
                      }`}
                    >
                      {isListening ? <MicOff size={12} /> : <Mic size={12} />}
                      {isListening ? 'Mendengarkan...' : 'Suara (Mic)'}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      parseLocally(e.target.value);
                    }}
                    placeholder="Contoh: Makan siang soto ayam 25rb, beli bensin pertalite 50k kemarin, kopi janji jiwa 18rb..."
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl p-3.5 sm:p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-xs sm:text-sm font-medium leading-relaxed resize-none shadow-inner"
                  />
                </div>

                {/* Example Quick Pills */}
                <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  <span className="text-[9px] font-black uppercase text-slate-500 shrink-0">Contoh:</span>
                  {SAMPLE_TEXTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputText(sample);
                        parseLocally(sample);
                      }}
                      className="text-[9px] sm:text-[10px] font-bold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded-lg transition-all shrink-0 active:scale-95 whitespace-nowrap"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons for Parsing */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[10px] font-bold text-slate-400">
                  {parsedItems.length > 0 ? `${parsedItems.length} item terdeteksi` : 'Ketik untuk mendeteksi item'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAiParse}
                    disabled={isAiProcessing || !inputText.trim()}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all active:scale-95"
                    title="Gunakan AI Gemini untuk teks panjang atau mutasi bank"
                  >
                    {isAiProcessing ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Sparkles size={13} className="text-amber-300" />
                    )}
                    <span>{isAiProcessing ? 'Menganalisis...' : 'Analisis AI'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={addNewBlankItem}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-black uppercase tracking-wider flex items-center gap-1 border border-slate-700 transition-all active:scale-95"
                  >
                    <Plus size={13} />
                    <span>+ Baris</span>
                  </button>
                </div>
              </div>

              {/* Parsed Items List / Preview */}
              {parsedItems.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <span>Rincian Pengeluaran Siap Masuk</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 text-[9px] border border-indigo-500/30">
                        Total: {formatRupiah(parsedItems.reduce((acc, i) => acc + (i.amount || 0), 0), isPrivacy)}
                      </span>
                    </h4>
                  </div>

                  <div className="space-y-2.5 max-h-60 sm:max-h-72 overflow-y-auto pr-1">
                    {parsedItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-indigo-500/40 transition-all space-y-2.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
                          {/* Item Name */}
                          <div className="sm:col-span-5">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                              Keterangan
                            </label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateParsedItem(item.id, { name: e.target.value })}
                              className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                              placeholder="Nama Pengeluaran"
                            />
                          </div>

                          {/* Item Amount */}
                          <div className="sm:col-span-4">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                              Nominal (Rp)
                            </label>
                            <input
                              type="text"
                              value={item.amount === 0 ? '' : formatRupiah(item.amount).replace('Rp', '').trim()}
                              onChange={(e) => updateParsedItem(item.id, { amount: parseRupiah(e.target.value) })}
                              className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-right text-emerald-400 focus:outline-none focus:border-indigo-500"
                              placeholder="0"
                            />
                          </div>

                          {/* Date and Delete */}
                          <div className="sm:col-span-3 flex items-center gap-1.5">
                            <div className="flex-1">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                                Tanggal
                              </label>
                              <input
                                type="date"
                                value={item.date}
                                onChange={(e) => updateParsedItem(item.id, { date: e.target.value })}
                                className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-2 py-1.5 text-[11px] font-bold text-center text-slate-200 focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeParsedItem(item.id)}
                              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all self-end"
                              title="Hapus baris ini"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Category Selector Pill */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/5">
                          <span className="text-[9px] font-black uppercase text-slate-400 mr-1">
                            Kategori:
                          </span>
                          {availableCategories.map((cat) => (
                            <button
                              key={cat.key}
                              type="button"
                              onClick={() => updateParsedItem(item.id, { categoryKey: cat.key })}
                              className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-lg border transition-all ${
                                item.categoryKey === cat.key
                                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                              }`}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WHATSAPP HELPER & TEMPLATE */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-300 font-black uppercase">
                  <MessageSquare size={18} />
                  <span>Cara Catat Lewat WhatsApp</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Anda bisa mengetik pengeluaran di chat WhatsApp pribadi (atau grup keluarga), lalu langsung salin dan tempel ke aplikasi ini.
                </p>
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/20 font-mono text-[11px] text-emerald-200 whitespace-pre-line leading-relaxed">
                  {sampleWaFormat}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyWaFormat}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedLink ? 'Format Tersalin!' : 'Salin Contoh Format WA'}</span>
                  </button>

                  <a
                    href="https://wa.me/?text=*Pengeluaran%20Hari%20Ini:*%0A-%20Makan:%2025.000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-slate-700 transition-all active:scale-95"
                  >
                    <ExternalLink size={12} />
                    <span>Buka WhatsApp Web / App</span>
                  </a>
                </div>
              </div>

              {/* Supported Formats Guide */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
                <h5 className="font-black text-white uppercase text-[11px]">Format yang Didukung:</h5>
                <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
                  <li><strong className="text-white">Bahasa Santai:</strong> "Makan padang 25rb, es teh 5k"</li>
                  <li><strong className="text-white">SMS / Notifikasi Bank:</strong> "Pembayaran di Warteg Barokah Rp 20.000 berhasil via QRIS"</li>
                  <li><strong className="text-white">Daftar Baris:</strong> Cocok untuk struk belanja banyak barang sekaligus</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: PINTASAN SIRI / IOS / DEEP LINK */}
          {activeTab === 'shortcut' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3">
                <div className="flex items-center gap-2.5 text-indigo-300 font-black uppercase">
                  <Smartphone size={18} />
                  <span>Pintasan iPhone (iOS Shortcuts) & URL Link</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Aplikasi ini mendukung parameter link otomatis <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300">?add_expense=...</code>. Saat link dibuka, jendela input pengeluaran langsung terisi otomatis!
                </p>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-white/10 text-[11px] font-mono text-indigo-200 break-all select-all">
                  {quickLinkExample}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(quickLinkExample);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedLink ? 'Link Tersalin!' : 'Salin Contoh URL'}</span>
                  </button>
                </div>
              </div>

              {/* iOS Shortcuts Steps */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
                <h5 className="font-black text-white uppercase text-[11px]">Cara Pasang di Aplikasi "Shortcuts" (iPhone / iPad):</h5>
                <ol className="space-y-2 text-slate-300 text-[11px] list-decimal list-inside">
                  <li>Buka aplikasi bawaan <strong className="text-white">Shortcuts (Pintasan)</strong> di iPhone Anda.</li>
                  <li>Buat Pintasan Baru & Tambahkan aksi <strong className="text-white">"Ask for Input"</strong> (Minta Teks: Misal "Pengeluaran apa?").</li>
                  <li>Tambahkan aksi <strong className="text-white">"Open URLs"</strong> dengan alamat: <code className="text-indigo-300">{currentAppUrl}?add_expense=Provided Input</code></li>
                  <li>Simpan pintasan ke Home Screen atau panggil lewat Siri: <em>"Hey Siri, Catat Pengeluaran"</em>!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black uppercase tracking-wider transition-all"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            {parsedItems.length > 0 && (
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 hidden sm:inline">
                {parsedItems.length} item siap dimasukkan
              </span>
            )}
            <button
              type="button"
              onClick={handleCommitSave}
              disabled={parsedItems.length === 0}
              className="px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
            >
              <CheckCircle2 size={16} />
              <span>Simpan ke Anggaran</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickExpenseModal;
