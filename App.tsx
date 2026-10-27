import React, { useState, useEffect } from 'react';
import { AppState, MonthlyData, DEFAULT_SALARY, DEFAULT_BUDGET, DEFAULT_PROFILE, OvertimeEntry } from './types';
import OvertimeTracker from './components/OvertimeTracker'; 
import SalarySlip from './components/SalarySlip';
import Budget from './components/Budget';
import { BudgetHistory } from './components/BudgetHistory';
import MonthlyCharts from './components/MonthlyCharts';
import Investments from './components/Investments';
import YearlySummary from './components/YearlySummary';
import AIAnalysis from './components/AIAnalysis';
import Login from './components/Login';
import { InstallPwaModal, usePwaInstall } from './components/InstallPwaModal';
import { QuickExpenseModal } from './components/QuickExpenseModal';
import { calculateGrossIncome, calculateTax, calculateOvertime, calculateBonus, calculateEqvHours, formatRupiah, getBudgetMonth, getBudgetPeriodLabel, getInitialBudgetMonthDate, formatDateToLocalISO } from './utils';
import { Wallet, LayoutDashboard, PieChart, TrendingUp, Calendar, ChevronLeft, ChevronRight, Cloud, Loader2, CheckCircle2, Sparkles, Sun, Moon, LogOut, Clock, Eye, EyeOff, Copy, AlertCircle, History, Smartphone, Download, Share2, Zap } from 'lucide-react';
import { collection, getDocs, doc, setDoc, getDocsFromCache } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebaseConfig';

