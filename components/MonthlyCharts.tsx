import React, { useMemo } from 'react';
import { BudgetData, AppState } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts';
import { formatRupiah, calculateGrossIncome, calculateTax } from '../utils';
import { AlertTriangle, TrendingUp, Clock, Wallet, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';

interface MonthlyChartsProps {
  budgetData: BudgetData;
  appState: AppState;
  income: number;
  isPrivacy?: boolean;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  'Pokok': '#6366f1',     
  'Tabungan': '#10b981',  
  'Cicilan': '#f43f5e',   
  'Lainnya': '#8b5cf6',   
};

const EXTRA_COLORS = [
  '#f59e0b', '#06b6d4', '#ec4899', '#14b8a6', '#f97316'
];

const chunkArray = (arr: any[], size: number) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const MonthlyCharts: React.FC<MonthlyChartsProps> = ({ budgetData, appState, income, isPrivacy = false }) => {
  const currentYear = new Date().getFullYear();

  const trendData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthKey = `${currentYear}-${String(monthNum).padStart(2, '0')}`;
      const data = appState[monthKey];

      if (!data) {
        return {
          month: new Date(currentYear, i).toLocaleString('id-ID', { month: 'short' }),
          salary: 0,
          overtime: 0
        };
      }

      const { salary } = data;
      const otRupiah = ((salary.basicSalary + salary.housingAllowance) / 173) * salary.overtimeHours;
      const bonusRupiah = (salary.basicSalary + salary.housingAllowance) * salary.bonusMultiplier;
      const gross = calculateGrossIncome(
        salary.basicSalary, 
        salary.housingAllowance, 
        salary.shiftAllowance, 
        otRupiah, 
        bonusRupiah, 
        salary.thr, 
        salary.leavePay
      );
      const tax = calculateTax(gross, salary.taxRate);
      const netIncome = gross - tax - salary.otherDeductions;

      return {
        month: new Date(currentYear, i).toLocaleString('id-ID', { month: 'short' }),
        salary: netIncome,
        overtime: salary.overtimeHours
      };
    });
  }, [appState, currentYear]);

  const categories: { name: string, Anggaran: number, Aktual: number, isOver: boolean, color: string }[] = [];

  const addCategory = (name: string, budget: number, actual: number, defaultColor: string) => {
    if (budget > 0 || actual > 0) {
      categories.push({
        name,
        Anggaran: budget,
        Aktual: actual,
        isOver: actual > budget,
        color: defaultColor
      });
    }
  };

  addCategory(
    budgetData.needs?.name || 'Pokok', 
    (budgetData.needs?.limit !== undefined && budgetData.needs.limit > 0) ? budgetData.needs.limit : (budgetData.needs?.items?.reduce((a, b) => a + (b.budget || 0), 0) || 0), 
    budgetData.needs?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0, 
    CATEGORY_COLORS['Pokok']
  );
  addCategory(
    budgetData.savings?.name || 'Tabungan', 
    (budgetData.savings?.limit !== undefined && budgetData.savings.limit > 0) ? budgetData.savings.limit : (budgetData.savings?.items?.reduce((a, b) => a + (b.budget || 0), 0) || 0), 
    budgetData.savings?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0, 
    CATEGORY_COLORS['Tabungan']
  );
  addCategory(
    budgetData.debt?.name || 'Cicilan', 
    (budgetData.debt?.limit !== undefined && budgetData.debt.limit > 0) ? budgetData.debt.limit : (budgetData.debt?.items?.reduce((a, b) => a + (b.budget || 0), 0) || 0), 
    budgetData.debt?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0, 
    CATEGORY_COLORS['Cicilan']
  );

  budgetData.custom?.forEach((cat, idx) => {
    const catBudget = (cat.limit !== undefined && cat.limit > 0) 
      ? cat.limit 
      : (cat.items?.reduce((a, b) => a + (b.budget || 0), 0) || 0);
    addCategory(cat.name || 'Custom', catBudget, cat.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0, EXTRA_COLORS[idx % EXTRA_COLORS.length]);
  });

  addCategory('Lainnya', budgetData.others?.allocation || 0, budgetData.others?.items?.reduce((a, b) => a + (b.actual || 0), 0) || 0, CATEGORY_COLORS['Lainnya']);

  const categoryChunks = chunkArray(categories, 4);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && Array.isArray(payload) && payload.length) {
      const budgetVal = payload.find?.((p: any) => p.name === 'Rencana' || p.name === 'Anggaran')?.value || 0;
      const actualVal = payload.find?.((p: any) => p.name === 'Aktual')?.value || 0;
      const isOver = actualVal > budgetVal && budgetVal > 0;

      return (
        <div className="bg-slate-900/95 border border-white/10 p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl min-w-[170px]">
          <p className="font-bold text-white text-xs uppercase mb-2 border-b border-white/10 pb-1.5">{label || payload[0]?.name}</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-slate-300 text-[10px] font-bold uppercase">{entry.name}</span>
                </div>
                <span className={`font-mono text-xs font-bold ${entry.name === 'Aktual' && isOver ? 'text-rose-400' : 'text-white'}`}>
                  {formatRupiah(entry.value, isPrivacy)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 18;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="#94a3b8" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central" 
        fontSize={10} 
        fontWeight="800"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const yAxisFormatter = (val: number) => {
    if (isPrivacy) return 'Rp •••';
    if (val === 0) return 'Rp 0';
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}jt`;
    return `Rp ${(val / 1000).toFixed(0)}rb`;
  };

  const RenderLegend = ({ data }: { data: any[] }) => (
    <div className="mt-6 flex flex-wrap justify-center gap-2 px-2">
      {data.map((item, idx) => {
        return (
          <div key={idx} className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/5 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || item.fill }}></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              {item.name}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* Main Budget Performance Bar Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl overflow-hidden relative"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
           <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">Kinerja Anggaran Bulanan</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perbandingan Batas Rencana vs Realisasi Belanja</p>
              </div>
           </div>
           <div className="flex items-center gap-3 bg-slate-900/60 px-3.5 py-2 rounded-2xl border border-white/5">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Rencana</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Aktual</span>
              </div>
           </div>
        </div>
        
        <div className="space-y-10">
          {categoryChunks.map((chunk, chunkIdx) => (
            <div key={chunkIdx} className="h-[400px] sm:h-[350px] w-full border-b border-white/5 pb-8 last:border-0 last:pb-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chunk} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <defs>
                    <linearGradient id={`planGrad-${chunkIdx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#d97706" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id={`actualGrad-${chunkIdx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#059669" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id={`overGrad-${chunkIdx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#e11d48" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{fontWeight: 700, fill: '#94a3b8'}} 
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    width={65} 
                    tickFormatter={yAxisFormatter} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{fontWeight: 700, fill: '#94a3b8'}}
                  />
                  <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{fill: 'rgba(255,255,255,0.03)'}} 
                  />
                  <Bar dataKey="Anggaran" name="Rencana" fill={`url(#planGrad-${chunkIdx})`} radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="Aktual" name="Aktual" radius={[6, 6, 0, 0]} maxBarSize={32}>
                    {chunk.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.isOver ? `url(#overGrad-${chunkIdx})` : `url(#actualGrad-${chunkIdx})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col items-center shadow-xl"
        >
           <div className="w-full flex items-center justify-between mb-6 border-b border-white/10 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Rencana Alokasi (%)</h3>
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Berdasarkan Budget</span>
           </div>
           <div className="h-[320px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={categories.filter(c => c.Anggaran > 0)} 
                    cx="50%" cy="50%" 
                    innerRadius={65} 
                    outerRadius={95} 
                    dataKey="Anggaran" 
                    stroke="rgba(15,23,42,0.8)" 
                    strokeWidth={3} 
                    paddingAngle={4}
                    labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                    label={renderCustomLabel}
                  >
                    {categories.filter(c => c.Anggaran > 0).map((entry, index) => <Cell key={`p1-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
             </ResponsiveContainer>
           </div>
           <RenderLegend data={categories.filter(c => c.Anggaran > 0)} />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col items-center shadow-xl"
        >
           <div className="w-full flex items-center justify-between mb-6 border-b border-white/10 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Realisasi Pengeluaran (%)</h3>
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Berdasarkan Aktual</span>
           </div>
           <div className="h-[320px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={categories.filter(c => c.Aktual > 0)} 
                    cx="50%" cy="50%" 
                    innerRadius={65} 
                    outerRadius={95} 
                    dataKey="Aktual" 
                    stroke="rgba(15,23,42,0.8)" 
                    strokeWidth={3} 
                    paddingAngle={4}
                    labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                    label={renderCustomLabel}
                  >
                    {categories.filter(c => c.Aktual > 0).map((entry, index) => <Cell key={`p2-${index}`} fill={entry.isOver ? '#f43f5e' : entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
             </ResponsiveContainer>
           </div>
           <RenderLegend 
            data={categories.filter(c => c.Aktual > 0).map(cat => ({...cat, color: cat.isOver ? '#f43f5e' : cat.color}))} 
           />
        </motion.div>
      </div>

      {/* Yearly Trends Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Gaji Bulanan */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col relative overflow-hidden shadow-xl"
        >
           <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <div className="p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                 <Wallet size={18} />
              </div>
              <div>
                 <h3 className="text-xs font-bold text-white uppercase tracking-wider">Tren Gaji Bersih</h3>
                 <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Estimasi pergerakan pendapatan 12 bulan ({currentYear})</p>
              </div>
           </div>
           
           <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tick={{fontWeight: 700, fill: '#94a3b8'}} />
                  <YAxis stroke="#64748b" fontSize={10} tickFormatter={yAxisFormatter} tickLine={false} axisLine={false} tick={{fontWeight: 700, fill: '#94a3b8'}} width={65} />
                  <Tooltip 
                    formatter={(v:any) => formatRupiah(v, isPrivacy)}
                    contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', backdropFilter: 'blur(12px)'}}
                    itemStyle={{ color: '#fff', fontWeight: '700', fontSize: '11px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="salary" name="Gaji Bersih" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSalary)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </motion.div>

        {/* Trend Jam Lembur Bulanan */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col relative overflow-hidden shadow-xl"
        >
           <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <div className="p-2.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400">
                 <Clock size={18} />
              </div>
              <div>
                 <h3 className="text-xs font-bold text-white uppercase tracking-wider">Tren Jam Lembur</h3>
                 <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Jam Eqv dalam setahun ({currentYear})</p>
              </div>
           </div>
           
           <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tick={{fontWeight: 700, fill: '#94a3b8'}} />
                  <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `${val}j`} tickLine={false} axisLine={false} tick={{fontWeight: 700, fill: '#94a3b8'}} width={50} />
                  <Tooltip 
                    formatter={(v:any) => [`${v.toFixed(1)} Jam`, 'Lembur']}
                    contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', backdropFilter: 'blur(12px)'}}
                    itemStyle={{ color: '#fff', fontWeight: '700', fontSize: '11px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}
                  />
                  <Bar dataKey="overtime" name="Lembur" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={22} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MonthlyCharts;