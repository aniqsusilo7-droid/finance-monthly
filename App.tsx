import React, { useState, useEffect } from 'react';
import { AppState, MonthlyData, DEFAULT_SALARY, DEFAULT_BUDGET, DEFAULT_PROFILE, OvertimeEntry } from './types';
import OvertimeTracker from './components/OvertimeTracker'; 
import SalarySlip from './components/SalarySlip';
import Budget from './components/Budget';
import MonthlyCharts from './components/MonthlyCharts';
import Investments from './components/Investments';
import YearlySummary from './components/YearlySummary';
import AIAnalysis from './components/AIAnalysis';
import Login from './components/Login';
import { calculateGrossIncome, calculateTax, calculateOvertime, calculateBonus, calculateEqvHours, formatRupiah } from './utils';
import { Wallet, LayoutDashboard, PieChart, TrendingUp, Calendar, ChevronLeft, ChevronRight, Cloud, Loader2, CheckCircle2, Sparkles, Sun, Moon, LogOut, Clock, Eye, EyeOff, Copy } from 'lucide-react';
import { supabase } from './supabaseClient';

const TABS = [
  { id: 'ot', label: 'Lembur', icon: Clock },
  { id: 'salary', label: 'Gaji', icon: Wallet },
  { id: 'budget', label: 'Anggaran', icon: LayoutDashboard },
  { id: 'charts', label: 'Grafik', icon: PieChart },
  { id: 'invest', label: 'Aset', icon: TrendingUp },
  { id: 'year', label: 'Tahun', icon: Calendar },
  { id: 'ai', label: 'AI', icon: Sparkles },
];

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('ot');
  const [appState, setAppState] = useState<AppState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('is_authenticated') === 'true';
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app-theme') as 'dark' | 'light') || 'dark';
  });

  const [isPrivacyMode, setIsPrivacyMode] = useState(() => {
    return localStorage.getItem('privacy-mode') === 'true';
  });

  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyOptions, setCopyOptions] = useState({
    profile: true,
    budget: true,
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
    setCurrentDate(new Date());
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('monthly_finance')
          .select('month_id, data');
        
        if (error) throw error;
        
        if (data) {
          const loadedState: AppState = {};
          data.forEach((row: any) => { 
            loadedState[row.month_id] = row.data; 
          });
          setAppState(loadedState);
        }
      } catch (err) {
        console.error("Error fetching cloud finance data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || isLoading || !appState[currentMonthKey]) return;
    
    const saveData = async () => {
      setSaveStatus('saving');
      try {
        const { error } = await supabase
          .from('monthly_finance')
          .upsert({ 
            month_id: currentMonthKey, 
            data: appState[currentMonthKey],
            updated_at: new Date().toISOString()
          });
          
        if (error) throw error;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error("Error saving to cloud:", err);
        setSaveStatus('error');
      }
    };
    
    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [appState, currentMonthKey, isLoading, isAuthenticated]);

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

      return { ...prev, [currentMonthKey]: updated };
    });
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

    // Fungsi untuk menyiapkan data (reset lembur dan actual budget)
    const prepareData = (source: MonthlyData): MonthlyData => {
      const newData = JSON.parse(JSON.stringify(source));
      
      // Handle Lembur
      if (!copyOptions.overtime) {
        newData.salary.overtimeHours = 0;
        newData.overtimeEntries = [];
      }
      
      // Reset salary/profile jika tidak dipilih
      if (!copyOptions.profile) {
        newData.profile = currentData.profile;
        // Jika profile tidak disalin, kita hanya update basic salary info, tapi tetap pertahankan jam lembur yang mungkin sudah didefinisikan di atas
        const currentOTHours = newData.salary.overtimeHours;
        const currentOTEntries = [...newData.overtimeEntries];
        
        newData.salary = { ...currentData.salary };
        
        if (!copyOptions.overtime) {
          newData.salary.overtimeHours = 0;
          newData.overtimeEntries = [];
        } else {
          newData.salary.overtimeHours = currentOTHours;
          newData.overtimeEntries = currentOTEntries;
        }
      }

      // Reset budget jika tidak dipilih
      if (!copyOptions.budget) {
        newData.budget = currentData.budget;
      } else {
        // Reset nilai aktual di budget menjadi 0 untuk bulan baru
        if (newData.budget.needs) newData.budget.needs.items = newData.budget.needs.items.map((i: any) => ({ ...i, actual: 0 }));
        if (newData.budget.savings) newData.budget.savings.items = newData.budget.savings.items.map((i: any) => ({ ...i, actual: 0 }));
        if (newData.budget.debt) newData.budget.debt.items = newData.budget.debt.items.map((i: any) => ({ ...i, actual: 0 }));
        if (newData.budget.others) newData.budget.others.items = newData.budget.others.items.map((i: any) => ({ ...i, actual: 0 }));
        if (newData.budget.custom) {
          newData.budget.custom = newData.budget.custom.map((cat: any) => ({
            ...cat,
            items: cat.items.map((i: any) => ({ ...i, actual: 0 }))
          }));
        }
      }

      // Reset investasi jika tidak dipilih
      if (!copyOptions.investments) {
        newData.investments = currentData.investments;
      }

      return newData;
    };

    const copiedData = prepareData(availablePrevData);

    setAppState(prev => {
      const newState = { ...prev };
      
      // 1. Update bulan sekarang
      newState[currentMonthKey] = {
        ...copiedData,
        // Tetap pertahankan profil jika sudah ada yang berbeda
        profile: prev[currentMonthKey]?.profile || copiedData.profile
      };
      
      // 2. Propagasi ke bulan-bulan mendatang (6 bulan ke depan) jika masih kosong
      for (let i = 1; i <= 6; i++) {
        const futureDate = new Date(currentDate);
        futureDate.setMonth(currentDate.getMonth() + i);
        const futureKey = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!newState[futureKey]) {
          newState[futureKey] = JSON.parse(JSON.stringify(copiedData));
        }
      }
      
      return newState;
    });

    setSaveStatus('saved');
    setShowCopyModal(false);
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  if (!isAuthenticated) {
    return <Login onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-500/30 theme-transition">
      {/* Top Header - Fixed Position (Logo & Month Only) */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-2 sm:pt-4 px-1 sm:px-6 w-full">
        <div className="max-w-7xl mx-auto glass-panel rounded-xl sm:rounded-2xl shadow-xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between p-2 sm:px-6 sm:h-24 gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-4 text-left min-w-0 flex-1">
              <div className="bg-indigo-600 p-1.5 sm:p-3 rounded-xl shadow-lg shrink-0">
                 <Wallet className="text-white h-4 w-4 sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-[11px] xs:text-xs sm:text-2xl font-black text-white uppercase tracking-tighter sm:tracking-tight leading-none truncate">{currentData.profile?.name || 'ANIQ SUSILO'}</h1>
                <p className="text-[8px] sm:text-sm font-black text-indigo-400 uppercase tracking-normal sm:tracking-widest mt-0.5 whitespace-nowrap">FINANCE MONTHLY</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-4 shrink-0">
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  {saveStatus === 'saving' ? (
                    <Loader2 size={12} className="animate-spin text-indigo-400" />
                  ) : saveStatus === 'saved' ? (
                    <CheckCircle2 size={12} className="text-emerald-400" />
                  ) : (
                    <Cloud size={10} className="text-slate-500"/>
                  )}
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">
                    {saveStatus === 'saving' ? 'Syncing' : saveStatus === 'saved' ? 'Saved' : 'Online'}
                  </span>
                </div>

                <div className="flex items-center bg-slate-800/80 rounded-lg sm:rounded-xl p-1 border border-slate-700 shadow-sm">
                  <button onClick={() => changeMonth(-1)} className="p-1 sm:p-2 hover:bg-slate-700 rounded-lg text-slate-400"><ChevronLeft size={14} className="sm:size-5" /></button>
                  <div className="px-1 sm:px-4 font-mono font-black text-indigo-400 text-[9px] sm:text-sm uppercase tracking-wider text-center min-w-[45px] sm:min-w-[100px]">
                    {currentDate.toLocaleString('id-ID', { month: 'short', year: '2-digit' }).toUpperCase()}
                  </div>
                  <button onClick={() => changeMonth(1)} className="p-1 sm:p-2 hover:bg-slate-700 rounded-lg text-slate-400"><ChevronRight size={14} className="sm:size-5" /></button>
                </div>

                <button 
                  onClick={copyFromPreviousMonth}
                  className="p-1.5 sm:px-3 sm:py-2 bg-slate-800/80 rounded-lg border border-slate-700 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1 sm:gap-2"
                  title="Salin data dari bulan sebelumnya"
                >
                  <Copy size={14} className="sm:size-5" />
                  <span className="hidden sm:inline text-[10px] uppercase tracking-tighter">Salin</span>
                </button>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={togglePrivacy}
                    className={`p-1.5 sm:px-3 sm:py-2 rounded-lg border transition-colors ${isPrivacyMode ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800/80 border-slate-700 text-slate-400'}`}
                    title={isPrivacyMode ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
                  >
                    {isPrivacyMode ? <EyeOff size={14} className="sm:size-5" /> : <Eye size={14} className="sm:size-5" />}
                  </button>
                  <button 
                    onClick={toggleTheme}
                    className="p-1.5 sm:px-3 sm:py-2 bg-slate-800/80 rounded-lg border border-slate-700 transition-colors"
                  >
                    {theme === 'dark' ? <Sun size={14} className="text-amber-400 sm:size-5" /> : <Moon size={14} className="text-indigo-400 sm:size-5" />}
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="p-1.5 sm:px-3 sm:py-2 bg-rose-500/10 rounded-lg border border-rose-500/20 text-rose-500"
                  >
                    <LogOut size={14} className="sm:size-5" />
                  </button>
                </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-24 sm:pb-12">
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
          {activeTab === 'budget' && <Budget income={currentNetIncome} data={currentData.budget} isPrivacy={isPrivacyMode} onChange={(b) => updateCurrentData({ budget: b })} />}
          {activeTab === 'charts' && <MonthlyCharts budgetData={currentData.budget} appState={appState} income={currentNetIncome} isPrivacy={isPrivacyMode} />}
          {activeTab === 'invest' && <Investments items={currentData.investments} appState={appState} isPrivacy={isPrivacyMode} onChange={(i) => updateCurrentData({ investments: i })} />}
          {activeTab === 'year' && <YearlySummary appState={appState} year={currentDate.getFullYear()} isPrivacy={isPrivacyMode} />}
          {activeTab === 'ai' && <AIAnalysis currentMonthData={currentData} netIncome={currentNetIncome} />}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 pb-2 sm:pb-4 px-1 sm:px-6 w-full">
        <div className="max-w-7xl mx-auto glass-panel rounded-xl sm:rounded-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.3)] border border-white/5 overflow-hidden">
          <div className="px-1 overflow-x-auto scrollbar-hide">
            <div className="flex justify-between sm:justify-center sm:gap-4 py-1.5 min-w-max sm:min-w-0">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)} 
                    className={`flex flex-col items-center gap-1 px-4 py-2.5 text-[9px] sm:text-xs font-black rounded-xl transition-all shrink-0 uppercase tracking-widest ${isActive ? 'text-white bg-indigo-600 shadow-lg scale-105' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  >
                    <Icon size={18} className="sm:size-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Selective Copy Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowCopyModal(false)}></div>
          <div className="relative glass-panel rounded-3xl w-full max-w-sm p-6 sm:p-8 animate-fadeIn border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-600 p-2.5 rounded-xl">
                <Copy size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Salin Data</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Bagian Untuk Disalin</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {[
                { id: 'profile', label: 'Profil & Gaji Dasar', icon: Wallet },
                { id: 'overtime', label: 'Data Lembur', icon: Clock },
                { id: 'budget', label: 'Struktur Anggaran', icon: LayoutDashboard },
                { id: 'investments', label: 'Daftar Aset/Investasi', icon: TrendingUp },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = (copyOptions as any)[opt.id];
                return (
                  <button
                    key={opt.id}
                    onClick={() => setCopyOptions(prev => ({ ...prev, [opt.id]: !isSelected }))}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isSelected ? 'bg-indigo-600/20 border-indigo-500/50 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={isSelected ? 'text-indigo-400' : 'text-slate-500'} />
                      <span className="text-xs font-black uppercase tracking-widest">{opt.label}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-700'}`}>
                      {isSelected && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCopyModal(false)}
                className="flex-1 py-4 bg-slate-800 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={confirmSelectiveCopy}
                className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-700"
              >
                Confirm Salin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;