import React, { useState, useEffect, useCallback } from 'react';
import { AppState, MonthlyData, DEFAULT_SALARY, DEFAULT_BUDGET } from './types';
import SalarySlip from './components/SalarySlip';
import Budget from './components/Budget';
import MonthlyCharts from './components/MonthlyCharts';
import Investments from './components/Investments';
import YearlySummary from './components/YearlySummary';
import { calculateGrossIncome, calculateTax, calculateOvertime, calculateBonus } from './utils';
import { Wallet, LayoutDashboard, PieChart, TrendingUp, Calendar, ChevronLeft, ChevronRight, Cloud, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from './supabaseClient';

const TABS = [
  { id: 'salary', label: 'Gaji', icon: Wallet },
  { id: 'budget', label: 'Anggaran', icon: LayoutDashboard },
  { id: 'charts', label: 'Grafik', icon: PieChart },
  { id: 'invest', label: 'Aset', icon: TrendingUp },
  { id: 'year', label: 'Tahunan', icon: Calendar },
];

const App: React.FC = () => {
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('salary');
  
  // App State is initially empty until loaded from DB
  const [appState, setAppState] = useState<AppState>({});
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [prevMonthKey, setPrevMonthKey] = useState<string | null>(null);

  // Derived State
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const currentData: MonthlyData = appState[currentMonthKey] || {
    salary: { ...DEFAULT_SALARY },
    budget: { ...DEFAULT_BUDGET },
    investments: []
  };

  // --- DATABASE LOGIC START ---

  // 1. Load Data on Mount
  useEffect(() => {
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
        console.error("Error fetching data:", err);
        // Fallback to empty state if offline or error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. Debounced Save Logic
  // We save only the CURRENT month's data when it changes
  useEffect(() => {
    if (isLoading) return; // Don't save while initial load
    if (!appState[currentMonthKey]) return; // Don't save if empty

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
        
        // Reset to idle after a moment
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error("Error saving data:", err);
        setSaveStatus('error');
      }
    };

    // Simple debounce
    const timeoutId = setTimeout(saveData, 1500);
    return () => clearTimeout(timeoutId);

  }, [appState, currentMonthKey, isLoading]);

  // --- DATABASE LOGIC END ---


  // Helper: Income Calculation
  const calculateCurrentIncome = (data: MonthlyData) => {
     const { salary } = data;
     const ot = calculateOvertime(salary.basicSalary, salary.housingAllowance, salary.overtimeHours);
     const bonus = calculateBonus(salary.basicSalary, salary.housingAllowance, salary.bonusMultiplier);
     const gross = calculateGrossIncome(salary.basicSalary, salary.housingAllowance, salary.shiftAllowance, ot, bonus, salary.thr, salary.leavePay);
     const tax = calculateTax(gross, salary.taxRate);
     return gross - tax - salary.otherDeductions;
  };
  const currentNetIncome = calculateCurrentIncome(currentData);


  // Month Change & Initialization Logic
  useEffect(() => {
    // Only check if we are not loading
    if (!isLoading && !appState[currentMonthKey]) {
      // Check if previous month exists locally
      const prevDate = new Date(currentDate);
      prevDate.setMonth(currentDate.getMonth() - 1);
      const pKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (appState[pKey]) {
        setPrevMonthKey(pKey);
        setShowCopyModal(true);
      } else {
        initializeMonth(false);
      }
    }
  }, [currentMonthKey, isLoading]); // Removed appState dep to avoid loop, handled by checks

  const initializeMonth = (copyFromPrev: boolean) => {
    let newData: MonthlyData;
    if (copyFromPrev && prevMonthKey && appState[prevMonthKey]) {
      const prev = appState[prevMonthKey];
      newData = JSON.parse(JSON.stringify(prev));
      // Reset Actuals
      newData.budget.needs.items.forEach(i => i.actual = 0);
      newData.budget.savings.items.forEach(i => i.actual = 0);
      newData.budget.debt.items.forEach(i => i.actual = 0);
      newData.budget.others.items.forEach(i => i.actual = 0);
      
      // Reset fluctuating salary
      newData.salary.overtimeHours = 0;
      newData.salary.bonusMultiplier = 0;
      newData.salary.thr = 0;
      newData.salary.leavePay = 0;
    } else {
      newData = {
        salary: { ...DEFAULT_SALARY },
        budget: { ...DEFAULT_BUDGET },
        investments: []
      };
    }
    
    setAppState(prev => ({
      ...prev,
      [currentMonthKey]: newData
    }));
    setShowCopyModal(false);
  };

  const updateCurrentData = (newData: Partial<MonthlyData>) => {
    setAppState(prev => ({
      ...prev,
      [currentMonthKey]: { ...currentData, ...newData }
    }));
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Menghubungkan Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-500/30 selection:text-indigo-800">
      {/* Navbar - Floating Glass */}
      <nav className="sticky top-0 z-50 pt-2 px-2 sm:pt-4 sm:px-6">
        <div className="max-w-7xl mx-auto glass-panel rounded-xl sm:rounded-2xl shadow-xl bg-white/80">
          <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:px-6 sm:h-20 gap-3">
            {/* Header Top */}
            <div className="flex items-center justify-between w-full sm:w-auto">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-200">
                     <Wallet className="text-white h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h1 className="text-sm sm:text-xl font-bold tracking-tight text-slate-800 leading-tight">ANIQ SUSILO</h1>
                    <p className="text-[9px] sm:text-[10px] text-indigo-500 font-bold tracking-[0.2em] uppercase">Monthly Finance</p>
                  </div>
                </div>

                {/* Mobile Month Navigator */}
                <div className="flex sm:hidden items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                   <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-slate-500">
                     <ChevronLeft size={16} />
                   </button>
                   <div className="px-2 font-mono font-bold text-indigo-600 text-xs text-center min-w-[80px]">
                     {currentDate.toLocaleString('id-ID', { month: 'short', year: '2-digit' })}
                   </div>
                   <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-slate-500">
                     <ChevronRight size={16} />
                   </button>
                </div>
            </div>

            {/* Desktop Month Navigator & Status */}
            <div className="flex items-center gap-4">
                {/* Save Status Indicator */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  {saveStatus === 'saving' && (
                    <>
                      <Loader2 size={14} className="animate-spin text-indigo-500" />
                      <span className="text-xs text-slate-500 font-medium">Menyimpan...</span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium">Tersimpan</span>
                    </>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-xs text-rose-500 font-medium">Gagal Simpan</span>
                  )}
                  {saveStatus === 'idle' && (
                     <span className="text-xs text-slate-400 font-medium flex items-center gap-1"><Cloud size={12}/> Online</span>
                  )}
                </div>

                <div className="hidden sm:flex items-center bg-slate-50 rounded-xl p-1.5 border border-slate-200 shadow-sm">
                  <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-indigo-600 hover:shadow-sm">
                    <ChevronLeft size={20} />
                  </button>
                  <div className="px-3 sm:px-6 font-mono font-bold text-indigo-600 w-32 sm:w-40 text-center text-sm sm:text-base">
                    {currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                  </div>
                  <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-indigo-600 hover:shadow-sm">
                    <ChevronRight size={20} />
                  </button>
                </div>
            </div>
          </div>
        
          {/* Tab Navigation */}
          <div className="border-t border-slate-100">
            <div className="px-2 overflow-x-auto scrollbar-hide">
              <div className="flex space-x-1 py-1.5 sm:py-2">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl whitespace-nowrap transition-all duration-200 relative overflow-hidden flex-1 justify-center sm:flex-none
                        ${isActive 
                          ? 'text-white bg-indigo-600 shadow-lg shadow-indigo-200' 
                          : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}
                      `}
                    >
                      <Icon size={16} className={isActive ? 'text-white' : ''} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24">
        {activeTab === 'salary' && (
          <SalarySlip 
            data={currentData.salary} 
            onChange={(s) => updateCurrentData({ salary: s })} 
          />
        )}
        {activeTab === 'budget' && (
          <Budget 
            income={currentNetIncome} 
            data={currentData.budget} 
            onChange={(b) => updateCurrentData({ budget: b })} 
          />
        )}
        {activeTab === 'charts' && (
          <MonthlyCharts 
            budgetData={currentData.budget} 
            income={currentNetIncome} 
          />
        )}
        {activeTab === 'invest' && (
          <Investments 
            items={currentData.investments} 
            onChange={(i) => updateCurrentData({ investments: i })} 
          />
        )}
        {activeTab === 'year' && (
          <YearlySummary 
            appState={appState} 
            year={currentDate.getFullYear()} 
          />
        )}
      </main>

      {/* Copy Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
           <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl animate-fadeIn border border-slate-200">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Bulan Baru</h3>
              <p className="text-slate-500 mb-8 leading-relaxed text-sm sm:text-base">Data bulan ini belum ada di Database. Salin dari bulan lalu?</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => initializeMonth(true)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 text-sm sm:text-base"
                >
                  Salin Data
                </button>
                <button 
                  onClick={() => initializeMonth(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors border border-slate-200 text-sm sm:text-base"
                >
                  Buat Baru
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