const TABS = [
  { id: 'ot', label: 'Lembur', icon: Clock },
  { id: 'salary', label: 'Gaji', icon: Wallet },
  { id: 'budget', label: 'Anggaran', icon: LayoutDashboard },
  { id: 'history', label: 'Riwayat', icon: History },
  { id: 'charts', label: 'Grafik', icon: PieChart },
  { id: 'invest', label: 'Aset', icon: TrendingUp },
  { id: 'year', label: 'Tahun', icon: Calendar },
  { id: 'ai', label: 'AI', icon: Sparkles },
];

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(() => getInitialBudgetMonthDate());
  const [activeTab, setActiveTab] = useState('ot');
  const [appState, setAppState] = useState<AppState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('is_authenticated') === 'true';
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app-theme') as 'dark' | 'light') || 'dark';
  });

  const [isPrivacyMode, setIsPrivacyMode] = useState(() => {
    return localStorage.getItem('privacy-mode') === 'true';
  });

  const { isStandalone, isIOS, canPrompt, deferredPrompt } = usePwaInstall();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    return localStorage.getItem('install_banner_dismissed') === 'true';
  });

  // Quick Expense (Ketik / WhatsApp / AI / Suara)
  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState(false);
  const [quickExpenseInitialText, setQuickExpenseInitialText] = useState('');

  // Support deep link or iOS Shortcuts URL (?add_expense=... or ?quick=...)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const expenseParam = urlParams.get('add_expense') || urlParams.get('quick') || urlParams.get('expense');
      if (expenseParam) {
        setQuickExpenseInitialText(decodeURIComponent(expenseParam));
        setIsQuickExpenseOpen(true);
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    } catch (e) {
      console.warn("Could not read URL query params:", e);
    }
  }, []);

  const lastSavedStateRef = React.useRef<AppState>({});

  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyOptions, setCopyOptions] = useState({
    profile: true,
    investments: true,
    overtime: false
  });
  const [availablePrevData, setAvailablePrevData] = useState<MonthlyData | null>(null);

  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const currentData: MonthlyData = appState[currentMonthKey] || {
    salary: { ...DEFAULT_SALARY },
    budget: { ...DEFAULT_BUDGET },
    investments: [],
    overtimeEntries: [],
    profile: { ...DEFAULT_PROFILE }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('privacy-mode', String(isPrivacyMode));
  }, [isPrivacyMode]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const togglePrivacy = () => setIsPrivacyMode(prev => !prev);
  
  const handleLogout = () => {
    localStorage.removeItem('is_authenticated');
    setAppState({});
    setActiveTab('ot');
    setCurrentDate(getInitialBudgetMonthDate());
    setIsAuthenticated(false);
  };

  useEffect(() => {
      if (!isAuthenticated) return;
      
      const fetchData = async () => {
        setIsLoading(true);
        setDbError(null);
        try {
          const querySnapshot = await getDocs(collection(db, 'monthly_finance'));
          const loadedState: AppState = {};
          querySnapshot.forEach((docSnap) => {
            const row = docSnap.data();
            if (row && row.month_id && row.data) {
              loadedState[row.month_id] = row.data;
            }
          });
          setAppState(loadedState);
        } catch (err: any) {
          console.error("Error fetching cloud finance data:", err);
          const isConnectionError = 
            err.code === 'unavailable' || 
            err.message?.includes('unavailable') || 
            err.message?.includes('Could not reach Cloud Firestore') ||
            err.message?.includes('offline');

          if (isConnectionError) {
            setDbError("Bekerja offline. Data disimpan lokal & disinkronkan otomatis saat online.");
            // Try loading from local persistent cache so the user doesn't see a blank app
            try {
              const cachedSnapshot = await getDocsFromCache(collection(db, 'monthly_finance'));
              const loadedState: AppState = {};
              cachedSnapshot.forEach((docSnap) => {
                const row = docSnap.data();
                if (row && row.month_id && row.data) {
                  loadedState[row.month_id] = row.data;
                }
              });
              if (Object.keys(loadedState).length > 0) {
                setAppState(loadedState);
              }
            } catch (cacheErr) {
              console.warn("Attempted to load from firestore offline cache, but it was empty or failed:", cacheErr);
            }
          } else {
            setDbError(`Database Error: ${err.message || "Periksa konfigurasi Firebase"}`);
            handleFirestoreError(err, OperationType.GET, 'monthly_finance');
          }
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchData();
    }, [isAuthenticated]);

  useEffect(() => {
      if (!isAuthenticated || isLoading) return;
      
      const saveData = async () => {
        setSaveStatus('saving');
        try {
          // Cari semua bulan yang berbeda dari state terakhir yang disimpan
          const keysToSave = Object.keys(appState).filter(key => {
            return JSON.stringify(appState[key]) !== JSON.stringify(lastSavedStateRef.current[key]);
          });

          if (keysToSave.length === 0) {
            setSaveStatus('idle');
            return;
          }

          for (const key of keysToSave) {
            const docRef = doc(db, 'monthly_finance', key);
            const sanitizedData = JSON.parse(JSON.stringify(appState[key]));
            await setDoc(docRef, { 
              month_id: key, 
              data: sanitizedData,
              updated_at: new Date().toISOString()
            });
            lastSavedStateRef.current[key] = JSON.parse(JSON.stringify(appState[key]));
          }
            
          setSaveStatus('saved');
          setDbError(null);
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err: any) {
          console.error("Error saving to cloud:", err);
          const isConnectionError = 
            err.code === 'unavailable' || 
            err.message?.includes('unavailable') || 
            err.message?.includes('Could not reach Cloud Firestore') ||
            err.message?.includes('offline');

          if (isConnectionError) {
            setSaveStatus('saved'); // set as saved since write is queued in local offline store
            setDbError("Disimpan offline. Perubahan akan disinkronkan otomatis saat terhubung kembali.");
          } else {
            setSaveStatus('error');
            setDbError(`Gagal menyimpan: ${err.message || "Masalah koneksi"}`);
            handleFirestoreError(err, OperationType.WRITE, `monthly_finance`);
          }
        }
      };
      
      if (Object.keys(lastSavedStateRef.current).length === 0 && Object.keys(appState).length > 0) {
        lastSavedStateRef.current = JSON.parse(JSON.stringify(appState));
      }

      const timeoutId = setTimeout(saveData, 1000);
      return () => clearTimeout(timeoutId);
    }, [appState, isLoading, isAuthenticated]);

  const calculateCurrentIncome = (data: MonthlyData) => {
     const { salary } = data;
     const otHours = data.overtimeEntries && data.overtimeEntries.length > 0 
        ? data.overtimeEntries.reduce((acc, curr) => acc + calculateEqvHours(curr.actualHours, curr.type), 0)
        : salary.overtimeHours;

     const ot = calculateOvertime(salary.basicSalary, salary.housingAllowance, otHours);
     const bonus = calculateBonus(salary.basicSalary, salary.housingAllowance, salary.bonusMultiplier);
     const gross = calculateGrossIncome(salary.basicSalary, salary.housingAllowance, salary.shiftAllowance, ot, bonus, salary.thr, salary.leavePay);
     return gross - calculateTax(gross, salary.taxRate) - salary.otherDeductions;
  };
  const currentNetIncome = calculateCurrentIncome(currentData);

  const updateCurrentData = (newData: Partial<MonthlyData>) => {
    setAppState(prev => {
      const existing = prev[currentMonthKey] || { 
        salary: { ...DEFAULT_SALARY }, 
        budget: { ...DEFAULT_BUDGET }, 
        investments: [],
        overtimeEntries: [],
        profile: { ...DEFAULT_PROFILE }
      };

      const updated = { ...existing, ...newData };
      
      if (newData.overtimeEntries) {
        const totalEqv = newData.overtimeEntries.reduce((acc, curr) => acc + calculateEqvHours(curr.actualHours, curr.type), 0);
        updated.salary = { ...updated.salary, overtimeHours: totalEqv };
      }

      return {
        ...prev,
        [currentMonthKey]: updated
      };
    });
  };

  const handleSaveQuickExpenses = (newExpenses: any[]) => {
    const updatedBudget = { ...currentData.budget };

    newExpenses.forEach(exp => {
      const newItem = {
        id: 'quick_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: exp.name,
        budget: 0,
        actual: exp.amount,
        date: exp.date || formatDateToLocalISO(new Date())
      };

      if (exp.categoryKey === 'needs') {
        const cur = updatedBudget.needs || { items: [], name: 'Kebutuhan Pokok' };
        updatedBudget.needs = {
          ...cur,
          items: [...(cur.items || []), newItem]
        };
      } else if (exp.categoryKey === 'savings') {
        const cur = updatedBudget.savings || { items: [], name: 'Tabungan & Investasi' };
        updatedBudget.savings = {
          ...cur,
          items: [...(cur.items || []), newItem]
        };
      } else if (exp.categoryKey === 'debt') {
        const cur = updatedBudget.debt || { items: [], name: 'Hutang & Cicilan' };
        updatedBudget.debt = {
          ...cur,
          items: [...(cur.items || []), newItem]
        };
      } else if (exp.categoryKey === 'others') {
        const cur = updatedBudget.others || { allocation: 0, items: [] };
        updatedBudget.others = {
          ...cur,
          items: [...(cur.items || []), { id: newItem.id, name: newItem.name, actual: newItem.actual, date: newItem.date }]
        };
      } else {
        // Custom Category
        const customList = updatedBudget.custom ? [...updatedBudget.custom] : [];
        const catIdx = customList.findIndex(c => c.id === exp.categoryKey);
        if (catIdx >= 0) {
          customList[catIdx] = {
            ...customList[catIdx],
            items: [...(customList[catIdx].items || []), newItem]
          };
          updatedBudget.custom = customList;
        } else {
          const cur = updatedBudget.others || { allocation: 0, items: [] };
          updatedBudget.others = {
            ...cur,
            items: [...(cur.items || []), { id: newItem.id, name: newItem.name, actual: newItem.actual, date: newItem.date }]
          };
        }
      }
    });

    updateCurrentData({ budget: updatedBudget });
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const copyFromPreviousMonth = () => {
    // Cari bulan terakhir yang memiliki data (maksimal 12 bulan ke belakang)
    let prevData = null;

    for (let i = 1; i <= 12; i++) {
      const d = new Date(currentDate);
      d.setMonth(currentDate.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (appState[key]) {
        prevData = appState[key];
        break;
      }
    }
    
    if (prevData) {
      setAvailablePrevData(prevData);
      setShowCopyModal(true);
    }
  };

  const confirmSelectiveCopy = () => {
    if (!availablePrevData) return;

    setAppState(prev => {
      const existingCurrent: MonthlyData = prev[currentMonthKey] || {
        salary: { ...DEFAULT_SALARY },
        budget: { ...DEFAULT_BUDGET },
        investments: [],
        overtimeEntries: [],
        profile: { ...DEFAULT_PROFILE }
      };

      // 1. Profile: Copy only if checked; otherwise retain current
      const updatedProfile = copyOptions.profile
        ? JSON.parse(JSON.stringify(availablePrevData.profile || DEFAULT_PROFILE))
        : (existingCurrent.profile || DEFAULT_PROFILE);

      // 2. Base Salary (without overtime): Copy only if profile is checked; otherwise retain current
      const baseSalary = copyOptions.profile
        ? {
            basicSalary: availablePrevData.salary?.basicSalary ?? DEFAULT_SALARY.basicSalary,
            housingAllowance: availablePrevData.salary?.housingAllowance ?? DEFAULT_SALARY.housingAllowance,
            shiftAllowance: availablePrevData.salary?.shiftAllowance ?? DEFAULT_SALARY.shiftAllowance,
            bonusMultiplier: availablePrevData.salary?.bonusMultiplier ?? DEFAULT_SALARY.bonusMultiplier,
            thr: availablePrevData.salary?.thr ?? DEFAULT_SALARY.thr,
            leavePay: availablePrevData.salary?.leavePay ?? DEFAULT_SALARY.leavePay,
            taxRate: availablePrevData.salary?.taxRate ?? DEFAULT_SALARY.taxRate,
            otherDeductions: availablePrevData.salary?.otherDeductions ?? DEFAULT_SALARY.otherDeductions,
          }
        : {
            basicSalary: existingCurrent.salary?.basicSalary ?? DEFAULT_SALARY.basicSalary,
            housingAllowance: existingCurrent.salary?.housingAllowance ?? DEFAULT_SALARY.housingAllowance,
            shiftAllowance: existingCurrent.salary?.shiftAllowance ?? DEFAULT_SALARY.shiftAllowance,
            bonusMultiplier: existingCurrent.salary?.bonusMultiplier ?? DEFAULT_SALARY.bonusMultiplier,
            thr: existingCurrent.salary?.thr ?? DEFAULT_SALARY.thr,
            leavePay: existingCurrent.salary?.leavePay ?? DEFAULT_SALARY.leavePay,
            taxRate: existingCurrent.salary?.taxRate ?? DEFAULT_SALARY.taxRate,
            otherDeductions: existingCurrent.salary?.otherDeductions ?? DEFAULT_SALARY.otherDeductions,
          };

      // 3. Overtime: Copy only if checked; otherwise retain current overtime entries and hours without resetting
      const updatedOvertimeEntries = copyOptions.overtime
        ? JSON.parse(JSON.stringify(availablePrevData.overtimeEntries || []))
        : (existingCurrent.overtimeEntries || []);

      const updatedOvertimeHours = updatedOvertimeEntries.length > 0
        ? updatedOvertimeEntries.reduce((acc: number, curr: any) => acc + calculateEqvHours(curr.actualHours, curr.type), 0)
        : (copyOptions.overtime
            ? (availablePrevData.salary?.overtimeHours ?? 0)
            : (existingCurrent.salary?.overtimeHours ?? 0));

      const updatedSalary = {
        ...baseSalary,
        overtimeHours: updatedOvertimeHours,
      };

      // 4. Budget: Tetap gunakan anggaran bulan saat ini (tidak diubah saat salin data)
      const updatedBudget = existingCurrent.budget;

      // 5. Investments: Copy only if checked; otherwise retain current investments
      const updatedInvestments = copyOptions.investments
        ? JSON.parse(JSON.stringify(availablePrevData.investments || []))
        : (existingCurrent.investments || []);

      const newMonthlyData: MonthlyData = {
        profile: updatedProfile,
        salary: updatedSalary,
        overtimeEntries: updatedOvertimeEntries,
        budget: updatedBudget,
        investments: updatedInvestments,
      };

      return {
        ...prev,
        [currentMonthKey]: newMonthlyData,
      };
    });

    setSaveStatus('saved');
    setShowCopyModal(false);
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  if (!isAuthenticated) {
    return <Login onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-500/30 theme-transition text-[var(--text-primary)]">
      {/* Top Header - Fixed Glass Header with iOS Safe Area Clearance */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 w-full px-2.5 sm:px-6 pointer-events-none transition-all duration-300"
        style={{
          paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 0.65rem), 0.85rem)',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 0.65rem)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 0.65rem)'
        }}
      >
        <div className="max-w-7xl mx-auto glass-panel rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-white/15 backdrop-blur-2xl overflow-hidden transition-all duration-300 pointer-events-auto">
          <div className="p-2.5 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
            
            {/* Top Tier on Mobile / Left Section on Desktop: Branding, Full Name, Period & Quick Tools */}
            <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                <div className="relative group shrink-0">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-2xl blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
                  <div className="relative bg-gradient-to-br from-indigo-600 to-indigo-800 p-2 sm:p-3 rounded-2xl shadow-lg border border-white/15 flex items-center justify-center">
                    <Wallet className="text-white h-4 w-4 sm:h-6 sm:w-6" />
                  </div>
                </div>
                <div className="min-w-0">
                  <h1 className="text-xs sm:text-lg md:text-xl font-black text-[var(--text-primary)] uppercase tracking-tight leading-tight whitespace-nowrap">
                    {currentData.profile?.name || 'ANIQ SUSILO'}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                    <p className="text-[9px] sm:text-xs font-bold text-indigo-400 uppercase tracking-wider whitespace-nowrap">
                      {getBudgetPeriodLabel(currentDate).toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile-only Quick Tool Icons (Install, Privacy, Theme, Logout) */}
              <div className="flex sm:hidden items-center gap-1 bg-slate-900/70 p-1 rounded-xl border border-slate-700/70 shrink-0">
                <button 
                  onClick={() => {
                    setQuickExpenseInitialText('');
                    setIsQuickExpenseOpen(true);
                  }}
                  className="p-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm transition-all active:scale-95"
                  title="Input Cepat Pengeluaran (Ketik / WA / Suara)"
                >
                  <Zap size={14} className="text-amber-300 animate-pulse" />
                </button>
                <button 
                  onClick={() => setIsInstallModalOpen(true)}
                  className={`p-1.5 rounded-lg transition-all active:scale-95 ${!isStandalone ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  title="Pasang Aplikasi di iPhone / HP"
                >
                  <Smartphone size={14} className={!isStandalone ? "animate-pulse text-indigo-400" : ""} />
                </button>
                <button 
                  onClick={togglePrivacy}
                  className={`p-1.5 rounded-lg transition-all active:scale-95 ${isPrivacyMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  title={isPrivacyMode ? 'Tampilkan Nominal' : 'Sembunyikan Nominal (Privacy Mode)'}
                >
                  {isPrivacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button 
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-all active:scale-95"
                  title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                >
                  {theme === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-indigo-400" />}
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 transition-all active:scale-95"
                  title="Keluar"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>

            {/* Bottom Tier on Mobile / Right Section on Desktop: Month Switcher & Actions */}
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-white/10">
              {/* Cloud Sync Status */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/70 rounded-xl border border-slate-700/70 shadow-inner shrink-0">
                {saveStatus === 'saving' ? (
                  <Loader2 size={12} className="animate-spin text-indigo-400" />
                ) : saveStatus === 'saved' ? (
                  <CheckCircle2 size={12} className="text-emerald-400" />
                ) : (
                  <Cloud size={12} className="text-slate-400"/>
                )}
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  {saveStatus === 'saving' ? 'Menyimpan' : saveStatus === 'saved' ? 'Tersimpan' : 'Cloud'}
                </span>
              </div>

              {/* Month Navigator with full unclipped month name */}
              <div className="flex items-center flex-1 sm:flex-initial justify-between sm:justify-center bg-slate-900/90 rounded-xl sm:rounded-2xl p-1 border border-slate-700/80 shadow-md">
                <button 
                  onClick={() => changeMonth(-1)} 
                  className="p-1 sm:p-1.5 hover:bg-slate-700/80 active:scale-95 rounded-lg sm:rounded-xl text-slate-300 transition-all"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft size={16} className="sm:size-5" />
                </button>
                <div className="px-2 sm:px-4 font-mono font-black text-indigo-400 text-xs sm:text-sm uppercase tracking-wider text-center whitespace-nowrap">
                  {currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()}
                </div>
                <button 
                  onClick={() => changeMonth(1)} 
                  className="p-1 sm:p-1.5 hover:bg-slate-700/80 active:scale-95 rounded-lg sm:rounded-xl text-slate-300 transition-all"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight size={16} className="sm:size-5" />
                </button>
              </div>

              {/* Quick Expense Input Button */}
              <button 
                onClick={() => {
                  setQuickExpenseInitialText('');
                  setIsQuickExpenseOpen(true);
                }}
                className="p-1.5 sm:px-3 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl border border-emerald-500/50 text-white hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-950/40 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                title="Input Cepat Pengeluaran (Ketik / WhatsApp / Suara)"
              >
                <Zap size={14} className="sm:size-4 text-amber-300 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Input Cepat</span>
              </button>

              {/* Copy Button */}
              <button 
                onClick={copyFromPreviousMonth}
                className="p-1.5 sm:px-3 sm:py-2 bg-slate-900/80 rounded-xl border border-slate-700/80 text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 shadow-md active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                title="Salin data dari bulan sebelumnya"
              >
                <Copy size={14} className="sm:size-4" />
                <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Salin</span>
              </button>

              {/* Desktop-only Quick Tool Icons */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-700/60">
                <button 
                  onClick={() => setIsInstallModalOpen(true)}
                  className={`p-2 rounded-lg transition-all active:scale-95 flex items-center gap-1.5 ${!isStandalone ? 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'}`}
                  title="Pasang Aplikasi (iPhone / Android / Desktop)"
                >
                  <Smartphone size={16} />
                  <span className="text-[10px] font-black uppercase tracking-wider pr-1">Pasang App</span>
                </button>
                <button 
                  onClick={togglePrivacy}
                  className={`p-2 rounded-lg transition-all active:scale-95 ${isPrivacyMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'}`}
                  title={isPrivacyMode ? 'Tampilkan Nominal' : 'Sembunyikan Nominal (Privacy Mode)'}
                >
                  {isPrivacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all active:scale-95"
                  title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                >
                  {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-400" />}
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-all active:scale-95"
                  title="Keluar"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main 
        className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8"
        style={{
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 14px) + 7.8rem)',
          paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 14px) + 5.5rem)'
        }}
      >
        {/* Subtle PWA iOS/Mobile Install Reminder Banner */}
        {!isStandalone && !isBannerDismissed && (
          <div className="mb-4 glass-panel p-3 sm:p-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/70 via-slate-900/80 to-slate-900/90 flex items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 shrink-0">
                <Smartphone size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs sm:text-sm font-black text-white uppercase tracking-tight">
                    {isIOS ? 'Pasang di iPhone / iPad' : 'Pasang Aplikasi di HP'}
                  </p>
                  <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase">
                    Fullscreen
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-300 font-medium truncate">
                  {isIOS 
                    ? 'Buka di Safari lalu pilih "Tambah ke Layar Utama" (Add to Home Screen).' 
                    : 'Pasang ke layar utama untuk pengalaman native fullscreen & cepat.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsInstallModalOpen(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all whitespace-nowrap"
              >
                Cara Pasang
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsBannerDismissed(true);
                  localStorage.setItem('install_banner_dismissed', 'true');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-all"
                title="Tutup Banner"
              >
                <EyeOff size={14} className="sr-only" />
                <span className="text-xs px-1 font-bold">✕</span>
              </button>
            </div>
          </div>
        )}

        {dbError && (
          <div className="mb-4 glass-panel p-3.5 rounded-2xl border-l-4 border-rose-500 bg-rose-500/10 flex items-center gap-3 animate-pulse shadow-lg">
            <AlertCircle size={18} className="text-rose-500 shrink-0" />
            <p className="text-rose-200 text-[11px] font-bold tracking-wide">{dbError}</p>
          </div>
        )}
        
        <div className="animate-fadeIn">
          {activeTab === 'ot' && (
            <OvertimeTracker 
              entries={currentData.overtimeEntries || []} 
              profile={currentData.profile || DEFAULT_PROFILE}
              onProfileChange={(p) => updateCurrentData({ profile: p })}
              onChange={(o) => updateCurrentData({ overtimeEntries: o })} 
            />
          )}
          {activeTab === 'salary' && <SalarySlip data={currentData.salary} isPrivacy={isPrivacyMode} onChange={(s) => updateCurrentData({ salary: s })} />}
          {activeTab === 'budget' && (
            <Budget 
              income={currentNetIncome} 
              data={currentData.budget} 
              isPrivacy={isPrivacyMode} 
              currentDate={currentDate} 
              onChange={(b) => updateCurrentData({ budget: b })} 
              onOpenQuickExpense={() => {
                setQuickExpenseInitialText('');
                setIsQuickExpenseOpen(true);
              }}
            />
          )}
          {activeTab === 'history' && <BudgetHistory data={currentData.budget} isPrivacy={isPrivacyMode} currentDate={currentDate} />}
          {activeTab === 'charts' && <MonthlyCharts budgetData={currentData.budget} appState={appState} income={currentNetIncome} isPrivacy={isPrivacyMode} />}
          {activeTab === 'invest' && <Investments items={currentData.investments} appState={appState} isPrivacy={isPrivacyMode} onChange={(i) => updateCurrentData({ investments: i })} />}
          {activeTab === 'year' && <YearlySummary appState={appState} year={currentDate.getFullYear()} isPrivacy={isPrivacyMode} />}
          {activeTab === 'ai' && <AIAnalysis currentMonthData={currentData} netIncome={currentNetIncome} />}
        </div>
      </main>

      {/* Modern Floating Bottom Navigation Bar with iOS Home-Indicator Clearance */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 w-full pointer-events-none transition-all duration-300"
        style={{
          paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 0.65rem), 0.85rem)',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 0.65rem)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 0.65rem)'
        }}
      >
        <div className="max-w-4xl mx-auto glass-panel rounded-2xl sm:rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden pointer-events-auto backdrop-blur-2xl">
          <div className="px-1.5 sm:px-3 overflow-x-auto scrollbar-hide py-1.5">
            <div className="flex items-center justify-between sm:justify-center gap-1 sm:gap-2 min-w-max sm:min-w-0">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)} 
                    className={`relative flex flex-col items-center justify-center gap-1 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all duration-300 shrink-0 ${
                      isActive 
                        ? 'text-white bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-lg shadow-indigo-600/30 scale-100 font-black' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 font-bold'
                    }`}
                  >
                    <Icon size={18} className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                    <span className="text-[10px] sm:text-xs uppercase tracking-wider leading-none">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Selective Copy Modal */}
      {showCopyModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{
            paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 1rem), 1.5rem)',
            paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 1rem), 1.5rem)'
          }}
        >
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fadeIn" onClick={() => setShowCopyModal(false)}></div>
          <div className="relative glass-panel rounded-3xl w-full max-w-md p-6 sm:p-8 animate-fadeIn border border-white/15 shadow-2xl">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-3 rounded-2xl shadow-lg border border-white/10 text-white">
                <Copy size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Salin Data Bulan Lalu</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pilih Bagian yang Ingin Disalin</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {[
                { id: 'profile', label: 'Profil & Gaji Dasar', desc: 'Nama, NIK, Gaji Pokok, Tunjangan', icon: Wallet },
                { id: 'overtime', label: 'Data Lembur', desc: 'Riwayat & Jam Lembur', icon: Clock },
                { id: 'investments', label: 'Daftar Aset & Investasi', desc: 'Daftar Aset dan Nilai Terkini', icon: TrendingUp },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = (copyOptions as any)[opt.id];
                return (
                  <button
                    key={opt.id}
                    onClick={() => setCopyOptions(prev => ({ ...prev, [opt.id]: !isSelected }))}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all active:scale-[0.99] ${
                      isSelected 
                        ? 'bg-indigo-600/15 border-indigo-500/60 shadow-lg shadow-indigo-950/30' 
                        : 'bg-slate-900/50 border-slate-700/60 hover:border-slate-600 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <span className={`block text-xs font-black uppercase tracking-wider ${isSelected ? 'text-[var(--text-primary)]' : 'text-slate-300'}`}>
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{opt.desc}</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 shadow-sm' : 'border-slate-600 bg-slate-800/50'}`}>
                      {isSelected && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCopyModal(false)}
                className="flex-1 py-3.5 bg-slate-800/90 text-slate-300 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all hover:bg-slate-700 active:scale-95 border border-slate-700"
              >
                Batal
              </button>
              <button
                onClick={confirmSelectiveCopy}
                className="flex-[1.5] py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all hover:from-indigo-500 hover:to-indigo-600 active:scale-95 border border-indigo-400/30"
              >
                Salin Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button for Quick Expense */}
      <div 
        className="fixed right-3.5 sm:right-6 z-40"
        style={{
          bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 14px) + 5.2rem)'
        }}
      >
        <button
          type="button"
          onClick={() => {
            setQuickExpenseInitialText('');
            setIsQuickExpenseOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_10px_25px_rgba(16,185,129,0.45)] border border-emerald-400/40 active:scale-95 transition-all group pointer-events-auto"
          title="Input Cepat Pengeluaran (Ketik / WA / Suara)"
        >
          <Zap size={18} className="text-amber-300 animate-pulse group-hover:rotate-12 transition-transform shrink-0" />
          <span className="font-black tracking-tight whitespace-nowrap">Input Cepat</span>
        </button>
      </div>

      {/* Quick Expense Modal (Ketik / WhatsApp / AI / Suara) */}
      <QuickExpenseModal
        isOpen={isQuickExpenseOpen}
        onClose={() => setIsQuickExpenseOpen(false)}
        budgetData={currentData.budget}
        onSaveExpenses={handleSaveQuickExpenses}
        currentDate={currentDate}
        initialText={quickExpenseInitialText}
        isPrivacy={isPrivacyMode}
      />

      {/* PWA iOS / Mobile / Desktop Installation Guide Modal */}
      <InstallPwaModal 
        isOpen={isInstallModalOpen} 
        onClose={() => setIsInstallModalOpen(false)} 
        deferredPrompt={deferredPrompt} 
      />
    </div>
  );
};

export default App;