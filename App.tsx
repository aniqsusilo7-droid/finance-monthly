import React, { useState, useEffect } from 'react';
import { AppState, MonthlyData, DEFAULT_SALARY, DEFAULT_BUDGET } from './types';
import SalarySlip from './components/SalarySlip';
import Budget from './components/Budget';
import MonthlyCharts from './components/MonthlyCharts';
import Investments from './components/Investments';
import YearlySummary from './components/YearlySummary';
import AIAnalysis from './components/AIAnalysis';
import Login from './components/Login';
import { calculateGrossIncome, calculateTax, calculateOvertime, calculateBonus } from './utils';
import { Wallet, LayoutDashboard, PieChart, TrendingUp, Calendar, ChevronLeft, ChevronRight, Cloud, Loader2, CheckCircle2, Sparkles, Sun, Moon, LogOut } from 'lucide-react';
import { supabase } from './supabaseClient';

const TABS = [
  { id: 'salary', label: 'Gaji', icon: Wallet },
  { id: 'budget', label: 'Anggaran', icon: LayoutDashboard },
  { id: 'charts', label: 'Grafik', icon: PieChart },
  { id: 'invest', label: 'Aset', icon: TrendingUp },
  { id: 'year', label: 'Tahun', icon: Calendar },
  { id: 'ai', label: 'AI', icon: Sparkles },
];

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('salary');
  const [appState, setAppState] = useState<AppState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('is_authenticated') === 'true';
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app-theme') as 'dark' | 'light') || 'dark';
  });

  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const currentData: MonthlyData = appState[currentMonthKey] || {
    salary: { ...DEFAULT_SALARY },
    budget: { ...DEFAULT_BUDGET },
    investments: []
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  
  const handleLogout = () => {
    localStorage.removeItem('is_authenticated');
    setAppState({});
    setActiveTab('salary');
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
     const ot = calculateOvertime(salary.basicSalary, salary.housingAllowance, salary.overtimeHours);
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
        investments: [] 
      };
      return { ...prev, [currentMonthKey]: { ...existing, ...newData } };
    });
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  if (!isAuthenticated) {
    return <Login onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-500/30 theme-transition pb-20 sm:pb-8">
      {/* Sticky Header Optimized for Mobile */}
      <nav className="sticky top-0 z-50 pt-1 sm:pt-4 px-1 sm:px-6">
        <div className="max-w-7xl mx-auto glass-panel rounded-xl sm:rounded-2xl shadow-xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between p-2 sm:px-6 sm:h-20 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 text-left min-w-0 flex-1">
              <div className="bg-indigo-600 p-1.5 sm:p-2 rounded-lg shadow-lg shrink-0">
                 <Wallet className="text-white h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-[10px] sm:text-xl font-black text-white uppercase tracking-tight leading-none truncate">ANIQ SUSILO</h1>
                <p className="text-[7px] sm:text-xs font-black text-indigo-400 uppercase tracking-widest mt-0.5 truncate">FINANCE MONTHLY</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
                {/* Save Status - Icon Only on Mobile */}
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

                {/* Month Navigator */}
                <div className="flex items-center bg-slate-800/80 rounded-lg sm:rounded-xl p-1 border border-slate-700 shadow-sm">
                  <button onClick={() => changeMonth(-1)} className="p-1 sm:p-2 hover:bg-slate-700 rounded-lg text-slate-400"><ChevronLeft size={14} className="sm:size-5" /></button>
                  <div className="px-1.5 sm:px-4 font-mono font-black text-indigo-400 text-[9px] sm:text-sm uppercase tracking-wider text-center min-w-[50px] sm:min-w-[100px]">
                    {currentDate.toLocaleString('id-ID', { month: 'short', year: '2-digit' }).toUpperCase()}
                  </div>
                  <button onClick={() => changeMonth(1)} className="p-1 sm:p-2 hover:bg-slate-700 rounded-lg text-slate-400"><ChevronRight size={14} className="sm:size-5" /></button>
                </div>

                <div className="flex items-center gap-1">
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

          {/* Tab Navigation */}
          <div className="border-t border-slate-700/50 px-1 overflow-x-auto scrollbar-hide">
            <div className="flex space-x-0.5 py-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)} 
                    className={`flex items-center gap-1 px-3 py-2 text-[9px] sm:text-xs font-black rounded-lg transition-all shrink-0 uppercase tracking-widest ${isActive ? 'text-white bg-indigo-600 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  >
                    <Icon size={12} className="sm:size-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="animate-fadeIn">
          {activeTab === 'salary' && <SalarySlip data={currentData.salary} onChange={(s) => updateCurrentData({ salary: s })} />}
          {activeTab === 'budget' && <Budget income={currentNetIncome} data={currentData.budget} onChange={(b) => updateCurrentData({ budget: b })} />}
          {activeTab === 'charts' && <MonthlyCharts budgetData={currentData.budget} income={currentNetIncome} />}
          {activeTab === 'invest' && <Investments items={currentData.investments} onChange={(i) => updateCurrentData({ investments: i })} />}
          {activeTab === 'year' && <YearlySummary appState={appState} year={currentDate.getFullYear()} />}
          {activeTab === 'ai' && <AIAnalysis currentMonthData={currentData} netIncome={currentNetIncome} />}
        </div>
      </main>
    </div>
  );
};

export default App;