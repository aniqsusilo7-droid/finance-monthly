
import React, { useState, useEffect } from 'react';
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('salary');
  const [appState, setAppState] = useState<AppState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [prevMonthKey, setPrevMonthKey] = useState<string | null>(null);

  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const currentData: MonthlyData = appState[currentMonthKey] || {
    salary: { ...DEFAULT_SALARY },
    budget: { ...DEFAULT_BUDGET },
    investments: []
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('monthly_finance').select('month_id, data');
        if (error) throw error;
        if (data) {
          const loadedState: AppState = {};
          data.forEach((row: any) => { loadedState[row.month_id] = row.data; });
          setAppState(loadedState);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isLoading || !appState[currentMonthKey]) return;
    const saveData = async () => {
      setSaveStatus('saving');
      try {
        const { error } = await supabase.from('monthly_finance').upsert({ 
          month_id: currentMonthKey, 
          data: appState[currentMonthKey],
          updated_at: new Date().toISOString()
        });
        if (error) throw error;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error("Error saving data:", err);
        setSaveStatus('error');
      }
    };
    const timeoutId = setTimeout(saveData, 800);
    return () => clearTimeout(timeoutId);
  }, [appState, currentMonthKey, isLoading]);

  const calculateCurrentIncome = (data: MonthlyData) => {
     const { salary } = data;
     const ot = calculateOvertime(salary.basicSalary, salary.housingAllowance, salary.overtimeHours);
     const bonus = calculateBonus(salary.basicSalary, salary.housingAllowance, salary.bonusMultiplier);
     const gross = calculateGrossIncome(salary.basicSalary, salary.housingAllowance, salary.shiftAllowance, ot, bonus, salary.thr, salary.leavePay);
     return gross - calculateTax(gross, salary.taxRate) - salary.otherDeductions;
  };
  const currentNetIncome = calculateCurrentIncome(currentData);

  useEffect(() => {
    if (!isLoading && !appState[currentMonthKey]) {
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
  }, [currentMonthKey, isLoading]);

  const initializeMonth = (copyFromPrev: boolean) => {
    let newData: MonthlyData;
    if (copyFromPrev && prevMonthKey && appState[prevMonthKey]) {
      newData = JSON.parse(JSON.stringify(appState[prevMonthKey]));
      if (newData.budget.needs) newData.budget.needs.items.forEach(i => i.actual = 0);
      if (newData.budget.savings) newData.budget.savings.items.forEach(i => i.actual = 0);
      if (newData.budget.debt) newData.budget.debt.items.forEach(i => i.actual = 0);
      if (newData.budget.others) newData.budget.others.items.forEach(i => i.actual = 0);
      if (newData.budget.custom) newData.budget.custom.forEach(cat => cat.items.forEach(i => i.actual = 0));
      newData.salary.overtimeHours = 0;
      newData.salary.bonusMultiplier = 0;
      newData.salary.thr = 0;
      newData.salary.leavePay = 0;
    } else {
      newData = { salary: { ...DEFAULT_SALARY }, budget: { ...DEFAULT_BUDGET }, investments: [] };
    }
    setAppState(prev => ({ ...prev, [currentMonthKey]: newData }));
    setShowCopyModal(false);
  };

  const updateCurrentData = (newData: Partial<MonthlyData>) => {
    setAppState(prev => {
      const existing = prev[currentMonthKey] || { 
        salary: { ...DEFAULT_SALARY }, 
        budget: { ...DEFAULT_BUDGET }, 
        investments: [] 
      };
      // Menjamin referensi objek baru untuk mendeteksi penghapusan item di level mana pun
      const updatedMonth = { ...existing, ...newData };
      return { 
        ...prev, 
        [currentMonthKey]: updatedMonth 
      };
    });
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#0f172a]"><Loader2 className="w-10 h-10 text-indigo-400 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0f172a] font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <nav className="sticky top-0 z-50 pt-2 px-2 sm:pt-4 sm:px-6">
        <div className="max-w-7xl mx-auto glass-panel rounded-xl sm:rounded-2xl shadow-xl border border-white/5">
          <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:px-6 sm:h-20 gap-3">
            <div className="flex items-center justify-between w-full sm:w-auto">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2 rounded-lg shadow-lg">
                     <Wallet className="text-white h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h1 className="text-sm sm:text-xl font-black text-white uppercase tracking-tight leading-tight">ANIQ SUSILO - FINANCE MONTHLY</h1>
                  </div>
                </div>
                <div className="flex sm:hidden items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                   <button onClick={() => changeMonth(-1)} className="p-1.5"><ChevronLeft size={16} /></button>
                   <div className="px-2 font-mono font-black text-indigo-400 text-xs uppercase">
                     {currentDate.toLocaleString('id-ID', { month: 'short', year: '2-digit' })}
                   </div>
                   <button onClick={() => changeMonth(1)} className="p-1.5"><ChevronRight size={16} /></button>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  {saveStatus === 'saving' ? <Loader2 size={14} className="animate-spin text-indigo-400" /> : saveStatus === 'saved' ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Cloud size={12} className="text-slate-500"/>}
                  <span className="text-[10px] font-black uppercase text-slate-400">{saveStatus === 'saving' ? 'Saving' : saveStatus === 'saved' ? 'Saved' : 'Synced'}</span>
                </div>
                <div className="hidden sm:flex items-center bg-slate-800/80 rounded-xl p-1.5 border border-slate-700 shadow-sm">
                  <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"><ChevronLeft size={20} /></button>
                  <div className="px-6 font-mono font-black text-indigo-400 w-48 text-center text-sm uppercase tracking-wider">
                    {currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()}
                  </div>
                  <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"><ChevronRight size={20} /></button>
                </div>
            </div>
          </div>
          <div className="border-t border-slate-700/50 px-2 overflow-x-auto scrollbar-hide">
            <div className="flex space-x-1 py-1.5 sm:py-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 text-xs font-black rounded-lg transition-all flex-1 justify-center sm:flex-none uppercase tracking-widest ${isActive ? 'text-white bg-indigo-600 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                    <Icon size={16} />{tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24">
        {activeTab === 'salary' && <SalarySlip data={currentData.salary} onChange={(s) => updateCurrentData({ salary: s })} />}
        {activeTab === 'budget' && <Budget income={currentNetIncome} data={currentData.budget} onChange={(b) => updateCurrentData({ budget: b })} />}
        {activeTab === 'charts' && <MonthlyCharts budgetData={currentData.budget} income={currentNetIncome} />}
        {activeTab === 'invest' && <Investments items={currentData.investments} onChange={(i) => updateCurrentData({ investments: i })} />}
        {activeTab === 'year' && <YearlySummary appState={appState} year={currentDate.getFullYear()} />}
      </main>
      {showCopyModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
           <div className="bg-slate-900 p-8 rounded-3xl max-w-md w-full border border-slate-800 shadow-2xl">
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Bulan Baru</h3>
              <p className="text-slate-400 mb-8 font-black">Data bulan ini belum ada. Salin template dari bulan sebelumnya?</p>
              <div className="flex gap-4">
                <button onClick={() => initializeMonth(true)} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg">Salin</button>
                <button onClick={() => initializeMonth(false)} className="flex-1 bg-slate-800 text-slate-200 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-slate-700 transition-all">Baru</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
